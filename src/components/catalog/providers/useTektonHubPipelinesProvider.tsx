import { useState, useMemo } from 'react';
import { Label } from '@patternfly/react-core';
import {
  TektonHubTask,
  useInclusterTektonHubURLs,
  useTektonHubResources,
} from '../apis/tektonHub';
import {
  filterBySupportedPlatforms,
  useTektonHubIntegration,
} from '../catalog-utils';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel } from '../../../models';
import { TaskProviders } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { t } from '../../utils/common-utils';

const normalizeTektonHubPipelines = (
  tektonHubTasks: TektonHubTask[],
  apiURL: string,
  uiURL: string,
): CatalogItem<TektonHubTask>[] => {
  const normalizedTektonHubPipelines: CatalogItem<TektonHubTask>[] =
    tektonHubTasks
      .filter(filterBySupportedPlatforms)
      .reduce((acc, task) => {
        if (task.kind !== 'Pipeline') {
          return acc;
        }
        const { id, name } = task;
        const { description } = task.latestVersion;
        const provider = TaskProviders.tektonHub;
        const tags = task.tags?.map((t) => t.name) ?? [];
        const categories = task.categories?.map((ct) => ct.name) ?? [];
        const [secondaryLabelName] = categories;
        const versions = [];
        const normalizedPipeline: CatalogItem<TektonHubTask> = {
          uid: id.toString(),
          type: TaskProviders.community,
          name,
          description,
          provider,
          tags,
          secondaryLabel: secondaryLabelName && (
            <Label color="blue">{secondaryLabelName}</Label>
          ),
          icon: {
            node: <ResourceIcon kind={getReferenceForModel(PipelineModel)} />,
          },
          attributes: { installed: '', versions, categories, apiURL, uiURL },
          cta: {
            label: t('Add'),
          },
          data: task,
        };
        acc.push(normalizedPipeline);

        return acc;
      }, []);

  return normalizedTektonHubPipelines;
};

const useTektonHubPipelinesProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const [normalizedTektonHubPipelines, setNormalizedTektonHubPipelines] =
    useState<CatalogItem<TektonHubTask>[]>([]);

  const canCreatePipeline = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace,
    verb: 'create',
  });

  const canUpdatePipeline = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace,
    verb: 'update',
  });

  const integrationEnabled = useTektonHubIntegration();
  const { apiURL, uiURL, loaded: baseURLLoaded } = useInclusterTektonHubURLs();

  const [tektonHubTasks, tasksLoaded, tasksError] = useTektonHubResources(
    apiURL,
    canCreatePipeline &&
      canUpdatePipeline &&
      integrationEnabled &&
      baseURLLoaded,
  );

  useMemo(
    () =>
      setNormalizedTektonHubPipelines(
        normalizeTektonHubPipelines(tektonHubTasks, apiURL, uiURL),
      ),
    [apiURL, tektonHubTasks, uiURL],
  );
  return [normalizedTektonHubPipelines, tasksLoaded, tasksError];
};

export default useTektonHubPipelinesProvider;
