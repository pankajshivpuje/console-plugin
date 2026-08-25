import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Chart,
  ChartAxis,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import FleetStatCard from './FleetStatCard';
import type { FleetFilterState } from './types';
import {
  getBuildTimeStats,
  getBuildTimeTrend,
  getSlowestPipelines,
} from '../../__demo__/mock-fleet-data';

interface BuildTimesTabProps {
  filter: FleetFilterState;
}

const BuildTimesTab: FC<BuildTimesTabProps> = ({ filter }) => {
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

  const stats = getBuildTimeStats(selectedSpokes);
  const trend = getBuildTimeTrend(selectedSpokes);
  const slowest = getSlowestPipelines(selectedSpokes);

  return (
    <>
      <Gallery hasGutter minWidths={{ default: '220px' }} className="pf-v6-u-mb-md">
        <FleetStatCard label={t('Fleet P50')} value={stats.p50Label} />
        <FleetStatCard label={t('Fleet P95')} value={stats.p95Label} />
        <FleetStatCard label={t('Fleet P99')} value={stats.p99Label} />
        <FleetStatCard
          label={t('Timed out runs')}
          value={`${stats.timedOut}`}
          valueClassName="opp-fleet-value--danger"
        />
      </Gallery>

      <Grid hasGutter>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('P50 build time trend')}</CardTitle>
            <CardBody>
              <Chart
                height={240}
                padding={{ top: 20, bottom: 40, left: 60, right: 20 }}
                themeColor={ChartThemeColor.blue}
                containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
              >
                <ChartAxis />
                <ChartAxis dependentAxis />
                <ChartLine data={trend} />
              </Chart>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('Slowest pipelines (fleet-wide)')}</CardTitle>
            <CardBody>
              <Table variant="compact" aria-label={t('Slowest pipelines (fleet-wide)')}>
                <Thead>
                  <Tr>
                    <Th>{t('Pipeline')}</Th>
                    <Th>{t('Spoke')}</Th>
                    <Th>{t('P50')}</Th>
                    <Th>{t('P95')}</Th>
                    <Th>{t('Runs')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {slowest.map((r) => (
                    <Tr key={`${r.pipeline}-${r.spoke}`}>
                      <Td dataLabel={t('Pipeline')}>{r.pipeline}</Td>
                      <Td dataLabel={t('Spoke')}>{r.spoke}</Td>
                      <Td dataLabel={t('P50')}>{r.p50}</Td>
                      <Td dataLabel={t('P95')}>{r.p95}</Td>
                      <Td dataLabel={t('Runs')}>{r.runs}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </>
  );
};

export default BuildTimesTab;
