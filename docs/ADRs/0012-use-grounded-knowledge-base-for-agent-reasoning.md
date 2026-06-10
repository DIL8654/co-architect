# 0012 Use Grounded Knowledge Base For Agent Reasoning

## Status

Accepted

## Context

Reasoning quality and safety are stronger when specialist agents use curated reference material instead of relying only on model memory. The hackathon demo also needs a clear story for grounded knowledge and Microsoft IQ alignment.

## Decision

CoArchitect AI will maintain a concise grounded knowledge base under `docs/knowledge-base/` using summaries, templates, and synthetic examples. This knowledge base will serve as the Foundry IQ-style grounding layer for agent reasoning.

## Consequences

- specialist agents gain a clear and attributable knowledge source
- the repo must follow safe summarization and source attribution rules
- knowledge artifacts become part of evaluation, critic checks, and demo explanation
- the team can extend the knowledge base later without changing the core product story

