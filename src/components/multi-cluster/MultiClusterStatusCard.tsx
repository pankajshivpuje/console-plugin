import type { FC } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartDonut,
  ChartLabel,
  ChartLegend,
} from '@patternfly/react-charts/victory';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { chart_color_black_200 as othersColor } from '@patternfly/react-tokens/dist/js/chart_color_black_200';
import { chart_color_black_500 as cancelledColor } from '@patternfly/react-tokens/dist/js/chart_color_black_500';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { t_chart_global_danger_color_100 as failureColor } from '@patternfly/react-tokens/dist/js/t_chart_global_danger_color_100';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { MultiClusterPipelineRunKind, ComputedStatus } from '../../types';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';

type MultiClusterStatusCardProps = {
  pipelineRuns: MultiClusterPipelineRunKind[];
  bordered?: boolean;
};

const MultiClusterStatusCard: FC<MultiClusterStatusCardProps> = ({
  pipelineRuns,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const statusCounts = useMemo(() => {
    const counts = {
      succeeded: 0,
      failed: 0,
      running: 0,
      cancelled: 0,
      others: 0,
      total: 0,
    };
    for (const plr of pipelineRuns) {
      counts.total++;
      const status = pipelineRunFilterReducer(plr);
      switch (status) {
        case ComputedStatus.Succeeded:
          counts.succeeded++;
          break;
        case ComputedStatus.Failed:
        case ComputedStatus.FailedToStart:
          counts.failed++;
          break;
        case ComputedStatus.Running:
        case ComputedStatus['In Progress']:
        case ComputedStatus.Pending:
          counts.running++;
          break;
        case ComputedStatus.Cancelled:
        case ComputedStatus.Cancelling:
          counts.cancelled++;
          break;
        default:
          counts.others++;
          break;
      }
    }
    return counts;
  }, [pipelineRuns]);

  const pct = (n: number) =>
    statusCounts.total > 0
      ? Math.round((100 * n) / statusCounts.total)
      : 0;

  const donutData = [
    { x: t('Succeeded'), y: pct(statusCounts.succeeded) },
    { x: t('Failed'), y: pct(statusCounts.failed) },
    { x: t('Running'), y: pct(statusCounts.running) },
    { x: t('Cancelled'), y: pct(statusCounts.cancelled) },
    { x: t('Others'), y: pct(statusCounts.others) },
  ];

  const colorScale = [
    successColor.value,
    failureColor.value,
    runningColor.value,
    cancelledColor.value,
    othersColor.value,
  ];

  const legendData = donutData.map((d) => ({
    name: `${d.x}: ${isNaN(d.y) ? 0 : d.y}%`,
  }));

  return (
    <Card className={bordered ? 'card-border' : undefined}>
      <CardTitle>{t('Cross-Cluster PipelineRun Status')}</CardTitle>
      <CardBody>
        <div className="pf-v6-u-display-flex pf-v6-u-align-items-center pf-v6-u-justify-content-center">
          <ChartDonut
            constrainToVisibleArea
            data={donutData}
            labels={({ datum }) => `${datum.x}: ${datum.y}%`}
            legendData={legendData}
            colorScale={colorScale}
            legendOrientation="vertical"
            legendPosition="right"
            height={250}
            padding={{ bottom: 30, right: 140, top: 20 }}
            legendComponent={
              <ChartLegend
                data={legendData}
                style={{
                  labels: {
                    fill: 'var(--pf-t--global--text--color--regular)',
                    fontSize: 14,
                  },
                }}
              />
            }
            subTitle={t('Succeeded')}
            subTitleComponent={
              <ChartLabel
                style={{
                  fill: 'var(--pf-t--global--text--color--subtle)',
                  fontSize: 14,
                }}
              />
            }
            title={`${statusCounts.succeeded}/${statusCounts.total}`}
            titleComponent={
              <ChartLabel
                style={{
                  fill: 'var(--pf-t--global--text--color--regular)',
                  fontSize: 24,
                }}
              />
            }
            width={400}
          />
        </div>
      </CardBody>
    </Card>
  );
};

export default MultiClusterStatusCard;
