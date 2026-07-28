import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { useMemo } from 'react';
import { ManagedClusterModel, TektonConfigModel } from '../../models';
import { ClusterInfo, ManagedClusterKind, TektonConfig } from '../../types';
import { useK8sGet } from './use-k8sGet-hook';

const MANAGED_CLUSTER_GVK = getGroupVersionKindForModel(ManagedClusterModel);

const parseManagedClusterStatus = (
  mc: ManagedClusterKind,
): 'Ready' | 'NotReady' | 'Unknown' => {
  const available = mc.status?.conditions?.find(
    (c) => c.type === 'ManagedClusterConditionAvailable',
  );
  if (!available) return 'Unknown';
  return available.status === 'True' ? 'Ready' : 'NotReady';
};

const toClusterInfo = (mc: ManagedClusterKind): ClusterInfo => ({
  name: mc.metadata?.name ?? '',
  status: parseManagedClusterStatus(mc),
  labels: mc.metadata?.labels,
});

export type UseACMAvailabilityResult = {
  isACMAvailable: boolean;
  isHubCluster: boolean;
  managedClusters: ClusterInfo[];
  loaded: boolean;
  error: unknown;
};

export const useACMAvailability = (): UseACMAvailabilityResult => {
  const [managedClusters, mcLoaded, mcError] = useK8sWatchResource<
    ManagedClusterKind[]
  >({
    groupVersionKind: MANAGED_CLUSTER_GVK,
    isList: true,
    namespaced: false,
    optional: true,
  });

  const [tektonConfig, tcLoaded] = useK8sGet<TektonConfig>(
    TektonConfigModel,
    'config',
  );

  const isACMAvailable = mcLoaded && !mcError && Array.isArray(managedClusters);

  const isHubCluster =
    tcLoaded &&
    !tektonConfig?.spec?.scheduler?.['multi-cluster-disabled'] &&
    tektonConfig?.spec?.scheduler?.['multi-cluster-role']?.toLowerCase() ===
      'hub';

  const clusterInfos = useMemo(
    () =>
      isACMAvailable
        ? managedClusters.map(toClusterInfo).filter((c) => c.name)
        : [],
    [isACMAvailable, managedClusters],
  );

  // TODO: remove FORCE_ACM override before merging
  const forceACM = process.env.FORCE_ACM === 'true';
  if (forceACM) {
    return {
      isACMAvailable: true,
      isHubCluster: true,
      managedClusters: [
        { name: 'local-cluster', status: 'Ready' as const },
        { name: 'spoke-east-1', status: 'Ready' as const },
        { name: 'spoke-west-2', status: 'NotReady' as const },
        { name: 'spoke-apac-3', status: 'Ready' as const },
      ],
      loaded: true,
      error: undefined,
    };
  }

  return {
    isACMAvailable: isACMAvailable && isHubCluster,
    isHubCluster: !!isHubCluster,
    managedClusters: clusterInfos,
    loaded: mcLoaded && tcLoaded,
    error: mcError,
  };
};
