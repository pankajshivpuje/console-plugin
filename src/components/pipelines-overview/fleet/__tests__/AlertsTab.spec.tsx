import { render, screen, fireEvent } from '@testing-library/react';
import AlertsTab from '../AlertsTab';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

describe('AlertsTab', () => {
  const filter = { selectedSpokes: [...ALL_SPOKES], timeRange: 'Last 30 days', search: '' };

  it('renders summary counts and alert rows', () => {
    render(<AlertsTab filter={filter} />);
    expect(screen.getByText('Active alerts')).toBeTruthy();
    expect(screen.getByText(/spoke-edge CPU utilization at 91%/)).toBeTruthy();
  });

  it('acknowledging removes a row from active list', () => {
    render(<AlertsTab filter={filter} />);
    const ackButtons = screen.getAllByRole('button', { name: /Acknowledge/i });
    fireEvent.click(ackButtons[0]);
    // first critical alert acknowledged -> its Acknowledge button is gone from that row
    expect(screen.getAllByRole('button', { name: /Acknowledge/i }).length).toBeLessThan(
      ackButtons.length,
    );
  });
});
