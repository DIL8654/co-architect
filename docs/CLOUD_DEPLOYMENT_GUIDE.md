# Cloud Deployment Guide

## Current Status

The current hackathon MVP is unauthenticated. It is suitable for local demos and controlled preview environments only.

Before customer or production deployment, add external IdP integration and organization-scoped RBAC as described in `docs/AUTH_DECISION.md`.

Before deploying the app itself, validate the MVP locally against TiDB and Azure Blob Storage using `docs/AZURE_LOCAL_RESOURCES_GUIDE.md`.

## Azure Resources Needed

| Resource | Purpose |
|----------|---------|
| Azure App Service or Container Apps | Host the .NET API |
| Azure Static Web Apps or Storage + CDN | Host the React frontend |
| TiDB Cloud | Production database |
| Azure Storage Account | Blob storage for diagrams |
| Azure AI Foundry | AI architecture analysis agent |
| Azure Key Vault | Secret management |

## Azure AI Foundry Setup

1. Create an Azure AI Foundry project.
2. Deploy a model.
3. Create an architecture analysis agent with the project system prompt.
4. Record the project endpoint, agent id, and model deployment name.
5. Create an App Registration or managed identity for service access.

## Storage Setup

1. Create a Storage Account.
2. Create a container for architecture diagrams.
3. For the MVP, store a container SAS URL securely.
4. Replace SAS with Managed Identity or user delegation SAS before production.

## TiDB Setup

1. Create a TiDB Cloud cluster.
2. Configure firewall rules to allow the API host.
3. Create a database named `coarchitect`.
4. Store the connection string securely.

## API Hosting

Options:

- Azure App Service with .NET 10 runtime
- Azure Container Apps with the API Docker image

Configure environment variables from `docs/ENVIRONMENT_VARIABLES.md`.

For the MVP Azure-backed configuration, set:

```text
DataStore__Provider=TiDB
ArchitectureStorage__Provider=AzureBlobSas
ArchitectureAgent__Provider=Mock
```

## Frontend Hosting

Options:

- Azure Static Web Apps
- Azure Storage static website with CDN

Set `VITE_API_BASE_URL` at build time to the deployed API root.

## CORS Setup

In API configuration, add the deployed frontend origin:

```json
{
  "Cors": {
    "AllowedOrigins": [
      "https://your-frontend.example.com"
    ]
  }
}
```

Or set:

```text
Cors__AllowedOrigins__0=https://your-frontend.example.com
```

## Security Notes

- Never commit secrets.
- Store secrets in Azure Key Vault or the hosting platform secret store.
- Use Managed Identity where possible.
- Enable HTTPS for all endpoints.
- Restrict TiDB firewall access to the API host.
- Rotate secrets periodically.
- Treat the current unauthenticated MVP as a temporary stage.
- Add external IdP and RBAC before production or customer use.
