import { render, screen } from '@testing-library/react';
import SchedulingPolicyBadge from '../SchedulingPolicyBadge';
import LocalQueueStatusIcon from '../LocalQueueStatusIcon';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueue presenters', () => {
  it('renders policy labels', () => {
    const { rerender } = render(<SchedulingPolicyBadge policy="hub-only" />);
    expect(screen.getByText('Hub Only')).toBeTruthy();
    rerender(<SchedulingPolicyBadge policy="any-spoke" />);
    expect(screen.getByText('Any Spoke')).toBeTruthy();
    rerender(<SchedulingPolicyBadge policy="selected-spokes" />);
    expect(screen.getByText('Selected Spokes')).toBeTruthy();
  });

  it('renders status text', () => {
    const { rerender } = render(<LocalQueueStatusIcon status="Ready" />);
    expect(screen.getByText('Ready')).toBeTruthy();
    rerender(<LocalQueueStatusIcon status="Error" />);
    expect(screen.getByText('Error')).toBeTruthy();
  });
});
