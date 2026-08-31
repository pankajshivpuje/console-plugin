import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Label, LabelGroup } from '@patternfly/react-core';
import type {
  LocalQueue,
  WorkloadStatus,
} from '../__demo__/mock-localqueue-data';

// Renders the "Target Clusters" cell/field consistently across the list table
// and the detail page, derived from the queue's scheduling policy.
export const TargetClusters: FC<{ lq: LocalQueue }> = ({ lq }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (lq.schedulingPolicy === 'hub-only') {
    return <span className="pf-v6-u-color-200">{t('Hub cluster')}</span>;
  }
  if (lq.schedulingPolicy === 'any-spoke') {
    return <span className="pf-v6-u-color-200">{t('All available spokes')}</span>;
  }
  // selected-spokes
  return (
    <LabelGroup numLabels={5}>
      {lq.spokeClusterNames.map((s) => (
        <Label key={s} isCompact>
          {s}
        </Label>
      ))}
    </LabelGroup>
  );
};

const WORKLOAD_STATUS_COLOR: Record<
  WorkloadStatus,
  'blue' | 'green' | 'red' | 'grey'
> = {
  Running: 'blue',
  Succeeded: 'green',
  Failed: 'red',
  Pending: 'grey',
};

// Colored label for a workload (PipelineRun) status in the Workloads tab.
export const WorkloadStatusLabel: FC<{ status: WorkloadStatus }> = ({
  status,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Label isCompact color={WORKLOAD_STATUS_COLOR[status]}>
      {t(status)}
    </Label>
  );
};
