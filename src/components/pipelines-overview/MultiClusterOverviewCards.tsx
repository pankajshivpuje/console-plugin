import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Flex, FlexItem, Title } from '@patternfly/react-core';
import { useMultiClusterPipelineRuns } from '../hooks/useMultiClusterPipelineRuns';
import { Loading } from '../Loading';
import ClusterHealthCard from '../multi-cluster/ClusterHealthCard';
import MultiClusterStatusCard from '../multi-cluster/MultiClusterStatusCard';
import ClusterBreakdownCard from '../multi-cluster/ClusterBreakdownCard';
import MultiClusterPipelineRunsList from '../multi-cluster/MultiClusterPipelineRunsList';
import { ClusterInfo } from '../../types';

type MultiClusterOverviewCardsProps = {
  namespace: string;
  selectedCluster: string;
  managedClusters: ClusterInfo[];
  isACMAvailable: boolean;
};

const MultiClusterOverviewCards: FC<MultiClusterOverviewCardsProps> = ({
  namespace,
  selectedCluster,
  managedClusters,
  isACMAvailable,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const [pipelineRuns, plrLoaded, , clusterErrors] =
    useMultiClusterPipelineRuns(namespace, isACMAvailable);

  const filteredPipelineRuns = useMemo(
    () =>
      selectedCluster === 'all'
        ? pipelineRuns
        : pipelineRuns.filter(
            (plr) => plr._clusterName === selectedCluster,
          ),
    [pipelineRuns, selectedCluster],
  );

  const filteredClusters = useMemo(
    () =>
      selectedCluster === 'all'
        ? managedClusters
        : managedClusters.filter((c) => c.name === selectedCluster),
    [managedClusters, selectedCluster],
  );

  const errorClusters = Object.entries(clusterErrors);

  if (!plrLoaded) {
    return <Loading />;
  }

  return (
    <>
      {errorClusters.length > 0 &&
        errorClusters.map(([cluster, err]) => (
          <Alert
            key={cluster}
            variant="warning"
            isInline
            title={t('Error fetching data from cluster {{cluster}}', {
              cluster,
            })}
            className="pf-v6-u-mb-md"
          >
            {err}
          </Alert>
        ))}

      <ClusterHealthCard
        clusters={filteredClusters}
        pipelineRuns={filteredPipelineRuns}
        bordered
      />

      <Flex
        className="pf-v6-u-mt-md"
        alignItems={{ default: 'alignItemsStretch' }}
        gap={{ default: 'gapMd' }}
        flexWrap={{ default: 'wrap' }}
      >
        <FlexItem flex={{ default: 'flex_1' }}>
          <MultiClusterStatusCard
            pipelineRuns={filteredPipelineRuns}
            bordered
          />
        </FlexItem>
        <FlexItem flex={{ default: 'flex_1' }}>
          <ClusterBreakdownCard
            clusters={filteredClusters}
            pipelineRuns={filteredPipelineRuns}
            bordered
          />
        </FlexItem>
      </Flex>

      <div className="pf-v6-u-mt-md">
        <Title headingLevel="h3" className="pf-v6-u-mb-md">
          {t('Recent PipelineRuns')}
        </Title>
        <MultiClusterPipelineRunsList
          namespace={namespace}
          clusterFilter={
            selectedCluster !== 'all' ? selectedCluster : undefined
          }
        />
      </div>
    </>
  );
};

export default MultiClusterOverviewCards;
