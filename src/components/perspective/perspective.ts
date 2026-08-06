import PipelinesPerspectiveIcon from './PipelinesPerspectiveIcon';

export const icon = { default: PipelinesPerspectiveIcon };

export const getLandingPageURL = () => '/pipelines-overview/all-namespaces';

export const getImportRedirectURL = (namespace: string) =>
  `/pipelines/ns/${namespace}`;
