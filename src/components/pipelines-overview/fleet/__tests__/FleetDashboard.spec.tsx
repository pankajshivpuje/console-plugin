import { render, screen, fireEvent } from '@testing-library/react';
import FleetDashboard from '../FleetDashboard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />, ChartAxis: () => <div />, ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>,
  ChartStack: ({ children }: any) => <div>{children}</div>,
  ChartLine: () => <div />, ChartVoronoiContainer: () => <div />,
  ChartLegend: () => <div />, ChartThemeColor: { multiOrdered: 'm', blue: 'blue' },
}));

describe('FleetDashboard', () => {
  it('renders the Overview title and Overview tab by default', () => {
    render(<FleetDashboard />);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy();
    expect(screen.getByText('Spoke fleet health')).toBeTruthy();
  });

  it('switches to the Alerts tab', () => {
    render(<FleetDashboard />);
    fireEvent.click(screen.getByRole('tab', { name: /Alerts/i }));
    expect(screen.getByText('Active alerts')).toBeTruthy();
  });
});
