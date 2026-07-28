import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Content,
  ContentVariants,
  PageSection,
} from '@patternfly/react-core';
import MultiClusterPipelineRunsList from './MultiClusterPipelineRunsList';

type ClusterPipelinesTabProps = {
  obj: {
    metadata: {
      name: string;
    };
  };
};

const ClusterPipelinesTab: FC<ClusterPipelinesTabProps> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const clusterName = obj?.metadata?.name;

  return (
    <PageSection>
      <Content component={ContentVariants.h2} className="pf-v6-u-mb-md">
        {t('PipelineRuns on {{clusterName}}', { clusterName })}
      </Content>
      <MultiClusterPipelineRunsList clusterFilter={clusterName} />
    </PageSection>
  );
};

export default ClusterPipelinesTab;
