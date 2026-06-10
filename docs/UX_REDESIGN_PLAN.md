# UX Redesign Plan

## Purpose

This document defines the next UX and information architecture redesign for CoArchitect AI. The goal is to turn the current MVP interface into a clean, minimal, enterprise-grade architecture workbench with clear navigation, higher information density, and stronger support for architecture review workflows.

This is a planning document only. It does not change runtime behavior by itself.

## Product UX Direction

CoArchitect AI should feel closer to GitHub, Azure Portal, GitLab, Datadog, Grafana, and Linear than a startup dashboard template. The product should behave like an engineering platform where navigation happens in a persistent left sidebar and the main content area is reserved for work: diagrams, analysis, findings, ADRs, and grounded architecture knowledge.

## Current UX Audit

### 1. Navigation is split across too many surfaces

The current application uses a top-level sidebar, page-level breadcrumbs, and many content-area buttons such as:

- `Open workspaces`
- `Open Diagrams`
- `Open Board`
- `Open Analysis`
- `Open detailed result`
- `Start review`

This creates duplicate navigation models. Users have to decide whether to move through the product using sidebar links or in-page buttons. That slows orientation and makes the interface feel less intentional.

### 2. Content panels are doing navigation work

Organization, workspace, and diagram pages use the right-hand content area to show a selected entity plus a set of buttons that navigate to the next level. This makes the content pane feel like a launcher instead of a workspace.

### 3. Card usage is excessive

The current experience uses many bordered, rounded, elevated cards for:

- navigation
- summaries
- list items
- metrics
- empty states
- detail sections
- findings
- settings

The result is visual fragmentation. Instead of one product surface with clear sections, the app feels like many small widgets placed next to each other.

### 4. Screen real estate is underused

Key architecture workflows do not use horizontal space efficiently:

- detail pages still reserve room for large header blocks
- diagram work is visually boxed in
- dashboard sections consume height quickly
- some pages split the screen into multiple decorative panels instead of giving most space to architecture content

This is especially costly because the diagram and analysis experience should be the core of the product.

### 5. Visual language is too decorative for the domain

Current styles lean on:

- glow effects
- translucent panels
- gradient or patterned backgrounds
- repeated rounded containers
- hero-like sections

That creates polish, but not the right kind of polish for an engineering platform. The product should feel precise, restrained, and work-focused.

### 6. Information architecture is broad but not clearly grouped

Top-level navigation currently mixes product areas such as dashboard, organizations, health, docs, and settings without a domain-centered hierarchy. Workspaces, diagrams, reviews, ADRs, health, and knowledge surfaces are not organized under a stable conceptual model.

### 7. Dashboard is fragmented

The dashboard currently behaves more like a set of action cards than a compact operational overview. Too many sections compete for attention, and page actions are mixed into overview content.

### 8. Analysis presentation is card-heavy

Analysis detail views still rely on multiple stacked sections and agent trace cards. Findings, recommendations, and trade-offs are harder to scan than they need to be. A professional review workspace should be more table- and panel-driven.

### 9. Documentation and settings are surfaced too prominently in content

Docs and health are useful, but they should not compete with architecture work on primary pages. Documentation belongs in the header and knowledge surfaces; health belongs under settings/system status.

## Current Information Architecture Issues

### Current shape

The present application structure is functional but uneven:

- global shell with flat sidebar
- landing/dashboard views
- organizations
- workspaces
- diagrams
- diagram detail
- analysis result
- docs
- health
- settings

### Current IA problems

- top-level nav is too shallow to represent the real hierarchy
- organizations and workspaces are domain objects, but navigation does not consistently center them
- analysis, reviews, and ADR flows are spread across routes and buttons
- knowledge and configuration concerns are mixed with daily work concerns
- some pages expose both list navigation and “open” buttons for the same transition

## UX Redesign Principles

- Minimalistic
- Information-dense
- Enterprise-focused
- Fast to navigate
- Keyboard-friendly
- Consistent interaction patterns
- Low visual noise
- Architecture-first
- Table-first where possible
- Sidebar-driven navigation

## Target Application Shell

### Header

Use a compact persistent header.

Left:

- Product logo
- Product name

Center:

- current organization
- current workspace
- breadcrumb context when useful

Right:

- theme toggle
- documentation icon
- notifications placeholder
- user/profile placeholder

Notes:

- remove documentation buttons from content pages
- keep header height compact
- keep actions aligned to utility, not primary workflow navigation

### Sidebar

Use a persistent left sidebar with a width between `240px` and `280px`.

Behavior:

- collapsible
- keyboard navigable
- current-item highlighting
- search or filter support
- expandable tree sections
- lazy loading for large organizations or workspace trees

### Content Area

The content area should be broad, restrained, and work-focused.

