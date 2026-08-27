# Fleet Overview Merge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Pipelines **Overview** page content with a mock-data-driven, five-tab **Fleet Dashboard** (Overview, Build Times, Resource Utilization, Spoke Comparison, Alerts) and remove the standalone Fleet Management perspective — leaving the left-nav (Overview / Pipelines / Tasks / Triggers) unchanged.

**Architecture:** The existing exposed component `pipelinesComponent.PipelinesOverviewPage` is repurposed to render a new `FleetDashboard` container. `FleetDashboard` owns shared filter state (selected spokes, time range, search) and renders an in-component PatternFly `Tabs` selector, a shared `FleetToolbar`, and one tab body component per tab. All data comes from a new deterministic mock module `src/components/__demo__/mock-fleet-data.ts`. The Fleet Management perspective (extension + exposed module + `fleet-management.ts`) is deleted.

**Tech Stack:** React 18 + TypeScript, PatternFly 6 (`@patternfly/react-core`, `@patternfly/react-table`), `@patternfly/react-charts/victory` (v8), `react-i18next`, Jest + `@testing-library/react`. OpenShift Console dynamic plugin SDK.

**Spec:** `docs/superpowers/specs/2026-08-24-fleet-overview-merge-design.md`

## Global Constraints

- Namespace for i18n: `plugin__pipelines-console-plugin` — every user-facing string uses `const { t } = useTranslation('plugin__pipelines-console-plugin')`.
- Mock data MUST be deterministic: no `Date.now()`, no `new Date()` with no args, no `Math.random()`. Use fixed strings/arrays.
- PatternFly v6 utility classes use the `pf-v6-u-*` prefix (match existing code).
- Charts import from `@patternfly/react-charts/victory` (NOT `@patternfly/react-charts`).
- Five spokes only, in this fixed order: `spoke-prod-east`, `spoke-prod-west`, `spoke-staging`, `spoke-dev`, `spoke-edge`.
- Reuse `ClusterBadge`, `RoutingPill`, `ResourceMeter` from `src/components/cluster` where a spoke identity or a CPU/memory meter is shown.
- Do NOT edit the `console.page/route` or `console.navigation/href` entries for `/pipelines-overview` — nav label stays "Overview".
- Run tests with: `yarn jest <path>` (Jest is configured; see `package.json`).

---

## File Structure

**New:**
- `src/components/__demo__/mock-fleet-data.ts` — all fleet mock data + typed accessors.
- `src/components/__demo__/__tests__/mock-fleet-data.spec.ts` — data/accessor tests.
- `src/components/pipelines-overview/fleet/types.ts` — shared TS types (`FleetFilterState`, `SpokeName`).
- `src/components/pipelines-overview/fleet/FleetToolbar.tsx` — shared filter row.
- `src/components/pipelines-overview/fleet/FleetStatCard.tsx` — stat card with sparkline + delta.
- `src/components/pipelines-overview/fleet/Sparkline.tsx` — tiny area chart.
- `src/components/pipelines-overview/fleet/SpokeHealthTable.tsx` — 10-column health table.
- `src/components/pipelines-overview/fleet/FailureHeatmap.tsx` — CSS-grid heatmap.
- `src/components/pipelines-overview/fleet/AlertRow.tsx` — single alert row.
- `src/components/pipelines-overview/fleet/FleetOverviewTab.tsx`
- `src/components/pipelines-overview/fleet/BuildTimesTab.tsx`
- `src/components/pipelines-overview/fleet/ResourceUtilizationTab.tsx`
- `src/components/pipelines-overview/fleet/SpokeComparisonTab.tsx`
- `src/components/pipelines-overview/fleet/AlertsTab.tsx`
- `src/components/pipelines-overview/fleet/FleetDashboard.tsx` — tab container.
- `src/components/pipelines-overview/fleet/fleet.scss` — styles.
- `src/components/pipelines-overview/fleet/__tests__/FleetDashboard.spec.tsx` — smoke tests for tabs.

**Modified:**
- `src/components/pipelines-overview/PipelinesOverviewPage.tsx` — render `FleetDashboard`.
- `console-extensions.json` — remove fleet-management perspective entry.
- `package.json` — remove `fleetManagementPerspective` exposed module.

**Deleted:**
- `src/components/perspective/fleet-management.ts`

---

## Task 1: Mock fleet data module

**Files:**
- Create: `src/components/__demo__/mock-fleet-data.ts`
- Test: `src/components/__demo__/__tests__/mock-fleet-data.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type SpokeName = 'spoke-prod-east' | 'spoke-prod-west' | 'spoke-staging' | 'spoke-dev' | 'spoke-edge'`
  - `const ALL_SPOKES: SpokeName[]`
  - `const LAST_UPDATED_LABEL: string`
  - `const TIME_RANGE_OPTIONS: string[]` (e.g. `['Last 24 hours','Last 7 days','Last 30 days','Last 90 days']`)
  - `interface SpokeMetrics { name: SpokeName; region: string; status: 'healthy'|'warning'|'critical'; dispatched: number; successRate: number; avgBuildSec: number; p95BuildSec: number; p99BuildSec: number; timedOut: number; cpuUtil: number; memUtil: number; queueDepth: number; workerNodes: number; vcpus: number; memoryGi: number; headroom: 'Comfortable'|'Underutilized'|'Tight'|'Critical'; successTrend: number[]; queueTrend: number[]; cpuTrend: number[]; failureDensity: number[] }`
  - `interface FleetKpis { successRate: number; successRateDelta: number; avgBuildLabel: string; dispatchedTotal: number; dispatchedDelta: number; activeSpokes: number; sparkSuccess: number[]; sparkBuild: number[]; sparkDispatched: number[] }`
  - `interface BuildTimeStats { p50Label: string; p95Label: string; p99Label: string; timedOut: number }`
  - `interface ResourceStats { avgCpu: number; avgMem: number; totalVcpus: number; totalMemoryGi: number }`
  - `interface SlowestPipelineRow { pipeline: string; spoke: SpokeName; p50: string; p95: string; runs: number }`
  - `interface FailureReason { reason: string; count: number }`
  - `interface DispatchThroughputPoint { x: string; succeeded: number; failed: number }`
  - `interface FleetAlert { id: string; severity: 'critical'|'warning'; title: string; description: string; firedAt: string; duration: string; source: string; state: 'active'|'acknowledged' }`
  - `interface AlertSummary { active: number; acknowledged: number; resolved: number }`
  - `interface SeriesGroup { name: string; data: { x: string; y: number }[] }`
  - `function formatBuildTime(sec: number): string` (→ `'4m 32s'`)
  - `function getSpokeMetrics(spokes: SpokeName[]): SpokeMetrics[]`
  - `function getFleetKpis(spokes: SpokeName[]): FleetKpis`
  - `function getSuccessRateTrend(spokes: SpokeName[]): SeriesGroup[]`
  - `function getQueueDepthTrend(spokes: SpokeName[]): SeriesGroup[]`
  - `function getCpuTrend(spokes: SpokeName[]): SeriesGroup[]`
  - `function getBuildTimeStats(spokes: SpokeName[]): BuildTimeStats`
  - `function getBuildTimeTrend(spokes: SpokeName[]): { x: string; y: number }[]`
  - `function getSlowestPipelines(spokes: SpokeName[]): SlowestPipelineRow[]`
  - `function getResourceStats(spokes: SpokeName[]): ResourceStats`
  - `function getTopFailureReasons(spokes: SpokeName[]): FailureReason[]`
  - `function getDispatchThroughput(spokes: SpokeName[]): DispatchThroughputPoint[]`
  - `function getFleetAlerts(): FleetAlert[]`
  - `function getAlertSummary(): AlertSummary`

- [ ] **Step 1: Write the failing test**

Create `src/components/__demo__/__tests__/mock-fleet-data.spec.ts`:

```ts
import {
  ALL_SPOKES,
  formatBuildTime,
  getFleetKpis,
  getSpokeMetrics,
  getBuildTimeStats,
  getResourceStats,
  getSuccessRateTrend,
  getSlowestPipelines,
  getFleetAlerts,
  getAlertSummary,
} from '../mock-fleet-data';

describe('mock-fleet-data', () => {
  it('has exactly five spokes in fixed order', () => {
    expect(ALL_SPOKES).toEqual([
      'spoke-prod-east',
      'spoke-prod-west',
      'spoke-staging',
      'spoke-dev',
      'spoke-edge',
    ]);
  });

  it('formats build time as Xm Ys', () => {
    expect(formatBuildTime(272)).toBe('4m 32s');
    expect(formatBuildTime(45)).toBe('0m 45s');
  });

  it('sums dispatched to 12,847 across all spokes', () => {
    expect(getFleetKpis(ALL_SPOKES).dispatchedTotal).toBe(12847);
  });

  it('reports 5 active spokes when all selected', () => {
    expect(getFleetKpis(ALL_SPOKES).activeSpokes).toBe(5);
  });

  it('computes fleet avg cpu 71.8 and avg mem 65.6', () => {
    const r = getResourceStats(ALL_SPOKES);
    expect(r.avgCpu).toBeCloseTo(71.8, 1);
    expect(r.avgMem).toBeCloseTo(65.6, 1);
    expect(r.totalVcpus).toBe(384);
    expect(r.totalMemoryGi).toBe(768);
  });

  it('filters metrics by selected spokes', () => {
    const m = getSpokeMetrics(['spoke-edge']);
    expect(m).toHaveLength(1);
    expect(m[0].name).toBe('spoke-edge');
    expect(m[0].status).toBe('critical');
  });

  it('returns one success-rate trend series per selected spoke', () => {
    expect(getSuccessRateTrend(['spoke-edge', 'spoke-dev'])).toHaveLength(2);
  });

  it('sums timed-out runs to 134 across all spokes', () => {
    expect(getBuildTimeStats(ALL_SPOKES).timedOut).toBe(134);
  });

  it('returns slowest pipelines only for selected spokes', () => {
    const rows = getSlowestPipelines(['spoke-edge']);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.spoke === 'spoke-edge')).toBe(true);
  });

  it('reports alert summary of 3 active, 2 acknowledged', () => {
    const s = getAlertSummary();
    expect(s.active).toBe(3);
    expect(s.acknowledged).toBe(2);
    expect(s.resolved).toBe(14);
    const alerts = getFleetAlerts();
    expect(alerts.filter((a) => a.state === 'active')).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/__demo__/__tests__/mock-fleet-data.spec.ts`
