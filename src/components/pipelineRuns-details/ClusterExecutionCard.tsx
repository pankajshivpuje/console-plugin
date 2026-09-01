import type { FC } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  Flex,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { ClusterBadge, ResourceMeter, DispatchTimeline } from '../cluster';
import { useTranslation } from 'react-i18next';
import type { PipelineRunClusterData } from '../__demo__/mock-cluster-data';
import AggregatedLogsSection from './AggregatedLogsSection';

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
    logs,
  } = clusterData;

  const queueDisplay = `${resources.queueUsed} / ${resources.queueCapacity}`;
  const queuePercent = Math.round(
    (resources.queueUsed / resources.queueCapacity) * 100,
  );

  return (
    <Card className="opp-cluster-execution">
      <CardHeader>
        <Flex
          alignItems={{ default: 'alignItemsCenter' }}
          gap={{ default: 'gapMd' }}
        >
          <CardTitle component="h2">{t('Cluster Execution')}</CardTitle>
          <ClusterBadge
            clusterName={clusterName}
            clusterType={clusterInfo.type}
            region={clusterInfo.region}
          />
        </Flex>
      </CardHeader>

      <CardBody>
        {/* A 3-column grid whose columns share row tracks, so the horizontal
            divider between each column's upper/lower section lands on one
            shared line and the vertical dividers span the full height. */}
        <div className="opp-cluster-execution__grid">
          {/* Row 1 — upper sections */}
          <div
            className="opp-cluster-execution__block"
            style={{ gridArea: 'c1t' }}
          >
            <Title headingLevel="h3" size="md">
              {t('Dispatch & Routing')}
            </Title>
            <DescriptionList
              isCompact
              isHorizontal
              className="opp-cluster-execution__dl"
            >
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
          </div>

          <div
            className="opp-cluster-execution__block"
            style={{ gridArea: 'c2t' }}
          >
            <Title headingLevel="h3" size="md">
              {t('Cluster Resources (at execution)')}
            </Title>
            <div>
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
            </div>
          </div>

          <div
            className="opp-cluster-execution__block"
            style={{ gridArea: 'c3t' }}
          >
            <Title headingLevel="h3" size="md">
              {t('Cluster Info')}
            </Title>
            <DescriptionList
              isCompact
              isHorizontal
              className="opp-cluster-execution__dl"
            >
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
                <DescriptionListDescription>{clusterInfo.status}</DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </div>

          {/* Vertical dividers spanning all rows */}
          <Divider
            orientation={{ default: 'vertical' }}
            className="opp-cluster-execution__vdivider"
            style={{ gridArea: 'v1' }}
          />
          <Divider
            orientation={{ default: 'vertical' }}
            className="opp-cluster-execution__vdivider"
            style={{ gridArea: 'v2' }}
          />

          {/* Row 2 — horizontal dividers, one per column, on a shared line */}
          <Divider className="opp-cluster-execution__hr" style={{ gridArea: 'h1' }} />
          <Divider className="opp-cluster-execution__hr" style={{ gridArea: 'h2' }} />
          <Divider className="opp-cluster-execution__hr" style={{ gridArea: 'h3' }} />

          {/* Row 3 — lower sections */}
          <div
            className="opp-cluster-execution__block"
            style={{ gridArea: 'c1b' }}
          >
            <Title headingLevel="h4" size="md">
              {t('Dispatch timeline')}
            </Title>
            <DispatchTimeline timeline={timeline} />
          </div>

          <div
            className="opp-cluster-execution__block"
            style={{ gridArea: 'c2b' }}
          >
            <Title headingLevel="h4" size="md">
              {t('ClusterQueue')}
            </Title>
            <DescriptionList
              isCompact
              isHorizontal
              className="opp-cluster-execution__dl"
            >
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
          </div>

          <div
            className="opp-cluster-execution__block"
            style={{ gridArea: 'c3b' }}
          >
            <Title headingLevel="h4" size="md">
              {t('Secret sync')}
            </Title>
            <DescriptionList
              isCompact
              isHorizontal
              className="opp-cluster-execution__dl"
            >
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
            <Button
              variant="link"
              isInline
              component="a"
              href="#"
              icon={<ExternalLinkAltIcon />}
            >
              {t('Open')} {clusterName} {t('console')}
            </Button>
          </div>
        </div>

        {logs?.length > 0 && (
          <>
            <Divider className="opp-cluster-execution__logs-divider" />
            <AggregatedLogsSection logs={logs} clusterName={clusterName} />
          </>
        )}
      </CardBody>
    </Card>
  );
};

export default ClusterExecutionCard;
