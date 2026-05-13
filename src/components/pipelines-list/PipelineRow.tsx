import {
  ResourceLink,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import type { FC } from 'react';
import { Link } from 'react-router';
import { PipelineWithLatest } from '../../types/pipelineRun';
import { PipelineKind } from '../../types/pipeline';
import LinkedPipelineRunTaskStatus from './status/LinkedPipelineRunTaskStatus';
import {
  pipelineFilterReducer,
  pipelineTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import { NamespaceModel, PipelineModel, PipelineRunModel } from '../../models';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { tableColumnInfo } from './usePipelinesColumns';
import { DASH } from '../../consts';

export const getNestedPipelineCount = (pipeline: PipelineKind): number => {
  const tasks = pipeline.spec?.tasks || [];
  const finallyTasks = pipeline.spec?.finally || [];
  return [...tasks, ...finallyTasks].filter((t) => t.pipelineRef).length;
};

type PipelineStatusProps = {
  obj: PipelineWithLatest;
};

const PipelineStatus: FC<PipelineStatusProps> = ({ obj }) => {
  return (
    <PipelineRunStatusContent
      status={pipelineFilterReducer(obj)}
      title={pipelineTitleFilterReducer(obj)}
      pipelineRun={obj.latestRun}
    />
  );
};

export const getPipelineListDataViewRows: GetDataViewRows<
  PipelineWithLatest,
  undefined
> = (data, columns) => {
  return data.map(({ obj, rowData }) => {
    const rowCells = {
      [tableColumnInfo[0].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PipelineModel)}
            name={obj.metadata.name}
            namespace={obj.metadata.namespace}
          />
        ),
        props: { ...getNameCellProps('pipelines-list'), modifier: 'nowrap' },
      },
      [tableColumnInfo[1].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={obj.metadata.namespace}
          />
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[2].id]: {
        cell: (() => {
          const count = getNestedPipelineCount(obj);
          if (count > 0) {
            return (
              <Link
                to={`/k8s/ns/${obj.metadata.namespace}/tekton.dev~v1~Pipeline?nestedIn=${obj.metadata.name}`}
              >
                {count}
              </Link>
            );
          }
          return DASH;
        })(),
      },
      [tableColumnInfo[3].id]: {
        cell: obj?.latestRun?.metadata?.name ? (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(PipelineRunModel)}
            name={obj.latestRun.metadata.name}
            namespace={obj.latestRun.metadata.namespace}
          />
        ) : (
          DASH
        ),
        props: { modifier: 'nowrap' },
      },
      [tableColumnInfo[4].id]: {
        cell: obj?.latestRun ? (
          <LinkedPipelineRunTaskStatus pipelineRun={obj.latestRun} />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[5].id]: {
        cell: <PipelineStatus obj={obj} />,
      },
      [tableColumnInfo[6].id]: {
        cell: obj.latestRun?.status?.startTime ? (
          <Timestamp timestamp={obj.latestRun.status.startTime} />
        ) : (
          DASH
        ),
      },
      [tableColumnInfo[7].id]: {
        cell: (
          <LazyActionMenu
            context={{ [getReferenceForModel(PipelineModel)]: obj }}
          />
        ),
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => {
      const cell = rowCells[id]?.cell;
      const props = rowCells[id]?.props;
      return {
        id,
        props,
        cell,
      };
    });
  });
};
