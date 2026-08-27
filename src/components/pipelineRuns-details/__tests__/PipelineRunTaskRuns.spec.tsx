import { render, screen } from '@testing-library/react';
import PipelineRunTaskRuns from '../PipelineRunTaskRuns';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockUseTaskRuns = jest.fn();
jest.mock('../../hooks/useTaskRuns', () => ({
  useTaskRuns: (...args: unknown[]) => mockUseTaskRuns(...args),
}));

jest.mock('../../status/Status', () => ({
  __esModule: true,
  default: ({ status }: { status: string }) => <span data-testid="status">{status}</span>,
}));

jest.mock('../../utils/pipeline-filter-reducer', () => ({
  pipelineRunFilterReducer: (tr: any) => {
    const cond = tr?.status?.conditions?.find((c: any) => c.type === 'Succeeded');
    if (!cond) return 'Pending';
    if (cond.status === 'True') return 'Succeeded';
    if (cond.status === 'False') return 'Failed';
    return 'Running';
  },
}));

const pipelineRun = {
  metadata: { name: 'build-and-gitops', namespace: 'demo' },
} as any;

describe('PipelineRunTaskRuns', () => {
  it('renders a row per TaskRun', () => {
    mockUseTaskRuns.mockReturnValue([
      [
        {
          metadata: { name: 'build-and-gitops-fetch', namespace: 'demo' },
          spec: { taskRef: { name: 'git-clone' } },
          status: { conditions: [{ type: 'Succeeded', status: 'True' }] },
        },
      ],
      true,
      true,
      undefined,
    ]);
    render(<PipelineRunTaskRuns obj={pipelineRun} />);
    expect(screen.getByText('build-and-gitops-fetch')).toBeTruthy();
    expect(screen.getByText('git-clone')).toBeTruthy();
  });

  it('renders an empty state when there are no TaskRuns', () => {
    mockUseTaskRuns.mockReturnValue([[], true, true, undefined]);
    render(<PipelineRunTaskRuns obj={pipelineRun} />);
    expect(screen.getByText('No TaskRuns found')).toBeTruthy();
  });
});
