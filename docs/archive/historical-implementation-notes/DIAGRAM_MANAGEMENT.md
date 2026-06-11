# Archived Document

This document is historical and is not the current source of truth.

Current source of truth:
- `docs/product/USER_JOURNEYS.md`
- `docs/architecture/DATA_MODEL.md`
- `docs/ai/MULTI_AGENT_REASONING.md`

# Diagram Management Implementation

## Overview

Implemented complete diagram upload and management system with:
- Multi-format image upload (PNG, JPG, JPEG, SVG)
- Architecture description text field
- File validation and preview
- Diagram gallery with metrics
- DELETE support
- REST API integration

## Features Implemented

### UploadDiagramPage

**Location:** `web/src/pages/UploadDiagramPage.tsx`

**Features:**
- Drag-and-drop file upload
- Click to browse file picker
- Real-time file validation
- File preview (image/SVG)
- Diagram name field (auto-filled from filename)
- Architecture description textarea
- Progress indication during upload

**File Validation:**
- Supported formats: PNG, JPG, JPEG, SVG
- Maximum file size: 10MB
- Extension check before upload
- Size validation with error messaging

**Form Fields:**
1. **File Upload**
   - Drag-and-drop zone
   - Click to browse
   - Auto-preview for images
   - Error display for invalid files

2. **Diagram Name** (required)
   - Auto-filled from filename (without extension)
   - Editable by user
   - Trimmed on submit

3. **Architecture Description** (optional)
   - Textarea with placeholder guidance
   - 5 rows height
   - For AI analysis context

**Workflow:**
1. Select file (validation happens immediately)
2. Preview displays if supported
3. Name auto-fills from filename
4. Add optional description
5. Click "Upload Diagram"
6. Navigate to diagram list on success

### DiagramListPage

**Location:** `web/src/pages/DiagramListPage.tsx`

**Display:**
- Table format with 5 columns
- Sortable headers (future enhancement)
- Action buttons for each row

**Columns:**
1. **Title** (bold) - Diagram name
2. **Uploaded By** - User ID (future: user name)
3. **Upload Date** - Formatted date
4. **Architecture Score** - Numeric score 0-100 or "Not scored"
5. **Actions** - View and Delete buttons

**States:**
- **Loading**: Full-screen spinner
- **Error**: Error message with retry
- **Empty**: Prompt to upload first diagram
- **Populated**: Table with all diagrams

**Interactions:**
- View button: Navigate to diagram detail (future)
- Delete button: Delete with confirmation
- Upload Diagram button: Navigate to upload page

## API Integration

### Frontend API Client

**Location:** `web/src/api/diagrams.ts`

```typescript
interface ArchitectureDiagram {
  id: string;
  workspaceId: string;
  uploadedByUserId: string;
  name: string;
  originalFileName: string;
  description?: string;
  uploadedAt: string;
  architectureScore?: number;
}
```

**Methods:**
- `uploadDiagram(data)` - POST /diagrams/upload (multipart/form-data)
- `listDiagrams(workspaceId?)` - GET /diagrams?workspaceId=...
- `getDiagram(id)` - GET /diagrams/{id}
- `deleteDiagram(id)` - DELETE /diagrams/{id}

### Frontend Hooks

**Location:** `web/src/hooks/useDiagrams.ts`

- `useUploadDiagram()` - Mutation for file upload
- `useDiagrams(workspaceId)` - Query for listing (requires workspaceId)
- `useDiagram(diagramId)` - Query for single diagram
- `useDeleteDiagram()` - Mutation for deletion

## Backend API Endpoints

All endpoints prefixed with `/api/diagrams`

### POST /diagrams/upload
**Upload Diagram (Multipart Form)**

Request:
```
Content-Type: multipart/form-data

- workspaceId: Guid
- name: string
- description: string (optional)
- file: File (binary)
```

Response: `ArchitectureDiagramResponse` (201 Created)

Validation:
- Name required (non-empty)
- File required
- File size < 10MB
- File extension in [.png, .jpg, .jpeg, .svg]
- Workspace must exist
- Returns 400 for validation errors

### GET /diagrams
**List Diagrams**

Query Parameters:
- `workspaceId` (optional Guid) - Filter by workspace

Response: `ArchitectureDiagramResponse[]` (200 OK)

### GET /diagrams/{diagramId}
**Get Diagram Details**

Response: `ArchitectureDiagramResponse` (200 OK)
- Returns 404 if not found

