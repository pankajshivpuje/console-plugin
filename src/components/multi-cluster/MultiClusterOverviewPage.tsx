import type { FC } from 'react';
import { Navigate, useParams } from 'react-router';

const MultiClusterOverviewPage: FC = () => {
  const { ns } = useParams();
  const target = ns
    ? `/pipelines-overview/ns/${ns}`
    : '/pipelines-overview/all-namespaces';
  return <Navigate to={target} replace />;
};

export default MultiClusterOverviewPage;
