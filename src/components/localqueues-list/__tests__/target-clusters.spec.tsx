import { render, screen } from '@testing-library/react';
import { TargetClusters, WorkloadStatusLabel } from '../presenters';
import type { LocalQueue } from '../../__demo__/mock-localqueue-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const base: LocalQueue = {
  name: 'q',
  namespace: 'ns',
  resourceFlavor: 'default',
  schedulingPolicy: 'hub-only',
  spokeClusterNames: [],
  status: 'Ready',
  lastUpdated: 'now',
  clusterQueue: 'cq',
  quota: { cpu: { used: 0, total: 1 }, memoryGi: { used: 0, total: 1 } },
};

describe('TargetClusters', () => {
  it('renders "Hub cluster" for hub-only', () => {
    render(<TargetClusters lq={{ ...base, schedulingPolicy: 'hub-only' }} />);
    expect(screen.getByText('Hub cluster')).toBeTruthy();
  });

  it('renders "All available spokes" for any-spoke', () => {
    render(<TargetClusters lq={{ ...base, schedulingPolicy: 'any-spoke' }} />);
    expect(screen.getByText('All available spokes')).toBeTruthy();
  });

  it('renders spoke chips for selected-spokes', () => {
    render(
      <TargetClusters
        lq={{
          ...base,
          schedulingPolicy: 'selected-spokes',
          spokeClusterNames: ['spoke-a', 'spoke-b'],
        }}
      />,
    );
    expect(screen.getByText('spoke-a')).toBeTruthy();
    expect(screen.getByText('spoke-b')).toBeTruthy();
  });
});

describe('WorkloadStatusLabel', () => {
  it('renders the status text', () => {
    render(<WorkloadStatusLabel status="Running" />);
    expect(screen.getByText('Running')).toBeTruthy();
  });

  it('maps Failed to a danger variant', () => {
    const { container } = render(<WorkloadStatusLabel status="Failed" />);
    expect(screen.getByText('Failed')).toBeTruthy();
    expect(container.querySelector('.pf-m-red, .pf-m-danger')).toBeTruthy();
  });
});
