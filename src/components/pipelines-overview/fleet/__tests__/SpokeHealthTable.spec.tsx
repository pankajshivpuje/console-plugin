import { render, screen } from '@testing-library/react';
import SpokeHealthTable from '../SpokeHealthTable';
import { getSpokeMetrics, ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));

describe('SpokeHealthTable', () => {
  it('renders a row per spoke with region', () => {
    render(<SpokeHealthTable metrics={getSpokeMetrics(ALL_SPOKES)} />);
    expect(screen.getByText('Spoke fleet health')).toBeTruthy();
    expect(screen.getByText('us-east-1')).toBeTruthy();
    expect(screen.getByText('ap-southeast-1')).toBeTruthy();
  });
});
