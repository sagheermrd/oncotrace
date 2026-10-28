/*
  Warnings:

  - A unique constraint covering the columns `[organizationId,id]` on the table `ResearchCase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('REGISTERED', 'READY', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "InputFileType" AS ENUM ('FASTQ', 'BAM', 'CRAM', 'VCF', 'GVCF', 'BED', 'OTHER');

-- CreateEnum
CREATE TYPE "InputFileStatus" AS ENUM ('REGISTERED', 'UPLOADING', 'UPLOADED', 'VALIDATING', 'VALIDATED', 'FAILED');

-- CreateTable
CREATE TABLE "Sample" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "caseId" UUID NOT NULL,
    "externalId" VARCHAR(255) NOT NULL,
    "sampleType" VARCHAR(100) NOT NULL,
    "status" "SampleStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InputFile" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sampleId" UUID NOT NULL,
    "fileName" VARCHAR(255) NOT NULL,
    "fileType" "InputFileType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sizeBytes" BIGINT,
    "checksumSha256" VARCHAR(64),
    "status" "InputFileStatus" NOT NULL DEFAULT 'REGISTERED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InputFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sample_organizationId_caseId_createdAt_id_idx" ON "Sample"("organizationId", "caseId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_organizationId_id_key" ON "Sample"("organizationId", "id");

-- CreateIndex
CREATE UNIQUE INDEX "Sample_organizationId_caseId_externalId_key" ON "Sample"("organizationId", "caseId", "externalId");

-- CreateIndex
CREATE UNIQUE INDEX "InputFile_storageKey_key" ON "InputFile"("storageKey");

-- CreateIndex
CREATE INDEX "InputFile_organizationId_sampleId_createdAt_id_idx" ON "InputFile"("organizationId", "sampleId", "createdAt", "id");

-- CreateIndex
CREATE UNIQUE INDEX "ResearchCase_organizationId_id_key" ON "ResearchCase"("organizationId", "id");

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_organizationId_caseId_fkey" FOREIGN KEY ("organizationId", "caseId") REFERENCES "ResearchCase"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InputFile" ADD CONSTRAINT "InputFile_organizationId_sampleId_fkey" FOREIGN KEY ("organizationId", "sampleId") REFERENCES "Sample"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;
