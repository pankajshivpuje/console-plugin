import type { FC } from 'react';

type TaskTypeBadgeProps = {
  text: string;
  color?: string;
  backgroundColor?: string;
};

const TaskTypeBadge: FC<TaskTypeBadgeProps> = ({
  text,
  color = '#fff',
  backgroundColor = '#0066cc',
}) => {
  const width = text.length > 1 ? 24 : 16;
  return (
    <g>
      <rect width={width} height={16} rx={4} ry={4} fill={backgroundColor} />
      <text
        x={width / 2}
        y={12}
        textAnchor="middle"
        fill={color}
        fontSize={10}
        fontWeight="bold"
      >
        {text}
      </text>
    </g>
  );
};

export default TaskTypeBadge;
