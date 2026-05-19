import type { FC, Ref } from 'react';
import { useState } from 'react';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  PipelineKind,
  PipelineTask,
  PipelineTaskParam,
  TektonParam,
  TektonWorkspace,
  SelectedBuilderTask,
} from '../../../types';
import TaskSidebarName from '../task-sidebar/TaskSidebarName';
import TaskSidebarParam from '../task-sidebar/TaskSidebarParam';
import TaskSidebarWorkspace from '../task-sidebar/TaskSidebarWorkspace';
import TaskSidebarWhenExpression from '../task-sidebar/TaskSidebarWhenExpression';
import { TaskType, UpdateOperationRenameTaskData } from '../types';
import { CloseButton } from '@patternfly/react-component-groups';
import DynamicResourceLinkList from '../../triggers-details/DynamicResourceLinkList';
import { WorkspaceDefinitionList } from '../../pipelines-tasks';
import { getPipelineTaskLinks } from '../../pipelines-details/utils';

import '../task-sidebar/TaskSidebar.scss';

function safeIndex<T>(list: T[], comparatorFunc: (v: T) => boolean): number {
  const idx = list.findIndex(comparatorFunc);
  return idx === -1 ? list.length : idx;
}

type PipelineSidebarProps = {
  pipeline: PipelineKind;
  onRemoveTask: (taskName: string) => void;
  onRenameTask: (data: UpdateOperationRenameTaskData) => void;
  workspaceList: TektonWorkspace[];
  selectedData: SelectedBuilderTask;
  onClose: () => void;
};

const PipelineSidebar: FC<PipelineSidebarProps> = ({
  pipeline,
  onRemoveTask,
  onRenameTask,
  workspaceList,
  selectedData,
  onClose,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const [isActionsOpen, setIsActionsOpen] = useState(false);
  const { isFinallyTask, taskIndex } = selectedData;
  const taskType: TaskType = isFinallyTask ? 'finallyTasks' : 'tasks';
  const formikTaskReference = `formData.${taskType}.${taskIndex}`;
  const [{ value: thisTask }] = useField<PipelineTask>(formikTaskReference);

  const params: TektonParam[] = pipeline?.spec?.params || [];
  const pipelineWorkspaces: TektonWorkspace[] = pipeline?.spec?.workspaces || [];
  const pipelineName = pipeline?.metadata?.name || '';
  const pipelineNamespace = pipeline?.metadata?.namespace || '';

  return (
    <Stack className="opp-task-sidebar">
      <StackItem className="co-sidebar-dismiss clearfix">
        <CloseButton onClick={onClose} dataTestID="sidebar-close-button" />
      </StackItem>
      <StackItem className="opp-task-sidebar__header">
        <Title headingLevel="h2" className="opp-task-sidebar-header__title">
          <span>{pipelineName}</span>
          <div className="co-actions">
            <Dropdown
              isOpen={isActionsOpen}
              onSelect={() => setIsActionsOpen(false)}
              onOpenChange={(open: boolean) => setIsActionsOpen(open)}
              toggle={(toggleRef: Ref<MenuToggleElement>) => (
                <MenuToggle
                  ref={toggleRef}
                  onClick={() => setIsActionsOpen(!isActionsOpen)}
                  isExpanded={isActionsOpen}
                >
                  {t('Actions')}
                </MenuToggle>
              )}
            >
              <DropdownList>
                <DropdownItem
                  key="view-pipeline"
                  data-test="view-pipeline"
                  onClick={() =>
                    navigate(
                      `/k8s/ns/${pipelineNamespace}/tekton.dev~v1~Pipeline/${pipelineName}`,
                    )
                  }
                >
                  {t('View pipeline')}
                </DropdownItem>
                <DropdownItem
                  key="edit-pipeline"
                  data-test="edit-pipeline"
                  onClick={() =>
                    navigate(
                      `/k8s/ns/${pipelineNamespace}/tekton.dev~v1~Pipeline/${pipelineName}/builder`,
                    )
                  }
                >
                  {t('Edit pipeline')}
                </DropdownItem>
                <DropdownItem
                  key="remove-pipeline"
                  data-test="remove-pipeline"
                  onClick={() => onRemoveTask(thisTask.name)}
                >
                  {t('Remove pipeline')}
                </DropdownItem>
              </DropdownList>
            </Dropdown>
          </div>
        </Title>
      </StackItem>
      <StackItem className="opp-task-sidebar__content pf-v6-c-form">
        <TaskSidebarName
          name={`${formikTaskReference}.name`}
          taskName={pipelineName}
          onChange={(newName) =>
            onRenameTask({ preChangePipelineTask: thisTask, newName })
          }
        />

        {pipeline && (() => {
          const { taskLinks, pipelineLinks } = getPipelineTaskLinks(pipeline);
          return (
            <div className="opp-task-sidebar__details">
              <DynamicResourceLinkList
                namespace={pipelineNamespace}
                links={taskLinks}
                title={t('Tasks')}
              />
              {pipelineLinks.length > 0 && (
                <DynamicResourceLinkList
                  namespace={pipelineNamespace}
                  links={pipelineLinks}
                  title={t('Nested Pipelines')}
                />
              )}
              <WorkspaceDefinitionList obj={pipeline} />
            </div>
          );
        })()}

        {params.length > 0 && (
          <div>
            <Title headingLevel="h2">{t('Parameters')}</Title>
            {params.map((param) => {
              const taskParams: PipelineTaskParam[] = thisTask.params || [];
              const paramIdx = safeIndex(
                taskParams,
                (thisParam) => thisParam.name === param.name,
              );
              return (
                <div key={param.name} className="opp-task-sidebar__param">
                  <TaskSidebarParam
                    hasParam={!!taskParams[paramIdx]}
                    name={`${formikTaskReference}.params.${paramIdx}`}
                    resourceParam={param}
                    selectedData={selectedData}
                  />
                </div>
              );
            })}
          </div>
        )}

        {pipelineWorkspaces.length > 0 && (
          <div>
            <h2>{t('Workspaces')}</h2>
            {pipelineWorkspaces.map((workspace) => {
              const taskWorkspaces: TektonWorkspace[] = thisTask.workspaces || [];
              const workspaceIdx = safeIndex(
                taskWorkspaces,
                (w) => w.name === workspace.name,
              );
              return (
                <div key={workspace.name} className="opp-task-sidebar__workspace">
                  <TaskSidebarWorkspace
                    availableWorkspaces={workspaceList}
                    hasWorkspace={!!taskWorkspaces[workspaceIdx]}
                    name={`${formikTaskReference}.workspaces.${workspaceIdx}`}
                    resourceWorkspace={workspace}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="opp-task-sidebar__when-expressions">
          <TaskSidebarWhenExpression
            hasParam={false}
            name={`${formikTaskReference}.when`}
            selectedData={selectedData}
          />
        </div>

      </StackItem>
    </Stack>
  );
};

export default PipelineSidebar;
