import type { FC } from 'react';
import { PageSection, Content } from '@patternfly/react-core';
import PipelinesList from '../../../src/components/pipelines-list/PipelinesList';

const PipelinesPage: FC = () => (
  <PageSection hasBodyWrapper={false}>
    <Content component="h1" style={{ marginBottom: '1rem' }}>Pipelines</Content>
    <PipelinesList namespace="default" hideTextFilter />
  </PageSection>
);

export default PipelinesPage;
