# ADR 0002: Azure AI Foundry Fallback

Status: Accepted

## Context
Local development must work without Azure credentials. The platform supports Azure AI Foundry for production-grade analysis.

## Decision
- Use `AzureFoundryArchitectureAgentService` when all required Azure AI Foundry configuration values are provided.
- Fall back to `MockArchitectureAgentService` when configuration is incomplete.
- Keep the fallback behavior in the API startup registration.

## Consequences
- Local development can run without Azure credentials.
- Production deployments can opt in by setting the required environment variables.
