import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const DOTS: { key: string; className: string }[] = [
  { key: 'Connected', className: 'opp-connectivity-dot--connected' },
  { key: 'Idle', className: 'opp-connectivity-dot--idle' },
  { key: 'Disconnected', className: 'opp-connectivity-dot--disconnected' },
];

const ConnectivityLegend: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <span className="opp-connectivity-legend">
      {DOTS.map((d) => (
        <span key={d.key} className="opp-connectivity-legend__item">
          <span className={`opp-connectivity-dot ${d.className}`} />
          {t(d.key)}
        </span>
      ))}
    </span>
  );
};

export default ConnectivityLegend;
