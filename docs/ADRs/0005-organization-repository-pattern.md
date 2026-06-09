# ADR 0005: Organization Repository Pattern

**Date:** 2026-06-07

**Status:** Accepted

**Context:**

We need to implement organization management with CRUD operations while maintaining Clean Architecture boundaries and enabling local development without a database.

The Application layer needs an abstraction for data access, but we don't yet have a database schema or Entity Framework Core setup. However, we want to:
1. Keep the API endpoints functional for frontend integration testing
2. Maintain separation of concerns with repository pattern
3. Enable future database implementation without changing Application or API layers
4. Support both memory-based and persistence-based storage strategies

**Decision:**

Implement `IOrganizationRepository` interface in the Application layer with a `MockOrganizationRepository` implementation in Infrastructure layer that:

1. Uses thread-safe in-memory dictionary storage for local development
2. Provides the same interface contract as future EF Core repository
3. Implements all CRUD operations asynchronously with cancellation token support
4. Supports slug uniqueness validation before persistence
5. Is registered via dependency injection and can be swapped for database implementation

**Rationale:**

- **Abstraction**: IOrganizationRepository abstracts storage details from Application layer
- **Testability**: Mock implementation enables testing without database
- **Scalability**: Interface allows seamless migration to EF Core/database
- **Architecture Compliance**: Follows Clean Architecture principle of dependency inversion
- **Development**: Enables frontend development and integration testing offline
- **Thread Safety**: Concurrent request handling with lock synchronization

**Consequences:**

**Positive:**
- API endpoints work immediately without database setup
- Frontend can build and test against live mock API
- Easy to migrate to real database implementation
- Proper async/await pattern established early

**Negative:**
- In-memory storage is lost on application restart
- No persistence across deployments
- Mock data doesn't survive production restarts (acceptable for this phase)

**Migration Path:**

When PostgreSQL is integrated:
1. Implement `EFCoreOrganizationRepository : IOrganizationRepository`
2. Register EF Core implementation in Program.cs instead of Mock
3. No changes needed to API controllers or Application logic
4. Mock repository can be kept for unit testing

**Future Considerations:**

- Add database migrations with Entity Framework Core
- Implement actual slug uniqueness constraint in database
- Add query optimization indices
- Implement soft deletes for audit trail
