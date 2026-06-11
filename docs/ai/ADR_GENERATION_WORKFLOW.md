# ADR Generation Workflow

## Purpose

Describe how Architecture Decision Records are generated.

## Current Scope

The MVP supports ADR generation from architecture review output and stores ADR versions.

## Workflow

1. review completes
2. findings and trade-offs are assembled
3. ADR template and prior ADR history are retrieved
4. ADR draft is generated
5. critic validates coherence
6. the user reviews the ADR

## Design Decisions

- ADRs are first-class outputs
- ADR generation uses retrieved context, not only freeform model recall
- version history is preserved

## Implementation Notes

The current UI exposes preview, markdown, HTML, and history views.

Current export behavior uses a browser-print layout so teams can use Save as PDF without a backend export service. This keeps local and demo flows lightweight while still giving reviewers a clean handoff artifact.

Related trade-off reasoning is documented in [TRADEOFF_BALANCING.md](TRADEOFF_BALANCING.md).

## Future Enhancements

- persisted server-side PDF export flow
- approval workflow
- richer ADR editing experience
