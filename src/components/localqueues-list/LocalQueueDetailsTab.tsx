import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import type { LocalQueue, QueueQuota } from '../__demo__/mock-localqueue-data';
import { getLocalQueueWorkloads } from '../__demo__/mock-localqueue-data';
import SchedulingPolicyBadge from './SchedulingPolicyBadge';
import LocalQueueStatusIcon from './LocalQueueStatusIcon';
import { TargetClusters } from './presenters';
import ResourceMeter from '../cluster/ResourceMeter';

const pct = (used: number, total: number): number =>
  total > 0 ? Math.round((used / total) * 100) : 0;

const LocalQueueDetailsTab: FC<{ lq: LocalQueue }> = ({ lq }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const workloads = getLocalQueueWorkloads(lq.name);
  const pending = workloads.filter((w) => w.status === 'Pending').length;
  const admitted = workloads.length - pending;

  const quota: QueueQuota = lq.quota;

  return (
    <Grid hasGutter className="pf-v6-u-mt-md">
      <GridItem md={6}>
        <Card>
          <CardTitle>{t('Details')}</CardTitle>
          <CardBody>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                <DescriptionListDescription>{lq.name}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Namespace')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {lq.namespace}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Resource Flavor')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {lq.resourceFlavor}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('ClusterQueue')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {lq.clusterQueue}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Scheduling Policy')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <SchedulingPolicyBadge policy={lq.schedulingPolicy} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Target Clusters')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <TargetClusters lq={lq} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                <DescriptionListDescription>
                  <LocalQueueStatusIcon status={lq.status} />
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>{t('Last Updated')}</DescriptionListTerm>
                <DescriptionListDescription>
                  {lq.lastUpdated}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>
      </GridItem>

      <GridItem md={6}>
        <Stack hasGutter>
          <StackItem>
            <Card>
              <CardTitle>{t('Resource usage')}</CardTitle>
              <CardBody>
                <Stack hasGutter>
                  <StackItem>
                    <ResourceMeter
                      label={t('CPU')}
                      value={pct(quota.cpu.used, quota.cpu.total)}
                      displayValue={`${quota.cpu.used} / ${quota.cpu.total} ${t('cores')}`}
                    />
                  </StackItem>
                  <StackItem>
                    <ResourceMeter
                      label={t('Memory')}
                      value={pct(quota.memoryGi.used, quota.memoryGi.total)}
                      displayValue={`${quota.memoryGi.used} / ${quota.memoryGi.total} ${t('GiB')}`}
                    />
                  </StackItem>
                </Stack>
              </CardBody>
            </Card>
          </StackItem>
          <StackItem>
            <Card>
              <CardTitle>{t('Workloads')}</CardTitle>
              <CardBody>
                <DescriptionList isHorizontal>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Admitted')}</DescriptionListTerm>
                    <DescriptionListDescription data-testid="admitted-count">
                      {admitted}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Pending')}</DescriptionListTerm>
                    <DescriptionListDescription data-testid="pending-count">
                      {pending}
                    </DescriptionListDescription>
                  </DescriptionListGroup>
                </DescriptionList>
              </CardBody>
            </Card>
          </StackItem>
        </Stack>
      </GridItem>
    </Grid>
  );
};

export default LocalQueueDetailsTab;
