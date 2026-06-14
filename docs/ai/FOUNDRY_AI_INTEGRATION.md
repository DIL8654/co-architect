# Foundry AI Integration

## Purpose

Document Azure AI Foundry usage in the current implementation.

## Current Scope

The current MVP uses one cost-aware Azure AI Foundry expert call inside an application-led orchestration flow.

## Provider Configuration

```text
ArchitectureAgent__Provider=AzureFoundry
ArchitectureAgent__EndpointMode=LegacyAgent
AZURE_AI_FOUNDRY_LEGACY_AGENT_ENDPOINT
AZURE_AI_FOUNDRY_API_KEY
AZURE_AI_FOUNDRY_AGENT_ID
AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT
```

Experimental project-endpoint mode remains available with:

```text
ArchitectureAgent__EndpointMode=ProjectEndpoint
AZURE_AI_FOUNDRY_PROJECT_ENDPOINT
AZURE_AI_FOUNDRY_BEARER_TOKEN or managed identity
```

## Current Design

- one external Foundry expert call per analysis run
- local specialist reasoning in application code around grounded context
- fallback to mock provider if Azure configuration is incomplete or intentionally disabled
- stable hackathon mode uses the legacy expert-agent endpoint with API-key authentication
- newer project-endpoint auth and managed retrieval stay opt-in until Azure RBAC is validated cleanly

## Why This Design Is Cost-Aware

- it keeps token and request cost controlled
- it keeps the demo stable
- it makes orchestration visible without requiring many separate hosted agents

## Future Architecture

Future phases may move more specialists into separate Foundry-hosted agents, but the current MVP does not claim that every reasoning stage is hosted in Azure.

## Implementation Notes

See [MULTI_AGENT_REASONING.md](MULTI_AGENT_REASONING.md) and [AZURE_LOCAL_RESOURCES.md](../implementation/AZURE_LOCAL_RESOURCES.md).

## Future Enhancements

- more specialist endpoints when quality or evaluation data justifies it
- richer telemetry around model usage and cost
