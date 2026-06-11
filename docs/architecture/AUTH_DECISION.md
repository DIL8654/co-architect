# Auth Decision

## Purpose

Document the current authentication and authorization decision.

## Current Scope

The hackathon MVP is intentionally unauthenticated.

## Design Decisions

- no login page
- no JWT validation
- no bearer token requirement
- no runtime authorization enforcement
- no application 401 or 403 responses caused by auth checks
- workspace is the top-level user-facing object
- tenant is an internal runtime boundary, not a user-facing object

## Fixed Local Placeholder Context

The local runtime uses:

- tenant id `00000000-0000-0000-0000-000000000101`
- user id `00000000-0000-0000-0000-000000000001`
- email `local-admin@coarchitect.ai`
- display name `CoArchitect Local Admin`

This is a local runtime seam, not a public identity feature.

## Implementation Notes

The backend and frontend must remain easy for evaluators to run locally. Future identity work should not be mixed into current hackathon scope.

## Future Enhancements

- external IdP
- real users
- tenant-aware identity extraction
- RBAC
