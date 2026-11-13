import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
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
    organizationId = TEST_ORG_ID,
  ) {
    return prisma.sample.create({
      data: {
        organizationId,
        caseId: targetCaseId,
        externalId,
        sampleType: 'TUMOR',
      },
    });
  }

  async function createForeignInputFile(targetSampleId: string) {
    return prisma.inputFile.create({
      data: {
        organizationId: OTHER_ORG_ID,
        sampleId: targetSampleId,
        fileName: 'foreign-sample.fastq.gz',
        fileType: 'FASTQ',
        storageKey: `organizations/${OTHER_ORG_ID}/test/${randomUUID()}`,
      },
    });
  }

  async function deleteFilesForSample(
    organizationId: string,
    targetSampleId: string,
  ) {
    const files = await prisma.inputFile.findMany({
      where: {
        organizationId,
        sampleId: targetSampleId,
      },
      select: {
        id: true,
      },
    });

    const inputFileIds = files.map((file) => file.id);

    if (inputFileIds.length > 0) {
      await prisma.uploadSession.deleteMany({
        where: {
          organizationId,
          inputFileId: {
            in: inputFileIds,
          },
        },
      });

      await prisma.inputFile.deleteMany({
        where: {
          organizationId,
          id: {
            in: inputFileIds,
          },
        },
      });
    }
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
    // UploadSession must be deleted before InputFile.
    if (foreignSampleId) {
      await deleteFilesForSample(OTHER_ORG_ID, foreignSampleId);

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
      await deleteFilesForSample(TEST_ORG_ID, sampleId);

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

  describe('POST /input-files/:inputFileId/upload-url', () => {
    async function createRegisteredFile() {
      const response = await registerFile(caseId, sampleId);

      expect(response.status).toBe(201);

      return response.body.id as string;
    }

    async function requestUploadUrl(inputFileId: string, body = {}) {
      return request(app.getHttpServer())
        .post(`${API_PREFIX}/input-files/${inputFileId}/upload-url`)
        .send(body);
    }

    it('generates a presigned upload URL and creates an upload session', async () => {
      const inputFileId = await createRegisteredFile();

      const fileBeforeUpload = await prisma.inputFile.findUniqueOrThrow({
        where: { id: inputFileId },
      });

      const response = await requestUploadUrl(inputFileId, {
        contentType: 'application/octet-stream',
      });

      expect(response.status).toBe(201);

      expect(response.body).toMatchObject({
        uploadUrl: 'https://example.test/presigned-upload',
        method: 'PUT',
        requiredHeaders: {
          'Content-Type': 'application/octet-stream',
        },
      });

      expect(response.body.uploadSessionId).toBeDefined();
      expect(response.body.expiresAt).toBeDefined();

      const expiresAt = new Date(response.body.expiresAt).getTime();

      expect(expiresAt).toBeGreaterThan(Date.now());
      expect(expiresAt).toBeLessThanOrEqual(Date.now() + 610_000);

      // Confirm the storage adapter received the backend-generated key.
      expect(objectStorageMock.createPresignedUploadUrl).toHaveBeenCalledOnce();

      expect(objectStorageMock.createPresignedUploadUrl).toHaveBeenCalledWith({
        key: fileBeforeUpload.storageKey,
        expiresInSeconds: 600,
        contentType: 'application/octet-stream',
      });

      // InputFile should now be UPLOADING.
      const updatedFile = await prisma.inputFile.findUniqueOrThrow({
        where: { id: inputFileId },
      });

      expect(updatedFile.status).toBe('UPLOADING');

      // An INITIATED UploadSession should exist.
      const session = await prisma.uploadSession.findUniqueOrThrow({
        where: {
          id: response.body.uploadSessionId,
        },
      });

      expect(session).toMatchObject({
        organizationId: TEST_ORG_ID,
        inputFileId,
        status: 'INITIATED',
      });

      expect(session.expiresAt).toEqual(new Date(response.body.expiresAt));

      // The storage key must not leak through the response.
      expect(response.body).not.toHaveProperty('storageKey');
    });

    it('allows the default content type when no content type is provided', async () => {
      const inputFileId = await createRegisteredFile();

      const response = await requestUploadUrl(inputFileId);

      expect(response.status).toBe(201);

      expect(response.body.requiredHeaders).toEqual({
        'Content-Type': 'application/gzip',
      });

      expect(objectStorageMock.createPresignedUploadUrl).toHaveBeenCalledWith(
        expect.objectContaining({
          contentType: 'application/gzip',
        }),
      );
    });

    it('returns 409 when a second upload URL is requested for an uploading file', async () => {
      const inputFileId = await createRegisteredFile();

      const firstResponse = await requestUploadUrl(inputFileId, {
        contentType: 'application/octet-stream',
      });

      expect(firstResponse.status).toBe(201);

      const secondResponse = await requestUploadUrl(inputFileId, {
        contentType: 'application/octet-stream',
      });

      expect(secondResponse.status).toBe(409);

      // Only one session and one signing operation should exist.
      const sessions = await prisma.uploadSession.findMany({
        where: {
          inputFileId,
          organizationId: TEST_ORG_ID,
        },
      });

      expect(sessions).toHaveLength(1);

      expect(objectStorageMock.createPresignedUploadUrl).toHaveBeenCalledOnce();
    });

    it('returns 404 when the input file belongs to another organization', async () => {
      const foreignCase = await createCase(OTHER_ORG_ID);
      foreignCaseId = foreignCase.id;

      const foreignSample = await createSample(
        foreignCase.id,
        `FOREIGN-${randomUUID()}`,
        OTHER_ORG_ID,
      );

      foreignSampleId = foreignSample.id;

      const foreignFile = await createForeignInputFile(foreignSample.id);

      const response = await requestUploadUrl(foreignFile.id, {
        contentType: 'application/octet-stream',
      });

      expect(response.status).toBe(404);

      expect(objectStorageMock.createPresignedUploadUrl).not.toHaveBeenCalled();

      const unchangedFile = await prisma.inputFile.findUniqueOrThrow({
        where: { id: foreignFile.id },
      });

      expect(unchangedFile.status).toBe('REGISTERED');

      const sessions = await prisma.uploadSession.findMany({
        where: {
          inputFileId: foreignFile.id,
        },
      });

      expect(sessions).toHaveLength(0);
    });

    it('returns 400 for a content type not allowed for the file type', async () => {
      const inputFileId = await createRegisteredFile();

      const response = await requestUploadUrl(inputFileId, {
        contentType: 'text/html',
      });

      expect(response.status).toBe(400);

      expect(objectStorageMock.createPresignedUploadUrl).not.toHaveBeenCalled();

      const file = await prisma.inputFile.findUniqueOrThrow({
        where: { id: inputFileId },
      });

      expect(file.status).toBe('REGISTERED');

      const sessions = await prisma.uploadSession.findMany({
        where: { inputFileId },
      });

      expect(sessions).toHaveLength(0);
    });

    it.each(['UPLOADED', 'VALIDATED'] as const)(
      'returns 409 when the file status is %s',
      async (status) => {
        const inputFileId = await createRegisteredFile();

        await prisma.inputFile.update({
          where: { id: inputFileId },
          data: { status },
        });

        const response = await requestUploadUrl(inputFileId, {
          contentType: 'application/octet-stream',
        });

        expect(response.status).toBe(409);

        expect(
          objectStorageMock.createPresignedUploadUrl,
        ).not.toHaveBeenCalled();

        const sessions = await prisma.uploadSession.findMany({
          where: { inputFileId },
        });

        expect(sessions).toHaveLength(0);
      },
    );

    it('returns 500 and marks the file and session as FAILED when URL signing fails', async () => {
      const inputFileId = await createRegisteredFile();

      objectStorageMock.createPresignedUploadUrl.mockRejectedValueOnce(
        new Error('Simulated S3 signing failure'),
      );

      const response = await requestUploadUrl(inputFileId, {
        contentType: 'application/octet-stream',
      });

      expect(response.status).toBe(500);

      expect(response.body.message).toBe('Failed to generate upload URL');

      const file = await prisma.inputFile.findUniqueOrThrow({
        where: { id: inputFileId },
      });

      expect(file.status).toBe('FAILED');
      expect(file.failureReason).toBe('Failed to generate upload URL');

      const session = await prisma.uploadSession.findFirstOrThrow({
        where: {
          inputFileId,
          organizationId: TEST_ORG_ID,
        },
      });

      expect(session.status).toBe('FAILED');
    });

    it('returns 404 for an unknown input file ID', async () => {
      const response = await requestUploadUrl(randomUUID(), {
        contentType: 'application/octet-stream',
      });

      expect(response.status).toBe(404);

      expect(objectStorageMock.createPresignedUploadUrl).not.toHaveBeenCalled();
    });
  });

  describe('Authorization', () => {
    it('rejects generating an upload URL without organization membership', async () => {
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
        const response = await request(app.getHttpServer())
          .post(`${API_PREFIX}/input-files/${created.body.id}/upload-url`)
          .send({
            contentType: 'application/octet-stream',
          });

        expect(response.status).toBe(403);

        expect(
          objectStorageMock.createPresignedUploadUrl,
        ).not.toHaveBeenCalled();

        const file = await prisma.inputFile.findUniqueOrThrow({
          where: { id: created.body.id },
        });

        expect(file.status).toBe('REGISTERED');

        const sessions = await prisma.uploadSession.findMany({
          where: {
            inputFileId: created.body.id,
          },
        });

        expect(sessions).toHaveLength(0);
      } finally {
        await ensureTestMembership();
      }
    });
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
