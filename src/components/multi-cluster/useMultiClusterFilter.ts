import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComputedStatus, MultiClusterPipelineRunKind } from '../../types';
import type {
  CheckboxFilterConfig,
  FilterValues,
} from '../common/DataViewFilterToolbar';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';

const STATUS_OPTIONS: { id: string; title: string }[] = [
  { id: ComputedStatus.Succeeded, title: 'Succeeded' },
  { id: ComputedStatus.Running, title: 'Running' },
  { id: ComputedStatus.Failed, title: 'Failed' },
  { id: ComputedStatus.Cancelled, title: 'Cancelled' },
  { id: ComputedStatus.Pending, title: 'Pending' },
];

type UseMultiClusterFilterOptions = {
  data: MultiClusterPipelineRunKind[];
  clusterNames: string[];
  initialClusterFilter?: string;
};

type UseMultiClusterFilterResult = {
  filterValues: FilterValues;
  onFilterChange: (key: string, value: string | string[]) => void;
  onClearAll: () => void;
  filteredData: MultiClusterPipelineRunKind[];
  checkboxFilters: CheckboxFilterConfig[];
};

export const useMultiClusterFilter = ({
  data,
  clusterNames,
  initialClusterFilter,
}: UseMultiClusterFilterOptions): UseMultiClusterFilterResult => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [filterValues, setFilterValues] = useState<FilterValues>({
    name: '',
    labels: [],
    status: [],
    cluster: initialClusterFilter ? [initialClusterFilter] : [],
  });

  const onFilterChange = useCallback(
    (key: string, value: string | string[]) => {
      setFilterValues((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const onClearAll = useCallback(() => {
    setFilterValues({ name: '', labels: [], status: [], cluster: [] });
  }, []);

  const clusterCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const plr of data) {
      const cn = plr._clusterName || 'unknown';
      counts[cn] = (counts[cn] || 0) + 1;
    }
    return counts;
  }, [data]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const plr of data) {
      const status = pipelineRunFilterReducer(plr) || 'Unknown';
      counts[status] = (counts[status] || 0) + 1;
    }
    return counts;
  }, [data]);

  const checkboxFilters: CheckboxFilterConfig[] = useMemo(
    () => [
      {
        id: 'cluster',
        title: t('Cluster'),
        options: clusterNames.map((name) => ({
          value: name,
          label: name,
          count: clusterCounts[name] || 0,
        })),
      },
      {
        id: 'status',
        title: t('Status'),
        options: STATUS_OPTIONS.map((item) => ({
          value: item.id,
          label: item.title,
          count: statusCounts[item.id] || 0,
        })),
      },
    ],
    [t, clusterNames, clusterCounts, statusCounts],
  );

  const filteredData = useMemo(() => {
    let result = data;

    const nameFilter = filterValues.name?.trim().toLowerCase();
    if (nameFilter) {
      result = result.filter((plr) =>
        plr.metadata?.name?.toLowerCase().includes(nameFilter),
      );
    }

    const selectedClusters = filterValues.cluster as string[] | undefined;
    if (selectedClusters?.length) {
      result = result.filter((plr) =>
        selectedClusters.includes(plr._clusterName || ''),
      );
    }

    const selectedStatuses = filterValues.status as string[] | undefined;
    if (selectedStatuses?.length) {
      result = result.filter((plr) =>
        selectedStatuses.includes(pipelineRunFilterReducer(plr) || ''),
      );
    }

    return result;
  }, [data, filterValues]);

  return {
    filterValues,
    onFilterChange,
    onClearAll,
    filteredData,
    checkboxFilters,
  };
};
