import type { FC } from 'react';
import { useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  EmptyState,
  EmptyStateBody,
  EmptyStateVariant,
  Spinner,
} from '@patternfly/react-core';
import { CubesIcon } from '@patternfly/react-icons';
import { MultiClusterPipelineRunKind } from '../../types';
import { useACMAvailability } from '../hooks/useACMAvailability';
import { useMultiClusterPipelineRuns } from '../hooks/useMultiClusterPipelineRuns';
import useMultiClusterPipelineRunsColumns from './useMultiClusterPipelineRunsColumns';
import { getMultiClusterPipelineRunsRows } from './MultiClusterPipelineRunsRow';
import { useMultiClusterFilter } from './useMultiClusterFilter';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';

type MultiClusterPipelineRunsListProps = {
  namespace?: string;
  clusterFilter?: string;
};

const MultiClusterPipelineRunsList: FC<MultiClusterPipelineRunsListProps> = ({
  namespace,
  clusterFilter,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { ns } = useParams();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  namespace = namespace || ns;

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

  const { isACMAvailable, managedClusters, loaded: acmLoaded } =
    useACMAvailability();

  const [pipelineRuns, plrLoaded, plrError, clusterErrors, proxyUnavailable] =
    useMultiClusterPipelineRuns(namespace, isACMAvailable);

  const columns = useMultiClusterPipelineRunsColumns(namespace);

  const clusterNames = useMemo(
    () => managedClusters.map((c) => c.name),
    [managedClusters],
  );

  const {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    checkboxFilters,
  } = useMultiClusterFilter({
    data: pipelineRuns,
    clusterNames,
    initialClusterFilter: clusterFilter,
  });

  const loaded = acmLoaded && plrLoaded;

  if (!acmLoaded) {
    return (
      <ListPageBody>
        <Spinner size="lg" />
      </ListPageBody>
    );
  }

  if (!isACMAvailable) {
    return (
      <ListPageBody>
        <EmptyState
          variant={EmptyStateVariant.lg}
          headingLevel="h4"
          icon={CubesIcon}
          titleText={t('Multi-cluster pipelines not available')}
        >
          <EmptyStateBody>
            {t(
              'ACM (Advanced Cluster Management) with hub cluster configuration is required to view pipelines across clusters.',
            )}
          </EmptyStateBody>
        </EmptyState>
      </ListPageBody>
    );
  }

  const errorClusters = Object.entries(clusterErrors);

  return (
    <ListPageBody>
      {proxyUnavailable && (
        <Alert
          variant="warning"
          isInline
          title={t('Multi-cluster proxy is not available')}
        />
      )}
      {errorClusters.length > 0 &&
        errorClusters.map(([cluster, err]) => (
          <Alert
            key={cluster}
            variant="warning"
            isInline
            title={t('Error fetching data from cluster {{cluster}}', {
              cluster,
            })}
          >
            {err}
          </Alert>
        ))}
      <DataViewFilterToolbar
        filterValues={filterValues}
        onFilterChange={onFilterChange}
        onClearAll={onClearAll}
        checkboxFilters={checkboxFilters}
      />
      <ConsoleDataView<MultiClusterPipelineRunKind>
        label={t('Multi-Cluster PipelineRuns')}
        columns={columns}
        data={filteredData}
        loaded={loaded}
        loadError={plrError}
        getDataViewRows={getMultiClusterPipelineRunsRows}
        customRowData={{}}
        hideColumnManagement
        hideNameLabelFilters
      />
      <div ref={loadMoreRef} />
    </ListPageBody>
  );
};

export default MultiClusterPipelineRunsList;
