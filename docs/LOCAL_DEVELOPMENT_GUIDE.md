# Local Development Guide

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- [Node.js 20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- Git

## Run Backend With Docker Compose

```bash
cd backend
cp .env.example .env
docker compose up --build
```

This starts:

- API at http://localhost:5010
- Swagger at http://localhost:5010/swagger
- Health at http://localhost:5010/health
- PostgreSQL at localhost:5432
- Azurite at localhost:10000

The API listens on `0.0.0.0` inside the container and maps host port `5010` to the container API port.

## Run Frontend With Vite

```bash
cd web
npm install
npm run dev
```

Frontend runtime values are loaded from `../backend/.env`. Keep local runtime values and secrets in `backend/.env`.

Use this value in `backend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:5010
```

Frontend runs at http://localhost:5173.

Infrastructure health page:

```text
http://localhost:5173/health
```

API health endpoints:

```text
http://localhost:5010/health
http://localhost:5010/api/infra-health
```

## Current Auth Behavior

The local MVP is unauthenticated:

- No login
- No token
- No auth headers
- No role selector
- No app-level auth 401/403 responses
- All MVP routes and actions are accessible

The API uses `system@coarchitect.ai` only as an internal audit placeholder when a record needs a user id.

## AI Analysis

Local analysis uses:

```bash
ArchitectureAgent__Provider=Mock
```

If Azure AI configuration is missing, the API falls back to mock analysis. The AI provider suggests maturity; the application scoring service calculates the final Architecture Intelligence Score.

## Optional Azure-Backed Local Run

For the hackathon, you can keep the API and frontend local while pointing persistence and file uploads at Azure resources.

Use `docs/AZURE_LOCAL_RESOURCES_GUIDE.md` for the full manual setup. The short version is:

```bash
cd backend
export DATASTORE_PROVIDER=Postgres
export POSTGRES_CONNECTION_STRING='Host=<server>.postgres.database.azure.com;Port=5432;Database=coarchitect;Username=<user>;Password=<password>;Ssl Mode=Require;Trust Server Certificate=true'
export ARCHITECTURE_STORAGE_PROVIDER=AzureBlobSas
export ARCHITECTURE_STORAGE_CONTAINER_SAS_URL='https://<account>.blob.core.windows.net/architecture-diagrams?<sas-token>'
docker compose up --build
```

Keep `ArchitectureAgent__Provider=Mock` until database and blob storage are stable. Store real secret values in Azure Key Vault, then export them locally before starting Docker Compose.

## Local URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:5010 |
| Swagger | http://localhost:5010/swagger |
| Health Check | http://localhost:5010/health |
| Infrastructure Health | http://localhost:5173/health |

## Verify CORS

```bash
curl -i -H "Origin: http://localhost:5173" http://localhost:5010/api/organizations
```

The response should include `Access-Control-Allow-Origin: http://localhost:5173`.

## Common Local Issues

| Issue | Fix |
|-------|-----|
| Port 5010 in use | Set `API_PORT` in `backend/.env` to the next available higher port and update `VITE_API_BASE_URL` |
| CORS errors | Ensure `Cors:AllowedOrigins` includes `http://localhost:5173` and `http://127.0.0.1:5173` |
| API returns 404 | Keep `VITE_API_BASE_URL` as the server root, for example `http://localhost:5010` |
| API returns 401/403 | Rebuild/restart; current app runtime should not enforce auth |
| Docker build fails | Ensure Docker Desktop is running and start Compose from `backend/` |
| Frontend cannot reach API | Verify `.env` has `VITE_API_BASE_URL=http://localhost:5010` and restart Vite |
| `dotnet run` fails | Ensure .NET 10 SDK is installed: `dotnet --version` |
