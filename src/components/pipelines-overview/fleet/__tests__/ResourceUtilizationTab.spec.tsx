import { render, screen } from '@testing-library/react';
import ResourceUtilizationTab from '../ResourceUtilizationTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />, ChartAxis: () => <div />, ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>, ChartLine: () => <div />,
  ChartVoronoiContainer: () => <div />, ChartThemeColor: { blue: 'blue' },
}));

describe('ResourceUtilizationTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };
  it('renders resource KPIs and node pool table', () => {
    render(<ResourceUtilizationTab filter={filter} />);
    expect(screen.getByText('Total vCPUs allocated')).toBeTruthy();
    expect(screen.getByText('384')).toBeTruthy();
    expect(screen.getByText('Node pool capacity')).toBeTruthy();
  });
});
