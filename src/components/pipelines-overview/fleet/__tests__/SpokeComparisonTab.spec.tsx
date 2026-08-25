import { render, screen } from '@testing-library/react';
import SpokeComparisonTab from '../SpokeComparisonTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));
jest.mock('../../../cluster', () => ({
  ClusterBadge: ({ clusterName }: { clusterName: string }) => <span>{clusterName}</span>,
  ResourceMeter: ({ value }: { value: number }) => <span>{value}%</span>,
  RoutingPill: () => <span />,
}));

describe('SpokeComparisonTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };
  it('renders a card per selected spoke with success rate', () => {
    render(<SpokeComparisonTab filter={filter} />);
    expect(screen.getByText('96.7%')).toBeTruthy();
    expect(screen.getByText('90%')).toBeTruthy();
    expect(screen.getByText('ap-southeast-1')).toBeTruthy();
  });
});
