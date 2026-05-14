import type { FC } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { PipelineRunKind } from '../../types';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import { getPipelineRunsListDataViewRows } from './PipelineRunsRow';
import { useGetActiveUser } from '../hooks/hooks';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useTranslation } from 'react-i18next';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { TektonResourceLabel } from '../../consts';

import './PipelineRunsList.scss';

const MOCK_PIPELINE_RUNS: PipelineRunKind[] = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'buildah-deploy-run-7xk2m',
      namespace: 'default',
      uid: 'mock-plr-buildah-1',
      creationTimestamp: '2025-11-10T14:30:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'buildah-deploy' },
    },
    spec: { pipelineRef: { name: 'buildah-deploy' } },
    status: {
      startTime: '2025-11-10T14:30:00Z',
      completionTime: '2025-11-10T14:38:22Z',
      conditions: [
        { type: 'Succeeded', status: 'True', reason: 'Succeeded', lastTransitionTime: '2025-11-10T14:38:22Z', message: 'All tasks completed' },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy', pipelineRef: { name: 'deploy-to-cluster' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'buildah-deploy-run-9ab3f',
      namespace: 'default',
      uid: 'mock-plr-buildah-2',
      creationTimestamp: '2025-11-09T09:15:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'buildah-deploy' },
    },
    spec: { pipelineRef: { name: 'buildah-deploy' } },
    status: {
      startTime: '2025-11-09T09:15:00Z',
      completionTime: '2025-11-09T09:22:45Z',
      conditions: [
        { type: 'Succeeded', status: 'False', reason: 'Failed', lastTransitionTime: '2025-11-09T09:22:45Z', message: 'Task build-image failed' },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 's2i-java-run-c4d8e',
      namespace: 'default',
      uid: 'mock-plr-s2i-java-1',
      creationTimestamp: '2025-10-20T11:00:00Z',
      labels: { [TektonResourceLabel.pipeline]: 's2i-java' },
    },
    spec: { pipelineRef: { name: 's2i-java' } },
    status: {
      startTime: '2025-10-20T11:00:00Z',
      completionTime: '2025-10-20T11:12:30Z',
      conditions: [
        { type: 'Succeeded', status: 'True', reason: 'Succeeded', lastTransitionTime: '2025-10-20T11:12:30Z', message: 'All tasks completed' },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-repo', taskRef: { name: 'git-clone' } },
          { name: 'build', taskRef: { name: 's2i-java' } },
          { name: 'deploy', taskRef: { name: 'openshift-client' } },
          { name: 'verify', pipelineRef: { name: 'integration-tests' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'docker-build-push-run-f2g7h',
      namespace: 'default',
      uid: 'mock-plr-docker-1',
      creationTimestamp: '2025-09-25T16:45:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'docker-build-push' },
    },
    spec: { pipelineRef: { name: 'docker-build-push' } },
    status: {
      startTime: '2025-09-25T16:45:00Z',
      conditions: [
        { type: 'Succeeded', status: 'Unknown', reason: 'Running', lastTransitionTime: '2025-09-25T16:45:00Z', message: 'Tasks running' },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'clone', taskRef: { name: 'git-clone' } },
          { name: 'build-and-push', taskRef: { name: 'kaniko' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'nodejs-deploy-run-j5k8l',
      namespace: 'default',
      uid: 'mock-plr-nodejs-1',
      creationTimestamp: '2025-08-15T08:00:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'nodejs-deploy' },
    },
    spec: { pipelineRef: { name: 'nodejs-deploy' } },
    status: {
      startTime: '2025-08-15T08:00:00Z',
      completionTime: '2025-08-15T08:15:10Z',
      conditions: [
        { type: 'Succeeded', status: 'True', reason: 'Succeeded', lastTransitionTime: '2025-08-15T08:15:10Z', message: 'All tasks completed' },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'install-deps', taskRef: { name: 'npm' } },
          { name: 'run-tests', pipelineRef: { name: 'test-suite' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy-app', taskRef: { name: 'openshift-client' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'scan-and-deploy-run-m9n1p',
      namespace: 'default',
      uid: 'mock-plr-scan-1',
      creationTimestamp: '2025-07-10T13:30:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'scan-and-deploy' },
    },
    spec: { pipelineRef: { name: 'scan-and-deploy' } },
    status: {
      startTime: '2025-07-10T13:30:00Z',
      completionTime: '2025-07-10T13:45:55Z',
      conditions: [
        { type: 'Succeeded', status: 'False', reason: 'Failed', lastTransitionTime: '2025-07-10T13:45:55Z', message: 'Vulnerability scan failed' },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'scan-image', taskRef: { name: 'trivy-scanner' } },
          { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
        ],
      },
    },
  },
] as any;

type PipelineRunsListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
  repositoryPLRs?: boolean;
  PLRsForName?: string;
  PLRsForKind?: string;
};

const PipelineRunsList: FC<PipelineRunsListProps> = ({
  namespace,
  hideTextFilter,
  repositoryPLRs,
  PLRsForName,
  PLRsForKind,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const { ns } = useParams();
  const currentUser = useGetActiveUser();
  namespace = namespace || ns;
  const columns = usePipelineRunsColumns(namespace, repositoryPLRs);

  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!searchParams.has('sortBy')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sortBy', t('Started'));
        next.set('orderBy', 'desc');
        return next;
      });
    }
  }, []);

  const [pipelineRuns, k8sLoaded, trLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace, { name: PLRsForName, kind: PLRsForKind });

  const allPipelineRuns = useMemo(() => [
    ...(pipelineRuns || []),
    ...MOCK_PIPELINE_RUNS.filter(
      (mock) => !pipelineRuns?.some((r) => r.metadata?.uid === mock.metadata.uid),
    ),
  ], [pipelineRuns]);

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<PipelineRunKind>({
    data: allPipelineRuns,
    options: {
      resourceType: 'PipelineRun',
      defaultDataSourceValues: ['cluster-data'],
    },
  });

  const loaded = useMemo(() => {
    const selectedSources = filterValues?.dataSource as string[] | undefined;
    const bothOrNone =
      !selectedSources?.length ||
      (selectedSources.includes('cluster-data') &&
        selectedSources.includes('archived-data'));
    if (bothOrNone) return k8sLoaded && trLoaded;
    if (selectedSources.includes('cluster-data')) return k8sLoaded;
    return trLoaded;
  }, [k8sLoaded, trLoaded, filterValues?.dataSource]);

  return (
    <ListPageBody>
      {!hideTextFilter && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          checkboxFilters={updatedCheckboxFilters}
        />
      )}
      <ConsoleDataView<PipelineRunKind>
        label={t('PipelineRuns')}
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={pipelineRunsLoadError}
        getDataViewRows={getPipelineRunsListDataViewRows}
        customRowData={{
          repositoryPLRs,
          currentUser,
        }}
        hideColumnManagement
        hideNameLabelFilters
      />
      <div ref={loadMoreRef}></div>
    </ListPageBody>
  );
};

export default PipelineRunsList;
