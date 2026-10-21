import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateCaseDto } from './dto/create-case.dto.js';
import { AuthenticatedUser } from '../auth/dev-auth.guard.js';

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

  async findAllCases(user: AuthenticatedUser) {
    await this.assertMembership(user);
    const cases = await this.prisma.researchCase.findMany({
      where: {
        organizationId: user.organizationId,
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      take: 20,
      select: {
        id: true,
        name: true,
        description: true,
        externalReference: true,
        organizationId: true,
        createdByUserId: true,
      },
    });
    return {
      cases,
      pageInfo: {
        nextCursor: null,
        hasNextPage: false,
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
