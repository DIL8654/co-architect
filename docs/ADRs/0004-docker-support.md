# ADR 0004: Docker Support for Local Development

Status: Accepted

## Context
The repository must support Docker for local development and deployment.

## Decision
- Add a `Dockerfile` for building the API image.
- Add `docker-compose.yml` to start the API service in development.
- Add `.dockerignore` to avoid copying build artifacts.

## Consequences
- Developers can run the backend in containers consistently.
- Docker configuration is kept isolated from application logic.
