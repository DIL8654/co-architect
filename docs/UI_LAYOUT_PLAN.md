# UI Layout Plan

## Application Shell

### Structure

```
AppShell (app-shell)
├── Header (top-nav)          [grid-area: header]
└── Body row
    ├── Sidebar (side-nav)    [grid-area: sidebar]
    └── Main Content          [grid-area: main]
```

### Visual Layout

```
+------------------------------------------------------+
| Header                                               |  ← 64px, sticky, full width
+----------------------+-------------------------------+
| Sidebar (272px)      | Main Content                  |
|                      |                               |
| • Tree navigation    | • page-shell                  |
| • Scrolls own column | • Scrolls own column          |
|                      | • p-6 padding                 |
|                      |                               |
+----------------------+-------------------------------+
```

### CSS Grid Definition

```css
.app-shell {
  display: grid;
  height: 100vh;
  overflow: hidden;
  grid-template-columns: 272px minmax(0, 1fr);
  grid-template-rows: 64px minmax(0, 1fr);
  grid-template-areas:
    "header header"
    "sidebar main";
}

.app-shell.sidebar-collapsed {
  grid-template-columns: 88px minmax(0, 1fr);
}
```

### Scrolling Behaviour

- `top-nav`: does not scroll; `sticky top-0 z-40`
- `side-nav`: scrolls its own content via `overflow-y: auto` on `.side-nav-scroll` (`h-[calc(100vh-64px)]` already correct)
- `content-area`: scrolls page content via `overflow-y: auto` on the grid cell itself

---

## Header Requirements

| Property | Value |
|----------|-------|
| Height | 64px (fixed) |
| Width | 100% (spans both columns via `grid-area: header`) |
| Position | Sticky top-0, z-index 40 |
| Background | White / dark: `#08101d` |
| Border | Bottom `#dde1e6` / dark: `white/10` |

### Layout Zones

```
[Toggle] [Logo + Name]        [Org chip] [Workspace chip]       [Theme] [Docs] [Bell] [Profile]
  left                              center                                right
```

| Zone | Contents |
|------|----------|
| Left | Sidebar collapse toggle, product logo + name |
| Center | Current organization chip, current workspace chip |
| Right | Theme mode switcher, docs icon, notifications icon, profile button |

---

## Sidebar Requirements

| Property | Value |
|----------|-------|
| Width (expanded) | 272px |
| Width (collapsed) | 88px (icon-only) |
| Position | Fixed left column, scrolls independently |
| Background | `#fdfdfd` / dark: `#08101d` |
| Border | Right `#cfd6de` / dark: `white/10` |
| Collapsible | Yes — toggle in header |

### Navigation Sections

```
side-nav
├── Workspace section
│   ├── Dashboard
│   ├── Workspaces (if org selected)
│   └── Diagrams (if workspace selected)
├── Administration section
│   ├── New org button
│   ├── Organizations link
│   └── Org tree
│       └── [Org Name]
│           └── [Workspace Name]
│               └── [Diagram Name]
└── Settings section
    ├── Documentation
    ├── Health
    └── Settings
```

---

## Main Content Requirements

| Property | Value |
|----------|-------|
| Width | Fills remaining width (`minmax(0, 1fr)`) |
| Overflow | `overflow-y: auto` — scrolls independently |
| Padding | `p-6` (`24px`) |
| Background | `#f4f6f8` / dark: `#060B16` |
| Margin from header | 0 — header is in a separate grid row |

### Page Shell Pattern

Every page should use `.page-shell` as its root element:

```tsx
<div className="page-shell">
  <section className="page-header">
    <Breadcrumbs ... />
    <h1 className="page-title">Page Name</h1>
    <p className="page-description">...</p>
  </section>
  {/* page content */}
</div>
```

---

## Responsive Behaviour

### Desktop (≥ 768px)

Sidebar + content side by side. Sidebar is fixed-width column. Content fills rest.

### Mobile (< 768px)

Layout stacks vertically:

```
+------------------------------------------------------+
| Header                                               |
+------------------------------------------------------+
| Sidebar (horizontal, collapses height)               |
+------------------------------------------------------+
| Main Content                                         |
+------------------------------------------------------+
```

The `app-shell` height constraint is released on mobile — the page scrolls as a document.

```css
@media (max-width: 767px) {
  .app-shell {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: auto auto minmax(0, 1fr);
    grid-template-areas:
      "header"
      "sidebar"
      "main";
  }
  .content-area {
    overflow-y: visible;
  }
}
```

---

## Page Layout Patterns

### Standard Content Page

Header + breadcrumbs + title + description + content table or grid.

```
page-shell
├── page-header (breadcrumbs + title + action button)
├── KPI tiles (optional, 2–4 columns)
└── Main table or panel + optional sidebar panel
```

### Detail / Workbench Page

Wide content with tabbed sections (DiagramDetailPage).

```
page-shell
├── page-header (breadcrumbs + title + run button)
├── Tabbed panel
│   └── Tab content (summary / findings / comments / ADR)
└── (no negative margin overrides)
```

---

## Design Tokens

### Spacing

Use multiples of 4px only: `4, 8, 12, 16, 24, 32`. No arbitrary values.

### Border Colors

| Usage | Light | Dark |
|-------|-------|------|
| Primary separators | `#dde1e6` | `white/10` |
| Secondary (inner rows) | `#eef1f4` | `white/10` |
| Inputs | `#d7dce2` | `white/10` |

### Backgrounds

| Usage | Light | Dark |
|-------|-------|------|
| App shell | `#f8f9fb` | `#060B16` |
| Header / sidebar | `#ffffff` / `#fdfdfd` | `#08101d` |
| Content area | `#f4f6f8` | `#060B16` |
| Panel / card | `#ffffff` | `#08101d` |
| Muted panel | `#fafafa` | `white/3%` |
| Table head | `#f8f9fb` | `white/3%` |

### Typography

| Usage | Class |
|-------|-------|
| Page title | `text-3xl font-bold tracking-normal` |
| Section heading | `text-lg font-semibold` |
| Table header | `text-xs font-semibold uppercase tracking-wide text-secondary-500` |
| Body copy | `text-sm text-secondary-600` |
| Micro label | `text-xs font-semibold uppercase tracking-wide text-secondary-500` |
