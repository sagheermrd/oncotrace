# OncoTrace — API Conventions

## 1. Base URL

All API routes use the versioned prefix:

/api/v1

## 2. Resource Naming

Use plural resource names and lowercase paths.

Examples:

- /api/v1/cases
- /api/v1/cases/:caseId
- /api/v1/cases/:caseId/samples
- /api/v1/samples/:sampleId
- /api/v1/samples/:sampleId/input-files

## 3. HTTP Methods

| Method | Purpose                                      |
| ------ | -------------------------------------------- |
| GET    | Retrieve resources                           |
| POST   | Create resources or initiate actions         |
| PATCH  | Partially update resources                   |
| PUT    | Replace a resource when appropriate          |
| DELETE | Delete a resource when deletion is permitted |

## 4. HTTP Status Codes

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 200  | Successful retrieval or update                        |
| 201  | Resource created                                      |
| 202  | Asynchronous operation accepted                       |
| 204  | Successful operation without response body            |
| 400  | Invalid request                                       |
| 401  | Authentication required                               |
| 403  | Insufficient permission                               |
| 404  | Resource not found or inaccessible                    |
| 409  | Conflict with existing state or constraint            |
| 422  | Semantically invalid request, if adopted consistently |
| 500  | Unexpected server error                               |

## 5. Request Validation

- Use DTO classes.
- Validate required fields.
- Validate string length.
- Validate enum values.
- Reject unexpected properties.
- Transform incoming values only where appropriate.

The global ValidationPipe is configured with whitelist, forbidNonWhitelisted, and transform behavior.

## 6. Tenant Context

Organization IDs must be resolved from authenticated membership context.

Clients must not be allowed to select arbitrary organizations simply by supplying an organizationId.

## 7. Pagination

Collections should use cursor-based pagination where large result sets are expected.

Example:

GET /api/v1/cases?limit=20

Subsequent request:

GET /api/v1/cases?limit=20&cursor=<opaque-cursor>

Example response:

```json
{
  "items": [],
  "page": {
    "limit": 20,
    "hasNextPage": false,
    "nextCursor": null
  }
}
```

The actual response must follow the implemented controller and DTO contract.

Pagination should use deterministic ordering.

## 8. Error Responses

Use a consistent error structure.

Example:

```json
{
  "statusCode": 400,
  "message": ["name must be a string"],
  "error": "Bad Request"
}
```

Do not expose database stack traces or internal implementation details.

## 9. API Documentation

OpenAPI/Swagger documentation is planned.

It should describe:

- Endpoint purpose.
- Authentication requirements.
- Request DTOs.
- Response schemas.
- Error responses.
- Pagination.
- Authorization behavior.

## 10. Compatibility

Breaking changes should be handled through explicit API versioning or a documented migration strategy.
