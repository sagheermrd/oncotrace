import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CasesService } from './cases.service.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('CasesService authorization', () => {
  let service: CasesService;

  const prismaMock = {
    membership: {
      findUnique: vi.fn(),
    },
    researchCase: {
      findMany: vi.fn(),
    },
  };

  const user = {
    userId: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef = await Test.createTestingModule({
      providers: [
        CasesService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = moduleRef.get(CasesService);
  });

  it('denies access when membership is missing', async () => {
    prismaMock.membership.findUnique.mockResolvedValue(null);

    await expect(
      service.findAllCases(user, { limit: 20 }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaMock.researchCase.findMany).not.toHaveBeenCalled();
  });
});
