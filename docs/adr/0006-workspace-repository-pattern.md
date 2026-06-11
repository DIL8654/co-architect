# ADR 0006: Workspace Repository Pattern

**Date:** 2026-06-07

**Status:** Accepted

**Context:**

Organizations contain multiple Workspaces, which are containers for Architecture Diagrams. We need:
1. CRUD operations for workspaces
2. Filtering by organization (organization isolation)
3. Tracking diagram count
4. Local development support without database
5. Clear abstraction for future database implementation

**Decision:**

Implement `IWorkspaceRepository` interface in Application layer with `MockWorkspaceRepository` in Infrastructure layer that:

1. Supports CRUD operations (Create, Read, Update, Delete)
2. Filters workspaces by organization ID
3. Maintains thread-safe in-memory storage
4. Tracks relationships with diagrams via navigation properties
5. Provides same contract for future EF Core implementation

**Rationale:**

- **Abstraction**: Repository pattern separates data access from business logic
- **Organization Isolation**: GetByOrganizationIdAsync enforces tenant boundaries
- **Scalability**: Interface enables database migration without code changes
- **Development**: Mock implementation enables local development and testing
- **Relationships**: Diagram count derived from navigation property (Diagrams.Count)

**Consequences:**

**Positive:**
- API endpoints functional for frontend integration immediately
- Organization isolation enforced at repository level
- Clear abstraction for persistence layer
- Supports proper tenant data segregation

**Negative:**
- In-memory storage lost on restart
- No cross-organization querying optimization
- Mock data doesn't survive deployments

**Alternative Considered:**

Direct API layer access to collections without repository pattern was rejected because:
1. Violates Clean Architecture principle of separation of concerns
2. Makes database migration harder
3. Doesn't enforce organization isolation at data access layer

**Migration Path:**

When EF Core is integrated:
1. Implement `EFCoreWorkspaceRepository : IWorkspaceRepository`
2. Implement `GetByOrganizationIdAsync` with `WHERE OrganizationId == value`
3. Replace MockWorkspaceRepository registration in Program.cs
4. Add database indices on OrganizationId for query performance

**Future Considerations:**

- Add soft delete flag for audit trail
- Implement workspace archival (read-only after archived)
- Add workspace roles (owner, editor, viewer)
- Implement workspace templates
- Add workspace activity logging
