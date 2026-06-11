# Demo Data Plan

## Purpose

Explain how CoArchitect AI creates a complete, reliable demo experience for every evaluator.

## Current Scope

The API seeds deterministic synthetic demo data on startup when `DemoData__Enabled` is not set to `false`.

Seeded workspaces:

- `[Demo] Automated Video Analysis Platform`
- `[Demo] Custom Document Processing Platform`
- `[Demo] Enterprise SaaS Platform Baseline`

Each demo diagram includes:

- a completed analysis run
- Architecture Intelligence Score and score band
- selected frameworks and selection rationale
- Foundry IQ context bundle
- multi-agent workflow trace
- findings, missing capabilities, recommendations, trade-offs, and roadmap content
- ADRs with version history

## Design Decisions

- Seeding is idempotent and uses stable GUIDs.
- Demo data is clearly marked with `[Demo]`.
- Seeding does not delete or overwrite user-created workspaces.
- Seeded analysis snapshots are synthetic and mock-compatible.
- Azure Foundry is not required to view demo analysis results.

## Implementation Notes

The seeder runs through `HackathonDemoSeeder` and can be disabled:

```bash
DemoData__Enabled=false
```

Reset is intentionally non-destructive. If demo records are missing, restart the API with demo data enabled and the deterministic records are recreated or updated.

## Future Enhancements

A protected reset endpoint may be added later for presenter environments, but the current MVP avoids destructive demo operations.
