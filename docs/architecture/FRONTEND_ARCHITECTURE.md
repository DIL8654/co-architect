# Frontend Architecture

## Purpose

Explain the structure of the React frontend.

## Current Scope

The frontend lives under `web/src` and uses React, TypeScript, Vite, React Query, and a workspace-centric application shell.

## Structure

- `api/` for HTTP clients and DTO typings
- `components/` for shared UI building blocks
- `hooks/` for data and mutations
- `layouts/` for the shell
- `pages/` for top-level screens
- `stores/` and `context/` for local UI state seams
- `lib/` for display and comparison helpers

## Design Decisions

- workspace is the primary navigation context
- the left navigation shell is persistent
- analysis and diagram views are working surfaces, not launcher pages
- the frontend does not send auth headers in the current MVP

## Implementation Notes

The frontend consumes workspace-first routes and renders:

- dashboard and landing flow
- workspace and diagram navigation
- analysis results
- agent trace visibility
- Foundry IQ context visibility
- ADR previews and history

## Future Enhancements

- richer comparison surfaces
- collaboration indicators
- role-aware UI once real identity returns
