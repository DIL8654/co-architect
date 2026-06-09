# CoArchitect AI

Architecture Intelligence Platform — AI-powered architecture analysis with scoring, recommendations, and trade-off insights.

## Quick Start

### Prerequisites

- .NET 10 SDK
- Node.js 20+
- Docker Desktop

### Backend with Docker

```bash
cd backend
cp .env.example .env
docker compose up --build
```

The API is available at:

- http://localhost:5010
- http://localhost:5010/swagger
- http://localhost:5010/health

The local API runs without authentication for the hackathon MVP. It uses `ArchitectureAgent__Provider=Mock` by default so analysis works without Azure credentials.

### Local App With Azure Resources

The app can also run locally while using manually created Azure resources:

- Azure Database for PostgreSQL via `DataStore__Provider=Postgres`
- Azure Blob Storage via `ArchitectureStorage__Provider=AzureBlobSas`
- Azure Key Vault as the manual source for local secret values
- Azure AI Foundry later, with mock AI as the default fallback

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

The API uses an internal audit placeholder user only when records need a user id:

- Id: `00000000-0000-0000-0000-000000000001`
- Email: `system@coarchitect.ai`
- Display name: `CoArchitect System User`

Future production work will add external IdP integration and organization-scoped RBAC. See [Auth Decision](docs/AUTH_DECISION.md).

## Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: .NET 10 Clean Architecture (Domain -> Application -> Infrastructure -> Api)
- **AI**: Azure AI Foundry agent, with mock local provider
- **Storage**: Azure Blob Storage via container SAS, with no-op local default
- **Database**: PostgreSQL provider, with in-memory repositories for the default local MVP

## Documentation

- [Auth Decision](docs/AUTH_DECISION.md)
- [Azure Local Resources Guide](docs/AZURE_LOCAL_RESOURCES_GUIDE.md)
- [Local Development Guide](docs/LOCAL_DEVELOPMENT_GUIDE.md)
- [Cloud Deployment Guide](docs/CLOUD_DEPLOYMENT_GUIDE.md)
- [Environment Variables](docs/ENVIRONMENT_VARIABLES.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Scoring Model](docs/SCORING_MODEL.md)

## Running Tests

```bash
cd backend
dotnet test
```

```bash
cd web
npm test
```
