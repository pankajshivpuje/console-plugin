export interface ClusterInfo {
  type: 'hub' | 'spoke';
  region: string;
  regionName: string;
  provider: string;
  ocpVersion: string;
  pipelinesVersion: string;
  status: 'Ready' | 'Degraded';
}

export interface RoutingDecision {
  dispatchedBy: string;
  targetCluster: string;
  reason: string;
  queueWait: string;
  alternatives?: string;
  cpuAtDispatch?: string;
  routeQuality: 'optimal' | 'constrained';
}

export interface ClusterResources {
  cpuPercent: number;
  memoryPercent: number;
  queueUsed: number;
  queueCapacity: number;
  node: string;
  vCPU: number;
  ramGi: number;
}

export interface LogEntry {
  timestamp: string;
  step: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface DispatchTimelineData {
  submitted: string;
  queueDuration: string;
  dispatched: string;
  completed?: string;
}

export interface ClusterQueueInfo {
  name: string;
  flavor: string;
  pending: number;
  active: number;
}

export interface SecretSyncInfo {
  lastSync: string;
  synced: number;
  total: number;
}

export interface PipelineRunClusterData {
  clusterInfo: ClusterInfo;
  routing: RoutingDecision;
  resources: ClusterResources;
  logs: LogEntry[];
  timeline: DispatchTimelineData;
  clusterQueue: ClusterQueueInfo;
  secretSync: SecretSyncInfo;
}

const MOCK_CLUSTER_INFO: Record<string, ClusterInfo> = {
  'hub-central': {
    type: 'hub',
    region: 'local',
    regionName: 'Local',
    provider: 'Bare Metal',
    ocpVersion: '4.17.8',
    pipelinesVersion: '1.18.0',
    status: 'Ready',
  },
  'spoke-prod-east': {
    type: 'spoke',
    region: 'us-east-1',
    regionName: 'N. Virginia',
    provider: 'AWS (ROSA)',
    ocpVersion: '4.17.8',
    pipelinesVersion: '1.18.0',
    status: 'Ready',
  },
  'spoke-prod-west': {
    type: 'spoke',
    region: 'us-west-2',
    regionName: 'Oregon',
    provider: 'AWS (ROSA)',
    ocpVersion: '4.17.6',
    pipelinesVersion: '1.18.0',
    status: 'Ready',
  },
  'spoke-staging': {
    type: 'spoke',
    region: 'eu-west-1',
    regionName: 'Ireland',
    provider: 'AWS (ROSA)',
    ocpVersion: '4.17.8',
    pipelinesVersion: '1.18.0',
    status: 'Ready',
  },
  'spoke-dev': {
    type: 'spoke',
    region: 'us-east-2',
    regionName: 'Ohio',
    provider: 'AWS (ROSA)',
    ocpVersion: '4.17.5',
    pipelinesVersion: '1.17.2',
    status: 'Ready',
  },
  'spoke-edge': {
    type: 'spoke',
    region: 'ap-se-1',
    regionName: 'Singapore',
    provider: 'AWS (ROSA)',
    ocpVersion: '4.17.4',
    pipelinesVersion: '1.17.2',
    status: 'Degraded',
  },
};

const MOCK_PLR_CLUSTER_DATA: Record<
  string,
  Omit<PipelineRunClusterData, 'clusterInfo'> & { clusterName: string }
> = {
  'buildah-deploy-run-7xk2m': {
    clusterName: 'spoke-prod-east',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)',
      targetCluster: 'spoke-prod-east',
      reason: 'Lowest queue depth (2)',
      queueWait: '4s',
      alternatives: 'spoke-prod-west (4), spoke-staging (0)',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 68,
      memoryPercent: 62,
      queueUsed: 2,
      queueCapacity: 15,
      node: 'worker-3.spoke-prod-east.ocp.internal',
      vCPU: 8,
      ramGi: 16,
    },
    logs: [
      {
        timestamp: '12:27:04',
        step: 'fetch-source',
        level: 'info',
        message: 'Cloning https://github.com/org/app.git@main',
      },
      {
        timestamp: '12:27:12',
        step: 'fetch-source',
        level: 'info',
        message: 'Clone complete (8s)',
      },
      {
        timestamp: '12:27:14',
        step: 'build-image',
        level: 'info',
        message: 'Building with Buildah...',
      },
      {
        timestamp: '12:28:02',
        step: 'build-image',
        level: 'info',
        message:
          'Successfully pushed image-registry.openshift-image-registry.svc:5000/gitops-sample/app:v1.4.2',
      },
      {
        timestamp: '12:28:06',
        step: 'gitops-update',
        level: 'info',
        message: 'Patching deployment manifest...',
      },
      {
        timestamp: '12:28:22',
        step: 'gitops-update',
        level: 'info',
        message: 'Commit pushed to gitops repo',
      },
      {
        timestamp: '12:28:26',
        step: '',
        level: 'info',
        message: 'PipelineRun completed successfully',
      },
    ],
    timeline: {
      submitted: '12:27:00',
      queueDuration: '4s',
      dispatched: '12:27:04',
      completed: '12:28:26',
    },
    clusterQueue: {
      name: 'build-workloads',
      flavor: 'x86-medium (4cpu/8gi)',
      pending: 0,
      active: 2,
    },
    secretSync: { lastSync: '2 minutes ago', synced: 12, total: 12 },
  },
  'buildah-deploy-run-9ab3f': {
    clusterName: 'spoke-edge',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)',
      targetCluster: 'spoke-edge',
      reason: 'Only cluster with matching node selector (arch: arm64)',
      queueWait: '2m 14s',
      cpuAtDispatch: '91%',
      routeQuality: 'constrained',
    },
    resources: {
      cpuPercent: 91,
      memoryPercent: 88,
      queueUsed: 23,
      queueCapacity: 25,
      node: 'worker-1.spoke-edge.ocp.internal',
      vCPU: 4,
      ramGi: 8,
    },
    logs: [
      {
        timestamp: '11:32:08',
        step: 'fetch-source',
        level: 'info',
        message: 'Cloning https://github.com/org/app.git@main',
      },
      {
        timestamp: '11:32:16',
        step: 'fetch-source',
        level: 'info',
        message: 'Clone complete (8s)',
      },
      {
        timestamp: '11:32:18',
        step: 'build-image',
        level: 'info',
        message: 'Building with Buildah (arm64)...',
      },
      {
        timestamp: '11:32:34',
        step: 'build-image',
        level: 'error',
        message: 'ERROR: OOMKilled — container exceeded memory limit (512Mi)',
      },
      {
        timestamp: '11:32:34',
        step: 'build-image',
        level: 'error',
        message: 'Step exited with code 137 (SIGKILL)',
      },
      {
        timestamp: '11:32:36',
        step: '',
        level: 'warn',
        message:
          'spoke-edge memory pressure: 88% utilized, 3 OOMKill events in last hour',
      },
      {
        timestamp: '11:32:38',
        step: '',
        level: 'error',
        message: 'PipelineRun failed — build-image task OOMKilled',
      },
    ],
    timeline: {
      submitted: '11:30:00',
      queueDuration: '2m 14s',
      dispatched: '11:32:14',
      completed: '11:32:38',
    },
    clusterQueue: {
      name: 'arm64-workloads',
      flavor: 'arm64-small (2cpu/4gi)',
      pending: 5,
      active: 23,
    },
    secretSync: { lastSync: '8 minutes ago', synced: 10, total: 12 },
  },
  's2i-java-run-c4d8e': {
    clusterName: 'hub-central',
    routing: {
      dispatchedBy: 'Local scheduler (Hub)',
      targetCluster: 'hub-central (local)',
      reason: 'Pipeline annotation: tekton.dev/prefer-local: "true"',
      queueWait: '0s',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 52,
      memoryPercent: 48,
      queueUsed: 3,
      queueCapacity: 20,
      node: 'master-1.hub-central.ocp.internal',
      vCPU: 16,
      ramGi: 32,
    },
    logs: [
      {
        timestamp: '11:00:02',
        step: 'fetch-repo',
        level: 'info',
        message: 'Cloning repository...',
      },
      {
        timestamp: '11:00:10',
        step: 'build',
        level: 'info',
        message: 'Building with S2I...',
      },
      {
        timestamp: '11:10:00',
        step: 'deploy',
        level: 'info',
        message: 'Deploying to OpenShift...',
      },
      {
        timestamp: '11:12:30',
        step: '',
        level: 'info',
        message: 'PipelineRun completed successfully',
      },
    ],
    timeline: {
      submitted: '11:00:00',
      queueDuration: '0s',
      dispatched: '11:00:00',
      completed: '11:12:30',
    },
    clusterQueue: {
      name: 'default-workloads',
      flavor: 'x86-large (8cpu/16gi)',
      pending: 0,
      active: 3,
    },
    secretSync: { lastSync: '1 minute ago', synced: 8, total: 8 },
  },
  'docker-build-push-run-f2g7h': {
    clusterName: 'spoke-staging',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)',
      targetCluster: 'spoke-staging',
      reason: 'Lowest utilization (45% CPU, 38% mem)',
      queueWait: '0s',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 48,
      memoryPercent: 42,
      queueUsed: 1,
      queueCapacity: 25,
      node: 'worker-2.spoke-staging.ocp.internal',
      vCPU: 8,
      ramGi: 16,
    },
    logs: [
      {
        timestamp: '16:45:02',
        step: 'clone',
        level: 'info',
        message: 'Cloning repository...',
      },
      {
        timestamp: '16:45:10',
        step: 'clone',
        level: 'info',
        message: 'Clone complete (8s)',
      },
      {
        timestamp: '16:45:12',
        step: 'build-and-push',
        level: 'info',
        message: 'Building with Kaniko...',
      },
    ],
    timeline: {
      submitted: '16:45:00',
      queueDuration: '0s',
      dispatched: '16:45:00',
    },
    clusterQueue: {
      name: 'build-workloads',
      flavor: 'x86-medium (4cpu/8gi)',
      pending: 0,
      active: 1,
    },
    secretSync: { lastSync: '30 seconds ago', synced: 10, total: 10 },
  },
  'nodejs-deploy-run-j5k8l': {
    clusterName: 'spoke-prod-west',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)',
      targetCluster: 'spoke-prod-west',
      reason: 'Region affinity (us-west-2)',
      queueWait: '2s',
      alternatives: 'spoke-prod-east (2), spoke-staging (0)',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 64,
      memoryPercent: 58,
      queueUsed: 4,
      queueCapacity: 15,
      node: 'worker-1.spoke-prod-west.ocp.internal',
      vCPU: 8,
      ramGi: 16,
    },
    logs: [
      {
        timestamp: '08:00:04',
        step: 'fetch-source',
        level: 'info',
        message: 'Cloning repository...',
      },
      {
        timestamp: '08:00:12',
        step: 'install-deps',
        level: 'info',
        message: 'Running npm install...',
      },
      {
        timestamp: '08:05:00',
        step: 'build-image',
        level: 'info',
        message: 'Building with Buildah...',
      },
      {
        timestamp: '08:15:10',
        step: '',
        level: 'info',
        message: 'PipelineRun completed successfully',
      },
    ],
    timeline: {
      submitted: '08:00:00',
      queueDuration: '2s',
      dispatched: '08:00:02',
      completed: '08:15:10',
    },
    clusterQueue: {
      name: 'build-workloads',
      flavor: 'x86-medium (4cpu/8gi)',
      pending: 1,
      active: 4,
    },
    secretSync: { lastSync: '5 minutes ago', synced: 12, total: 12 },
  },
  'scan-and-deploy-run-m9n1p': {
    clusterName: 'spoke-dev',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)',
      targetCluster: 'spoke-dev',
      reason: 'Namespace affinity (dev-team-*)',
      queueWait: '48s',
      routeQuality: 'constrained',
    },
    resources: {
      cpuPercent: 83,
      memoryPercent: 76,
      queueUsed: 12,
      queueCapacity: 25,
      node: 'worker-2.spoke-dev.ocp.internal',
      vCPU: 8,
      ramGi: 16,
    },
    logs: [
      {
        timestamp: '13:30:04',
        step: 'fetch-source',
        level: 'info',
        message: 'Cloning repository...',
      },
      {
        timestamp: '13:30:12',
        step: 'build-image',
        level: 'info',
        message: 'Building with Buildah...',
      },
      {
        timestamp: '13:39:08',
        step: 'build-image',
        level: 'info',
        message: 'Successfully pushed',
      },
      {
        timestamp: '13:39:10',
        step: 'scan-image',
        level: 'info',
        message: 'Running Trivy scan...',
      },
      {
        timestamp: '13:39:28',
        step: 'scan-image',
        level: 'error',
        message: 'FAIL: 3 critical vulnerabilities found',
      },
      {
        timestamp: '13:45:55',
        step: '',
        level: 'error',
        message: 'PipelineRun failed — scan-image task failed',
      },
    ],
    timeline: {
      submitted: '13:29:12',
      queueDuration: '48s',
      dispatched: '13:30:00',
      completed: '13:45:55',
    },
    clusterQueue: {
      name: 'dev-workloads',
      flavor: 'x86-medium (4cpu/8gi)',
      pending: 3,
      active: 12,
    },
    secretSync: { lastSync: '6 minutes ago', synced: 11, total: 12 },
  },
};

export const getClusterDataForPipelineRun = (
  plrName: string,
): PipelineRunClusterData | undefined => {
  const data = MOCK_PLR_CLUSTER_DATA[plrName];
  if (!data) return undefined;
  const clusterInfo = MOCK_CLUSTER_INFO[data.clusterName];
  if (!clusterInfo) return undefined;
  return { ...data, clusterInfo };
};

export const getAllClusterNames = (): string[] =>
  Object.keys(MOCK_CLUSTER_INFO);
