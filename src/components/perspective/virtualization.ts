import { CubesIcon } from '@patternfly/react-icons';

export const icon = { default: CubesIcon };

export const getLandingPageURL = () => '/virtualization';

export const getImportRedirectURL = (namespace: string) =>
  `/virtualization/ns/${namespace}`;
