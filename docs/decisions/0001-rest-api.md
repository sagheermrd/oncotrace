# ADR-0001: Use REST API Instead of GraphQL

- Status: Accepted
- Date: 2026-10-30

## Context

OncoTrace exposes resource-oriented workflows involving organizations, research cases, samples, input files, analysis jobs, variants, and evidence.

The API needs predictable contracts and clear resource ownership.

GraphQL was considered as an alternative.

## Decision

Use REST APIs with versioned routes under /api/v1.

Examples:

- POST /api/v1/cases
- GET /api/v1/cases
- GET /api/v1/cases/:caseId
- POST /api/v1/cases/:caseId/samples
- GET /api/v1/cases/:caseId/samples

## Reasons

- Resource-oriented workflows map naturally to REST.
- HTTP status codes provide clear semantics.
- Standard HTTP caching and tooling are available.
- NestJS provides straightforward REST controller and DTO patterns.
- REST is sufficient for the current frontend and backend requirements.

## Consequences

Positive:

- Simple API contracts.
- Familiar developer experience.
- Clear authorization boundaries.
- Straightforward integration testing.

Trade-offs:

- Clients may need multiple requests for complex views.
- Response composition may require dedicated endpoints.
- API contracts need deliberate versioning.

## Reconsideration Conditions

Reconsider the API style if future clients require highly dynamic graph-shaped queries that cannot be served efficiently through well-designed REST endpoints.
