# 0011 Support ADR Generation HTML And PDF

## Status

Accepted

## Context

Architecture reviews are more actionable when they end in a durable decision record. Teams also need an output that can be reviewed in the browser and shared outside the application.

## Decision

CoArchitect AI will support ADR creation from scratch and ADR generation from review findings. ADRs will render as HTML in the app, persist as markdown, and support backend-driven PDF export from HTML.

## Consequences

- architecture findings can be turned into reviewable decisions inside the product
- the backend will need an HTML-to-PDF export capability that works in Docker
- ADR storage, regeneration, and versioning become part of the platform model
- the UX should support iterative updates after comments or changed priorities

