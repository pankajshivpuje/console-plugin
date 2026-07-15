import { type FC, useEffect, useState } from 'react';
import {
  Button,
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  EmptyState,
  EmptyStateActions,
  EmptyStateBody,
  EmptyStateFooter,
  Spinner,
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { PipelineRunKind, FailureAnalysisData } from '../../types';
import { MOCK_FAILURE_ANALYSIS } from '../__demo__/mock-failure-analysis-data';

type PipelineRunFailureAnalysisProps = {
  obj?: PipelineRunKind;
};

const PipelineRunFailureAnalysis: FC<PipelineRunFailureAnalysisProps> = ({
  obj,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const location = useLocation();
  const name = obj?.metadata?.name ?? '';
  const [analysis, setAnalysis] = useState<FailureAnalysisData | null>(
    MOCK_FAILURE_ANALYSIS[name] ?? null,
  );
  const [loading, setLoading] = useState(false);

  const runAnalysis = () => {
    setLoading(true);
    setTimeout(() => {
      setAnalysis(
        MOCK_FAILURE_ANALYSIS[name] ?? {
          createdAt: new Date().toISOString(),
          duration: 'N/A',
          reasonForFailure: t(
            'Unable to determine failure reason. Check task logs for details.',
          ),
          rootCause: t(
            'Automated analysis could not identify a specific root cause.',
          ),
          remediationSteps: [
            t('Review the task logs for error messages.'),
            t('Check the pipeline configuration and parameters.'),
            t('Verify cluster connectivity and resource availability.'),
          ],
        },
      );
      setLoading(false);
    }, 2000);
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('analyze') === 'true' && !analysis && !loading) {
      runAnalysis();
    }
  }, [location.search]);

  if (loading) {
    return (
      <EmptyState>
        <Spinner size="xl" />
        <EmptyStateBody>
          {t('Analyzing pipeline run failure...')}
        </EmptyStateBody>
      </EmptyState>
    );
  }

  if (!analysis) {
    return (
      <EmptyState headingLevel="h4" icon={SearchIcon}>
        <EmptyStateBody>
          {t(
            'No failure analysis available yet. Run the analysis to identify the root cause and get remediation steps.',
          )}
        </EmptyStateBody>
        <EmptyStateFooter>
          <EmptyStateActions>
            <Button variant="primary" onClick={runAnalysis}>
              {t('Analyze failure')}
            </Button>
          </EmptyStateActions>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  return (
    <div className="pf-v6-u-m-lg">
      <DescriptionList isHorizontal>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Created at')}</DescriptionListTerm>
          <DescriptionListDescription>
            {new Date(analysis.createdAt).toLocaleString()}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Duration')}</DescriptionListTerm>
          <DescriptionListDescription>
            {analysis.duration}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Reason for failure')}</DescriptionListTerm>
          <DescriptionListDescription>
            {analysis.reasonForFailure}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Root cause')}</DescriptionListTerm>
          <DescriptionListDescription>
            {analysis.rootCause}
          </DescriptionListDescription>
        </DescriptionListGroup>
        <DescriptionListGroup>
          <DescriptionListTerm>{t('Remediation steps')}</DescriptionListTerm>
          <DescriptionListDescription>
            <ol>
              {analysis.remediationSteps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </DescriptionListDescription>
        </DescriptionListGroup>
      </DescriptionList>
    </div>
  );
};

export default PipelineRunFailureAnalysis;
