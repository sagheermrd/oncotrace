import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCaseDto } from './dto/create-case.dto.js';
import { AuthenticatedUser } from '../auth/dev-auth.guard.js';
import { ListCaseQueryDto } from './dto/list-cases-query.dto.ts';

type CaseCursor = {
  createdAt: string;
  id: string;
};

function encodeCursor(cursor: CaseCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString('base64url');
}

function decodeCursor(cursor: string): CaseCursor {
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf-8'));
  } catch (error) {
    throw new BadRequestException('Invalid pagination cursor');
  }
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    !('createdAt' in decoded) ||
    !('id' in decoded) ||
    typeof decoded.createdAt !== 'string' ||
    typeof decoded.id !== 'string' ||
    !Number.isFinite(Date.parse(decoded.createdAt)) ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      decoded.id,
    )
  ) {
    throw new BadRequestException('Invalid pagination cursor');
  }

  return {
    createdAt: new Date(decoded.createdAt).toISOString(),
    id: decoded.id,
  };
}

@Injectable()
export class CasesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertMembership(user: AuthenticatedUser) {
    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: {
          organizationId: user.organizationId,
          userId: user.userId,
        },
      },
    });
    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }
    return membership;
  }

  async createCase(user: AuthenticatedUser, createCaseDto: CreateCaseDto) {
    await this.assertMembership(user);
    try {
      const newCase = await this.prisma.researchCase.create({
        data: {
          name: createCaseDto.name,
          description: createCaseDto.description,
          externalReference: createCaseDto.externalReference,
          organizationId: user.organizationId,
          createdByUserId: user.userId,
        },
        select: {
          id: true,
          name: true,
          description: true,
          externalReference: true,
          organizationId: true,
          createdByUserId: true,
        },
      });
      return newCase;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A case with this name already exists');
      }
      throw error;
    }
  }

  async findAllCases(user: AuthenticatedUser, query: ListCaseQueryDto) {
    await this.assertMembership(user);
    const limit = query.limit ?? 20;

    const cursor = query.cursor ? decodeCursor(query.cursor) : undefined;
    const where = {
      organizationId: user.organizationId,
      ...(cursor && {
        OR: [
          { createdAt: { lt: new Date(cursor.createdAt) } },
          { createdAt: new Date(cursor.createdAt), id: { lt: cursor.id } },
        ],
      }),
    };
    const rows = await this.prisma.researchCase.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: limit + 1,
      select: {
        id: true,
        name: true,
        description: true,
        externalReference: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const hasNextPage = rows.length > limit;
    const items = rows.slice(0, limit);
    const lastItem = items.at(-1);

    return {
      items,
      pageInfo: {
        limit,
        hasNextPage,
        nextCursor:
          hasNextPage && lastItem
            ? encodeCursor({
                createdAt: lastItem.createdAt.toISOString(),
                id: lastItem.id,
              })
            : null,
      },
    };
  }

  async findCaseById(user: AuthenticatedUser, caseId: string) {
    await this.assertMembership(user);
    const researchCase = await this.prisma.researchCase.findUnique({
      where: {
        id: caseId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        externalReference: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!researchCase) {
      throw new NotFoundException('Case not found');
    }
    return researchCase;
  }
}
