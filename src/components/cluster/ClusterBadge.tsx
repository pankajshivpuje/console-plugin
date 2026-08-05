import type { FC } from 'react';
import { Label } from '@patternfly/react-core';
import './ClusterBadge.scss';

export interface ClusterBadgeProps {
  clusterName: string;
  clusterType: 'hub' | 'spoke';
  region?: string;
}

const HubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="4.5" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);

const SpokeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="4.5" />
  </svg>
);

const ClusterBadge: FC<ClusterBadgeProps> = ({
  clusterName,
  clusterType,
  region,
}) => {
  const isHub = clusterType === 'hub';
  return (
    <Label
      variant="outline"
      className={`opp-cluster-badge opp-cluster-badge--${clusterType}`}
      icon={isHub ? <HubIcon /> : <SpokeIcon />}
    >
      {clusterName}
      {region && (
        <span className="opp-cluster-badge__region">{region}</span>
      )}
    </Label>
  );
};

export default ClusterBadge;
