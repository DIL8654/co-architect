# Copilot Rules

Always read:

- PRODUCT_MEMORY.md
- ARCHITECTURE.md
- AUTH_DECISION.md
- AZURE_LOCAL_RESOURCES_GUIDE.md
- SCORING_MODEL.md
- AGENTS.md
- REASONING_AGENTS_PLAN.md
- FRAMEWORK_SELECTION.md
- TRADEOFF_BALANCING.md
- ADR_WORKFLOW.md
- KNOWLEDGE_BASE_PLAN.md

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

- Always read `docs/AUTH_DECISION.md` before modifying authentication, authorization, onboarding, routing, workspace creation, tenant handling, or API client behavior.
- The current app is intentionally unauthenticated for the hackathon MVP.
- Do not add fake auth, demo auth, role selectors, or header-based role overrides.
- Do not add token or bearer-header injection to the frontend API client.
- Do not make UI buttons unavailable based on role/auth in the current MVP.
- Workspace is the top-level user-facing object.
- Do not reintroduce user-facing organization flows into the main product shell.
- Use the fixed local tenant and user placeholder context for local runtime seams until real auth returns.
- Keep `User`, `OrganizationUser`, `OrganizationRole`, and role enums as future domain concepts if they are useful, but do not enforce them at runtime now.
- Future production work should add external IdP integration and tenant-aware RBAC.
- Read `docs/AZURE_LOCAL_RESOURCES_GUIDE.md` before changing database, blob storage, Key Vault, Azure AI Foundry, Docker, or cloud deployment behavior.
- Keep Azure integration simple for the hackathon: manual resources, secrets exported locally, mock AI fallback, and no fake auth.
- Future agents must read `docs/REASONING_AGENTS_PLAN.md` before modifying agent orchestration, planner logic, specialist roles, critic behavior, or evaluation flow.
- Future agents must read `docs/FRAMEWORK_SELECTION.md` before changing framework selection behavior, auto-detection, or framework explanation UX.
- Future agents must read `docs/TRADEOFF_BALANCING.md` before changing weighting, trade-off recommendation logic, or option comparison behavior.
- Future agents must read `docs/ADR_WORKFLOW.md` before changing ADR creation, regeneration, HTML preview, or PDF export behavior.
- Future agents must read `docs/KNOWLEDGE_BASE_PLAN.md` before changing grounded knowledge files, knowledge retrieval behavior, or attribution policy.
