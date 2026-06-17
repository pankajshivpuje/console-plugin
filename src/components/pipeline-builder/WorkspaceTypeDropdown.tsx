import type { FC } from 'react';
import { useField, useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { VolumeTypes } from '../../consts';
import DropdownField from '../common/DropdownField';
import PVCDropdown from '../common/PVCDropdown';

type WorkspaceTypeDropdownProps = {
  namePrefix?: string;
};

const WorkspaceTypeDropdown: FC<WorkspaceTypeDropdownProps> = ({
  namePrefix,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [{ value: workspaceType }] = useField(`${namePrefix}.type`);

  const volumeTypeOptions: Record<string, string> = {
    [VolumeTypes.PVC]: t('PersistentVolumeClaim'),
  };

  return (
    <div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--md)' }}>
      <div style={{ flex: workspaceType === VolumeTypes.PVC ? '0 0 50%' : '1 1 auto' }}>
        <DropdownField
          name={`${namePrefix}.type`}
          items={volumeTypeOptions}
          placeholder={t('Select')}
          onChange={() => {
            setFieldValue(`${namePrefix}.data`, {}, false);
          }}
          fullWidth
        />
      </div>
      {workspaceType === VolumeTypes.PVC && (
        <div style={{ flex: '1 1 50%' }}>
          <PVCDropdown
            name={`${namePrefix}.data.persistentVolumeClaim.claimName`}
          />
        </div>
      )}
    </div>
  );
};

export default WorkspaceTypeDropdown;
