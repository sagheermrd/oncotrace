import {
  ExecutionContext,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { DevAuthGuard } from '../src/auth/dev-auth.guard.js';

import {
  ensureTestOrganizations,
  createForeignCase,
  TEST_ORG_ID,
  OTHER_ORG_ID,
} from './fixtures/test-data.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';
const ORG_ID = '22222222-2222-4222-8222-222222222222';

const testAuthGuard = {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();

    request.user = {
      userId: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
    };

    return true;
  },
};

describe('Cases API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

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

    await ensureTestOrganizations(prisma);
  });

  beforeEach(async () => {
    // Safe only because DATABASE_URL points to oncotrace_test.
    await prisma.researchCase.deleteMany({
      where: {
        organizationId: { in: [ORG_ID, OTHER_ORG_ID] },
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  async function createCase(name: string, externalReference?: string) {
    const body: Record<string, string> = { name };

    if (externalReference !== undefined) {
      body.externalReference = externalReference;
    }

    return request(app.getHttpServer()).post('/api/v1/cases').send(body);
  }

  it('creates a case and returns 201', async () => {
    const response = await createCase('BRCA1 research case');

    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
    expect(response.body.name).toBe('BRCA1 research case');

    const persisted = await prisma.researchCase.findUnique({
      where: { id: response.body.id },
    });

    expect(persisted).not.toBeNull();
    expect(persisted?.organizationId).toBe(ORG_ID);
  });

  it('rejects an empty name', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .send({ name: '' });

    expect(response.status).toBe(400);
  });

  it('rejects unknown request properties', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/cases')
      .send({
        name: 'Valid case',
        organizationId: OTHER_ORG_ID,
      });

    expect(response.status).toBe(400);
  });

  it('does not allow the caller to select another organization', async () => {
    const response = await createCase('Tenant isolation check');

    expect(response.status).toBe(201);

    const saved = await prisma.researchCase.findUnique({
      where: { id: response.body.id },
    });

    expect(saved?.organizationId).toBe(ORG_ID);
    expect(saved?.organizationId).not.toBe(OTHER_ORG_ID);
  });

  it('returns 409 for a duplicate external reference in the same organization', async () => {
    const reference = `EXT-${crypto.randomUUID()}`;

    const first = await createCase('First case', reference);
    const second = await createCase('Second case', reference);

    expect(first.status).toBe(201);
    expect(second.status).toBe(409);
  });

  it('returns only cases belonging to the current organization', async () => {
    await createCase('Organization A case');

    // Fixture: OTHER_ORG_ID must exist in the test database.
    await prisma.researchCase.create({
      data: {
        organizationId: OTHER_ORG_ID,
        name: 'Organization B private case',
        createdByUserId: USER_ID,
      },
    });

    const response = await request(app.getHttpServer()).get('/api/v1/cases');

    expect(response.status).toBe(200);

    const serialized = JSON.stringify(response.body);
    expect(serialized).toContain('Organization A case');
    expect(serialized).not.toContain('Organization B private case');
  });

  it('rejects an invalid pagination cursor', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/cases')
      .query({ cursor: 'not-a-valid-cursor' });

    expect(response.status).toBe(400);
  });

  it('rejects a limit greater than 100', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/cases')
      .query({ limit: 101 });

    expect(response.status).toBe(400);
  });

  it('returns a next cursor when another page exists', async () => {
    await createCase('Pagination case A');
    await createCase('Pagination case B');
    await createCase('Pagination case C');

    const firstPage = await request(app.getHttpServer())
      .get('/api/v1/cases')
      .query({ limit: 2 });

    expect(firstPage.status).toBe(200);
    expect(firstPage.body.items).toHaveLength(2);
    expect(firstPage.body.pageInfo.hasNextPage).toBe(true);
    expect(firstPage.body.pageInfo.nextCursor).toEqual(expect.any(String));

    const secondPage = await request(app.getHttpServer())
      .get('/api/v1/cases')
      .query({
        limit: 2,
        cursor: firstPage.body.pageInfo.nextCursor,
      });

    expect(secondPage.status).toBe(200);
    expect(secondPage.body.items.length).toBeGreaterThan(0);

    const firstIds = firstPage.body.items.map(
      (item: { id: string }) => item.id,
    );
    const secondIds = secondPage.body.items.map(
      (item: { id: string }) => item.id,
    );

    expect(secondIds).not.toEqual(expect.arrayContaining(firstIds));
  });
  it('returns 404 when reading another organization’s case', async () => {
    const foreignCase = await createForeignCase(prisma);

    const response = await request(app.getHttpServer()).get(
      `/api/v1/cases/${foreignCase.id}`,
    );

    expect(response.status).toBe(404);
    expect(JSON.stringify(response.body)).not.toContain(
      'Confidential foreign case',
    );
  });
});