- no decorative background patterns
- no navigation launchers
- fewer nested containers
- use full width where diagrams, findings, and ADR content benefit from it

## Proposed Information Architecture

### Primary Navigation Groups

#### Workspace

- Dashboard
- Reviews
- Analysis Runs
- ADRs

#### Architecture

- Diagrams
- Trade-offs
- Framework Reviews

#### Knowledge

- Knowledge Base
- Architecture Principles
- Scoring Model

#### Administration

- Organizations
- Workspaces

#### Settings

- Health
- System Status
- Configuration

Settings should remain visually separated and anchored low in the sidebar.

## Organization Tree Strategy

The left sidebar becomes the primary navigation model.

Example:

```text
Organization
├── Dashboard
├── Workspaces
│   ├── Platform
│   ├── Marketplace
│   └── Mobile
├── Diagrams
├── Reviews
├── ADRs
└── Settings
```

Rules:

- selecting an organization node updates the content area automatically
- selecting a workspace node loads that workspace without requiring `Open` buttons
- selecting a diagram node opens the diagram detail workspace
- selecting a review or ADR node opens the relevant working surface directly
- do not duplicate these transitions in content cards

## Route and Navigation Strategy

### Keep

- breadcrumbs for orientation
- direct routes for deep linking
- shareable URLs

### Change

- remove page-level navigation buttons that duplicate sidebar navigation
- reduce route duplication where multiple paths represent nearly the same surface
- make sidebar selection the normal way to move deeper into the hierarchy
- keep content actions focused on create, edit, run, export, and delete

### Action taxonomy

Content pages should contain only work actions such as:

- create
- edit
- delete
- upload
- run analysis
- regenerate ADR
- export PDF
- refresh

They should not contain actions that simply open a child page already represented in the navigation tree.

## Dashboard Redesign

Replace the current card-heavy dashboard with a compact operational overview.

### Overview row

Use small KPI tiles:

- Architecture Intelligence Score
- Open Risks
- Active Reviews
- ADR Count

These should be compact summary tiles, not large cards.

### Activity feed

Use a single table:

| Type | Item | Status | Updated |
| --- | --- | --- | --- |

### Recent Reviews

Use a compact table with:

- review name
- frameworks
- score
- status
- updated

### Recent ADRs

Use a compact table with:

- title
- status
- related diagram
- updated

### Dashboard constraints

- no large action cards
- no duplicated navigation CTAs
- one overview page, not a collection of widgets

## Diagram Detail Workspace Redesign

This should become the product’s primary working screen.

### Layout

Left `~70%`:

- diagram viewer or architecture description
- use maximum available vertical and horizontal space

Right `~30%`:

- docked or floating panel with tabs

Tabs:

- Summary
- Findings
- Comments
- ADR

Optional secondary tabs or subtabs inside Findings:

- Dimensions
- Missing Components
- Recommendations
- Trade-offs
- Agent Evidence
- History

### Interaction goals

- user should not need to jump between multiple pages for core review work
- analysis execution should be available in a compact toolbar or panel header
- architecture summary should appear directly under the title and be expandable if long
- document viewing should prioritize the uploaded artifact, not surrounding chrome

## Analysis Result Redesign

The analysis result view should move away from one-card-per-section.

### Main structure

- compact summary strip at top
- findings table as primary surface
- expandable detail rows

### Findings table

| Severity | Category | Finding | Recommendation |
| --- | --- | --- | --- |

Expandable detail areas:

- evidence
- trade-offs
- framework references
- owning specialist agent

### Side context

Use a narrow companion column or drawer for:

- final score
- selected frameworks
- rationale
- priority roadmap

## ADR Experience Redesign

ADR should feel like document work, not dashboard work.

### Primary tabs

- Preview
- Markdown
- HTML
- History

### Actions

Use toolbar actions:

- Generate ADR
- Regenerate ADR
- Export PDF

### UX goals

- keep reading and editing in one place
- show related architecture findings in a supporting panel
- avoid large call-to-action blocks

## Documentation and Knowledge UX

Documentation should move to:

- header utility icon
- knowledge surfaces in the sidebar

Documentation pages should render as clean HTML documentation with:

- left doc nav if needed
- readable content width
- table of contents for longer pages

Avoid presenting documentation as a grid of marketing-style feature cards.

## Icon Strategy

Use icons for frequent, obvious actions:

- create
- edit
- delete
- download
- refresh
- run analysis
- export

Rules:

- icon-only buttons only when meaning is obvious
- tooltip required
- accessible label required
- destructive actions must remain visually distinct
- primary workflow actions can use icon plus short label when needed

## Table-First Strategy

Prefer tables for:

- organizations
- workspaces
- diagrams
- reviews
- ADRs
- analysis runs
- findings

Use cards only for:

- KPI summaries
- key architecture score
- critical warnings
- highly compact contextual callouts

