import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import {
  Button,
  Card,
  CardBody,
  Flex,
  FlexItem,
  Split,
  SplitItem,
} from '@patternfly/react-core';
import {
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
} from '@patternfly/react-icons';
import type { FleetAlert } from '../../__demo__/mock-fleet-data';

interface AlertRowProps {
  alert: FleetAlert;
  onAcknowledge: (id: string) => void;
  onSilence: (id: string) => void;
}

const AlertRow: FC<AlertRowProps> = ({ alert, onAcknowledge, onSilence }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const Icon =
    alert.severity === 'critical'
      ? ExclamationCircleIcon
      : ExclamationTriangleIcon;
  const iconColor =
    alert.severity === 'critical'
      ? 'var(--pf-t--global--color--status--danger--default)'
      : 'var(--pf-t--global--color--status--warning--default)';

  return (
    <Card className={classNames('opp-fleet-alert', `opp-fleet-alert--${alert.severity}`)}>
      <CardBody>
        <Split hasGutter>
          <SplitItem>
            <Icon style={{ color: iconColor }} />
          </SplitItem>
          <SplitItem isFilled>
            <div className="pf-v6-u-font-weight-bold">{alert.title}</div>
            <div className="pf-v6-u-color-200 pf-v6-u-mb-sm">
              {alert.description}
            </div>
            <Flex spaceItems={{ default: 'spaceItemsLg' }}>
              <FlexItem>
                <span className="pf-v6-u-color-200">
                  {t('Fired')}: {alert.firedAt}
                </span>
              </FlexItem>
              <FlexItem>
                <span className="pf-v6-u-color-200">
                  {t('Duration')}: {alert.duration}
                </span>
              </FlexItem>
              <FlexItem>
                <span className="pf-v6-u-color-200">
                  {t('Source')}: {alert.source}
                </span>
              </FlexItem>
            </Flex>
          </SplitItem>
          {alert.state === 'active' && (
            <SplitItem>
              <Button
                variant="secondary"
                className="pf-v6-u-mr-sm"
                onClick={() => onAcknowledge(alert.id)}
              >
                {t('Acknowledge')}
              </Button>
              <Button variant="secondary" onClick={() => onSilence(alert.id)}>
                {t('Silence')}
              </Button>
            </SplitItem>
          )}
        </Split>
      </CardBody>
    </Card>
  );
};

export default AlertRow;
