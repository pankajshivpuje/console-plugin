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
