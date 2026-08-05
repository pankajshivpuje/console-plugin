# Multi-Cluster PipelineRun Views Design

**Date:** 2026-08-05
**Approach:** Incremental enhancement of existing components (Approach A)
**Data source:** Mock data only (design demo)
**Styling:** PatternFly 6 components first, minimal custom CSS

## Overview

Enhance the existing PipelineRuns list and PipelineRun details views to display multi-cluster execution context — cluster badges, routing decisions, resource utilization, dispatch timelines, and aggregated log previews. All multi-cluster data is mock/demo data; no real API integration.

## Mock Data Layer

### Extended annotations on `MOCK_PIPELINE_RUNS`

Add annotations to each mock PipelineRun in `src/components/__demo__/mock-data.ts`:

- `tekton.dev/cluster` — cluster name where the run executed
- `multikueue.x-k8s.io/dispatch-reason` — why this cluster was chosen
- `multikueue.x-k8s.io/queue-wait` — queue wait time

### New file: `src/components/__demo__/mock-cluster-data.ts`

Contains:

- `MOCK_CLUSTER_INFO` — Map of cluster name to `{ type: 'hub'|'spoke', region, provider, ocpVersion, pipelinesVersion, status }`
- `MOCK_ROUTING_DECISIONS` — Map of PipelineRun name to `{ dispatchedBy, targetCluster, reason, queueWait, alternatives, cpuAtDispatch, routeQuality }`
- `MOCK_CLUSTER_RESOURCES` — Map of cluster name to `{ cpuPercent, memoryPercent, queueUsed, queueCapacity, node, specs }`
- `MOCK_LOG_PREVIEWS` — Map of PipelineRun name to array of `{ timestamp, step, level: 'info'|'warn'|'error'|'step', message }`
- `MOCK_DISPATCH_TIMELINE` — Map of PipelineRun name to `{ submitted, queued, dispatched, completed }` timestamps

Helper function:

- `getClusterDataForPipelineRun(plrName: string)` — Returns combined cluster/routing/resource/log/timeline data for a given run, or `undefined` if no cluster data exists.

## Shared Components

### New directory: `src/components/cluster/`

#### `ClusterBadge`

- PF6 `Label` with `variant="outline"`
- Props: `clusterName: string`, `clusterType: 'hub' | 'spoke'`, `region?: string`
- Hub variant: purple tint, concentric circle icon
- Spoke variant: blue tint, single circle icon
- Region renders as muted text after the cluster name

#### `RoutingPill`

- PF6 `Label` with `isCompact`
- Props: `quality: 'optimal' | 'constrained'`, `text: string`
- Optimal: green; Constrained: warning/yellow

#### `ResourceMeter`

- Wrapper around PF6 `Progress`
- Props: `label: string`, `value: number` (percentage), `displayValue?: string`, `thresholds?: { warning: number, danger: number }`
- Color shifts from default → warning → danger based on value vs thresholds

#### `DispatchTimeline`

- PF6 `ProgressStepper` with 4 steps: Submitted, Queued, Dispatched, Completed
- Props: `timeline: { submitted: string, queued: string, dispatched: string, completed?: string }`
- Each step shows timestamp below
- For running PipelineRuns, current step shows as `isCurrent`, remaining steps pending

All components are pure presentational — no data fetching.

## PipelineRuns List Page Changes

### Files modified

- `src/components/pipelineRuns-list/usePipelineRunsColumns.ts`
- `src/components/pipelineRuns-list/PipelineRunsRow.tsx`
- `src/components/pipelineRuns-list/PipelineRunsList.tsx`
- `src/components/pipelineRuns-list/PipelineRunsList.scss` (or new file for expandable row styles)

### Column addition

Add `cluster` column to `usePipelineRunsColumns.ts` between `name` and `vulnerabilities`. Title: "Cluster", sortable.

### Expandable rows

- Add PF6 expand toggle in the first column of each row
- When expanded, render `ExpandableRowContent` with a PF6 `Grid` (3 columns):
  1. **Routing Decision** — PF6 `DescriptionList`: dispatched by, target cluster, reason, queue wait, alternatives. `RoutingPill` at bottom.
  2. **Aggregated Logs** — PF6 `CodeBlock` with colored log lines from mock data. "View full logs" link.
  3. **Cluster Resources** — Three `ResourceMeter` components (CPU, Memory, Queue). Node info text below.
- Expand toggle hidden when no cluster data exists for a row (via `getClusterDataForPipelineRun()`).

### Cluster filter

New filter dropdown in `PipelineRunsList.tsx` alongside existing Status/Name filters. PF6 `Select` populated with cluster names from mock data. Filters rows by `tekton.dev/cluster` annotation.

### Info banner

PF6 `Alert` with `variant="info"`, `isInline`, dismissable via `actionClose`. Placed between tabs and filter toolbar. Text: "Multi-cluster routing active. PipelineRuns are dynamically dispatched via MultiKueue to the optimal spoke cluster based on current fleet capacity." Dismissal persisted via `localStorage`.

## PipelineRun Details Page Changes

### Files modified

- `src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx`
- `src/components/pipelineRuns-details/PipelineRunDetails.tsx`

### New file

- `src/components/pipelineRuns-details/ClusterExecutionCard.tsx`

### Title row

Add `ClusterBadge` to `PipelineRunDetailsPage.tsx` next to the existing status badge, after signed/archived/multicluster indicators. Reads cluster info from `tekton.dev/cluster` annotation. Only renders if annotation exists.

### Cluster Execution section

New `ClusterExecutionCard` component rendered in `PipelineRunDetails.tsx` between `PipelineRunVisualization` and the existing detail fields grid. Only renders when `getClusterDataForPipelineRun()` returns data.

Section header: cluster icon + "Cluster Execution" title + `ClusterBadge`.

PF6 `Card` containing `Grid` with 3 equal columns:

1. **Dispatch & Routing** — PF6 `DescriptionList` with: Dispatched by, Target cluster, Routing reason, Queue wait, Alternatives. `RoutingPill`. Divider, then `DispatchTimeline`.
2. **Cluster Resources** — Three `ResourceMeter` components. Node detail text. Divider, then ClusterQueue `DescriptionList` (Name, Flavor, Pending, Active).
3. **Cluster Info** — `DescriptionList` with: Cluster (with badge), Region, Provider, OCP version, Pipelines version, Status. Divider, then Secret sync info. "Open spoke console" external link.

### Existing detail fields

No changes to `ResourceSummary` + `PipelineRunCustomDetails` grid.

## Out of Scope

- Real API integration for multi-cluster data
- Multi-cluster log streaming
- Cluster health monitoring
- Any changes to YAML, Parameters, Logs, Events, Output, or TaskRuns tabs
