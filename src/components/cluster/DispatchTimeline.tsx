import type { FC } from 'react';
import {
  ProgressStepper,
  ProgressStep,
  ProgressStepVariant,
} from '@patternfly/react-core';
import type { DispatchTimelineData } from '../__demo__/mock-cluster-data';

export interface DispatchTimelineProps {
  timeline: DispatchTimelineData;
}

const DispatchTimeline: FC<DispatchTimelineProps> = ({ timeline }) => {
  const isRunning = !timeline.completed;

  return (
    <ProgressStepper isCompact>
      <ProgressStep
        variant={ProgressStepVariant.success}
        id="submitted"
        titleId="submitted-title"
        aria-label="Submitted"
        description={timeline.submitted}
      >
        Submitted
      </ProgressStep>
      <ProgressStep
        variant={ProgressStepVariant.success}
        id="queued"
        titleId="queued-title"
        aria-label="Queued"
        description={timeline.queueDuration}
      >
        Queued
      </ProgressStep>
      <ProgressStep
        variant={ProgressStepVariant.success}
        id="dispatched"
        titleId="dispatched-title"
        aria-label="Dispatched"
        description={timeline.dispatched}
      >
        Dispatched
      </ProgressStep>
      <ProgressStep
        variant={
          isRunning
            ? ProgressStepVariant.info
            : ProgressStepVariant.success
        }
        isCurrent={isRunning}
        id="completed"
        titleId="completed-title"
        aria-label="Completed"
        description={timeline.completed ?? 'In progress...'}
      >
        {isRunning ? 'Running' : 'Completed'}
      </ProgressStep>
    </ProgressStepper>
  );
};

export default DispatchTimeline;
