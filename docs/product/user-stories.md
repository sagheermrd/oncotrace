# OncoTrace — User Stories

## 1. Purpose

This document describes the primary user workflows and their acceptance criteria.

Story status reflects the current implementation stage.

## 2. Research Case Management

### US-CASE-01 — Create a Research Case

As a bioinformatics analyst, I want to create a research case so that I can organize a genomics investigation.

Acceptance criteria:

- An authorized user can create a case within their organization.
- A case must have a valid name.
- Optional description and external reference are accepted.
- The organization and creator are derived from the authenticated context.
- Successful creation returns HTTP 201.
- Invalid requests return HTTP 400.
- Users cannot create cases for another organization.

Status: Implemented.

### US-CASE-02 — List Research Cases

As a bioinformatics analyst, I want to list research cases so that I can find and manage my investigations.

Acceptance criteria:

- Only cases belonging to the current organization are returned.
- Results support cursor-based pagination.
- Page size is validated.
- The response includes items and pagination metadata.
- Invalid cursors are rejected.

Status: Implemented.

### US-CASE-03 — Retrieve a Research Case

As a bioinformatics analyst, I want to retrieve a case by ID so that I can inspect its details.

Acceptance criteria:

- An existing case in the current organization can be retrieved.
- A case belonging to another organization returns HTTP 404.
- A nonexistent case returns HTTP 404.

Status: Implemented.

## 3. Sample Management

### US-SAMPLE-01 — Register a Sample

As a bioinformatics analyst, I want to register a biological sample in a research case so that sequencing data can be associated with the correct sample.

Acceptance criteria:

- An authorized user can register a sample against a case in their organization.
- The sample has an external identifier.
- The sample has a sample type.
- The organization ID is derived from the authenticated context.
- The case ID is validated against the current organization.
- A duplicate external sample ID within the same case is rejected.
- The database prevents inconsistent cross-organization relationships.
- Successful creation returns HTTP 201.

Status: Planned.

### US-SAMPLE-02 — List Samples in a Case

As a bioinformatics analyst, I want to list the samples belonging to a case so that I can review the material available for analysis.

Acceptance criteria:

- The case must belong to the current organization.
- Only samples associated with that case are returned.
- Results are paginated.
- Results have deterministic ordering.
- Another organization's samples are never returned.

Status: Planned.

### US-SAMPLE-03 — Retrieve a Sample

As a bioinformatics analyst, I want to retrieve a sample by ID so that I can inspect its metadata and associated files.

Acceptance criteria:

- The sample must belong to the current organization.
- A nonexistent or inaccessible sample returns HTTP 404.
- The response does not expose storage credentials or internal secrets.

Status: Planned.

## 4. Input File Management

### US-FILE-01 — Register Input File Metadata

As a bioinformatics analyst, I want to register sequencing-file metadata against a sample so that the file can be included in the research workflow.

Acceptance criteria:

- The sample must belong to the current organization.
- File name and file type are validated.
- Storage keys are generated or assigned by trusted server-side logic.
- File size is stored when available.
- SHA-256 checksum is stored when available.
- The initial file status is REGISTERED.
- The API does not accept arbitrary public URLs as storage locations.

Status: Planned.

### US-FILE-02 — Upload a Sequencing File

As a bioinformatics analyst, I want to upload a sequencing file securely so that it can be processed by an analysis pipeline.

Acceptance criteria:

- Upload authorization is verified.
- Files are stored in private object storage.
- Upload size and allowed file types are checked.
- The uploaded content is verified using a checksum.
- Upload failures are recorded.
- The file becomes available for validation only after successful upload.

Status: Planned.

### US-FILE-03 — Validate an Input File

As a bioinformatics analyst, I want the platform to validate an uploaded file so that invalid inputs do not enter the analysis workflow.

Acceptance criteria:

- File format is validated.
- File integrity is checked.
- Validation status and errors are recorded.
- Failed validation does not mark the file as ready for analysis.
- Validation is repeatable and traceable.

Status: Planned.

## 5. Analysis Workflow

### US-ANALYSIS-01 — Submit an Analysis Job

As a bioinformatics analyst, I want to submit an analysis job so that sequencing data can be processed asynchronously.

Acceptance criteria:

- Only eligible files can be submitted.
- The job references the relevant sample and input files.
- The request is accepted without waiting for the full analysis to finish.
- The job has a unique identifier.
- Job state is tracked.

Status: Planned.

### US-ANALYSIS-02 — Monitor an Analysis Job

As a bioinformatics analyst, I want to monitor analysis progress so that I can identify completed or failed jobs.

Acceptance criteria:

- Job status is visible.
- Failures include a useful error category.
- Retry behavior is controlled.
- Job history is traceable.

Status: Planned.

## 6. Evidence and Reporting

### US-EVIDENCE-01 — Review Variant Evidence

As a bioinformatics analyst, I want to review scientific evidence associated with a genomic variant so that I can understand the supporting research.

Acceptance criteria:

- Evidence records have source and provenance information.
- Evidence is linked to the relevant variant.
- Evidence can be searched and filtered.
- The platform distinguishes source facts from generated summaries.

Status: Planned.

### US-REPORT-01 — Generate a Research Report

As a bioinformatics analyst, I want to generate a research report so that I can share a traceable summary of an investigation.

Acceptance criteria:

- The report references the case and relevant analysis results.
- Report generation records its input versions.
- The report is associated with its generating user and timestamp.
- The report does not imply a clinical diagnosis.

Status: Planned.

## 7. Story-to-Test Traceability

Tests should use stable story identifiers where practical.

Examples:

- US-CASE-01: case creation E2E tests.
- US-CASE-02: tenant filtering and pagination tests.
- US-SAMPLE-01: sample creation and duplicate ID tests.
- US-FILE-01: file metadata validation tests.
- US-ANALYSIS-01: job submission and lifecycle tests.
