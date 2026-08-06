import type { FC } from 'react';
import { useParams } from 'react-router';
import PipelineRunDetailsPage from './PipelineRunDetailsPage';

const PipelineRunDetailsRoutePage: FC = () => {
  const { ns, name } = useParams();
  return <PipelineRunDetailsPage name={name} namespace={ns} />;
};

export default PipelineRunDetailsRoutePage;
