# UI Implementation Plan

## Phase 1 — Layout Fix

**File:** `web/src/styles.css`

**Goal:** Fix the broken app shell so that the header is sticky, sidebar and content sit side by side, and each scrolls independently.

### Changes

#### 1.1 Fix `.app-shell` container

| Before | After |
|--------|-------|
| `@apply grid min-h-screen ...` | `@apply grid h-screen overflow-hidden ...` |

`min-h-screen` allows the grid container to grow unbounded. `h-screen overflow-hidden` creates a bounded viewport container so the CSS grid `1fr` row fills the remaining height correctly.

#### 1.2 Fix `.content-area`

| Before | After |
|--------|-------|
| `min-h-[calc(100vh-64px)] overflow-x-hidden border-l border-white ... dark:border-white/5` | `overflow-x-hidden overflow-y-auto ...` |

Remove: `min-h-[calc(100vh-64px)]` (fights bounded grid), `border-l border-white` (invisible, redundant), `dark:border-white/5` (also removed).
Add: `overflow-y: auto` (enables independent column scrolling).

#### 1.3 Fix responsive media query

Remove the illegal `@layer components` nesting inside `@media`. Change breakpoint from `900px` to `767px`. Override the app-shell height on mobile so the page can scroll as a document.

```css
/* Before */
@media (max-width: 900px) {
  @layer components {
    .app-shell { ... }
  }
}

/* After */
@media (max-width: 767px) {
  .app-shell {
    height: auto;
    min-height: 100dvh;
    overflow: visible;
    /* grid-template overrides */
  }
  .content-area {
    overflow-y: visible;
  }
  /* other class overrides without @layer */
}
```

---

## Phase 2 — DiagramDetailPage Layout Hack Removal

**File:** `web/src/pages/DiagramDetailPage.tsx`

**Goal:** Remove the negative-margin escape hack that works around the missing `overflow-y` on `content-area`.

### Change

| Before | After |
|--------|-------|
| `<div className="page-shell -m-5 min-h-[calc(100vh-64px)] p-5">` | `<div className="page-shell">` |

After Phase 1, `content-area` handles its own padding and scrolling. The `-m-5` hack is no longer needed.

---

## Phase 3 — LandingPage Redesign

**File:** `web/src/pages/LandingPage.tsx`

**Goal:** Replace the marketing-page hero design with the enterprise table-first layout used by all other pages.

### Removals

| Element | Reason |
|---------|--------|
| `LandingShell` component | Hero with large logo, two-column layout, and action buttons — marketing pattern |
| `MiniFeature` component | Used only in the removed empty state hero |
| `DashboardMetric` component | Replaced by `KpiTile` (inline, simpler, consistent with DashboardPage) |
| "Open canvas" button | Navigation handled by sidebar |
| "Infra health" button | Navigation handled by sidebar Settings section |
| `sampleDescription` const | Was used only inside `LandingShell` empty state |
| `hover:-translate-y-0.5` card animations | Not appropriate for enterprise workspace |
| `rounded-2xl` card buttons | Replaced by table rows |
| `Card header="Recent Diagrams"` cards | Replaced by tables |
| `Card header="Needs Attention"` | Replaced by table |
| `Card header="Top Findings"` | Merged into the Needs Attention table |
| Gradient in `MaturityBar` | Replaced with solid color |
| `ReactNode`, `Button`, `Card`, `HealthIcon`, `LogoMark`, `SettingsIcon`, `SparkIcon` imports | No longer used |

### Additions

| Element | Reason |
|---------|--------|
| `page-header` section | Consistent with all other pages |
| `KpiTile` function | Compact stat tile using `.kpi-tile` CSS class |
| Recent Diagrams table | Score, workspace, status (freshness badge), upload date |
| Needs Attention table | Score, score band, top gap, score trend — replaces two cards |
| `EmptyState`, `LoadingState` components | Standard error/loading patterns instead of `LandingShell` variants |

---

## Phase 4 — Navigation Cleanup

**Files:** `web/src/pages/RecommendationsPage.tsx`, `web/src/pages/TradeoffAnalysisPage.tsx`

**Goal:** Replace the `Card`-with-header KPI stat blocks with compact `kpi-tile` divs, matching the DashboardPage pattern.

### Changes

Both pages have a `<div className="grid gap-4 md:grid-cols-3">` section at the top containing 3 `<Card>` stat blocks (a large number + description). These are replaced with:

```tsx
<div className="grid gap-4 md:grid-cols-3">
  <div className="kpi-tile">
    <p className="text-xs font-semibold uppercase tracking-wide text-secondary-500 dark:text-secondary-400">Label</p>
    <p className="mt-2 text-2xl font-semibold text-secondary-950 dark:text-white">{value}</p>
    <p className="mt-1 text-xs text-secondary-500 dark:text-secondary-400">Description</p>
  </div>
  ...
</div>
```

The `Card` import is retained in both files since it is still used for the filter panel and content panels below the stats.

---

## Phase 5 — Visual Polish (Future)

These are lower-priority refinements to do after Phases 1–4 are verified:

- Audit all page-level spacing — eliminate any non-standard values (ensure `4/8/12/16/24/32`)
- Standardize table row hover to `hover:bg-[#f8f9fb] dark:hover:bg-white/[0.03]` across all pages
- Standardize table header background to `bg-[#f8f9fb] dark:bg-white/[0.03]` across all pages
- Standardize inner table row separators to `border-b border-[#eef1f4] dark:border-white/10`

---

## Verification Checklist

After Phase 1:
- [ ] At 1280px: header is fixed, sidebar left column, content right column
- [ ] Content area scrolls independently without scrolling the header or sidebar
- [ ] Sidebar scrolls independently within its column
- [ ] At 767px: layout stacks (header → sidebar → content, full-width columns)
- [ ] At 1023px (between mobile and xl): two-column layout still intact

After Phase 2:
- [ ] DiagramDetailPage loads without visual bleed or padding inconsistency
- [ ] Removing `-m-5` has no negative visual effect after Phase 1 fixes

After Phase 3:
- [ ] LandingPage with no diagrams shows `EmptyState` component
- [ ] LandingPage loading shows `LoadingState` component
- [ ] LandingPage with data shows: page-header + 4 KPI tiles + recent diagrams table + maturity panel + needs-attention table
- [ ] No "Open canvas" or "Infra health" navigation buttons visible
- [ ] No animated card hover effects on diagram rows

After Phase 4:
- [ ] KPI stat blocks in RecommendationsPage and TradeoffAnalysisPage match DashboardPage style (compact label + number, no header bar)

---

## File Modification Summary

| File | Phase | Change Type |
|------|-------|-------------|
| `web/src/styles.css` | 1 | CSS fix — 3 targeted changes |
| `web/src/pages/DiagramDetailPage.tsx` | 2 | Single className attribute change |
| `web/src/pages/LandingPage.tsx` | 3 | Full functional rewrite |
| `web/src/pages/RecommendationsPage.tsx` | 4 | Replace 3 Card stat blocks with kpi-tile |
| `web/src/pages/TradeoffAnalysisPage.tsx` | 4 | Replace 3 Card stat blocks with kpi-tile |
