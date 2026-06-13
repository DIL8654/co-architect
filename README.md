# CoArchitect AI

## 1. Project Overview

CoArchitect AI is a workspace-centric architecture reasoning platform built for the Microsoft Agents League hackathon. It helps teams review software architecture diagrams and descriptions, surface evidence-backed findings, understand trade-offs, and generate Architecture Decision Records (ADRs) with visible multi-step AI reasoning.

The current MVP is intentionally demo-first:

- unauthenticated local runtime
- synthetic demo data only
- workspace-first product flow
- application-led orchestration with one cost-aware Azure AI Foundry expert call when enabled

## 2. Live Demo

- Public site: [https://brave-smoke-025cfcd03.7.azurestaticapps.net/](https://brave-smoke-025cfcd03.7.azurestaticapps.net/)

Local routes:

- Public front door: `http://localhost:5173/`
- Product app: `http://localhost:5173/app`
- API: `http://localhost:5010`

## 3. Problem & Solution

### Problem

Architecture reviews are often slow, inconsistent, and hard to explain. Teams may have diagrams, standards, and tribal knowledge, but they still struggle to turn them into clear recommendations, measurable architecture quality, and durable decision records.

### Solution

CoArchitect AI acts as an AI architecture partner. It combines:

- architecture diagrams and descriptions
- architecture standards and framework guidance
- Foundry IQ-style grounded context
- visible multi-agent reasoning
- application-calculated scoring
- ADR generation and version history

The result is a review workflow that is easier to demonstrate, explain, and act on.

## 4. Architecture Overview

CoArchitect AI is a monorepo with a React frontend and a .NET backend.

- Frontend: React + TypeScript + Vite
- Backend: .NET 10 with Clean Architecture layers
- Persistence: TiDB-backed relational storage for the primary production path
- File storage: Azure Blob Storage with SAS-based MVP access
- AI provider path: Azure AI Foundry Agent Service with mock-provider fallback

Documentation entry points:

- [Documentation Index](./docs/README.md)
- [System Architecture](./docs/architecture/SYSTEM_ARCHITECTURE.md)
- [Backend Architecture](./docs/architecture/CLEAN_ARCHITECTURE_BACKEND.md)
- [Frontend Architecture](./docs/architecture/FRONTEND_ARCHITECTURE.md)

## 5. Multi-Agent System

The current MVP uses application-led orchestration rather than pretending every stage is a separate hosted agent.

Main reasoning flow:

1. Intake
2. Diagram Understanding
3. Framework Selection
4. Context Enrichment
5. Foundry IQ Retrieval
6. Foundry Expert
7. Framework Specialists
8. Trade-off Balancing
9. Architecture Scoring Suggestions
10. ADR Preparation
11. Critic / Verifier
12. Recommendation Composer

This flow is visible in the product through workflow traces, run history, and grounded context displays.

Further reading:

- [Multi-Agent Reasoning](./docs/ai/MULTI_AGENT_REASONING.md)
- [Agent Catalog](./docs/ai/AGENT_CATALOG.md)
- [Agent Orchestration Flow](./docs/ai/AGENT_ORCHESTRATION_FLOW.md)

## 6. Foundry IQ Integration

CoArchitect AI uses a Foundry IQ-style intelligence layer to ground reasoning before recommendations are produced.

Current grounding sources include:

- Azure Well-Architected
- AWS Well-Architected
- ISO/IEC 25010
- OWASP ASVS
- ISO 27001
- GDPR
- SOC 2
- TOGAF
- SAFe
- architecture principles
- trade-off guidance
- ADR templates
- workspace memory and prior analysis history

The runtime uses a structured knowledge-base catalog plus markdown companions, so recommendations can point back to concrete context rather than unsupported model recall.

Further reading:

- [Foundry AI Integration](./docs/ai/FOUNDRY_AI_INTEGRATION.md)
- [Foundry IQ Intelligence Layer](./docs/ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md)

## 7. Features

- Workspace -> Diagram -> Analysis -> ADR workflow
- Seeded demo workspaces with real diagram assets
- Architecture Intelligence Score with dimension breakdown
- Findings, recommendations, trade-offs, and improvement roadmap
- Agent workflow trace and reasoning history
- Standards-aware review setup with frameworks and governance criteria
- Persisted ADRs with version history
- Public front door plus in-app workbench
- Local mock-provider runtime with no Azure requirement

## 8. Demo Walkthrough

### Primary demo path

1. Open the public site.
2. Click `Try Now`.
3. Open one of the seeded Demo Architecture Journeys.
4. Inspect the diagram workbench.
5. Review the Architecture Intelligence tab for score, frameworks, standards, and grounded context.
6. Open the Agent Workflow tab to show the orchestration trace.
7. Review findings, recommendations, and trade-offs.
8. Open ADRs and version history.

### Demo scenarios

- Automated Video Analysis Platform
- Custom Document Processing Platform
- Enterprise SaaS Platform Baseline

Supporting docs:

- [Demo Data Plan](./docs/demo/DEMO_DATA_PLAN.md)
- [Demo Journeys](./docs/demo/DEMO_JOURNEYS.md)
- [Demo Script](./docs/demo/DEMO_SCRIPT.md)
- [Demo Assets](./docs/demo/DEMO_ASSETS.md)

## 9. Assumptions

- No authentication is implemented in the current hackathon runtime.
- The current demo assumes a single-user local flow.
- Synthetic data is used for seeded demo journeys and examples.
- Several product decisions are intentionally demo-first to reduce evaluator setup friction.
- The final Architecture Intelligence Score is calculated by application code, not invented directly by AI.

## 10. Limitations

### Product

- No real authentication or user/role management yet.  
  Future enhancement: integrate Frontegg or another external identity provider with tenant-aware access.

- Collaboration is limited.  
  Future enhancement: add shared comments, invitations, and richer team workflows.

- Diagram understanding is still constrained by the current upload/description model.  
  Future enhancement: deeper parsing, richer visual extraction, and stronger diagram structure understanding.

### Performance

- Caching is stronger than earlier MVP passes, but not yet a full production caching strategy.  
  Future enhancement: dedicated backend summaries, stronger prefetching, and broader batch data contracts where needed.

### Security

- No production-grade auth controls are active in the MVP.  
  Future enhancement: authentication, RBAC/ABAC, audit trails, and stricter environment hardening.

- No full audit log model is surfaced in the active UI.  
  Future enhancement: append-only activity and review evidence records.

### AI

- The orchestration is still application-led and cost-aware rather than a fleet of fully hosted agents.  
  Future enhancement: promote selected stages into additional Azure AI Foundry hosted agents where it improves quality or demo strength.

- Evaluation coverage is still limited to the current grounded review workflow.  
  Future enhancement: deeper scenario benchmarking, adversarial evaluation, and quality regression suites.

## 11. Future Enhancements

- Production authentication and tenant-aware identity
- Richer collaboration and review workflows
- Azure AI Search-backed knowledge retrieval
- Expanded evidence and audit trails
- More advanced diagram parsing and architecture extraction
- Deeper agent specialization and evaluation
- Production deployment automation and stronger operations tooling

## 12. How to Run Locally

### Quick demo mode

This is the fastest evaluator path and does not require Azure credentials.

Backend:

```bash
cd backend
cp .env.example .env
docker compose up --build
```

Frontend:

```bash
cd web
npm install
npm run dev
```

Then open:

- `http://localhost:5173/` for the public front door
- `http://localhost:5173/app` for the application

Optional smoke test:

```bash
node scripts/smoke-hackathon-flow.mjs
```

### Azure-backed local mode

For presenter or more production-like validation, configure:

- `DATASTORE_PROVIDER=TiDB`
- `DATABASE_CONNECTION_STRING`
- `ARCHITECTURE_STORAGE_PROVIDER=AzureBlobSas`
- `ARCHITECTURE_STORAGE_CONTAINER_SAS_URL`
- `ARCHITECTURE_AGENT_PROVIDER=AzureFoundry`
- `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT`
- `AZURE_AI_FOUNDRY_AGENT_ID`
- `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT`

Helpful references:

- [Local Development](./docs/implementation/LOCAL_DEVELOPMENT.md)
- [Azure Local Resources](./docs/implementation/AZURE_LOCAL_RESOURCES.md)
- [Environment Variables](./docs/implementation/ENVIRONMENT_VARIABLES.md)
- [Troubleshooting](./docs/implementation/TROUBLESHOOTING.md)

## 13. Tech Stack

- React
- TypeScript
- Vite
- Tailwind-style utility CSS plus local design system components
- .NET 10
- Clean Architecture
- TiDB
- Azure Blob Storage
- Azure AI Foundry Agent Service
- Mock AI provider for zero-config local runs

## Additional Reading

- [Documentation Index](./docs/README.md)
- [Hackathon Scope](./docs/product/HACKATHON_SCOPE.md)
- [User Journeys](./docs/product/USER_JOURNEYS.md)
- [UX Strategy](./docs/ux/UX_STRATEGY.md)
- [Hackathon Judging Alignment](./docs/hackathon/HACKATHON_JUDGING_ALIGNMENT.md)
