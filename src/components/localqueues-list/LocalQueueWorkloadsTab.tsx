import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { Bullseye } from '@patternfly/react-core';
import { getLocalQueueWorkloads } from '../__demo__/mock-localqueue-data';
import { WorkloadStatusLabel } from './presenters';
import ClusterBadge from '../cluster/ClusterBadge';

const LocalQueueWorkloadsTab: FC<{ queueName: string }> = ({ queueName }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const workloads = getLocalQueueWorkloads(queueName);

  if (workloads.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No workloads found')}</span>
      </Bullseye>
    );
  }

  return (
    <Table aria-label={t('Workloads')} variant="compact" className="pf-v6-u-mt-md">
      <Thead>
        <Tr>
          <Th>{t('PipelineRun')}</Th>
          <Th>{t('Cluster')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Started')}</Th>
          <Th>{t('Duration')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {workloads.map((w) => (
          <Tr key={w.pipelineRun}>
            <Td dataLabel={t('PipelineRun')}>{w.pipelineRun}</Td>
            <Td dataLabel={t('Cluster')}>
              <ClusterBadge clusterName={w.cluster} clusterType={w.clusterType} />
            </Td>
            <Td dataLabel={t('Status')}>
              <WorkloadStatusLabel status={w.status} />
            </Td>
            <Td dataLabel={t('Started')}>{w.started}</Td>
            <Td dataLabel={t('Duration')}>{w.duration}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default LocalQueueWorkloadsTab;
