import type { FC } from 'react';
import classNames from 'classnames';
import { Card, CardBody, Flex, FlexItem } from '@patternfly/react-core';
import Sparkline from './Sparkline';

interface FleetStatCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaVariant?: 'up' | 'down' | 'neutral';
  spark?: number[];
  valueClassName?: string;
}

const FleetStatCard: FC<FleetStatCardProps> = ({
  label,
  value,
  delta,
  deltaVariant = 'neutral',
  spark,
  valueClassName,
}) => (
  <Card isFullHeight className="opp-fleet-stat-card card-border">
    <CardBody>
      <div className="opp-fleet-stat-card__label">{label}</div>
      <Flex
        justifyContent={{ default: 'justifyContentSpaceBetween' }}
        alignItems={{ default: 'alignItemsFlexEnd' }}
      >
        <FlexItem>
          <div className={classNames('opp-fleet-stat-card__value', valueClassName)}>
            {value}
          </div>
          {delta && (
            <div
              className={classNames('opp-fleet-stat-card__delta', {
                'opp-fleet-stat-card__delta--up': deltaVariant === 'up',
                'opp-fleet-stat-card__delta--down': deltaVariant === 'down',
              })}
            >
              {delta}
            </div>
          )}
        </FlexItem>
        {spark && (
          <FlexItem>
            <Sparkline values={spark} />
          </FlexItem>
        )}
      </Flex>
    </CardBody>
  </Card>
);

export default FleetStatCard;
