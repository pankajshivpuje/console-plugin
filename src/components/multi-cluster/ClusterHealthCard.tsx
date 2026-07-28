import type { FC, ComponentType } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  Grid,
  GridItem,
  Icon,
  Label,
  Title,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  QuestionCircleIcon,
} from '@patternfly/react-icons';
import { ClusterInfo, MultiClusterPipelineRunKind } from '../../types';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';
import { ComputedStatus } from '../../types';

type ClusterHealthCardProps = {
  clusters: ClusterInfo[];
  pipelineRuns: MultiClusterPipelineRunKind[];
  bordered?: boolean;
};

const statusIconMap: Record<
  ClusterInfo['status'],
  { icon: ComponentType; color: string }
> = {
  Ready: {
    icon: CheckCircleIcon,
    color: 'var(--pf-t--global--color--status--success--default)',
  },
  NotReady: {
    icon: ExclamationCircleIcon,
    color: 'var(--pf-t--global--color--status--danger--default)',
  },
  Unknown: {
    icon: QuestionCircleIcon,
    color: 'var(--pf-t--global--color--status--info--default)',
  },
};

const ClusterHealthCard: FC<ClusterHealthCardProps> = ({
  clusters,
  pipelineRuns,
  bordered,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const plrCountsByCluster = useMemo(() => {
    const counts: Record<
      string,
      { total: number; succeeded: number; failed: number; running: number }
    > = {};
    for (const plr of pipelineRuns) {
      const cluster = plr._clusterName || 'unknown';
      if (!counts[cluster]) {
        counts[cluster] = { total: 0, succeeded: 0, failed: 0, running: 0 };
      }
      counts[cluster].total++;
      const status = pipelineRunFilterReducer(plr);
      if (status === ComputedStatus.Succeeded) counts[cluster].succeeded++;
      else if (
        status === ComputedStatus.Failed ||
        status === ComputedStatus.FailedToStart
      )
        counts[cluster].failed++;
      else if (
        status === ComputedStatus.Running ||
        status === ComputedStatus['In Progress'] ||
        status === ComputedStatus.Pending
      )
        counts[cluster].running++;
    }
    return counts;
  }, [pipelineRuns]);

  return (
    <Card className={bordered ? 'card-border' : undefined}>
      <CardTitle>{t('Cluster Health')}</CardTitle>
      <CardBody>
        <Grid hasGutter>
          {clusters.map((cluster) => {
            const { icon: StatusIcon } =
              statusIconMap[cluster.status] || statusIconMap.Unknown;
            const counts = plrCountsByCluster[cluster.name] || {
              total: 0,
              succeeded: 0,
              failed: 0,
              running: 0,
            };

            return (
              <GridItem key={cluster.name} xl2={4} xl={4} lg={6} md={6} sm={12}>
                <Card isCompact isPlain>
                  <CardBody>
                    <Flex
                      alignItems={{ default: 'alignItemsCenter' }}
                      gap={{ default: 'gapSm' }}
                    >
                      <FlexItem>
                        <Icon status={cluster.status === 'Ready' ? 'success' : cluster.status === 'NotReady' ? 'danger' : 'info'}>
                          <StatusIcon />
                        </Icon>
                      </FlexItem>
                      <FlexItem>
                        <Title headingLevel="h4" size="md">
                          {cluster.name}
                        </Title>
                      </FlexItem>
                    </Flex>
                    <Flex
                      className="pf-v6-u-mt-sm"
                      gap={{ default: 'gapSm' }}
                    >
                      <FlexItem>
                        <Label color="blue" isCompact>
                          {t('{{count}} total', { count: counts.total })}
                        </Label>
                      </FlexItem>
                      {counts.succeeded > 0 && (
                        <FlexItem>
                          <Label color="green" isCompact>
                            {t('{{count}} succeeded', {
                              count: counts.succeeded,
                            })}
                          </Label>
                        </FlexItem>
                      )}
                      {counts.failed > 0 && (
                        <FlexItem>
                          <Label color="red" isCompact>
                            {t('{{count}} failed', { count: counts.failed })}
                          </Label>
                        </FlexItem>
                      )}
                      {counts.running > 0 && (
                        <FlexItem>
                          <Label color="blue" isCompact>
                            {t('{{count}} running', { count: counts.running })}
                          </Label>
                        </FlexItem>
                      )}
                    </Flex>
                  </CardBody>
                </Card>
              </GridItem>
            );
          })}
        </Grid>
      </CardBody>
    </Card>
  );
};

export default ClusterHealthCard;
