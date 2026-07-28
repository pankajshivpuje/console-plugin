import {
  chainsSignedAnnotation,
  chainsTransparencyAnnotation,
  TektonResourceLabel,
} from '../../consts';
import {
  ChainsSigningStatus,
  ChainsSigningSummary,
  ChainsTaskRunSigningDetail,
  TaskRunKind,
} from '../../types';

export const getTaskRunChainsStatus = (
  taskRun: TaskRunKind,
): ChainsTaskRunSigningDetail => ({
  name: taskRun.metadata?.name || '',
  pipelineTaskName:
    taskRun.metadata?.labels?.[TektonResourceLabel.pipelineTask],
  signed:
    taskRun.metadata?.annotations?.[chainsSignedAnnotation] === 'true',
  transparencyUrl:
    taskRun.metadata?.annotations?.[chainsTransparencyAnnotation],
});

export const aggregateChainsSigningStatus = (
  taskRuns: TaskRunKind[],
): ChainsSigningSummary => {
  if (!taskRuns?.length) {
    return {
      status: ChainsSigningStatus.Unknown,
      totalTaskRuns: 0,
      signedCount: 0,
      unsignedCount: 0,
      taskRunDetails: [],
    };
  }

  const details = taskRuns.map(getTaskRunChainsStatus);
  const signedCount = details.filter((d) => d.signed).length;
  const unsignedCount = details.length - signedCount;
  const firstTransparencyUrl = details.find(
    (d) => d.transparencyUrl,
  )?.transparencyUrl;

  const hasChainsAnnotations = taskRuns.some(
    (tr) =>
      tr.metadata?.annotations?.[chainsSignedAnnotation] !== undefined,
  );

  let status: ChainsSigningStatus;
  if (!hasChainsAnnotations) {
    status = ChainsSigningStatus.Unknown;
  } else if (signedCount === details.length) {
    status = ChainsSigningStatus.Signed;
  } else if (signedCount === 0) {
    status = ChainsSigningStatus.Unsigned;
  } else {
    status = ChainsSigningStatus.Partial;
  }

  return {
    status,
    totalTaskRuns: details.length,
    signedCount,
    unsignedCount,
    transparencyUrl: firstTransparencyUrl,
    taskRunDetails: details,
  };
};

export const isPipelineRunDirectlySigned = (
  annotations?: Record<string, string>,
): boolean => annotations?.[chainsSignedAnnotation] === 'true';
