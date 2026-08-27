# Design Spec — PipelineRuns wireframe gaps: LocalQueues tab, Output/TaskRuns detail tabs, list-view polish

- **Date:** 2026-08-25
- **Branch:** `multi-cluster`
- **Status:** Approved design, ready for implementation planning
- **i18n namespace:** `plugin__pipelines-console-plugin`

## 1. Background

Three wireframes describe changes to the multi-cluster (MultiKueue) Pipelines
console experience:

1. **PipelineRuns (Multi-Cluster) list view** — routing/cluster awareness.
2. **PipelineRun Details view** — cluster execution + additional tabs.
3. **PipelineRuns & LocalQueues** — a new LocalQueues management tab.

The multi-cluster feature set is **mock-data driven** today (`MOCK_PIPELINE_RUNS`
in `src/components/__demo__/mock-data.ts`, cluster metadata in
`src/components/__demo__/mock-cluster-data.ts`). This design stays consistent
with that pattern — no real Kueue CRD wiring in this pass.

## 2. Gap analysis (wireframe vs. current code)

### 2.1 PipelineRuns list view — ~95% built

Already implemented in `src/components/pipelineRuns-list/`:

- "Multi-cluster routing active" info banner (dismissible, `localStorage`-backed)
  — `PipelineRunsList.tsx`.
- Cluster filter (`All Clusters` + spoke names) — `PipelineRunsList.tsx`.
- Cluster column (`ClusterBadge`) — `MultiClusterPipelineRunsTable.tsx`.
- Expandable rows with the 3-column detail (Routing Decision / Aggregated Logs /
  Cluster Resources at execution) — `PipelineRunExpandedContent.tsx`.

**Remaining gaps (low value):**

- G-L1: "LocalQueue" entry in the shared **Create** dropdown.
- G-L2: Small connectivity legend (Connected / Idle / Disconnected dots) beside
  the cluster filter.

### 2.2 PipelineRun details view — mostly built

Already implemented: `ClusterExecutionCard.tsx` (Dispatch & Routing, Cluster
Resources, Cluster Info panels), all standard detail fields, and the tabs
Details / YAML / Parameters / Logs / Events / (Failure analysis when failed) —
`PipelineRunDetailsPage.tsx`.

**Remaining gaps:**

- G-D1: **Output** tab (wireframe shows the button only; no panel content
  specified). Content decision: render the PipelineRun's results
  (`status.results` / `status.pipelineResults`) as a name/value list with an
  empty state.
- G-D2: **TaskRuns** tab (button only in wireframe). Content decision: a table
  of the run's TaskRuns (Name / Task / Status / Started / Duration) via the
  existing `useTaskRuns` hook, with an empty state.

### 2.3 LocalQueues tab — 100% greenfield

Nothing exists (`grep -r LocalQueue src/` is empty). Full CRUD + modals in
scope.

## 3. Scope (confirmed)

| Area | In scope | Notes |
|------|----------|-------|
| LocalQueues tab | Yes | Mock-data demo, **full CRUD + modals** |
| Details: Output + TaskRuns tabs | Yes | Content per §2.2 decisions |
| List-view polish | Yes | G-L1, G-L2 — marginal value, keep minimal |
| Real Kueue CRD wiring | **No** | Mock-data only this pass |

## 4. Detailed design

### 4.1 LocalQueues — data layer

New file `src/components/__demo__/mock-localqueue-data.ts`:

```ts
export type SchedulingPolicy = 'hub-only' | 'any-spoke' | 'selected-spokes';
export type LocalQueueStatus = 'Ready' | 'Pending' | 'Error';

export interface LocalQueue {
  name: string;
  namespace: string;
  resourceFlavor: string;          // 'default' | 'gpu-enabled' | 'arm64' | 'high-memory'
  schedulingPolicy: SchedulingPolicy;
  spokeClusterNames: string[];     // only meaningful for 'selected-spokes'
  status: LocalQueueStatus;
  lastUpdated: string;             // human label e.g. '2 hours ago'
}

export const MOCK_LOCAL_QUEUES: LocalQueue[];   // the 6 wireframe rows
export const SPOKE_CLUSTERS: { name: string; region: string }[];  // 7 wireframe spokes
export const NAMESPACE_OPTIONS: string[];       // cicd-platform, pipelines-infra, team-alpha, team-beta, release-eng
export const RESOURCE_FLAVOR_OPTIONS: string[]; // default, gpu-enabled, arm64, high-memory
```

Seed data (from the wireframe `#mock-data` block):

