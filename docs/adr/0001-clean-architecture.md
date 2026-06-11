# ADR 0001: Clean Architecture Boundaries

Status: Accepted

## Context
The project uses a multi-layer backend architecture with `Domain`, `Application`, `Infrastructure`, and `Api` projects.

## Decision
- `Domain` contains entities, enums, and core models.
- `Application` contains service interfaces and business orchestration.
- `Infrastructure` contains external service implementations, AI integrations, and storage helpers.
- `Api` contains endpoint wiring, configuration, Swagger, and health checks.

## Consequences
- `Domain` does not depend on `Infrastructure` or `Api`.
- `Application` does not depend on `Api`.
- `Infrastructure` may depend on `Domain` and `Application`.
- `Api` may depend on all other projects.
