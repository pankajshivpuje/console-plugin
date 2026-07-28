import * as React from 'react';
import { CLUSTER_NAME_ANNOTATION } from '../../consts';
import { MultiClusterPipelineRunKind } from '../../types';
import {
  checkReady,
  getMultiClusterPipelineRuns,
} from '../utils/multi-cluster-api';
// TODO: remove FORCE_ACM mock import before merging
import { mockMultiClusterPipelineRunsResponse } from '../../test-data/multi-cluster-mock-data';

const POLL_INTERVAL = 10000;

type MultiClusterPLRState = {
  data: MultiClusterPipelineRunKind[];
  loaded: boolean;
  error: unknown;
  clusterErrors: Record<string, string>;
  proxyUnavailable: boolean;
};

export type UseMultiClusterPipelineRunsResult = [
  MultiClusterPipelineRunKind[],
  boolean,
  unknown,
  Record<string, string>,
  boolean,
];

export const useMultiClusterPipelineRuns = (
  namespace: string,
  isEnabled: boolean,
): UseMultiClusterPipelineRunsResult => {
  const [state, setState] = React.useState<MultiClusterPLRState>({
    data: [],
    loaded: false,
    error: null,
    clusterErrors: {},
    proxyUnavailable: false,
  });

  const mountedRef = React.useRef(true);
  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const proxyCheckedRef = React.useRef(false);
  const proxyReadyRef = React.useRef(false);

  const fetchPipelineRuns = React.useCallback(async () => {
    if (!namespace) return;

    try {
      const response = await getMultiClusterPipelineRuns(namespace);
      if (!mountedRef.current) return;

      const allPLRs: MultiClusterPipelineRunKind[] = [];
      const errors: Record<string, string> = {};

      for (const cluster of response.clusters) {
        if (cluster.error) {
          errors[cluster.clusterName] = cluster.error;
          continue;
        }
        for (const plr of cluster.items) {
          const annotated: MultiClusterPipelineRunKind = {
            ...plr,
            _clusterName: cluster.clusterName,
            metadata: {
              ...plr.metadata,
              annotations: {
                ...plr.metadata?.annotations,
                [CLUSTER_NAME_ANNOTATION]: cluster.clusterName,
              },
            },
          };
          allPLRs.push(annotated);
        }
      }

      setState({
        data: allPLRs,
        loaded: true,
        error: null,
        clusterErrors: errors,
        proxyUnavailable: false,
      });
    } catch (e) {
      if (mountedRef.current) {
        setState({
          data: [],
          loaded: true,
          error: e,
          clusterErrors: {},
          proxyUnavailable: false,
        });
      }
    }
  }, [namespace]);

  React.useEffect(() => {
    // TODO: remove FORCE_ACM block before merging
    if (process.env.FORCE_ACM === 'true') {
      const allPLRs: MultiClusterPipelineRunKind[] = [];
      for (const cluster of mockMultiClusterPipelineRunsResponse.clusters) {
        for (const plr of cluster.items) {
          allPLRs.push({
            ...plr,
            _clusterName: cluster.clusterName,
            metadata: {
              ...plr.metadata,
              annotations: {
                ...plr.metadata?.annotations,
                [CLUSTER_NAME_ANNOTATION]: cluster.clusterName,
              },
            },
          });
        }
      }
      setState({
        data: allPLRs,
        loaded: true,
        error: null,
        clusterErrors: {},
        proxyUnavailable: false,
      });
      return;
    }

    if (!isEnabled || !namespace) {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, loaded: true }));
      }
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const startPolling = async () => {
      if (!proxyCheckedRef.current) {
        proxyCheckedRef.current = true;
        try {
          const isReady = await checkReady();
          if (!isReady) {
            proxyReadyRef.current = false;
            if (mountedRef.current) {
              setState({
                data: [],
                loaded: true,
                error: null,
                clusterErrors: {},
                proxyUnavailable: true,
              });
            }
            return;
          }
          proxyReadyRef.current = true;
        } catch {
          proxyReadyRef.current = false;
          if (mountedRef.current) {
            setState({
              data: [],
              loaded: true,
              error: null,
              clusterErrors: {},
              proxyUnavailable: true,
            });
          }
          return;
        }
      }

      if (!proxyReadyRef.current) return;

      const poll = async () => {
        if (cancelled) return;
        await fetchPipelineRuns();
        if (!cancelled) {
          timeoutId = setTimeout(poll, POLL_INTERVAL);
        }
      };

      poll();
    };

    startPolling();

    return () => {
      cancelled = true;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isEnabled, namespace, fetchPipelineRuns]);

  return [
    state.data,
    state.loaded,
    state.error,
    state.clusterErrors,
    state.proxyUnavailable,
  ];
};
