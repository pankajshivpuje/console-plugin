import type { FC } from 'react';
import { Label } from '@patternfly/react-core';

export interface RoutingPillProps {
  quality: 'optimal' | 'constrained';
  text: string;
}

const RoutingPill: FC<RoutingPillProps> = ({ quality, text }) => {
  const color = quality === 'optimal' ? 'green' : 'yellow';
  return (
    <Label isCompact color={color}>
      {text}
    </Label>
  );
};

export default RoutingPill;
