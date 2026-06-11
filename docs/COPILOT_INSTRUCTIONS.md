# Copilot Rules

Always read:

- docs/README.md
- docs/product/PRODUCT_VISION.md
- docs/product/HACKATHON_SCOPE.md
- docs/architecture/SYSTEM_ARCHITECTURE.md
- docs/architecture/AUTH_DECISION.md
- docs/architecture/SCORING_MODEL.md
- docs/ai/MULTI_AGENT_REASONING.md
- docs/ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md
- docs/ai/FRAMEWORK_SELECTION.md
- docs/ai/TRADEOFF_BALANCING.md
- docs/ai/ADR_GENERATION_WORKFLOW.md
- docs/implementation/AZURE_LOCAL_RESOURCES.md

Rules:

1. Implement only requested functionality.
2. Do not rewrite unrelated files.
3. Preserve Clean Architecture boundaries.
4. Domain never references Infrastructure.
5. Domain never references Api.
6. Application never references Api.
7. Infrastructure may reference Domain and Application.
8. Api may reference all projects.
9. Use GUID identifiers.
10. Use UTC timestamps.
11. Add ADRs for significant decisions.
12. Prefer interfaces over concrete implementations.
13. Do not calculate architecture score inside AI responses.
14. Score calculation must happen in code.
15. Local development must work without Azure credentials.
16. Register `MockArchitectureAgentService` when Azure AI configuration is missing.
17. Use async methods.
18. Use cancellation tokens.
19. Favor simplicity over premature optimization.
20. Keep hackathon implementation production-friendly.

## Shared Memory For Copilot/Codex

- Always read `docs/architecture/AUTH_DECISION.md` before modifying authentication, authorization, onboarding, routing, workspace creation, tenant handling, or API client behavior.
- The current app is intentionally unauthenticated for the hackathon MVP.
- Do not add fake auth, demo auth, role selectors, or header-based role overrides.
- Do not add token or bearer-header injection to the frontend API client.
- Do not make UI buttons unavailable based on role/auth in the current MVP.
- Workspace is the top-level user-facing object.
- Do not reintroduce user-facing organization flows into the main product shell.
- Use the fixed local tenant and user placeholder context for local runtime seams until real auth returns.
- Keep `User`, `OrganizationUser`, `OrganizationRole`, and role enums as future domain concepts if they are useful, but do not enforce them at runtime now.
- Future production work should add external IdP integration and tenant-aware RBAC.
- Read `docs/implementation/AZURE_LOCAL_RESOURCES.md` before changing database, blob storage, Key Vault, Azure AI Foundry, Docker, or cloud deployment behavior.
- Keep Azure integration simple for the hackathon: manual resources, secrets exported locally, mock AI fallback, and no fake auth.
- Future agents must read `docs/ai/MULTI_AGENT_REASONING.md` before modifying agent orchestration, planner logic, specialist roles, critic behavior, or evaluation flow.
- Future agents must read `docs/ai/FRAMEWORK_SELECTION.md` before changing framework selection behavior, auto-detection, or framework explanation UX.
- Future agents must read `docs/ai/TRADEOFF_BALANCING.md` before changing weighting, trade-off recommendation logic, or option comparison behavior.
- Future agents must read `docs/ai/ADR_GENERATION_WORKFLOW.md` before changing ADR creation, regeneration, HTML preview, or PDF export behavior.
- Future agents must read `docs/ai/FOUNDRY_IQ_INTELLIGENCE_LAYER.md` before changing retrieval, grounding references, context enrichment, workspace memory, or Foundry IQ-aligned orchestration.
