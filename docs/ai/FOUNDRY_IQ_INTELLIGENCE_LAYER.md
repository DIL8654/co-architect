# Foundry IQ Intelligence Layer

## Purpose

Formalize the Foundry IQ-style intelligence layer used by CoArchitect AI.

## Current Scope

The current MVP uses a Foundry IQ-style intelligence layer, not a full managed Azure Foundry IQ deployment.

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
- `CompositeFoundryIqProvider`
- future `AzureSearchFoundryIqProvider`

## Design Decisions

- use a shared context bundle
- separate retrieval from reasoning
- keep the current implementation local and deterministic first
- preserve a clean provider seam for future Azure-managed retrieval

## Implementation Notes

The current provider stack combines `docs/knowledge-base/` content with TiDB-backed workspace history. This is enough to make recommendations grounded, reusable, and explainable during the hackathon demo.

## Future Enhancements

- Azure AI Search-backed retrieval
- enterprise knowledge connectors
- tenant-specific standards and repositories
