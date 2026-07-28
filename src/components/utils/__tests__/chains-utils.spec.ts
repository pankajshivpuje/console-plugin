import { ChainsSigningStatus, TaskRunKind } from '../../../types';
import {
  aggregateChainsSigningStatus,
  getTaskRunChainsStatus,
  isPipelineRunDirectlySigned,
} from '../chains-utils';

const makeTaskRun = (
  name: string,
  annotations?: Record<string, string>,
  labels?: Record<string, string>,
): TaskRunKind =>
  ({
    metadata: { name, annotations, labels },
    spec: {},
  }) as TaskRunKind;

describe('getTaskRunChainsStatus', () => {
  it('returns signed=true when annotation is true', () => {
    const tr = makeTaskRun('tr-1', {
      'chains.tekton.dev/signed': 'true',
      'chains.tekton.dev/transparency':
        'https://rekor.sigstore.dev/api/v1/log/entries?logIndex=123',
    });
    const result = getTaskRunChainsStatus(tr);
    expect(result.name).toBe('tr-1');
    expect(result.signed).toBe(true);
    expect(result.transparencyUrl).toBe(
      'https://rekor.sigstore.dev/api/v1/log/entries?logIndex=123',
    );
  });

  it('returns signed=false when annotation is false', () => {
    const tr = makeTaskRun('tr-2', {
      'chains.tekton.dev/signed': 'false',
    });
    const result = getTaskRunChainsStatus(tr);
    expect(result.signed).toBe(false);
    expect(result.transparencyUrl).toBeUndefined();
  });

  it('returns signed=false when no annotations', () => {
    const tr = makeTaskRun('tr-3');
    expect(getTaskRunChainsStatus(tr).signed).toBe(false);
  });

  it('extracts pipelineTaskName from label', () => {
    const tr = makeTaskRun(
      'tr-4',
      { 'chains.tekton.dev/signed': 'true' },
      { 'tekton.dev/pipelineTask': 'build' },
    );
    expect(getTaskRunChainsStatus(tr).pipelineTaskName).toBe('build');
  });
});

describe('aggregateChainsSigningStatus', () => {
  it('returns Unknown for empty array', () => {
    const result = aggregateChainsSigningStatus([]);
    expect(result.status).toBe(ChainsSigningStatus.Unknown);
    expect(result.totalTaskRuns).toBe(0);
  });

  it('returns Unknown for null/undefined', () => {
    const result = aggregateChainsSigningStatus(
      null as unknown as TaskRunKind[],
    );
    expect(result.status).toBe(ChainsSigningStatus.Unknown);
  });

  it('returns Signed when all TaskRuns are signed', () => {
    const taskRuns = [
      makeTaskRun('tr-1', { 'chains.tekton.dev/signed': 'true' }),
      makeTaskRun('tr-2', { 'chains.tekton.dev/signed': 'true' }),
    ];
    const result = aggregateChainsSigningStatus(taskRuns);
    expect(result.status).toBe(ChainsSigningStatus.Signed);
    expect(result.signedCount).toBe(2);
    expect(result.unsignedCount).toBe(0);
    expect(result.totalTaskRuns).toBe(2);
  });

  it('returns Unsigned when no TaskRuns are signed', () => {
    const taskRuns = [
      makeTaskRun('tr-1', { 'chains.tekton.dev/signed': 'false' }),
      makeTaskRun('tr-2', { 'chains.tekton.dev/signed': 'false' }),
    ];
    const result = aggregateChainsSigningStatus(taskRuns);
    expect(result.status).toBe(ChainsSigningStatus.Unsigned);
    expect(result.signedCount).toBe(0);
    expect(result.unsignedCount).toBe(2);
  });

  it('returns Partial when some TaskRuns are signed', () => {
    const taskRuns = [
      makeTaskRun('tr-1', { 'chains.tekton.dev/signed': 'true' }),
      makeTaskRun('tr-2', { 'chains.tekton.dev/signed': 'false' }),
      makeTaskRun('tr-3', { 'chains.tekton.dev/signed': 'true' }),
    ];
    const result = aggregateChainsSigningStatus(taskRuns);
    expect(result.status).toBe(ChainsSigningStatus.Partial);
    expect(result.signedCount).toBe(2);
    expect(result.unsignedCount).toBe(1);
  });

  it('returns Unknown when no Chains annotations exist', () => {
    const taskRuns = [
      makeTaskRun('tr-1', { 'some-other/annotation': 'value' }),
      makeTaskRun('tr-2'),
    ];
    const result = aggregateChainsSigningStatus(taskRuns);
    expect(result.status).toBe(ChainsSigningStatus.Unknown);
  });

  it('extracts first transparency URL', () => {
    const taskRuns = [
      makeTaskRun('tr-1', { 'chains.tekton.dev/signed': 'true' }),
      makeTaskRun('tr-2', {
        'chains.tekton.dev/signed': 'true',
        'chains.tekton.dev/transparency': 'https://rekor.example.com/123',
      }),
    ];
    const result = aggregateChainsSigningStatus(taskRuns);
    expect(result.transparencyUrl).toBe('https://rekor.example.com/123');
  });

  it('includes per-TaskRun details', () => {
    const taskRuns = [
      makeTaskRun('tr-1', { 'chains.tekton.dev/signed': 'true' }),
      makeTaskRun('tr-2', { 'chains.tekton.dev/signed': 'false' }),
    ];
    const result = aggregateChainsSigningStatus(taskRuns);
    expect(result.taskRunDetails).toHaveLength(2);
    expect(result.taskRunDetails[0].name).toBe('tr-1');
    expect(result.taskRunDetails[0].signed).toBe(true);
    expect(result.taskRunDetails[1].name).toBe('tr-2');
    expect(result.taskRunDetails[1].signed).toBe(false);
  });
});

describe('isPipelineRunDirectlySigned', () => {
  it('returns true when signed annotation is true', () => {
    expect(
      isPipelineRunDirectlySigned({
        'chains.tekton.dev/signed': 'true',
      }),
    ).toBe(true);
  });

  it('returns false when signed annotation is false', () => {
    expect(
      isPipelineRunDirectlySigned({
        'chains.tekton.dev/signed': 'false',
      }),
    ).toBe(false);
  });

  it('returns false when no annotations', () => {
    expect(isPipelineRunDirectlySigned(undefined)).toBe(false);
  });
});
