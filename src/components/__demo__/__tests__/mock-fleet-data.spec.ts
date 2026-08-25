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
