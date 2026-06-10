# Reasoning Agents Plan

## Purpose

CoArchitect AI will evolve from a single-analysis MVP into a multi-agent architecture reasoning platform designed to align with the Microsoft Agents League Reasoning Agents track.

The target demo must visibly show:

- multi-agent reasoning
- orchestration across specialist agents
- grounded knowledge with attributable sources
- semantic understanding of business and architecture context
- production-ready patterns such as planner-specialist-critic loops, telemetry, and safety checks
- Microsoft Foundry or Microsoft Agent Framework integration
- at least one Microsoft IQ layer concept, with Foundry IQ grounding as the MVP anchor
- synthetic/demo data only

## Challenge Alignment

CoArchitect AI will demonstrate the Reasoning Agents track by combining:

- multi-step decomposition of architecture review tasks
- agent specialization by framework and concern area
- explicit orchestration across planner, specialists, trade-off synthesis, and verification
- grounded reasoning against curated knowledge summaries
- explainable framework selection
- human-in-the-loop review through comments, weights, and ADR regeneration
- evaluable outputs with critic checks, evidence, uncertainty, and rubric-based scoring

## Product Direction

CoArchitect AI is a multi-agent reasoning platform for collaborative architecture improvement.

Primary user flow:

1. User uploads an architecture diagram or enters an architecture description.
2. User optionally provides business and operating context.
3. User chooses review frameworks manually or allows auto-detection.
4. Planner and specialist agents analyze the architecture collaboratively.
5. The system identifies risks, missing capabilities, trade-offs, and recommendations.
6. The system generates or updates an ADR.
7. The user reviews findings, comments, adjusts priorities, and iterates.

## User Inputs

The planned intake experience will support:

- architecture diagram image
- architecture description
- business domain
- target users
- expected traffic
- data sensitivity
- cloud provider preference
- compliance needs
- current pain points
- desired quality attribute priorities
- framework selection or auto-detect

## Multi-Agent Architecture

### 1. Intake Agent

Purpose:
Normalize and structure user inputs.

Inputs:

- diagram image metadata
- architecture description
- user-provided business and technical context
- selected frameworks
- selected quality attribute weights

Outputs:

- normalized architecture context
- open questions
- detected technologies
- detected cloud provider
- suggested frameworks

### 2. Diagram Understanding Agent

Purpose:
Extract components, relationships, and gaps from an uploaded diagram or text.

Outputs:

- components
- data stores
- external actors
- integrations
- trust boundaries
- missing diagram information

### 3. Framework Selection Agent

Purpose:
Choose or validate the review frameworks to apply.

Outputs:

- selected frameworks
- selection rationale
- confidence score

### 4. Azure Well-Architected Agent

Purpose:
Review the architecture using Azure Well-Architected pillars.

Focus:

- Reliability
- Security
- Cost Optimization
- Operational Excellence
- Performance Efficiency

### 5. AWS Well-Architected Agent

Purpose:
Review the architecture using AWS Well-Architected pillars.

Focus:

- Operational Excellence
- Security
- Reliability
- Performance Efficiency
- Cost Optimization
- Sustainability

### 6. ISO 25010 Quality Agent

Purpose:
Review product and system quality attributes.

Focus:

- Functional suitability
- Performance efficiency
- Compatibility
- Usability
- Reliability
- Security
- Maintainability
- Portability

### 7. OWASP ASVS Agent

Purpose:
Review web application and API security requirements.

Focus:

- Authentication
- Session management
- Access control
- Input validation
- Cryptography
- Error handling
- Data protection
- API security

### 8. Trade-off Balancing Agent

Purpose:
Compare competing options and explain consequences using weighted principles and constraints.

Outputs:

- option comparison
- recommended decision
- rejected alternatives
- trade-offs
- risk acceptance notes

### 9. Architecture Scoring Agent

Purpose:
Suggest maturity levels and score rationale only.

Constraint:
The agent must not calculate the final Architecture Intelligence Score. The application scoring engine remains the source of truth for the final score.

### 10. ADR Generation Agent

Purpose:
Generate or update an ADR from the architecture review.

Outputs:

- ADR draft
- ADR HTML
- ADR markdown
- ADR metadata

### 11. Critic / Verifier Agent

Purpose:
Validate the final output before user delivery.

Checks:

- no unsupported claims
- recommendations align with selected frameworks
- score rationale is evidence-based
- ADR is coherent
- trade-offs are explicit
- safety and uncertainty are represented

### 12. Recommendation Composer Agent

Purpose:
Create the final user-facing analysis report.

Outputs:

- executive summary
- selected frameworks
- architecture score
- missing capabilities
- prioritized roadmap
- trade-offs
- ADR suggestions
- next questions

## Orchestration Flow

The planned orchestration pattern is:

Planner -> Specialist Agents -> Trade-off Balancer -> Scoring -> ADR Generator -> Critic -> Final Composer

