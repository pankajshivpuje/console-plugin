import type { FC } from 'react';
import { useCallback, useMemo } from 'react';
import { ResourceStatus } from '@openshift-console/dynamic-plugin-sdk';
import { PipelineRunModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import DetailsPage from '../details-page/DetailsPage';
import {
  BreadcrumbItem,
  Content,
  ContentVariants,
  Label,
  Tooltip,
} from '@patternfly/react-core';
import { Link, useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import { navFactory } from '../utils/horizontal-nav';
import PipelineRunDetails from './PipelineRunDetails';
import ResourceYAMLEditorViewOnly from '../yaml-editor/ResourceYAMLEditorViewOnly';
import {
  DELETED_RESOURCE_IN_K8S_ANNOTATION,
  RESOURCE_LOADED_FROM_RESULTS_ANNOTATION,
  PIPELINE_RUN_MANAGED_BY_KUEUE_LABEL,
} from '../../consts';
import { ComputedStatus } from '../../types';
import { ArchiveIcon, MulticlusterIcon } from '@patternfly/react-icons';
import ChainsSigningBadge from '../chains/ChainsSigningBadge';
import { useChainsSigningStatus } from '../hooks/useChainsSigningStatus';
import { useTaskRuns } from '../hooks/useTaskRuns';
import Status from '../status/Status';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../utils/pipeline-filter-reducer';
import PipelineRunParametersForm from './PipelineRunParametersForm';
import { PipelineRunLogsWithActiveTask } from './PipelineRunLogs';
import PipelineRunEvents from './PipelineRunEvents';
import { usePipelineRuns } from '../hooks/useTaskRuns';
import { getReferenceForModel } from '../pipelines-overview/utils';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { ActionMenuVariant } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';

type PipelineRunDetailsPageProps = {
  name: string;
  namespace: string;
};

const PipelineRunDetailsPage: FC<PipelineRunDetailsPageProps> = ({
  name,
  namespace,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [searchParams] = useSearchParams();
  const clusterName = searchParams.get('cluster');
  const [pipelineRuns, k8sLoaded, trLoaded] = usePipelineRuns(namespace, {
    name,
    limit: 1,
  });
  const pipelineRun = pipelineRuns?.[0];
  /* this needs decoupling */
  const pipelineRunLoaded = k8sLoaded || trLoaded;

  const plrStatus = pipelineRunFilterReducer(pipelineRun);
  const pipelineRunFinished =
    plrStatus !== ComputedStatus.Running &&
    plrStatus !== ComputedStatus.Pending &&
    plrStatus !== ComputedStatus.Cancelling;
  const [taskRuns, trK8sLoaded, trResultsLoaded] = useTaskRuns(
    namespace,
    name,
    undefined,
    undefined,
    {
      pipelineRunFinished,
      pipelineRunManagedBy: pipelineRun?.spec?.managedBy,
    },
  );
  const taskRunsLoaded = trK8sLoaded && trResultsLoaded;
  const chainsSummary = useChainsSigningStatus(
    pipelineRun,
    taskRuns,
    taskRunsLoaded,
  );

  const customActionMenu = useCallback((_kindObj, obj) => {
    const reference = getReferenceForModel(PipelineRunModel);
    const context = { [reference]: obj };
    return (
      <LazyActionMenu
        context={context}
        variant={ActionMenuVariant.DROPDOWN}
        label={t('Actions')}
      />
    );
  }, []);

  const resourceTitleFunc = useMemo((): string | JSX.Element => {
    return (
      <div className="pipelinerun-details-page pf-v6-l-flex pf-v6-l-gap-md pf-v6-u-align-items-center">
        {pipelineRun?.metadata?.name}{' '}
        <ChainsSigningBadge summary={chainsSummary} iconSize={18} />
        {(pipelineRun?.metadata?.annotations?.[
          DELETED_RESOURCE_IN_K8S_ANNOTATION
        ] === 'true' ||
          pipelineRun?.metadata?.annotations?.[
            RESOURCE_LOADED_FROM_RESULTS_ANNOTATION
          ] === 'true') && (
          <Tooltip content={t('Archived in Tekton results')}>
            <ArchiveIcon className="pipelinerun-details-page__results-indicator" />
          </Tooltip>
        )}
        {(pipelineRun?.spec?.managedBy ===
          PIPELINE_RUN_MANAGED_BY_KUEUE_LABEL ||
          clusterName) && (
          <Tooltip content={t('Multicluster Pipeline Run')}>
            <Label color="blue" isCompact icon={<MulticlusterIcon />}>
              {clusterName || t('Multi-cluster')}
            </Label>
          </Tooltip>
        )}
        <ResourceStatus>
          <Status
            status={pipelineRunFilterReducer(pipelineRun)}
            title={pipelineRunTitleFilterReducer(pipelineRun)}
          />
        </ResourceStatus>
      </div>
    );
  }, [pipelineRun, clusterName]);
  if (!pipelineRunLoaded) {
    return <LoadingBox />;
  }
  return (
    <DetailsPage
      obj={pipelineRun}
      headTitle={name}
      title={
        <Content component={ContentVariants.h1}>{resourceTitleFunc}</Content>
      }
      model={PipelineRunModel}
      breadcrumbs={
        clusterName
          ? [
              <BreadcrumbItem key="mc-link" component="div">
                <Link
                  data-test="breadcrumb-link"
                  className="pf-v6-c-breadcrumb__link"
                  to={`/pipelines/ns/${namespace}`}
                >
                  {t('PipelineRuns')}
                </Link>
              </BreadcrumbItem>,
              <BreadcrumbItem key="cluster-link" component="div">
                <Link
                  className="pf-v6-c-breadcrumb__link"
                  to={`/pipelines/ns/${namespace}?cluster=${clusterName}`}
                >
                  {clusterName}
                </Link>
              </BreadcrumbItem>,
              {
                path: `/pipelines/ns/${namespace}/`,
                name: t('PipelineRun details'),
              },
            ]
          : [
              <BreadcrumbItem key="app-link" component="div">
                <Link
                  data-test="breadcrumb-link"
                  className="pf-v6-c-breadcrumb__link"
                  to={`/pipelines/ns/${namespace}/pipeline-runs`}
                >
                  {t('PipelineRuns')}
                </Link>
              </BreadcrumbItem>,
              {
                path: `/pipelines/ns/${namespace}/`,
                name: t('PipelineRun details'),
              },
            ]
      }
      pages={[
        navFactory.details(PipelineRunDetails),
        navFactory.editYaml(ResourceYAMLEditorViewOnly),
        {
          href: 'parameters',
          name: t('Parameters'),
          component: (pageProps) => (
            <PipelineRunParametersForm obj={pipelineRun} {...pageProps} />
          ),
        },
        {
          href: 'logs',
          name: t('Logs'),
          component: PipelineRunLogsWithActiveTask,
        },
        navFactory.events(PipelineRunEvents),
      ]}
      customActionMenu={customActionMenu}
    />
  );
};

export default PipelineRunDetailsPage;
