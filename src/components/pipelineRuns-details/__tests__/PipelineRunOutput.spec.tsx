import { render, screen } from '@testing-library/react';
import PipelineRunOutput from '../PipelineRunOutput';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('PipelineRunOutput', () => {
  it('renders result name/value pairs', () => {
    const obj = {
      status: {
        results: [
          { name: 'IMAGE_URL', value: 'quay.io/demo/app:latest' },
          { name: 'IMAGE_DIGEST', value: 'sha256:abc' },
        ],
      },
    } as any;
    render(<PipelineRunOutput obj={obj} />);
    expect(screen.getByText('IMAGE_URL')).toBeTruthy();
    expect(screen.getByText('quay.io/demo/app:latest')).toBeTruthy();
  });

  it('renders an empty state when there are no results', () => {
    render(<PipelineRunOutput obj={{ status: {} } as any} />);
    expect(screen.getByText('No output results')).toBeTruthy();
  });
});
