# OncoTrace — Data Flow

## 1. Purpose

This document describes how information moves through the platform.

## 2. Current Case Creation Flow

1. Client submits a case creation request.
2. NestJS receives the HTTP request.
3. Global validation checks the request DTO.
4. Authentication identifies the current user and organization context.
5. CasesService validates the user's organization membership.
6. Prisma persists the case.
7. The API returns the created case.

The organization and creator must be determined by trusted server-side context.

## 3. Planned Sample Registration Flow

1. Client submits sample metadata for a case.
2. API validates the request.
3. Authentication resolves the current organization.
4. SamplesService verifies that the case belongs to that organization.
5. The sample is created with the organization and case identifiers.
6. Database composite foreign keys enforce relationship consistency.
7. API returns the created sample.

## 4. Planned Input File Upload Flow

1. Client requests permission to upload a file.
2. API verifies access to the sample.
3. API creates or prepares input-file metadata.
4. API issues a short-lived upload authorization mechanism.
5. Client uploads file contents to private object storage.
6. Upload completion is confirmed.
7. The system verifies file size and checksum.
8. File status changes to UPLOADED.
9. File validation is scheduled.
10. File status changes to VALIDATED or FAILED.

## 5. Planned Analysis Flow

1. Analyst submits an analysis request.
2. API validates that required input files are eligible.
3. Analysis job is persisted.
4. Job is published to a queue.
5. Worker claims the job.
6. Worker executes the selected pipeline.
7. Worker records status and results.
8. Variant and annotation records are persisted.
9. The analyst retrieves results through the API.

## 6. Reliability Considerations

- Do not assume a database transaction can atomically commit changes to an external object store.
- Plan cleanup for incomplete uploads.
- Use idempotent upload-completion and job-submission operations.
- Use controlled retries for transient failures.
- Preserve job and pipeline version information.
- Avoid logging genomic file contents.
