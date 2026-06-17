import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import DropdownField from '../common/DropdownField';
import InputField from '../pipelines-details/multi-column-field/InputField';
import { WorkspaceType } from './types';

const mockPVCOptions: Record<string, string> = {
  'shared-workspace-pvc': 'shared-workspace-pvc',
  'build-artifacts-pvc': 'build-artifacts-pvc',
  'source-code-pvc': 'source-code-pvc',
  'maven-repo-pvc': 'maven-repo-pvc',
  'docker-cache-pvc': 'docker-cache-pvc',
};

type WorkspaceFieldProps = {
  namePrefix?: string;
  isReadOnly?: boolean;
};

export const WorkspaceTypeSelector: FC<WorkspaceFieldProps> = ({
  namePrefix,
  isReadOnly,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  const typeOptions = {
    [WorkspaceType.Blank]: t('Blank workspace'),
    [WorkspaceType.PVC]: t('PersistentVolumeClaim'),
  };

  return (
    <DropdownField
      name={`${namePrefix}.type`}
      items={typeOptions}
      disabled={isReadOnly}
      fullWidth
    />
  );
};

export const WorkspaceNameField: FC<WorkspaceFieldProps> = ({
  namePrefix,
  isReadOnly,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [{ value: workspaceType }] = useField(`${namePrefix}.type`);

  if (workspaceType === WorkspaceType.PVC) {
    return (
      <DropdownField
        name={`${namePrefix}.pvcName`}
        items={mockPVCOptions}
        disabled={isReadOnly}
        fullWidth
      />
    );
  }

  return (
    <InputField
      data-test="workspace-name"
      name={`${namePrefix}.name`}
      type={TextInputTypes.text}
      placeholder={t('Name')}
      isReadOnly={isReadOnly}
      aria-label={t('Name')}
    />
  );
};
