# Scoring Model

## Purpose

Formalize the Architecture Intelligence Score.

## Current Scope

The current MVP calculates the final Architecture Intelligence Score in application code.

## Score Purpose

The score gives users a structured quality signal across architecture dimensions. It is a decision aid, not a substitute for engineering judgment.

## Dimensions

- Security
- Reliability and Availability
- Scalability and Performance
- Operational Excellence
- Data and Tenant Isolation
- Compliance and Governance
- Cost Optimization
- Maintainability

## Maturity Levels

Each dimension uses a maturity scale from 1 to 5.

## Formula

1. AI and specialist stages suggest maturity evidence and maturity improvements.
2. The application scoring service calculates weighted contributions.
3. The final score is normalized to the Architecture Intelligence Score scale.

## Score Bands

- early
- developing
- established
- strong
- advanced

Exact thresholds remain owned by the application scoring service.

## Design Decisions

The AI provider suggests maturity levels and evidence.

The application scoring service calculates the final Architecture Intelligence Score.

This keeps scoring deterministic, testable, and auditable.

## Implementation Notes

Scoring is intentionally separate from the Azure AI Foundry provider and from the Foundry IQ-style retrieval layer.

See [EVALUATION_STRATEGY.md](../ai/EVALUATION_STRATEGY.md) for validation direction.

## Future Enhancements

- richer confidence signals
- more explicit scoring explanations in the UI