### DELETE /diagrams/{diagramId}
**Delete Diagram**

Response: 204 No Content
- Returns 404 if not found

## Backend DTOs

### UploadDiagramRequest
```csharp
{
  WorkspaceId: Guid,
  Name: string,
  Description: string? (nullable),
  File: IFormFile
}
```

### ArchitectureDiagramResponse
```csharp
{
  Id: Guid,
  WorkspaceId: Guid,
  UploadedByUserId: Guid,
  Name: string,
  OriginalFileName: string,
  Description: string?,
  UploadedAt: DateTime (UTC ISO 8601),
  ArchitectureScore: decimal? (nullable, 0-100)
}
```

## Backend Infrastructure

### Repository Interface

**Location:** `CoArchitect.Application.Interfaces.IDiagramRepository`

```csharp
public interface IDiagramRepository
{
    Task<ArchitectureDiagram?> GetByIdAsync(Guid diagramId, CancellationToken cancellationToken);
    Task<IEnumerable<ArchitectureDiagram>> GetByWorkspaceIdAsync(Guid workspaceId, CancellationToken cancellationToken);
    Task<IEnumerable<ArchitectureDiagram>> GetAllAsync(CancellationToken cancellationToken);
    Task<ArchitectureDiagram> AddAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken);
    Task UpdateAsync(ArchitectureDiagram diagram, CancellationToken cancellationToken);
    Task DeleteAsync(Guid diagramId, CancellationToken cancellationToken);
    Task SaveChangesAsync(CancellationToken cancellationToken);
}
```

### Mock Implementation

**Location:** `CoArchitect.Infrastructure.Repositories.MockDiagramRepository`

- In-memory thread-safe dictionary storage
- Filters by workspace ID
- CRUD operations with cancellation token support
- Ready to replace with EF Core + blob storage

### Controller

**Location:** `CoArchitect.Api.Controllers.DiagramsController`

- Multipart form-data upload handling
- File validation (size, extension)
- Workspace existence check
- Workspace isolation (GetByWorkspaceIdAsync)
- TODO: Blob storage integration
- TODO: Authenticated user ID from claims

## Frontend Routes

- `/organizations/:organizationId/workspaces/:workspaceId/diagrams` - List diagrams
- `/organizations/:organizationId/workspaces/:workspaceId/diagrams/upload` - Upload page

## File Upload Specifications

**Supported Formats:**
- PNG (.png)
- JPEG (.jpg, .jpeg)
- SVG (.svg)

**Constraints:**
- Maximum file size: 10MB
- Validated client-side and server-side
- File extension checked on both ends

**Preview Support:**
- Image formats (PNG, JPEG) show thumbnail
- SVG displays as image
- File name shown if preview unavailable

## Architecture Compliance

✅ **Clean Architecture**: Repository pattern for data access
✅ **Interfaces**: IDiagramRepository abstraction
✅ **Async/Await**: All operations async with cancellation tokens
✅ **GUID IDs**: Diagram uses Guid type
✅ **UTC Timestamps**: UploadedAt in UTC
✅ **Error Handling**: Validation on client and server
✅ **Mock Storage**: Thread-safe in-memory for offline development
✅ **Type Safety**: Full TypeScript and C# type coverage
✅ **Workspace Isolation**: Diagrams filtered by workspaceId
✅ **Multipart Handling**: Proper form-data handling with file

## Build Status

✅ Backend: Compiles successfully (0 errors)
✅ Frontend: Builds successfully (159 modules, 16.37KB CSS, 312.50KB JS)

## Data Model Relationships

```
Organization
  ├── Workspaces
      └── Diagrams (1:N)
          ├── Comments (1:N)
          └── AnalysisRuns (1:N)
```

Diagram contains:
- ID (Guid)
- WorkspaceId (Guid) - Foreign key
- UploadedByUserId (Guid) - Foreign key
- Name (string)
- OriginalFileName (string)
- Description (string?) - Optional
- UploadedAt (DateTime UTC)
- Comments (IList<DiagramComment>) - Navigation property
- AnalysisRuns (IList<AgentAnalysisRun>) - Navigation property

## Next Steps

1. Implement diagram detail page with comments
2. Integrate AI analysis scoring
3. Add comment management
4. Create analysis run endpoints
5. Implement blob storage integration
6. Add authentication (user context from claims)
7. Connect to PostgreSQL database
8. Add file download capability
