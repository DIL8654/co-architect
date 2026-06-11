# Archived Document

This document is historical and is not the current source of truth.

Current source of truth:
- `docs/ai/MULTI_AGENT_REASONING.md`
- `docs/ux/UX_STRATEGY.md`
- `docs/implementation/IMPLEMENTATION_PLAN.md`

# Run Analysis Button

The current MVP shows Run AI Analysis without auth or role gating.

Analysis must call the backend analysis endpoint, use the configured architecture agent provider, and display:

- Architecture Intelligence Score
- Score band
- Dimension breakdown
- Missing components
- Recommendations
- Trade-offs

The AI provider suggests maturity. The application scoring service calculates the final score.
