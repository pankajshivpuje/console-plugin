import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import InputField from '../pipelines-details/multi-column-field/InputField';

type OptionalableWorkspace = {
  namePrefix?: string;
  isReadOnly?: boolean;
};

const OptionalableWorkspace: FC<OptionalableWorkspace> = ({
  namePrefix,
  isReadOnly,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <InputField
      data-test="name"
      name={`${namePrefix}.name`}
      type={TextInputTypes.text}
      placeholder={t('Name')}
      isReadOnly={isReadOnly}
      aria-label={t('Name')}
    />
  );
};

export default OptionalableWorkspace;
