import { render, screen, fireEvent } from '@testing-library/react';
import FleetToolbar from '../FleetToolbar';
import { ALL_SPOKES } from '../../../__demo__/mock-fleet-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('FleetToolbar', () => {
  const baseFilter = {
    selectedSpokes: [...ALL_SPOKES],
    timeRange: 'Last 30 days',
    search: '',
  };

  it('renders a chip per selected spoke and the updated label', () => {
    render(<FleetToolbar filter={baseFilter} onChange={jest.fn()} />);
    expect(screen.getByText('spoke-prod-east')).toBeTruthy();
    expect(screen.getByText('spoke-edge')).toBeTruthy();
    expect(screen.getByText(/2 min ago/)).toBeTruthy();
  });

  it('removes a spoke when its chip is closed', () => {
    const onChange = jest.fn();
    render(<FleetToolbar filter={baseFilter} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /close spoke-edge/i }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedSpokes: expect.not.arrayContaining(['spoke-edge']),
      }),
    );
  });
});
