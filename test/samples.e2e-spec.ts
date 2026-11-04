import { randomUUID } from 'node:crypto';

import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from 'vitest';

import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { DevAuthGuard } from '../src/auth/dev-auth.guard.ts';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const TEST_ORG_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_ORG_ID = '33333333-3333-4333-8333-333333333333';

const API_PREFIX = '/api/v1';

const testAuthGuard = {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    request.user = {
      userId: TEST_USER_ID,
      organizationId: TEST_ORG_ID,
    };

    return true;
  },
};

describe('Samples API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let caseId: string;
  let foreignCaseId: string | undefined;
  let foreignSampleId: string | undefined;

  async function ensureTestMembership() {
    await prisma.membership.upsert({
      where: {
        organizationId_userId: {
          organizationId: TEST_ORG_ID,
          userId: TEST_USER_ID,
        },
      },
      create: {
        organizationId: TEST_ORG_ID,
        userId: TEST_USER_ID,
        role: 'ANALYST',
      },
      update: {},
    });
  }

  async function createCase(organizationId: string) {
    return prisma.researchCase.create({
      data: {
        name: `Samples E2E ${randomUUID()}`,
        organizationId,
        createdByUserId: TEST_USER_ID,
      },
    });
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(DevAuthGuard)
      .useValue(testAuthGuard)
      .compile();

    app = moduleRef.createNestApplication();

    app.setGlobalPrefix('api/v1');

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // Ensure the organizations exist.
    await prisma.organization.upsert({
      where: { id: TEST_ORG_ID },
      create: {
        id: TEST_ORG_ID,
        name: 'Samples E2E Test Organization',
      },
      update: {},
    });

    await prisma.organization.upsert({
      where: { id: OTHER_ORG_ID },
      create: {
        id: OTHER_ORG_ID,
        name: 'Samples E2E Other Organization',
      },
      update: {},
    });

    // Ensure the authenticated development user exists.
    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      create: {
        id: TEST_USER_ID,
        email: 'samples-e2e@example.test',
        displayName: 'Samples E2E User',
      },
      update: {},
    });

    await ensureTestMembership();
  });

  beforeEach(async () => {
    // Each test gets a separate case.
    const researchCase = await createCase(TEST_ORG_ID);
    caseId = researchCase.id;
  });

  afterEach(async () => {
    // Remove test samples before deleting their cases.
    if (foreignCaseId) {
      await prisma.sample.deleteMany({
        where: {
          organizationId: OTHER_ORG_ID,
          caseId: foreignCaseId,
        },
      });

      await prisma.researchCase.deleteMany({
        where: { id: foreignCaseId },
      });

      foreignCaseId = undefined;
      foreignSampleId = undefined;
    }

    if (caseId) {
      await prisma.sample.deleteMany({
        where: {
          organizationId: TEST_ORG_ID,
          caseId,
        },
      });

      await prisma.researchCase.deleteMany({
        where: { id: caseId },
      });
    }

    // Ensure membership is present for the next test.
    await ensureTestMembership();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cases/:caseId/samples', () => {
    it('creates a sample inside the authenticated organization', async () => {
      const response = await request(app.getHttpServer())
        .post(`${API_PREFIX}/cases/${caseId}/samples`)
        .send({
          externalId: 'SAMPLE-001',
          sampleType: 'TUMOR',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        organizationId: TEST_ORG_ID,
        caseId,
        externalId: 'SAMPLE-001',
        sampleType: 'TUMOR',
        status: 'REGISTERED',
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();

      // The server, not the client, determines tenant ownership.
      expect(response.body.organizationId).toBe(TEST_ORG_ID);
    });

    it('rejects duplicate external IDs within the same case', async () => {
      const payload = {
        externalId: 'DUPLICATE-SAMPLE',
        sampleType: 'TUMOR',
      };

      await request(app.getHttpServer())
        .post(`${API_PREFIX}/cases/${caseId}/samples`)
        .send(payload)
        .expect(201);

      await request(app.getHttpServer())
        .post(`${API_PREFIX}/cases/${caseId}/samples`)
        .send(payload)
        .expect(409);
    });

    it('rejects unknown properties in the request body', async () => {
      await request(app.getHttpServer())
        .post(`${API_PREFIX}/cases/${caseId}/samples`)
        .send({
          externalId: 'SAMPLE-UNKNOWN-PROPERTY',
          sampleType: 'TUMOR',
          organizationId: OTHER_ORG_ID,
          status: 'READY',
        })
        .expect(400);
    });
  });

  describe('Tenant isolation', () => {
    it('does not expose another organization’s case or samples', async () => {
      const foreignCase = await createCase(OTHER_ORG_ID);
      foreignCaseId = foreignCase.id;

      const foreignSample = await prisma.sample.create({
        data: {
          organizationId: OTHER_ORG_ID,
          caseId: foreignCase.id,
          externalId: 'FOREIGN-SAMPLE-001',
          sampleType: 'TUMOR',
        },
      });

      foreignSampleId = foreignSample.id;

      // A foreign case must not be accessible through the current tenant.
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${foreignCase.id}/samples`)
        .expect(404);

      // A foreign sample must not be accessible under the current case.
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${caseId}/samples/${foreignSample.id}`)
        .expect(404);
    });
  });

  describe('GET /cases/:caseId/samples', () => {
    it('returns samples using cursor pagination without duplicates or omissions', async () => {
      const externalIds = [
        'PAGE-SAMPLE-001',
        'PAGE-SAMPLE-002',
        'PAGE-SAMPLE-003',
      ];

      for (const externalId of externalIds) {
        await request(app.getHttpServer())
          .post(`${API_PREFIX}/cases/${caseId}/samples`)
          .send({
            externalId,
            sampleType: 'TUMOR',
          })
          .expect(201);
      }

      const firstPage = await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${caseId}/samples`)
        .query({ limit: 2 })
        .expect(200);

      expect(firstPage.body.items).toHaveLength(2);
      expect(firstPage.body.pageInfo).toMatchObject({
        limit: 2,
        hasNextPage: true,
      });
      expect(firstPage.body.pageInfo.nextCursor).toEqual(expect.any(String));

      const secondPage = await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${caseId}/samples`)
        .query({
          limit: 2,
          cursor: firstPage.body.pageInfo.nextCursor,
        })
        .expect(200);

      expect(secondPage.body.items).toHaveLength(1);
      expect(secondPage.body.pageInfo.hasNextPage).toBe(false);
      expect(secondPage.body.pageInfo.nextCursor).toBeNull();

      const allItems = [...firstPage.body.items, ...secondPage.body.items];

      const allIds = allItems.map((item: { id: string }) => item.id);

      // No duplicate records across pages.
      expect(new Set(allIds).size).toBe(3);

      // No missing records.
      expect(allItems).toHaveLength(3);

      // Every item belongs to this case and tenant.
      for (const item of allItems) {
        expect(item.caseId).toBe(caseId);
        expect(item.organizationId).toBe(TEST_ORG_ID);
      }

      // Verify deterministic descending order:
      // createdAt DESC, then id DESC.
      for (let index = 0; index < allItems.length - 1; index++) {
        const current = allItems[index];
        const next = allItems[index + 1];

        const currentTime = new Date(current.createdAt).getTime();
        const nextTime = new Date(next.createdAt).getTime();

        const isDescending =
          currentTime > nextTime ||
          (currentTime === nextTime && current.id.localeCompare(next.id) > 0);

        expect(isDescending).toBe(true);
      }
    });

    it('rejects an invalid cursor', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${caseId}/samples`)
        .query({ cursor: 'not-a-valid-cursor' })
        .expect(400);
    });

    it('rejects a limit greater than 100', async () => {
      await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${caseId}/samples`)
        .query({ limit: 101 })
        .expect(400);
    });
  });

  describe('Authorization', () => {
    it('rejects requests when the user has no organization membership', async () => {
      const sample = await prisma.sample.create({
        data: {
          organizationId: TEST_ORG_ID,
          caseId,
          externalId: 'AUTHORIZATION-TEST-SAMPLE',
          sampleType: 'TUMOR',
        },
      });

      await prisma.membership.delete({
        where: {
          organizationId_userId: {
            organizationId: TEST_ORG_ID,
            userId: TEST_USER_ID,
          },
        },
      });

      try {
        await request(app.getHttpServer())
          .get(`${API_PREFIX}/cases/${caseId}/samples/${sample.id}`)
          .expect(403);

        await request(app.getHttpServer())
          .get(`${API_PREFIX}/cases/${caseId}/samples`)
          .expect(403);

        await request(app.getHttpServer())
          .post(`${API_PREFIX}/cases/${caseId}/samples`)
          .send({
            externalId: 'UNAUTHORIZED-SAMPLE',
            sampleType: 'TUMOR',
          })
          .expect(403);
      } finally {
        await ensureTestMembership();
      }
    });
  });
});
