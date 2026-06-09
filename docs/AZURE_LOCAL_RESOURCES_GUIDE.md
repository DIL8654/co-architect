# Azure Local Resources Guide

This guide describes the simple hackathon setup where CoArchitect runs locally while using manually created Azure resources.

The goal is not full infrastructure automation. The goal is a working MVP that can be tested locally against Azure PostgreSQL, Azure Blob Storage, Azure Key Vault, and later Azure AI Foundry.

## Target Setup

| Part | Local App Uses | Azure Resource |
|------|----------------|----------------|
| API | `http://localhost:5010` | Later App Service or Container Apps |
| Frontend | `http://localhost:5173` | Later Static Web Apps or Storage static website |
| Database | `DataStore__Provider=Postgres` | Azure Database for PostgreSQL Flexible Server |
| Diagram files | `ArchitectureStorage__Provider=AzureBlobSas` | Azure Storage Blob container |
| Secrets | Environment variables exported locally | Azure Key Vault |
| AI | `ArchitectureAgent__Provider=Mock` first | Later Azure AI Foundry |

## Minimal Azure Resources

Create these manually in one Azure subscription/resource group:

1. Azure Database for PostgreSQL Flexible Server.
2. Azure Storage Account with one private blob container.
3. Azure Key Vault for secrets.
4. Azure AI Foundry project and model deployment when you are ready to test real AI.
5. App Service or Container Apps only after local Azure-backed testing is stable.

Keep cost low:

- Use the smallest PostgreSQL SKU that works for the demo.
- Stop or scale down resources when not testing.
- Keep blob storage on standard locally redundant storage.
- Use mock AI until the rest of the flow is stable.
- Avoid provisioning production networking until the MVP needs it.

## PostgreSQL

Create a database named:

```text
coarchitect
```

Allow local access from your current public IP address in the PostgreSQL firewall settings.

Store the connection string in Key Vault as:

```text
coarchitect-postgres-connection-string
```

Local environment variable:

```bash
DataStore__Provider=Postgres
ConnectionStrings__DefaultConnection='Host=<server>.postgres.database.azure.com;Port=5432;Database=coarchitect;Username=<user>;Password=<password>;Ssl Mode=Require;Trust Server Certificate=true'
```

The API creates its MVP JSONB object table automatically on first use.

## Blob Storage

Create a private container, for example:

```text
architecture-diagrams
```

For the hackathon MVP, create a short-lived container SAS token with write permission. Store the full container SAS URL in Key Vault as:

```text
coarchitect-blob-container-sas-url
```

Local environment variables:

```bash
ArchitectureStorage__Provider=AzureBlobSas
ArchitectureStorage__ContainerSasUrl='https://<account>.blob.core.windows.net/architecture-diagrams?<sas-token>'
```

Uploaded diagram files are stored under:

```text
orgs/{orgId}/workspaces/{workspaceId}/diagrams/{diagramId}/original/{fileName}
```

This SAS approach is intentionally simple for the MVP. Replace it with Managed Identity or user delegation SAS before production.

## Key Vault

Use Key Vault as the manual secret source of truth.

Suggested secrets:

```text
coarchitect-postgres-connection-string
coarchitect-blob-container-sas-url
coarchitect-foundry-project-endpoint
coarchitect-foundry-agent-id
coarchitect-foundry-model-deployment
```

For local development, copy secret values from Key Vault into `backend/.env`. The app currently reads environment variables directly; it does not load Key Vault at runtime.

## Azure AI Foundry

Keep local testing on mock AI until the database and storage flow is stable:

```bash
ArchitectureAgent__Provider=Mock
```

When ready to test Foundry, configure:

```bash
ArchitectureAgent__Provider=AzureFoundry
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT='<foundry-project-endpoint>'
AZURE_AI_FOUNDRY_AGENT_ID='<agent-id>'
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT='<deployment-name>'
```

If Foundry configuration is incomplete, the API falls back to mock analysis. The AI agent suggests architecture maturity; the application scoring service calculates the final Architecture Intelligence Score.

## Run Locally Against Azure

Backend:

```bash
cd backend
cp .env.example .env
# Edit .env with database, blob, and Foundry settings.
docker compose up --build
```

Frontend:

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

`web/.env` should contain:
Frontend runtime values are loaded from `backend/.env`. Keep `VITE_API_BASE_URL` there:

```text
VITE_API_BASE_URL=http://localhost:5010
```

Open:

```text
http://localhost:5173
```

## Validation Checklist

- `http://localhost:5010/health` returns healthy.
- `http://localhost:5010/swagger` loads.
- `http://localhost:5173/health` shows database, blob storage, and Foundry status.
- Frontend loads at `http://localhost:5173`.
- Organization creation persists after API restart when using Azure PostgreSQL.
- Diagram file upload creates a blob in the Azure container.
- Comments can be added.
- Mock analysis returns a score, missing components, recommendations, and trade-offs.
- Browser requests from `http://localhost:5173` are not blocked by CORS.

## Later Deployment

After local Azure-backed testing is stable:

1. Deploy the API to Azure App Service or Container Apps.
2. Move settings from local env vars into App Service or Container Apps configuration.
3. Use Key Vault references or Managed Identity where possible.
4. Deploy the frontend to Azure Static Web Apps or Storage static website.
5. Set `VITE_API_BASE_URL` to the deployed API URL at frontend build time.
6. Add the deployed frontend origin to API CORS settings.

Do not add fake demo auth or header-based role overrides. Real external IdP and organization-scoped RBAC are planned after the hackathon MVP.
