import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Flex,
  FlexItem,
  Gallery,
} from '@patternfly/react-core';
import classNames from 'classnames';
import { ClusterBadge } from '../../cluster';
import type { FleetFilterState } from './types';
import {
  formatBuildTime,
  getSpokeMetrics,
} from '../../__demo__/mock-fleet-data';

interface SpokeComparisonTabProps {
  filter: FleetFilterState;
}

const Metric: FC<{ label: string; value: string }> = ({ label, value }) => (
  <FlexItem>
    <div className="opp-fleet-stat-card__label">{label}</div>
    <div>{value}</div>
  </FlexItem>
);

const SpokeComparisonTab: FC<SpokeComparisonTabProps> = ({ filter }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { selectedSpokes } = filter;

  if (selectedSpokes.length === 0) {
    return (
      <EmptyState titleText={t('No spoke clusters selected')} headingLevel="h4">
        <EmptyStateBody>
          {t('Select at least one spoke cluster to view fleet metrics.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  const metrics = getSpokeMetrics(selectedSpokes);

  return (
    <Gallery hasGutter minWidths={{ default: '320px' }}>
      {metrics.map((m) => (
        <Card
          key={m.name}
          className={classNames('opp-fleet-spoke-card', `opp-fleet-spoke-card--${m.status}`)}
        >
          <CardTitle>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <ClusterBadge clusterName={m.name} clusterType="spoke" />
              </FlexItem>
              <FlexItem>
                <span className="pf-v6-u-color-200">{m.region}</span>
              </FlexItem>
            </Flex>
          </CardTitle>
          <CardBody>
            <Flex
              flexWrap={{ default: 'wrap' }}
              spaceItems={{ default: 'spaceItemsLg' }}
            >
              <Metric label={t('Success rate')} value={`${m.successRate}%`} />
              <Metric label={t('Avg build')} value={formatBuildTime(m.avgBuildSec)} />
              <Metric label={t('CPU')} value={`${m.cpuUtil}%`} />
              <Metric label={t('Queue depth')} value={`${m.queueDepth}`} />
              <Metric label={t('Dispatched')} value={m.dispatched.toLocaleString()} />
              <Metric label={t('Memory')} value={`${m.memUtil}%`} />
            </Flex>
          </CardBody>
        </Card>
      ))}
    </Gallery>
  );
};

export default SpokeComparisonTab;
