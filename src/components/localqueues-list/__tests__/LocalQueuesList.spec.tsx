import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import LocalQueuesList from '../LocalQueuesList';
import { resetQueues } from '../localqueue-store';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  ListPageBody: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('react-router', () => ({
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
  // LocalQueuesTable uses these; stub them for the list's render tree.
  useLocation: () => ({ pathname: '/pipelines/all-namespaces' }),
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

// Helper: fill the Create modal's name and namespace fields, then submit
function fillAndSubmitCreate(name: string, namespace: string) {
  // Use placeholder to target the name input (avoids ambiguity with "Namespace" label containing "name")
  fireEvent.change(screen.getByPlaceholderText('e.g. ci-builds-fast'), {
    target: { value: name },
  });
  // Namespace has a unique aria-label "Namespace" on the FormSelect
  fireEvent.change(screen.getByLabelText('Namespace'), {
    target: { value: namespace },
  });
  fireEvent.click(screen.getByRole('button', { name: 'Create' }));
}

describe('LocalQueuesList', () => {
  beforeEach(() => {
    mockSetSearchParams.mockClear();
    mockSearchParams = new URLSearchParams();
    // The store is a module singleton; reset it so tests don't leak state.
    resetQueues();
  });

  it('renders the 6 seed queues', () => {
    render(<LocalQueuesList />);
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    expect(screen.getByText('security-scans')).toBeTruthy();
    expect(screen.getByText('gpu-ml-validation')).toBeTruthy();
    expect(screen.getByText('nightly-integration')).toBeTruthy();
    expect(screen.getByText('arm-builds')).toBeTruthy();
    expect(screen.getByText('release-pipeline-queue')).toBeTruthy();
  });

  it('filters by name and hides non-matching queues', () => {
    render(<LocalQueuesList />);
    fireEvent.change(screen.getByLabelText('Search by name', { exact: false }), {
      target: { value: 'gpu' },
    });
    expect(screen.getByText('gpu-ml-validation')).toBeTruthy();
    expect(screen.queryByText('ci-builds-fast')).toBeNull();
  });

  it('shows empty state when search matches nothing', () => {
    render(<LocalQueuesList />);
    fireEvent.change(screen.getByLabelText('Search by name', { exact: false }), {
      target: { value: 'zzz-no-match-ever' },
    });
    expect(screen.getByText('No LocalQueues found')).toBeTruthy();
  });

  it('creates a new queue via the modal and prepends the row', () => {
    render(<LocalQueuesList />);
    fireEvent.click(screen.getByRole('button', { name: 'Create LocalQueue' }));
    fillAndSubmitCreate('brand-new-queue', 'team-alpha');
    // new row appears in the table
    expect(screen.getByText('brand-new-queue')).toBeTruthy();
    // success toast title is rendered (composed without i18n interpolation)
    expect(screen.getByText('LocalQueue "brand-new-queue" created successfully.')).toBeTruthy();
  });

  it('rejects a duplicate name with a danger toast and adds no new row', () => {
    render(<LocalQueuesList />);
    fireEvent.click(screen.getByRole('button', { name: 'Create LocalQueue' }));
    fillAndSubmitCreate('ci-builds-fast', 'team-alpha');
    // danger toast rendered
    expect(screen.getByText('A LocalQueue with this name already exists.')).toBeTruthy();
    // modal is still open (we did not close it); original row is the only one named ci-builds-fast
    // close the modal first so we can count table rows accurately
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    // still only 1 row with that name (the seed)
    expect(screen.getAllByText('ci-builds-fast').length).toBe(1);
  });

  it('rejects selected-spokes with no spokes with a danger toast and no mutation', () => {
    render(<LocalQueuesList />);
    fireEvent.click(screen.getByRole('button', { name: 'Create LocalQueue' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. ci-builds-fast'), {
      target: { value: 'spoke-test-queue' },
    });
    fireEvent.change(screen.getByLabelText('Namespace'), {
      target: { value: 'team-alpha' },
    });
    // select the Selected Spokes radio — do NOT check any spokes
    fireEvent.click(screen.getByLabelText('Selected Spokes'));
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    // danger toast
    expect(screen.getByText('Select at least one spoke cluster.')).toBeTruthy();
    // queue was NOT added; close modal and confirm
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('spoke-test-queue')).toBeNull();
  });

  it('edits a queue via the modal and updates the row', () => {
    render(<LocalQueuesList />);
    const row = screen.getByText('ci-builds-fast').closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByLabelText('Actions for ci-builds-fast'));
    fireEvent.click(screen.getByText('Edit'));
    // modal is in edit mode: name field pre-filled and disabled
    const nameInput = screen.getByPlaceholderText('e.g. ci-builds-fast') as HTMLInputElement;
    expect(nameInput.value).toBe('ci-builds-fast');
    expect(nameInput.disabled).toBe(true);
    // save without changes
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    // row still present (updated, not removed or duplicated)
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    // success toast
    expect(
      screen.getByText('LocalQueue "ci-builds-fast" updated successfully.'),
    ).toBeTruthy();
  });

  it('deletes a queue after confirmation', () => {
    render(<LocalQueuesList />);
    const row = screen.getByText('arm-builds').closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByLabelText('Actions for arm-builds'));
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('arm-builds')).toBeNull();
  });

  it('auto-opens the create modal when ?create=1 is in search params', () => {
    mockSearchParams = new URLSearchParams('create=1');
    render(<LocalQueuesList />);
    // modal is open (dialog role present)
    expect(screen.getByRole('dialog')).toBeTruthy();
    // mockSetSearchParams was called to strip the param
    expect(mockSetSearchParams).toHaveBeenCalled();
  });
});
