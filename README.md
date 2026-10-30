# OncoTrace

**Genomic Evidence and Precision Medicine Research Platform**

OncoTrace is a research-focused platform for organizing genomic investigations, managing biological samples and sequencing files, tracking analysis workflows, and exploring genomic findings with scientific evidence.

The project demonstrates production-oriented backend engineering using NestJS, TypeScript, PostgreSQL, and Prisma.

> This is a research and portfolio project. It is not a clinically validated diagnostic or treatment recommendation system.

## Key Capabilities

### Implemented

- Organization and membership management foundation.
- Research case creation and retrieval.
- Organization-scoped case listing.
- Cursor-based pagination.
- PostgreSQL persistence with Prisma.
- Initial automated E2E testing.

### In Development

- Sample management.
- Input-file metadata management.

### Planned

- Secure genomic-file storage.
- Asynchronous analysis pipelines.
- Variant annotation.
- Scientific evidence retrieval.
- AI-assisted research workflows.
- Report generation.
- React frontend.

## Technology Stack

| Component    | Technology      |
| ------------ | --------------- |
| Backend      | NestJS          |
| Language     | TypeScript      |
| Runtime      | Node.js         |
| Database     | PostgreSQL      |
| ORM          | Prisma 7        |
| API          | REST            |
| Validation   | class-validator |
| Testing      | Vitest          |
| HTTP testing | Supertest       |
| Frontend     | React (planned) |

## Prerequisites

- Node.js (compatible with the project configuration).
- npm.
- PostgreSQL.
- Git.

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd oncotrace
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example file:

```bash
cp .env.example .env
```

Configure the PostgreSQL connection using the environment variable expected by the current Prisma configuration.

Never commit `.env` or production secrets.

### 4. Apply database migrations

```bash
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
npx prisma generate
```

### 6. Start the application

```bash
npm run start:dev
```

The API is available locally using the port configured by the application.

## Testing

Run unit and service tests:

```bash
npm test
```

Run E2E tests:

```bash
npm run test:e2e
```

Run coverage:

```bash
npm run test:cov
```

E2E tests must use a dedicated test database.

## API

The current API prefix is:

```text
/api/v1
```

Initial endpoints:

| Method | Endpoint              | Description            |
| ------ | --------------------- | ---------------------- |
| POST   | /api/v1/cases         | Create research case   |
| GET    | /api/v1/cases         | List research cases    |
| GET    | /api/v1/cases/:caseId | Retrieve research case |

Future endpoints will cover samples, input files, analysis jobs, variants, and evidence.

## Documentation

Project documentation is maintained under `docs/`.

- Product vision and requirements: `docs/product/`
- Architecture: `docs/architecture/`
- Technical decisions: `docs/decisions/`
- Security: `docs/security/`
- Testing strategy: `docs/quality/`
- API conventions: `docs/api/`

## Development Principles

- Modular monolithic architecture.
- Organization-level tenant isolation.
- Database-level relationship integrity.
- DTO validation at API boundaries.
- Automated testing.
- Reproducible migrations.
- Secure handling of genomic information.
- Traceable analysis and evidence provenance.

## Project Status

See `docs/product/roadmap.md` for the current development roadmap.

## License

Choose and add an appropriate license before publishing this repository publicly.
