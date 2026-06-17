import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { WorkspaceTypeSelector, WorkspaceNameField } from './WorkspaceTypeField';
import MultiColumnField from '../pipelines-details/multi-column-field/MultiColumnField';
import { WorkspaceType } from './types';

type PipelineWorkspacesParam = {
  addLabel?: string;
  fieldName: string;
  isReadOnly?: boolean;
};

const PipelineWorkspaces: FC<PipelineWorkspacesParam> = (props) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    addLabel = t('Add Pipeline workspace'),
    fieldName,
    isReadOnly = false,
  } = props;
  const emptyMessage = t('No workspaces are associated with this pipeline.');
  return (
    <div className="co-m-pane__form">
      <MultiColumnField
        data-test="pipeline-workspaces"
        name={fieldName}
        addLabel={addLabel}
        headers={[{ name: t('Workspace type'), required: false }, { name: t('Name'), required: true }]}
        emptyValues={{ name: '', optional: false, type: WorkspaceType.Blank, pvcName: '' }}
        emptyMessage={emptyMessage}
        isReadOnly={isReadOnly}
        spans={[5, 6]}
        complexFields={[true, true]}
      >
        <WorkspaceTypeSelector />
        <WorkspaceNameField />
      </MultiColumnField>
    </div>
  );
};

export default PipelineWorkspaces;
