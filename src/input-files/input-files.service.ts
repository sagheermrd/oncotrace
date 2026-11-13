import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { InputFileStatus, Prisma } from '../generated/prisma/client.js';
import { OBJECT_STORAGE } from '../storage/storage.constants.js';
import type { ObjectStorage } from '../storage/interfaces/object-storage.interface.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-request.js';

import storageConfig from '../config/storage.config.js';
import type { ConfigType } from '@nestjs/config';

import {
  defaultContentType,
  isAllowedContentType,
} from './input-file-content-types.js';
import { randomUUID } from 'crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInputFileDto } from './dto/create-input-file.dto.js';

type InputFileRecord = Prisma.InputFileGetPayload<{}>;

@Injectable()
export class InputFilesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(OBJECT_STORAGE)
    private readonly objectStorage: ObjectStorage,
    @Inject(storageConfig.KEY)
    private readonly storageConfiguration: ConfigType<typeof storageConfig>,
  ) {}

  private async assertMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'User does not have access to the specified organization.',
      );
    }
  }

  private async assertSampleAccess(
    organizationId: string,
    caseId: string,
    sampleId: string,
  ) {
    const sample = await this.prisma.sample.findFirst({
      where: { id: sampleId, caseId, organizationId },
      select: { id: true },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found or not accessible.');
    }
  }

  private toResponseDto(file: InputFileRecord) {
    return {
      id: file.id,
      fileName: file.fileName,
      fileType: file.fileType,

      expectedSizeBytes: file.expectedSizeBytes?.toString() ?? null,

      expectedChecksumSha256: file.expectedChecksumSha256,

      actualSizeBytes: file.actualSizeBytes?.toString() ?? null,

      actualChecksumSha256: file.actualChecksumSha256,

      verifiedAt: file.verifiedAt,
      failureReason: file.failureReason,

      status: file.status,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
    };
  }

  async createUploadUrl(
    inputFileId: string,
    user: AuthenticatedUser,
    requestedContentType?: string,
  ) {
    await this.assertMembership(user.userId, user.organizationId);

    const inputFile = await this.prisma.inputFile.findUnique({
      where: { id: inputFileId, organizationId: user.organizationId },
    });

    if (!inputFile) {
      throw new NotFoundException('Input file not found');
    }

    const contentType =
      requestedContentType ?? defaultContentType(inputFile.fileType);

    if (!isAllowedContentType(inputFile.fileType, contentType)) {
      throw new BadRequestException(
        `Content type ${contentType} is not allowed for ${inputFile.fileType}`,
      );
    }

    const expiresInSeconds =
      this.storageConfiguration.UploadUrlExpirationSeconds;
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    // Atomically claim the file for uploading and create a session.
    const uploadFileSession = await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.inputFile.updateMany({
        where: {
          id: inputFileId,
          organizationId: user.organizationId,
          status: { in: [InputFileStatus.REGISTERED, InputFileStatus.FAILED] },
        },
        data: {
          status: InputFileStatus.UPLOADING,
          failureReason: null,
        },
      });
      if (claimed.count !== 1) {
        throw new ConflictException(
          'This input file is already uploading or cannot be uploaded in its current state',
        );
      }
      return tx.uploadSession.create({
        data: {
          organizationId: user.organizationId,
          inputFileId: inputFile.id,
          expiresAt,
        },
      });
    });

    if (!uploadFileSession) {
      throw new ConflictException(
        'Input file is already being uploaded or has been uploaded.',
      );
    }
    // Generate a URL for the backend-owned storage key.
    try {
      const uploadUrl = await this.objectStorage.createPresignedUploadUrl({
        key: inputFile.storageKey,
        expiresInSeconds,
        contentType,
      });

      return {
        uploadSessionId: uploadFileSession.id,
        uploadUrl,
        method: 'PUT' as const,
        expiresAt,
        requiredHeaders: {
          'Content-Type': contentType,
        },
      };
    } catch (error) {
      // The session exists but signing failed. Mark it failed.
      await this.prisma.$transaction([
        this.prisma.uploadSession.update({
          where: { id: uploadFileSession.id },
          data: { status: 'FAILED' },
        }),
        this.prisma.inputFile.updateMany({
          where: {
            id: inputFile.id,
            organizationId: user.organizationId,
            status: InputFileStatus.UPLOADING,
          },
          data: {
            status: InputFileStatus.FAILED,
            failureReason: 'Failed to generate upload URL',
          },
        }),
      ]);

      throw new InternalServerErrorException('Failed to generate upload URL');
    }
  }

  async createInputFile(
    organizationId: string,
    userId: string,
    caseId: string,
    sampleId: string,
    dto: CreateInputFileDto,
  ) {
    await this.assertMembership(userId, organizationId);
    await this.assertSampleAccess(organizationId, caseId, sampleId);

    const storageKey = `organizations/${organizationId}/samples/${sampleId}/input-files/${randomUUID()}`;

    if (dto.expectedSizeBytes !== undefined) {
      const size = BigInt(dto.expectedSizeBytes);
      const maxBigInt = 9223372036854775807n;

      if (size > maxBigInt) {
        throw new BadRequestException(
          'expectedSizeBytes exceeds the maximum supported file size',
        );
      }
    }

    const inputFile = await this.prisma.inputFile.create({
      data: {
        organizationId,
        sampleId,
        storageKey,
        fileName: dto.fileName,
        fileType: dto.fileType,
        expectedSizeBytes:
          dto.expectedSizeBytes !== undefined
            ? BigInt(dto.expectedSizeBytes)
            : null,
        expectedChecksumSha256:
          dto.expectedChecksumSha256?.toLowerCase() ?? null,
      },
    });

    return this.toResponseDto(inputFile);
  }

  async findAllInputFiles(
    organizationId: string,
    userId: string,
    caseId: string,
    sampleId: string,
  ) {
    await this.assertMembership(userId, organizationId);
    await this.assertSampleAccess(organizationId, caseId, sampleId);

    const inputFiles = await this.prisma.inputFile.findMany({
      where: { organizationId, sampleId },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    return inputFiles.map((file) => this.toResponseDto(file));
  }

  async findInputFileById(
    organizationId: string,
    userId: string,
    caseId: string,
    sampleId: string,
    inputFileId: string,
  ) {
    await this.assertMembership(userId, organizationId);
    await this.assertSampleAccess(organizationId, caseId, sampleId);

    const inputFile = await this.prisma.inputFile.findFirst({
      where: { id: inputFileId, organizationId, sampleId },
    });

    if (!inputFile) {
      throw new NotFoundException('Input file not found');
    }

    return this.toResponseDto(inputFile);
  }
}
