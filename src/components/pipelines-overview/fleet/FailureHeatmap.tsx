import { Fragment } from 'react';
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { SpokeMetrics } from '../../__demo__/mock-fleet-data';

interface FailureHeatmapProps {
  metrics: SpokeMetrics[];
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const cellColor = (value: number, max: number): string => {
  if (max === 0 || value === 0)
    return 'var(--pf-t--global--background--color--secondary--default)';
  const intensity = Math.min(1, value / max);
  // blend toward danger red by opacity
  return `rgba(201, 25, 11, ${0.15 + intensity * 0.85})`;
};

const FailureHeatmap: FC<FailureHeatmapProps> = ({ metrics }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const max = Math.max(
    1,
    ...metrics.flatMap((m) => m.failureDensity),
  );
  return (
    <Card className="card-border">
      <CardTitle>{t('Failure density by spoke')}</CardTitle>
      <CardBody>
        <div
          className="opp-fleet-heatmap"
          style={{ gridTemplateColumns: `120px repeat(${DAYS.length}, 1fr)` }}
        >
          <span />
          {DAYS.map((d) => (
            <span key={d} className="opp-fleet-heatmap__collabel">
              {d}
            </span>
          ))}
          {metrics.map((m) => (
            <Fragment key={m.name}>
              <span className="opp-fleet-heatmap__rowlabel">
                {m.name}
              </span>
              {m.failureDensity.map((v, i) => (
                <div
                  key={`${m.name}-${i}`}
                  className="opp-fleet-heatmap__cell"
                  title={`${m.name} ${DAYS[i]}: ${v}`}
                  style={{ backgroundColor: cellColor(v, max) }}
                />
              ))}
            </Fragment>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default FailureHeatmap;
