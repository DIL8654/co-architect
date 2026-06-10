# ADR Workflow

## Purpose

CoArchitect AI will support Architecture Decision Records as a first-class output of the multi-agent reasoning process.

The system should help teams move from architecture findings to explicit decisions, alternatives, consequences, and next actions.

## User Workflows

### Create ADR From Scratch

The user provides:

- title
- context
- proposed decision
- optional alternatives
- optional risks or constraints

The ADR agent helps structure the content into a clean ADR draft.

### Generate ADR From Architecture Review

The user starts from a completed analysis and asks the system to generate an ADR from:

- architecture findings
- selected frameworks
- weighted trade-offs
- comments
- proposed recommendation

### Update Existing ADR

The user can reopen an ADR, change context or constraints, add comments, adjust weights, and ask the system to regenerate or refine the draft.

## ADR Fields

Planned ADR structure:

- Title
- Status
- Context
- Decision
- Alternatives Considered
- Trade-offs
- Consequences
- Risks
- Compliance and Security Notes
- Related Architecture Findings
- Review Frameworks Used
- Date
- Authors and Contributors placeholder

## Orchestration Flow

The ADR generation flow is:

1. Intake Agent collects ADR intent and architecture context.
2. Specialist agents provide supporting findings.
3. Trade-off Balancing Agent identifies the preferred option and alternatives.
4. ADR Generation Agent creates the ADR draft.
5. Critic Agent validates coherence, evidence alignment, and explicit consequences.
6. Recommendation Composer produces the final ADR preview and summary.

## AI Review Adjustment Loop

Planned loop:

1. User reviews the ADR draft.
2. User comments or adjusts principles, frameworks, or constraints.
3. Agents update findings and trade-off reasoning.
4. ADR Generation Agent refreshes the draft.
5. Critic verifies consistency with the updated evidence.

## Output Formats

The platform should support:

- HTML preview in the app
- Markdown storage
- PDF download

## HTML Preview Plan

The ADR should first render as structured HTML with:

- clean typography
- clear section headings
- evidence and framework references
- compact metadata block
- printable layout

## PDF Export Plan

Implementation plan:

1. Generate clean HTML first.
2. Convert HTML to PDF using a backend-friendly library that works in Docker.
3. Keep styling simple, readable, and professional.
4. Store the generated PDF under the ADR export path.

Storage path:

```text
orgs/{orgId}/workspaces/{workspaceId}/adrs/{adrId}/exports/{adrId}.pdf
```

## UX Journeys

### ADR From Analysis Journey

1. User completes a multi-agent review.
2. User opens the recommendation panel.
3. User clicks `Generate ADR`.
4. User reviews the generated title, context, decision, alternatives, and consequences.
5. User edits any section.
6. User saves the ADR and optionally exports PDF.

### ADR Revision Journey

1. User opens an existing ADR.
2. User updates weights, comments, or business constraints.
3. User clicks `Regenerate With Changes`.
4. User compares the old and new decision rationale.
5. User accepts the update and exports the final ADR.

## Safety Rules

- the ADR must cite the frameworks used
- the ADR must reflect selected weights and constraints
- unsupported claims must be rejected by the critic step
- uncertainty and missing information should be called out explicitly

