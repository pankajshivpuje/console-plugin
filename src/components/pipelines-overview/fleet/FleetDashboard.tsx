import type { FC } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PageSection,
  Tab,
  TabTitleText,
  Tabs,
  Title,
} from '@patternfly/react-core';
import FleetToolbar from './FleetToolbar';
import FleetOverviewTab from './FleetOverviewTab';
import BuildTimesTab from './BuildTimesTab';
import ResourceUtilizationTab from './ResourceUtilizationTab';
import SpokeComparisonTab from './SpokeComparisonTab';
import AlertsTab from './AlertsTab';
import type { FleetFilterState } from './types';
import { ALL_SPOKES } from '../../__demo__/mock-fleet-data';

import './fleet.scss';

const FleetDashboard: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [activeTab, setActiveTab] = useState<number>(0);
  const [filter, setFilter] = useState<FleetFilterState>({
    selectedSpokes: [...ALL_SPOKES],
    timeRange: 'Last 30 days',
    search: '',
  });

  const renderTab = () => {
    switch (activeTab) {
      case 1:
        return <BuildTimesTab filter={filter} />;
      case 2:
        return <ResourceUtilizationTab filter={filter} />;
      case 3:
        return <SpokeComparisonTab filter={filter} />;
      case 4:
        return <AlertsTab filter={filter} />;
      default:
        return <FleetOverviewTab filter={filter} />;
    }
  };

  return (
    <>
      <PageSection hasBodyWrapper={false} className="pf-v6-u-pb-0">
        <Title headingLevel="h1">{t('Overview')}</Title>
      </PageSection>
      <PageSection
        hasBodyWrapper={false}
        type="tabs"
        padding={{ default: 'noPadding' }}
      >
        <Tabs
          usePageInsets
          activeKey={activeTab}
          onSelect={(_e, key) => setActiveTab(Number(key))}
          aria-label={t('Overview tabs')}
        >
          <Tab eventKey={0} title={<TabTitleText>{t('Dashboard')}</TabTitleText>} />
          <Tab eventKey={1} title={<TabTitleText>{t('Build Times')}</TabTitleText>} />
          <Tab
            eventKey={2}
            title={<TabTitleText>{t('Resource Utilization')}</TabTitleText>}
          />
          <Tab
            eventKey={3}
            title={<TabTitleText>{t('Spoke Comparison')}</TabTitleText>}
          />
          <Tab eventKey={4} title={<TabTitleText>{t('Alerts')}</TabTitleText>} />
        </Tabs>
      </PageSection>
      <PageSection hasBodyWrapper={false}>
        <FleetToolbar filter={filter} onChange={setFilter} />
        <div className="pf-v6-u-mt-md">{renderTab()}</div>
      </PageSection>
    </>
  );
};

export default FleetDashboard;
