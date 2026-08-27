# Fleet Overview Merge — Design

**Date:** 2026-08-24
**Branch:** multi-cluster
**Status:** Approved design → implementation plan pending

## Summary

Replace the content of the Pipelines **Overview** page with the mocked
**Fleet Dashboard** (five tabs: Overview, Build Times, Resource Utilization,
Spoke Comparison, Alerts), and remove the standalone **Fleet Management**
perspective. The left-nav under Core platform → Pipelines stays exactly as it
is today: **Overview, Pipelines, Tasks, Triggers**. There is no separate
"Fleet Dashboard" nav item and no fleet perspective — everything lives inside
the existing **Overview** page.

## Goals

- Clicking **Overview** (Core platform → Pipelines) opens a tabbed Fleet
  Dashboard matching the mockups (`Overview-1.png`…`Overview-6.png`).
- All five mockup tabs are implemented with a shared filter toolbar.
- The Fleet Management perspective is fully removed.
- Nav labels are unchanged (Overview / Pipelines / Tasks / Triggers).

## Non-Goals

- No live backend wiring for fleet aggregates — all fleet data is **mock**,
  consistent with the rest of the multi-cluster branch. (No fleet metric has a
  real source on this cluster.)
- The Virtualization perspective is untouched.
- The `dev` perspective Pipelines entry is untouched.
- No changes to the PipelineRun list/detail multi-cluster views already on the
  branch.

## Key Decisions

1. **Nav unchanged, content replaced.** The `/pipelines-overview` route and the
   "Overview" `console.navigation/href` stay as-is. The exposed
   `pipelinesComponent.PipelinesOverviewPage` is repurposed to render the new
   tabbed dashboard, so `console-extensions.json` route/nav need no edits.