## Visual Design Strategy

### Backgrounds

Use simple neutral backgrounds:

- light: `#FAFAFA` or `#F8F9FB`
- dark: deep neutral, not overly saturated

### Surfaces

- primary surfaces: white or near-white in light mode
- dark surfaces: quiet neutral panels with strong text contrast

### Borders

Use subtle but visible borders:

- `#E5E7EB`
- `#DDE1E6`

Visual separation should come from:

- border
- spacing
- hierarchy
- typography

Not from heavy shadows or decorative containers.

### Remove or reduce

- glow-heavy treatments
- grid-pattern backgrounds
- decorative gradients
- oversized rounded cards
- repeated shadow layers

## Typography Strategy

Use a tighter hierarchy:

- Page Title
- Section Title
- Table Header
- Body Text
- Caption

Guidelines:

- reduce unnecessary font-size jumps
- keep headings strong but compact
- use page titles sparingly
- keep table labels and metadata readable at smaller sizes

## Spacing Strategy

Standardize spacing to:

- `4`
- `8`
- `12`
- `16`
- `24`
- `32`

Reduce:

- card padding
- vertical gaps between sections
- header block height
- oversized empty states

Increase density without making screens feel cramped.

## Form Strategy

Forms should be compact and operational.

Use:

- aligned labels
- consistent field widths
- grouped sections
- concise helper text

Avoid:

- giant hero forms
- large vertical gaps
- too many inline descriptive blocks

## Responsive Strategy

### Desktop

- persistent sidebar
- full workbench layout

### Tablet

- collapsible sidebar
- content-first layout

### Mobile

- drawer navigation
- simplified side panels
- stacked detail layouts

## UX Journeys

### 1. New architecture review journey

1. User enters the product.
2. Sidebar defaults to organizations or dashboard context.
3. User creates or selects an organization.
4. User creates or selects a workspace from the tree.
5. User uploads a diagram or enters architecture description.
6. Diagram detail workspace opens automatically.
7. User runs analysis from the working panel.
8. Findings, score, comments, and ADR workflow stay within the same workspace.

### 2. Existing diagram review journey

1. User selects organization from sidebar tree.
2. User selects workspace.
3. User selects diagram.
4. Diagram detail workspace opens.
5. User reviews freshness, findings, and framework rationale.
6. User reruns analysis or opens ADR tab.

### 3. Architecture governance journey

1. User opens Dashboard from the current organization context.
2. User scans KPI row, recent reviews, and ADR tables.
3. User selects a review or ADR directly from the table or sidebar tree.
4. User works inside the relevant detailed surface instead of navigating through launcher cards.

### 4. Knowledge and guidance journey

1. User opens docs from the header icon or knowledge area.
2. User reads framework, scoring, or principles guidance in HTML format.
3. User returns to the same workspace context without losing orientation.

## Component Audit and Consolidation Plan

### Components to simplify

- `Card`
- list-item cards used as navigation tiles
- dashboard summary cards
- diagram selection cards
- analysis section cards
- docs cards

### Components to strengthen

- sidebar tree
- data table
- compact toolbar
- breadcrumbs
- split-pane workspace layout
- drawer or inspector panel
- tab system
- status badge
- empty, loading, and error states

### Consolidation goals

- one shared shell pattern
- one shared table pattern
- one shared page-header pattern
- one shared toolbar pattern
- one shared split-pane workspace pattern

## Anti-Patterns to Remove

- page content acting as navigation launcher
- `Open ...` buttons for entities already represented in sidebar
- large dashboard action cards
- decorative backgrounds in work views
- repeated nested bordered containers
- one-card-per-finding or one-card-per-navigation-item layouts
- oversized empty-state sections where a compact inline state would do

## Proposed Implementation Order

1. New application shell
2. Sidebar tree navigation
3. Header redesign
4. Remove duplicate navigation buttons
5. Dashboard redesign
6. Diagram detail workspace redesign
7. Analysis result redesign
8. ADR workspace redesign
9. Icon-based action system
10. Color system refresh
11. Border system refresh
12. Card reduction
13. Spacing and density pass

## Success Criteria

The redesigned product should:

- feel like an engineering platform, not a dashboard template
- use the left sidebar as the primary navigation surface
- keep content areas focused on architecture work
- reduce visual noise
- increase information density
- support large organizations and many workspaces cleanly
- make diagrams, reviews, findings, and ADRs easy to reach
- remove duplicated navigation paths

The desired feel is:

- professional
- clean
- minimalistic
- enterprise-ready
- fast to use

## Notes for Implementation

- preserve current end-to-end flows while changing layout and interaction patterns
- do not reintroduce marketing-style hero sections
- do not replace navigation clarity with decorative visuals
- prefer directness and consistency over novelty
