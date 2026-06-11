# Demo Assets

## Purpose

Document the official synthetic demo assets used by CoArchitect AI.

## Current Scope

The hackathon demo uses real architecture diagram images stored in this repository:

- `docs/demo/automate-video-analysis-architecture.png`
- `docs/demo/custom-document-processing-architecture.png`

The frontend serves copies from `web/public/` so seeded demo diagrams render without Azure Blob Storage.

## Design Decisions

- Demo assets are synthetic and safe for public evaluation.
- The images are not placeholders; they are the official diagrams for the seeded demo journeys.
- Seeded analysis snapshots use mock-compatible synthetic findings and do not require an Azure Foundry call.

## Implementation Notes

The backend demo seeder references the public asset paths:

- `/automate-video-analysis-architecture.png`
- `/custom-document-processing-architecture.png`

## Future Enhancements

Future production demos can store diagrams in Azure Blob Storage, but the hackathon quick-start path intentionally works without cloud credentials.