| name | namespace | flavor | policy | spokes | status | updated |
|------|-----------|--------|--------|--------|--------|---------|
| ci-builds-fast | cicd-platform | default | any-spoke | — | Ready | 2 hours ago |
| release-pipeline-queue | release-eng | high-memory | hub-only | — | Ready | Yesterday |
| gpu-ml-validation | team-alpha | gpu-enabled | selected-spokes | spoke-east-gpu-01, spoke-west-gpu-02 | Ready | 3 days ago |
| nightly-integration | pipelines-infra | default | any-spoke | — | Pending | 5 minutes ago |
| arm-builds | team-beta | arm64 | selected-spokes | spoke-arm-central-01 | Ready | 1 day ago |
| security-scans | cicd-platform | default | hub-only | — | Error | 30 minutes ago |

Spoke clusters: spoke-east-01 (us-east-1), spoke-east-gpu-01 (us-east-1),
spoke-west-01 (us-west-2), spoke-west-gpu-02 (us-west-2), spoke-eu-central-01
(eu-central-1), spoke-arm-central-01 (us-central-1), spoke-apac-01
(ap-southeast-1).

**CRUD is in-memory:** `LocalQueuesList` holds the array in `useState` seeded
from `MOCK_LOCAL_QUEUES`; create/edit/delete mutate local state only. No
persistence, no k8s calls.

### 4.2 LocalQueues — components

New directory `src/components/localqueues-list/`:

- **`LocalQueuesList.tsx`** — container/page. Owns:
  - `localQueues` state (seeded from `MOCK_LOCAL_QUEUES`).
  - `searchTerm` state; filtered list by name (case-insensitive).
  - Modal state: `modalOpen` ('create' | 'edit' | null), `editTarget`,
    `deleteTarget`.
  - Toasts via PatternFly `AlertGroup isToast` + an `alerts` array
    (`{ key, variant, title }`); auto-dismiss ~8s.
  - Renders: `Toolbar` (SearchInput + "Create LocalQueue" primary `Button`),
    `LocalQueuesTable`, pagination text (`{n} of {total} items`), and the two
    modals.
  - Handlers: `handleCreate`, `handleEdit`, `handleDelete` with validation
    (name+namespace required; ≥1 spoke when `selected-spokes`; duplicate-name
    guard on create). Success/failure emit toasts matching wireframe copy.

- **`LocalQueuesTable.tsx`** — PatternFly `Table variant="compact"` (matching
  `MultiClusterPipelineRunsTable`). Columns:
  Name (link, non-navigating for now) / Namespace / Scheduling Policy
  (`SchedulingPolicyBadge`) / Target Clusters / Status (`LocalQueueStatusIcon`) /
  Last Updated / kebab (`Dropdown` with Edit, Delete). Target Clusters renders:
  spoke chips (`Label`s) for `selected-spokes`, muted "Hub cluster" /
  "All available spokes" text otherwise. Empty state when filter yields nothing.

- **`LocalQueueModal.tsx`** — PatternFly `Modal` + `Form`, shared Create/Edit
  (title + submit label switch on mode). Fields:
  - Name (`TextInput`, required, disabled in edit mode; helper text: valid k8s
    name).
  - Namespace (`FormSelect`, required, `NAMESPACE_OPTIONS`).
  - Resource Flavor (`FormSelect`, `RESOURCE_FLAVOR_OPTIONS`; helper: Kueue
    ResourceFlavor).
  - Scheduling Policy (`Radio` group: Hub Only / Any Spoke / Selected Spokes,
    each with the wireframe description text).
  - Spoke selector (`Checkbox` list from `SPOKE_CLUSTERS`, each showing region)
    — visible only when policy === `selected-spokes`.
  - Submits via `onSubmit(values)` callback to the container; container performs
    validation + state mutation + toast.

- **`LocalQueueDeleteModal.tsx`** — small confirm `Modal`: "Are you sure you
  want to delete LocalQueue **{name}**?" + warning: "This action cannot be
  undone. Any PipelineRuns referencing this LocalQueue will lose their
  scheduling configuration." Danger confirm button.

- **`SchedulingPolicyBadge.tsx`** — `Label` presenter mapping policy →
  {label text, color}: hub-only (purple), any-spoke (blue), selected-spokes
  (teal/green). Colors chosen from PF `Label` color set to approximate the
  wireframe.

- **`LocalQueueStatusIcon.tsx`** — icon + text: Ready
  (`CheckCircleIcon`, success green), Pending (`OutlinedClockIcon` /
  `InProgressIcon`, amber), Error (`ExclamationCircleIcon`, danger red).

- **`index.ts`** — re-exports `LocalQueuesList`.
- **`LocalQueues.scss`** — spoke-chip spacing, badge tweaks; reuse PF tokens.

### 4.3 LocalQueues — wiring

