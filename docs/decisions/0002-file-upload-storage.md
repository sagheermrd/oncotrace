# ADR-0005: Object Storage and Direct File Uploads

**Status:** Accepted

## Context

OncoTrace handles sequencing files, including FASTQ, BAM, CRAM and VCF. These files can be very large. Should not be kept in PostgreSQL or sent through the NestJS API.

The application needs scalable file uploads with tenant isolation, integrity checks and support for multipart uploads.

## Decision

Use private S3-compatible object storage with browser-to-storage uploads through short-lived presigned URLs.

NestJS is still cover following areas:

- Authentication and organization membership.

- File metadata registration.

- Upload session creation.

- Creating presigned URLs.

- Checking uploaded objects.

- Managing file lifecycle status.

- Starting validation.

The storage provider will be used through an application-level interface. The first target for production is Amazon S3 with an S3- local development provider.

## Security

- Stop public bucket access.

- Use presigned URLs that last a short time.

- Create object keys on the backend.

- Make sure organizations and samples own the files.

- Encrypt objects when they are stored and when they are moving.

- Check object size and SHA-256 checksum.

- Don't show storage keys and credentials.

- Track upload and access events.

- Use an EU storage region for the production deployment.

## Data Integrity

File size and checksums provided by the client are considered expected values, not verified values.

The backend checks the object metadata and checksum before considering a file as UPLOADED.

## Consequences

**Benefits**

- Easy to handle files.

- Less traffic and memory use on the API.

- Not tied to one storage provider.

- Clear difference between metadata and binary data.

- Support for multipart uploads and background checks.

**Trade-offs**

- complicated upload process.

- Presigned URL time limits and handling retries.

- monitoring for storage and upload sessions.

- Need to clean up old multipart uploads and incomplete sessions.

## Future Work

- Support for uploads.

- Background checks for integrity and format.

- Object lifecycle and retention rules.

- Upload session time limits and clean up.

- Audit events, for storage access.
