import type { FC } from 'react';
import { Chart, ChartArea } from '@patternfly/react-charts/victory';

interface SparklineProps {
  values: number[];
  color?: string;
}

const Sparkline: FC<SparklineProps> = ({ values, color }) => {
  if (!values?.length) return null;
  const data = values.map((y, i) => ({ x: i + 1, y }));
  return (
    <Chart
      ariaDesc="sparkline"
      height={40}
      width={120}
      padding={{ top: 4, bottom: 4, left: 4, right: 4 }}
    >
      <ChartArea
        data={data}
        style={{
          data: {
            stroke: color ?? 'var(--pf-t--global--color--brand--default)',
            fill: 'var(--pf-t--global--color--brand--100)',
          },
        }}
      />
    </Chart>
  );
};

export default Sparkline;
