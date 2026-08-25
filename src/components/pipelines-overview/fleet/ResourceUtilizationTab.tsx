import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  EmptyState,
  EmptyStateBody,
  Gallery,
  Grid,
  GridItem,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tr, Th, Tbody, Td } from '@patternfly/react-table';
import {
  Chart,
  ChartAxis,
  ChartLine,
  ChartThemeColor,
  ChartVoronoiContainer,
} from '@patternfly/react-charts/victory';
import { ResourceMeter } from '../../cluster';
import FleetStatCard from './FleetStatCard';
import type { FleetFilterState } from './types';
import {
  getCpuTrend,
  getResourceStats,
  getSpokeMetrics,
} from '../../__demo__/mock-fleet-data';
import type { SpokeMetrics } from '../../__demo__/mock-fleet-data';

interface ResourceUtilizationTabProps {
  filter: FleetFilterState;
}

const headroomColor: Record<
  SpokeMetrics['headroom'],
  'green' | 'blue' | 'orange' | 'red'
> = {
  Comfortable: 'green',
  Underutilized: 'blue',
  Tight: 'orange',
  Critical: 'red',
};

const ResourceUtilizationTab: FC<ResourceUtilizationTabProps> = ({ filter }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { selectedSpokes } = filter;

  if (selectedSpokes.length === 0) {
    return (
      <EmptyState titleText={t('No spoke clusters selected')} headingLevel="h4">
        <EmptyStateBody>
          {t('Select at least one spoke cluster to view fleet metrics.')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  const stats = getResourceStats(selectedSpokes);
  const cpuTrend = getCpuTrend(selectedSpokes);
  const metrics = getSpokeMetrics(selectedSpokes);

  return (
    <>
      <Gallery hasGutter minWidths={{ default: '220px' }} className="pf-v6-u-mb-md">
        <FleetStatCard label={t('Fleet avg CPU')} value={`${stats.avgCpu}%`} />
        <FleetStatCard label={t('Fleet avg memory')} value={`${stats.avgMem}%`} />
        <FleetStatCard
          label={t('Total vCPUs allocated')}
          value={`${stats.totalVcpus}`}
        />
        <FleetStatCard
          label={t('Total memory allocated')}
          value={`${stats.totalMemoryGi} Gi`}
        />
      </Gallery>

      <Grid hasGutter>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('CPU utilization trend')}</CardTitle>
            <CardBody>
              <Chart
                height={240}
                padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
                themeColor={ChartThemeColor.multiOrdered}
                containerComponent={<ChartVoronoiContainer constrainToVisibleArea />}
              >
                <ChartAxis />
                <ChartAxis dependentAxis />
                {cpuTrend.map((s) => (
                  <ChartLine key={s.name} data={s.data} name={s.name} />
                ))}
              </Chart>
            </CardBody>
          </Card>
        </GridItem>
        <GridItem md={6}>
          <Card className="card-border" isFullHeight>
            <CardTitle>{t('Node pool capacity')}</CardTitle>
            <CardBody>
              <Table variant="compact" aria-label={t('Node pool capacity')}>
                <Thead>
                  <Tr>
                    <Th>{t('Spoke')}</Th>
                    <Th>{t('Worker nodes')}</Th>
                    <Th>{t('vCPUs')}</Th>
                    <Th>{t('Memory')}</Th>
                    <Th>{t('CPU util')}</Th>
                    <Th>{t('Mem util')}</Th>
                    <Th>{t('Headroom')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {metrics.map((m) => (
                    <Tr key={m.name}>
                      <Td dataLabel={t('Spoke')}>{m.name}</Td>
                      <Td dataLabel={t('Worker nodes')}>{m.workerNodes}</Td>
                      <Td dataLabel={t('vCPUs')}>{m.vcpus}</Td>
                      <Td dataLabel={t('Memory')}>{m.memoryGi} Gi</Td>
                      <Td dataLabel={t('CPU util')}>
                        <ResourceMeter label={t('CPU')} value={m.cpuUtil} />
                      </Td>
                      <Td dataLabel={t('Mem util')}>
                        <ResourceMeter label={t('Memory')} value={m.memUtil} />
                      </Td>
                      <Td dataLabel={t('Headroom')}>
                        <Label color={headroomColor[m.headroom]}>
                          {t(m.headroom)}
                        </Label>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </>
  );
};

export default ResourceUtilizationTab;
