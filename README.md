# CoArchitect AI

CoArchitect AI is an AI architecture partner for grounded multi-agent architecture review.

## Hackathon Track

Microsoft Agents League — Reasoning Agents

## Product Overview

The current MVP is a workspace-centric architecture reasoning platform. Users create a workspace, add a diagram or architecture description, run analysis, inspect agent reasoning traces, review the Architecture Intelligence Score, study findings and trade-offs, and generate ADRs.

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

- API: `http://localhost:5010`
- Swagger: `http://localhost:5010/swagger`
- Frontend: `http://localhost:5173`

## Demo Flow

1. open the app
2. create a workspace
3. add a synthetic architecture description or diagram
4. run analysis
5. inspect score, findings, trade-offs, and grounding
6. generate an ADR

## Documentation

Start with [docs/README.md](docs/README.md).

## Current Limitations

- unauthenticated local runtime
- current reasoning mostly application-led
- Azure AI Search is not yet integrated

## Future Roadmap

See [docs/product/ROADMAP.md](docs/product/ROADMAP.md).
