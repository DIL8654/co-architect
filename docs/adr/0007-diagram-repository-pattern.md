# ADR 0007: Diagram Repository Pattern and File Upload

**Date:** 2026-06-07

**Status:** Accepted

**Context:**

Architecture diagrams are the core artifact in CoArchitect. We need:
1. CRUD operations for diagram metadata
2. Multipart file upload handling
3. File validation (format and size)
4. Workspace isolation (diagrams belong to workspaces)
5. Support for diagram descriptions for AI analysis
6. Local development without blob storage

**Decision:**

Implement `IDiagramRepository` in Application layer with `MockDiagramRepository` in Infrastructure that:

1. Stores diagram metadata (name, description, upload date, uploader)
2. Filters diagrams by workspace ID
3. Maintains thread-safe in-memory storage
4. Stores files in mock location (future: Azure Blob Storage)
5. Validates file format and size on API layer
6. Supports multipart form-data uploads

**Rationale:**

- **Separation**: Repository abstracts storage details from API logic
- **Validation**: File validation on both client (UX) and server (security)
- **Workspace Isolation**: Query filter enforces tenant boundaries
- **Local Development**: Mock storage enables development without Azure
- **Future Migration**: Interface allows seamless blob storage integration
- **Multipart Handling**: Form-data uploads with file + metadata

**Consequences:**

**Positive:**
- File uploads work locally without blob storage
- Clear metadata storage contract
- Workspace isolation enforced at repository level
- API validation prevents invalid uploads
- Easy to migrate to real blob storage

**Negative:**
- Mock storage doesn't persist files across restarts
- No file versioning in mock implementation
- Mock doesn't simulate blob storage latency
- File cleanup not implemented for mock

**Alternatives Considered:**

**Base64 Encoding:** Rejected because:
1. Inefficient for large files
2. Doubles file size in storage/transmission
3. Not suitable for production use

**Direct File System Storage:** Rejected because:
1. Doesn't scale to cloud deployment
2. Requires shared storage for multiple instances
3. Not suitable for containerization

**Migration Path:**

When Azure Blob Storage is integrated:
1. Implement `AzureBlobDiagramRepository : IDiagramRepository`
2. Store file streams to Azure Blob Storage
3. Implement GetDownloadUrlAsync for file retrieval
4. Update controller to return signed URLs
5. Add blob container creation in startup
6. Mock repository kept for unit testing

**Future Considerations:**

- Implement soft delete for audit trail
- Add file versioning (multiple versions per diagram)
- Implement diagram snapshots for change tracking
- Add file metadata extraction (dimensions, colors, layers)
- Implement virus scanning for uploaded files
- Add compression for storage efficiency
- Implement access control per diagram
