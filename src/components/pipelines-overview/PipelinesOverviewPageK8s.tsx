import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Flex, FlexItem, PageSection, Title } from '@patternfly/react-core';
import {
  useActiveNamespace,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { formatPrometheusDuration, parsePrometheusDuration } from './dateTime';
import NameSpaceDropdown from './NamespaceDropdown';
import TimeRangeDropdown from './TimeRangeDropdown';
import RefreshDropdown from './RefreshDropdown';
import { IntervalOptions, TimeRangeOptionsK8s } from './utils';
import PipelineRunsStatusCardK8s from './PipelineRunsStatusCardK8s';
import PipelineRunsNumbersChartK8s from './PipelineRunsNumbersChartK8s';
import PipelineRunsTotalCardK8s from './PipelineRunsTotalCardK8s';
import PipelineRunsDurationCardK8s from './PipelineRunsDurationCardK8s';
import PipelineRunsListPageK8s from './list-pages/PipelineRunsListPageK8s';
import { K8sDataLimitationAlert } from './K8sDataLimitationAlert';
import { FLAGS } from '../../types';
import {
  ALL_NAMESPACES_KEY,
  FLAG_ACM_MULTI_CLUSTER_PIPELINES,
  LOCAL_CLUSTER_NAME,
} from '../../consts';
import AllProjectsPage from '../projects-list/AllProjectsPage';
import {
  usePersistedTimespanWithUrl,
  usePersistedIntervalWithUrl,
} from '../hooks/usePersistedFiltersForPipelineOverview';
import { useACMAvailability } from '../hooks/useACMAvailability';
import ClusterDropdown from '../multi-cluster/ClusterDropdown';
import MultiClusterOverviewCards from './MultiClusterOverviewCards';

import './PipelinesOverview.scss';

const PipelinesOverviewPageK8s: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const canListNS = useFlag(FLAGS.CAN_LIST_NS);
  const isMultiClusterEnabled = useFlag(FLAG_ACM_MULTI_CLUSTER_PIPELINES);
  const [activeNamespace, setActiveNamespace] = useActiveNamespace();

  const {
    isACMAvailable,
    managedClusters,
    loaded: acmLoaded,
  } = useACMAvailability();

  const [selectedCluster, setSelectedCluster] = useState<string>(
    LOCAL_CLUSTER_NAME,
  );

  const isMultiClusterView =
    isMultiClusterEnabled &&
    acmLoaded &&
    isACMAvailable &&
    selectedCluster !== LOCAL_CLUSTER_NAME;

  const [timespan, setTimespan] = usePersistedTimespanWithUrl(
    parsePrometheusDuration('1d'),
    {
      options: TimeRangeOptionsK8s(),
      displayFormat: formatPrometheusDuration,
      loadFormat: parsePrometheusDuration,
    },
    activeNamespace,
  );

  const [interval, setInterval] = usePersistedIntervalWithUrl(
    parsePrometheusDuration('30s'),
    {
      options: { ...IntervalOptions(), off: 'OFF_KEY' },
      displayFormat: (v) => (v ? formatPrometheusDuration(v) : 'off'),
      loadFormat: (v) => (v == 'off' ? null : parsePrometheusDuration(v)),
    },
    activeNamespace,
  );

  if (!canListNS && activeNamespace === ALL_NAMESPACES_KEY) {
    return <AllProjectsPage pageTitle={t('Overview')} />;
  }

  return (
    <>
      {isMultiClusterEnabled && acmLoaded && isACMAvailable && (
        <div className="pf-v6-u-pl-md pf-v6-u-pr-md pf-v6-u-pt-sm pf-v6-u-pb-sm pf-v6-u-background-color-100">
          <ClusterDropdown
            clusters={managedClusters}
            selected={selectedCluster}
            onSelect={setSelectedCluster}
          />
        </div>
      )}
      <PageSection hasBodyWrapper={false} className="pf-v6-u-pl-md">
        <Title headingLevel="h2">{t('Overview')}</Title>
      </PageSection>
      {!isMultiClusterView && (
        <div className="pf-v6-u-m-md">
          <K8sDataLimitationAlert />
        </div>
      )}
      <Flex className="pf-v6-u-pl-md pf-v6-u-pr-md pf-v6-u-mb-md">
        <FlexItem>
          <NameSpaceDropdown
            selected={activeNamespace}
            setSelected={setActiveNamespace}
          />
        </FlexItem>
        {!isMultiClusterView && (
          <>
            <FlexItem>
              <TimeRangeDropdown
                timespan={timespan}
                setTimespan={setTimespan}
              />
            </FlexItem>
            <FlexItem>
              <RefreshDropdown interval={interval} setInterval={setInterval} />
            </FlexItem>
          </>
        )}
      </Flex>
      <div className="pf-v6-u-pl-md pf-v6-u-pr-md">
        {isMultiClusterView ? (
          <MultiClusterOverviewCards
            namespace={activeNamespace}
            selectedCluster={selectedCluster}
            managedClusters={managedClusters}
            isACMAvailable={isACMAvailable}
          />
        ) : (
          <>
            <PipelineRunsStatusCardK8s
              timespan={timespan}
              domain={{ y: [0, 100] }}
              bordered={true}
              namespace={activeNamespace}
              interval={interval}
            />

            <Flex
              className="pf-v6-u-mt-md"
              alignItems={{ default: 'alignItemsStretch' }}
              gap={{ default: 'gapMd' }}
              flexWrap={{ default: 'wrap' }}
            >
              <FlexItem flex={{ default: 'flex_1' }}>
                <PipelineRunsDurationCardK8s
                  namespace={activeNamespace}
                  timespan={timespan}
                  interval={interval}
                  bordered={true}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <PipelineRunsTotalCardK8s
                  namespace={activeNamespace}
                  timespan={timespan}
                  interval={interval}
                  bordered={true}
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1', xl: 'flex_2' }}>
                <PipelineRunsNumbersChartK8s
                  namespace={activeNamespace}
                  timespan={timespan}
                  interval={interval}
                  domain={{ y: [0, 500] }}
                  bordered={true}
                />
              </FlexItem>
            </Flex>
            <div className="pf-v6-u-mt-md">
              <PipelineRunsListPageK8s
                namespace={activeNamespace}
                timespan={timespan}
                interval={interval}
                bordered
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default PipelinesOverviewPageK8s;
