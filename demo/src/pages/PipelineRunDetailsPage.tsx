import type { FC } from 'react';
import { useParams, Link } from 'react-router';
import {
  PageSection,
  Content,
  Breadcrumb,
  BreadcrumbItem,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Grid,
  GridItem,
  Title,
} from '@patternfly/react-core';
import { MOCK_PIPELINE_RUNS } from '../../../src/components/__demo__/mock-data';
import { getPipelineFromPipelineRun } from '../../../src/components/utils/pipeline-augment';
import PipelineVisualization from '../../../src/components/pipelines-details/PipelineVisualization';
import Status from '../../../src/components/status/Status';
import {
  pipelineRunFilterReducer,
  pipelineRunTitleFilterReducer,
} from '../../../src/components/utils/pipeline-filter-reducer';
import { pipelineRunDuration } from '../../../src/components/utils/pipeline-utils';
import { convertBackingPipelineToPipelineResourceRefProps } from '../../../src/components/pipelineRuns-details/utils';
import PipelineResourceRef from '../../../src/components/triggers-details/PipelineResourceRef';

const PipelineRunDetailsPage: FC = () => {
  const { name } = useParams<{ name: string }>();
  const pipelineRun = MOCK_PIPELINE_RUNS.find(
    (pr) => pr.metadata.name === name,
  );

  if (!pipelineRun) {
    return (
      <PageSection hasBodyWrapper={false}>
        <Content component="h1">PipelineRun not found: {name}</Content>
        <Link to="/pipeline-runs">Back to PipelineRuns</Link>
      </PageSection>
    );
  }

  const pipeline = getPipelineFromPipelineRun(pipelineRun);

  return (
    <PageSection hasBodyWrapper={false}>
      <Breadcrumb style={{ marginBottom: '1rem' }}>
        <BreadcrumbItem>
          <Link to="/pipeline-runs">PipelineRuns</Link>
        </BreadcrumbItem>
        <BreadcrumbItem isActive>{pipelineRun.metadata.name}</BreadcrumbItem>
      </Breadcrumb>
      <Content component="h1" style={{ marginBottom: '1rem' }}>
        {pipelineRun.metadata.name}
      </Content>
      {pipeline && (
        <div
          style={{
            height: 400,
            border: '1px solid #d2d2d2',
            borderRadius: 8,
            marginBottom: '1.5rem',
          }}
        >
          <PipelineVisualization
            pipeline={pipeline}
            pipelineRun={pipelineRun}
          />
        </div>
      )}
      <Title headingLevel="h2" style={{ marginBottom: '1rem' }}>
        PipelineRun details
      </Title>
      <Grid hasGutter>
        <GridItem sm={6}>
          <DescriptionList>
            <DescriptionListGroup>
              <DescriptionListTerm>Status</DescriptionListTerm>
              <DescriptionListDescription>
                <Status
                  status={pipelineRunFilterReducer(pipelineRun)}
                  title={pipelineRunTitleFilterReducer(pipelineRun)}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Pipeline</DescriptionListTerm>
              <DescriptionListDescription>
                <PipelineResourceRef
                  {...convertBackingPipelineToPipelineResourceRefProps(
                    pipelineRun,
                  )}
                />
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Start time</DescriptionListTerm>
              <DescriptionListDescription>
                {pipelineRun?.status?.startTime
                  ? new Date(pipelineRun.status.startTime).toLocaleString()
                  : '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Completion time</DescriptionListTerm>
              <DescriptionListDescription>
                {pipelineRun?.status?.completionTime
                  ? new Date(
                      pipelineRun.status.completionTime,
                    ).toLocaleString()
                  : '-'}
              </DescriptionListDescription>
            </DescriptionListGroup>
            <DescriptionListGroup>
              <DescriptionListTerm>Duration</DescriptionListTerm>
              <DescriptionListDescription>
                {pipelineRunDuration(pipelineRun)}
              </DescriptionListDescription>
            </DescriptionListGroup>
          </DescriptionList>
        </GridItem>
      </Grid>
    </PageSection>
  );
};

export default PipelineRunDetailsPage;
