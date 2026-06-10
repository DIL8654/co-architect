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

## Reasoning Architecture

The current runtime now uses application-led multi-agent orchestration for architecture review.

Current orchestration:

Planner -> Single Foundry Expert Call -> Framework Specialists -> Trade-off Balancer -> Critic -> Scoring

Current specialist roles:

- Azure Well-Architected Agent
- AWS Well-Architected Agent
- ISO 25010 Quality Agent
- OWASP ASVS Agent
- Trade-off Balancing Agent
- Critic / Verifier Agent

The current implementation keeps the planner, specialists, trade-off balancer, and critic inside the application runtime and uses one cost-aware Azure Foundry call as expert input. The final Architecture Intelligence Score is still calculated in application code.

See `docs/REASONING_AGENTS_PLAN.md`.

## Local Runtime

- API Docker host URL: http://localhost:5010
- Frontend Vite URL: http://localhost:5173
- Mock AI provider by default
- Relational persistence for TiDB
- In-memory repositories only for local mock mode

## Azure-Backed Local Runtime

The API can run locally while using Azure services:

- `DataStore__Provider=TiDB` uses TiDB Cloud.
- `ArchitectureStorage__Provider=AzureBlobSas` uploads diagram files to an Azure Blob container SAS URL.
- `ArchitectureAgent__Provider=Mock` keeps analysis local until Azure AI Foundry is configured.

Secrets are read from environment variables. Azure Key Vault is the manual secret source for the hackathon MVP; the app does not load Key Vault directly at runtime yet.

See `docs/AZURE_LOCAL_RESOURCES_GUIDE.md`.

## Grounded Knowledge Layer

The planned grounded knowledge base lives under `docs/knowledge-base/`.

This is the intended Foundry IQ-style grounding layer for the hackathon reasoning demo.

Planned knowledge artifacts:

- framework summaries
- ADR template
- trade-off principles
- synthetic architecture examples
- reasoning evaluation rubric

See `docs/KNOWLEDGE_BASE_PLAN.md`.

## Semantic Model Direction

The future reasoning layer should model the following entities explicitly:

- Architecture
- Component
- Quality Attribute
- Risk
- Control
- Framework
- Principle
- Decision
- ADR
- Recommendation

This aligns the product with a Fabric IQ-style semantic layer concept, even before deeper data platform integration.

## Auth Architecture

The current MVP has no runtime authentication or authorization enforcement.

The API uses `LocalCurrentUserService` as a fixed tenant and user placeholder for local hackathon runtime. This is not authentication.

Future production architecture will add external IdP integration, real users, tenant-aware identity extraction, and RBAC. See `docs/AUTH_DECISION.md`.

## Relational Schema

The current TiDB runtime creates and uses these product tables:

- `coarchitect_organizations`
- `coarchitect_workspaces`
- `coarchitect_diagrams`
- `coarchitect_diagram_comments`
- `coarchitect_analysis_runs`
- `coarchitect_adrs`
- `coarchitect_adr_versions`

`coarchitect_workspaces` is shifting from `organization_id` semantics toward `tenant_id` semantics. The old organization model may remain as compatibility scaffolding, but it is no longer the product boundary.

Legacy object-store data may still be read as a compatibility fallback while the relational schema becomes the main runtime persistence model.

## Storage Paths

Diagram originals:

```text
tenants/{tenantId}/workspaces/{workspaceId}/diagrams/{diagramId}/original/{fileName}
```

Analysis reports:

```text
tenants/{tenantId}/workspaces/{workspaceId}/analysis/{analysisId}/report.json
```

ADR exports:

```text
tenants/{tenantId}/workspaces/{workspaceId}/diagrams/{diagramId}/adrs/{adrId}/exports/{adrId}.pdf
```
