# Local Development

## Purpose

Explain how to run CoArchitect AI locally.

## Current Scope

The MVP must run locally with or without Azure credentials.

## Prerequisites

- .NET 10 SDK
- Node.js 20+
- Docker Desktop

## Backend

The default evaluator setup is zero-config:

- `DATASTORE_PROVIDER=Mock`
- `ARCHITECTURE_AGENT_PROVIDER=Mock`
- `ARCHITECTURE_STORAGE_PROVIDER=None`

Use this path when judges need to run the product quickly without Azure or TiDB credentials.

Docker:

```bash
cd backend
cp .env.example .env
docker compose up --build
```

API endpoints:

- `http://localhost:5010`
- `http://localhost:5010/swagger`
- `http://localhost:5010/health`

## Frontend

```bash
cd web
npm install
npm run dev
```

Frontend URL:

- `http://localhost:5173`

## Mock Provider

Use `ArchitectureAgent__Provider=Mock` for the easiest local run.

## Seeded Demo Journeys

The backend seeds synthetic demo journeys by default. These include real diagram assets, completed analysis snapshots, Foundry IQ context, agent traces, and ADR version history.

Disable seeding only when needed:

```bash
DemoData__Enabled=false
```

See [../demo/DEMO_DATA_PLAN.md](../demo/DEMO_DATA_PLAN.md).

## Azure-Backed Optional Flow

For presenter or production-style local testing, set these values in `backend/.env`:

- `DATASTORE_PROVIDER=TiDB`
- `DATABASE_CONNECTION_STRING`
- `ARCHITECTURE_STORAGE_PROVIDER=AzureBlobSas`
- `ARCHITECTURE_STORAGE_CONTAINER_SAS_URL`
- `ARCHITECTURE_AGENT_PROVIDER=AzureFoundry`
- `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT`
- `AZURE_AI_FOUNDRY_AGENT_ID`
- `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT`
- `AZURE_AI_FOUNDRY_API_KEY`

See [AZURE_LOCAL_RESOURCES.md](AZURE_LOCAL_RESOURCES.md).

## CORS Validation

The backend should allow:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

For Azure-hosted testing, configure explicit app settings instead of relying on the localhost fallback:

- `Cors__AllowedOrigins__0=https://www.coarchitect.cloud`
- `Cors__AllowedOrigins__1=https://coarchitect.cloud`
- `Cors__AllowedOrigins__2=https://brave-smoke-025cfcd03.7.azurestaticapps.net`

## Hackathon Smoke Test

After the backend is running, validate the end-to-end API flow:

```bash
node scripts/smoke-hackathon-flow.mjs
```

The script checks `/health`, `/api/infra-health`, workspace creation, text-only diagram creation, analysis execution, and ADR generation. Pass a custom API URL when needed:

```bash
node scripts/smoke-hackathon-flow.mjs http://localhost:5010
```

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
