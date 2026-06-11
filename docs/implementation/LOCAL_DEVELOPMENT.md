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

## Azure-Backed Optional Flow

See [AZURE_LOCAL_RESOURCES.md](AZURE_LOCAL_RESOURCES.md).

## CORS Validation

The backend should allow:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

## Troubleshooting

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md).
