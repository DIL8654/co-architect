# ADR 0003: Organization Isolation and Role Authorization

Status: Accepted

## Context
The product requires organization-scoped authorization and role-based access controls for Reader, Commenter, Writer, and Owner roles.

## Decision
- Introduce `IOrganizationAuthorizationService` in the Application layer.
- Provide an infrastructure implementation that can evolve into system-wide membership checks.
- Ensure the service is registered in API startup for use by endpoint handlers and business logic.

## Consequences
- Future endpoints can enforce organization isolation consistently.
- The application can remain agnostic of authorization storage details.
