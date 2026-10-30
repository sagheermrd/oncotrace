# OncoTrace — Product Requirements

## 1. Purpose

This document defines the functional and non-functional requirements for OncoTrace.

Requirements are delivered incrementally. A requirement marked Planned must not be considered implemented until its acceptance criteria are satisfied.

## 2. Functional Requirements

### 2.1 Organization and Access

| ID        | Requirement                                            | Priority | Status                |
| --------- | ------------------------------------------------------ | -------- | --------------------- |
| FR-ORG-01 | Support organization records                           | High     | Implemented           |
| FR-ORG-02 | Associate users with organizations through memberships | High     | Implemented           |
| FR-ORG-03 | Support organization membership roles                  | High     | Implemented           |
| FR-ORG-04 | Restrict access to organization-owned resources        | Critical | Partially implemented |
| FR-ORG-05 | Support production authentication and authorization    | Critical | Planned               |

### 2.2 Research Case Management

| ID         | Requirement                                       | Priority | Status      |
| ---------- | ------------------------------------------------- | -------- | ----------- |
| FR-CASE-01 | Create a research case                            | High     | Implemented |
| FR-CASE-02 | List research cases for the current organization  | High     | Implemented |
| FR-CASE-03 | Retrieve a case by ID                             | High     | Implemented |
| FR-CASE-04 | Support case descriptions and external references | Medium   | Implemented |
| FR-CASE-05 | Archive a research case                           | Medium   | Planned     |
| FR-CASE-06 | Support cursor-based pagination                   | High     | Implemented |

### 2.3 Sample Management

| ID           | Requirement                                         | Priority | Status             |
| ------------ | --------------------------------------------------- | -------- | ------------------ |
| FR-SAMPLE-01 | Register a sample within a research case            | High     | Planned            |
| FR-SAMPLE-02 | Associate each sample with an organization          | Critical | Schema implemented |
| FR-SAMPLE-03 | Prevent duplicate external sample IDs within a case | High     | Schema implemented |
| FR-SAMPLE-04 | List samples belonging to a case                    | High     | Planned            |
| FR-SAMPLE-05 | Retrieve a sample by ID                             | Medium   | Planned            |
| FR-SAMPLE-06 | Support sample status management                    | Medium   | Schema implemented |

### 2.4 Input File Management

| ID         | Requirement                                            | Priority | Status             |
| ---------- | ------------------------------------------------------ | -------- | ------------------ |
| FR-FILE-01 | Register sequencing-file metadata                      | High     | Schema implemented |
| FR-FILE-02 | Associate input files with samples                     | Critical | Schema implemented |
| FR-FILE-03 | Support FASTQ, BAM, CRAM, VCF, GVCF and BED file types | High     | Schema implemented |
| FR-FILE-04 | Record file size and SHA-256 checksum                  | High     | Schema implemented |
| FR-FILE-05 | Store file bytes in private object storage             | Critical | Planned            |
| FR-FILE-06 | Generate secure upload and download access             | Critical | Planned            |
| FR-FILE-07 | Validate file integrity and format                     | High     | Planned            |
| FR-FILE-08 | Track file upload and validation status                | High     | Schema implemented |

### 2.5 Analysis Management

| ID             | Requirement                                          | Priority | Status  |
| -------------- | ---------------------------------------------------- | -------- | ------- |
| FR-ANALYSIS-01 | Submit an analysis job                               | High     | Planned |
| FR-ANALYSIS-02 | Execute analysis asynchronously                      | High     | Planned |
| FR-ANALYSIS-03 | Track job lifecycle and failures                     | High     | Planned |
| FR-ANALYSIS-04 | Associate analysis jobs with input files and samples | High     | Planned |
| FR-ANALYSIS-05 | Preserve pipeline and reference-data versions        | High     | Planned |

### 2.6 Variant and Evidence Management

| ID             | Requirement                                 | Priority | Status  |
| -------------- | ------------------------------------------- | -------- | ------- |
| FR-VARIANT-01  | Store detected genomic variants             | High     | Planned |
| FR-VARIANT-02  | Store variant annotations                   | High     | Planned |
| FR-EVIDENCE-01 | Associate variants with scientific evidence | High     | Planned |
| FR-EVIDENCE-02 | Record evidence sources and provenance      | High     | Planned |
| FR-EVIDENCE-03 | Support evidence search and filtering       | Medium   | Planned |
| FR-REPORT-01   | Generate research reports                   | Medium   | Planned |

## 3. Non-Functional Requirements

### Security

- Every organization-owned resource must be accessed within the authenticated organization context.
- Authorization must be enforced at the application layer.
- Database relationships should prevent inconsistent cross-organization associations.
- Genomic files must not be publicly accessible.
- Secrets must never be committed to source control.
- Sensitive data must not be unnecessarily exposed in logs.

### Reliability

- Database transactions must protect multi-step state changes.
- Background jobs must support retry and failure handling.
- File processing must verify integrity.
- Important state transitions must be traceable.

### Performance

- Use pagination for potentially large collections.
- Avoid unnecessary database round trips.
- Add indexes for frequently used query patterns.
- Process large genomic files outside synchronous HTTP request handling.

### Maintainability

- Keep domain modules independently understandable.
- Use DTO validation at API boundaries.
- Maintain automated unit and E2E tests.
- Document important architectural decisions.

### Observability

- Use structured application logging.
- Include correlation/request identifiers.
- Capture job failures and processing durations.
- Avoid logging sensitive genomic content.

## 4. Constraints and Assumptions

- Backend: NestJS and TypeScript.
- Database: PostgreSQL.
- ORM: Prisma 7.
- API style: REST.
- Testing: Vitest.
- File storage: private object storage, provider to be selected.
- Frontend: React and TypeScript, planned.

## 5. Scope Management

New requirements should have:

1. A unique requirement ID.
2. A business reason.
3. Acceptance criteria.
4. Priority.
5. Implementation status.
6. Related user stories and tests.
