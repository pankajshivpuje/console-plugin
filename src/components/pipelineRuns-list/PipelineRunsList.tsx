import type { FC } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import {
  Alert,
  AlertActionCloseButton,
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import usePipelineRunsColumns from './usePipelineRunsColumns';
import { PipelineRunKind } from '../../types';
import { useGetPipelineRuns } from '../hooks/useTektonResult';
import { getPipelineRunsListDataViewRows } from './PipelineRunsRow';
import { useGetActiveUser } from '../hooks/hooks';
import { ConsoleDataView } from '@openshift-console/dynamic-plugin-sdk-internal';
import { useTranslation } from 'react-i18next';
import { useDataViewFilter } from '../hooks/useDataViewFilter';
import { DataViewFilterToolbar } from '../common/DataViewFilterToolbar';
import { MOCK_PIPELINE_RUNS } from '../__demo__/mock-data';
import PipelineRunExpandedContent from './PipelineRunExpandedContent';
import {
  getClusterDataForPipelineRun,
  getAllClusterNames,
} from '../__demo__/mock-cluster-data';

import './PipelineRunsList.scss';

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
  const [expandedPLR, setExpandedPLR] = useState<string | null>(null);

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

  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [clusterSelectOpen, setClusterSelectOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() =>
    localStorage.getItem('opp-multicluster-banner-dismissed') === 'true',
  );

  const clusterFilteredData = useMemo(() => {
    if (selectedCluster === 'all') return filteredData;
    return filteredData.filter(
      (plr) =>
        plr.metadata?.annotations?.['tekton.dev/cluster'] === selectedCluster,
    );
  }, [filteredData, selectedCluster]);

  const handleBannerDismiss = useCallback(() => {
    setBannerDismissed(true);
    localStorage.setItem('opp-multicluster-banner-dismissed', 'true');
  }, []);

  const clusterNames = getAllClusterNames();

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

  const toggleExpand = useCallback((plrName: string) => {
    setExpandedPLR((prev) => (prev === plrName ? null : plrName));
  }, []);

  return (
    <ListPageBody>
      {!bannerDismissed && (
        <Alert
          variant="info"
          isInline
          title={t('Multi-cluster routing active')}
          actionClose={<AlertActionCloseButton onClose={handleBannerDismiss} />}
          className="opp-plr-multicluster-banner"
        >
          {t(
            'PipelineRuns are dynamically dispatched via MultiKueue to the optimal spoke cluster based on current fleet capacity. The Cluster column shows where each run executed.',
          )}
        </Alert>
      )}
      {!hideTextFilter && (
        <DataViewFilterToolbar
          filterValues={filterValues}
          onFilterChange={onFilterChange}
          onClearAll={onClearAll}
          checkboxFilters={updatedCheckboxFilters}
        >
          <Select
            isOpen={clusterSelectOpen}
            onOpenChange={setClusterSelectOpen}
            onSelect={(_e, value) => {
              setSelectedCluster(value as string);
              setClusterSelectOpen(false);
            }}
            selected={selectedCluster}
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setClusterSelectOpen(!clusterSelectOpen)}
                isExpanded={clusterSelectOpen}
              >
                {selectedCluster === 'all' ? t('All Clusters') : selectedCluster}
              </MenuToggle>
            )}
          >
            <SelectList>
              <SelectOption value="all">{t('All Clusters')}</SelectOption>
              {clusterNames.map((name) => (
                <SelectOption key={name} value={name}>
                  {name}
                </SelectOption>
              ))}
            </SelectList>
          </Select>
        </DataViewFilterToolbar>
      )}
      <ConsoleDataView<PipelineRunKind>
        label={t('PipelineRuns')}
        columns={columns}
        data={clusterFilteredData}
        loaded={loaded}
        loadError={pipelineRunsLoadError}
        getDataViewRows={getPipelineRunsListDataViewRows}
        customRowData={{
          repositoryPLRs,
          currentUser,
          expandedPLR,
          toggleExpand,
        }}
        hideColumnManagement
        hideNameLabelFilters
      />
      {expandedPLR && (() => {
        const clusterData = getClusterDataForPipelineRun(expandedPLR);
        const plr = clusterFilteredData.find((r) => r.metadata?.name === expandedPLR);
        const clusterName = plr?.metadata?.annotations?.['tekton.dev/cluster'];
        return clusterData && clusterName ? (
          <PipelineRunExpandedContent
            clusterData={clusterData}
            clusterName={clusterName}
          />
        ) : null;
      })()}
      <div ref={loadMoreRef}></div>
    </ListPageBody>
  );
};

export default PipelineRunsList;
