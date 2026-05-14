import type { FC } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  ListPageBody,
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import usePipelinesColumns from './usePipelinesColumns';
import { getPipelineListDataViewRows } from './PipelineRow';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import { PipelineModel } from '../../models';
import { PropPipelineData, augmentRunsToData } from '../utils/pipeline-augment';
import { PipelineKind } from '../../types/pipeline';
import { useGetActiveUser } from '../hooks/hooks';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useEffect, useMemo } from 'react';

const MOCK_PIPELINES: PropPipelineData[] = [
  {
    metadata: {
      name: 'buildah-deploy',
      namespace: 'default',
      uid: 'mock-pipeline-buildah-deploy',
      creationTimestamp: '2025-11-01T10:00:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-source', taskRef: { name: 'git-clone' } },
        { name: 'build-image', taskRef: { name: 'buildah' } },
        { name: 'deploy', pipelineRef: { name: 'deploy-to-cluster' } },
      ],
      workspaces: [{ name: 'shared-workspace' }, { name: 'docker-credentials' }],
    },
  },
  {
    metadata: {
      name: 's2i-java',
      namespace: 'default',
      uid: 'mock-pipeline-s2i-java',
      creationTimestamp: '2025-10-15T08:30:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-repo', taskRef: { name: 'git-clone' } },
        { name: 'build', taskRef: { name: 's2i-java' } },
        { name: 'deploy', taskRef: { name: 'openshift-client' } },
        { name: 'verify', pipelineRef: { name: 'integration-tests' } },
      ],
      workspaces: [{ name: 'workspace' }],
    },
  },
  {
    metadata: {
      name: 'docker-build-push',
      namespace: 'default',
      uid: 'mock-pipeline-docker-build-push',
      creationTimestamp: '2025-09-20T14:00:00Z',
    },
    spec: {
      tasks: [
        { name: 'clone', taskRef: { name: 'git-clone' } },
        { name: 'build-and-push', taskRef: { name: 'kaniko' } },
      ],
      workspaces: [{ name: 'source' }, { name: 'dockerconfig' }],
    },
  },
  {
    metadata: {
      name: 'nodejs-deploy',
      namespace: 'default',
      uid: 'mock-pipeline-nodejs-deploy',
      creationTimestamp: '2025-08-10T09:15:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-source', taskRef: { name: 'git-clone' } },
        { name: 'install-deps', taskRef: { name: 'npm' } },
        { name: 'run-tests', pipelineRef: { name: 'test-suite' } },
        { name: 'build-image', taskRef: { name: 'buildah' } },
        { name: 'deploy-app', taskRef: { name: 'openshift-client' } },
      ],
      workspaces: [{ name: 'shared-workspace' }, { name: 'npm-cache' }],
    },
  },
  {
    metadata: {
      name: 'scan-and-deploy',
      namespace: 'default',
      uid: 'mock-pipeline-scan-and-deploy',
      creationTimestamp: '2025-07-05T16:45:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-source', taskRef: { name: 'git-clone' } },
        { name: 'build-image', taskRef: { name: 'buildah' } },
        { name: 'scan-image', taskRef: { name: 'trivy-scanner' } },
        { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
      ],
      finally: [
        { name: 'notify', pipelineRef: { name: 'slack-notify' } },
      ],
      workspaces: [{ name: 'workspace' }, { name: 'scan-results' }],
    },
  },
] as any;
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { useDataViewFilter } from '../hooks/useDataViewFilter';

type PipelineListProps = {
  namespace?: string;
  hideTextFilter?: boolean;
};

const PipelinesList: FC<PipelineListProps> = ({
  namespace,
  hideTextFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  namespace = namespace || ns;
  const columns = usePipelinesColumns(namespace);
  const currentUser = useGetActiveUser();
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    if (!searchParams.has('sortBy')) {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('sortBy', t('Last run time'));
        next.set('orderBy', 'desc');
        return next;
      });
    }
  }, []);

  const [pipelines, pipelinesLoaded, pipelinesLoadError] = useK8sWatchResource<
    PropPipelineData[]
  >({
    isList: true,
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    optional: true,
  });
  const [pipelineRuns, k8sPLRLoaded, trPLRLoaded, pipelineRunsLoadError] =
    useGetPipelineRuns(namespace);
  const pipelinesData = [
    ...augmentRunsToData(pipelines, pipelineRuns),
    ...MOCK_PIPELINES.filter(
      (mock) =>
        !pipelines?.some((p) => p.metadata?.name === mock.metadata.name),
    ),
  ];

  const nestedIn = searchParams.get('nestedIn');

  const filteredPipelines = useMemo(() => {
    if (!nestedIn || !pipelinesData) return pipelinesData;
    const parentPipeline = pipelinesData.find(
      (p) => p.metadata?.name === nestedIn,
    ) as PipelineKind | undefined;
    if (!parentPipeline) return pipelinesData;
    const allTasks = [
      ...(parentPipeline.spec?.tasks || []),
      ...(parentPipeline.spec?.finally || []),
    ];
    const referencedNames = allTasks
      .filter((t) => t.pipelineRef?.name)
      .map((t) => t.pipelineRef.name);
    return pipelinesData.filter((p) =>
      referencedNames.includes(p.metadata?.name),
    );
  }, [nestedIn, pipelinesData]);

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    updatedCheckboxFilters,
  } = useDataViewFilter<PropPipelineData>({
    data: filteredPipelines || [],
    options: { resourceType: 'Pipeline' },
  });

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
      <ConsoleDataView<PropPipelineData>
        label={t('Pipelines')}
        columns={columns}
        data={filteredData}
        loaded={pipelinesLoaded && k8sPLRLoaded && trPLRLoaded}
        loadError={pipelinesLoadError || pipelineRunsLoadError}
        getDataViewRows={getPipelineListDataViewRows}
        hideColumnManagement
        hideNameLabelFilters
        customRowData={{
          currentUser,
        }}
      />
    </ListPageBody>
  );
};

export default PipelinesList;
