import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import './PipelineVisualizationLegend.scss';

type LegendItem = {
  label: string;
  badge: string;
  color: string;
};

const PipelineVisualizationLegend: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const items: LegendItem[] = [
    { label: t('Task'), badge: 'T', color: '#009596' },
    { label: t('Nested Pipeline'), badge: 'P', color: '#0066cc' },
    { label: t('Extended Task'), badge: 'ET', color: '#6a6e73' },
  ];

  return (
    <div className="odc-pipeline-visualization-legend">
      {items.map((item) => (
        <span key={item.badge} className="odc-pipeline-visualization-legend__item">
          <span
            className="odc-pipeline-visualization-legend__badge"
            style={{ backgroundColor: item.color }}
          >
            {item.badge}
          </span>
          {item.label}
        </span>
      ))}
    </div>
  );
};

export default PipelineVisualizationLegend;
