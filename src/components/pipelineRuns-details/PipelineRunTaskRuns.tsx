import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Bullseye } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { PipelineRunKind, TaskRunKind } from '../../types';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { LoadingBox } from '../status/status-box';
import Status from '../status/Status';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../utils/pipeline-utils';

const taskName = (tr: TaskRunKind): string =>
  tr.spec?.taskRef?.name ||
  tr.metadata?.labels?.['tekton.dev/pipelineTask'] ||
  '-';

const started = (tr: TaskRunKind): string => tr.status?.startTime || '-';

const PipelineRunTaskRuns: FC<{ obj: PipelineRunKind }> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const namespace = obj?.metadata?.namespace;
  const name = obj?.metadata?.name;
  const [taskRuns, k8sLoaded, trLoaded] = useTaskRuns(namespace, name);
  const loaded = k8sLoaded || trLoaded;

  if (!loaded) {
    return <LoadingBox />;
  }
  if (!taskRuns || taskRuns.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No TaskRuns found')}</span>
      </Bullseye>
    );
  }

  return (
    <Table aria-label={t('TaskRuns')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Task')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Started')}</Th>
          <Th>{t('Duration')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {taskRuns.map((tr) => (
          <Tr key={tr.metadata?.uid || tr.metadata?.name}>
            <Td dataLabel={t('Name')}>{tr.metadata?.name}</Td>
            <Td dataLabel={t('Task')}>{taskName(tr)}</Td>
            <Td dataLabel={t('Status')}>
              <Status status={pipelineRunFilterReducer(tr)} />
            </Td>
            <Td dataLabel={t('Started')}>{started(tr)}</Td>
            <Td dataLabel={t('Duration')}>{pipelineRunDuration(tr)}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PipelineRunTaskRuns;
