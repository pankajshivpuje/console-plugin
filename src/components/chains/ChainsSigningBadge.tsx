import type { FC } from 'react';
import { Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import SignedBadgeIcon from '../../images/SignedBadge';
import {
  ChainsSigningStatus,
  ChainsSigningSummary,
} from '../../types';

interface ChainsSigningBadgeProps {
  summary: ChainsSigningSummary;
  iconSize?: number;
}

const ChainsSigningBadge: FC<ChainsSigningBadgeProps> = ({
  summary,
  iconSize = 16,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (
    summary.status === ChainsSigningStatus.Unknown ||
    summary.status === ChainsSigningStatus.Unsigned
  ) {
    return null;
  }

  const tooltipContent =
    summary.status === ChainsSigningStatus.Signed
      ? summary.totalTaskRuns > 0
        ? t('All {{count}} tasks signed', { count: summary.totalTaskRuns })
        : t('Signed')
      : t('{{signed}} of {{total}} tasks signed', {
          signed: summary.signedCount,
          total: summary.totalTaskRuns,
        });

  return (
    <Tooltip content={tooltipContent}>
      <div className="opp-chains-signing-badge">
        <SignedBadgeIcon
          width={iconSize}
          height={iconSize}
          status={summary.status}
        />
      </div>
    </Tooltip>
  );
};

export default ChainsSigningBadge;
