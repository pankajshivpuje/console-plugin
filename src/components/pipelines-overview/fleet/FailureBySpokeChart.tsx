import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import {
  Chart,
  ChartAxis,
  ChartBar,
  ChartStack,
  ChartThemeColor,
  ChartTooltip,
} from '@patternfly/react-charts/victory';
import { SpokeMetrics } from '../../__demo__/mock-fleet-data';

interface FailureBySpokeChartProps {
  metrics: SpokeMetrics[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const FailureBySpokeChart: FC<FailureBySpokeChartProps> = ({ metrics }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  // One stacked series per weekday; each series holds one point per spoke.
  const series = DAYS.map((day, dayIndex) =>
    metrics.map((m) => ({
      name: day,
      x: m.name,
      y: m.failureDensity[dayIndex],
      label: `${m.name} — ${day}: ${m.failureDensity[dayIndex]}`,
    })),
  );

  const legendData = DAYS.map((day) => ({ name: day }));

  return (
    <Card className="card-border" isFullHeight>
      <CardTitle>{t('Failure density by spoke')}</CardTitle>
      <CardBody>
        <Chart
          ariaTitle={t('Failure density by spoke')}
          ariaDesc={t('Stacked count of failed runs per spoke, broken down by day of week')}
          height={240}
          padding={{ top: 20, bottom: 70, left: 110, right: 20 }}
          domainPadding={{ x: [15, 15] }}
          themeColor={ChartThemeColor.multiOrdered}
          legendData={legendData}
          legendPosition="bottom-left"
        >
          <ChartAxis />
          <ChartAxis dependentAxis showGrid />
          <ChartStack horizontal>
            {series.map((data, i) => (
              <ChartBar
                key={DAYS[i]}
                data={data}
                labelComponent={<ChartTooltip constrainToVisibleArea />}
              />
            ))}
          </ChartStack>
        </Chart>
      </CardBody>
    </Card>
  );
};

export default FailureBySpokeChart;
