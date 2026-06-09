# Auth Decision

## Current Stage

CoArchitect AI currently runs as an unauthenticated public MVP flow for the hackathon demo.

## Reason

The hackathon MVP must demonstrate the core product value without auth friction: create organizations and workspaces, add architecture descriptions, comment, run analysis, and view the Architecture Intelligence Score.

## Current Behavior

- All MVP features are accessible without login.
- The frontend does not send tokens or auth headers.
- The backend does not enforce authentication or authorization.
- Application auth checks must not return 401 or 403.
- User, OrganizationUser, OrganizationRole, and role enums may remain as domain concepts, but they are not runtime access gates.

## Internal System User

Records that require a user id use an internal audit placeholder:

- Id: `00000000-0000-0000-0000-000000000001`
- Email: `system@coarchitect.ai`
- Display name: `CoArchitect System User`

This is not login or authentication. It is only a temporary audit placeholder.

## Future Plan

After the MVP, add:

- External IdP integration
- Real user profiles
- Organization membership
- Organization-scoped RBAC
- Production-grade authorization checks

Do not reintroduce fake demo auth or header-based role overrides.
