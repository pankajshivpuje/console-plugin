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
import { MOCK_PIPELINES, MOCK_PIPELINE_RUNS } from '../__demo__/mock-data';
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
  const mergedPipelineRuns = useMemo(() => [
    ...(pipelineRuns || []),
    ...MOCK_PIPELINE_RUNS.filter(
      (mock) => !pipelineRuns?.some((r) => r.metadata?.uid === mock.metadata.uid),
    ),
  ], [pipelineRuns]);
  const pipelinesData = augmentRunsToData(
    [
      ...pipelines,
      ...MOCK_PIPELINES.filter(
        (mock) =>
          !pipelines?.some((p) => p.metadata?.name === mock.metadata.name),
      ),
    ],
    mergedPipelineRuns,
  );

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
