import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { randomUUID } from 'node:crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateInputFileDto } from './dto/create-input-file.dto.js';
import { Prisma } from '../generated/prisma/client.ts';

type InputFileRecord = Prisma.InputFileGetPayload<{}>;

@Injectable()
export class InputFilesService {
  constructor(private readonly prisma: PrismaService) {}

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

  private toResponseDto(inputFile: InputFileRecord) {
    return {
      id: inputFile.id,
      fileName: inputFile.fileName,
      fileType: inputFile.fileType,
      sizeBytes: inputFile.sizeBytes?.toString() ?? null,
      checksumSha256: inputFile.checksumSha256,
      status: inputFile.status,
      createdAt: inputFile.createdAt,
      updatedAt: inputFile.updatedAt,
    };
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

    if (dto.sizeBytes !== undefined) {
      const size = BigInt(dto.sizeBytes);
      const maxBigInt = 9223372036854775807n;

      if (size > maxBigInt) {
        throw new BadRequestException(
          'sizeBytes exceeds the maximum supported file size',
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
        sizeBytes:
          dto.sizeBytes !== undefined && dto.sizeBytes !== null
            ? BigInt(dto.sizeBytes)
            : null,
        checksumSha256: dto.checksumSha256?.toLowerCase() ?? null,
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
