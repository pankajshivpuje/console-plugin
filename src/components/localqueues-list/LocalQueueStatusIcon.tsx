import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Flex, FlexItem } from '@patternfly/react-core';
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
    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Icon status={iconStatus}>{icon}</Icon>
      </FlexItem>
      <FlexItem>{t(status)}</FlexItem>
    </Flex>
  );
};

export default LocalQueueStatusIcon;
