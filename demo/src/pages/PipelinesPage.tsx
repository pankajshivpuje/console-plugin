import type { FC } from 'react';
import { Link } from 'react-router';
import { PageSection, Content, Card, CardBody, Label, Flex, FlexItem } from '@patternfly/react-core';
import { MOCK_PIPELINES } from '../../../src/components/__demo__/mock-data';
import PipelinesList from '../../../src/components/pipelines-list/PipelinesList';

const PipelinesPage: FC = () => (
  <PageSection hasBodyWrapper={false}>
    <Content component="h1" style={{ marginBottom: '1rem' }}>Pipelines</Content>
    <Content component="h3" style={{ marginBottom: '0.5rem' }}>Pipeline Visualizations</Content>
    <Flex style={{ marginBottom: '1.5rem', gap: '0.5rem' }}>
      {MOCK_PIPELINES.map((p) => {
        const hasPipelineRef = p.spec.tasks?.some((t: any) => t.pipelineRef) ||
          p.spec.finally?.some((t: any) => t.pipelineRef);
        return (
          <FlexItem key={p.metadata.name}>
            <Card isCompact>
              <CardBody>
                <Link to={`/pipelines/${p.metadata.name}`}>
                  {p.metadata.name}
                </Link>
                {hasPipelineRef && (
                  <Label color="blue" isCompact style={{ marginLeft: '0.5rem' }}>
                    has pipelineRef
                  </Label>
                )}
              </CardBody>
            </Card>
          </FlexItem>
        );
      })}
    </Flex>
    <PipelinesList namespace="default" hideTextFilter />
  </PageSection>
);

export default PipelinesPage;
