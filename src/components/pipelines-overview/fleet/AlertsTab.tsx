import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gallery } from '@patternfly/react-core';
import FleetStatCard from './FleetStatCard';
import AlertRow from './AlertRow';
import type { FleetFilterState } from './types';
import {
  getAlertSummary,
  getFleetAlerts,
  FleetAlert,
} from '../../__demo__/mock-fleet-data';

interface AlertsTabProps {
  filter: FleetFilterState;
}

const AlertsTab: FC<AlertsTabProps> = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const summary = getAlertSummary();
  const [alerts, setAlerts] = useState<FleetAlert[]>(getFleetAlerts());
  const [silenced, setSilenced] = useState<string[]>([]);

  const acknowledge = (id: string) =>
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, state: 'acknowledged' } : a)),
    );
  const silence = (id: string) => setSilenced((prev) => [...prev, id]);

  const visible = alerts.filter((a) => !silenced.includes(a.id));
  const activeCount = visible.filter((a) => a.state === 'active').length;
  const ackCount = visible.filter((a) => a.state === 'acknowledged').length;

  return (
    <>
      <Gallery hasGutter minWidths={{ default: '260px' }} className="pf-v6-u-mb-md">
        <FleetStatCard
          label={t('Active alerts')}
          value={`${activeCount}`}
          valueClassName="opp-fleet-value--danger"
        />
        <FleetStatCard
          label={t('Acknowledged')}
          value={`${ackCount}`}
          valueClassName="opp-fleet-value--warning"
        />
        <FleetStatCard
          label={t('Resolved (last 7d)')}
          value={`${summary.resolved}`}
          valueClassName="opp-fleet-value--success"
        />
      </Gallery>

      {visible.map((a) => (
        <AlertRow
          key={a.id}
          alert={a}
          onAcknowledge={acknowledge}
          onSilence={silence}
        />
      ))}
    </>
  );
};

export default AlertsTab;
