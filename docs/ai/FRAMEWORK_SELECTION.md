# Framework Selection

## Purpose

Explain how review frameworks are chosen.

## Current Scope

The MVP supports manual selection and explainable auto-detect.

## Supported Frameworks

- Azure Well-Architected Framework
- AWS Well-Architected Framework
- ISO/IEC 25010
- OWASP ASVS

## Design Decisions

- framework choice must be visible to the user
- auto-detect may use architecture cues and retrieved framework knowledge
- the UI should explain why a framework was selected

## Implementation Notes

Framework selection consumes architecture cues, stored review context, and Foundry IQ-style framework knowledge. It is not limited to simple keywords.

## Future Enhancements

- richer confidence signals
- explicit framework override comparisons