In `src/components/pipelines-list/PipelinesTabbedPage.tsx`, append to the
`pages: NavPage[]` array:

```ts
{
  href: 'local-queues',
  name: t('LocalQueues'),
  component: LocalQueuesList,
},
```

(Placed after the conditional Repositories/Approvals entries. Always visible —
no feature flag, matching the mock-demo nature of the rest of the multi-cluster
work.)

### 4.4 Details — Output + TaskRuns tabs

Two new components in `src/components/pipelineRuns-details/`, wired into the
`pages` array of `PipelineRunDetailsPage.tsx` after `events` (before the
conditional `failure-analysis`):

```ts
{ href: 'output',    name: t('Output'),   component: (props) => <PipelineRunOutput pipelineRun={pipelineRun} {...props} /> },
{ href: 'task-runs', name: t('TaskRuns'), component: (props) => <PipelineRunTaskRuns pipelineRun={pipelineRun} {...props} /> },
```

- **`PipelineRunTaskRuns.tsx`** — uses `useTaskRuns(namespace, pipelineRunName)`
  (existing hook in `../hooks/useTaskRuns`). PatternFly `Table variant="compact"`:
  Name (link to TaskRun) / Task / Status (`Status` component) / Started /
  Duration (`pipelineRunDuration`-style util). Loading + empty states.
- **`PipelineRunOutput.tsx`** — reads `pipelineRun.status.results` (a.k.a.
  `pipelineResults`: `{ name, value }[]`). Renders a `DescriptionList` or
  compact table of name → value; empty state "No output results" when absent.

### 4.5 List-view polish

- **G-L1 (Create → LocalQueue):** add a `localQueue` entry to `menuActions` in
  `PipelinesTabbedPage.tsx` with `label: t('LocalQueue')` and an `onSelection`
  returning `/pipelines/ns/${ns}/local-queues?create=1`. `LocalQueuesList` reads
  the `create=1` search param on mount and auto-opens the Create modal, then
  clears the param. (`ListPageCreateDropdown` requires a `label` — provided
  directly, no model needed.)
- **G-L2 (connectivity legend):** a small inline legend (three colored dots +
  labels) rendered next to the cluster `Select` in `PipelineRunsList.tsx`. Pure
  presentational; reuse the connectivity color tokens already used by
  `ClusterBadge`.

### 4.6 i18n

All new user-facing strings use `t()` and are added to
`locales/en/plugin__pipelines-console-plugin.json`. Non-English locale files are
left untranslated (fall back to key), consistent with recent multi-cluster
commits.

## 5. Component boundaries / interfaces

- `LocalQueuesList` is the only stateful unit; all others are presentational and
  receive data + callbacks via props (independently testable).
- `LocalQueueModal` is controlled: it neither mutates the list nor validates
  business rules (duplicate names) — it collects form values and calls back.
- `SchedulingPolicyBadge` / `LocalQueueStatusIcon` are pure mapping presenters.
- Detail tabs receive `pipelineRun` and read from existing hooks; no new global
  state.

## 6. Testing

Jest + `@testing-library/react`, following existing spec conventions
(mock `react-i18next` `t => k`, mock `../cluster` where charts/badges intrude).

- `localqueues-list/__tests__/LocalQueuesList.spec.tsx`:
  - renders the 6 seed rows;
  - "Create LocalQueue" opens the modal; submitting a valid form prepends a row +
    success toast;
  - Edit pre-fills and updates a row;
  - Delete removes a row after confirm;
  - selecting `selected-spokes` reveals spoke checkboxes; submitting with none
    selected shows an error toast;
  - duplicate name on create shows an error toast;
  - search filters by name / shows empty state.
- `pipelineRuns-details/__tests__/PipelineRunTaskRuns.spec.tsx` — renders rows
  from a mocked `useTaskRuns`; empty state when none.
- `pipelineRuns-details/__tests__/PipelineRunOutput.spec.tsx` — renders results;
  empty state when none.

**Verification commands:** `yarn tsc --noEmit` and
`yarn jest <path>`. **Never run `yarn lint`** in this repo — its autofix
corrupts source tree-wide.

## 7. Out of scope / follow-ups

- Real Kueue `LocalQueue` CRD integration (watch/create/delete, `LocalQueueModel`,
  RBAC).
- Feature-flagging the LocalQueues tab.
- LocalQueue detail page (row links are non-navigating placeholders).
- Non-English translations.

## 8. Open assumptions (flagged for confirmation)

- **A1:** Output tab = PipelineRun results (`status.results`). If a different
  artifacts/output view is intended, revise §4.4.
- **A2:** LocalQueues tab is always visible (no feature flag) — matches the
  mock-demo pattern of the surrounding multi-cluster work.
