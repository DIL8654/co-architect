# Foundry IQ Intelligence Layer

## Purpose

Formalize the Foundry IQ-style intelligence layer used by CoArchitect AI.

## Current Scope

The current MVP now supports a hybrid retrieval model:

- managed Azure Foundry IQ through a dedicated Foundry retrieval agent
- repo-backed `docs/knowledge-base/` fallback
- workspace memory assembled inside CoArchitect

## What It Means In CoArchitect AI

Agents use shared context before reasoning. That context includes:

- framework summaries
- architecture principles
- trade-off guidance
- ADR templates
- workspace memory
- prior findings
- ADR history

## Current Contracts

- `IFoundryIqProvider`
- `FoundryIqQuery`
- `FoundryIqContextBundle`
- `FoundryIqContextItem`
- `WorkspaceMemorySnapshot`
- `IContextEnrichmentAgent`

## Current Providers

- `FileSystemFoundryIqProvider`
- `AzureFoundryIqProvider`
- `HybridFoundryIqKnowledgeProvider`
- `CompositeFoundryIqProvider`

## Design Decisions

- use a shared context bundle
- separate retrieval from reasoning
- prefer managed Foundry IQ when configured
- fall back automatically to the repo knowledge base when managed retrieval is unavailable
- keep workspace memory in CoArchitect for the first pass
- keep the local folder as the version-controlled source of truth and backup

## Implementation Notes

The current provider stack supports three layers:

1. `AzureFoundryIqProvider` for managed Foundry IQ retrieval through a dedicated prompt agent connected to a Foundry knowledge base
2. `FileSystemFoundryIqProvider` for repo-backed fallback retrieval from `docs/knowledge-base/`
3. `CompositeFoundryIqProvider` for adding workspace memory, prior findings, comments, and ADR history

Use `node scripts/prepare-foundry-iq-upload.mjs` to stage the current repo knowledge base for upload into Microsoft Foundry.

## Future Enhancements

- Azure AI Search-backed retrieval
- enterprise knowledge connectors
- tenant-specific standards and repositories
- deeper programmatic knowledge-base sync instead of the current upload helper
