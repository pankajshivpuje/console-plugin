import _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { PIPELINE_NAMESPACE } from '../../consts';
import {
  PipelineKind,
  PipelineTask,
  ResourceModelLink,
  TektonParam,
} from '../../types';
import { groupVersionFor } from '../utils/k8s-utils';
import { getSafeTaskResourceKind } from '../utils/pipeline-augment';

type PipelineTaskLinks = {
  taskLinks: ResourceModelLink[];
  pipelineLinks: ResourceModelLink[];
};

export const getPipelineTaskLinks = (
  pipeline: PipelineKind,
): PipelineTaskLinks => {
  const toResourceLinkData = (tasks: PipelineTask[]): ResourceModelLink[] => {
    const { t } = useTranslation('plugin__pipelines-console-plugin');
    if (!tasks) return [];
    const { version } = groupVersionFor(pipeline.apiVersion);
    const taskBadge = { text: 'T', color: '#009596' };
    return tasks
      ?.filter((task) => !task.pipelineRef)
      .map((task) => {
        if (task.taskRef) {
          const kind = task.taskRef.kind || 'Task';
          if (task.taskRef.resolver === 'cluster') {
            const nameParam = task.taskRef.params?.find(
              (param) => param.name === 'name',
            )?.value;
            return {
              resourceKind: getSafeTaskResourceKind(kind),
              name: nameParam,
              qualifier: task.name,
              namespace: PIPELINE_NAMESPACE,
              resourceApiVersion: version,
              badge: taskBadge,
            };
          }
          return kind === 'Task'
            ? {
                resourceKind: getSafeTaskResourceKind(kind),
                name: task.taskRef.name,
                qualifier: task.name,
                resourceApiVersion: version,
                badge: taskBadge,
              }
            : {
                resourceKind: kind,
                name:
                  kind === 'ApprovalTask'
                    ? t('Approval Task')
                    : t('Custom Task'),
                qualifier: task.name,
                disableLink: true,
                badge: taskBadge,
              };
        }
        return {
          resourceKind: 'EmbeddedTask',
          name: t('Embedded task'),
          qualifier: task.name,
          disableLink: true,
          badge: taskBadge,
        };
      });
  };
  const toPipelineLinkData = (tasks: PipelineTask[]): ResourceModelLink[] => {
    const { t } = useTranslation('plugin__pipelines-console-plugin');
    if (!tasks) return [];
    const pipelineBadge = { text: 'P', color: '#0066cc' };
    return tasks
      .filter((task) => !!task.pipelineRef)
      .map((task) => {
        if (task.pipelineRef.resolver === 'cluster') {
          const nameParam = task.pipelineRef.params?.find(
            (param) => param.name === 'name',
          )?.value;
          return {
            resourceKind: 'Pipeline',
            name: nameParam,
            qualifier: task.name,
            namespace: PIPELINE_NAMESPACE,
            badge: pipelineBadge,
          };
        }
        if (task.pipelineRef.name) {
          return {
            resourceKind: 'Pipeline',
            name: task.pipelineRef.name,
            qualifier: task.name,
            badge: pipelineBadge,
          };
        }
        return {
          resourceKind: 'Pipeline',
          name: t('Resolved pipeline'),
          qualifier: task.name,
          disableLink: true,
          badge: pipelineBadge,
        };
      });
  };

  return {
    taskLinks: toResourceLinkData(pipeline.spec.tasks),
    pipelineLinks: toPipelineLinkData(pipeline.spec.tasks),
  };
};

export const removeEmptyDefaultFromPipelineParams = (
  parameters: TektonParam[],
): TektonParam[] =>
  _.map(
    parameters,
    (parameter) =>
      _.omit(
        parameter,
        _.isEmpty(parameter.default) ? ['default'] : [],
      ) as TektonParam,
  );

export const sanitizePipelineParams = (
  parameters: TektonParam[],
): TektonParam[] => {
  const pipelineWithNoEmptyDefaultParams =
    removeEmptyDefaultFromPipelineParams(parameters);
  return pipelineWithNoEmptyDefaultParams.length > 0
    ? pipelineWithNoEmptyDefaultParams.map((parameter) => {
        if (
          parameter?.type === 'array' &&
          typeof parameter?.default === 'string'
        ) {
          return {
            ...parameter,
            default: parameter.default.split(',').map((param) => param.trim()),
          };
        }
        return parameter;
      })
    : [];
};
