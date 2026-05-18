import { useMemo } from 'react';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { TektonResourceLabel } from '../../consts';
import { PipelineRunModel } from '../../models';
import { PipelineRunKind } from '../../types';

const PIPELINE_RUN_GVK = getGroupVersionKindForModel(PipelineRunModel);

export type ChildPipelineRunMap = Record<string, PipelineRunKind>;

export const useChildPipelineRuns = (
  namespace: string,
  pipelineRunName: string,
  pipelineRun?: PipelineRunKind,
): [ChildPipelineRunMap, boolean] => {
  const hasChildPipelineRuns = useMemo(
    () =>
      pipelineRun?.status?.childReferences?.some(
        (ref) => ref.kind === 'PipelineRun',
      ) ?? false,
    [pipelineRun?.status?.childReferences],
  );

  const watchResource = useMemo(
    () =>
      hasChildPipelineRuns && namespace && pipelineRunName
        ? {
            groupVersionKind: PIPELINE_RUN_GVK,
            namespace,
            isList: true,
            selector: {
              matchLabels: {
                [TektonResourceLabel.pipelinerun]: pipelineRunName,
              },
            },
          }
        : null,
    [hasChildPipelineRuns, namespace, pipelineRunName],
  );

  const [resources, loaded, error] =
    useK8sWatchResource<PipelineRunKind[]>(watchResource);

  const childPipelineRunMap = useMemo(() => {
    if (!hasChildPipelineRuns || !loaded || error || !resources) {
      return {};
    }
    const childRefs = pipelineRun?.status?.childReferences?.filter(
      (ref) => ref.kind === 'PipelineRun',
    );
    if (!childRefs?.length) return {};

    const map: ChildPipelineRunMap = {};
    for (const ref of childRefs) {
      const plr = resources.find((r) => r.metadata?.name === ref.name);
      if (plr) {
        map[ref.pipelineTaskName] = plr;
      }
    }
    return map;
  }, [
    hasChildPipelineRuns,
    loaded,
    error,
    resources,
    pipelineRun?.status?.childReferences,
  ]);

  if (!hasChildPipelineRuns) {
    return [{}, true];
  }

  return [childPipelineRunMap, loaded && !error];
};
