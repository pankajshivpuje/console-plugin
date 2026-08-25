import { render, screen } from '@testing-library/react';
import FleetOverviewTab from '../FleetOverviewTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />,
  ChartAxis: () => <div />,
  ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>,
  ChartStack: ({ children }: any) => <div>{children}</div>,
  ChartLine: () => <div />,
  ChartVoronoiContainer: () => <div />,
  ChartThemeColor: { multiOrdered: 'multiOrdered', blue: 'blue' },
}));

describe('FleetOverviewTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };

  it('renders the fleet KPIs and health table', () => {
    render(<FleetOverviewTab filter={filter} />);
    screen.getByText('Fleet success rate');
    screen.getByText((content) => content.replace(/[^0-9]/g, '') === '12847');
    screen.getByText('Spoke fleet health');
  });

  it('shows an empty state when no spokes selected', () => {
    render(<FleetOverviewTab filter={{ ...filter, selectedSpokes: [] }} />);
    screen.getByText('No spoke clusters selected');
  });
});
