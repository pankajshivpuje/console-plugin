import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bullseye,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { PipelineRunKind } from '../../types';

interface PipelineRunResult {
  name: string;
  value: string;
}

const PipelineRunOutput: FC<{ obj: PipelineRunKind }> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const status = obj?.status as
    | { results?: PipelineRunResult[]; pipelineResults?: PipelineRunResult[] }
    | undefined;
  const results = status?.results || status?.pipelineResults || [];

  if (results.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No output results')}</span>
      </Bullseye>
    );
  }

  return (
    <DescriptionList
      isHorizontal
      className="pf-v6-u-p-md"
      aria-label={t('Output')}
    >
      {results.map((r) => (
        <DescriptionListGroup key={r.name}>
          <DescriptionListTerm>{r.name}</DescriptionListTerm>
          <DescriptionListDescription>{r.value}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};

export default PipelineRunOutput;
