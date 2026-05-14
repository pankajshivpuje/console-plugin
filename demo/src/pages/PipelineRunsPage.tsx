import type { FC } from 'react';
import { PageSection, Content } from '@patternfly/react-core';
import PipelineRunsList from '../../../src/components/pipelineRuns-list/PipelineRunsList';

const PipelineRunsPage: FC = () => (
  <PageSection hasBodyWrapper={false}>
    <Content component="h1" style={{ marginBottom: '1rem' }}>PipelineRuns</Content>
    <PipelineRunsList namespace="default" hideTextFilter />
  </PageSection>
);

export default PipelineRunsPage;
