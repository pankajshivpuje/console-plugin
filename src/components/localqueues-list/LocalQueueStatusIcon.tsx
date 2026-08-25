import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import type { LocalQueueStatus } from '../__demo__/mock-localqueue-data';

const CONFIG: Record<
  LocalQueueStatus,
  { icon: ReactNode; status: 'success' | 'warning' | 'danger' }
> = {
  Ready: { icon: <CheckCircleIcon />, status: 'success' },
  Pending: { icon: <InProgressIcon />, status: 'warning' },
  Error: { icon: <ExclamationCircleIcon />, status: 'danger' },
};

const LocalQueueStatusIcon: FC<{ status: LocalQueueStatus }> = ({ status }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { icon, status: iconStatus } = CONFIG[status];
  return (
    <span className="pf-v6-l-flex pf-v6-u-align-items-center pf-v6-l-gap-sm">
      <Icon status={iconStatus}>{icon}</Icon> {t(status)}
    </span>
  );
};

export default LocalQueueStatusIcon;
