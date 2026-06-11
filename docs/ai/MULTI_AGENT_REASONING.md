# Multi-Agent Reasoning

## Purpose

Describe the current and future reasoning flow.

## Current Scope

The MVP uses application-led orchestration with specialist reasoning stages and one cost-aware Azure AI Foundry expert call.

The diagram workbench exposes this flow directly through a dedicated `Agent Workflow` view so users can inspect the pipeline for the selected analysis run.

## Current Flow

```text
Intake
-> Diagram Understanding
-> Framework Selection
-> Context Enrichment
-> Foundry IQ Retrieval
-> Foundry Expert
-> Framework Specialists
-> Trade-off Balancer
-> Scoring Suggestions
-> ADR Preparation
-> Critic
-> Recommendation Composer
```

## Stage Summary

- Intake: normalize user input
- Diagram Understanding: extract architecture cues
- Framework Selection: choose standards and review lenses
- Context Enrichment: gather grounded context
- Foundry IQ Retrieval: assemble the shared context bundle
- Foundry Expert: one external expert call
- Framework Specialists: produce lens-specific findings
- Trade-off Balancer: compare architecture options
- Scoring Suggestions: suggest maturity changes
- ADR Preparation: assemble decision material
- Critic: validate output quality
- Recommendation Composer: build the final user-facing result

## Design Decisions

The current MVP does not pretend that every stage is a separate Azure-hosted agent. The orchestration is visible and intentional, but most stages are still implemented inside the application runtime.

## Implementation Notes

See [AGENT_CATALOG.md](AGENT_CATALOG.md) and [AGENT_ORCHESTRATION_FLOW.md](AGENT_ORCHESTRATION_FLOW.md).

The current UI presents:

- a score-first summary in `Architecture Intelligence`
- a dedicated `Agent Workflow` tab for the selected run
- run history alongside workflow switching
- grounded context and citations next to findings and recommendations

## Future Enhancements

Future phases may move more specialists into separate Foundry-hosted agents.
