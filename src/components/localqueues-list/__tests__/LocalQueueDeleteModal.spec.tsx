import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueueDeleteModal from '../LocalQueueDeleteModal';
import { MOCK_LOCAL_QUEUES } from '../../__demo__/mock-localqueue-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueueDeleteModal', () => {
  it('names the target and confirms deletion', () => {
    const onConfirm = jest.fn();
    render(
      <LocalQueueDeleteModal
        target={MOCK_LOCAL_QUEUES[0]}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders nothing when target is null', () => {
    const { container } = render(
      <LocalQueueDeleteModal target={null} onClose={jest.fn()} onConfirm={jest.fn()} />,
    );
    expect(container.textContent).toBe('');
  });
});