2. **Internal PatternFly `Tabs`, not `console.tab/horizontalNav`.** The tabs
   belong to our own page, so an in-component `Tabs` is the correct,
   self-contained mechanism (the console tab extension is for extending other
   plugins' pages).
3. **Shared filter toolbar** above the tab content — spoke selection, time
   range, search, and refresh flow into every tab.
4. **Mock data** in a new `__demo__/mock-fleet-data.ts`, keyed to the five
   spokes and reusing spoke identities from `mock-cluster-data.ts`.
5. **Page H1 reads "Fleet Dashboard"** (per mockups); nav label stays
   "Overview".

## Architecture

### Routing / exposure (no console-extensions changes for the page)

- Route: `console.page/route`, paths `/pipelines-overview/ns/:ns` and
  `/pipelines-overview/all-namespaces`, component
  `pipelinesComponent.PipelinesOverviewPage` — **unchanged**.
- Nav: `console.navigation/href` id `pipelines-overview`, perspective `admin`,
  section `pipelines`, name "Overview" — **unchanged**.
- `PipelinesOverviewPage` (in `src/components/pipelines-overview/index.ts`) is
  rewritten to render `FleetDashboard`. The existing single-project cards
  (`PipelineRunsStatusCard`, duration/total/numbers, `PipelineRunsListPage`)
  and the K8s variant are **removed from the overview page** per the approved
  "replace" decision. (They remain reachable through the Pipelines/PipelineRuns
  nav items and their own routes.)

### Page layout

```
Fleet Dashboard  ☆
[ Overview | Build Times | Resource Utilization | Spoke Comparison | Alerts ]
FleetToolbar: Filter ▾ · All Spoke Clusters (5) ▾ · Last 30 days ▾ · [search] · <spoke chips ×> · Updated Nm ago · ⟳ ⬇
<active tab content>
```

### New component tree — `src/components/pipelines-overview/fleet/`

- `FleetDashboard.tsx` — tab container (PF `Tabs`), owns shared filter state
  (selected spokes, time range, search) and passes it to each tab.
- `FleetToolbar.tsx` — shared filter row (spoke multiselect + removable chips,
  time-range dropdown, search input, refresh + download actions,
  "Updated N ago" label from mock).
- Tabs:
  - `FleetOverviewTab.tsx`
  - `BuildTimesTab.tsx`
  - `ResourceUtilizationTab.tsx`
  - `SpokeComparisonTab.tsx`
  - `AlertsTab.tsx`
- Shared building blocks:
  - `FleetStatCard.tsx` — labelled stat with sparkline + delta.
  - `SpokeHealthTable.tsx` — the 10-column health table.
  - `FailureHeatmap.tsx` — custom CSS-grid heatmap (no PF chart primitive).
  - `AlertRow.tsx` — severity-bordered alert row with Acknowledge/Silence.
  - Thin chart wrappers over `@patternfly/react-charts/victory`.
- `fleet.scss` — styles (borders, heatmap grid, spoke-card health colors).

### Reuse

- `src/components/cluster/`: `ClusterBadge`, `RoutingPill`, `ResourceMeter` for
  spoke identity and CPU/Memory meters.
- Charts via `@patternfly/react-charts/victory` (already used by the current
  overview cards): `ChartLine` (trends), `ChartBar` grouped (build time P50/P95)
  and stacked (dispatch throughput), `ChartArea` sparklines.

## Tab content (from mockups)

### Overview (`Overview-1*.png`)
- Warning alert banner: MultiKueue bottleneck on spoke-edge.
- 4 stat cards: Fleet Success Rate 94.2%, Avg Build P50 4m32s, Dispatched
  PipelineRuns 12,847, Active Spoke Clusters 5 (each with sparkline + delta).
- Success rate trend by spoke (multi-line).
- Build time by spoke cluster (grouped P50/P95 bars).
- Spoke resource utilization (CPU + Memory bars per spoke).
- Failure density by spoke (heatmap, days of week).
- Spoke fleet health table: Spoke Cluster, Status, Dispatched, Success Rate,
  Avg Build, P95 Build, CPU Util, Memory Util, Kueue Queue, Region.
- Top failure reasons fleet-wide (horizontal bars).
- Hub dispatch throughput (stacked Succeeded/Failed bars).
- MultiKueue queue depth by spoke (multi-line).

### Build Times (`Overview-3.png`)
- 4 stats: Fleet P50 4m32s, Fleet P95 11m08s, Fleet P99 16m24s, Timed-out
  runs 134.
- P50 build time trend (line).
- Slowest pipelines fleet-wide table: Pipeline, Spoke, P50, P95, Runs.

### Resource Utilization (`Overview-4.png`)
- 4 stats: Fleet Avg CPU 71.8%, Fleet Avg Memory 65.6%, Total vCPUs 384, Total
  Memory 768 Gi.
- CPU utilization trend (line).
- Node pool capacity table: Spoke, Worker Nodes, vCPUs, Memory, CPU Util, Mem
  Util, Headroom (Comfortable / Underutilized / Tight / Critical badges).

### Spoke Comparison (`Overview-5.png`)
- Grid of 5 spoke cards (spoke-prod-east, spoke-prod-west, spoke-staging,
  spoke-dev, spoke-edge), each: name + region, Success Rate, Avg Build, CPU,
  Queue Depth, Dispatched, Memory. Health-colored border (green / yellow for
  spoke-dev / red for spoke-edge).

### Alerts (`Overview-6.png`)
- 3 stat cards: Active Alerts 3, Acknowledged 2, Resolved (last 7d) 14.
- Alert rows: severity icon, title, description, Fired timestamp, Duration,
  Source, Acknowledge + Silence buttons. Critical = red left border, Warning =
  yellow left border. Acknowledge/Silence update local (mock) state only.

## Data — `src/components/__demo__/mock-fleet-data.ts`

Deterministic mock module (no `Date.now()` / `Math.random()` — fixed
timestamps and series). Exports typed fleet aggregates keyed to the five
spokes, reusing spoke identity/region from `mock-cluster-data.ts`:

- Fleet summary KPIs + deltas + sparkline series (Overview + Build Times +
  Resource Utilization stat cards).
- Per-spoke success-rate and queue-depth time series.
- Per-spoke build-time P50/P95, avg build, P95 build.
- Failure density matrix (spoke × weekday).
- Spoke fleet health rows (10 columns).
- Top failure reasons (fleet-wide) with counts.
- Hub dispatch throughput series (succeeded/failed).
- Slowest pipelines rows.
- Node pool capacity rows with headroom classification.
- Alerts list (severity, title, description, firedAt, duration, source, state).

Selecting/deselecting spokes and changing the time range filter these
in-memory structures; no network calls.

## Removing the Fleet Management perspective

- `console-extensions.json`: delete the `console.perspective` entry id
  `fleet-management`.
- `package.json`: remove `fleetManagementPerspective` from `exposedModules`.
- Delete `src/components/perspective/fleet-management.ts`.
- Keep `src/components/perspective/virtualization.ts` and its extension.

## Error handling

- Mock-only, so no fetch failures. Empty-state handling: if all spokes are
  deselected, tabs render a PF `EmptyState` prompting the user to select a
  spoke rather than blank charts.
- Charts guard against empty series (render empty-state card body).

## Testing

- `__demo__/__tests__/mock-fleet-data.spec.ts` — validates shape, spoke keys,
  and that filtering by spoke/time range returns consistent subsets.
- Smoke-render test per tab (mirrors `pipelines-overview/__tests__` and
  `__demo__/__tests__` patterns): each tab renders its cards/tables without
  throwing given the mock data.
- Toolbar test: deselecting a spoke removes it from a tab's data.

## Internationalization

- New user-facing strings use the existing `useTranslation` /
  `%plugin__pipelines-console-plugin~...%` pattern already used across the
  plugin. Titles, tab labels, table headers, and alert actions are wrapped for
  i18n.

## Files touched (summary)

**New**
- `src/components/pipelines-overview/fleet/FleetDashboard.tsx`
- `src/components/pipelines-overview/fleet/FleetToolbar.tsx`
- `src/components/pipelines-overview/fleet/FleetOverviewTab.tsx`
- `src/components/pipelines-overview/fleet/BuildTimesTab.tsx`
- `src/components/pipelines-overview/fleet/ResourceUtilizationTab.tsx`
- `src/components/pipelines-overview/fleet/SpokeComparisonTab.tsx`
- `src/components/pipelines-overview/fleet/AlertsTab.tsx`
- `src/components/pipelines-overview/fleet/FleetStatCard.tsx`
- `src/components/pipelines-overview/fleet/SpokeHealthTable.tsx`
- `src/components/pipelines-overview/fleet/FailureHeatmap.tsx`
- `src/components/pipelines-overview/fleet/AlertRow.tsx`
- `src/components/pipelines-overview/fleet/fleet.scss`
- `src/components/__demo__/mock-fleet-data.ts`
- `src/components/__demo__/__tests__/mock-fleet-data.spec.ts`

**Modified**
- `src/components/pipelines-overview/index.ts` (export repurposed page)
- `src/components/pipelines-overview/PipelinesOverviewPage.tsx` (render
  `FleetDashboard`)
- `console-extensions.json` (remove fleet-management perspective)
- `package.json` (remove `fleetManagementPerspective` exposed module)

**Deleted**
- `src/components/perspective/fleet-management.ts`
