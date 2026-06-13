# Product Memory

## Current Source Of Truth

The active product documents are:

- [Product Vision](./product/PRODUCT_VISION.md)
- [Hackathon Scope](./product/HACKATHON_SCOPE.md)
- [Demo Data Plan](./demo/DEMO_DATA_PLAN.md)

## Current Product Direction

CoArchitect AI is a workspace-centric architecture reasoning platform with an unauthenticated local MVP and a seeded synthetic demo flow.

The strongest default demo path is:

Workspace -> Diagram -> AI Analysis -> Agent Workflow -> Architecture Intelligence Score -> Findings -> Trade-offs -> ADRs -> ADR Versions -> ADR History

The main working surface is the diagram workbench. It keeps architecture evidence, score, findings, workflow history, and ADR output in one place.

The current export story is intentionally lightweight:

- diagram review export uses a browser-print view
- ADR export uses a browser-print view
- the application score remains calculated in application code, not invented directly by AI

## Notes

This bridge exists so legacy references to `docs/PRODUCT_MEMORY.md` continue to resolve while the formal documentation lives under `docs/product/` and `docs/demo/`.
