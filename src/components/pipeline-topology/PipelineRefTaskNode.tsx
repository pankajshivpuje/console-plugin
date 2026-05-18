import type { FC } from 'react';
import { useRef, useMemo, memo } from 'react';
import cx from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Tooltip } from '@patternfly/react-core';
import BundleIcon from '@patternfly/react-icons/dist/js/icons/bundle-icon';
import {
  observer,
  Node,
  NodeModel,
  useHover,
  createSvgIdUrl,
} from '@patternfly/react-topology';
import { truncateMiddle } from './truncate-middle';
import SvgDropShadowFilter from './SvgDropShadowFilter';
import { TaskNodeModelData } from './types';
import { resourcePathFromModel } from '../utils/utils';
import { PipelineModel } from '../../models';

import './CustomTaskNode.scss';

const FILTER_ID = 'SvgPipelineRefDropShadowFilterId';
const PIPELINE_REF_COLOR = '#0066cc';

type PipelineRefTaskNodeProps = {
  element: Node<NodeModel, TaskNodeModelData>;
  disableTooltip?: boolean;
};

interface PipelineRefTaskComponentProps {
  pipelineRunName?: string;
  name: string;
  namespace: string;
  pipelineRefName?: string;
  disableVisualizationTooltip?: boolean;
  width: number;
  height: number;
}

const PipelineRefTaskComponent: FC<PipelineRefTaskComponentProps> = ({
  pipelineRunName,
  namespace,
  name,
  pipelineRefName,
  disableVisualizationTooltip,
  width,
  height,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const showStatusState = !!pipelineRunName;
  const visualName = name;
  const nameRef = useRef();
  const pillRef = useRef();

  const path = pipelineRefName
    ? resourcePathFromModel(PipelineModel, pipelineRefName, namespace)
    : undefined;
  const enableLogLink = !!path;
  const [hover, hoverRef] = useHover();
  const truncatedVisualName = useMemo(
    () =>
      truncateMiddle(visualName, {
        length: showStatusState ? 11 : 14,
        truncateEnd: true,
      }),
    [visualName, showStatusState],
  );

  const renderVisualName = (
    <text
      ref={nameRef}
      x={30}
      y={height / 2 + 1}
      className={cx('odc-pipeline-vis-task-text', {
        'is-linked': enableLogLink,
      })}
    >
      {truncatedVisualName}
    </text>
  );

  let taskPill = (
    <g ref={hoverRef}>
      <SvgDropShadowFilter dy={1} id={FILTER_ID} />
      <rect
        filter={hover ? createSvgIdUrl(FILTER_ID) : ''}
        width={width}
        height={height}
        rx={5}
        className={cx('odc-pipeline-vis-task', {
          'is-selected': hover,
          'is-linked': enableLogLink,
        })}
        style={{
          stroke: PIPELINE_REF_COLOR,
          strokeWidth: 2,
        }}
      />
      {visualName !== truncatedVisualName && disableVisualizationTooltip ? (
        <Tooltip triggerRef={nameRef} content={visualName}>
          {renderVisualName}
        </Tooltip>
      ) : (
        renderVisualName
      )}
      <svg
        width={30}
        height={30}
        viewBox="-10 -7 30 30"
        style={{
          color: PIPELINE_REF_COLOR,
        }}
      >
        <BundleIcon />
      </svg>
    </g>
  );

  if (!disableVisualizationTooltip) {
    taskPill = (
      <Tooltip
        triggerRef={pillRef}
        position="bottom"
        enableFlip={false}
        content={t('Nested Pipeline')}
      >
        <g ref={pillRef}>{taskPill}</g>
      </Tooltip>
    );
  }
  return (
    <g
      className={cx('odc-pipeline-topology__task-node', {
        'is-link': enableLogLink,
      })}
    >
      {enableLogLink ? <Link to={path}>{taskPill}</Link> : taskPill}
    </g>
  );
};

const PipelineRefTaskNode: FC<PipelineRefTaskNodeProps> = ({
  element,
  disableTooltip,
}) => {
  const { height, width } = element.getBounds();
  const { pipeline, pipelineRun, task } = element.getData();

  return (
    <PipelineRefTaskComponent
      pipelineRunName={pipelineRun?.metadata?.name}
      name={task.name || ''}
      namespace={pipeline?.metadata?.namespace}
      pipelineRefName={task.pipelineRef?.name}
      disableVisualizationTooltip={disableTooltip}
      width={width}
      height={height}
    />
  );
};

export default memo(observer(PipelineRefTaskNode));
