# Agent Catalog

## Purpose

Provide a concise catalog of the reasoning stages and agents.

## Current Scope

The MVP uses application-led orchestration with one Azure AI Foundry expert call and several local specialist stages.

## Catalog

| Name | Purpose | Inputs | Outputs | Current Status | Future Enhancement |
|---|---|---|---|---|---|
| Intake Agent | normalize review input | diagram, description, review setup | normalized context | implemented as app stage | richer intake forms |
| Diagram Understanding Agent | extract architecture cues | description, diagram metadata | technologies, gaps, signals | implemented as app stage | richer visual parsing |
| Framework Selection Agent | choose review lenses | context, cues, weights | frameworks, rationale | implemented as app stage | stronger retrieval influence |
| Context Enrichment Agent | assemble grounded context | query, workspace history | context bundle | implemented | Azure Search provider |
| Azure Well-Architected Agent | Azure review | facts, context | findings | implemented as app specialist | dedicated Foundry agent |
| AWS Well-Architected Agent | AWS review | facts, context | findings | implemented as app specialist | dedicated Foundry agent |
| ISO 25010 Agent | quality attribute review | facts, context | findings | implemented as app specialist | broader quality depth |
| OWASP ASVS Agent | security review | facts, context | findings | implemented as app specialist | richer security evidence |
| Trade-off Balancing Agent | compare options | findings, weights | trade-offs | implemented as app stage | comparative option scoring |
| Architecture Scoring Agent | suggest maturity | findings | maturity suggestions | implemented as app stage | richer confidence signals |
| ADR Generation Agent | prepare ADR content | findings, trade-offs, history | ADR draft inputs | implemented | PDF export maturity |
| Critic / Verifier Agent | validate output quality | combined analysis | critic notes | implemented | stronger policy checks |
| Recommendation Composer Agent | assemble final report | all prior outputs | final user-facing result | implemented | richer narratives |

## Future Enhancements

Future work may split more of these stages into separate Foundry-hosted agents.
