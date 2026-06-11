# Archived Document

This document is historical and is not the current source of truth.

Current source of truth:
- `docs/product/HACKATHON_SCOPE.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/ux/NAVIGATION_MODEL.md`

# Organization Management Implementation

## Overview

Implemented complete organization management system with:
- Organization creation with validation
- Organization listing with member counts and roles
- API integration for CRUD operations
- Frontend pages for setup and management
- Real-time slug availability checking

## Features Implemented

### OrganizationSetupPage

**Location:** `web/src/pages/OrganizationSetupPage.tsx`

**Functionality:**
- Create new organizations with Name and Slug fields
- Auto-generate slug from organization name (lowercase, kebab-case)
- Real-time slug availability validation via API
- Form validation with user-friendly error messages
- Submit button disabled until all validations pass
- Navigation to organizations list on success

**Form Fields:**
1. **Organization Name** (required)
   - Placeholder: "Acme Corp"
   - Minimum length: 1 character
   - Auto-generates slug on change

2. **Slug** (required, unique)
   - Placeholder: "acme-corp"
   - Minimum length: 3 characters
   - Sanitized to lowercase alphanumeric and hyphens
   - Real-time availability check via `useCheckSlug` hook

**Error States:**
- Missing organization name
- Missing or short slug
- Slug already taken
- Server-side creation errors

### OrganizationListPage

**Location:** `web/src/pages/OrganizationListPage.tsx`

**Functionality:**
- Display all organizations in tabular format
- Show organization name, slug, member count, creation date
- Action button to view organization details
- Create new organization button
- Loading, error, and empty states

**Display Columns:**
1. **Name** - Organization display name (bold)
2. **Slug** - Unique identifier (code formatted)
3. **Members** - Count of organization members (badge)
4. **Created** - Creation date (formatted)
5. **Actions** - View button (ghost variant)

**States:**
- **Loading State:** Full-screen spinner with message
- **Error State:** Error message with retry button
- **Empty State:** Prompt to create first organization
- **Populated State:** Table with all organizations

## API Integration

### Endpoints

All endpoints prefixed with `/api/organizations`

#### POST /organizations
**Create Organization**
- Request: `{ name: string, slug: string }`
- Response: `OrganizationResponse`
- Validation:
  - Name and slug required
  - Slug must be unique
  - Returns 400 for validation errors

#### GET /organizations
**List Organizations**
- Response: `OrganizationResponse[]`
- Returns all organizations with member counts

#### GET /organizations/{organizationId}
**Get Organization Details**
- Response: `OrganizationResponse`
- Returns 404 if not found

#### GET /organizations/slug/{slug}/available
**Check Slug Availability**
- Response: `boolean`
- Returns true if slug is available, false if taken

### DTOs

**CreateOrganizationRequest**
```csharp
{
  Name: string,
  Slug: string
}
```

**OrganizationResponse**
```csharp
{
  Id: string (GUID),
  Name: string,
  Slug: string,
  CreatedAt: string (ISO 8601 UTC),
  MemberCount: int
}
```

## Frontend Hooks

### `useCreateOrganization()`
**Location:** `web/src/hooks/useOrganizations.ts`

Mutation hook for creating organizations.
- Handles async creation
- Manages loading and error states
- Returns `mutate` and `mutateAsync` functions

### `useOrganizations()`
**Location:** `web/src/hooks/useOrganizations.ts`

Query hook for fetching all organizations.
- Enables automatic caching via React Query
- Supports refetch on error
- Returns `data`, `isLoading`, `isError`

### `useCheckSlug(slug: string)`
**Location:** `web/src/hooks/useOrganizations.ts`

Query hook for slug availability checking.
- Only enabled when slug is non-empty
- Debounced by React Query
- Returns `data: boolean` (true = available, false = taken)

## API Client

**Location:** `web/src/api/organizations.ts`

Provides typed API methods:
- `createOrganization(data)` - Create organization
- `listOrganizations()` - Get all organizations
- `getOrganization(id)` - Get single organization
- `checkSlugAvailable(slug)` - Check slug uniqueness

Uses Axios with configurable base URL from `VITE_API_BASE_URL` environment variable.

## Backend Implementation

### Repository Pattern

**Interface:** `CoArchitect.Application.Interfaces.IOrganizationRepository`

```csharp
public interface IOrganizationRepository
{
    Task<Organization?> GetByIdAsync(Guid organizationId, CancellationToken cancellationToken);
    Task<Organization?> GetBySlugAsync(string slug, CancellationToken cancellationToken);
    Task<IEnumerable<Organization>> GetAllAsync(CancellationToken cancellationToken);
    Task<bool> SlugExistsAsync(string slug, CancellationToken cancellationToken);
    Task<Organization> AddAsync(Organization organization, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
```

**Implementation:** `CoArchitect.Infrastructure.Repositories.MockOrganizationRepository`

- In-memory storage with thread-safe dictionary
- Supports local development without database
- Ready to replace with EF Core implementation

### Controller

**Location:** `CoArchitect.Api.Controllers.OrganizationsController`

Implements RESTful endpoints with:
- Model validation
- Slug uniqueness checking
- Proper HTTP status codes (201 Created, 400 Bad Request, 404 Not Found)
- Async/await pattern with cancellation tokens

## Frontend Navigation Updates

Updated `AppLayout.tsx` to:
- Include "Organizations" in navigation menu
- Add navigation links to all menu items
- Use React Router for client-side routing
- Integrate organization switcher

## Routes

**Frontend Routes (React Router):**
- `/organizations` - List organizations
- `/organizations/new` - Create organization form

## Architecture Compliance

✅ **Clean Architecture**: Repository pattern abstracts data access
✅ **Interfaces**: API client encapsulated, repository abstraction
✅ **Async/Await**: All async methods with cancellation tokens
✅ **GUID IDs**: Organization uses Guid type
✅ **UTC Timestamps**: CreatedAt stored in UTC
✅ **Error Handling**: Proper HTTP status codes and validation
✅ **Local Development**: Mock repository for offline development
✅ **Type Safety**: Full TypeScript and C# type coverage

## Environment Variables

**Frontend:**
```
VITE_API_BASE_URL=http://localhost:5010
```

## Build Status

✅ Backend: Compiles successfully (0 errors, 0 warnings)
✅ Frontend: Builds successfully (150 modules, 12KB CSS, 232KB JS)

## Next Steps

1. Implement Workspace management pages
2. Add user/member management endpoints
3. Implement diagram upload and storage
4. Create analysis run endpoints
5. Add authentication middleware
6. Connect to real database (PostgreSQL)
