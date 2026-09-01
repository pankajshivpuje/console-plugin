import type { FC } from 'react';
import {
  Button,
  CodeBlock,
  CodeBlockCode,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import type { LogEntry } from '../__demo__/mock-cluster-data';

export interface AggregatedLogsSectionProps {
  logs: LogEntry[];
  clusterName: string;
}

const AggregatedLogsSection: FC<AggregatedLogsSectionProps> = ({
  logs,
  clusterName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (!logs?.length) {
    return null;
  }

  const logText = logs
    .map((entry) => {
      const step = entry.step ? `[${entry.step}] ` : '';
      return `[${entry.timestamp}] ${step}${entry.message}`;
    })
    .join('\n');

  return (
    <div className="opp-cluster-execution__logs">
      <Title
        headingLevel="h3"
        size="md"
        className="opp-cluster-execution__panel-title"
      >
        {t('Aggregated logs')}
      </Title>
      <CodeBlock>
        <CodeBlockCode>{logText}</CodeBlockCode>
      </CodeBlock>
      <Button
        variant="link"
        isInline
        component="a"
        href="#"
        icon={<ExternalLinkAltIcon />}
      >
        {t('View full logs on')} {clusterName}
      </Button>
    </div>
  );
};

export default AggregatedLogsSection;
