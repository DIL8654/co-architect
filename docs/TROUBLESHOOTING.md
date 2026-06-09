# Troubleshooting

## CORS Errors

**Symptom**: Browser console shows a CORS policy error.

**Fixes**:

1. Ensure the API is running at http://localhost:5010.
2. Ensure the frontend is running at http://localhost:5173.
3. Confirm `Cors:AllowedOrigins` includes:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
4. Check that `app.UseCors("AllowFrontend")` is called before `app.MapControllers()`.

Quick test:

```bash
curl -i -H "Origin: http://localhost:5173" http://localhost:5010/api/organizations
```

The response should include `Access-Control-Allow-Origin: http://localhost:5173`.

## API Not Reachable

**Symptom**: Frontend shows network errors or `ERR_CONNECTION_REFUSED`.

**Fixes**:

1. Verify health: `curl http://localhost:5010/health`
2. Check port usage: `lsof -i :5010`
3. If port 5010 is unavailable, set `API_PORT` in `backend/.env` to the next available higher port and update `web/.env`.
4. Ensure Docker Desktop is running if using Compose.

## Frontend Wrong API URL

**Symptom**: API calls go to the wrong host or port.

**Fixes**:

1. Check `web/.env` has `VITE_API_BASE_URL=http://localhost:5010`.
2. Restart Vite after changing `.env`.
3. Do not include `/api` in `VITE_API_BASE_URL`; shared API functions add `/api/...` paths.

## 401 Or 403 Responses

**Symptom**: MVP API calls fail with `401 Unauthorized` or `403 Forbidden`.

The current application runtime should not enforce auth. A 401 or 403 usually means an old container, stale build, proxy, or unrelated service is receiving the request.

**Fixes**:

1. Rebuild and restart the API container.
2. Verify the frontend points to `http://localhost:5010`.
3. Check that no old API container is still serving another port.
4. Confirm the failing request URL is the CoArchitect API URL.

## Mock Agent Not Working

**Symptom**: AI analysis returns empty or fails due to missing Azure credentials.

**Fixes**:

1. Set `ArchitectureAgent__Provider=Mock`.
2. Leave Azure AI variables empty for local development.
3. Ensure `MockArchitectureAgentService` is registered when Azure configuration is incomplete.
4. Confirm the diagram has an architecture description or uploaded content.

## Database Connection Failure

**Symptom**: PostgreSQL connection timeout or authentication failure.

**Fixes**:

1. Ensure PostgreSQL is healthy in Compose.
2. Use `Host=postgres` from the API container.
3. Use `Host=localhost` from the host machine.
4. Current local MVP uses in-memory repositories; database-backed persistence will be wired later.

## Azurite Connection Failure

**Symptom**: Azure Storage SDK throws connection errors.

**Fixes**:

1. Ensure Azurite is running in Compose.
2. From Docker API container, use `http://azurite:10000`.
3. From the host, use `http://localhost:10000`.