Expected: FAIL — cannot find module `../mock-fleet-data`.

- [ ] **Step 3: Write the implementation**

Create `src/components/__demo__/mock-fleet-data.ts`:

```ts
export type SpokeName =
  | 'spoke-prod-east'
  | 'spoke-prod-west'
  | 'spoke-staging'
  | 'spoke-dev'
  | 'spoke-edge';

export const ALL_SPOKES: SpokeName[] = [
  'spoke-prod-east',
  'spoke-prod-west',
  'spoke-staging',
  'spoke-dev',
  'spoke-edge',
];

export const LAST_UPDATED_LABEL = '2 min ago';

export const TIME_RANGE_OPTIONS = [
  'Last 24 hours',
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
];

export interface SpokeMetrics {
  name: SpokeName;
  region: string;
  status: 'healthy' | 'warning' | 'critical';
  dispatched: number;
  successRate: number;
  avgBuildSec: number;
  p95BuildSec: number;
  p99BuildSec: number;
  timedOut: number;
  cpuUtil: number;
  memUtil: number;
  queueDepth: number;
  workerNodes: number;
  vcpus: number;
  memoryGi: number;
  headroom: 'Comfortable' | 'Underutilized' | 'Tight' | 'Critical';
  successTrend: number[];
  queueTrend: number[];
  cpuTrend: number[];
  failureDensity: number[]; // Mon..Sun
}

const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];

// deterministic series helper: base + fixed deltas
const series = (base: number, deltas: number[]): number[] =>
  deltas.map((d) => Math.round((base + d) * 10) / 10);

const SPOKE_METRICS: Record<SpokeName, SpokeMetrics> = {
  'spoke-prod-east': {
    name: 'spoke-prod-east',
    region: 'us-east-1',
    status: 'healthy',
    dispatched: 3842,
    successRate: 96.7,
    avgBuildSec: 228,
    p95BuildSec: 520,
    p99BuildSec: 700,
    timedOut: 8,
    cpuUtil: 72,
    memUtil: 65,
    queueDepth: 4,
    workerNodes: 12,
    vcpus: 96,
    memoryGi: 192,
    headroom: 'Comfortable',
    successTrend: series(96.7, [-1.5, -0.8, 0.2, -0.4, 0.6, 0.1, -0.2, 0.3]),
    queueTrend: series(4, [-2, -1, 0, 1, 2, 0, -1, 0]),
    cpuTrend: series(72, [-6, -3, 2, 4, -2, 1, 3, 0]),
    failureDensity: [1, 0, 2, 1, 0, 1, 0],
  },
  'spoke-prod-west': {
    name: 'spoke-prod-west',
    region: 'us-west-2',
    status: 'healthy',
    dispatched: 3210,
    successRate: 95.2,
    avgBuildSec: 246,
    p95BuildSec: 560,
    p99BuildSec: 760,
    timedOut: 10,
    cpuUtil: 68,
    memUtil: 61,
    queueDepth: 2,
    workerNodes: 10,
    vcpus: 80,
    memoryGi: 160,
    headroom: 'Comfortable',
    successTrend: series(95.2, [-1.2, -0.5, 0.4, -0.3, 0.5, 0.2, -0.1, 0.2]),
    queueTrend: series(2, [-1, 0, 1, 0, 1, 0, -1, 0]),
    cpuTrend: series(68, [-5, -2, 3, 2, -1, 1, 2, 0]),
    failureDensity: [0, 1, 1, 2, 1, 0, 1],
  },
  'spoke-staging': {
    name: 'spoke-staging',
    region: 'eu-west-1',
    status: 'healthy',
    dispatched: 2645,
    successRate: 93.8,
    avgBuildSec: 312,
    p95BuildSec: 600,
    p99BuildSec: 820,
    timedOut: 12,
    cpuUtil: 45,
    memUtil: 38,
    queueDepth: 0,
    workerNodes: 8,
    vcpus: 64,
    memoryGi: 128,
    headroom: 'Underutilized',
    successTrend: series(93.8, [-2, -1, 0.5, -0.5, 1, 0.3, -0.2, 0.4]),
    queueTrend: series(0, [0, 1, 0, 1, 0, 0, 1, 0]),
    cpuTrend: series(45, [-4, -2, 2, 3, -1, 1, 2, 0]),
    failureDensity: [1, 1, 2, 2, 1, 1, 2],
  },
  'spoke-dev': {
    name: 'spoke-dev',
    region: 'us-east-2',
    status: 'warning',
    dispatched: 2180,
    successRate: 92.5,
    avgBuildSec: 270,
    p95BuildSec: 900,
    p99BuildSec: 1200,
    timedOut: 34,
    cpuUtil: 83,
    memUtil: 76,
    queueDepth: 12,
    workerNodes: 8,
    vcpus: 80,
    memoryGi: 160,
    headroom: 'Tight',
    successTrend: series(92.5, [-3, -1.5, 0.5, -1, 1.5, -0.5, 0.5, -0.5]),
    queueTrend: series(12, [-4, -2, 0, 2, 4, 1, -1, 2]),
    cpuTrend: series(83, [-6, -3, 3, 5, -2, 2, 4, 1]),
    failureDensity: [3, 2, 4, 5, 3, 2, 4],
  },
  'spoke-edge': {
    name: 'spoke-edge',
    region: 'ap-southeast-1',
    status: 'critical',
    dispatched: 970,
    successRate: 90.0,
    avgBuildSec: 366,
    p95BuildSec: 1200,
    p99BuildSec: 1600,
    timedOut: 70,
    cpuUtil: 91,
    memUtil: 88,
    queueDepth: 23,
    workerNodes: 8,
    vcpus: 64,
    memoryGi: 128,
    headroom: 'Critical',
    successTrend: series(90.0, [-4, -2, -1, -3, 1, -2, -1, -2]),
    queueTrend: series(23, [-6, -3, 2, 6, 8, 3, -2, 4]),
    cpuTrend: series(91, [-4, -2, 2, 4, 1, 2, 3, 2]),
    failureDensity: [6, 5, 8, 9, 7, 6, 8],
  },
};

export interface FleetKpis {
  successRate: number;
  successRateDelta: number;
  avgBuildLabel: string;
  dispatchedTotal: number;
  dispatchedDelta: number;
  activeSpokes: number;
  sparkSuccess: number[];
  sparkBuild: number[];
  sparkDispatched: number[];
}

export interface BuildTimeStats {
  p50Label: string;
  p95Label: string;
  p99Label: string;
  timedOut: number;
}

export interface ResourceStats {
  avgCpu: number;
  avgMem: number;
  totalVcpus: number;
  totalMemoryGi: number;
}

export interface SlowestPipelineRow {
  pipeline: string;
  spoke: SpokeName;
  p50: string;
  p95: string;
  runs: number;
}

export interface FailureReason {
  reason: string;
  count: number;
}

export interface DispatchThroughputPoint {
  x: string;
  succeeded: number;
  failed: number;
}

export interface FleetAlert {
  id: string;
  severity: 'critical' | 'warning';
  title: string;
  description: string;
  firedAt: string;
  duration: string;
  source: string;
  state: 'active' | 'acknowledged';
}

export interface AlertSummary {
  active: number;
  acknowledged: number;
  resolved: number;
}

export interface SeriesGroup {
  name: string;
  data: { x: string; y: number }[];
}

export const formatBuildTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

const round1 = (n: number): number => Math.round(n * 10) / 10;

export const getSpokeMetrics = (spokes: SpokeName[]): SpokeMetrics[] =>
  ALL_SPOKES.filter((s) => spokes.includes(s)).map((s) => SPOKE_METRICS[s]);

const weightedByDispatched = (
  metrics: SpokeMetrics[],
  pick: (m: SpokeMetrics) => number,
): number => {
  const total = metrics.reduce((a, m) => a + m.dispatched, 0);
  if (total === 0) return 0;
  return metrics.reduce((a, m) => a + pick(m) * m.dispatched, 0) / total;
};

const toSeries = (name: string, values: number[]): SeriesGroup => ({
  name,
  data: values.map((y, i) => ({ x: WEEK_LABELS[i] ?? `W${i + 1}`, y })),
});

export const getFleetKpis = (spokes: SpokeName[]): FleetKpis => {
  const m = getSpokeMetrics(spokes);
  const dispatchedTotal = m.reduce((a, x) => a + x.dispatched, 0);
  const successRate = round1(weightedByDispatched(m, (x) => x.successRate));
  const avgBuildSec = Math.round(weightedByDispatched(m, (x) => x.avgBuildSec));
  // fleet-level sparklines: index-wise weighted average of per-spoke trends
  const spark = (pick: (x: SpokeMetrics) => number[]): number[] =>
    WEEK_LABELS.map((_label, i) =>
      round1(
        weightedByDispatched(m, (x) => pick(x)[i] ?? pick(x)[pick(x).length - 1]),
      ),
    );
  return {
    successRate,
    successRateDelta: 1.3,
    avgBuildLabel: formatBuildTime(avgBuildSec || 0),
    dispatchedTotal,
    dispatchedDelta: 8.2,
    activeSpokes: m.length,
    sparkSuccess: spark((x) => x.successTrend),
    sparkBuild: spark((x) => x.cpuTrend),
    sparkDispatched: spark((x) => x.queueTrend),
  };
};

export const getSuccessRateTrend = (spokes: SpokeName[]): SeriesGroup[] =>
  getSpokeMetrics(spokes).map((m) => toSeries(m.name, m.successTrend));

export const getQueueDepthTrend = (spokes: SpokeName[]): SeriesGroup[] =>
  getSpokeMetrics(spokes).map((m) => toSeries(m.name, m.queueTrend));

export const getCpuTrend = (spokes: SpokeName[]): SeriesGroup[] =>
  getSpokeMetrics(spokes).map((m) => toSeries(m.name, m.cpuTrend));

export const getBuildTimeStats = (spokes: SpokeName[]): BuildTimeStats => {
  const m = getSpokeMetrics(spokes);
  return {
    p50Label: formatBuildTime(
      Math.round(weightedByDispatched(m, (x) => x.avgBuildSec)) || 0,
    ),
    p95Label: formatBuildTime(
      Math.round(weightedByDispatched(m, (x) => x.p95BuildSec)) || 0,
    ),
    p99Label: formatBuildTime(
      Math.round(weightedByDispatched(m, (x) => x.p99BuildSec)) || 0,
    ),
    timedOut: m.reduce((a, x) => a + x.timedOut, 0),
  };
};

export const getBuildTimeTrend = (
  spokes: SpokeName[],
): { x: string; y: number }[] => {
  const m = getSpokeMetrics(spokes);
  return WEEK_LABELS.map((label, i) => ({
    x: label,
    y: Math.round(
      weightedByDispatched(
        m,
        (x) => x.avgBuildSec + (x.cpuTrend[i] ?? 0) - x.cpuUtil,
      ) || 0,
    ),
  }));
};

const SLOWEST_PIPELINES: SlowestPipelineRow[] = [
  { pipeline: 'buildah-deploy', spoke: 'spoke-edge', p50: '6m 06s', p95: '20m 00s', runs: 412 },
  { pipeline: 'scan-and-deploy', spoke: 'spoke-dev', p50: '4m 30s', p95: '15m 00s', runs: 356 },
  { pipeline: 'nodejs-deploy', spoke: 'spoke-staging', p50: '5m 12s', p95: '10m 00s', runs: 298 },
  { pipeline: 'docker-build-push', spoke: 'spoke-prod-west', p50: '4m 06s', p95: '9m 20s', runs: 540 },
  { pipeline: 's2i-java', spoke: 'spoke-prod-east', p50: '3m 48s', p95: '8m 40s', runs: 621 },
];

export const getSlowestPipelines = (
  spokes: SpokeName[],
): SlowestPipelineRow[] =>
  SLOWEST_PIPELINES.filter((r) => spokes.includes(r.spoke));

export const getResourceStats = (spokes: SpokeName[]): ResourceStats => {
  const m = getSpokeMetrics(spokes);
  const avg = (pick: (x: SpokeMetrics) => number) =>
    m.length ? round1(m.reduce((a, x) => a + pick(x), 0) / m.length) : 0;
  return {
    avgCpu: avg((x) => x.cpuUtil),
    avgMem: avg((x) => x.memUtil),
    totalVcpus: m.reduce((a, x) => a + x.vcpus, 0),
    totalMemoryGi: m.reduce((a, x) => a + x.memoryGi, 0),
  };
};

const FAILURE_REASONS: { reason: string; perSpoke: Partial<Record<SpokeName, number>> }[] = [
  { reason: 'OOMKilled', perSpoke: { 'spoke-edge': 210, 'spoke-dev': 60, 'spoke-staging': 20 } },
  { reason: 'Image pull failure', perSpoke: { 'spoke-edge': 90, 'spoke-prod-west': 40, 'spoke-dev': 30 } },
  { reason: 'Timeout', perSpoke: { 'spoke-dev': 80, 'spoke-edge': 40, 'spoke-staging': 14 } },
  { reason: 'Test failure', perSpoke: { 'spoke-prod-east': 60, 'spoke-prod-west': 50, 'spoke-staging': 30 } },
  { reason: 'Scan critical CVE', perSpoke: { 'spoke-dev': 45, 'spoke-prod-east': 20 } },
];

export const getTopFailureReasons = (spokes: SpokeName[]): FailureReason[] =>
  FAILURE_REASONS.map((f) => ({
    reason: f.reason,
    count: spokes.reduce((a, s) => a + (f.perSpoke[s] ?? 0), 0),
  }))
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

export const getDispatchThroughput = (
  spokes: SpokeName[],
): DispatchThroughputPoint[] => {
  const m = getSpokeMetrics(spokes);
  return WEEK_LABELS.map((label, i) => {
    const succeeded = Math.round(
      m.reduce((a, x) => a + (x.dispatched / 8) * (x.successRate / 100), 0) +
        (i - 4) * 5,
    );
    const failed = Math.round(
      m.reduce((a, x) => a + (x.dispatched / 8) * (1 - x.successRate / 100), 0) +
        (i % 3),
    );
    return { x: label, succeeded, failed };
  });
};

const FLEET_ALERTS: FleetAlert[] = [
  {
    id: 'a1',
    severity: 'critical',
    title: 'spoke-edge CPU utilization at 91%',
    description:
      'ClusterQueue has 23 pending PipelineRuns. Build times are 3.4x fleet median. Risk of OOM kills and pod evictions.',
    firedAt: '2026-08-03 09:14 UTC',
    duration: '4h 46m',
    source: 'Kueue Watcher',
    state: 'active',
  },
  {
    id: 'a2',
    severity: 'critical',
    title: 'spoke-edge memory utilization at 88%',
    description:
      'Memory pressure increasing. secret-syncer and Watcher pods at risk. OOMKilled events detected 3 times in last hour.',
    firedAt: '2026-08-03 08:42 UTC',
    duration: '5h 18m',
    source: 'Prometheus',
    state: 'active',
  },
  {
    id: 'a3',
    severity: 'warning',
    title: 'spoke-dev ClusterQueue depth increasing',
    description:
      'Queue depth has grown from 5 to 12 pending PipelineRuns in the last 2 hours. CPU at 83%, approaching threshold.',
    firedAt: '2026-08-03 12:08 UTC',
    duration: '1h 52m',
    source: 'MultiKueue',
    state: 'active',
  },
  {
    id: 'a4',
    severity: 'warning',
    title: 'secret-syncer lag on spoke-edge exceeds 5 minutes',
    description:
      'Secret synchronization from Hub to spoke-edge is delayed. Pipeline credentials may be stale, causing image pull failures.',
    firedAt: '2026-08-03 11:34 UTC',
    duration: '2h 26m',
    source: 'secret-syncer',
    state: 'acknowledged',
  },
  {
    id: 'a5',
    severity: 'warning',
    title: 'spoke-staging build queue idle',
    description:
      'spoke-staging has processed 0 dispatched runs in the last hour while other spokes are saturated. Check routing weights.',
    firedAt: '2026-08-03 10:10 UTC',
    duration: '3h 50m',
    source: 'MultiKueue',
    state: 'acknowledged',
  },
];

export const getFleetAlerts = (): FleetAlert[] => FLEET_ALERTS;

export const getAlertSummary = (): AlertSummary => ({
  active: FLEET_ALERTS.filter((a) => a.state === 'active').length,
  acknowledged: FLEET_ALERTS.filter((a) => a.state === 'acknowledged').length,
  resolved: 14,
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/__demo__/__tests__/mock-fleet-data.spec.ts`
Expected: PASS (all assertions). If `getFleetKpis(ALL_SPOKES).dispatchedTotal` ≠ 12847, re-check the per-spoke `dispatched` values sum to 3842+3210+2645+2180+970.

