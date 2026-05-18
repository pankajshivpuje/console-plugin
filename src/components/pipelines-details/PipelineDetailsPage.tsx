import {
  BreadcrumbItem,
  Content,
  ContentVariants,
} from '@patternfly/react-core';
import { useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  getGroupVersionKindForModel,
  useK8sWatchResource,
} from '@openshift-console/dynamic-plugin-sdk';
import { LazyActionMenu } from '@openshift-console/dynamic-plugin-sdk-internal';
import { ActionMenuVariant } from '@openshift-console/dynamic-plugin-sdk-internal/lib/api/internal-types';
import { PipelineModel } from '../../models';
import { LoadingBox } from '../status/status-box';
import DetailsPage from '../details-page/DetailsPage';
import { navFactory } from '../utils/horizontal-nav';
import ResourceYAMLEditorTab from '../yaml-editor/ResourceYAMLEditorTab';
import PipelineDetails from './PipelineDetails';
import { PipelineKind } from '../../types';
import { getReferenceForModel } from '../pipelines-overview/utils';
import PipelineParamatersTab from './PipelineParamatersTab';
import { ErrorPage404 } from '../common/error';
import { MOCK_PIPELINES } from '../__demo__/mock-data';

const PipelineDetailsPage = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const params = useParams();
  const { name, ns: namespace } = params;
  const [k8sPipeline, loaded, loadError] = useK8sWatchResource<PipelineKind>({
    groupVersionKind: getGroupVersionKindForModel(PipelineModel),
    namespace,
    name,
  });
  const pipeline = useMemo(() => {
    if (k8sPipeline?.metadata?.name) return k8sPipeline;
    if (loadError || (loaded && !k8sPipeline?.metadata?.name)) {
      return (MOCK_PIPELINES.find(
        (m) => m.metadata?.name === name && m.metadata?.namespace === namespace,
      ) as PipelineKind) || k8sPipeline;
    }
    return k8sPipeline;
  }, [k8sPipeline, loaded, loadError, name, namespace]);

  const resourceTitleFunc = useMemo(() => {
    return (
      <div className="Pipeline-details-page">{pipeline?.metadata?.name} </div>
    );
  }, [pipeline]);

  const customActionMenu = useCallback((_kindObj, obj) => {
    const reference = getReferenceForModel(PipelineModel);
    const context = { [reference]: obj };
    return (
      <LazyActionMenu
        context={context}
        variant={ActionMenuVariant.DROPDOWN}
        label={t('Actions')}
      />
    );
  }, []);

  if (!loaded && !pipeline?.metadata?.name) {
    return <LoadingBox />;
  }
  if (loadError && !pipeline?.metadata?.name) {
    return <ErrorPage404 />;
  }
  return (
    <DetailsPage
      obj={pipeline}
      headTitle={name}
      title={
        <Content component={ContentVariants.h1}>{resourceTitleFunc}</Content>
      }
      model={PipelineModel}
      breadcrumbs={[
        <BreadcrumbItem key="app-link" component="div">
          <Link
            data-test="breadcrumb-link"
            className="pf-v6-c-breadcrumb__link"
            to={`/pipelines/ns/${namespace}/`}
          >
            {t('Pipelines')}
          </Link>
        </BreadcrumbItem>,
        {
          path: `/pipelines/ns/${namespace}/`,
          name: t('Pipeline details'),
        },
      ]}
      pages={[
        navFactory.details(PipelineDetails),
        navFactory.editYaml(ResourceYAMLEditorTab),
        {
          href: 'parameters',
          name: t('Parameters'),
          component: PipelineParamatersTab,
        },
      ]}
      customActionMenu={customActionMenu}
    />
  );
};

export default PipelineDetailsPage;
