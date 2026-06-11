# Hackathon Scope

## Purpose

Define the current build scope for the hackathon.

## Current Scope

The MVP is intentionally narrow: it proves the architecture reasoning loop clearly and reliably.

## In Scope

- workspaces
- diagrams and architecture descriptions
- review setup and framework mode
- AI analysis
- agent reasoning trace
- Architecture Intelligence Score
- findings and recommendations
- trade-offs
- ADR generation and versioning
- local run with mock AI provider
- Azure AI Foundry integration path

## Out Of Scope For Hackathon

- full production authentication
- full organization management
- granular permissions
- enterprise SSO
- deployment automation
- full Azure AI Search ingestion
- real customer data

## Scope Rationale

The hackathon MVP focuses on the core product value:

1. capture architecture evidence
2. reason over it with grounded AI stages
3. explain the findings
4. generate an ADR-ready decision output

That scope is strong enough to demonstrate product value without overpromising unfinished enterprise features.

See the live walkthrough framing in [DEMO_SCRIPT.md](../hackathon/DEMO_SCRIPT.md).

## Design Decisions

- workspace is the top-level user-facing container
- tenant is an internal runtime boundary, not a user-facing object
- the current runtime is unauthenticated for evaluator usability
- Azure AI Foundry is the AI integration path
- Foundry IQ-style retrieval grounds recommendations

## Future Enhancements

Future scope is documented in [ROADMAP.md](ROADMAP.md).