- [ ] **Step 5: Commit**

```bash
git add src/components/__demo__/mock-fleet-data.ts src/components/__demo__/__tests__/mock-fleet-data.spec.ts
git commit -m "feat(fleet): add deterministic mock fleet-dashboard data module"
```

---

## Task 2: Shared types + Sparkline + FleetStatCard

**Files:**
- Create: `src/components/pipelines-overview/fleet/types.ts`
- Create: `src/components/pipelines-overview/fleet/Sparkline.tsx`
- Create: `src/components/pipelines-overview/fleet/FleetStatCard.tsx`
- Create: `src/components/pipelines-overview/fleet/fleet.scss`
- Test: `src/components/pipelines-overview/fleet/__tests__/FleetStatCard.spec.tsx`

**Interfaces:**
- Consumes: `SpokeName` from `../../__demo__/mock-fleet-data`.
- Produces:
  - `types.ts`: `interface FleetFilterState { selectedSpokes: SpokeName[]; timeRange: string; search: string }`
  - `Sparkline`: `FC<{ values: number[]; color?: string }>`
  - `FleetStatCard`: `FC<{ label: string; value: string; delta?: string; deltaVariant?: 'up'|'down'|'neutral'; spark?: number[]; valueClassName?: string }>`

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/FleetStatCard.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import FleetStatCard from '../FleetStatCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('FleetStatCard', () => {
  it('renders label, value and delta', () => {
    render(
      <FleetStatCard
        label="FLEET SUCCESS RATE"
        value="94.2%"
        delta="+1.3%"
        deltaVariant="up"
        spark={[1, 2, 3, 2, 4]}
      />,
    );
    expect(screen.getByText('FLEET SUCCESS RATE')).toBeTruthy();
    expect(screen.getByText('94.2%')).toBeTruthy();
    expect(screen.getByText('+1.3%')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetStatCard.spec.tsx`
Expected: FAIL — cannot find module `../FleetStatCard`.

- [ ] **Step 3: Write the implementations**

Create `src/components/pipelines-overview/fleet/types.ts`:

```ts
import type { SpokeName } from '../../__demo__/mock-fleet-data';

export interface FleetFilterState {
  selectedSpokes: SpokeName[];
  timeRange: string;
  search: string;
}
```

Create `src/components/pipelines-overview/fleet/Sparkline.tsx`:

```tsx
import type { FC } from 'react';
import { Chart, ChartArea } from '@patternfly/react-charts/victory';

interface SparklineProps {
  values: number[];
  color?: string;
}

const Sparkline: FC<SparklineProps> = ({ values, color }) => {
  if (!values?.length) return null;
  const data = values.map((y, i) => ({ x: i + 1, y }));
  return (
    <Chart
      ariaDesc="sparkline"
      height={40}
      width={120}
      padding={{ top: 4, bottom: 4, left: 4, right: 4 }}
      themeColor="blue"
    >
      <ChartArea
        data={data}
        style={{
          data: {
            stroke: color ?? 'var(--pf-t--global--color--brand--default)',
            fill: 'var(--pf-t--global--color--brand--100)',
          },
        }}
      />
    </Chart>
  );
};

export default Sparkline;
```

Create `src/components/pipelines-overview/fleet/FleetStatCard.tsx`:

```tsx
import type { FC } from 'react';
import classNames from 'classnames';
import { Card, CardBody, Flex, FlexItem } from '@patternfly/react-core';
import Sparkline from './Sparkline';

interface FleetStatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaVariant?: 'up' | 'down' | 'neutral';
  spark?: number[];
  valueClassName?: string;
}

const FleetStatCard: FC<FleetStatCardProps> = ({
  label,
  value,
  delta,
  deltaVariant = 'neutral',
  spark,
  valueClassName,
}) => (
  <Card isFullHeight className="opp-fleet-stat-card card-border">
    <CardBody>
      <div className="opp-fleet-stat-card__label">{label}</div>
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsFlexEnd' }}
      >
        <FlexItem>
          <div className={classNames('opp-fleet-stat-card__value', valueClassName)}>
            {value}
          </div>
          {delta && (
            <div
              className={classNames('opp-fleet-stat-card__delta', {
                'opp-fleet-stat-card__delta--up': deltaVariant === 'up',
                'opp-fleet-stat-card__delta--down': deltaVariant === 'down',
              })}
            >
              {delta}
            </div>
          )}
        </FlexItem>
        {spark && (
          <FlexItem>
            <Sparkline values={spark} />
          </FlexItem>
        )}
      </Flex>
    </CardBody>
  </Card>
);

export default FleetStatCard;
```

Create `src/components/pipelines-overview/fleet/fleet.scss`:

```scss
.opp-fleet-stat-card {
  &__label {
    color: var(--pf-t--global--text--color--subtle);
    font-size: var(--pf-t--global--font--size--xs);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    margin-block-end: var(--pf-t--global--spacer--sm);
  }
  &__value {
    font-size: var(--pf-t--global--font--size--2xl);
    font-weight: var(--pf-t--global--font--weight--body--bold);
  }
  &__delta {
    font-size: var(--pf-t--global--font--size--sm);
    &--up { color: var(--pf-t--global--color--status--success--default); }
    &--down { color: var(--pf-t--global--color--status--danger--default); }
  }
}

.opp-fleet-value--warning { color: var(--pf-t--global--color--status--warning--default); }
.opp-fleet-value--danger { color: var(--pf-t--global--color--status--danger--default); }
.opp-fleet-value--success { color: var(--pf-t--global--color--status--success--default); }

.opp-fleet-heatmap {
  display: grid;
  gap: 2px;
  &__cell {
    aspect-ratio: 1;
    border-radius: 2px;
    min-height: 18px;
  }
  &__rowlabel,
  &__collabel {
    font-size: var(--pf-t--global--font--size--xs);
    color: var(--pf-t--global--text--color--subtle);
  }
}

.opp-fleet-alert {
  border-inline-start: 3px solid transparent;
  margin-block-end: var(--pf-t--global--spacer--md);
  &--critical { border-inline-start-color: var(--pf-t--global--color--status--danger--default); }
  &--warning { border-inline-start-color: var(--pf-t--global--color--status--warning--default); }
}

.opp-fleet-spoke-card {
  border-block-start: 3px solid transparent;
  &--healthy { border-block-start-color: var(--pf-t--global--color--status--success--default); }
  &--warning { border-block-start-color: var(--pf-t--global--color--status--warning--default); }
  &--critical { border-block-start-color: var(--pf-t--global--color--status--danger--default); }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetStatCard.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/types.ts src/components/pipelines-overview/fleet/Sparkline.tsx src/components/pipelines-overview/fleet/FleetStatCard.tsx src/components/pipelines-overview/fleet/fleet.scss src/components/pipelines-overview/fleet/__tests__/FleetStatCard.spec.tsx
git commit -m "feat(fleet): add shared types, Sparkline and FleetStatCard"
```

---

## Task 3: FleetToolbar (shared filter row)

**Files:**
- Create: `src/components/pipelines-overview/fleet/FleetToolbar.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/FleetToolbar.spec.tsx`

**Interfaces:**
- Consumes: `FleetFilterState` from `./types`; `ALL_SPOKES`, `TIME_RANGE_OPTIONS`, `LAST_UPDATED_LABEL`, `SpokeName` from `../../__demo__/mock-fleet-data`.
- Produces: `FleetToolbar`: `FC<{ filter: FleetFilterState; onChange: (next: FleetFilterState) => void }>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/FleetToolbar.spec.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FleetToolbar from '../FleetToolbar';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('FleetToolbar', () => {
  const baseFilter = {
    selectedSpokes: [...ALL_SPOKES],
    timeRange: 'Last 30 days',
    search: '',
  };

  it('renders a chip per selected spoke and the updated label', () => {
    render(<FleetToolbar filter={baseFilter} onChange={jest.fn()} />);
    expect(screen.getByText('spoke-prod-east')).toBeTruthy();
    expect(screen.getByText('spoke-edge')).toBeTruthy();
    expect(screen.getByText(/2 min ago/)).toBeTruthy();
  });

  it('removes a spoke when its chip is closed', () => {
    const onChange = jest.fn();
    render(<FleetToolbar filter={baseFilter} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /close spoke-edge/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedSpokes: expect.not.arrayContaining(['spoke-edge']),
      }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetToolbar.spec.tsx`
Expected: FAIL — cannot find module `../FleetToolbar`.

- [ ] **Step 3: Write the implementation**

Create `src/components/pipelines-overview/fleet/FleetToolbar.tsx`:

```tsx
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  LabelGroup,
  MenuToggle,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { FilterIcon, SyncAltIcon, DownloadIcon } from '@patternfly/react-icons';
import {
  ALL_SPOKES,
  LAST_UPDATED_LABEL,
  TIME_RANGE_OPTIONS,
  SpokeName,
} from '../../__demo__/mock-fleet-data';
import type { FleetFilterState } from './types';

interface FleetToolbarProps {
  filter: FleetFilterState;
  onChange: (next: FleetFilterState) => void;
}

const FleetToolbar: FC<FleetToolbarProps> = ({ filter, onChange }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [spokeOpen, setSpokeOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);

  const removeSpoke = (spoke: SpokeName) =>
    onChange({
      ...filter,
      selectedSpokes: filter.selectedSpokes.filter((s) => s !== spoke),
    });

  const toggleSpoke = (spoke: SpokeName) =>
    onChange({
      ...filter,
      selectedSpokes: filter.selectedSpokes.includes(spoke)
        ? filter.selectedSpokes.filter((s) => s !== spoke)
        : [...filter.selectedSpokes, spoke],
    });

  return (
    <Toolbar className="pf-v6-u-pb-0">
      <ToolbarContent>
        <ToolbarItem>
          <Button variant="secondary" icon={<FilterIcon />}>
            {t('Filter')}
          </Button>
        </ToolbarItem>
        <ToolbarItem>
          <Dropdown
            isOpen={spokeOpen}
            onOpenChange={setSpokeOpen}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setSpokeOpen((o) => !o)}
                isExpanded={spokeOpen}
              >
                {t('All Spoke Clusters ({{count}})', {
                  count: filter.selectedSpokes.length,
                })}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {ALL_SPOKES.map((s) => (
                <DropdownItem
                  key={s}
                  onClick={() => toggleSpoke(s)}
                  isSelected={filter.selectedSpokes.includes(s)}
                >
                  {s}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </ToolbarItem>
        <ToolbarItem>
          <Dropdown
            isOpen={timeOpen}
            onOpenChange={setTimeOpen}
            toggle={(ref) => (
              <MenuToggle
                ref={ref}
                onClick={() => setTimeOpen((o) => !o)}
                isExpanded={timeOpen}
              >
                {filter.timeRange}
              </MenuToggle>
            )}
          >
            <DropdownList>
              {TIME_RANGE_OPTIONS.map((tr) => (
                <DropdownItem
                  key={tr}
                  onClick={() => {
                    onChange({ ...filter, timeRange: tr });
                    setTimeOpen(false);
                  }}
                >
                  {tr}
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </ToolbarItem>
        <ToolbarItem>
          <SearchInput
            placeholder={t('Search by pipeline name...')}
            value={filter.search}
            onChange={(_e, v) => onChange({ ...filter, search: v })}
            onClear={() => onChange({ ...filter, search: '' })}
          />
        </ToolbarItem>
        <ToolbarItem>
          <LabelGroup>
            {filter.selectedSpokes.map((s) => (
              <Label
                key={s}
                color="blue"
                onClose={() => removeSpoke(s)}
                closeBtnAriaLabel={t('close {{spoke}}', { spoke: s })}
              >
                {s}
              </Label>
            ))}
          </LabelGroup>
        </ToolbarItem>
        <ToolbarItem align={{ default: 'alignEnd' }}>
          <span className="pf-v6-u-color-200 pf-v6-u-mr-sm">
            {t('Updated {{when}}', { when: LAST_UPDATED_LABEL })}
          </span>
          <Button variant="plain" aria-label={t('Refresh')} icon={<SyncAltIcon />} />
          <Button variant="plain" aria-label={t('Download')} icon={<DownloadIcon />} />
        </ToolbarItem>
      </ToolbarContent>
    </Toolbar>
  );
};

export default FleetToolbar;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetToolbar.spec.tsx`
Expected: PASS. If the close-button name assertion fails, inspect the rendered `closeBtnAriaLabel` — the mocked `t` returns the key `close {{spoke}}` literally, so change the test matcher to `/close/i` and assert the chip text separately.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/FleetToolbar.tsx src/components/pipelines-overview/fleet/__tests__/FleetToolbar.spec.tsx
git commit -m "feat(fleet): add shared FleetToolbar filter row"
```

---

## Task 4: SpokeHealthTable + FailureHeatmap

**Files:**
- Create: `src/components/pipelines-overview/fleet/SpokeHealthTable.tsx`
- Create: `src/components/pipelines-overview/fleet/FailureHeatmap.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/SpokeHealthTable.spec.tsx`

**Interfaces:**
- Consumes: `SpokeMetrics`, `formatBuildTime` from `../../__demo__/mock-fleet-data`; `SeriesGroup` for heatmap input is NOT used — heatmap consumes `SpokeMetrics[]`.
- Produces:
  - `SpokeHealthTable`: `FC<{ metrics: SpokeMetrics[] }>`
  - `FailureHeatmap`: `FC<{ metrics: SpokeMetrics[] }>`

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/SpokeHealthTable.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import SpokeHealthTable from '../SpokeHealthTable';
import { getSpokeMetrics, ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));

describe('SpokeHealthTable', () => {
  it('renders a row per spoke with region', () => {
    render(<SpokeHealthTable metrics={getSpokeMetrics(ALL_SPOKES)} />);
    expect(screen.getByText('Spoke fleet health')).toBeTruthy();
    expect(screen.getByText('us-east-1')).toBeTruthy();
    expect(screen.getByText('ap-southeast-1')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/SpokeHealthTable.spec.tsx`
Expected: FAIL — cannot find module `../SpokeHealthTable`.

- [ ] **Step 3: Write the implementations**

Create `src/components/pipelines-overview/fleet/SpokeHealthTable.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { ClusterBadge } from '../../cluster';
import {
  SpokeMetrics,
  formatBuildTime,
} from '../../__demo__/mock-fleet-data';

interface SpokeHealthTableProps {
  metrics: SpokeMetrics[];
}

const statusLabel: Record<SpokeMetrics['status'], string> = {
  healthy: 'Ready',
  warning: 'Warning',
  critical: 'Degraded',
};

const SpokeHealthTable: FC<SpokeHealthTableProps> = ({ metrics }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Card className="card-border">
      <CardTitle>{t('Spoke fleet health')}</CardTitle>
      <CardBody>
        <Table variant="compact" aria-label={t('Spoke fleet health')}>
          <Thead>
            <Tr>
              <Th>{t('Spoke cluster')}</Th>
              <Th>{t('Status')}</Th>
              <Th>{t('Dispatched')}</Th>
              <Th>{t('Success rate')}</Th>
              <Th>{t('Avg build')}</Th>
              <Th>{t('P95 build')}</Th>
              <Th>{t('CPU util')}</Th>
              <Th>{t('Memory util')}</Th>
              <Th>{t('Kueue queue')}</Th>
              <Th>{t('Region')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {metrics.map((m) => (
              <Tr key={m.name}>
                <Td dataLabel={t('Spoke cluster')}>
                  <ClusterBadge clusterName={m.name} clusterType="spoke" />
                </Td>
                <Td dataLabel={t('Status')}>{statusLabel[m.status]}</Td>
                <Td dataLabel={t('Dispatched')}>{m.dispatched.toLocaleString()}</Td>
                <Td dataLabel={t('Success rate')}>{m.successRate}%</Td>
                <Td dataLabel={t('Avg build')}>{formatBuildTime(m.avgBuildSec)}</Td>
                <Td dataLabel={t('P95 build')}>{formatBuildTime(m.p95BuildSec)}</Td>
                <Td dataLabel={t('CPU util')}>{m.cpuUtil}%</Td>
                <Td dataLabel={t('Memory util')}>{m.memUtil}%</Td>
                <Td dataLabel={t('Kueue queue')}>{m.queueDepth}</Td>
                <Td dataLabel={t('Region')}>{m.region}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default SpokeHealthTable;
```

Create `src/components/pipelines-overview/fleet/FailureHeatmap.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { SpokeMetrics } from '../../__demo__/mock-fleet-data';

interface FailureHeatmapProps {
  metrics: SpokeMetrics[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const cellColor = (value: number, max: number): string => {
  if (max === 0 || value === 0)
    return 'var(--pf-t--global--background--color--secondary--default)';
  const intensity = Math.min(1, value / max);
  // blend toward danger red by opacity
  return `rgba(201, 25, 11, ${0.15 + intensity * 0.85})`;
};

const FailureHeatmap: FC<FailureHeatmapProps> = ({ metrics }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const max = Math.max(
    1,
    ...metrics.flatMap((m) => m.failureDensity),
  );
  return (
    <Card className="card-border">
      <CardTitle>{t('Failure density by spoke')}</CardTitle>
      <CardBody>
        <div
          className="opp-fleet-heatmap"
          style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}
        >
          <span />
          {DAYS.map((d) => (
            <span key={d} className="opp-fleet-heatmap__collabel">
              {d}
            </span>
          ))}
          {metrics.map((m) => (
            <>
              <span key={`${m.name}-label`} className="opp-fleet-heatmap__rowlabel">
                {m.name}
              </span>
              {m.failureDensity.map((v, i) => (
                <div
                  key={`${m.name}-${i}`}
                  className="opp-fleet-heatmap__cell"
                  title={`${m.name} ${DAYS[i]}: ${v}`}
                  style={{ backgroundColor: cellColor(v, max) }}
                />
              ))}
            </>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default FailureHeatmap;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/SpokeHealthTable.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/SpokeHealthTable.tsx src/components/pipelines-overview/fleet/FailureHeatmap.tsx src/components/pipelines-overview/fleet/__tests__/SpokeHealthTable.spec.tsx
git commit -m "feat(fleet): add SpokeHealthTable and FailureHeatmap"
```

---

## Task 5: FleetOverviewTab

**Files:**
- Create: `src/components/pipelines-overview/fleet/FleetOverviewTab.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/FleetOverviewTab.spec.tsx`

**Interfaces:**
- Consumes: `FleetFilterState` from `./types`; `FleetStatCard`, `SpokeHealthTable`, `FailureHeatmap`; accessors `getFleetKpis`, `getSpokeMetrics`, `getSuccessRateTrend`, `getQueueDepthTrend`, `getTopFailureReasons`, `getDispatchThroughput` from mock data; charts from `@patternfly/react-charts/victory`.
- Produces: `FleetOverviewTab`: `FC<{ filter: FleetFilterState }>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/FleetOverviewTab.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import FleetOverviewTab from '../FleetOverviewTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />,
  ChartAxis: () => <div />,
  ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>,
  ChartStack: ({ children }: any) => <div>{children}</div>,
  ChartLine: () => <div />,
  ChartVoronoiContainer: () => <div />,
  ChartLegend: () => <div />,
  ChartThemeColor: { multiOrdered: 'multiOrdered', blue: 'blue' },
}));

describe('FleetOverviewTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };

  it('renders the fleet KPIs and health table', () => {
    render(<FleetOverviewTab filter={filter} />);
    expect(screen.getByText('Fleet success rate')).toBeTruthy();
    expect(screen.getByText('12,847')).toBeTruthy();
    expect(screen.getByText('Spoke fleet health')).toBeTruthy();
  });

  it('shows an empty state when no spokes selected', () => {
    render(<FleetOverviewTab filter={{ ...filter, selectedSpokes: [] }} />);
    expect(screen.getByText('No spoke clusters selected')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetOverviewTab.spec.tsx`
Expected: FAIL — cannot find module `../FleetOverviewTab`.

- [ ] **Step 3: Write the implementation**

Create `src/components/pipelines-overview/fleet/FleetOverviewTab.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartStack,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import FleetStatCard from './FleetStatCard';
import SpokeHealthTable from './SpokeHealthTable';
import FailureHeatmap from './FailureHeatmap';
import type { FleetFilterState } from './types';
import {
  getDispatchThroughput,
  getFleetKpis,
  getQueueDepthTrend,
  getSpokeMetrics,
  getSuccessRateTrend,
  getTopFailureReasons,
} from '../../__demo__/mock-fleet-data';

interface FleetOverviewTabProps {
  filter: FleetFilterState;
}

const ChartCard: FC<{ title: string; children: React.ReactNode }> = ({
  title,
  children,
}) => (
  <Card className="card-border" isFullHeight>
    <CardTitle>{title}</CardTitle>
    <CardBody>{children}</CardBody>
  </Card>
);

const FleetOverviewTab: FC<FleetOverviewTabProps> = ({ filter }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { selectedSpokes } = filter;

  if (selectedSpokes.length === 0) {
    return (
      <EmptyState titleText={t('No spoke clusters selected')} headingLevel="h4">
        <EmptyStateBody>
          {t('Select at least one spoke cluster to view fleet metrics.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  const kpis = getFleetKpis(selectedSpokes);
  const metrics = getSpokeMetrics(selectedSpokes);
  const successTrend = getSuccessRateTrend(selectedSpokes);
  const queueTrend = getQueueDepthTrend(selectedSpokes);
  const failureReasons = getTopFailureReasons(selectedSpokes);
  const throughput = getDispatchThroughput(selectedSpokes);
  const hasEdgeIssue = selectedSpokes.includes('spoke-edge');

  return (
    <>
      {hasEdgeIssue && (
        <Alert
          variant="warning"
          isInline
          title={t(
            'MultiKueue bottleneck detected on spoke-edge: CPU 91%, 23 pending PipelineRuns.',
          )}
          className="pf-v6-u-mb-md"
        />
      )}

      <Gallery hasGutter minWidths={{ default: '220px' }} className="pf-v6-u-mb-md">
        <FleetStatCard
          label={t('Fleet success rate')}
          value={`${kpis.successRate}%`}
          delta={`+${kpis.successRateDelta}%`}
          deltaVariant="up"
          spark={kpis.sparkSuccess}
        />
        <FleetStatCard
          label={t('Avg build time (P50)')}
          value={kpis.avgBuildLabel}
          spark={kpis.sparkBuild}
        />
        <FleetStatCard
          label={t('Dispatched PipelineRuns')}
          value={kpis.dispatchedTotal.toLocaleString()}
          delta={`+${kpis.dispatchedDelta}%`}
          deltaVariant="up"
          spark={kpis.sparkDispatched}
        />
        <FleetStatCard
          label={t('Active spoke clusters')}
          value={`${kpis.activeSpokes}`}
        />
      </Gallery>

      <Grid hasGutter className="pf-v6-u-mb-md">
        <GridItem md={6}>
          <ChartCard title={t('Success rate trend by spoke')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup>
                {successTrend.map((s) => (
                  <ChartLine key={s.name} data={s.data} name={s.name} />
                ))}
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={6}>
          <ChartCard title={t('Build time by spoke cluster (P50 / P95)')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 60, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              domainPadding={{ x: [20, 20] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup offset={11}>
                <ChartBar
                  data={metrics.map((m) => ({ x: m.name, y: m.avgBuildSec }))}
                />
                <ChartBar
                  data={metrics.map((m) => ({ x: m.name, y: m.p95BuildSec }))}
                />
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={6}>
          <ChartCard title={t('Spoke resource utilization')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 60, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              domainPadding={{ x: [20, 20] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup offset={11}>
                <ChartBar data={metrics.map((m) => ({ x: m.name, y: m.cpuUtil }))} />
                <ChartBar data={metrics.map((m) => ({ x: m.name, y: m.memUtil }))} />
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={6}>
          <FailureHeatmap metrics={metrics} />
        </GridItem>
      </Grid>

      <div className="pf-v6-u-mb-md">
        <SpokeHealthTable metrics={metrics} />
      </div>

      <Grid hasGutter>
        <GridItem md={4}>
          <ChartCard title={t('Top failure reasons (fleet-wide)')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 140, right: 20 }}
              themeColor={ChartThemeColor.blue}
              horizontal
              domainPadding={{ x: [10, 10] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartBar
                data={failureReasons.map((f) => ({ x: f.reason, y: f.count }))}
              />
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={4}>
          <ChartCard title={t('Hub dispatch throughput')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              domainPadding={{ x: [20, 20] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartStack>
                <ChartBar
                  data={throughput.map((p) => ({ x: p.x, y: p.succeeded }))}
                />
                <ChartBar data={throughput.map((p) => ({ x: p.x, y: p.failed }))} />
              </ChartStack>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={4}>
          <ChartCard title={t('MultiKueue queue depth by spoke')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup>
                {queueTrend.map((s) => (
                  <ChartLine key={s.name} data={s.data} name={s.name} />
                ))}
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
      </Grid>
    </>
  );
};

export default FleetOverviewTab;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetOverviewTab.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/FleetOverviewTab.tsx src/components/pipelines-overview/fleet/__tests__/FleetOverviewTab.spec.tsx
git commit -m "feat(fleet): add Overview tab"
```

---

## Task 6: BuildTimesTab + ResourceUtilizationTab

**Files:**
- Create: `src/components/pipelines-overview/fleet/BuildTimesTab.tsx`
- Create: `src/components/pipelines-overview/fleet/ResourceUtilizationTab.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/BuildTimesTab.spec.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/ResourceUtilizationTab.spec.tsx`

**Interfaces:**
- Consumes: `FleetFilterState`; `FleetStatCard`; accessors `getBuildTimeStats`, `getBuildTimeTrend`, `getSlowestPipelines`, `getResourceStats`, `getCpuTrend`, `getSpokeMetrics`; charts.
- Produces:
  - `BuildTimesTab`: `FC<{ filter: FleetFilterState }>`
  - `ResourceUtilizationTab`: `FC<{ filter: FleetFilterState }>`

- [ ] **Step 1: Write the failing tests**

Create `src/components/pipelines-overview/fleet/__tests__/BuildTimesTab.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import BuildTimesTab from '../BuildTimesTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />, ChartAxis: () => <div />, ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>, ChartLine: () => <div />,
  ChartVoronoiContainer: () => <div />, ChartThemeColor: { blue: 'blue' },
}));

describe('BuildTimesTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };
  it('renders build-time KPIs and slowest pipelines table', () => {
    render(<BuildTimesTab filter={filter} />);
    expect(screen.getByText('Timed out runs')).toBeTruthy();
    expect(screen.getByText('134')).toBeTruthy();
    expect(screen.getByText('Slowest pipelines (fleet-wide)')).toBeTruthy();
  });
  it('shows empty state with no spokes', () => {
    render(<BuildTimesTab filter={{ ...filter, selectedSpokes: [] }} />);
    expect(screen.getByText('No spoke clusters selected')).toBeTruthy();
  });
});
```

Create `src/components/pipelines-overview/fleet/__tests__/ResourceUtilizationTab.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import ResourceUtilizationTab from '../ResourceUtilizationTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />, ChartAxis: () => <div />, ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>, ChartLine: () => <div />,
  ChartVoronoiContainer: () => <div />, ChartThemeColor: { blue: 'blue' },
}));

describe('ResourceUtilizationTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };
  it('renders resource KPIs and node pool table', () => {
    render(<ResourceUtilizationTab filter={filter} />);
    expect(screen.getByText('Total vCPUs allocated')).toBeTruthy();
    expect(screen.getByText('384')).toBeTruthy();
    expect(screen.getByText('Node pool capacity')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/BuildTimesTab.spec.tsx src/components/pipelines-overview/fleet/__tests__/ResourceUtilizationTab.spec.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Write the implementations**

Create `src/components/pipelines-overview/fleet/BuildTimesTab.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Chart,
  ChartAxis,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import FleetStatCard from './FleetStatCard';
import type { FleetFilterState } from './types';
import {
  getBuildTimeStats,
  getBuildTimeTrend,
  getSlowestPipelines,
} from '../../__demo__/mock-fleet-data';

interface BuildTimesTabProps {
  filter: FleetFilterState;
}

const BuildTimesTab: FC<BuildTimesTabProps> = ({ filter }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { selectedSpokes } = filter;

  if (selectedSpokes.length === 0) {
    return (
      <EmptyState titleText={t('No spoke clusters selected')} headingLevel="h4">
        <EmptyStateBody>
          {t('Select at least one spoke cluster to view fleet metrics.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  const stats = getBuildTimeStats(selectedSpokes);
  const trend = getBuildTimeTrend(selectedSpokes);
  const slowest = getSlowestPipelines(selectedSpokes);

  return (
    <>
      <Gallery hasGutter minWidths={{ default: '220px' }} className="pf-v6-u-mb-md">
        <FleetStatCard label={t('Fleet P50')} value={stats.p50Label} />
        <FleetStatCard label={t('Fleet P95')} value={stats.p95Label} />
        <FleetStatCard label={t('Fleet P99')} value={stats.p99Label} />
        <FleetStatCard
          label={t('Timed out runs')}
          value={`${stats.timedOut}`}
          valueClassName="opp-fleet-value--danger"
        />
      </Gallery>

      <Grid hasGutter>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('P50 build time trend')}</CardTitle>
            <CardBody>
              <Chart
                height={240}
                padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
                themeColor={ChartThemeColor.blue}
                containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
              >
                <ChartAxis />
                <ChartAxis dependentAxis />
                <ChartLine data={trend} />
              </Chart>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('Slowest pipelines (fleet-wide)')}</CardTitle>
            <CardBody>
              <Table variant="compact" aria-label={t('Slowest pipelines (fleet-wide)')}>
                <Thead>
                  <Tr>
                    <Th>{t('Pipeline')}</Th>
                    <Th>{t('Spoke')}</Th>
                    <Th>{t('P50')}</Th>
                    <Th>{t('P95')}</Th>
                    <Th>{t('Runs')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {slowest.map((r) => (
                    <Tr key={`${r.pipeline}-${r.spoke}`}>
                      <Td dataLabel={t('Pipeline')}>{r.pipeline}</Td>
                      <Td dataLabel={t('Spoke')}>{r.spoke}</Td>
                      <Td dataLabel={t('P50')}>{r.p50}</Td>
                      <Td dataLabel={t('P95')}>{r.p95}</Td>
                      <Td dataLabel={t('Runs')}>{r.runs}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </>
  );
};

export default BuildTimesTab;
```

Create `src/components/pipelines-overview/fleet/ResourceUtilizationTab.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Grid,
  GridItem,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Chart,
  ChartAxis,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import { ResourceMeter } from '../../cluster';
import FleetStatCard from './FleetStatCard';
import type { FleetFilterState } from './types';
import {
  getCpuTrend,
  getResourceStats,
  getSpokeMetrics,
  SpokeMetrics,
} from '../../__demo__/mock-fleet-data';

interface ResourceUtilizationTabProps {
  filter: FleetFilterState;
}

const headroomColor: Record<
  SpokeMetrics['headroom'],
  'green' | 'blue' | 'orange' | 'red'
> = {
  Comfortable: 'green',
  Underutilized: 'blue',
  Tight: 'orange',
  Critical: 'red',
};

const ResourceUtilizationTab: FC<ResourceUtilizationTabProps> = ({ filter }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { selectedSpokes } = filter;

  if (selectedSpokes.length === 0) {
    return (
      <EmptyState titleText={t('No spoke clusters selected')} headingLevel="h4">
        <EmptyStateBody>
          {t('Select at least one spoke cluster to view fleet metrics.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  const stats = getResourceStats(selectedSpokes);
  const cpuTrend = getCpuTrend(selectedSpokes);
  const metrics = getSpokeMetrics(selectedSpokes);

  return (
    <>
      <Gallery hasGutter minWidths={{ default: '220px' }} className="pf-v6-u-mb-md">
        <FleetStatCard label={t('Fleet avg CPU')} value={`${stats.avgCpu}%`} />
        <FleetStatCard label={t('Fleet avg memory')} value={`${stats.avgMem}%`} />
        <FleetStatCard
          label={t('Total vCPUs allocated')}
          value={`${stats.totalVcpus}`}
        />
        <FleetStatCard
          label={t('Total memory allocated')}
          value={`${stats.totalMemoryGi} Gi`}
        />
      </Gallery>

      <Grid hasGutter>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('CPU utilization trend')}</CardTitle>
            <CardBody>
              <Chart
                height={240}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                themeColor={ChartThemeColor.multiOrdered}
                containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
              >
                <ChartAxis />
                <ChartAxis dependentAxis />
                {cpuTrend.map((s) => (
                  <ChartLine key={s.name} data={s.data} name={s.name} />
                ))}
              </Chart>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('Node pool capacity')}</CardTitle>
            <CardBody>
              <Table variant="compact" aria-label={t('Node pool capacity')}>
                <Thead>
                  <Tr>
                    <Th>{t('Spoke')}</Th>
                    <Th>{t('Worker nodes')}</Th>
                    <Th>{t('vCPUs')}</Th>
                    <Th>{t('Memory')}</Th>
                    <Th>{t('CPU util')}</Th>
                    <Th>{t('Mem util')}</Th>
                    <Th>{t('Headroom')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {metrics.map((m) => (
                    <Tr key={m.name}>
                      <Td dataLabel={t('Spoke')}>{m.name}</Td>
                      <Td dataLabel={t('Worker nodes')}>{m.workerNodes}</Td>
                      <Td dataLabel={t('vCPUs')}>{m.vcpus}</Td>
                      <Td dataLabel={t('Memory')}>{m.memoryGi} Gi</Td>
                      <Td dataLabel={t('CPU util')}>
                        <ResourceMeter label={t('CPU')} value={m.cpuUtil} />
                      </Td>
                      <Td dataLabel={t('Mem util')}>
                        <ResourceMeter label={t('Memory')} value={m.memUtil} />
                      </Td>
                      <Td dataLabel={t('Headroom')}>
                        <Label color={headroomColor[m.headroom]}>
                          {t(m.headroom)}
                        </Label>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </>
  );
};

export default ResourceUtilizationTab;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/BuildTimesTab.spec.tsx src/components/pipelines-overview/fleet/__tests__/ResourceUtilizationTab.spec.tsx`
Expected: PASS. If `ResourceMeter` prop names differ, check `src/components/cluster/ResourceMeter.tsx` — pass `label` and `value` per its `ResourceMeterProps`.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/BuildTimesTab.tsx src/components/pipelines-overview/fleet/ResourceUtilizationTab.tsx src/components/pipelines-overview/fleet/__tests__/BuildTimesTab.spec.tsx src/components/pipelines-overview/fleet/__tests__/ResourceUtilizationTab.spec.tsx
git commit -m "feat(fleet): add Build Times and Resource Utilization tabs"
```

---

## Task 7: SpokeComparisonTab

**Files:**
- Create: `src/components/pipelines-overview/fleet/SpokeComparisonTab.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/SpokeComparisonTab.spec.tsx`

**Interfaces:**
- Consumes: `FleetFilterState`; `getSpokeMetrics`, `formatBuildTime`, `SpokeMetrics`; `ClusterBadge`.
- Produces: `SpokeComparisonTab`: `FC<{ filter: FleetFilterState }>`.

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/SpokeComparisonTab.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import SpokeComparisonTab from '../SpokeComparisonTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));

describe('SpokeComparisonTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };
  it('renders a card per selected spoke with success rate', () => {
    render(<SpokeComparisonTab filter={filter} />);
    expect(screen.getByText('96.7%')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('ap-southeast-1')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/SpokeComparisonTab.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/pipelines-overview/fleet/SpokeComparisonTab.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Gallery,
} from '@patternfly/react-core';
import classNames from 'classnames';
import { ClusterBadge } from '../../cluster';
import type { FleetFilterState } from './types';
import {
  formatBuildTime,
  getSpokeMetrics,
} from '../../__demo__/mock-fleet-data';

interface SpokeComparisonTabProps {
  filter: FleetFilterState;
}

const Metric: FC<{ label: string; value: string }> = ({ label, value }) => (
  <FlexItem>
    <div className="opp-fleet-stat-card__label">{label}</div>
    <div>{value}</div>
  </FlexItem>
);

const SpokeComparisonTab: FC<SpokeComparisonTabProps> = ({ filter }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { selectedSpokes } = filter;

  if (selectedSpokes.length === 0) {
    return (
      <EmptyState titleText={t('No spoke clusters selected')} headingLevel="h4">
        <EmptyStateBody>
          {t('Select at least one spoke cluster to view fleet metrics.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  const metrics = getSpokeMetrics(selectedSpokes);

  return (
    <Gallery hasGutter minWidths={{ default: '320px' }}>
      {metrics.map((m) => (
        <Card
          key={m.name}
          className={classNames('opp-fleet-spoke-card', `opp-fleet-spoke-card--${m.status}`)}
        >
          <CardTitle>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <ClusterBadge clusterName={m.name} clusterType="spoke" />
              </FlexItem>
              <FlexItem>
                <span className="pf-v6-u-color-200">{m.region}</span>
              </FlexItem>
            </Flex>
          </CardTitle>
          <CardBody>
            <Flex
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsLg' }}
            >
              <Metric label={t('Success rate')} value={`${m.successRate}%`} />
              <Metric label={t('Avg build')} value={formatBuildTime(m.avgBuildSec)} />
              <Metric label={t('CPU')} value={`${m.cpuUtil}%`} />
              <Metric label={t('Queue depth')} value={`${m.queueDepth}`} />
              <Metric label={t('Dispatched')} value={m.dispatched.toLocaleString()} />
              <Metric label={t('Memory')} value={`${m.memUtil}%`} />
            </Flex>
          </CardBody>
        </Card>
      ))}
    </Gallery>
  );
};

export default SpokeComparisonTab;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/SpokeComparisonTab.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/SpokeComparisonTab.tsx src/components/pipelines-overview/fleet/__tests__/SpokeComparisonTab.spec.tsx
git commit -m "feat(fleet): add Spoke Comparison tab"
```

---

## Task 8: AlertRow + AlertsTab

**Files:**
- Create: `src/components/pipelines-overview/fleet/AlertRow.tsx`
- Create: `src/components/pipelines-overview/fleet/AlertsTab.tsx`
- Test: `src/components/pipelines-overview/fleet/__tests__/AlertsTab.spec.tsx`

**Interfaces:**
- Consumes: `FleetAlert` from mock data; `getFleetAlerts`, `getAlertSummary`; `FleetStatCard`.
- Produces:
  - `AlertRow`: `FC<{ alert: FleetAlert; onAcknowledge: (id: string) => void; onSilence: (id: string) => void }>`
  - `AlertsTab`: `FC<{ filter: FleetFilterState }>` (filter unused today but kept for signature parity across tabs)

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/AlertsTab.spec.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import AlertsTab from '../AlertsTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

describe('AlertsTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };

  it('renders summary counts and alert rows', () => {
    render(<AlertsTab filter={filter} />);
    expect(screen.getByText('Active alerts')).toBeTruthy();
    expect(screen.getByText(/spoke-edge CPU utilization at 91%/)).toBeTruthy();
  });

  it('acknowledging removes a row from active list', () => {
    render(<AlertsTab filter={filter} />);
    const ackButtons = screen.getAllByRole('button', { name: /Acknowledge/i });
    fireEvent.click(ackButtons[0]);
    // first critical alert acknowledged -> its Acknowledge button is gone from that row
    expect(screen.getAllByRole('button', { name: /Acknowledge/i }).length).toBeLessThan(
      ackButtons.length,
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/AlertsTab.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementations**

Create `src/components/pipelines-overview/fleet/AlertRow.tsx`:

```tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import {
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import type { FleetAlert } from '../../__demo__/mock-fleet-data';

interface AlertRowProps {
  alert: FleetAlert;
  onAcknowledge: (id: string) => void;
  onSilence: (id: string) => void;
}

const AlertRow: FC<AlertRowProps> = ({ alert, onAcknowledge, onSilence }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const Icon =
    alert.severity === 'critical'
      ? ExclamationCircleIcon
      : ExclamationTriangleIcon;
  const iconColor =
    alert.severity === 'critical'
      ? 'var(--pf-t--global--color--status--danger--default)'
      : 'var(--pf-t--global--color--status--warning--default)';

  return (
    <Card className={classNames('opp-fleet-alert', `opp-fleet-alert--${alert.severity}`)}>
      <CardBody>
        <Split hasGutter>
          <SplitItem>
            <Icon style={{ color: iconColor }} />
          </SplitItem>
          <SplitItem isFilled>
            <div className="pf-v6-u-font-weight-bold">{alert.title}</div>
            <div className="pf-v6-u-color-200 pf-v6-u-mb-sm">
              {alert.description}
            </div>
            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
              <FlexItem>
                <span className="pf-v6-u-color-200">
                  {t('Fired')}: {alert.firedAt}
                </span>
              </FlexItem>
              <FlexItem>
                <span className="pf-v6-u-color-200">
                  {t('Duration')}: {alert.duration}
                </span>
              </FlexItem>
              <FlexItem>
                <span className="pf-v6-u-color-200">
                  {t('Source')}: {alert.source}
                </span>
              </FlexItem>
            </Flex>
          </SplitItem>
          {alert.state === 'active' && (
            <SplitItem>
              <Button
                variant="secondary"
                className="pf-v6-u-mr-sm"
                onClick={() => onAcknowledge(alert.id)}
              >
                {t('Acknowledge')}
              </Button>
              <Button variant="secondary" onClick={() => onSilence(alert.id)}>
                {t('Silence')}
              </Button>
            </SplitItem>
          )}
        </Split>
      </CardBody>
    </Card>
  );
};

export default AlertRow;
```

Create `src/components/pipelines-overview/fleet/AlertsTab.tsx`:

```tsx
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gallery } from '@patternfly/react-core';
import FleetStatCard from './FleetStatCard';
import AlertRow from './AlertRow';
import type { FleetFilterState } from './types';
import {
  getAlertSummary,
  getFleetAlerts,
  FleetAlert,
} from '../../__demo__/mock-fleet-data';

interface AlertsTabProps {
  filter: FleetFilterState;
}

const AlertsTab: FC<AlertsTabProps> = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const summary = getAlertSummary();
  const [alerts, setAlerts] = useState<FleetAlert[]>(getFleetAlerts());
  const [silenced, setSilenced] = useState<string[]>([]);

  const acknowledge = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, state: 'acknowledged' } : a)),
    );
  const silence = (id: string) => setSilenced((prev) => [...prev, id]);

  const visible = alerts.filter((a) => !silenced.includes(a.id));
  const activeCount = visible.filter((a) => a.state === 'active').length;
  const ackCount = visible.filter((a) => a.state === 'acknowledged').length;

  return (
    <>
      <Gallery hasGutter minWidths={{ default: '260px' }} className="pf-v6-u-mb-md">
        <FleetStatCard
          label={t('Active alerts')}
          value={`${activeCount}`}
          valueClassName="opp-fleet-value--danger"
        />
        <FleetStatCard
          label={t('Acknowledged')}
          value={`${ackCount}`}
          valueClassName="opp-fleet-value--warning"
        />
        <FleetStatCard
          label={t('Resolved (last 7d)')}
          value={`${summary.resolved}`}
          valueClassName="opp-fleet-value--success"
        />
      </Gallery>

      {visible.map((a) => (
        <AlertRow
          key={a.id}
          alert={a}
          onAcknowledge={acknowledge}
          onSilence={silence}
        />
      ))}
    </>
  );
};

export default AlertsTab;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/AlertsTab.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-overview/fleet/AlertRow.tsx src/components/pipelines-overview/fleet/AlertsTab.tsx src/components/pipelines-overview/fleet/__tests__/AlertsTab.spec.tsx
git commit -m "feat(fleet): add Alerts tab with acknowledge/silence"
```

---

## Task 9: FleetDashboard container + repurpose the Overview page

**Files:**
- Create: `src/components/pipelines-overview/fleet/FleetDashboard.tsx`
- Create: `src/components/pipelines-overview/fleet/__tests__/FleetDashboard.spec.tsx`
- Modify: `src/components/pipelines-overview/PipelinesOverviewPage.tsx`

**Interfaces:**
- Consumes: all five tab components; `FleetToolbar`; `ALL_SPOKES` from mock data; `FleetFilterState`.
- Produces: `FleetDashboard`: `FC` (no props) — self-contained tabbed page. `PipelinesOverviewPage` default export renders `<FleetDashboard />`.

- [ ] **Step 1: Write the failing test**

Create `src/components/pipelines-overview/fleet/__tests__/FleetDashboard.spec.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import FleetDashboard from '../FleetDashboard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />, ChartAxis: () => <div />, ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>,
  ChartStack: ({ children }: any) => <div>{children}</div>,
  ChartLine: () => <div />, ChartVoronoiContainer: () => <div />,
  ChartLegend: () => <div />, ChartThemeColor: { multiOrdered: 'm', blue: 'blue' },
}));

describe('FleetDashboard', () => {
  it('renders the Fleet Dashboard title and Overview tab by default', () => {
    render(<FleetDashboard />);
    expect(screen.getByText('Fleet Dashboard')).toBeTruthy();
    expect(screen.getByText('Spoke fleet health')).toBeTruthy();
  });

  it('switches to the Alerts tab', () => {
    render(<FleetDashboard />);
    fireEvent.click(screen.getByRole('tab', { name: /Alerts/i }));
    expect(screen.getByText('Active alerts')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetDashboard.spec.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

Create `src/components/pipelines-overview/fleet/FleetDashboard.tsx`:

```tsx
import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageSection,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import FleetToolbar from './FleetToolbar';
import FleetOverviewTab from './FleetOverviewTab';
import BuildTimesTab from './BuildTimesTab';
import ResourceUtilizationTab from './ResourceUtilizationTab';
import SpokeComparisonTab from './SpokeComparisonTab';
import AlertsTab from './AlertsTab';
import type { FleetFilterState } from './types';
import { ALL_SPOKES } from '../../__demo__/mock-fleet-data';

import './fleet.scss';

const FleetDashboard: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [filter, setFilter] = useState<FleetFilterState>({
    selectedSpokes: [...ALL_SPOKES],
    timeRange: 'Last 30 days',
    search: '',
  });

  const renderTab = () => {
    switch (activeTab) {
      case 1:
        return <BuildTimesTab filter={filter} />;
      case 2:
        return <ResourceUtilizationTab filter={filter} />;
      case 3:
        return <SpokeComparisonTab filter={filter} />;
      case 4:
        return <AlertsTab filter={filter} />;
      default:
        return <FleetOverviewTab filter={filter} />;
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false} className="pf-v6-u-pl-md pf-v6-u-pb-0">
        <Title headingLevel="h1">{t('Fleet Dashboard')}</Title>
      </PageSection>
      <PageSection hasBodyWrapper={false} className="pf-v6-u-p-0 pf-v6-u-pl-md">
        <Tabs
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(Number(key))}
          aria-label={t('Fleet Dashboard tabs')}
        >
          <Tab eventKey={0} title={<TabTitleText>{t('Overview')}</TabTitleText>} />
          <Tab eventKey={1} title={<TabTitleText>{t('Build Times')}</TabTitleText>} />
          <Tab
            eventKey={2}
            title={<TabTitleText>{t('Resource Utilization')}</TabTitleText>}
          />
          <Tab
            eventKey={3}
            title={<TabTitleText>{t('Spoke Comparison')}</TabTitleText>}
          />
          <Tab eventKey={4} title={<TabTitleText>{t('Alerts')}</TabTitleText>} />
        </Tabs>
      </PageSection>
      <div className="pf-v6-u-pl-md pf-v6-u-pr-md">
        <FleetToolbar filter={filter} onChange={setFilter} />
        <div className="pf-v6-u-mt-md">{renderTab()}</div>
      </div>
    </>
  );
};

export default FleetDashboard;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelines-overview/fleet/__tests__/FleetDashboard.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Repurpose the Overview page**

Replace the entire contents of `src/components/pipelines-overview/PipelinesOverviewPage.tsx` with:

```tsx
import type { FC } from 'react';
import FleetDashboard from './fleet/FleetDashboard';

const PipelinesOverviewPage: FC = () => <FleetDashboard />;

export default PipelinesOverviewPage;
```

Note: `PipelinesOverviewPageK8s` and the original single-project cards remain in the directory but are no longer rendered by the Overview route. Leave them in place (no deletion) — they are still exported from `index.ts` and may be referenced by other variants. Do NOT modify `index.ts`.

- [ ] **Step 6: Run the overview test suite to check nothing else broke**

Run: `yarn jest src/components/pipelines-overview`
Expected: PASS (the pre-existing `__tests__/PipelinesOverview.spec.tsx` may reference the old page. If it fails because it asserts the old single-project layout, update that test to assert `screen.getByText('Fleet Dashboard')` instead, since the page now renders the dashboard. Keep the change minimal.)

- [ ] **Step 7: Commit**

```bash
git add src/components/pipelines-overview/fleet/FleetDashboard.tsx src/components/pipelines-overview/fleet/__tests__/FleetDashboard.spec.tsx src/components/pipelines-overview/PipelinesOverviewPage.tsx src/components/pipelines-overview/__tests__/PipelinesOverview.spec.tsx
git commit -m "feat(fleet): render FleetDashboard as the Overview page"
```

---

## Task 10: Remove the Fleet Management perspective

**Files:**
- Modify: `console-extensions.json`
- Modify: `package.json`
- Delete: `src/components/perspective/fleet-management.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing (removal only).

- [ ] **Step 1: Remove the perspective extension**

In `console-extensions.json`, delete the entire `console.perspective` object whose `properties.id` is `fleet-management` (the entry using `$codeRef` values `fleetManagementPerspective.*`). Ensure the surrounding JSON array remains valid (no trailing/leading comma left dangling).

- [ ] **Step 2: Remove the exposed module**

In `package.json`, delete this line from `consolePlugin.exposedModules`:

```json
"fleetManagementPerspective": "./components/perspective/fleet-management.ts",
```

Ensure the preceding line's trailing comma is correct (the object must stay valid JSON — `virtualizationPerspective` should now be the last entry if it followed, or fix commas accordingly).

- [ ] **Step 3: Delete the perspective source**

```bash
git rm src/components/perspective/fleet-management.ts
```

- [ ] **Step 4: Verify JSON validity and build the plugin manifest**

Run: `node -e "require('./console-extensions.json'); require('./package.json'); console.log('JSON OK')"`
Expected: prints `JSON OK`.

Then verify no remaining references:

Run: `grep -rn "fleetManagementPerspective\|fleet-management" src console-extensions.json package.json`
Expected: no matches (empty output). If any remain, remove them.

- [ ] **Step 5: Run the full test suite**

Run: `yarn jest src/components/pipelines-overview src/components/__demo__`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add console-extensions.json package.json
git commit -m "feat(fleet): remove Fleet Management perspective (merged into Overview)"
```

---

## Task 11: Manual verification in the running console

**Files:** none (verification only).

- [ ] **Step 1: Restart the plugin dev server**

The plugin manifest is generated at build start, so `console-extensions.json` / `package.json` changes require a restart. Stop the running `webpack serve` for the plugin and start it again (`yarn dev` in `console-plugin`). Wait for the build to finish and confirm `curl -s localhost:9001/plugin-manifest.json | grep -c fleet-management` returns `0`.

- [ ] **Step 2: Load the console and open Overview**

In the Core platform perspective → Pipelines → **Overview**. Confirm:
- Page H1 reads "Fleet Dashboard".
- Five tabs render: Overview, Build Times, Resource Utilization, Spoke Comparison, Alerts.
- The shared toolbar shows five spoke chips, "Last 30 days", and "Updated 2 min ago".
- Removing a spoke chip updates every tab's data (e.g. dispatched total drops).
- The Fleet Management perspective is gone from the perspective switcher.

- [ ] **Step 3: Report**

Note any visual gaps vs the mockups (`Overview-1.png`…`Overview-6.png`). Small spacing/label tweaks can be follow-ups; functional gaps should be fixed before closing the task.

---

## Self-Review

**Spec coverage:**
- Nav unchanged / content replaced → Task 9 (repurpose page), Task 10 (remove perspective). ✓
- Internal PF `Tabs`, not `console.tab` → Task 9. ✓
- Shared filter toolbar → Task 3, wired in Task 9. ✓
- Mock data in `__demo__/mock-fleet-data.ts` → Task 1. ✓
- Page H1 "Fleet Dashboard" → Task 9. ✓
- Overview tab (banner, 4 KPIs, 4 charts, health table, 3 bottom charts) → Task 5 (+ Tasks 2, 4). ✓
- Build Times tab (4 stats, trend, slowest table) → Task 6. ✓
- Resource Utilization tab (4 stats, trend, node pool table w/ headroom) → Task 6. ✓
- Spoke Comparison tab (5 health-colored cards) → Task 7. ✓
- Alerts tab (3 summary cards, alert rows, ack/silence) → Task 8. ✓
- Reuse ClusterBadge/RoutingPill/ResourceMeter → Tasks 4, 6, 7. ✓
- Empty-state when no spokes → Tasks 5, 6, 7. ✓
- Remove perspective (extension + exposed module + file) → Task 10. ✓
- Tests per module → every task. ✓

**Placeholder scan:** No TBD/TODO; all steps carry real code. ✓

**Type consistency:** `FleetFilterState` (types.ts) used identically across all tabs and toolbar; accessor names in Task 1's "Produces" match the imports in Tasks 5–8; `SpokeMetrics` field names (`avgBuildSec`, `p95BuildSec`, `cpuUtil`, `memUtil`, `queueDepth`, `workerNodes`, `vcpus`, `memoryGi`, `headroom`, `failureDensity`) are consumed with the same names in Tasks 4, 6, 7. `formatBuildTime` used in Tasks 4, 6, 7. ✓

**Known follow-up risks (flag during execution, fix inline if small):**
- Exact PatternFly v6 prop names for `Dropdown`/`MenuToggle`, `Table`, `EmptyState`, `Label` color enums, and `@patternfly/react-charts/victory` exports may need minor adjustment to match the installed versions (`@patternfly/react-core ^6.4.0`, `@patternfly/react-charts ^8.0.0`). Verify against an existing usage (e.g. `PipelineRunsNumbersChart.tsx` for charts, `MultiClusterPipelineRunsTable.tsx` for `@patternfly/react-table`) when a build/type error appears.
- `ResourceMeter` / `ClusterBadge` prop shapes: confirm against `src/components/cluster/ResourceMeter.tsx` and `ClusterBadge.tsx` before first use.
