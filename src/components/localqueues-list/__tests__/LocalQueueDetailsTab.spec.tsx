import { render, screen } from '@testing-library/react';
import LocalQueueDetailsTab from '../LocalQueueDetailsTab';
import type { LocalQueue } from '../../__demo__/mock-localqueue-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// gpu-ml-validation has 5 workloads in mock data: 1 Running, 1 Failed,
// 1 Succeeded, 2 Pending -> 3 admitted, 2 pending.
const queue: LocalQueue = {
  name: 'gpu-ml-validation',
  namespace: 'team-alpha',
  resourceFlavor: 'gpu-enabled',
  schedulingPolicy: 'selected-spokes',
  spokeClusterNames: ['spoke-east-gpu-01', 'spoke-west-gpu-02'],
  status: 'Ready',
  lastUpdated: '3 days ago',
  clusterQueue: 'gpu-cq',
  quota: { cpu: { used: 28, total: 32 }, memoryGi: { used: 180, total: 192 } },
};

describe('LocalQueueDetailsTab', () => {
  it('renders core queue fields', () => {
    render(<LocalQueueDetailsTab lq={queue} />);
    expect(screen.getByText('team-alpha')).toBeTruthy();
    expect(screen.getByText('gpu-enabled')).toBeTruthy();
    expect(screen.getByText('gpu-cq')).toBeTruthy();
    expect(screen.getByText('3 days ago')).toBeTruthy();
  });

  it('renders CPU and memory usage with used/total display values', () => {
    render(<LocalQueueDetailsTab lq={queue} />);
    expect(screen.getByText('28 / 32 cores')).toBeTruthy();
    expect(screen.getByText('180 / 192 GiB')).toBeTruthy();
  });

  it('renders derived admitted and pending workload counts', () => {
    render(<LocalQueueDetailsTab lq={queue} />);
    // 5 workloads: 2 Pending -> 3 admitted, 2 pending
    expect(screen.getByTestId('admitted-count').textContent).toBe('3');
    expect(screen.getByTestId('pending-count').textContent).toBe('2');
  });
});