This flow combines:

- Planner-Executor pattern for decomposition
- role-based specialization for framework expertise
- Critic/Verifier pattern for grounded output validation
- iterative review loop after user comments
- human-in-the-loop adjustment of frameworks, weights, and ADR content

## Current Phase 3 Implementation Status

The current codebase now implements the setup and grounding layer for this plan, but not the full multi-agent runtime yet.

Implemented now:

- architecture review setup capture
- explainable framework selection preview
- persisted review context on each diagram
- persisted quality attribute weights
- analysis prompt enrichment with the saved review setup

Still planned:

- planner-specialist runtime orchestration
- critic pass before final delivery
- agent-by-agent trace view
- ADR generation pipeline
- deeper Foundry or Agent Framework specialization

## Azure Foundry Agent Strategy

For the current implementation, use one Foundry agent.

Reason:

- framework selection and orchestration are still application-led
- the stored review setup already provides grounded context to a single analysis agent
- this keeps cost and operational overhead low while the user flow stabilizes

When Phase 4 begins, consider multiple Foundry-managed agents for specialist roles such as Azure WAF, AWS WAF, ISO 25010, OWASP ASVS, trade-off balancing, or critic verification.

## Grounding And Knowledge

The knowledge grounding layer will use concise internal summaries and templates stored under `docs/knowledge-base/`.

Planned grounded sources:

- Azure Well-Architected summary notes
- AWS Well-Architected summary notes
- ISO/IEC 25010 summary notes
- OWASP ASVS summary notes
- CoArchitect scoring model
- architecture trade-off principles
- ADR templates
- synthetic architecture examples
- synthetic review reports

Grounding policy:

- use summaries, not copied framework text
- keep external standards content concise and attributed
- link to canonical sources where appropriate
- keep hackathon demos limited to synthetic/demo data

## Microsoft IQ Alignment

### Foundry IQ

Foundry IQ will be the primary grounded knowledge layer for the MVP reasoning story.

Knowledge inputs:

- curated framework summaries
- ADR template
- synthetic example architectures
- organization-approved architecture principles

### Fabric IQ

Fabric IQ will inform the semantic model used by agents.

Planned semantic entities:

- Architecture
- Component
- Quality Attribute
- Risk
- Control
- Framework
- Principle
- Decision
- ADR
- Recommendation

### Work IQ

Work IQ is the future collaboration layer.

Potential signals:

- team comments
- review activity
- decision history
- unresolved risks
- stakeholder feedback

For the hackathon MVP, Foundry IQ-style grounding is the required implementation target, while Fabric IQ and Work IQ mappings are documented for the roadmap.

## Safety And Evaluation

The system should demonstrate production-friendly reasoning controls:

- critic validation before final response
- explicit evidence and framework attribution
- visible uncertainty when diagram information is incomplete
- synthetic data only
- telemetry for agent runs, tool usage, framework selection, and verification outcomes
- evaluation rubric tied to quality, grounding, safety, and usefulness

## UX Journeys

### Journey 1: Start A Review

1. User opens the app dashboard.
2. User starts a new architecture review.
3. User uploads a diagram or enters a text description.
4. User fills optional context fields.
5. User selects frameworks or chooses auto-detect.
6. User sets quality attribute weights or accepts defaults.
7. User runs multi-agent analysis.

### Journey 2: Review Agent Reasoning

1. User sees the selected frameworks and why they were chosen.
2. User opens a reasoning view that shows planner steps, specialist findings, and confidence.
3. User compares missing capabilities, risks, and trade-offs.
4. User adjusts weights or frameworks and reruns the review.

### Journey 3: Collaborate On A Decision

1. User comments on the analysis.
2. User adds business constraints or compliance clarifications.
3. Agents update the recommendation and trade-off explanation.
4. User accepts a proposed decision or requests alternatives.

### Journey 4: Generate And Export ADR

1. User asks the system to generate an ADR from the review.
2. User edits title, context, decision, and alternatives.
3. User previews the ADR in HTML.
4. User exports the ADR as PDF.

### Journey 5: Dashboard For Returning Users

If a user already has architecture reviews:

- show active reviews
- show framework coverage
- show Architecture Intelligence Score trends
- show unresolved risks
- show ADRs needing review

If a user has no reviews:

- show a guided start flow for upload, context capture, and first analysis

## Demo Story

The hackathon demo should emphasize:

- architecture review framed as a reasoning problem, not a single completion
- planner and specialist collaboration
- visible framework grounding
- explainable framework selection
- weighted trade-off balancing
- ADR generation from analysis
- final scoring calculated by the application, not by the AI

## Recommended Implementation Sequence

1. Framework selection and context capture UX
2. grounded knowledge base files
3. planner-specialist orchestration backend
4. critic and telemetry
5. ADR HTML generation
6. PDF export
7. Foundry integration and evaluation harness
