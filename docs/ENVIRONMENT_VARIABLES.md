# Environment Variables

## API Environment Variables

| Variable | Description | Local Value | Cloud Value | Secret? |
|----------|-------------|-------------|-------------|---------|
| `ASPNETCORE_ENVIRONMENT` | Runtime environment | `Development` | `Production` | No |
| `DataStore__Provider` | Data store provider: `TiDB` or `Mock` | `TiDB` | `TiDB` | No |
| `ArchitectureStorage__Provider` | File storage provider: `None` or `AzureBlobSas` | `None` | `AzureBlobSas` | No |
| `ArchitectureStorage__ContainerSasUrl` | Azure Blob container SAS URL for diagram uploads | empty | container SAS URL or replaced by managed identity implementation | Yes |
| `ArchitectureAgent__Provider` | Force architecture analysis provider | `Mock` | `AzureFoundry` | No |
| `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT` | AI Foundry project URL | empty for mock | `https://<project>.api.azureml.ms` | No |
| `AZURE_AI_FOUNDRY_AGENT_ID` | Agent identifier | empty for mock | `<agent-guid>` | No |
| `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT` | Model deployment name | empty for mock | `<deployment>` | No |
| `AZURE_CLIENT_ID` | App registration client ID | empty | `<client-id>` | No |
| `AZURE_CLIENT_SECRET` | App registration secret | empty | `<secret>` | Yes |
| `AZURE_TENANT_ID` | Azure tenant | empty | `<tenant-id>` | No |
| `ConnectionStrings__DefaultConnection` | TiDB connection | `Server=<tidb-host>;Port=4000;Database=coarchitect;User=<user>;Password=<password>;SslMode=Preferred;` | TiDB connection string | Yes |
| `Cors__AllowedOrigins__0` | First allowed CORS origin | `http://localhost:5173` | frontend URL | No |
| `Cors__AllowedOrigins__1` | Second allowed CORS origin | `http://127.0.0.1:5173` | optional | No |

## Frontend Environment Variables

| Variable | Description | Local Value | Cloud Value | Secret? |
|----------|-------------|-------------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API server root | `http://localhost:5010` | deployed API URL | No |
| `VITE_APP_ENV` | App environment label | `development` | `production` | No |

## Auth Notes

The current MVP has no auth configuration. Do not add fake demo auth flags or frontend auth headers.

Future production work should add external IdP and RBAC configuration deliberately as part of the post-MVP auth implementation.

## Secrets

- Use local `.env` files for non-secret local settings.
- Use `dotnet user-secrets` or environment variables for backend secrets during local development.
- Store cloud secrets in Azure Key Vault or the hosting platform's secret store.
- For Azure-backed local testing, copy Key Vault secret values into local environment variables before starting Docker Compose.
- Never put secrets in frontend `VITE_` variables because they are embedded in client bundles.

## Azure-Backed Local Notes

Use `docs/AZURE_LOCAL_RESOURCES_GUIDE.md` when pointing the local app at Azure resources.

Typical backend settings:

```bash
DataStore__Provider=TiDB
ConnectionStrings__DefaultConnection='Server=<tidb-host>;Port=4000;Database=coarchitect;User=<user>;Password=<password>;SslMode=Preferred;'
ArchitectureStorage__Provider=AzureBlobSas
ArchitectureStorage__ContainerSasUrl='https://<account>.blob.core.windows.net/architecture-diagrams?<sas-token>'
ArchitectureAgent__Provider=Mock
```

## AI Provider Notes

- `ArchitectureAgent__Provider=Mock` forces local mock analysis.
- If Azure AI configuration is incomplete, the API falls back to `MockArchitectureAgentService`.
- The AI provider does not calculate the final score; the application scoring service does.
