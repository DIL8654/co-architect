# AI Strategy

## Purpose

Explain how AI is used in CoArchitect AI.

## Current Scope

The MVP uses AI to support architecture review, not replace engineering judgment.

## Why Agents Are Used

Architecture review is multi-step. Different stages need different responsibilities:

- normalize input
- understand architecture cues
- select frameworks
- retrieve context
- reason about findings
- balance trade-offs
- prepare ADR-ready output

## Grounding Strategy

Recommendations are grounded by:

- framework summaries
- trade-off principles
- ADR templates
- workspace memory
- prior findings and ADR history

See [FOUNDRY_IQ_INTELLIGENCE_LAYER.md](FOUNDRY_IQ_INTELLIGENCE_LAYER.md).

## Hallucination Risk Reduction

- use one cost-aware expert call instead of many opaque external calls
- keep final scoring deterministic
- persist reasoning traces
- attach grounding references to findings where possible
- use a critic or verifier stage

## Mock Provider Strategy

`ArchitectureAgent__Provider=Mock` keeps local development reliable when Azure credentials are unavailable.

## Azure Alignment

Azure AI Foundry Agent Service is the AI integration path for the MVP and future evolution.

See [FOUNDRY_AI_INTEGRATION.md](FOUNDRY_AI_INTEGRATION.md) and [FOUNDRY_IQ_INTELLIGENCE_LAYER.md](FOUNDRY_IQ_INTELLIGENCE_LAYER.md).

## Future Enhancements

- richer Foundry-hosted specialist agents
- deeper retrieval through Azure AI Search
- stronger evaluation automation
