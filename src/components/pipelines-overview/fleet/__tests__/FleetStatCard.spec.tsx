import { render, screen } from '@testing-library/react';
import FleetStatCard from '../FleetStatCard';

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
    screen.getByText('FLEET SUCCESS RATE');
    screen.getByText('94.2%');
    screen.getByText('+1.3%');
  });
});
