import { CodeIcon } from '@patternfly/react-icons';

export const icon = { default: CodeIcon };

export const getLandingPageURL = () => '/topology';

export const getImportRedirectURL = (namespace: string) =>
  `/topology/ns/${namespace}`;
