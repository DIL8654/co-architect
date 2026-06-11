# Navigation Model

## Purpose

Describe the current workspace-centric navigation model.

## Current Scope

The application uses a left navigation shell and treats navigation as a product-level concern, not a content-page concern.

## Model

```text
Dashboard
Workspaces
  Workspace
    Diagram
Knowledge Base
Settings
```

## Design Decisions

- no organization switcher
- no organization route hierarchy in the active UX
- navigation belongs in the shell
- working surfaces belong in the content panel

## Future Enhancements

- richer tree nodes for reviews and ADR versions
- stronger keyboard navigation
