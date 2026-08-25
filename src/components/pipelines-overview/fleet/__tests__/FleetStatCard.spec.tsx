import { render, screen } from '@testing-library/react';
import FleetStatCard from '../FleetStatCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('FleetStatCard', () => {
  it('renders label, value and delta', () => {
    render(
      <FleetStatCard
        label="FLEET SUCCESS RATE"
        value="94.2%"
        delta="+1.3%"
        deltaVariant="up"
        spark={[1, 2, 3, 2, 4]}
      />,
    );
    expect(screen.getByText('FLEET SUCCESS RATE')).toBeTruthy();
    expect(screen.getByText('94.2%')).toBeTruthy();
    expect(screen.getByText('+1.3%')).toBeTruthy();
  });
});
