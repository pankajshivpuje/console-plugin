import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardBody, CardTitle } from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import { ClusterBadge } from '../../cluster';
import {
  SpokeMetrics,
  formatBuildTime,
} from '../../__demo__/mock-fleet-data';

interface SpokeHealthTableProps {
  metrics: SpokeMetrics[];
}

const statusLabel: Record<SpokeMetrics['status'], string> = {
  healthy: 'Ready',
  warning: 'Warning',
  critical: 'Degraded',
};

const SpokeHealthTable: FC<SpokeHealthTableProps> = ({ metrics }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <Card className="card-border">
      <CardTitle>{t('Spoke fleet health')}</CardTitle>
      <CardBody>
        <Table variant="compact" aria-label={t('Spoke fleet health')}>
          <Thead>
            <Tr>
              <Th>{t('Spoke cluster')}</Th>
              <Th>{t('Status')}</Th>
              <Th>{t('Dispatched')}</Th>
              <Th>{t('Success rate')}</Th>
              <Th>{t('Avg build')}</Th>
              <Th>{t('P95 build')}</Th>
              <Th>{t('CPU util')}</Th>
              <Th>{t('Memory util')}</Th>
              <Th>{t('Kueue queue')}</Th>
              <Th>{t('Region')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {metrics.map((m) => (
              <Tr key={m.name}>
                <Td dataLabel={t('Spoke cluster')}>
                  <ClusterBadge clusterName={m.name} clusterType="spoke" />
                </Td>
                <Td dataLabel={t('Status')}>{statusLabel[m.status]}</Td>
                <Td dataLabel={t('Dispatched')}>{m.dispatched.toLocaleString()}</Td>
                <Td dataLabel={t('Success rate')}>{m.successRate}%</Td>
                <Td dataLabel={t('Avg build')}>{formatBuildTime(m.avgBuildSec)}</Td>
                <Td dataLabel={t('P95 build')}>{formatBuildTime(m.p95BuildSec)}</Td>
                <Td dataLabel={t('CPU util')}>{m.cpuUtil}%</Td>
                <Td dataLabel={t('Memory util')}>{m.memUtil}%</Td>
                <Td dataLabel={t('Kueue queue')}>{m.queueDepth}</Td>
                <Td dataLabel={t('Region')}>{m.region}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};

export default SpokeHealthTable;
