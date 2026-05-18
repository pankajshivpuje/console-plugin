import type { FC, ReactElement } from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { PipelineKind, PipelineRunKind, TaskRunKind } from '../../types';
import { ChildPipelineRunMap } from '../hooks/useChildPipelineRuns';
import { getGraphDataModel } from './pipeline-visualization-utils';
import { dagreViewerComponentFactory } from '../pipeline-topology/factories';
import PipelineTopologyGraph from '../pipeline-topology/PipelineTopologyGraph';
import PipelineVisualizationLegend from './PipelineVisualizationLegend';
import './PipelineVisualization.scss';

interface PipelineTopologyVisualizationProps {
  pipeline: PipelineKind;
  pipelineRun?: PipelineRunKind;
  taskRuns?: TaskRunKind[];
  childPipelineRuns?: ChildPipelineRunMap;
}

const PipelineVisualization: FC<PipelineTopologyVisualizationProps> = ({
  pipeline,
  pipelineRun,
  taskRuns,
  childPipelineRuns,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  let content: ReactElement;
  const model = getGraphDataModel(
    pipeline,
    pipelineRun,
    taskRuns,
    childPipelineRuns,
  );

  if (!model || (model.nodes.length === 0 && model.edges.length === 0)) {
    // Nothing to render
    content = (
      <Alert
        variant="info"
        isInline
        title={t('This Pipeline has no tasks to visualize.')}
      />
    );
  } else {
    content = (
      <PipelineTopologyGraph
        data-test="pipeline-visualization"
        componentFactory={dagreViewerComponentFactory}
        model={model}
        showControlBar
      />
    );
  }

  return (
    <div className="odc-pipeline-visualization">
      {content}
      <PipelineVisualizationLegend />
    </div>
  );
};

export default PipelineVisualization;
