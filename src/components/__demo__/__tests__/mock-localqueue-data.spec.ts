import {
  MOCK_LOCAL_QUEUES,
  SPOKE_CLUSTERS,
  NAMESPACE_OPTIONS,
  RESOURCE_FLAVOR_OPTIONS,
} from '../mock-localqueue-data';

describe('mock-localqueue-data', () => {
  it('provides the six wireframe LocalQueues', () => {
    expect(MOCK_LOCAL_QUEUES).toHaveLength(6);
    expect(MOCK_LOCAL_QUEUES.map((q) => q.name)).toContain('ci-builds-fast');
    expect(MOCK_LOCAL_QUEUES.map((q) => q.name)).toContain('security-scans');
  });

  it('marks security-scans as an Error hub-only queue', () => {
    const q = MOCK_LOCAL_QUEUES.find((lq) => lq.name === 'security-scans');
    expect(q?.status).toBe('Error');
    expect(q?.schedulingPolicy).toBe('hub-only');
  });

  it('gives selected-spokes queues their spoke names', () => {
    const q = MOCK_LOCAL_QUEUES.find((lq) => lq.name === 'gpu-ml-validation');
    expect(q?.schedulingPolicy).toBe('selected-spokes');
    expect(q?.spokeClusterNames).toEqual(['spoke-east-gpu-01', 'spoke-west-gpu-02']);
  });

  it('provides option lists for the create form', () => {
    expect(SPOKE_CLUSTERS.length).toBeGreaterThanOrEqual(7);
    expect(NAMESPACE_OPTIONS).toContain('cicd-platform');
    expect(RESOURCE_FLAVOR_OPTIONS).toEqual(
      expect.arrayContaining(['default', 'gpu-enabled', 'arm64', 'high-memory']),
    );
  });
});
