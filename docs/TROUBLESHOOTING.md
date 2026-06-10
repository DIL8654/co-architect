# Troubleshooting

## CORS Errors

**Symptom**: Browser console shows a CORS policy error.

**Fixes**:

1. Ensure the API is running at http://localhost:5010.
2. Ensure the frontend is running at http://localhost:5173.
3. Confirm `Cors:AllowedOrigins` includes:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
   - `http://[::1]:5173`
4. Check that `app.UseCors("AllowFrontend")` is called before `app.MapControllers()`.

Quick test:

```bash
curl -i -H "Origin: http://localhost:5173" http://localhost:5010/api/workspaces
```

The response should include `Access-Control-Allow-Origin: http://localhost:5173`.
If you opened the frontend on loopback, test the matching origin instead of `localhost`.

## API Not Reachable

**Symptom**: Frontend shows network errors or `ERR_CONNECTION_REFUSED`.

**Fixes**:

1. Verify health: `curl http://localhost:5010/health`
2. Check port usage: `lsof -i :5010`
3. If port 5010 is unavailable, set `API_PORT` in `backend/.env` to the next available higher port and update `web/.env`.
4. Ensure Docker Desktop is running if using Compose.
5. Kill any stale process already holding `5010` before restarting the current build.

## Old Data Is Missing

**Symptom**: You expected persisted workspaces or diagrams, but the app looks empty.

**Fixes**:

1. Open `http://localhost:5010/api/infra-health`.
2. Confirm the database check reports `TiDB`, not `Mock`.
3. If the provider is `Mock`, make sure `backend/.env` contains `DATASTORE_PROVIDER=TiDB`.
4. Restart the API after any config change.
5. For direct local runs, use `dotnet run --project backend/src/api/CoArchitect.Api/CoArchitect.Api.csproj --urls http://0.0.0.0:5010`. The API now auto-loads `backend/.env`.

## Frontend Wrong API URL

**Symptom**: API calls go to the wrong host or port.

**Fixes**:

1. Check `web/.env` has `VITE_API_BASE_URL=http://localhost:5010`.
2. Restart Vite after changing `.env`.
3. Do not include `/api` in `VITE_API_BASE_URL`; shared API functions add `/api/...` paths.
4. Confirm the frontend is actually running on `http://localhost:5173` and not on a fallback port from an older Vite session.

## 401 Or 403 Responses

**Symptom**: MVP API calls fail with `401 Unauthorized` or `403 Forbidden`.

The current application runtime should not enforce auth. A 401 or 403 usually means an old container, stale build, proxy, or unrelated service is receiving the request.

**Fixes**:

1. Rebuild and restart the API container.
2. Verify the frontend points to `http://localhost:5010`.
3. Check that no old API container is still serving another port.
4. Confirm the failing request URL is the CoArchitect API URL.

## Default-Port CORS But Old Process Still Running

**Symptom**: The frontend is on `5173`, but CORS or 404 errors still appear even though the code looks correct.

**Fixes**:

1. Check `lsof -i tcp:5010` and `lsof -i tcp:5173`.
2. Kill stale processes before starting the current build.
3. Restart the backend first, then restart Vite.
4. Verify `curl -i -H "Origin: http://localhost:5173" http://localhost:5010/api/workspaces`.

## Mock Agent Not Working

**Symptom**: AI analysis returns empty or fails due to missing Azure credentials.

**Fixes**:

1. Set `ArchitectureAgent__Provider=Mock`.
2. Leave Azure AI variables empty for local development.
3. Ensure `MockArchitectureAgentService` is registered when Azure configuration is incomplete.
4. Confirm the diagram has an architecture description or uploaded content.

## Planning Confusion Between Current MVP And Reasoning Agents Direction

**Symptom**: Documentation or future work mixes the current unauthenticated MVP with the next multi-agent reasoning phase.

**Fixes**:

1. Treat the current runtime as the delivery base for the hackathon MVP.
2. Treat `docs/REASONING_AGENTS_PLAN.md` and related planning docs as the source of truth for the next enhancement.
3. Do not implement fake multi-agent behavior without grounded orchestration and clear responsibilities.
4. Keep demos on synthetic data only.

## Framework Selection Seems Inconsistent

**Symptom**: A future implementation chooses frameworks that do not match the architecture context.

**Fixes**:

1. Check `docs/FRAMEWORK_SELECTION.md`.
2. Make framework rationale visible in the UI.
3. Ensure the Framework Selection Agent returns confidence and assumptions.
4. Allow user override instead of silently forcing auto-detection.

## Unexpected Seed Data Appears

**Symptom**: Workspaces, diagrams, or analysis runs appear before you create anything.

**Fixes**:

1. Confirm you are hitting the current local build rather than an older running process.
2. The current in-memory repositories should start empty.
3. Restart the backend process or container and test again.

## Azure Foundry Agent Count Is Unclear

**Symptom**: You are unsure whether to create multiple Azure Foundry agents for the current app.

**Fixes**:

1. For the current implementation, create one Foundry agent only.
2. Keep framework selection and orchestration in the application for now.
3. Add multiple Foundry agents later only when implementing Phase 4 specialist orchestration.

## Database Connection Failure

**Symptom**: TiDB connection timeout or authentication failure.

**Fixes**:

1. Confirm `DataStore__Provider=TiDB` and verify `ConnectionStrings__Default`.
2. Ensure the remote database allows inbound access from your local IP address.
3. Current local MVP can still run with `DataStore__Provider=Mock` if you need to isolate storage issues first.

## Azurite Connection Failure

**Symptom**: Azure Storage SDK throws connection errors.

**Fixes**:

1. Ensure Azurite is running in Compose.
2. From Docker API container, use `http://azurite:10000`.
3. From the host, use `http://localhost:10000`.
