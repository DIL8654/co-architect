# Azure Local Resources

## Purpose

Explain the simple Azure-backed local resource model for the hackathon.

## Current Scope

The app can run locally while pointing to manually created cloud resources.

## Services

- TiDB Cloud
- Azure Blob Storage
- Azure Key Vault as manual secret source
- Azure AI Foundry

## Mock-First Strategy

Stabilize the product with:

```text
ArchitectureAgent__Provider=Mock
```

Then enable Foundry only when the data and storage flow is stable.

## Environment Variables

Key backend variables:

- `DataStore__Provider=TiDB`
- `ConnectionStrings__DefaultConnection`
- `ArchitectureStorage__Provider=AzureBlobSas`
- `ArchitectureStorage__ContainerSasUrl`
- `ArchitectureAgent__Provider=AzureFoundry`
- `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT`
- `AZURE_AI_FOUNDRY_AGENT_ID`
- `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT`

## Validation Checklist

- API health works
- Swagger works
- frontend can call the API
- TiDB persists workspaces and diagrams
- blob upload works
- mock analysis works without Azure credentials

## Future Enhancements

- managed identity
- Azure-hosted deployment automation
- deeper Azure search integration
