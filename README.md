# CoArchitect AI

Architecture Intelligence Platform for multi-agent architecture reasoning, scoring, recommendations, trade-off insights, and ADR generation.

## Quick Start

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- Docker Desktop

### Backend with Docker

```bash
cd backend
cp .env.example .env
# set DATABASE_CONNECTION_STRING in backend/.env before starting
docker compose up --build
```

The API is available at:

- http://localhost:5010
- http://localhost:5010/swagger
- http://localhost:5010/health

The local API runs without authentication for the hackathon MVP. It uses `ArchitectureAgent__Provider=Mock` by default so analysis works without Azure credentials.
The local runtime starts empty. No workspaces, diagrams, or seeded analysis runs are preloaded.

### Backend with `dotnet run`

```bash
dotnet run --project backend/src/api/CoArchitect.Api/CoArchitect.Api.csproj --urls http://0.0.0.0:5010
```

For local development, the API now auto-loads `backend/.env` when present, so direct runs and Docker-backed runs use the same local configuration source.

### Local App With Cloud Resources

The app can also run locally while using manually created Azure resources:

- TiDB via `DataStore__Provider=TiDB` for the current cost-optimized setup
- Azure Blob Storage via `ArchitectureStorage__Provider=AzureBlobSas`
- Azure Key Vault as the manual source for local secret values
- Azure AI Foundry, with mock AI as the default fallback when config is incomplete

See [Azure Local Resources Guide](docs/AZURE_LOCAL_RESOURCES_GUIDE.md).

### Frontend with Vite

```bash
cd web
npm install
npm run dev
```

Frontend runtime values are loaded from `backend/.env` so local values live in one place.

Use this setting in `backend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5010
```

Open http://localhost:5173 and click **Start**.

Use http://localhost:5173/health to check database, blob storage, and Azure AI Foundry connectivity.

## Current Auth Decision

The current hackathon MVP is an unauthenticated application:

- No login
- No JWT or bearer token
- No demo headers
- No demo role selector
- No auth-based 401/403 responses
- All MVP product features are accessible
- Workspace is the top-level user-facing container
- Tenant scoping is simulated internally with a fixed local placeholder context

The API uses an internal audit placeholder user only when records need a user id:

- Tenant id: `00000000-0000-0000-0000-000000000101`
- User id: `00000000-0000-0000-0000-000000000001`
- Email: `local-admin@coarchitect.ai`
- Display name: `CoArchitect Local Admin`

Future production work will add external IdP integration and tenant-aware RBAC. See [Auth Decision](docs/AUTH_DECISION.md).

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: .NET 10 Clean Architecture (Domain -> Application -> Infrastructure -> Api)
- **AI**: Azure AI Foundry agent with application-led multi-agent orchestration and mock local provider fallback
- **Storage**: Azure Blob Storage via container SAS, with no-op local default
- **Database**: TiDB, with relational product tables for workspaces, diagrams, comments, analysis runs, and ADRs

## Reasoning Agents Direction

CoArchitect AI is being planned as a multi-agent architecture reasoning platform aligned to the Microsoft Agents League Reasoning Agents track.

Current Phase 4 implementation:

- the app captures architecture review setup before analysis
- the backend persists workspaces, diagrams, comments, analysis runs, and ADR versions in relational tables
- a planner creates the review plan and selected specialist steps
- legacy diagrams with older or empty review metadata can still activate specialists from Azure, AWS, API, security, and multi-tenant cues in their description
- after the first new analysis, those inferred framework decisions are persisted back onto the legacy diagram as an explicit upgraded review setup
- framework specialists generate grounded findings
- a trade-off balancer synthesizes recommendation tensions
- a critic validates the final response
- the application uses one cost-aware Foundry call per analysis run
- the application scoring engine still calculates the final score

Planned capabilities:

- planner-led multi-agent orchestration
- grounded framework reasoning across Azure Well-Architected, AWS Well-Architected, ISO/IEC 25010, and OWASP ASVS
- explainable framework selection
- weighted trade-off balancing
- ADR generation in HTML and PDF
- Foundry IQ-style grounded knowledge
- synthetic demo data only

Current Azure Foundry guidance:

- use one Foundry agent for the current implementation
- keep orchestration in the application for now
- add multiple specialist Foundry agents only when starting Phase 4 orchestration work

## Documentation

- [Auth Decision](docs/AUTH_DECISION.md)
- [Azure Local Resources Guide](docs/AZURE_LOCAL_RESOURCES_GUIDE.md)
- [Local Development Guide](docs/LOCAL_DEVELOPMENT_GUIDE.md)
- [Cloud Deployment Guide](docs/CLOUD_DEPLOYMENT_GUIDE.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Scoring Model](docs/SCORING_MODEL.md)
- [Reasoning Agents Plan](docs/REASONING_AGENTS_PLAN.md)
- [Framework Selection](docs/FRAMEWORK_SELECTION.md)
- [Tradeoff Balancing](docs/TRADEOFF_BALANCING.md)
- [ADR Workflow](docs/ADR_WORKFLOW.md)
- [Knowledge Base Plan](docs/KNOWLEDGE_BASE_PLAN.md)
- [Roadmap](docs/ROADMAP.md)

## Running Tests

```bash
cd backend
dotnet test
```

```bash
cd web
npm test
```
