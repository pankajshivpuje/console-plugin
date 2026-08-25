import { render, screen } from '@testing-library/react';
import PipelinesOverviewPage from '../PipelinesOverviewPage';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../cluster', () => ({
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

describe('Pipeline Overview page', () => {
  it('renders the Overview page', () => {
    render(<PipelinesOverviewPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Overview' })).toBeTruthy();
    expect(screen.getByText('Spoke fleet health')).toBeTruthy();
  });
});
