import { render, screen } from '@testing-library/react';
import SchedulingPolicyBadge from '../SchedulingPolicyBadge';
import LocalQueueStatusIcon from '../LocalQueueStatusIcon';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueue presenters', () => {
  it('renders policy labels with correct colors', () => {
    const { container, rerender } = render(<SchedulingPolicyBadge policy="hub-only" />);
    expect(screen.getByText('Hub Only')).toBeTruthy();
    expect(container.querySelector('.pf-m-purple')).toBeTruthy();

    rerender(<SchedulingPolicyBadge policy="any-spoke" />);
    expect(screen.getByText('Any Spoke')).toBeTruthy();
    expect(container.querySelector('.pf-m-blue')).toBeTruthy();

    rerender(<SchedulingPolicyBadge policy="selected-spokes" />);
    expect(screen.getByText('Selected Spokes')).toBeTruthy();
    expect(container.querySelector('.pf-m-teal')).toBeTruthy();
  });

  it('renders status text with correct icon variants', () => {
    const { container, rerender } = render(<LocalQueueStatusIcon status="Ready" />);
    expect(screen.getByText('Ready')).toBeTruthy();
    expect(container.querySelector('.pf-m-success')).toBeTruthy();

    rerender(<LocalQueueStatusIcon status="Pending" />);
    expect(screen.getByText('Pending')).toBeTruthy();
    expect(container.querySelector('.pf-m-warning')).toBeTruthy();

    rerender(<LocalQueueStatusIcon status="Error" />);
    expect(screen.getByText('Error')).toBeTruthy();
    expect(container.querySelector('.pf-m-danger')).toBeTruthy();
  });
});
