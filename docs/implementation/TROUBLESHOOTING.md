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

- confirm frontend is on `5173`
- confirm backend allows `localhost:5173`
- restart both services after env changes

### Azure AI Foundry not configured

Use `ArchitectureAgent__Provider=Mock`.

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
