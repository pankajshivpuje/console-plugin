import { render, screen } from '@testing-library/react';
import AggregatedLogsSection from '../AggregatedLogsSection';
import type { LogEntry } from '../../__demo__/mock-cluster-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const LOGS: LogEntry[] = [
  { timestamp: '10:00:01', step: 'clone', level: 'info', message: 'Cloning repo' },
  { timestamp: '10:00:05', step: 'build', level: 'info', message: 'Building image' },
  { timestamp: '10:00:09', step: '', level: 'warn', message: 'Cache miss' },
];

describe('AggregatedLogsSection', () => {
  it('renders each log line (timestamp/step/message) in the code block', () => {
    const { container } = render(
      <AggregatedLogsSection logs={LOGS} clusterName="spoke-prod-east" />,
    );
    const code = container.querySelector('code');
    expect(code).toBeTruthy();
    const text = code?.textContent ?? '';
    expect(text).toContain('[10:00:01] [clone] Cloning repo');
    expect(text).toContain('[10:00:05] [build] Building image');
    // entry with no step omits the step bracket
    expect(text).toContain('[10:00:09] Cache miss');
  });

  it('renders the "Aggregated logs" heading', () => {
    render(<AggregatedLogsSection logs={LOGS} clusterName="spoke-prod-east" />);
    const heading = screen.getByRole('heading');
    expect(heading.textContent).toContain('Aggregated logs');
  });

  it('renders a "View full logs on {cluster}" link', () => {
    render(<AggregatedLogsSection logs={LOGS} clusterName="spoke-prod-east" />);
    const link = screen.getByText(/View full logs on/);
    expect(link).toBeTruthy();
    expect(link.textContent).toContain('spoke-prod-east');
  });

  it('renders nothing when there are no logs', () => {
    const { container } = render(
      <AggregatedLogsSection logs={[]} clusterName="spoke-prod-east" />,
    );
    expect(container.firstChild).toBeNull();
  });
});
