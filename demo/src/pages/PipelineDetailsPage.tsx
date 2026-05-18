import type { FC } from 'react';
import { useParams, Link } from 'react-router';
import { PageSection, Content, Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { MOCK_PIPELINES } from '../../../src/components/__demo__/mock-data';
import PipelineVisualization from '../../../src/components/pipelines-details/PipelineVisualization';

const PipelineDetailsPage: FC = () => {
  const { name } = useParams<{ name: string }>();
  const pipeline = MOCK_PIPELINES.find((p) => p.metadata.name === name);

  if (!pipeline) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Content component="h1">Pipeline not found: {name}</Content>
        <Link to="/pipelines">Back to Pipelines</Link>
      </PageSection>
    );
  }

  return (
    <PageSection hasBodyWrapper={false}>
      <Breadcrumb style={{ marginBottom: '1rem' }}>
        <BreadcrumbItem>
          <Link to="/pipelines">Pipelines</Link>
        </BreadcrumbItem>
        <BreadcrumbItem isActive>{pipeline.metadata.name}</BreadcrumbItem>
      </Breadcrumb>
      <Content component="h1" style={{ marginBottom: '1rem' }}>
        {pipeline.metadata.name}
      </Content>
      <div style={{ height: 400, border: '1px solid #d2d2d2', borderRadius: 8 }}>
        <PipelineVisualization pipeline={pipeline} />
      </div>
    </PageSection>
  );
};

export default PipelineDetailsPage;
