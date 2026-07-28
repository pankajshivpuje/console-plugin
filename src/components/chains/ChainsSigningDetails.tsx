import type { FC } from 'react';
import {
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Label,
  LabelGroup,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ChainsSigningStatus, ChainsSigningSummary } from '../../types';
import { ExternalLink } from '../utils/link';

interface ChainsSigningDetailsProps {
  summary: ChainsSigningSummary;
  loaded: boolean;
}

const ChainsSigningDetails: FC<ChainsSigningDetailsProps> = ({
  summary,
  loaded,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (!loaded || summary.status === ChainsSigningStatus.Unknown) {
    return null;
  }

  const statusText =
    summary.status === ChainsSigningStatus.Signed
      ? t('All {{count}} tasks signed', { count: summary.totalTaskRuns })
      : summary.status === ChainsSigningStatus.Partial
        ? t('{{signed}} of {{total}} tasks signed', {
            signed: summary.signedCount,
            total: summary.totalTaskRuns,
          })
        : t('Unsigned');

  const statusColor =
    summary.status === ChainsSigningStatus.Signed
      ? 'green'
      : summary.status === ChainsSigningStatus.Partial
        ? 'orange'
        : 'grey';

  return (
    <>
      <DescriptionListGroup data-test="chains-signing">
        <DescriptionListTerm>{t('Signing')}</DescriptionListTerm>
        <DescriptionListDescription>
          <Label color={statusColor}>{statusText}</Label>
        </DescriptionListDescription>
      </DescriptionListGroup>
      {summary.transparencyUrl && (
        <DescriptionListGroup data-test="chains-transparency">
          <DescriptionListTerm>{t('Transparency log')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ExternalLink href={summary.transparencyUrl}>
              {t('View log')}
            </ExternalLink>
          </DescriptionListDescription>
        </DescriptionListGroup>
      )}
      {summary.taskRunDetails.length > 0 &&
        summary.status === ChainsSigningStatus.Partial && (
          <DescriptionListGroup data-test="chains-task-details">
            <DescriptionListTerm>{t('Task signing')}</DescriptionListTerm>
            <DescriptionListDescription>
              <LabelGroup>
                {summary.taskRunDetails.map((detail) => (
                  <Label
                    key={detail.name}
                    color={detail.signed ? 'green' : 'grey'}
                  >
                    {detail.pipelineTaskName || detail.name}
                  </Label>
                ))}
              </LabelGroup>
            </DescriptionListDescription>
          </DescriptionListGroup>
        )}
    </>
  );
};

export default ChainsSigningDetails;
