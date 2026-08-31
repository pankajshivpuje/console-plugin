export type SchedulingPolicy = 'hub-only' | 'any-spoke' | 'selected-spokes';
export type LocalQueueStatus = 'Ready' | 'Pending' | 'Error';

export interface QueueQuota {
  cpu: { used: number; total: number };
  memoryGi: { used: number; total: number };
}

export interface LocalQueue {
  name: string;
  namespace: string;
  resourceFlavor: string;
  schedulingPolicy: SchedulingPolicy;
  spokeClusterNames: string[];
  status: LocalQueueStatus;
  lastUpdated: string;
  clusterQueue: string;
  quota: QueueQuota;
}

export interface SpokeClusterOption {
  name: string;
  region: string;
}

export type WorkloadStatus = 'Running' | 'Succeeded' | 'Failed' | 'Pending';

export interface Workload {
  pipelineRun: string;
  cluster: string;
  clusterType: 'hub' | 'spoke';
  status: WorkloadStatus;
  started: string;
  duration: string;
}

export const MOCK_LOCAL_QUEUES: LocalQueue[] = [
  {
    name: 'ci-builds-fast',
    namespace: 'cicd-platform',
    resourceFlavor: 'default',
    schedulingPolicy: 'any-spoke',
    spokeClusterNames: [],
    status: 'Ready',
    lastUpdated: '2 hours ago',
    clusterQueue: 'fleet-shared-cq',
    quota: { cpu: { used: 18, total: 32 }, memoryGi: { used: 44, total: 128 } },
  },
  {
    name: 'release-pipeline-queue',
    namespace: 'release-eng',
    resourceFlavor: 'high-memory',
    schedulingPolicy: 'hub-only',
    spokeClusterNames: [],
    status: 'Ready',
    lastUpdated: 'Yesterday',
    clusterQueue: 'release-cq',
    quota: { cpu: { used: 6, total: 16 }, memoryGi: { used: 96, total: 256 } },
  },
  {
    name: 'gpu-ml-validation',
    namespace: 'team-alpha',
    resourceFlavor: 'gpu-enabled',
    schedulingPolicy: 'selected-spokes',
    spokeClusterNames: ['spoke-east-gpu-01', 'spoke-west-gpu-02'],
    status: 'Ready',
    lastUpdated: '3 days ago',
    clusterQueue: 'gpu-cq',
    quota: { cpu: { used: 28, total: 32 }, memoryGi: { used: 180, total: 192 } },
  },
  {
    name: 'nightly-integration',
    namespace: 'pipelines-infra',
    resourceFlavor: 'default',
    schedulingPolicy: 'any-spoke',
    spokeClusterNames: [],
    status: 'Pending',
    lastUpdated: '5 minutes ago',
    clusterQueue: 'fleet-shared-cq',
    quota: { cpu: { used: 2, total: 24 }, memoryGi: { used: 8, total: 96 } },
  },
  {
    name: 'arm-builds',
    namespace: 'team-beta',
    resourceFlavor: 'arm64',
    schedulingPolicy: 'selected-spokes',
    spokeClusterNames: ['spoke-arm-central-01'],
    status: 'Ready',
    lastUpdated: '1 day ago',
    clusterQueue: 'arm-cq',
    quota: { cpu: { used: 12, total: 16 }, memoryGi: { used: 20, total: 64 } },
  },
  {
    name: 'security-scans',
    namespace: 'cicd-platform',
    resourceFlavor: 'default',
    schedulingPolicy: 'hub-only',
    spokeClusterNames: [],
    status: 'Error',
    lastUpdated: '30 minutes ago',
    clusterQueue: 'fleet-shared-cq',
    quota: { cpu: { used: 0, total: 8 }, memoryGi: { used: 0, total: 32 } },
  },
];

