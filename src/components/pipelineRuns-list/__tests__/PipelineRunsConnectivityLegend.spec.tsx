import { render, screen } from '@testing-library/react';
import ConnectivityLegend from '../ConnectivityLegend';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('ConnectivityLegend', () => {
  it('renders the three connectivity states', () => {
    render(<ConnectivityLegend />);
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('Idle')).toBeTruthy();
    expect(screen.getByText('Disconnected')).toBeTruthy();
  });
});
