import type { FC } from 'react';
import { Navigate, useParams } from 'react-router';

const MultiClusterPipelineRunsPage: FC = () => {
  const { ns } = useParams();
  const target = ns
    ? `/pipelines/ns/${ns}`
    : '/pipelines/all-namespaces';
  return <Navigate to={target} replace />;
};

export default MultiClusterPipelineRunsPage;
