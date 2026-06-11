# Hackathon Judging Alignment

## Purpose

Map CoArchitect AI directly to the Microsoft Agents League judging criteria.

## Current Scope

This document describes the current MVP honestly and separates future scope clearly.

## Accuracy And Relevance

### What The Product Does

CoArchitect AI reviews architecture diagrams and descriptions through multi-stage reasoning, standards-backed findings, trade-off analysis, and ADR generation.

### Where It Is Visible

- workspace and diagram flow
- analysis result page
- agent reasoning trace
- Architecture Intelligence Score

### Supporting Docs

- [HACKATHON_SCOPE.md](../product/HACKATHON_SCOPE.md)
- [SYSTEM_ARCHITECTURE.md](../architecture/SYSTEM_ARCHITECTURE.md)

### Future Scope

Identity, enterprise connectors, and deployment automation are intentionally out of current scope.

## Reasoning And Multi-Step Thinking

### What The Product Does

The runtime shows a visible multi-step chain:

Planner-like intake -> understanding -> framework selection -> context enrichment -> Foundry IQ retrieval -> expert call -> specialists -> trade-off balancing -> scoring suggestions -> ADR preparation -> critic -> composer

### Where It Is Visible

- agent trace view
- Foundry IQ context panels
- grounded finding details

### Supporting Docs

- [MULTI_AGENT_REASONING.md](../ai/MULTI_AGENT_REASONING.md)
- [AGENT_ORCHESTRATION_FLOW.md](../ai/AGENT_ORCHESTRATION_FLOW.md)

### Future Scope

More stages may become separate Foundry-hosted agents later.

## Creativity And Originality

### What The Product Does

CoArchitect AI is positioned as an AI architecture partner, not a generic chat wrapper.

### Where It Is Visible

- framework-aware reviews
- Architecture Intelligence Score
- ADR generation
- Foundry IQ-style grounding

### Supporting Docs

- [PRODUCT_VISION.md](../product/PRODUCT_VISION.md)
- [FOUNDRY_IQ_INTELLIGENCE_LAYER.md](../ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md)

### Future Scope

Deeper workspace memory and enterprise knowledge connectors.

## User Experience And Presentation

### What The Product Does

The product is workspace-centric, minimal, and demoable.

### Where It Is Visible

- left shell navigation
- focused diagram workspace
- table-first analysis surfaces
- dashboard context filtering

### Supporting Docs

- [UX_STRATEGY.md](../ux/UX_STRATEGY.md)
- [USER_JOURNEYS.md](../product/USER_JOURNEYS.md)
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md)

### Future Scope

Richer collaboration and approvals.

## Reliability And Safety

### What The Product Does

The current MVP keeps scoring deterministic, uses synthetic data, and exposes grounding references.

### Where It Is Visible

- application-calculated score
- critic notes
- mock fallback
- Foundry IQ context

### Supporting Docs

- [SCORING_MODEL.md](../architecture/SCORING_MODEL.md)
- [RELIABILITY_AND_SAFETY.md](../architecture/RELIABILITY_AND_SAFETY.md)
- [EVALUATION_STRATEGY.md](../ai/EVALUATION_STRATEGY.md)

### Future Scope

Identity, RBAC, and enterprise connector governance.

## Community Vote

### What The Product Does

The demo is easy to explain:

open app -> create workspace -> add architecture -> run analysis -> inspect reasoning -> generate ADR

### Where It Is Visible

- landing page
- diagram detail page
- analysis page

### Supporting Docs

- [DEMO_STORY.md](../product/DEMO_STORY.md)
- [DEMO_SCRIPT.md](DEMO_SCRIPT.md)

### Future Scope

Presentation polish can continue without changing the core product narrative.
