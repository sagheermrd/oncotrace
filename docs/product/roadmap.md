# OncoTrace — Development Roadmap

## Phase 1 — Foundation

- [x] Define product direction.
- [x] Define core architecture.
- [x] Initialize NestJS backend.
- [x] Configure Prisma and PostgreSQL.
- [x] Implement organization and membership models.
- [x] Implement research case APIs.
- [x] Implement cursor-based case pagination.
- [x] Establish Vitest testing setup.
- [x] Implement initial E2E tests.

## Phase 2 — Samples and Input Files

- [x] Define Sample model.
- [x] Define InputFile model.
- [x] Add organization-level composite relationships.
- [x] Apply database migration.
- [ ] Implement sample creation API.
- [ ] Implement sample listing API.
- [ ] Implement sample retrieval API.
- [ ] Add sample validation and authorization tests.
- [ ] Implement input-file metadata API.
- [ ] Add input-file metadata tests.

## Phase 3 — Secure File Storage

- [ ] Select object-storage provider.
- [ ] Design upload authorization.
- [ ] Implement upload workflow.
- [ ] Implement checksum verification.
- [ ] Implement file validation.
- [ ] Implement failed-upload cleanup.
- [ ] Add file download authorization.

## Phase 4 — Analysis Pipeline

- [ ] Define AnalysisJob domain model.
- [ ] Select job queue.
- [ ] Implement asynchronous job submission.
- [ ] Implement worker architecture.
- [ ] Add retry and failure handling.
- [ ] Record pipeline and reference-data versions.
- [ ] Implement job monitoring.

## Phase 5 — Variants and Annotation

- [ ] Define Variant domain model.
- [ ] Define annotation model.
- [ ] Integrate or simulate an annotation workflow.
- [ ] Store genomic coordinates and reference information.
- [ ] Add variant filtering.
- [ ] Track annotation provenance.

## Phase 6 — Evidence and Research Intelligence

- [ ] Define evidence source model.
- [ ] Store evidence records.
- [ ] Implement evidence search.
- [ ] Evaluate PostgreSQL full-text search and pgvector.
- [ ] Build AI-assisted evidence retrieval.
- [ ] Preserve source references and citations.
- [ ] Distinguish retrieved facts from generated summaries.

## Phase 7 — Reporting and Auditability

- [ ] Implement audit events.
- [ ] Generate research reports.
- [ ] Include pipeline and evidence provenance.
- [ ] Implement report history.
- [ ] Add export functionality.

## Phase 8 — Frontend

- [ ] Create React application.
- [ ] Implement authentication screens.
- [ ] Build research case dashboard.
- [ ] Build case details and sample management.
- [ ] Build input-file management.
- [ ] Build analysis monitoring.
- [ ] Build variant and evidence views.
- [ ] Implement responsive UX.

## Phase 9 — Production Readiness

- [ ] Replace development authentication.
- [ ] Implement production authorization policies.
- [ ] Add structured logging and monitoring.
- [ ] Add CI pipeline.
- [ ] Add Docker deployment configuration.
- [ ] Add database backup and restoration procedures.
- [ ] Perform security review.
- [ ] Document deployment and operations.