// PipelineRuns routed through each LocalQueue (keyed by queue name). Admitted vs.
// pending counts are derived from these entries — not stored separately.
export const MOCK_LOCALQUEUE_WORKLOADS: Record<string, Workload[]> = {
  'ci-builds-fast': [
    { pipelineRun: 'ci-builds-fast-run-8842', cluster: 'spoke-east-01', clusterType: 'spoke', status: 'Running', started: '3 minutes ago', duration: '3m 12s' },
    { pipelineRun: 'ci-builds-fast-run-8841', cluster: 'spoke-west-01', clusterType: 'spoke', status: 'Succeeded', started: '28 minutes ago', duration: '4m 47s' },
    { pipelineRun: 'ci-builds-fast-run-8840', cluster: 'spoke-east-01', clusterType: 'spoke', status: 'Succeeded', started: '52 minutes ago', duration: '4m 05s' },
    { pipelineRun: 'ci-builds-fast-run-8839', cluster: 'spoke-apac-01', clusterType: 'spoke', status: 'Pending', started: '1 minute ago', duration: '—' },
  ],
  'release-pipeline-queue': [
    { pipelineRun: 'release-v2.4.0-promote', cluster: 'hub', clusterType: 'hub', status: 'Running', started: '11 minutes ago', duration: '11m 03s' },
    { pipelineRun: 'release-v2.3.9-promote', cluster: 'hub', clusterType: 'hub', status: 'Succeeded', started: 'Yesterday', duration: '18m 22s' },
  ],
  'gpu-ml-validation': [
    { pipelineRun: 'model-eval-resnet-1207', cluster: 'spoke-east-gpu-01', clusterType: 'spoke', status: 'Running', started: '22 minutes ago', duration: '22m 40s' },
    { pipelineRun: 'model-eval-bert-1206', cluster: 'spoke-west-gpu-02', clusterType: 'spoke', status: 'Failed', started: '2 hours ago', duration: '9m 15s' },
    { pipelineRun: 'model-eval-resnet-1205', cluster: 'spoke-east-gpu-01', clusterType: 'spoke', status: 'Succeeded', started: '3 hours ago', duration: '31m 08s' },
    { pipelineRun: 'model-eval-gpt-1204', cluster: 'spoke-west-gpu-02', clusterType: 'spoke', status: 'Pending', started: '6 minutes ago', duration: '—' },
    { pipelineRun: 'model-eval-gpt-1203', cluster: 'spoke-west-gpu-02', clusterType: 'spoke', status: 'Pending', started: '4 minutes ago', duration: '—' },
  ],
  'nightly-integration': [
    { pipelineRun: 'nightly-integration-run-441', cluster: 'spoke-eu-central-01', clusterType: 'spoke', status: 'Pending', started: '5 minutes ago', duration: '—' },
  ],
  'arm-builds': [
    { pipelineRun: 'arm-builds-run-2201', cluster: 'spoke-arm-central-01', clusterType: 'spoke', status: 'Running', started: '7 minutes ago', duration: '7m 30s' },
    { pipelineRun: 'arm-builds-run-2200', cluster: 'spoke-arm-central-01', clusterType: 'spoke', status: 'Succeeded', started: '1 day ago', duration: '12m 51s' },
  ],
  'security-scans': [],
};

export const getLocalQueueWorkloads = (name: string): Workload[] =>
  MOCK_LOCALQUEUE_WORKLOADS[name] ?? [];

export const SPOKE_CLUSTERS: SpokeClusterOption[] = [
  { name: 'spoke-east-01', region: 'us-east-1' },
  { name: 'spoke-east-gpu-01', region: 'us-east-1' },
  { name: 'spoke-west-01', region: 'us-west-2' },
  { name: 'spoke-west-gpu-02', region: 'us-west-2' },
  { name: 'spoke-eu-central-01', region: 'eu-central-1' },
  { name: 'spoke-arm-central-01', region: 'us-central-1' },
  { name: 'spoke-apac-01', region: 'ap-southeast-1' },
];

export const NAMESPACE_OPTIONS: string[] = [
  'cicd-platform',
  'pipelines-infra',
  'team-alpha',
  'team-beta',
  'release-eng',
];

export const RESOURCE_FLAVOR_OPTIONS: string[] = [
  'default',
  'gpu-enabled',
  'arm64',
  'high-memory',
];
