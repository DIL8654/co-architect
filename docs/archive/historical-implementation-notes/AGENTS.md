# Archived Document

This document is historical and is not the current source of truth.

Current source of truth:
- `docs/ai/AGENT_CATALOG.md`
- `docs/ai/MULTI_AGENT_REASONING.md`
- `docs/ai/AGENT_ORCHESTRATION_FLOW.md`

# CoArchitect AI Agents

## Current State

The current MVP uses a single analysis flow with domain-specific scoring and recommendation outputs.

## Planned Multi-Agent Model

CoArchitect AI is being planned as a multi-agent reasoning platform.

Primary planned agents:

- Intake Agent
- Diagram Understanding Agent
- Framework Selection Agent
- Azure Well-Architected Agent
- AWS Well-Architected Agent
- ISO 25010 Quality Agent
- OWASP ASVS Agent
- Trade-off Balancing Agent
- Architecture Scoring Agent
- ADR Generation Agent
- Critic / Verifier Agent
- Recommendation Composer Agent

## Orchestration

Planned orchestration:

Planner -> Specialist Agents -> Trade-off Balancer -> Scoring -> ADR Generator -> Critic -> Final Composer

## Grounding

Specialist agents should ground on curated knowledge summaries and templates under `docs/knowledge-base/`.

## References

- `docs/REASONING_AGENTS_PLAN.md`
- `docs/FRAMEWORK_SELECTION.md`
- `docs/TRADEOFF_BALANCING.md`
- `docs/ADR_WORKFLOW.md`
- `docs/KNOWLEDGE_BASE_PLAN.md`
