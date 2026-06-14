# Troubleshooting

## Purpose

Provide quick diagnosis for common local issues.

## Current Scope

This guide covers the current workspace-centric MVP.

## Common Issues

### Frontend build command fails at repo root

Run frontend commands inside `web/`, not the repository root.

### API unavailable on `5010`

- ensure Docker is running
- ensure the backend container is healthy
- ensure no other local process is using the port

### CORS errors

- for local runs, confirm the backend allows `http://localhost:5173`
- for Azure/App Service runs, set indexed app settings such as:
  - `Cors__AllowedOrigins__0=https://www.coarchitect.cloud`
  - `Cors__AllowedOrigins__1=https://coarchitect.cloud`
  - `Cors__AllowedOrigins__2=https://brave-smoke-025cfcd03.7.azurestaticapps.net`
- restart or redeploy the API after changing CORS settings
- test from the actual browser origin, not only from a direct API curl
- check `/api/infra-health` and confirm the `corsConfig` line shows the expected resolved origins

### Azure AI Foundry not configured

Use `ArchitectureAgent__Provider=Mock`.

### `429 Too Many Requests` when running architecture review

- the public MVP limits AI analysis requests to **5 runs per IP per minute**
- wait about a minute and try again
- this safeguard protects service availability and Azure Foundry cost during public demos

### Diagram view fails on older analysis data

Run a fresh analysis so the latest result includes current grounding metadata.

### Seeded demo data does not appear

- confirm `DemoData__Enabled` is not set to `false`
- restart the API so the idempotent seeder runs again
- confirm the frontend dashboard is using the same backend URL shown in `VITE_API_BASE_URL`

The seeder recreates deterministic demo records if they are missing and does not delete user-created workspaces.

### Demo diagram image does not render

- confirm the frontend build includes `web/public/automate-video-analysis-architecture.png`
- confirm the frontend build includes `web/public/custom-document-processing-architecture.png`
- reload the dashboard or diagram page after restarting Vite

## Future Enhancements

Future production troubleshooting will include identity, deployment, and connector-specific issues.
