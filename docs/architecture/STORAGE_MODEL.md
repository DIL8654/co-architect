# Storage Model

## Purpose

Describe how files and persisted artifacts are stored.

## Current Scope

The MVP uses TiDB for relational persistence and Azure Blob Storage through a container SAS URL for diagram files when cloud-backed storage is enabled.

## Persistence

- TiDB Cloud for product records
- JSON serialization for richer analysis payloads
- mock repositories for local mock mode

## File Storage

Diagram originals:

```text
tenants/{tenantId}/workspaces/{workspaceId}/diagrams/{diagramId}/original/{fileName}
```

ADR exports:

```text
tenants/{tenantId}/workspaces/{workspaceId}/diagrams/{diagramId}/adrs/{adrId}/exports/{adrId}.pdf
```

## Design Decisions

- keep diagram upload storage simple for the hackathon
- use SAS-based blob access for MVP practicality
- keep tenant in storage paths as an internal boundary only

## Future Enhancements

- managed identity
- user delegation SAS
- richer artifact retention and lifecycle rules
