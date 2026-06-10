# Knowledge Base Plan

## Purpose

CoArchitect AI needs a grounded knowledge layer so specialist agents reason from curated architecture guidance instead of relying only on general model recall.

For the hackathon MVP, this knowledge base should be concise, attributable, synthetic-data-safe, and easy to evolve.

## Planned Folder Structure

```text
docs/knowledge-base/
  azure-well-architected-summary.md
  aws-well-architected-summary.md
  iso-25010-summary.md
  owasp-asvs-summary.md
  architecture-tradeoff-principles.md
  adr-template.md
  synthetic-architecture-examples.md
  reasoning-agent-rubric.md
```

## Knowledge Sources

Planned grounded inputs:

- Azure Well-Architected summary notes
- AWS Well-Architected summary notes
- ISO/IEC 25010 quality model summary notes
- OWASP ASVS summary notes
- internal CoArchitect scoring model
- architecture trade-off principles
- ADR template
- synthetic architecture examples
- synthetic review report examples

## Safe Summarization Policy

- do not copy large copyrighted framework content into the repo
- create concise summaries in original wording
- include source attribution and canonical links where appropriate
- preserve only the parts needed for reasoning and demo grounding
- mark interpretive guidance as CoArchitect synthesis when it is not a direct framework statement

## Source Attribution Rules

Each knowledge file should include:

- source name
- short attribution note
- canonical link when appropriate
- summary scope and limitations

## Synthetic Data Policy

The Reasoning Agents track demo should use synthetic and demo data only.

Allowed examples:

- fictional SaaS architectures
- synthetic review comments
- sample ADRs for demo flows
- fabricated but realistic business constraints

Not allowed for the hackathon demo:

- customer production diagrams
- customer secrets
- real regulated data
- copied internal architecture documents from outside the repo

## Microsoft IQ Mapping

### Foundry IQ

Foundry IQ is the planned grounded knowledge layer.

Use cases:

- specialist agents retrieve framework summaries
- ADR generator retrieves template structure
- trade-off agent retrieves principle guidance
- critic agent validates alignment with grounded references

### Fabric IQ

Fabric IQ informs the semantic model behind the knowledge layer.

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

Work IQ is the future collaboration signal layer.

Potential future signals:

- user comments
- review history
- unresolved risk backlog
- stakeholder responses

## Evaluation Support

The knowledge base should also support evaluation:

- framework alignment checks
- evidence coverage checks
- trade-off explanation quality
- ADR completeness checks
- critic pass/fail rationale

