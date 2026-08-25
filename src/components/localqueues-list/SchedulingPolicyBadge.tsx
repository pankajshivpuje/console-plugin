import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@patternfly/react-core';
import type { SchedulingPolicy } from '../__demo__/mock-localqueue-data';

const CONFIG: Record<SchedulingPolicy, { key: string; color: 'purple' | 'blue' | 'teal' }> = {
  'hub-only': { key: 'Hub Only', color: 'purple' },
  'any-spoke': { key: 'Any Spoke', color: 'blue' },
  'selected-spokes': { key: 'Selected Spokes', color: 'teal' },
};

const SchedulingPolicyBadge: FC<{ policy: SchedulingPolicy }> = ({ policy }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { key, color } = CONFIG[policy];
  return (
    <Label isCompact color={color}>
      {t(key)}
    </Label>
  );
};

export default SchedulingPolicyBadge;
