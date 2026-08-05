import {
  getClusterDataForPipelineRun,
  getAllClusterNames,
} from '../mock-cluster-data';

describe('mock-cluster-data', () => {
  it('returns cluster data for a known PipelineRun', () => {
    const data = getClusterDataForPipelineRun('buildah-deploy-run-7xk2m');
    expect(data).toBeDefined();
    expect(data.clusterInfo.type).toBe('spoke');
    expect(data.routing.targetCluster).toBe('spoke-prod-east');
    expect(data.resources.cpuPercent).toBe(68);
    expect(data.logs.length).toBeGreaterThan(0);
    expect(data.timeline.submitted).toBeDefined();
  });

  it('returns undefined for an unknown PipelineRun', () => {
    expect(getClusterDataForPipelineRun('nonexistent-run')).toBeUndefined();
  });

  it('getAllClusterNames returns all cluster names', () => {
    const names = getAllClusterNames();
    expect(names).toContain('hub-central');
    expect(names).toContain('spoke-prod-east');
    expect(names.length).toBe(6);
  });
});
