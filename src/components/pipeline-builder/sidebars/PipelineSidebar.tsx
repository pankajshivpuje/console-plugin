import type { FC } from 'react';
import {
  Button,
  ButtonVariant,
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
        <Title headingLevel="h2" size="lg">
          {pipelineName}
        </Title>
        <Button
          variant={ButtonVariant.link}
          data-test="remove-pipeline-ref"
          onClick={() => onRemoveTask(thisTask.name)}
        >
          {t('Remove')}
        </Button>
      </StackItem>
      <StackItem className="opp-task-sidebar__content pf-v6-c-form">
        <TaskSidebarName
          name={`${formikTaskReference}.name`}
          taskName={pipelineName}
          onChange={(newName) =>
            onRenameTask({ preChangePipelineTask: thisTask, newName })
          }
        />

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

        <div>
          <Button
            variant={ButtonVariant.secondary}
            data-test="view-pipeline-details"
            onClick={() =>
              navigate(
                `/k8s/ns/${pipelineNamespace}/tekton.dev~v1~Pipeline/${pipelineName}`,
              )
            }
          >
            {t('View pipeline details')}
          </Button>
        </div>
      </StackItem>
    </Stack>
  );
};

export default PipelineSidebar;
