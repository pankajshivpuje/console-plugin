import { useMemo } from 'react';
import { useGetArtifactHubTasks } from '../apis/artifactHub';
import {
  CatalogItem,
  ExtensionHook,
  useAccessReview,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel } from '../../../models';
import { useTektonHubIntegration } from '../catalog-utils';
import { FLAGS } from '../../../types';

const useArtifactHubPipelinesProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const artifactHubIntegration = useTektonHubIntegration();
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
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

  const [artifactHubTasks, tasksLoaded, tasksError] = useGetArtifactHubTasks(
    canCreatePipeline && canUpdatePipeline && artifactHubIntegration,
    isDevConsoleProxyAvailable,
  );
  const normalizedPipelines = useMemo<CatalogItem[]>(() => {
    return [];
  }, [artifactHubTasks]);
  return [normalizedPipelines, tasksLoaded, tasksError];
};

export default useArtifactHubPipelinesProvider;
