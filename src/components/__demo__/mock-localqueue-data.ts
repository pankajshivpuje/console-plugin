export type SchedulingPolicy = 'hub-only' | 'any-spoke' | 'selected-spokes';
export type LocalQueueStatus = 'Ready' | 'Pending' | 'Error';

export interface LocalQueue {
  name: string;
  namespace: string;
  resourceFlavor: string;
  schedulingPolicy: SchedulingPolicy;
  spokeClusterNames: string[];
  status: LocalQueueStatus;
  lastUpdated: string;
}

export interface SpokeClusterOption {
  name: string;
  region: string;
}

export const MOCK_LOCAL_QUEUES: LocalQueue[] = [
  { name: 'ci-builds-fast', namespace: 'cicd-platform', resourceFlavor: 'default', schedulingPolicy: 'any-spoke', spokeClusterNames: [], status: 'Ready', lastUpdated: '2 hours ago' },
  { name: 'release-pipeline-queue', namespace: 'release-eng', resourceFlavor: 'high-memory', schedulingPolicy: 'hub-only', spokeClusterNames: [], status: 'Ready', lastUpdated: 'Yesterday' },
  { name: 'gpu-ml-validation', namespace: 'team-alpha', resourceFlavor: 'gpu-enabled', schedulingPolicy: 'selected-spokes', spokeClusterNames: ['spoke-east-gpu-01', 'spoke-west-gpu-02'], status: 'Ready', lastUpdated: '3 days ago' },
  { name: 'nightly-integration', namespace: 'pipelines-infra', resourceFlavor: 'default', schedulingPolicy: 'any-spoke', spokeClusterNames: [], status: 'Pending', lastUpdated: '5 minutes ago' },
  { name: 'arm-builds', namespace: 'team-beta', resourceFlavor: 'arm64', schedulingPolicy: 'selected-spokes', spokeClusterNames: ['spoke-arm-central-01'], status: 'Ready', lastUpdated: '1 day ago' },
  { name: 'security-scans', namespace: 'cicd-platform', resourceFlavor: 'default', schedulingPolicy: 'hub-only', spokeClusterNames: [], status: 'Error', lastUpdated: '30 minutes ago' },
];

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
