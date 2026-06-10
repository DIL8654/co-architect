# UI Layout Audit

## Current Structure

### Entry Point

`web/src/main.tsx` bootstraps `RouterProvider` with the router defined in `web/src/routes/index.tsx`. There is no `App.tsx` — routing is the root.

### Layout Hierarchy

```
RouterProvider
└── AppLayout (web/src/layouts/AppLayout.tsx)
    ├── <header className="top-nav">
    ├── <aside className="side-nav">
    └── <main className="content-area">
            <Outlet />  ← all pages render here
```

All routes are children of `AppLayout` via React Router `<Outlet />`. There is no secondary layout, no nested layout wrapper, no bypass — every route uses `AppLayout`.

### Header Component

Implemented inline in `AppLayout.tsx`. Uses the `.top-nav` CSS class.

- Contains: sidebar toggle, logo/brand, context chips (org + workspace), theme switcher, docs link, notifications, profile button.
- Positioned using `grid-area: header`.
- `sticky top-0 z-40` applied via Tailwind.

### Sidebar Component

Implemented inline in `AppLayout.tsx`. Uses the `.side-nav` CSS class.

- Contains: workspace nav section (Dashboard, Workspaces, Diagrams), administration section (org tree with expandable workspaces and diagrams), settings section (Docs, Health, Settings).
- Positioned using `grid-area: sidebar`.
- Inner scroll wrapper `.side-nav-scroll` uses `h-[calc(100vh-64px)]` overflow-y-auto.

### Main Content Component

`<main className="content-area">` renders the page `<Outlet />`.

- Positioned using `grid-area: main`.
- All pages use `.page-shell` as their top-level wrapper.

### CSS Architecture

All layout styles are defined in `web/src/styles.css` using Tailwind's `@layer components`. No CSS Modules, no styled-components. Tailwind utilities used inline in component JSX.

---

## Issues Found

### ISSUE-1: `app-shell` uses `min-h-screen` instead of `h-screen overflow-hidden`

```css
.app-shell {
  @apply grid min-h-screen bg-[#f8f9fb] ...;
  grid-template-rows: 64px minmax(0, 1fr);
}
```

The `1fr` row requires a bounded parent height to distribute space to the sidebar and content. `min-height: 100vh` does not establish a bounded grid context — the container can grow beyond the viewport. As a result, the `1fr` row resolves to `auto` rather than filling the remaining viewport height. The sidebar and content area grow with their content rather than being constrained columns.

### ISSUE-2: `content-area` missing `overflow-y: auto`

```css
.content-area {
  @apply relative min-h-[calc(100vh-64px)] overflow-x-hidden border-l border-white ...;
}
```

For the app shell pattern (fixed header, independently scrolling sidebar and content), `content-area` needs `overflow-y: auto`. Without it, the content overflows out of the grid cell instead of scrolling within it. The `min-h-[calc(100vh-64px)]` rule fights against a bounded grid and causes the cell to expand beyond its allocation.

### ISSUE-3: `@layer` nested inside `@media` (CSS spec violation)

At the bottom of `styles.css`, the responsive overrides are wrapped in `@layer components` inside a `@media` block:

```css
@media (max-width: 900px) {
  @layer components {   ← invalid: @layer cannot be nested inside @media
    .app-shell { ... }
    .content-area { ... }
  }
}
```

The CSS Cascading and Layers specification explicitly prohibits `@layer` statements inside conditional at-rules (`@media`, `@supports`, etc.). Tailwind/PostCSS may silently discard or misprocess this block, meaning all responsive layout overrides are potentially non-functional.

### ISSUE-4: Responsive breakpoint too wide (900px)

The stacking layout (sidebar above content) triggers at `max-width: 900px`. At this breakpoint, the sidebar renders *above* the main content. This looks broken on small laptops with 1024–1280px displays at reduced zoom, and on 900px viewport widths which are common in responsive testing. The standard `md` breakpoint (`767px`) is the appropriate threshold.

### ISSUE-5: Invisible border on `content-area`

```css
.content-area {
  @apply ... border-l border-white ...;
}
```

`border-white` is invisible on a white or near-white background. The sidebar already provides the visual separation via `.side-nav`'s `border-r`. This redundant rule has no visible effect in light mode and adds no value.

### ISSUE-6: `DiagramDetailPage` negative-margin layout hack

In `web/src/pages/DiagramDetailPage.tsx`:

```tsx
<div className="page-shell -m-5 min-h-[calc(100vh-64px)] p-5">
```

Negative margin (`-m-5`) is used to undo the `content-area` padding (`p-6`), then re-applied at page level (`p-5`). This is a workaround for the inability to control padding from outside the component. It is brittle — any change to `content-area` padding breaks this page's layout.

### ISSUE-7: `LandingPage` uses a mismatched design language

`web/src/pages/LandingPage.tsx` contains:

- A `LandingShell` component with a two-column hero layout, a large logo, a "Enterprise architecture review" badge, a 5xl heading, large action buttons.
- Animated diagram cards with `rounded-2xl`, `hover:-translate-y-0.5`, `hover:shadow-sm` effects.
- Navigation buttons in the content area: "Open canvas", "Infra health".
- The loading state uses `LandingShell` (a full hero) rather than a standard `LoadingState`.

All other pages (`DashboardPage`, `OrganizationListPage`, `WorkspaceListPage`, `DiagramListPage`, `AnalysisResultPage`) use the consistent enterprise table-first shell pattern. `LandingPage` is a holdover from a marketing-page phase.

### ISSUE-8: KPI stat cards in `RecommendationsPage` and `TradeoffAnalysisPage` use `Card` with a header bar

These pages render 3 stat cards using `<Card header="...">` which produces a header bar above the number. The `DashboardPage` uses compact `kpi-tile` divs (label above, number below, no header bar separator). The visual inconsistency breaks the uniform KPI tile language used elsewhere.

---

## Root Causes

| Issue | Root Cause |
|-------|-----------|
| ISSUE-1 | `min-h-screen` does not bound a CSS grid row. `h-screen` is required. |
| ISSUE-2 | Scrolling column requires `overflow-y: auto` + bounded parent height (ISSUE-1 fix unblocks this). |
| ISSUE-3 | CSS spec violation: `@layer` cannot nest inside `@media`. Tailwind PostCSS may discard or misprocess the block entirely. |
| ISSUE-4 | 900px is too wide; stacks at a size that looks broken on common laptop resolutions. |
| ISSUE-5 | Dead CSS — border color matches background. |
| ISSUE-6 | Developer workaround for missing `overflow-y: auto` in `content-area`. Removed when ISSUE-2 is fixed. |
| ISSUE-7 | `LandingPage` was never updated when the rest of the app moved to the enterprise table-first design. |
| ISSUE-8 | Inconsistent component choice — `Card` (panel + header bar) used where `kpi-tile` (compact stat) is appropriate. |

---

## Recommended Fix

Fix the app shell with two CSS-only changes and rewrite the responsive block without the illegal `@layer` nesting:

1. `app-shell`: `min-h-screen` → `h-screen overflow-hidden`
2. `content-area`: add `overflow-y: auto`, remove `min-h-[calc(100vh-64px)]` and `border-l border-white`
3. Responsive block: remove `@layer components` wrapper, change breakpoint to `767px`, reset `app-shell` height to `auto` on mobile

These three changes to `styles.css` fix the scrolling shell, sidebar/content alignment, and responsive stacking — with no component changes required.
