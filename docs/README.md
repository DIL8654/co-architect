# CoArchitect AI Documentation

## Purpose

This documentation set explains CoArchitect AI as a workspace-centric architecture reasoning platform built for the Microsoft Agents League hackathon.

## Current Scope

The current hackathon MVP focuses on one clear value loop:

Workspace -> Diagram or Architecture Description -> AI Architecture Review -> Agent Reasoning Trace -> Architecture Intelligence Score -> Findings -> Trade-offs -> ADR Generation

The runtime is intentionally unauthenticated for evaluator usability. A fixed local tenant and user placeholder exist internally, but tenant is not a user-facing object.

## Recommended Reading Order

1. [product/PRODUCT_VISION.md](product/PRODUCT_VISION.md)
2. [product/HACKATHON_SCOPE.md](product/HACKATHON_SCOPE.md)
3. [product/USER_JOURNEYS.md](product/USER_JOURNEYS.md)
4. [architecture/SYSTEM_ARCHITECTURE.md](architecture/SYSTEM_ARCHITECTURE.md)
5. [ai/MULTI_AGENT_REASONING.md](ai/MULTI_AGENT_REASONING.md)
6. [ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md](ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md)
7. [hackathon/HACKATHON_JUDGING_ALIGNMENT.md](hackathon/HACKATHON_JUDGING_ALIGNMENT.md)
8. [hackathon/DEMO_SCRIPT.md](hackathon/DEMO_SCRIPT.md)
9. [implementation/LOCAL_DEVELOPMENT.md](implementation/LOCAL_DEVELOPMENT.md)

## Documentation Map

### Product

- [PRODUCT_VISION.md](product/PRODUCT_VISION.md)
- [HACKATHON_SCOPE.md](product/HACKATHON_SCOPE.md)
- [USER_JOURNEYS.md](product/USER_JOURNEYS.md)
- [PERSONAS.md](product/PERSONAS.md)
- [DEMO_STORY.md](product/DEMO_STORY.md)
- [PRODUCT_DEVELOPMENT_STORY.md](product/PRODUCT_DEVELOPMENT_STORY.md)
- [ROADMAP.md](product/ROADMAP.md)

### Architecture

- [SYSTEM_ARCHITECTURE.md](architecture/SYSTEM_ARCHITECTURE.md)
- [CLEAN_ARCHITECTURE_BACKEND.md](architecture/CLEAN_ARCHITECTURE_BACKEND.md)
- [FRONTEND_ARCHITECTURE.md](architecture/FRONTEND_ARCHITECTURE.md)
- [DATA_MODEL.md](architecture/DATA_MODEL.md)
- [STORAGE_MODEL.md](architecture/STORAGE_MODEL.md)
- [AUTH_DECISION.md](architecture/AUTH_DECISION.md)
- [SCORING_MODEL.md](architecture/SCORING_MODEL.md)
- [RELIABILITY_AND_SAFETY.md](architecture/RELIABILITY_AND_SAFETY.md)

### AI

- [AI_STRATEGY.md](ai/AI_STRATEGY.md)
- [FOUNDRY_AI_INTEGRATION.md](ai/FOUNDRY_AI_INTEGRATION.md)
- [FOUNDRY_IQ_INTELLIGENCE_LAYER.md](ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md)
- [MULTI_AGENT_REASONING.md](ai/MULTI_AGENT_REASONING.md)
- [AGENT_CATALOG.md](ai/AGENT_CATALOG.md)
- [AGENT_ORCHESTRATION_FLOW.md](ai/AGENT_ORCHESTRATION_FLOW.md)
- [FRAMEWORK_SELECTION.md](ai/FRAMEWORK_SELECTION.md)
- [TRADEOFF_BALANCING.md](ai/TRADEOFF_BALANCING.md)
- [ADR_GENERATION_WORKFLOW.md](ai/ADR_GENERATION_WORKFLOW.md)
- [PROMPTS_AND_SKILLS.md](ai/PROMPTS_AND_SKILLS.md)
- [EVALUATION_STRATEGY.md](ai/EVALUATION_STRATEGY.md)

### Implementation

- [IMPLEMENTATION_PLAN.md](implementation/IMPLEMENTATION_PLAN.md)
- [LOCAL_DEVELOPMENT.md](implementation/LOCAL_DEVELOPMENT.md)
- [AZURE_LOCAL_RESOURCES.md](implementation/AZURE_LOCAL_RESOURCES.md)
- [ENVIRONMENT_VARIABLES.md](implementation/ENVIRONMENT_VARIABLES.md)
- [TROUBLESHOOTING.md](implementation/TROUBLESHOOTING.md)
- [RELEASE_CHECKLIST.md](implementation/RELEASE_CHECKLIST.md)
- [DOCUMENTATION_QUALITY_CHECKLIST.md](implementation/DOCUMENTATION_QUALITY_CHECKLIST.md)

### UX

- [UX_STRATEGY.md](ux/UX_STRATEGY.md)
- [UI_LAYOUT_AUDIT.md](ux/UI_LAYOUT_AUDIT.md)
- [UI_LAYOUT_PLAN.md](ux/UI_LAYOUT_PLAN.md)
- [NAVIGATION_MODEL.md](ux/NAVIGATION_MODEL.md)
- [DESIGN_SYSTEM.md](ux/DESIGN_SYSTEM.md)

### Hackathon

- [HACKATHON_JUDGING_ALIGNMENT.md](hackathon/HACKATHON_JUDGING_ALIGNMENT.md)
- [DEMO_SCRIPT.md](hackathon/DEMO_SCRIPT.md)
- [SUBMISSION_NOTES.md](hackathon/SUBMISSION_NOTES.md)
- [FINAL_PRESENTATION_OUTLINE.md](hackathon/FINAL_PRESENTATION_OUTLINE.md)

## Current Versus Future

- Current: workspace-centric MVP, one cost-aware Azure AI Foundry expert call, local specialist reasoning, Foundry IQ-style intelligence layer, synthetic demo data, unauthenticated local runtime.
- Future: real identity, tenant-aware RBAC, richer Foundry-hosted specialists, deeper retrieval through Azure AI Search and enterprise knowledge connectors.

## Hackathon Alignment Summary

CoArchitect AI is intentionally positioned as an AI architecture partner:

- Azure AI Foundry is the AI integration path.
- A Foundry IQ-style intelligence layer grounds recommendations.
- The Architecture Intelligence Score is calculated by application code.
- Agent orchestration and reasoning trace are visible in the UI.
- GitHub Copilot and Codex were used as incremental AI-assisted development collaborators.
