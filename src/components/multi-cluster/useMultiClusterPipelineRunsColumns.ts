import { TableColumn } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { MultiClusterPipelineRunKind } from '../../types';
import { sortPipelineAndTaskRunsByDuration } from '../pipelines-details/pipeline-step-utils';

export const mcTableColumnInfo = [
  { id: 'name', classNames: 'pf-v6-m-width-20' },
  { id: 'cluster', classNames: 'pf-v6-m-width-10' },
  { id: 'namespace', classNames: '' },
  { id: 'status', classNames: 'pf-v6-m-hidden pf-m-visible-on-sm pf-m-width-10' },
  { id: 'task-status', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg' },
  { id: 'started', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg' },
  { id: 'duration', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl' },
  { id: 'action', classNames: 'dropdown-kebab-pf pf-v6-c-table__action' },
];

const useMultiClusterPipelineRunsColumns = (
  namespace: string,
): TableColumn<MultiClusterPipelineRunKind>[] => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return [
    {
      id: mcTableColumnInfo[0].id,
      title: t('Name'),
      sort: 'metadata.name',
      props: { className: mcTableColumnInfo[0].classNames, modifier: 'nowrap' },
    },
    {
      id: mcTableColumnInfo[1].id,
      title: t('Cluster'),
      sort: '_clusterName',
      props: { className: mcTableColumnInfo[1].classNames, modifier: 'nowrap' },
    },
    ...(!namespace
      ? [
          {
            id: mcTableColumnInfo[2].id,
            title: t('Namespace'),
            sort: 'metadata.namespace',
            props: { className: mcTableColumnInfo[2].classNames, modifier: 'nowrap' },
          },
        ]
      : []),
    {
      id: mcTableColumnInfo[3].id,
      title: t('Status'),
      sort: 'status.conditions[0].reason',
      props: { className: mcTableColumnInfo[3].classNames, modifier: 'nowrap' },
    },
    {
      id: mcTableColumnInfo[4].id,
      title: t('Task status'),
      sort: 'status.conditions[0].reason',
      props: { className: mcTableColumnInfo[4].classNames, modifier: 'nowrap' },
    },
    {
      id: mcTableColumnInfo[5].id,
      title: t('Started'),
      sort: 'status.startTime',
      props: { className: mcTableColumnInfo[5].classNames, modifier: 'nowrap' },
    },
    {
      id: mcTableColumnInfo[6].id,
      title: t('Duration'),
      sort: sortPipelineAndTaskRunsByDuration,
      props: { className: mcTableColumnInfo[6].classNames, modifier: 'nowrap' },
    },
    {
      id: mcTableColumnInfo[7].id,
      title: '',
      props: { className: mcTableColumnInfo[7].classNames },
    },
  ];
};

export default useMultiClusterPipelineRunsColumns;
