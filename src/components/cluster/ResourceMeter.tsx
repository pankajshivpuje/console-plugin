import type { FC } from 'react';
import {
  Progress,
  ProgressMeasureLocation,
  ProgressVariant,
} from '@patternfly/react-core';

export interface ResourceMeterProps {
  label: string;
  value: number;
  displayValue?: string;
  thresholds?: { warning: number; danger: number };
}

const ResourceMeter: FC<ResourceMeterProps> = ({
  label,
  value,
  displayValue,
  thresholds = { warning: 70, danger: 85 },
}) => {
  let variant: ProgressVariant | undefined;
  if (value >= thresholds.danger) {
    variant = ProgressVariant.danger;
  } else if (value >= thresholds.warning) {
    variant = ProgressVariant.warning;
  }

  return (
    <Progress
      title={label}
      value={value}
      label={displayValue ?? `${value}%`}
      measureLocation={ProgressMeasureLocation.outside}
      variant={variant}
    />
  );
};

export default ResourceMeter;
