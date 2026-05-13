import { useMemo } from 'react';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { PipelineKind } from '../../../types';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  TaskProviders,
  TektonTaskAnnotation,
  TektonTaskLabel,
} from '../../task-quicksearch/pipeline-quicksearch-utils';
import { ARTIFACTHUB } from '../apis/artifactHub';
import { PipelineBuilderFormikValues } from '../../pipeline-builder/types';
import { t } from '../../utils/common-utils';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { PipelineModel } from '../../../models';

const normalizePipelines = (
  pipelines: PipelineKind[],
): CatalogItem<PipelineKind>[] => {
  return _.reduce(
    pipelines,
    (acc, pipeline) => {
      const {
        uid,
        name,
        annotations = {},
        creationTimestamp,
        labels = {},
      } = pipeline.metadata;
      const tags =
        annotations[TektonTaskAnnotation.tags]?.split(/\s*,\s*/) || [];
      const categories =
        annotations[TektonTaskAnnotation.categories]?.split(/\s*,\s*/) || [];
      const provider =
        annotations[TektonTaskAnnotation.installedFrom] || TaskProviders.redhat;
      const versions =
        annotations[TektonTaskAnnotation.installedFrom] === ARTIFACTHUB
          ? labels[TektonTaskLabel.version]
            ? [
                {
                  id: annotations[TektonTaskAnnotation.semVersion],
                  version: annotations[TektonTaskAnnotation.semVersion],
                },
              ]
            : []
          : labels[TektonTaskLabel.version]
          ? [
              {
                id: labels[TektonTaskLabel.version],
                version: labels[TektonTaskLabel.version],
              },
            ]
          : [];

      const normalizedPipeline: CatalogItem<PipelineKind> = {
        uid,
        type: TaskProviders.redhat,
        name,
        description: '',
        provider,
        tags,
        creationTimestamp,
        icon: {
          node: <ResourceIcon kind={getReferenceForModel(PipelineModel)} />,
        },
        attributes: {
          installed:
            annotations[TektonTaskAnnotation.installedFrom] === ARTIFACTHUB
              ? annotations[TektonTaskAnnotation.semVersion]
              : labels[TektonTaskLabel.version],
          versions,
          categories,
        },
        cta: {
          label: t('Add'),
          callback: () => {},
        },
        data: pipeline,
      };
      acc.push(normalizedPipeline);
      return acc;
    },
    [],
  );
};

const usePipelinesProvider: ExtensionHook<CatalogItem[]> = (): [
  CatalogItem[],
  boolean,
  string,
] => {
  const { values, status } = useFormikContext<PipelineBuilderFormikValues>();
  const {
    taskResources: {
      namespacedPipelines = [],
      clusterResolverPipelines = [],
      pipelinesLoaded = false,
    },
  } = values;

  const allPipelines = useMemo(
    () => _.filter([...namespacedPipelines, ...clusterResolverPipelines]),
    [namespacedPipelines, clusterResolverPipelines],
  );

  const normalizedPipelines = useMemo(
    () => normalizePipelines(allPipelines),
    [allPipelines],
  );

  return [normalizedPipelines, pipelinesLoaded, status?.taskLoadingError];
};

export default usePipelinesProvider;
