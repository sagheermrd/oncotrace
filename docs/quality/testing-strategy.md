# OncoTrace — Testing Strategy

## 1. Purpose

This document defines the testing approach used to verify functional correctness, data integrity, security, and maintainability.

## 2. Testing Stack

- Vitest: test runner.
- Supertest: HTTP integration and E2E requests.
- PostgreSQL: dedicated test database.
- Prisma: database setup and persistence.

## 3. Testing Levels

### Unit Tests

Test individual services and business rules.

Examples:

- Case creation.
- Membership validation.
- Sample identifier uniqueness handling.
- Input file status transitions.
- Cursor encoding and decoding.

Unit tests should isolate external dependencies where appropriate.

### Integration Tests

Test interactions between application services and PostgreSQL.

Examples:

- Composite foreign-key constraints.
- Unique constraints.
- Database transactions.
- Query filtering.
- Tenant isolation.

### End-to-End Tests

Test complete HTTP workflows through NestJS.

Examples:

- Creating a case.
- Listing cases.
- Retrieving a case.
- Creating a sample.
- Registering input-file metadata.
- Handling invalid requests.
- Rejecting cross-organization access.

## 4. Test Database

E2E tests must use a dedicated PostgreSQL database.

Requirements:

- Never run destructive test cleanup against development or production databases.
- Use explicit test environment configuration.
- Verify the database connection before running destructive tests.
- Create required organizations, users, and memberships.
- Clean up test records predictably.
- Ensure tests do not depend on execution order.

## 5. Current Test Coverage

### Cases

- Successful case creation.
- Required-field validation.
- Rejection of unknown properties.
- Duplicate external references.
- Organization-level filtering.
- Cross-organization access.
- Cursor pagination.
- Invalid pagination parameters.
- Membership authorization.

### Samples — Planned

- Successful sample creation.
- Invalid sample data.
- Duplicate external ID within the same case.
- Same external ID allowed in a different case.
- Case from another organization rejected.
- Sample listing restricted to the current case and organization.

### Input Files — Planned

- Valid metadata registration.
- Invalid file type.
- Invalid checksum.
- Unauthorized sample access.
- Duplicate storage key.
- Invalid file lifecycle transitions.
- Large file size handling.

## 6. Test Naming

Use descriptive names and story identifiers where appropriate.

Example:

```typescript
it('US-SAMPLE-01: rejects a sample for a foreign organization case', async () => {
  // Test implementation
});
```

## 7. Test Commands

```bash
# Run unit and service tests
npm test

# Run tests in watch mode
npm run test:watch

# Run coverage
npm run test:cov

# Run end-to-end tests
npm run test:e2e
```

## 8. Quality Gates

Before considering a feature complete:

- DTO validation is implemented.
- Authorization rules are enforced.
- Unit tests pass.
- Relevant E2E tests pass.
- Database constraints are verified.
- Error responses are consistent.
- Documentation is updated.
- No secrets or sensitive test data are committed.

## 9. Coverage Strategy

Coverage should focus on important business behavior rather than only maximizing a percentage.

Prioritize:

- Authorization and tenant isolation.
- Domain invariants.
- Failure paths.
- Database interactions.
- Critical state transitions.
