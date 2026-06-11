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

The current UI exposes preview, markdown, HTML, and history views. PDF export is part of the roadmap.

Related trade-off reasoning is documented in [TRADEOFF_BALANCING.md](TRADEOFF_BALANCING.md).

## Future Enhancements

- stronger PDF export flow
- approval workflow
- richer ADR editing experience
