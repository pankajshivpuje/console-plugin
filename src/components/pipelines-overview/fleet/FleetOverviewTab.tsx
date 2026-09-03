import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartStack,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import FleetStatCard from './FleetStatCard';
import SpokeHealthTable from './SpokeHealthTable';
import FailureBySpokeChart from './FailureBySpokeChart';
import type { FleetFilterState } from './types';
import {
  getDispatchThroughput,
  getFleetKpis,
  getQueueDepthTrend,
  getSpokeMetrics,
  getSuccessRateTrend,
  getTopFailureReasons,
} from '../../__demo__/mock-fleet-data';

interface FleetOverviewTabProps {
  filter: FleetFilterState;
}

const ChartCard: FC<{ title: string; children: ReactNode }> = ({
  title,
  children,
}) => (
  <Card className="card-border" isFullHeight>
    <CardTitle>{title}</CardTitle>
    <CardBody>{children}</CardBody>
  </Card>
);

const FleetOverviewTab: FC<FleetOverviewTabProps> = ({ filter }) => {
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

  const kpis = getFleetKpis(selectedSpokes);
  const metrics = getSpokeMetrics(selectedSpokes);
  const successTrend = getSuccessRateTrend(selectedSpokes);
  const queueTrend = getQueueDepthTrend(selectedSpokes);
  const failureReasons = getTopFailureReasons(selectedSpokes);
  const throughput = getDispatchThroughput(selectedSpokes);
  const hasEdgeIssue = selectedSpokes.includes('spoke-edge');

  return (
    <>
      {hasEdgeIssue && (
        <Alert
          variant="warning"
          isInline
          title={t(
            'MultiKueue bottleneck detected on spoke-edge: CPU 91%, 23 pending PipelineRuns.',
          )}
          className="pf-v6-u-mb-md"
        />
      )}

      <Gallery hasGutter minWidths={{ default: '220px' }} className="pf-v6-u-mb-md">
        <FleetStatCard
          label={t('Fleet success rate')}
          value={`${kpis.successRate}%`}
          delta={`+${kpis.successRateDelta}%`}
          deltaVariant="up"
          spark={kpis.sparkSuccess}
        />
        <FleetStatCard
          label={t('Avg build time (P50)')}
          value={kpis.avgBuildLabel}
          spark={kpis.sparkBuild}
        />
        <FleetStatCard
          label={t('Dispatched PipelineRuns')}
          value={kpis.dispatchedTotal.toLocaleString()}
          delta={`+${kpis.dispatchedDelta}%`}
          deltaVariant="up"
          spark={kpis.sparkDispatched}
        />
        <FleetStatCard
          label={t('Active spoke clusters')}
          value={`${kpis.activeSpokes}`}
        />
      </Gallery>

      <Grid hasGutter className="pf-v6-u-mb-md">
        <GridItem md={6}>
          <ChartCard title={t('Success rate trend by spoke')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup>
                {successTrend.map((s) => (
                  <ChartLine key={s.name} data={s.data} name={s.name} />
                ))}
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={6}>
          <ChartCard title={t('Build time by spoke cluster (P50 / P95)')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 60, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              domainPadding={{ x: [20, 20] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup offset={11}>
                <ChartBar
                  data={metrics.map((m) => ({ x: m.name, y: m.avgBuildSec }))}
                />
                <ChartBar
                  data={metrics.map((m) => ({ x: m.name, y: m.p95BuildSec }))}
                />
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={6}>
          <ChartCard title={t('Spoke resource utilization')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 60, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              domainPadding={{ x: [20, 20] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup offset={11}>
                <ChartBar data={metrics.map((m) => ({ x: m.name, y: m.cpuUtil }))} />
                <ChartBar data={metrics.map((m) => ({ x: m.name, y: m.memUtil }))} />
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={6}>
          <FailureBySpokeChart metrics={metrics} />
        </GridItem>
      </Grid>

      <div className="pf-v6-u-mb-md">
        <SpokeHealthTable metrics={metrics} />
      </div>

      <Grid hasGutter>
        <GridItem md={4}>
          <ChartCard title={t('Top failure reasons (fleet-wide)')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 140, right: 20 }}
              themeColor={ChartThemeColor.blue}
              horizontal
              domainPadding={{ x: [10, 10] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartBar
                data={failureReasons.map((f) => ({ x: f.reason, y: f.count }))}
              />
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={4}>
          <ChartCard title={t('Hub dispatch throughput')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              domainPadding={{ x: [20, 20] }}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartStack>
                <ChartBar
                  data={throughput.map((p) => ({ x: p.x, y: p.succeeded }))}
                />
                <ChartBar data={throughput.map((p) => ({ x: p.x, y: p.failed }))} />
              </ChartStack>
            </Chart>
          </ChartCard>
        </GridItem>
        <GridItem md={4}>
          <ChartCard title={t('MultiKueue queue depth by spoke')}>
            <Chart
              height={220}
              padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
              themeColor={ChartThemeColor.multiOrdered}
              containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
            >
              <ChartAxis />
              <ChartAxis dependentAxis />
              <ChartGroup>
                {queueTrend.map((s) => (
                  <ChartLine key={s.name} data={s.data} name={s.name} />
                ))}
              </ChartGroup>
            </Chart>
          </ChartCard>
        </GridItem>
      </Grid>
    </>
  );
};

export default FleetOverviewTab;
