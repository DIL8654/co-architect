# CoArchitect AI Architecture

## Backend

- .NET 10
- Clean Architecture
- Folder: `backend/src/api`

Projects:

- `CoArchitect.Domain`
- `CoArchitect.Application`
- `CoArchitect.Infrastructure`
- `CoArchitect.Api`

## Frontend

- React
- TypeScript
- Vite

## Local Runtime

- API Docker host URL: http://localhost:5010
- Frontend Vite URL: http://localhost:5173
- Mock AI provider by default
- In-memory repositories for the current local MVP

## Azure-Backed Local Runtime

The API can run locally while using Azure services:

- `DataStore__Provider=Postgres` uses Azure Database for PostgreSQL or local PostgreSQL.
- `ArchitectureStorage__Provider=AzureBlobSas` uploads diagram files to an Azure Blob container SAS URL.
- `ArchitectureAgent__Provider=Mock` keeps analysis local until Azure AI Foundry is configured.

Secrets are read from environment variables. Azure Key Vault is the manual secret source for the hackathon MVP; the app does not load Key Vault directly at runtime yet.

See `docs/AZURE_LOCAL_RESOURCES_GUIDE.md`.

## Auth Architecture

The current MVP has no runtime authentication or authorization enforcement.

The API uses `SystemCurrentUserService` only as an internal audit placeholder when records need a user id. This is not authentication.

Future production architecture will add external IdP integration, real users, organization memberships, and organization-scoped RBAC. See `docs/AUTH_DECISION.md`.

## Storage Paths

Diagram originals:

```text
orgs/{orgId}/workspaces/{workspaceId}/diagrams/{diagramId}/original/{fileName}
```

Analysis reports:

```text
orgs/{orgId}/workspaces/{workspaceId}/analysis/{analysisId}/report.json
```
