import {
  ResourceLink,
  ResourceIcon,
  Timestamp,
  getGroupVersionKindForModel,
} from '@openshift-console/dynamic-plugin-sdk';
import { Label } from '@patternfly/react-core';
import { Link } from 'react-router';
import { MultiClusterPipelineRunKind } from '../../types';
import { NamespaceModel, PipelineRunModel } from '../../models';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import LinkedPipelineRunTaskStatus from '../pipelines-list/status/LinkedPipelineRunTaskStatus';
import { pipelineRunDuration } from '../utils/pipeline-utils';
import PipelineRunStatusContent from '../status/PipelineRunStatusContent';
import {
  actionsCellProps,
  getNameCellProps,
  LazyActionMenu,
} from '@openshift-console/dynamic-plugin-sdk-internal';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { resourcePathFromModel } from '../utils/utils';
import { GetDataViewRows } from '@openshift-console/dynamic-plugin-sdk/lib/api/internal-types';
import { mcTableColumnInfo } from './useMultiClusterPipelineRunsColumns';
import { LOCAL_CLUSTER_NAME } from '../../consts';

const clusterStatusColor = (
  clusterName: string,
): 'blue' | 'green' | 'grey' => {
  if (clusterName === LOCAL_CLUSTER_NAME) return 'blue';
  return 'green';
};

export const getMultiClusterPipelineRunsRows: GetDataViewRows<
  MultiClusterPipelineRunKind,
  Record<string, never>
> = (data, columns) => {
  return data.map(({ obj }) => {
    const clusterName = obj._clusterName || 'unknown';

    const plrPath = `${resourcePathFromModel(PipelineRunModel, obj.metadata.name, obj.metadata.namespace)}?cluster=${encodeURIComponent(clusterName)}`;
    const kindRef = getReferenceForModel(PipelineRunModel);

    const rowCells = {
      [mcTableColumnInfo[0].id]: {
        cell: (
          <span className="co-resource-item">
            <ResourceIcon kind={kindRef} />
            <Link
              to={plrPath}
              className="co-resource-item__resource-name"
              data-test-id={obj.metadata.name}
            >
              {obj.metadata.name}
            </Link>
          </span>
        ),
        props: {
          ...getNameCellProps('mc-pipelineruns-list'),
          modifier: 'nowrap' as const,
        },
      },
      [mcTableColumnInfo[1].id]: {
        cell: (
          <Label color={clusterStatusColor(clusterName)} isCompact>
            {clusterName}
          </Label>
        ),
        props: { modifier: 'nowrap' as const },
      },
      [mcTableColumnInfo[2].id]: {
        cell: (
          <ResourceLink
            groupVersionKind={getGroupVersionKindForModel(NamespaceModel)}
            name={obj.metadata.namespace}
          />
        ),
        props: { modifier: 'nowrap' as const },
      },
      [mcTableColumnInfo[3].id]: {
        cell: (
          <PipelineRunStatusContent
            status={pipelineRunFilterReducer(obj)}
            title={pipelineRunTitleFilterReducer(obj)}
            pipelineRun={obj}
          />
        ),
        props: { modifier: 'nowrap' as const },
      },
      [mcTableColumnInfo[4].id]: {
        cell: <LinkedPipelineRunTaskStatus pipelineRun={obj} />,
        props: { modifier: 'nowrap' as const },
      },
      [mcTableColumnInfo[5].id]: {
        cell: <Timestamp timestamp={obj.status?.startTime} />,
        props: { modifier: 'nowrap' as const },
      },
      [mcTableColumnInfo[6].id]: {
        cell: pipelineRunDuration(obj),
        props: { modifier: 'nowrap' as const },
      },
      [mcTableColumnInfo[7].id]: {
        cell: (
          <LazyActionMenu
            context={{ [getReferenceForModel(PipelineRunModel)]: obj }}
          />
        ),
        props: actionsCellProps,
      },
    };

    return columns.map(({ id }) => ({
      id,
      props: rowCells[id]?.props,
      cell: rowCells[id]?.cell,
    }));
  });
};
