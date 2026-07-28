import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunKind } from './pipelineRun';

export type ManagedClusterCondition = {
  type: string;
  status: 'True' | 'False' | 'Unknown';
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
};

export type ManagedClusterKind = K8sResourceCommon & {
  spec?: {
    hubAcceptsClient?: boolean;
    leaseDurationSeconds?: number;
  };
  status?: {
    conditions?: ManagedClusterCondition[];
    capacity?: Record<string, string>;
    version?: {
      kubernetes?: string;
    };
  };
};

export type ClusterInfo = {
  name: string;
  status: 'Ready' | 'NotReady' | 'Unknown';
  labels?: Record<string, string>;
};

export type MultiClusterPipelineRunKind = PipelineRunKind & {
  _clusterName?: string;
};

export type MultiClusterPipelineRunsResponse = {
  clusters: Array<{
    clusterName: string;
    items: PipelineRunKind[];
    error?: string;
  }>;
};

export type ClustersResponse = {
  clusters: Array<{ name: string; status: string }>;
};
