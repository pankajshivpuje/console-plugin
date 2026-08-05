import { render, screen } from '@testing-library/react';
import ClusterBadge from '../ClusterBadge';
import RoutingPill from '../RoutingPill';
import ResourceMeter from '../ResourceMeter';

describe('ClusterBadge', () => {
  it('renders spoke cluster with region', () => {
    render(
      <ClusterBadge
        clusterName="spoke-prod-east"
        clusterType="spoke"
        region="us-east-1"
      />,
    );
    expect(screen.getByText('spoke-prod-east')).toBeTruthy();
    expect(screen.getByText('us-east-1')).toBeTruthy();
  });

  it('renders hub cluster', () => {
    render(
      <ClusterBadge clusterName="hub-central" clusterType="hub" />,
    );
    expect(screen.getByText('hub-central')).toBeTruthy();
  });
});

describe('RoutingPill', () => {
  it('renders optimal pill', () => {
    render(<RoutingPill quality="optimal" text="Optimal route" />);
    expect(screen.getByText('Optimal route')).toBeTruthy();
  });
});

describe('ResourceMeter', () => {
  it('renders with percentage', () => {
    render(<ResourceMeter label="CPU" value={68} />);
    expect(screen.getByText('68%')).toBeTruthy();
  });

  it('renders with custom display value', () => {
    render(
      <ResourceMeter label="Queue" value={13} displayValue="2/15" />,
    );
    expect(screen.getByText('2/15')).toBeTruthy();
  });
});
