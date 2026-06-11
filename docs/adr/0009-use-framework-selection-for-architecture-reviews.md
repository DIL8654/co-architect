# 0009 Use Framework Selection For Architecture Reviews

## Status

Accepted

## Context

Architecture reviews are more useful when they reflect the actual cloud environment, product risks, and quality goals. Applying every framework to every review would create noise, while a hidden auto-selection process would reduce trust.

## Decision

CoArchitect AI will support manual framework selection and explainable auto-detection across Azure Well-Architected, AWS Well-Architected, ISO/IEC 25010, and OWASP ASVS. Framework selection rationale and confidence will be visible to the user.

## Consequences

- reviews become more relevant and easier to justify
- the platform needs a dedicated framework selection agent and UX
- the product must maintain concise grounded summaries for each framework
- users can override the system when they want a narrower or broader review

