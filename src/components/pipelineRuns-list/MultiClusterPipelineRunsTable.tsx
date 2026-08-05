import type { FC } from 'react';
import { useState, useMemo, useCallback, memo } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Td,
  Th,
  ExpandableRowContent,
  ThProps,
} from '@patternfly/react-table';
import {
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  Bullseye,
  EmptyState,
  EmptyStateBody,
  Spinner,
  Tooltip,
} from '@patternfly/react-core';
import {
  ArchiveIcon,
  MulticlusterIcon,
} from '@patternfly/react-icons';
import { PipelineRunKind } from '../../types';
import { ResourceLinkWithIcon } from '../utils/resource-link';
import { PipelineRunModel } from '../../models';
import {
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import ClusterBadge from '../cluster/ClusterBadge';
import {
  getClusterDataForPipelineRun,
  PipelineRunClusterData,
} from '../__demo__/mock-cluster-data';
import PipelineRunExpandedContent from './PipelineRunExpandedContent';
import PipelineRunVulnerabilities from '../pipelines-list/status/PipelineRunVulnerabilities';
import LinkedPipelineRunTaskStatus from '../pipelines-list/status/LinkedPipelineRunTaskStatus';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../utils/pipeline-utils';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { useTranslation } from 'react-i18next';
import {
  DASH,
  chainsSignedAnnotation,
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
  PIPELINE_RUN_MANAGED_BY_KUEUE_LABEL,
} from '../../consts';
import SignedBadgeIcon from '../../images/SignedBadge';

interface MultiClusterPipelineRunsTableProps {
  data: PipelineRunKind[];
  loaded: boolean;
  loadError?: unknown;
}

const PLRStatus: FC<{ obj: PipelineRunKind }> = memo(({ obj }) => (
  <PipelineRunStatusContent
    status={pipelineRunFilterReducer(obj)}
    title={pipelineRunTitleFilterReducer(obj)}
    pipelineRun={obj}
  />
));

const NUM_COLUMNS = 9;

const MultiClusterPipelineRunsTable: FC<MultiClusterPipelineRunsTableProps> = ({
  data,
  loaded,
  loadError,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [activeSortIndex, setActiveSortIndex] = useState<number | null>(null);
  const [activeSortDirection, setActiveSortDirection] = useState<'asc' | 'desc'>('desc');

  const toggleExpand = useCallback((name: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }, []);

  const getSortValue = useCallback(
    (plr: PipelineRunKind, index: number): string => {
      switch (index) {
        case 0:
          return plr.metadata?.name || '';
        case 1:
          return plr.metadata?.annotations?.['tekton.dev/cluster'] || '';
        case 3:
          return plr.status?.conditions?.[0]?.reason || '';
        case 5:
          return plr.status?.startTime || '';
        default:
          return '';
      }
    },
    [],
  );

  const sortedData = useMemo(() => {
    if (activeSortIndex === null) return data;
    return [...data].sort((a, b) => {
      const aVal = getSortValue(a, activeSortIndex);
      const bVal = getSortValue(b, activeSortIndex);
      if (aVal < bVal) return activeSortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return activeSortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, activeSortIndex, activeSortDirection, getSortValue]);

  const getSortParams = useCallback(
    (columnIndex: number): ThProps['sort'] => ({
      sortBy: {
        index: activeSortIndex ?? undefined,
        direction: activeSortDirection,
      },
      onSort: (_event, index, direction) => {
        setActiveSortIndex(index);
        setActiveSortDirection(direction as 'asc' | 'desc');
      },
      columnIndex,
    }),
    [activeSortIndex, activeSortDirection],
  );

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner size="xl" />
      </Bullseye>
    );
  }

  if (loadError) {
    return (
      <EmptyState>
        <EmptyStateBody>
          {t('Unable to load PipelineRuns.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  if (!data.length) {
    return (
      <EmptyState>
        <EmptyStateBody>{t('No PipelineRuns found.')}</EmptyStateBody>
      </EmptyState>
    );
  }

  return (
    <Table aria-label={t('PipelineRuns')} variant="compact">
      <Thead>
        <Tr>
          <Th screenReaderText="Row expansion" />
          <Th sort={getSortParams(0)}>{t('Name')}</Th>
          <Th sort={getSortParams(1)}>{t('Cluster')}</Th>
          <Th>{t('Vulnerabilities')}</Th>
          <Th sort={getSortParams(3)}>{t('Status')}</Th>
          <Th>{t('Task status')}</Th>
          <Th sort={getSortParams(5)}>{t('Started')}</Th>
          <Th>{t('Duration')}</Th>
          <Th screenReaderText="Actions" />
        </Tr>
      </Thead>
      {sortedData.map((plr, rowIndex) => {
        const name = plr.metadata?.name || '';
        const clusterData = getClusterDataForPipelineRun(name);
        const isExpanded = expandedRows.has(name);
        const hasClusterData = !!clusterData;
        const clusterName =
          plr.metadata?.annotations?.['tekton.dev/cluster'] || '';

        return (
          <Tbody key={plr.metadata?.uid || name} isExpanded={isExpanded}>
            <Tr>
              <Td
                expand={
                  hasClusterData
                    ? {
                        rowIndex,
                        isExpanded,
                        onToggle: () => toggleExpand(name),
                      }
                    : undefined
                }
              />
              <Td dataLabel={t('Name')}>
                <ResourceLinkWithIcon
                  groupVersionKind={getGroupVersionKindForModel(
                    PipelineRunModel,
                  )}
                  name={name}
                  namespace={plr.metadata?.namespace}
                  data-test-id={name}
                  model={PipelineRunModel}
                  nameSuffix={
                    <>
                      {plr.metadata?.annotations?.[chainsSignedAnnotation] ===
                      'true' ? (
                        <Tooltip content={t('Signed')}>
                          <div className="opp-pipeline-run-list__signed-indicator">
                            <SignedBadgeIcon />
                          </div>
                        </Tooltip>
                      ) : null}
                      {plr.metadata?.annotations?.[
                        DELETED_RESOURCE_IN_K8S_ANNOTATION
                      ] === 'true' ||
                      plr.metadata?.annotations?.[
                        RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
                      ] === 'true' ? (
                        <Tooltip content={t('Archived in Tekton results')}>
                          <div className="opp-pipeline-run-list__results-indicator">
                            <ArchiveIcon />
                          </div>
                        </Tooltip>
                      ) : null}
                      {plr.spec?.managedBy ===
                      PIPELINE_RUN_MANAGED_BY_KUEUE_LABEL ? (
                        <Tooltip content={t('Multicluster Pipeline Run')}>
                          <MulticlusterIcon className="opp-pipeline-run-list__results-indicator" />
                        </Tooltip>
                      ) : null}
                    </>
                  }
                />
              </Td>
              <Td dataLabel={t('Cluster')}>
                {hasClusterData ? (
                  <ClusterBadge
                    clusterName={clusterName}
                    clusterType={clusterData.clusterInfo.type}
                    region={clusterData.clusterInfo.region}
                  />
                ) : (
                  DASH
                )}
              </Td>
              <Td dataLabel={t('Vulnerabilities')}>
                <PipelineRunVulnerabilities
                  pipelineRun={plr}
                  condensed
                />
              </Td>
              <Td dataLabel={t('Status')}>
                <PLRStatus obj={plr} />
              </Td>
              <Td dataLabel={t('Task status')}>
                <LinkedPipelineRunTaskStatus pipelineRun={plr} />
              </Td>
              <Td dataLabel={t('Started')}>
                <Timestamp
                  timestamp={plr.status && plr.status.startTime}
                />
              </Td>
              <Td dataLabel={t('Duration')}>
                {pipelineRunDuration(plr)}
              </Td>
              <Td isActionCell>
                <LazyActionMenu
                  context={{
                    [getReferenceForModel(PipelineRunModel)]: plr,
                  }}
                />
              </Td>
            </Tr>
            {hasClusterData && (
              <Tr isExpanded={isExpanded}>
                <Td colSpan={NUM_COLUMNS} noPadding>
                  <ExpandableRowContent>
                    <PipelineRunExpandedContent
                      clusterData={clusterData as PipelineRunClusterData}
                      clusterName={clusterName}
                    />
                  </ExpandableRowContent>
                </Td>
              </Tr>
            )}
          </Tbody>
        );
      })}
    </Table>
  );
};

export default MultiClusterPipelineRunsTable;
