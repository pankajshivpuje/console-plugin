import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueueDetailsPage from '../LocalQueueDetailsPage';
import { resetQueues, getQueue } from '../localqueue-store';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockNavigate = jest.fn();
let mockParams: { ns?: string; name?: string } = {};

jest.mock('react-router', () => ({
  useParams: () => mockParams,
  useLocation: () => ({ pathname: '/pipelines/ns/team-alpha/local-queues/gpu-ml-validation' }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Keep the heavy tab bodies out of these tests; they have their own specs.
jest.mock('../LocalQueueDetailsTab', () => ({
  __esModule: true,
  default: () => <div data-testid="details-tab" />,
}));
jest.mock('../LocalQueueWorkloadsTab', () => ({
  __esModule: true,
  default: () => <div data-testid="workloads-tab" />,
}));
jest.mock('../LocalQueueYAMLTab', () => ({
  __esModule: true,
  default: () => <div data-testid="yaml-tab" />,
}));

describe('LocalQueueDetailsPage', () => {
  beforeEach(() => {
    resetQueues();
    mockNavigate.mockClear();
    mockParams = { ns: 'team-alpha', name: 'gpu-ml-validation' };
  });

  it('renders the queue name, breadcrumb, and tabs for a known queue', () => {
    render(<LocalQueueDetailsPage />);
    expect(screen.getAllByText('gpu-ml-validation').length).toBeGreaterThan(0);
    expect(screen.getByText('LocalQueues')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Details' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Workloads' })).toBeTruthy();
    expect(screen.getByTestId('details-tab')).toBeTruthy();
  });

  it('switches to the Workloads tab on click', () => {
    render(<LocalQueueDetailsPage />);
    fireEvent.click(screen.getByRole('tab', { name: 'Workloads' }));
    expect(screen.getByTestId('workloads-tab')).toBeTruthy();
  });

  it('renders a not-found empty state for an unknown queue', () => {
    mockParams = { ns: 'team-alpha', name: 'does-not-exist' };
    render(<LocalQueueDetailsPage />);
    expect(screen.getByText('LocalQueue not found')).toBeTruthy();
  });

  it('deletes the queue and navigates back to the list', () => {
    render(<LocalQueueDetailsPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.click(screen.getByText('Delete'));
    // confirm in the delete modal
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(getQueue('team-alpha', 'gpu-ml-validation')).toBeUndefined();
    expect(mockNavigate).toHaveBeenCalledWith(
      '/pipelines/ns/team-alpha/local-queues',
    );
  });
});
