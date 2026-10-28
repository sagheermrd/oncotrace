import type { PrismaService } from '../../src/prisma/prisma.service.js';

export const TEST_USER_ID = '11111111-1111-4111-8111-111111111111';

export const TEST_ORG_ID = '22222222-2222-4222-8222-222222222222';

export const OTHER_ORG_ID = '33333333-3333-4333-8333-333333333333';

export const TEST_ORG_NAME = 'OncoTrace Test Organization';

export const OTHER_ORG_NAME = 'OncoTrace Other Test Organization';

/**
 * Ensure both organizations exist before tests create cases.
 *
 * Safe to call repeatedly: upsert avoids duplicate organization records.
 * Run this only against the dedicated test database.
 */
export async function ensureTestOrganizations(
  prisma: PrismaService,
): Promise<void> {
  await prisma.organization.upsert({
    where: { id: TEST_ORG_ID },
    update: {},
    create: {
      id: TEST_ORG_ID,
      name: TEST_ORG_NAME,
    },
  });

  await prisma.organization.upsert({
    where: { id: OTHER_ORG_ID },
    update: {},
    create: {
      id: OTHER_ORG_ID,
      name: OTHER_ORG_NAME,
    },
  });
}

/**
 * Create a case owned by the other organization.
 * Used to verify cross-organization access is denied.
 */
export async function createForeignCase(
  prisma: PrismaService,
  name = 'Confidential foreign case',
) {
  return prisma.researchCase.create({
    data: {
      organizationId: OTHER_ORG_ID,
      name,
      createdByUserId: TEST_USER_ID,
    },
  });
}
