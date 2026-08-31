import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueueModal from '../LocalQueueModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueueModal', () => {
  it('reveals spoke checkboxes only for selected-spokes policy', () => {
    render(
      <LocalQueueModal isOpen editTarget={null} onClose={jest.fn()} onSubmit={jest.fn()} />,
    );
    expect(screen.queryByLabelText(/spoke-east-01/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Selected Spokes'));
    expect(screen.getByText(/spoke-east-01/)).toBeTruthy();
  });

  it('submits collected values for a new queue', () => {
    const onSubmit = jest.fn();
    render(
      <LocalQueueModal isOpen editTarget={null} onClose={jest.fn()} onSubmit={onSubmit} />,
    );
    // Use placeholder to find the name input (label text includes required asterisk in textContent)
    fireEvent.change(screen.getByPlaceholderText('e.g. ci-builds-fast'), {
      target: { value: 'my-queue' },
    });
    // Namespace FormSelect has aria-label="Namespace" so getByLabelText works via aria-label
    fireEvent.change(screen.getByLabelText('Namespace'), {
      target: { value: 'team-alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-queue',
        namespace: 'team-alpha',
        schedulingPolicy: 'hub-only',
      }),
    );
  });

  it('pre-fills and disables the name field in edit mode', () => {
    render(
      <LocalQueueModal
        isOpen
        editTarget={{
          name: 'arm-builds',
          namespace: 'team-beta',
          resourceFlavor: 'arm64',
          schedulingPolicy: 'selected-spokes',
          spokeClusterNames: ['spoke-arm-central-01'],
          status: 'Ready',
          lastUpdated: '1 day ago',
          clusterQueue: 'arm-cq',
          quota: { cpu: { used: 12, total: 16 }, memoryGi: { used: 20, total: 64 } },
        }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    // Use placeholder to find the name input (label text includes required asterisk in textContent)
    const nameInput = screen.getByPlaceholderText('e.g. ci-builds-fast') as HTMLInputElement;
    expect(nameInput.value).toBe('arm-builds');
    expect(nameInput.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
