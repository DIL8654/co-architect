# Auth Decision

## Current Stage

CoArchitect AI currently runs as an unauthenticated local tenant-scoped MVP flow for the hackathon demo.

## Reason

The hackathon MVP must demonstrate the core product value without auth friction: open the app, create workspaces, upload diagrams or descriptions, run architecture analysis, inspect findings, and generate ADRs.

## Current Behavior

- All MVP features are accessible without login.
- The frontend does not send tokens or auth headers.
- The backend does not enforce authentication or authorization.
- Application auth checks must not return 401 or 403.
- The user-facing Organization concept is removed from the product flow.
- Workspaces are the top-level user-facing container.
- Tenant scoping still exists internally, but it is driven by a fixed local placeholder context instead of a JWT token.
- User, OrganizationUser, OrganizationRole, and role enums may remain as domain concepts, but they are not runtime access gates.

## Fixed Local Context

The local runtime uses one fixed placeholder tenant and one fixed placeholder user:

- Tenant id: `00000000-0000-0000-0000-000000000101`
- User id: `00000000-0000-0000-0000-000000000001`
- Email: `local-admin@coarchitect.ai`
- Display name: `CoArchitect Local Admin`
- Roles: `coarchitect.admin`, `coarchitect.reader`

Records that require a user id use this local placeholder context:

- This is not login or authentication.
- This is not a public identity feature.
- This is only a temporary tenant-scoped local runtime seam.

## Future Placeholder Seams

Future Frontegg and JWT-related helper types may remain in the codebase as inert placeholders if they do not affect startup or runtime behavior.

## Future Plan

After the MVP, add:

- Frontegg hosted login or another external IdP integration
- Real user profiles
- Tenant-aware identity extraction from JWT claims
- Real role-based access control
- Production-grade authorization checks

Do not reintroduce fake demo auth or header-based role overrides.
