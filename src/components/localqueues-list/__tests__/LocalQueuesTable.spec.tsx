import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueuesTable from '../LocalQueuesTable';
import { MOCK_LOCAL_QUEUES } from '../../__demo__/mock-localqueue-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

// Mock child presenters to avoid PatternFly internals leaking into these tests
jest.mock('../SchedulingPolicyBadge', () => ({
  __esModule: true,
  default: ({ policy }: { policy: string }) => <span data-testid="policy-badge">{policy}</span>,
}));

jest.mock('../LocalQueueStatusIcon', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span data-testid="status-icon">{status}</span>,
}));

describe('LocalQueuesTable', () => {
  it('renders a row per queue with namespace and spoke chips', () => {
    render(
      <LocalQueuesTable rows={MOCK_LOCAL_QUEUES} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    // ci-builds-fast row
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    // spoke chip from gpu-ml-validation row
    expect(screen.getByText('spoke-east-gpu-01')).toBeTruthy();
    // cicd-platform namespace appears for at least one row
    expect(screen.getAllByText('cicd-platform').length).toBeGreaterThan(0);
  });

  it('fires onEdit and onDelete from the kebab menu', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <LocalQueuesTable rows={[MOCK_LOCAL_QUEUES[0]]} onEdit={onEdit} onDelete={onDelete} />,
    );

    // Open kebab and click Edit
    fireEvent.click(screen.getByLabelText('Actions for ci-builds-fast'));
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(MOCK_LOCAL_QUEUES[0]);

    // Open kebab again and click Delete
    fireEvent.click(screen.getByLabelText('Actions for ci-builds-fast'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(MOCK_LOCAL_QUEUES[0]);
  });

  it('renders an empty state when there are no rows', () => {
    render(<LocalQueuesTable rows={[]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('No LocalQueues found')).toBeTruthy();
  });

  it('shows muted text for hub-only policy in Target Clusters cell', () => {
    // MOCK_LOCAL_QUEUES[1] = release-pipeline-queue, hub-only
    render(
      <LocalQueuesTable rows={[MOCK_LOCAL_QUEUES[1]]} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(screen.getByText('Hub cluster')).toBeTruthy();
  });

  it('shows muted text for any-spoke policy in Target Clusters cell', () => {
    // MOCK_LOCAL_QUEUES[0] = ci-builds-fast, any-spoke
    render(
      <LocalQueuesTable rows={[MOCK_LOCAL_QUEUES[0]]} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(screen.getByText('All available spokes')).toBeTruthy();
  });

  it('shows spoke Label chips for selected-spokes policy', () => {
    // MOCK_LOCAL_QUEUES[2] = gpu-ml-validation, selected-spokes
    render(
      <LocalQueuesTable rows={[MOCK_LOCAL_QUEUES[2]]} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(screen.getByText('spoke-east-gpu-01')).toBeTruthy();
    expect(screen.getByText('spoke-west-gpu-02')).toBeTruthy();
  });
});
