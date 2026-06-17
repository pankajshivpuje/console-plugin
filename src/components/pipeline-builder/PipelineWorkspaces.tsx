import type { FC } from 'react';
import { TextInputTypes, Button, ButtonVariant, ButtonType, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { FieldArray, useField, useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { VolumeTypes } from '../../consts';
import InputField from '../pipelines-details/multi-column-field/InputField';
import DropdownField from '../common/DropdownField';
import PVCDropdown from '../common/PVCDropdown';
import SecondaryStatus from '../pipelines-details/multi-column-field/SecondaryStatus';
import './PipelineWorkspaces.scss';

type PipelineWorkspacesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const WorkspaceRow: FC<{ name: string; index: number; onRemove: () => void; isReadOnly: boolean }> = ({
  name,
  index,
  onRemove,
  isReadOnly,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { setFieldValue } = useFormikContext<FormikValues>();
  const fieldName = `${name}.${index}`;
  const [{ value: workspaceType }] = useField(`${fieldName}.type`);

  const volumeTypeOptions: Record<string, string> = {
    [VolumeTypes.PVC]: t('PersistentVolumeClaim'),
  };

  return (
    <div className="osp-workspace-row">
      <div className="osp-workspace-row__field osp-workspace-row__field--name">
        <InputField
          data-test="name"
          name={`${fieldName}.name`}
          type={TextInputTypes.text}
          placeholder={t('Name')}
          isReadOnly={isReadOnly}
          aria-label={t('Name')}
        />
      </div>
      <div className="osp-workspace-row__field osp-workspace-row__field--type">
        <DropdownField
          name={`${fieldName}.type`}
          items={volumeTypeOptions}
          placeholder={t('Select')}
          onChange={() => {
            setFieldValue(`${fieldName}.data`, {}, false);
          }}
        />
      </div>
      {workspaceType === VolumeTypes.PVC && (
        <div className="osp-workspace-row__field osp-workspace-row__field--pvc">
          <PVCDropdown
            name={`${fieldName}.data.persistentVolumeClaim.claimName`}
          />
        </div>
      )}
      {!isReadOnly && (
        <div className="osp-workspace-row__remove">
          <Tooltip content={t('Remove')}>
            <Button
              data-test="delete-row"
              aria-label={t('Remove')}
              variant={ButtonVariant.plain}
              type={ButtonType.button}
              isInline
              onClick={onRemove}
              icon={<MinusCircleIcon />}
            />
          </Tooltip>
        </div>
      )}
    </div>
  );
};

const PipelineWorkspaces: FC<PipelineWorkspacesParam> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    addLabel = t('Add Pipeline workspace'),
    fieldName,
    isReadOnly = false,
  } = props;
  const [{ value: fieldValue }] = useField(fieldName);
  const emptyMessage = t('No workspaces are associated with this pipeline.');

  return (
    <div className="co-m-pane__form">
      <FieldArray
        name={fieldName}
        render={({ push, remove }) => (
          <div data-test="pipeline-workspaces">
            {fieldValue.length < 1 ? (
              <div className="osp-workspace-empty">
                <SecondaryStatus status={emptyMessage} />
              </div>
            ) : (
              <div className="osp-workspace-header">
                <div className="osp-workspace-header__col osp-workspace-header__col--name">
                  {t('Name')}
                  <span className="osp-workspace-header__required">*</span>
                </div>
                <div className="osp-workspace-header__col osp-workspace-header__col--type">{t('Type')}</div>
              </div>
            )}
            {fieldValue.map((_ws, index) => (
              <WorkspaceRow
                key={index}
                name={fieldName}
                index={index}
                onRemove={() => remove(index)}
                isReadOnly={isReadOnly}
              />
            ))}
            {!isReadOnly && (
              <Button
                data-test="add-action"
                variant="link"
                onClick={() => push({ name: '', optional: false, type: '' })}
                icon={<PlusCircleIcon />}
                isInline
              >
                {addLabel}
              </Button>
            )}
          </div>
        )}
      />
    </div>
  );
};

export default PipelineWorkspaces;
