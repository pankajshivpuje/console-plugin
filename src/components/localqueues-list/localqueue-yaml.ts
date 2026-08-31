import type { LocalQueue } from '../__demo__/mock-localqueue-data';

// Hand-rolled, deterministic YAML serializer for a read-only LocalQueue
// manifest. The project has no runtime YAML dependency (only @types/js-yaml),
// and the shape here is fixed and small, so we render it directly rather than
// pull in a library. Output mirrors a kueue.x-k8s.io/v1beta1 LocalQueue with
// the fleet-specific scheduling metadata carried as annotations.
export const localQueueToYAML = (lq: LocalQueue): string => {
  const lines: string[] = [
    'apiVersion: kueue.x-k8s.io/v1beta1',
    'kind: LocalQueue',
    'metadata:',
    `  name: ${lq.name}`,
    `  namespace: ${lq.namespace}`,
    '  annotations:',
    `    pipelines.openshift.io/scheduling-policy: ${lq.schedulingPolicy}`,
    `    pipelines.openshift.io/resource-flavor: ${lq.resourceFlavor}`,
  ];

  if (lq.spokeClusterNames.length > 0) {
    lines.push(
      `    pipelines.openshift.io/spoke-clusters: ${lq.spokeClusterNames.join(',')}`,
    );
  }

  lines.push(
    'spec:',
    `  clusterQueue: ${lq.clusterQueue}`,
  );

  return `${lines.join('\n')}\n`;
};
