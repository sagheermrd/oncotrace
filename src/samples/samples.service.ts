import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import { CreateSampleDto } from './dto/create-sample.dto.js';
import { ListSamplesQueryDto } from './dto/list-samples-query.dto.js';

interface SampleCursor {
  id: string;
  createdAt: string;
}

@Injectable()
export class SamplesService {
  constructor(private readonly prisma: PrismaService) {}

  private decodeCursor(cursor: string): SampleCursor {
    try {
      const decoded = JSON.parse(
        Buffer.from(cursor, 'base64url').toString('utf8'),
      ) as Partial<SampleCursor>;

      if (
        typeof decoded.createdAt !== 'string' ||
        Number.isNaN(Date.parse(decoded.createdAt)) ||
        typeof decoded.id !== 'string' ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          decoded.id,
        )
      ) {
        throw new Error('Invalid cursor payload');
      }
      return {
        createdAt: new Date(decoded.createdAt).toISOString(),
        id: decoded.id,
      };
    } catch (error) {
      throw new BadRequestException('Invalid cursor format');
    }
  }

  private encodeCursor(cursor: SampleCursor): string {
    return Buffer.from(JSON.stringify(cursor)).toString('base64url');
  }

  private async assertMembership(userId: string, organizationId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      select: {
        id: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'User is not a member of the specified organization',
      );
    }
  }

  private async assertCaseAccess(organizationId: string, caseId: string) {
    const caseRecord = await this.prisma.researchCase.findFirst({
      where: { id: caseId, organizationId: organizationId },
      select: {
        organizationId: true,
      },
    });
    if (!caseRecord) {
      throw new NotFoundException('Case not found');
    }
  }

  async createSample(
    organizationId: string,
    userId: string,
    caseId: string,
    createSampleDto: CreateSampleDto,
  ) {
    await this.assertCaseAccess(organizationId, caseId);
    await this.assertMembership(userId, organizationId);

    try {
      const sample = await this.prisma.sample.create({
        data: {
          externalId: createSampleDto.externalId,
          sampleType: createSampleDto.sampleType,
          organizationId,
          caseId,
        },
      });
      return sample;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'A sample with this external ID already exists in this case',
        );
      }
      throw error;
    }
  }

  async findAllSamples(
    organizationId: string,
    userId: string,
    caseId: string,
    query: ListSamplesQueryDto,
  ) {
    await this.assertMembership(userId, organizationId);
    await this.assertCaseAccess(organizationId, caseId);

    const limit = query.limit ? query.limit : 20;
    const cursor = query.cursor ? this.decodeCursor(query.cursor) : undefined;

    const samples = await this.prisma.sample.findMany({
      where: {
        organizationId,
        caseId,
        ...(cursor
          ? {
              OR: [
                { createdAt: { lt: cursor.createdAt } },
                {
                  createdAt: new Date(cursor.createdAt),
                  id: { lt: cursor.id },
                },
              ],
            }
          : {}),
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1, // Fetch one extra to determine if there's a next page
    });

    const hasNextPage = samples.length > limit;
    const items = hasNextPage ? samples.slice(0, limit) : samples;
    const lastItem = items[items.length - 1];

    return {
      items,
      pages: {
        limit: limit,
        hasNextPage: hasNextPage,
        nextCursor:
          hasNextPage && lastItem
            ? this.encodeCursor({
                id: lastItem.id,
                createdAt: lastItem.createdAt.toISOString(),
              })
            : null,
      },
    };
  }

  async findSampleById(
    organizationId: string,
    userId: string,
    caseId: string,
    sampleId: string,
  ) {
    await this.assertMembership(userId, organizationId);
    await this.assertCaseAccess(organizationId, caseId);

    const sample = await this.prisma.sample.findFirst({
      where: { id: sampleId, organizationId, caseId },
      include: {
        inputFiles: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!sample) {
      throw new NotFoundException('Sample not found');
    }

    return {
      id: sample.id,
      organizationId: sample.organizationId,
      caseId: sample.caseId,
      externalId: sample.externalId,
      sampleType: sample.sampleType,
      status: sample.status,
      createdAt: sample.createdAt,
      updatedAt: sample.updatedAt,
      inputFiles: sample.inputFiles.map((file) => ({
        id: file.id,
        fileName: file.fileName,
        fileType: file.fileType,
        sizeBytes: file.sizeBytes?.toString() ?? null,
        status: file.status,
        createdAt: file.createdAt,
      })),
    };
  }
}
