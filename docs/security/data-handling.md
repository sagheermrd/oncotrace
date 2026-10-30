# OncoTrace — Security and Data Handling

## 1. Purpose

Genomic information can be highly sensitive and may be linkable to individuals. The platform must therefore be designed with privacy and security in mind, even when initially using synthetic portfolio data.

## 2. Authentication

The production system must use a secure authentication mechanism.

The current development authentication guard provides fixed development identity information.

It must not be used as production authentication.

Production authentication must:

- Validate the identity of the requester.
- Resolve the authenticated user.
- Establish the active organization context.
- Reject unauthenticated requests.
- Avoid trusting user or organization identifiers supplied by the client.

## 3. Authorization

Every organization-owned resource must be checked against the current organization context.

Examples:

- Research cases.
- Samples.
- Input files.
- Analysis jobs.
- Variants.
- Reports.

Authorization must be enforced in the application layer.

Database constraints provide additional protection against inconsistent relationships.

## 4. Tenant Isolation

The organization identifier must be derived from trusted authentication and membership context.

A client must not be able to gain access to another organization's data by changing an organization ID in a request.

Queries must include the organization boundary where appropriate.

For inaccessible resources, the API should generally return HTTP 404 to avoid revealing whether another organization's resource exists.

## 5. Genomic File Security

Genomic file contents must be stored in private object storage.

Requirements:

- No public bucket access.
- Server-controlled storage keys.
- Authorized upload and download operations.
- Short-lived signed URLs.
- File size restrictions.
- Allowed file-type validation.
- Checksum verification.
- Controlled deletion and retention.
- Secure handling of incomplete uploads.

File names and extensions alone must not be trusted to determine actual content type.

## 6. Sensitive Information

Avoid placing sensitive genomic content in:

- Application logs.
- Error messages.
- URLs.
- Analytics events.
- Public repositories.
- Unrestricted file-sharing locations.

Use synthetic or appropriately anonymized data in development and portfolio demonstrations.

Removing direct identifiers alone does not guarantee that genomic data is anonymous.

## 7. Secrets Management

- Keep credentials in environment variables or a secrets manager.
- Never commit production secrets.
- Maintain `.env.example` with placeholders only.
- Rotate credentials when exposure is suspected.
- Restrict storage and database permissions.

## 8. Database Security

- Use least-privilege database credentials.
- Keep production database access restricted.
- Use TLS where required by the deployment environment.
- Back up important data.
- Test restoration procedures.
- Apply migrations through controlled deployment processes.

## 9. Auditability

Future sensitive operations should produce audit events, including:

- Resource creation.
- Resource updates.
- File upload and deletion.
- Analysis submission.
- Report generation.
- Access to sensitive records where justified.

Audit records should identify the actor, organization, action, resource, and timestamp.

Avoid storing unnecessary sensitive content in audit payloads.

## 10. Privacy and Regulatory Considerations

Before processing real patient or clinical genomic data, the project would require an appropriate assessment of applicable privacy, security, and regulatory obligations.

Depending on the intended deployment and use, this may include GDPR, data protection impact assessment, contractual controls, retention policies, and additional clinical or medical-device requirements.

The portfolio implementation does not claim regulatory compliance or clinical validation.

## 11. Security Review Checklist

- [ ] Production authentication replaces development authentication.
- [ ] Organization membership is verified.
- [ ] Tenant boundaries are tested.
- [ ] Private storage is configured.
- [ ] Signed URLs are short-lived.
- [ ] Input validation is enforced.
- [ ] Secrets are excluded from Git.
- [ ] Sensitive information is excluded from logs.
- [ ] Database backups and restoration are tested.
- [ ] Audit requirements are implemented.
