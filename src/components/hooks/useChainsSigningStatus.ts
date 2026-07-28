import { useMemo } from 'react';
import { chainsTransparencyAnnotation } from '../../consts';
import {
  ChainsSigningStatus,
  ChainsSigningSummary,
  PipelineRunKind,
  TaskRunKind,
} from '../../types';
import {
  aggregateChainsSigningStatus,
  isPipelineRunDirectlySigned,
} from '../utils/chains-utils';

export const useChainsSigningStatus = (
  pipelineRun: PipelineRunKind | undefined,
  taskRuns: TaskRunKind[],
  taskRunsLoaded: boolean,
): ChainsSigningSummary => {
  return useMemo(() => {
    if (!taskRunsLoaded || !pipelineRun) {
      return {
        status: ChainsSigningStatus.Unknown,
        totalTaskRuns: 0,
        signedCount: 0,
        unsignedCount: 0,
        taskRunDetails: [],
      };
    }

    if (taskRuns?.length > 0) {
      return aggregateChainsSigningStatus(taskRuns);
    }

    if (isPipelineRunDirectlySigned(pipelineRun?.metadata?.annotations)) {
      return {
        status: ChainsSigningStatus.Signed,
        totalTaskRuns: 0,
        signedCount: 0,
        unsignedCount: 0,
        transparencyUrl:
          pipelineRun?.metadata?.annotations?.[chainsTransparencyAnnotation],
        taskRunDetails: [],
      };
    }

    return {
      status: ChainsSigningStatus.Unknown,
      totalTaskRuns: 0,
      signedCount: 0,
      unsignedCount: 0,
      taskRunDetails: [],
    };
  }, [pipelineRun, taskRuns, taskRunsLoaded]);
};
