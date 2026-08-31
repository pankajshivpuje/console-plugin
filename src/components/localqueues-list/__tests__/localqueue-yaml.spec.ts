import { localQueueToYAML } from '../localqueue-yaml';
import type { LocalQueue } from '../../__demo__/mock-localqueue-data';

const queue: LocalQueue = {
  name: 'gpu-ml-validation',
  namespace: 'team-alpha',
  resourceFlavor: 'gpu-enabled',
  schedulingPolicy: 'selected-spokes',
  spokeClusterNames: ['spoke-east-gpu-01', 'spoke-west-gpu-02'],
  status: 'Ready',
  lastUpdated: '3 days ago',
  clusterQueue: 'gpu-cq',
  quota: { cpu: { used: 28, total: 32 }, memoryGi: { used: 180, total: 192 } },
};

describe('localQueueToYAML', () => {
  const yaml = localQueueToYAML(queue);

  it('emits the kueue apiVersion and LocalQueue kind', () => {
    expect(yaml).toContain('apiVersion: kueue.x-k8s.io/v1beta1');
    expect(yaml).toContain('kind: LocalQueue');
  });

  it('includes name and namespace metadata', () => {
    expect(yaml).toContain('name: gpu-ml-validation');
    expect(yaml).toContain('namespace: team-alpha');
  });

  it('references the associated clusterQueue in spec', () => {
    expect(yaml).toContain('clusterQueue: gpu-cq');
  });

  it('records the scheduling policy annotation', () => {
    expect(yaml).toContain('pipelines.openshift.io/scheduling-policy: selected-spokes');
  });

  it('lists selected spoke clusters as an annotation', () => {
    expect(yaml).toContain('spoke-east-gpu-01');
    expect(yaml).toContain('spoke-west-gpu-02');
  });

  it('omits the spoke-clusters annotation when there are none', () => {
    const hubOnly: LocalQueue = {
      ...queue,
      schedulingPolicy: 'hub-only',
      spokeClusterNames: [],
    };
    expect(localQueueToYAML(hubOnly)).not.toContain('spoke-clusters');
  });

  it('produces deterministic output for the same input', () => {
    expect(localQueueToYAML(queue)).toBe(localQueueToYAML(queue));
  });
});
