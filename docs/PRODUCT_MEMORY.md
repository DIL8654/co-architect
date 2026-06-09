# CoArchitect AI Product Memory

## Vision

CoArchitect AI is an AI-powered architecture collaboration platform.

It acts as an AI Architecture Partner helping engineering teams design, review, and improve software architecture.

The platform identifies missing architecture capabilities and provides standards-backed recommendations.

## Current MVP

The hackathon MVP is a simple unauthenticated application. Users can open the app, create organizations and workspaces, add architecture diagrams or descriptions, comment, run analysis, and view scores without login.

See `docs/AUTH_DECISION.md` before changing auth, routing, onboarding, organization creation, or API client behavior.

## Core Capabilities

- Organization management
- Architecture workspaces
- Architecture diagrams and descriptions
- Diagram comments
- AI architecture analysis
- Architecture trade-off analysis
- Architecture scoring
- Architecture recommendations
- Improvement roadmaps

## Future User And Role Model

Proper users, permissions, organization roles, and external IdP integration will be added after the MVP.

Domain concepts may remain:

- User
- OrganizationUser
- OrganizationRole
- Role enums

They must not block the current unauthenticated MVP flow.

## Quality Attributes

- Security
- Scalability
- Availability
- Reliability
- Observability
- Maintainability
- Operational Excellence
- Cost Optimization
- Tenant Isolation
- Compliance
- Disaster Recovery

## Technology

- Backend: .NET 10
- Frontend: React, TypeScript, Vite
- Database: PostgreSQL
- Storage: Azure Blob Storage through container SAS for the MVP
- AI: Azure AI Foundry Agent Service, with mock local provider
- Architecture: Clean Architecture
- Local development: Docker Compose

The application must run locally without Azure credentials by default.

For the hackathon Azure-connected local flow, use manually created Azure resources and environment variables documented in `docs/AZURE_LOCAL_RESOURCES_GUIDE.md`. Azure Key Vault is the manual source of secret values, but the app reads local environment variables at runtime.
