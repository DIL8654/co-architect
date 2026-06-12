# CoArchitect AI

CoArchitect AI is an AI architecture partner for grounded multi-agent architecture review.

## Hackathon Track

Microsoft Agents League — Reasoning Agents

## Product Overview

The current MVP is a workspace-centric architecture reasoning platform. Users create a workspace, add a diagram or architecture description, run analysis, inspect agent reasoning traces, review the Architecture Intelligence Score, study findings and trade-offs, and generate ADRs.

The app now has a simple public front door and a separate in-app product surface:

- public site: `http://localhost:5173/`
- product app: `http://localhost:5173/app`

## Key Features

- workspace-centric architecture review flow
- standards-backed findings
- visible agent reasoning trace
- Architecture Intelligence Score
- trade-off analysis
- ADR generation and versioning
- Foundry IQ-style grounding

## Architecture Summary

- backend: .NET 10 Clean Architecture
- frontend: React, TypeScript, Vite
- database: TiDB Cloud
- file storage: Azure Blob Storage via SAS for the MVP
- AI integration path: Azure AI Foundry Agent Service

## AI, Foundry, And Foundry IQ

The current runtime uses application-led orchestration with one cost-aware Azure AI Foundry expert call and local specialist reasoning around a Foundry IQ-style intelligence layer. That intelligence layer grounds recommendations with framework summaries, ADR templates, architecture principles, trade-off guidance, and workspace memory.

## Local Quick Start

The quickest evaluator path uses mock storage and the mock AI provider. No Azure or TiDB credentials are required.

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

Default URLs:

- Public site: `http://localhost:5173/`
- Product app: `http://localhost:5173/app`
- API: `http://localhost:5010`
- Swagger: `http://localhost:5010/swagger`
- Frontend: `http://localhost:5173`

Smoke test after the backend is running:

```bash
node scripts/smoke-hackathon-flow.mjs
```

## Seeded Demo Experience

The API seeds synthetic hackathon demo journeys by default. These include real diagram assets, completed analysis snapshots, Foundry IQ grounding, agent traces, findings, trade-offs, recommendations, ADRs, ADR versions, and ADR history.

Seeded scenarios:

- Automated Video Analysis Platform
- Custom Document Processing Platform
- Enterprise SaaS Platform Baseline

Disable seeding only when needed:

```bash
DemoData__Enabled=false
```

## Demo Flow

1. open the public site
2. click `Try Now`
3. choose a Demo Architecture Journey from the in-app dashboard
4. inspect the real diagram image or architecture description
5. open the latest analysis result
6. inspect score, findings, trade-offs, agent workflow, and Foundry IQ grounding
7. open ADRs and version history
8. optionally create a new workspace and run a fresh mock or Azure-backed analysis

Legacy product URLs redirect automatically into `/app/...`, so older bookmarks still work during local testing.

## Public Site

The public site is intentionally minimal and static. It includes:

- `Home` for the product overview and workflow story
- `Product` for workbench, agent workflow, ADR, and Foundry IQ preview sections
- `Try Now` as the entry point into the live application

## Demo Flow In App

1. open the app at `/app`
2. choose a Demo Architecture Journey from the dashboard
3. inspect the real diagram image or architecture description
4. open the latest analysis result
5. inspect score, findings, trade-offs, agent workflow, and Foundry IQ grounding
6. open ADRs and version history
7. optionally create a new workspace and run a fresh mock or Azure-backed analysis

## Documentation

Start with [docs/README.md](docs/README.md).

Demo-specific docs:

- [Demo Data Plan](docs/demo/DEMO_DATA_PLAN.md)
- [Demo Journeys](docs/demo/DEMO_JOURNEYS.md)
- [Demo Script](docs/demo/DEMO_SCRIPT.md)
- [Demo Assets](docs/demo/DEMO_ASSETS.md)

## Current Limitations

- unauthenticated local runtime
- current reasoning mostly application-led
- Azure AI Search is not yet integrated

## Azure-Backed Local Run

For presenter or production-style testing, set `DATASTORE_PROVIDER=TiDB`, `DATABASE_CONNECTION_STRING`, `ARCHITECTURE_STORAGE_PROVIDER=AzureBlobSas`, `ARCHITECTURE_STORAGE_CONTAINER_SAS_URL`, and the Azure AI Foundry values in `backend/.env`.

## Future Roadmap

See [docs/product/ROADMAP.md](docs/product/ROADMAP.md).
