import { render, screen } from '@testing-library/react';
import LocalQueueWorkloadsTab from '../LocalQueueWorkloadsTab';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueueWorkloadsTab', () => {
  it('renders a row per workload for a queue that has them', () => {
    // ci-builds-fast has 4 workloads in mock data
    render(<LocalQueueWorkloadsTab queueName="ci-builds-fast" />);
    expect(screen.getByText('ci-builds-fast-run-8842')).toBeTruthy();
    expect(screen.getByText('ci-builds-fast-run-8839')).toBeTruthy();
    // cluster badge text
    expect(screen.getByText('spoke-apac-01')).toBeTruthy();
  });

  it('renders a hub cluster badge for hub-routed workloads', () => {
    render(<LocalQueueWorkloadsTab queueName="release-pipeline-queue" />);
    expect(screen.getByText('release-v2.4.0-promote')).toBeTruthy();
    expect(screen.getAllByText('hub').length).toBeGreaterThan(0);
  });

  it('renders an empty state when the queue has no workloads', () => {
    render(<LocalQueueWorkloadsTab queueName="security-scans" />);
    expect(screen.getByText('No workloads found')).toBeTruthy();
  });
});
