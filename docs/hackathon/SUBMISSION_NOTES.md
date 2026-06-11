# Submission Notes

## Purpose

Provide evaluator-friendly submission material.

## Project Title

CoArchitect AI

## Tagline

An AI architecture partner for grounded multi-agent architecture review.

## Short Description

CoArchitect AI helps teams review architecture diagrams and descriptions through multi-agent reasoning, grounded standards, trade-off analysis, and ADR generation.

## Long Description

The current hackathon MVP is a workspace-centric architecture reasoning platform. Users create a workspace, add architecture evidence, run AI analysis, inspect reasoning traces and grounded findings, review the Architecture Intelligence Score, and generate ADRs. The system uses Azure AI Foundry as the AI integration path and a Foundry IQ-style intelligence layer to ground recommendations in architecture frameworks, trade-off principles, ADR templates, and workspace memory.

## Challenge Track

Microsoft Agents League — Reasoning Agents

## Technologies Used

- .NET 10
- React
- TypeScript
- Vite
- TiDB Cloud
- Azure Blob Storage
- Azure AI Foundry Agent Service

## Microsoft Technologies Used

- Azure AI Foundry Agent Service
- Azure Blob Storage
- Azure Key Vault as manual secret source

## AI Features

- multi-stage architecture reasoning
- framework selection
- grounded findings
- trade-off balancing
- ADR generation

## Foundry IQ Requirement

The current build uses a Foundry IQ-style intelligence layer implemented locally through a retrieval abstraction and shared context bundle. It grounds recommendations with framework summaries, architecture principles, ADR templates, trade-off guidance, and workspace memory.

## Known Limitations

- unauthenticated local runtime
- current reasoning mostly application-led
- Azure AI Search is not yet integrated

## Future Roadmap

See [ROADMAP.md](../product/ROADMAP.md).
