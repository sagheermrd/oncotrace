/*
  Warnings:

  - You are about to drop the column `checksumSha256` on the `InputFile` table. All the data in the column will be lost.
  - You are about to drop the column `sizeBytes` on the `InputFile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[organizationId,id]` on the table `InputFile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "UploadSessionStatus" AS ENUM ('INITIATED', 'COMPLETED', 'ABORTED', 'EXPIRED', 'FAILED');

-- AlterTable
ALTER TABLE "InputFile" DROP COLUMN "checksumSha256",
DROP COLUMN "sizeBytes",
ADD COLUMN     "actualChecksumSha256" VARCHAR(64),
ADD COLUMN     "actualSizeBytes" BIGINT,
ADD COLUMN     "expectedChecksumSha256" VARCHAR(64),
ADD COLUMN     "expectedSizeBytes" BIGINT,
ADD COLUMN     "failureReason" VARCHAR(1000),
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UploadSession" (
    "id" UUID NOT NULL,
    "inputFileId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "status" "UploadSessionStatus" NOT NULL DEFAULT 'INITIATED',
    "multipartUploadId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UploadSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadSession_organizationId_inputFileId_createdAt_idx" ON "UploadSession"("organizationId", "inputFileId", "createdAt");

-- CreateIndex
CREATE INDEX "UploadSession_status_expiresAt_idx" ON "UploadSession"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "InputFile_organizationId_id_key" ON "InputFile"("organizationId", "id");

-- AddForeignKey
ALTER TABLE "UploadSession" ADD CONSTRAINT "UploadSession_organizationId_inputFileId_fkey" FOREIGN KEY ("organizationId", "inputFileId") REFERENCES "InputFile"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
