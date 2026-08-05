import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Grid,
  GridItem,
  CodeBlock,
  CodeBlockCode,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { RoutingPill, ResourceMeter } from '../cluster';
import type { PipelineRunClusterData } from '../__demo__/mock-cluster-data';
import { useTranslation } from 'react-i18next';

import './PipelineRunExpandedContent.scss';

export interface PipelineRunExpandedContentProps {
  clusterData: PipelineRunClusterData;
  clusterName: string;
}

const PipelineRunExpandedContent: FC<PipelineRunExpandedContentProps> = ({
  clusterData,
  clusterName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { routing, resources, logs } = clusterData;

  const logText = logs
    .map((entry) => {
      const step = entry.step ? `[${entry.step}] ` : '';
      return `[${entry.timestamp}] ${step}${entry.message}`;
    })
    .join('\n');

  const queueDisplay = `${resources.queueUsed}/${resources.queueCapacity}`;
  const queuePercent = Math.round(
    (resources.queueUsed / resources.queueCapacity) * 100,
  );

  return (
    <Grid hasGutter className="opp-plr-expanded">
      <GridItem sm={12} md={4}>
        <Title headingLevel="h4" size="md" className="opp-plr-expanded__title">
          {t('Routing Decision')}
        </Title>
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Dispatched by')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.dispatchedBy}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Target cluster')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.targetCluster}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Reason')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.reason}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Queue wait')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.queueWait}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {routing.alternatives && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Alternatives')}</DescriptionListTerm>
              <DescriptionListDescription>
                {routing.alternatives}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
        <div className="opp-plr-expanded__pill">
          <RoutingPill
            quality={routing.routeQuality}
            text={
              routing.routeQuality === 'optimal'
                ? t('Optimal route')
                : t('Constrained route — no alternatives')
            }
          />
        </div>
      </GridItem>

      <GridItem sm={12} md={4}>
        <Title headingLevel="h4" size="md" className="opp-plr-expanded__title">
          {t('Aggregated Logs')} ({clusterName})
        </Title>
        <CodeBlock>
          <CodeBlockCode>{logText}</CodeBlockCode>
        </CodeBlock>
        <a className="opp-plr-expanded__link" href="#">
          <ExternalLinkAltIcon /> {t('View full logs on')} {clusterName}
        </a>
      </GridItem>

      <GridItem sm={12} md={4}>
        <Title headingLevel="h4" size="md" className="opp-plr-expanded__title">
          {t('Cluster Resources')}
        </Title>
        <ResourceMeter label={t('CPU')} value={resources.cpuPercent} />
        <ResourceMeter label={t('Memory')} value={resources.memoryPercent} />
        <ResourceMeter
          label={t('Queue')}
          value={queuePercent}
          displayValue={queueDisplay}
        />
        <div className="opp-plr-expanded__node-info">
          {t('Node:')} {resources.node} &middot; {resources.vCPU} vCPU &middot;{' '}
          {resources.ramGi}Gi
        </div>
      </GridItem>
    </Grid>
  );
};

export default PipelineRunExpandedContent;
