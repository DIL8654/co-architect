# Archived Document

This document is historical and is not the current source of truth.

Current source of truth:
- `docs/product/PRODUCT_VISION.md`
- `docs/product/HACKATHON_SCOPE.md`
- `docs/architecture/SYSTEM_ARCHITECTURE.md`

# CoArchitect AI Product Memory

## Vision

CoArchitect AI is a multi-agent reasoning platform for collaborative architecture improvement.

It acts as an AI Architecture Partner helping engineering teams design, review, explain, and improve software architecture through structured reasoning.

The platform identifies missing architecture capabilities, balances trade-offs, and provides standards-backed recommendations and decision records.

## Current MVP

The hackathon MVP is a simple unauthenticated workspace-centric application. Users can open the app, create workspaces, add architecture diagrams or descriptions, comment, run analysis, inspect agent reasoning, and generate ADRs without login.

See `docs/AUTH_DECISION.md` before changing auth, routing, onboarding, workspace creation, tenant handling, or API client behavior.

## Intelligence Layer Direction

CoArchitect AI is moving from prompt-enriched analysis toward a Foundry IQ-style intelligence layer.

That layer grounds reviews with:

- framework summaries
- architecture principles
- trade-off guidance
- ADR templates
- workspace memory
- prior findings and ADR history

See `docs/FOUNDRY_IQ_IMPLEMENTATION.md`.

## Next Enhancement Direction

The next planned enhancement is a Reasoning Agents track-aligned multi-agent architecture review experience.

Key additions:

- richer architecture intake context
- explainable framework selection
- multi-agent specialist orchestration
- grounded knowledge summaries
- weighted trade-off balancing
- ADR generation and export
- synthetic demo datasets and evaluation rubric

## Core Capabilities

- Architecture workspaces
- Architecture diagrams and descriptions
- business and architecture context capture
- Diagram comments
- AI architecture analysis
- framework-aware reasoning
- Architecture trade-off analysis
- Architecture scoring
- Architecture recommendations
- Improvement roadmaps
- ADR generation

## Current Runtime Boundary

- Workspace is the top-level user-facing container.
- The user-facing Organization concept is removed from the product flow.
- A fixed local tenant placeholder scopes all runtime data access internally.
- The local placeholder user acts as admin so evaluators can exercise the full demo flow.

## Future User And Role Model

Proper users, permissions, tenant-aware identity, and external IdP integration will be added after the MVP.

Domain concepts may remain:

- User
- OrganizationUser
- OrganizationRole
- Role enums

They must not block the current unauthenticated MVP flow.

## Quality Attributes

- Security
- Scalability
- Availability
- Reliability
- Observability
- Maintainability
- Operational Excellence
- Cost Optimization
- Tenant Isolation
- Compliance
- Disaster Recovery

## Technology

- Backend: .NET 10
- Frontend: React, TypeScript, Vite
- Database: TiDB Cloud for the current cloud-backed MVP
- Storage: Azure Blob Storage through container SAS for the MVP
- AI: Azure AI Foundry Agent Service, with mock local provider
- Architecture: Clean Architecture
- Local development: Docker Compose

## Planning References

Read before changing roadmap-level behavior:

- `docs/REASONING_AGENTS_PLAN.md`
- `docs/FRAMEWORK_SELECTION.md`
- `docs/TRADEOFF_BALANCING.md`
- `docs/ADR_WORKFLOW.md`
- `docs/KNOWLEDGE_BASE_PLAN.md`

The application must run locally without Azure credentials by default.

For the hackathon Azure-connected local flow, use manually created Azure resources and environment variables documented in `docs/AZURE_LOCAL_RESOURCES_GUIDE.md`. Azure Key Vault is the manual source of secret values, but the app reads local environment variables at runtime.

## Current Reasoning Runtime

The current implementation uses:

- intake normalization
- diagram understanding
- framework selection
- one Context Enrichment Agent
- one Foundry IQ retrieval layer
- one cost-aware Azure Foundry expert call per analysis run
- framework specialists
- one trade-off balancer
- one scoring suggestion step
- one ADR preparation step
- one critic pass
- one recommendation composer pass

The application persists completed analysis snapshots, grounding context, and agent trace data so the UI can show the reasoning flow without re-running Azure Foundry on every read.
