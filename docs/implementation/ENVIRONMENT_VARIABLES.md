# Environment Variables

## Purpose

Summarize the main runtime configuration.

## Current Scope

The current MVP uses a small set of backend and frontend variables.

## Backend

- `ASPNETCORE_ENVIRONMENT`
- `DataStore__Provider` (`Mock` for zero-config evaluator demos, `TiDB` for Azure-backed local runs)
- `ConnectionStrings__DefaultConnection` (required only when `DataStore__Provider=TiDB`)
- `ArchitectureStorage__Provider`
- `ArchitectureStorage__ContainerSasUrl`
- `ArchitectureAgent__Provider`
- `AZURE_AI_FOUNDRY_PROJECT_ENDPOINT`
- `AZURE_AI_FOUNDRY_AGENT_ID`
- `AZURE_AI_FOUNDRY_MODEL_DEPLOYMENT`
- `DemoData__Enabled`
- `Cors__AllowedOrigins__0`
- `Cors__AllowedOrigins__1`

## Frontend

- `VITE_API_BASE_URL`
- `VITE_APP_ENV`

## Design Decisions

- no frontend auth headers in the current MVP
- no secrets inside `VITE_` variables
- mock AI remains the safest local default
- demo data seeding is enabled by default for evaluator-friendly startup
- TiDB remains the intended production database path, but it is not required for a fresh evaluator smoke test

## Future Enhancements

Future production identity and hosting variables should be introduced deliberately, not mixed into the hackathon build.
