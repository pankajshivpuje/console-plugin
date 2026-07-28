import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartGroup,
  ChartLegend,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { t_chart_global_danger_color_100 as failureColor } from '@patternfly/react-tokens/dist/js/t_chart_global_danger_color_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
import { ClusterInfo, MultiClusterPipelineRunKind, ComputedStatus } from '../../types';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';

type ClusterBreakdownCardProps = {
  clusters: ClusterInfo[];
  pipelineRuns: MultiClusterPipelineRunKind[];
  bordered?: boolean;
};

type ClusterStatusCounts = {
  succeeded: number;
  failed: number;
  running: number;
  cancelled: number;
};

const ClusterBreakdownCard: FC<ClusterBreakdownCardProps> = ({
  clusters,
  pipelineRuns,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const clusterCounts = useMemo(() => {
    const counts: Record<string, ClusterStatusCounts> = {};
    for (const c of clusters) {
      counts[c.name] = { succeeded: 0, failed: 0, running: 0, cancelled: 0 };
    }
    for (const plr of pipelineRuns) {
      const cluster = plr._clusterName || 'unknown';
      if (!counts[cluster]) {
        counts[cluster] = { succeeded: 0, failed: 0, running: 0, cancelled: 0 };
      }
      const status = pipelineRunFilterReducer(plr);
      switch (status) {
        case ComputedStatus.Succeeded:
          counts[cluster].succeeded++;
          break;
        case ComputedStatus.Failed:
        case ComputedStatus.FailedToStart:
          counts[cluster].failed++;
          break;
        case ComputedStatus.Running:
        case ComputedStatus['In Progress']:
        case ComputedStatus.Pending:
          counts[cluster].running++;
          break;
        case ComputedStatus.Cancelled:
        case ComputedStatus.Cancelling:
          counts[cluster].cancelled++;
          break;
      }
    }
    return counts;
  }, [clusters, pipelineRuns]);

  const clusterNames = clusters.map((c) => c.name);

  const succeededData = clusterNames.map((name) => ({
    x: name,
    y: clusterCounts[name]?.succeeded || 0,
    name: t('Succeeded'),
  }));
  const failedData = clusterNames.map((name) => ({
    x: name,
    y: clusterCounts[name]?.failed || 0,
    name: t('Failed'),
  }));
  const runningData = clusterNames.map((name) => ({
    x: name,
    y: clusterCounts[name]?.running || 0,
    name: t('Running'),
  }));
  const cancelledData = clusterNames.map((name) => ({
    x: name,
    y: clusterCounts[name]?.cancelled || 0,
    name: t('Cancelled'),
  }));

  const maxCount = Math.max(
    ...clusterNames.map(
      (name) =>
        (clusterCounts[name]?.succeeded || 0) +
        (clusterCounts[name]?.failed || 0) +
        (clusterCounts[name]?.running || 0) +
        (clusterCounts[name]?.cancelled || 0),
    ),
    1,
  );

  const colorScale = [
    successColor.value,
    failureColor.value,
    runningColor.value,
    cancelledColor.value,
  ];

  const legendData = [
    { name: t('Succeeded') },
    { name: t('Failed') },
    { name: t('Running') },
    { name: t('Cancelled') },
  ];

  const chartHeight = Math.max(200, clusterNames.length * 50 + 80);

  return (
    <Card className={bordered ? 'card-border' : undefined}>
      <CardTitle>{t('PipelineRuns by Cluster')}</CardTitle>
      <CardBody>
        <Chart
          containerComponent={
            <ChartVoronoiContainer
              labels={({ datum }) => `${datum.name}: ${datum.y}`}
              constrainToVisibleArea
            />
          }
          domainPadding={{ x: [20, 20] }}
          height={chartHeight}
          padding={{ top: 20, bottom: 60, left: 150, right: 40 }}
          colorScale={colorScale}
          width={600}
        >
          <ChartAxis
            style={{
              tickLabels: {
                fill: 'var(--pf-t--global--text--color--regular)',
                fontSize: 12,
              },
            }}
          />
          <ChartAxis
            dependentAxis
            style={{
              tickLabels: {
                fill: 'var(--pf-t--global--text--color--regular)',
                fontSize: 12,
              },
            }}
            domain={[0, maxCount + 1]}
          />
          <ChartGroup offset={12}>
            <ChartBar data={succeededData} />
            <ChartBar data={failedData} />
            <ChartBar data={runningData} />
            <ChartBar data={cancelledData} />
          </ChartGroup>
          <ChartLegend
            data={legendData}
            orientation="horizontal"
            y={chartHeight - 40}
            x={150}
            style={{
              labels: {
                fill: 'var(--pf-t--global--text--color--regular)',
                fontSize: 12,
              },
            }}
          />
        </Chart>
      </CardBody>
    </Card>
  );
};

export default ClusterBreakdownCard;
