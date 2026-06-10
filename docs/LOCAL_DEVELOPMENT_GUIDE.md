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
# set DATABASE_CONNECTION_STRING in backend/.env before starting
docker compose up --build
```

This starts:

- API at http://localhost:5010
- Swagger at http://localhost:5010/swagger
- Health at http://localhost:5010/health
- Azurite at localhost:10000

The API listens on `0.0.0.0` inside the container and maps host port `5010` to the container API port.
The local runtime starts empty. Create your own workspace and diagram through the UI.

## Run Backend Directly With .NET

```bash
dotnet run --project backend/src/api/CoArchitect.Api/CoArchitect.Api.csproj --urls http://0.0.0.0:5010
```

When `backend/.env` exists, the API auto-loads it for local development. That keeps direct `.NET` runs aligned with Docker Compose and with the frontend's Vite configuration source.

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

The API uses one fixed local tenant and one fixed local user placeholder when records need tenant or user identifiers.

## AI Analysis

Local analysis uses:

```bash
ArchitectureAgent__Provider=Mock
```

If Azure AI configuration is missing, the API falls back to mock analysis. The AI provider suggests maturity; the application scoring service calculates the final Architecture Intelligence Score.

## Current Orchestration Shape

The app now runs a Phase 4 MVP orchestration slice.

Current flow:

1. The upload flow captures architecture context, framework mode, and quality weights.
2. The backend previews and explains framework selection.
3. The review setup is saved with the diagram.
4. A planner builds the review plan.
5. Legacy diagrams without saved framework metadata can still infer specialist selection from architecture cues.
6. After the first new analysis, the inferred framework selection is persisted back to the diagram.
7. The application makes one cost-aware Foundry expert call.
8. Framework specialists produce grounded findings.
9. A trade-off balancer synthesizes recommendation tensions.
10. A critic validates the result.
11. The application scoring service calculates the final Architecture Intelligence Score.

Completed analysis runs are stored as snapshots in the database so result pages and the per-diagram history timeline do not need to call Azure Foundry again.

## Azure Foundry Provisioning Guidance

For the current implementation, create one Azure AI Foundry agent only.

Use that single agent as the main analysis provider behind `ArchitectureAgent__Provider=AzureFoundry`.

Do not create multiple specialist Foundry agents yet unless you are intentionally moving into Phase 4 orchestration work.

## Reasoning Agents Planning Notes

The next product phase introduces multi-agent reasoning, framework selection, trade-off balancing, and ADR generation.

For planning and implementation, read:

- `docs/REASONING_AGENTS_PLAN.md`
- `docs/FRAMEWORK_SELECTION.md`
- `docs/TRADEOFF_BALANCING.md`
- `docs/ADR_WORKFLOW.md`
- `docs/KNOWLEDGE_BASE_PLAN.md`

Hackathon demos for the Reasoning Agents track should use synthetic/demo data only.

## Optional Azure-Backed Local Run

For the hackathon, you can keep the API and frontend local while pointing persistence and file uploads at cloud resources.

Use `docs/AZURE_LOCAL_RESOURCES_GUIDE.md` for the full manual setup. The short version is:

```bash
cd backend
export DATASTORE_PROVIDER=TiDB
export DATABASE_CONNECTION_STRING='Server=<tidb-host>;Port=4000;Database=coarchitect;User=<user>;Password=<password>;SslMode=Preferred;'
export ARCHITECTURE_STORAGE_PROVIDER=AzureBlobSas
export ARCHITECTURE_STORAGE_CONTAINER_SAS_URL='https://<account>.blob.core.windows.net/architecture-diagrams?<sas-token>'
docker compose up --build
```

Keep `ArchitectureAgent__Provider=Mock` until database and blob storage are stable. Store real secret values in Azure Key Vault, then copy them into `backend/.env` before starting Docker Compose.

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
curl -i -H "Origin: http://localhost:5173" http://localhost:5010/api/workspaces
```

The response should include `Access-Control-Allow-Origin: http://localhost:5173`.
If you open the frontend through loopback instead of `localhost`, also verify `http://127.0.0.1:5173` or `http://[::1]:5173`.

## Common Local Issues

| Issue | Fix |
|-------|-----|
| Port 5010 in use | Set `API_PORT` in `backend/.env` to the next available higher port and update `VITE_API_BASE_URL` |
| CORS errors | Ensure `Cors:AllowedOrigins` includes `http://localhost:5173`, `http://127.0.0.1:5173`, and `http://[::1]:5173` |
| API returns 404 | Keep `VITE_API_BASE_URL` as the server root, for example `http://localhost:5010` |
| API returns 401/403 | Rebuild/restart; current app runtime should not enforce auth |
| Docker build fails | Ensure Docker Desktop is running and start Compose from `backend/` |
| Frontend cannot reach API | Verify `.env` has `VITE_API_BASE_URL=http://localhost:5010` and restart Vite |
| Old data is missing unexpectedly | Open `/health` and confirm the database provider is `TiDB`, not `Mock` |
| `dotnet run` fails | Ensure .NET 10 SDK is installed: `dotnet --version` |
