import type { FC } from 'react';
import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  Grid,
  GridItem,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  ClusterBadge,
  RoutingPill,
  ResourceMeter,
  DispatchTimeline,
} from '../cluster';
import { useTranslation } from 'react-i18next';
import type { PipelineRunClusterData } from '../__demo__/mock-cluster-data';

import './ClusterExecutionCard.scss';

export interface ClusterExecutionCardProps {
  clusterData: PipelineRunClusterData;
  clusterName: string;
}

const ClusterExecutionCard: FC<ClusterExecutionCardProps> = ({
  clusterData,
  clusterName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    clusterInfo,
    routing,
    resources,
    timeline,
    clusterQueue,
    secretSync,
  } = clusterData;

  const queueDisplay = `${resources.queueUsed} / ${resources.queueCapacity}`;
  const queuePercent = Math.round(
    (resources.queueUsed / resources.queueCapacity) * 100,
  );

  return (
    <div className="opp-cluster-execution">
      <div className="opp-cluster-execution__header">
        <Title headingLevel="h2" size="lg">
          {t('Cluster Execution')}
        </Title>
        <ClusterBadge
          clusterName={clusterName}
          clusterType={clusterInfo.type}
          region={clusterInfo.region}
        />
      </div>

      <Card isPlain className="opp-cluster-execution__card">
        <CardBody>
          <Grid hasGutter>
            {/* Panel 1: Dispatch & Routing */}
            <GridItem sm={12} md={4}>
              <Title headingLevel="h4" size="md" className="opp-cluster-execution__panel-title">
                {t('Dispatch & Routing')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Dispatched by')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.dispatchedBy}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Target cluster')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.targetCluster}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Routing reason')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.reason}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Queue wait')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.queueWait}</DescriptionListDescription>
                </DescriptionListGroup>
                {routing.alternatives && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Alternatives')}</DescriptionListTerm>
                    <DescriptionListDescription>{routing.alternatives}</DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
              <RoutingPill
                quality={routing.routeQuality}
                text={
                  routing.routeQuality === 'optimal'
                    ? t('Optimal route')
                    : t('Constrained route')
                }
              />
              <Divider className="opp-cluster-execution__divider" />
              <Title headingLevel="h5" size="md" className="opp-cluster-execution__sub-title">
                {t('Dispatch timeline')}
              </Title>
              <DispatchTimeline timeline={timeline} />
            </GridItem>

            {/* Panel 2: Cluster Resources */}
            <GridItem sm={12} md={4}>
              <Title headingLevel="h4" size="md" className="opp-cluster-execution__panel-title">
                {t('Cluster Resources (at execution)')}
              </Title>
              <ResourceMeter label={t('CPU')} value={resources.cpuPercent} />
              <ResourceMeter label={t('Memory')} value={resources.memoryPercent} />
              <ResourceMeter
                label={t('Queue')}
                value={queuePercent}
                displayValue={queueDisplay}
              />
              <div className="opp-cluster-execution__node-info">
                {t('Node:')} <strong>{resources.node}</strong>
                <br />
                {resources.vCPU} vCPU &middot; {resources.ramGi} Gi RAM
              </div>
              <Divider className="opp-cluster-execution__divider" />
              <Title headingLevel="h5" size="md" className="opp-cluster-execution__sub-title">
                {t('ClusterQueue')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.name}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Flavor')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.flavor}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Pending')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.pending}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Active')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.active}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </GridItem>

            {/* Panel 3: Cluster Info */}
            <GridItem sm={12} md={4}>
              <Title headingLevel="h4" size="md" className="opp-cluster-execution__panel-title">
                {t('Cluster Info')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Cluster')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ClusterBadge
                      clusterName={clusterName}
                      clusterType={clusterInfo.type}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Region')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {clusterInfo.region} ({clusterInfo.regionName})
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Provider')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.provider}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('OCP version')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.ocpVersion}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Pipelines ver.')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.pipelinesVersion}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {clusterInfo.status}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <Divider className="opp-cluster-execution__divider" />
              <Title headingLevel="h5" size="md" className="opp-cluster-execution__sub-title">
                {t('Secret sync')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Last sync')}</DescriptionListTerm>
                  <DescriptionListDescription>{secretSync.lastSync}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Secrets synced')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {secretSync.synced} / {secretSync.total}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <a className="opp-cluster-execution__external-link" href="#">
                <ExternalLinkAltIcon /> {t('Open')} {clusterName} {t('console')}
              </a>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </div>
  );
};

export default ClusterExecutionCard;
