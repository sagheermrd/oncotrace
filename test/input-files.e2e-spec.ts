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
import { OBJECT_STORAGE } from '../src/storage/storage.constants.js';

const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';
const TEST_ORG_ID = '22222222-2222-4222-8222-222222222222';
const OTHER_ORG_ID = '33333333-3333-4333-8333-333333333333';

const API_PREFIX = '/api/v1';

type FilePayload = {
  fileName: string;
  fileType: string;
  expectedSizeBytes?: string;
  expectedChecksumSha256?: string;
};

const createFilePayload = (
  overrides: Partial<FilePayload> = {},
): FilePayload => ({
  fileName: 'sample_R1.fastq.gz',
  fileType: 'FASTQ',
  expectedSizeBytes: '104857600',
  expectedChecksumSha256: 'a'.repeat(64),
  ...overrides,
});

const objectStorageMock = {
  createPresignedUploadUrl: vi
    .fn()
    .mockResolvedValue('https://example.test/presigned-upload'),
  getObjectMetadata: vi.fn(),
  deleteObject: vi.fn(),
};

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

describe('InputFiles API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let caseId: string;
  let sampleId: string;

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
        name: `InputFiles E2E ${randomUUID()}`,
        organizationId,
        createdByUserId: TEST_USER_ID,
      },
    });
  }

  async function createSample(
    targetCaseId: string,
    externalId = `SAMPLE-${randomUUID()}`,
  ) {
    return prisma.sample.create({
      data: {
        organizationId: TEST_ORG_ID,
        caseId: targetCaseId,
        externalId,
        sampleType: 'TUMOR',
      },
    });
  }

  async function registerFile(
    targetCaseId: string,
    targetSampleId: string,
    payload = createFilePayload(),
  ) {
    return request(app.getHttpServer())
      .post(
        `${API_PREFIX}/cases/${targetCaseId}/samples/${targetSampleId}/input-files`,
      )
      .send(payload);
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(DevAuthGuard)
      .useValue(testAuthGuard)
      .overrideProvider(OBJECT_STORAGE)
      .useValue(objectStorageMock)
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

    await prisma.organization.upsert({
      where: { id: TEST_ORG_ID },
      create: {
        id: TEST_ORG_ID,
        name: 'InputFiles E2E Test Organization',
      },
      update: {},
    });

    await prisma.organization.upsert({
      where: { id: OTHER_ORG_ID },
      create: {
        id: OTHER_ORG_ID,
        name: 'InputFiles E2E Other Organization',
      },
      update: {},
    });

    await prisma.user.upsert({
      where: { id: TEST_USER_ID },
      create: {
        id: TEST_USER_ID,
        email: 'input-files-e2e@example.test',
        displayName: 'InputFiles E2E User',
      },
      update: {},
    });

    await ensureTestMembership();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    objectStorageMock.createPresignedUploadUrl.mockResolvedValue(
      'https://example.test/presigned-upload',
    );
    const researchCase = await createCase(TEST_ORG_ID);
    caseId = researchCase.id;

    const sample = await createSample(caseId);
    sampleId = sample.id;
  });

  afterEach(async () => {
    // InputFiles must be deleted before their parent samples.
    if (foreignSampleId) {
      await prisma.inputFile.deleteMany({
        where: {
          organizationId: OTHER_ORG_ID,
          sampleId: foreignSampleId,
        },
      });

      await prisma.sample.deleteMany({
        where: {
          organizationId: OTHER_ORG_ID,
          id: foreignSampleId,
        },
      });

      foreignSampleId = undefined;
    }

    if (foreignCaseId) {
      await prisma.researchCase.deleteMany({
        where: { id: foreignCaseId },
      });

      foreignCaseId = undefined;
    }

    if (sampleId) {
      await prisma.inputFile.deleteMany({
        where: {
          organizationId: TEST_ORG_ID,
          sampleId,
        },
      });

      await prisma.sample.deleteMany({
        where: {
          organizationId: TEST_ORG_ID,
          id: sampleId,
        },
      });
    }

    if (caseId) {
      await prisma.researchCase.deleteMany({
        where: { id: caseId },
      });
    }

    await ensureTestMembership();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /cases/:caseId/samples/:sampleId/input-files', () => {
    it('registers input file metadata', async () => {
      const response = await registerFile(caseId, sampleId);

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        fileName: 'sample_R1.fastq.gz',
        fileType: 'FASTQ',
        expectedSizeBytes: '104857600',
        expectedChecksumSha256: 'a'.repeat(64),
        status: 'REGISTERED',
      });

      expect(response.body.id).toBeDefined();
      expect(response.body.createdAt).toBeDefined();
      expect(response.body.updatedAt).toBeDefined();

      // Internal storage details must never be exposed.
      expect(response.body).not.toHaveProperty('storageKey');

      // BigInt values must be serialized as strings.
      expect(typeof response.body.expectedSizeBytes).toBe('string');
    });

    it('allows optional size and checksum to be omitted', async () => {
      const response = await registerFile(caseId, sampleId, {
        fileName: 'sample.bam',
        fileType: 'BAM',
      });
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        fileName: 'sample.bam',
        fileType: 'BAM',
        status: 'REGISTERED',
      });
    });

    it('rejects an invalid file type', async () => {
      const response = await registerFile(caseId, sampleId, {
        ...createFilePayload(),
        fileType: 'INVALID',
      });
      expect(response.status).toBe(400);
    });

    it('rejects an invalid checksum', async () => {
      const response = await registerFile(caseId, sampleId, {
        ...createFilePayload(),
        expectedChecksumSha256: 'invalid-checksum',
      });
      expect(response.status).toBe(400);
    });

    it('rejects a negative file size', async () => {
      const response = await registerFile(caseId, sampleId, {
        ...createFilePayload(),
        expectedSizeBytes: '-100',
      });
      expect(response.status).toBe(400);
    });

    it('rejects a non-numeric file size', async () => {
      const response = await registerFile(caseId, sampleId, {
        ...createFilePayload(),
        expectedSizeBytes: 'not-a-number',
      });
      expect(response.status).toBe(400);
    });

    it('rejects an invalid sample ID', async () => {
      const response = await registerFile(caseId, randomUUID());
      expect(response.status).toBe(404);
    });

    it('rejects a sample belonging to a different case', async () => {
      const anotherCase = await createCase(TEST_ORG_ID);
      const anotherSample = await createSample(anotherCase.id);

      try {
        const response = await registerFile(caseId, anotherSample.id);
        expect(response.status).toBe(404);
      } finally {
        await prisma.inputFile.deleteMany({
          where: { sampleId: anotherSample.id },
        });

        await prisma.sample.delete({
          where: { id: anotherSample.id },
        });

        await prisma.researchCase.delete({
          where: { id: anotherCase.id },
        });
      }
    });
  });

  describe('GET input files', () => {
    it('lists files belonging to the requested sample', async () => {
      const response1 = await registerFile(caseId, sampleId, {
        fileName: 'sample_R1.fastq.gz',
        fileType: 'FASTQ',
      });
      expect(response1.status).toBe(201);

      const response2 = await registerFile(caseId, sampleId, {
        fileName: 'sample_R2.fastq.gz',
        fileType: 'FASTQ',
      });
      expect(response2.status).toBe(201);

      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/cases/${caseId}/samples/${sampleId}/input-files`)
        .expect(200);

      expect(response.body).toHaveLength(2);

      expect(
        response.body.map((file: { fileName: string }) => file.fileName),
      ).toEqual(
        expect.arrayContaining(['sample_R1.fastq.gz', 'sample_R2.fastq.gz']),
      );

      for (const file of response.body) {
        expect(file).not.toHaveProperty('storageKey');
      }
    });

    it('retrieves one input file by ID', async () => {
      const created = await registerFile(caseId, sampleId);
      expect(created.status).toBe(201);

      const response = await request(app.getHttpServer())
        .get(
          `${API_PREFIX}/cases/${caseId}/samples/${sampleId}/input-files/${created.body.id}`,
        )
        .expect(200);

      expect(response.body).toMatchObject({
        id: created.body.id,
        fileName: 'sample_R1.fastq.gz',
        fileType: 'FASTQ',
        status: 'REGISTERED',
      });

      expect(response.body).not.toHaveProperty('storageKey');
    });

    it('returns 404 when the file does not belong to the requested sample', async () => {
      const anotherSample = await createSample(caseId);

      const created = await registerFile(caseId, sampleId);
      expect(created.status).toBe(201);

      try {
        await request(app.getHttpServer())
          .get(
            `${API_PREFIX}/cases/${caseId}/samples/${anotherSample.id}/input-files/${created.body.id}`,
          )
          .expect(404);
      } finally {
        await prisma.inputFile.deleteMany({
          where: { sampleId: anotherSample.id },
        });

        await prisma.sample.delete({
          where: { id: anotherSample.id },
        });
      }
    });

    it('returns 404 for an unknown input file', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `${API_PREFIX}/cases/${caseId}/samples/${sampleId}/input-files/${randomUUID()}`,
        )
        .expect(404);
      expect(response.status).toBe(404);
    });
  });

  describe('Authorization', () => {
    it('rejects listing, retrieving and registering files without membership', async () => {
      const created = await registerFile(caseId, sampleId);
      expect(created.status).toBe(201);

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
          .get(`${API_PREFIX}/cases/${caseId}/samples/${sampleId}/input-files`)
          .expect(403);

        await request(app.getHttpServer())
          .get(
            `${API_PREFIX}/cases/${caseId}/samples/${sampleId}/input-files/${created.body.id}`,
          )
          .expect(403);

        const response = await registerFile(caseId, sampleId, {
          ...createFilePayload(),
          fileName: 'unauthorized.bam',
          fileType: 'BAM',
        });
        expect(response.status).toBe(403);
      } finally {
        await ensureTestMembership();
      }
    });
  });
});
