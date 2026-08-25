import { render, screen } from '@testing-library/react';
import BuildTimesTab from '../BuildTimesTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('@patternfly/react-charts/victory', () => ({
  Chart: ({ children }: any) => <div>{children}</div>,
  ChartArea: () => <div />, ChartAxis: () => <div />, ChartBar: () => <div />,
  ChartGroup: ({ children }: any) => <div>{children}</div>, ChartLine: () => <div />,
  ChartVoronoiContainer: () => <div />, ChartThemeColor: { blue: 'blue' },
}));

describe('BuildTimesTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };
  it('renders build-time KPIs and slowest pipelines table', () => {
    render(<BuildTimesTab filter={filter} />);
    expect(screen.getByText('Timed out runs')).toBeTruthy();
    expect(screen.getByText('134')).toBeTruthy();
    expect(screen.getByText('Slowest pipelines (fleet-wide)')).toBeTruthy();
  });
  it('shows empty state with no spokes', () => {
    render(<BuildTimesTab filter={{ ...filter, selectedSpokes: [] }} />);
    expect(screen.getByText('No spoke clusters selected')).toBeTruthy();
  });
});
