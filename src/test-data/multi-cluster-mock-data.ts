import { PipelineRunKind } from '../types';
import { MultiClusterPipelineRunsResponse } from '../types/multiCluster';

const makePLR = (
  name: string,
  namespace: string,
  pipeline: string,
  status: 'True' | 'False' | 'Unknown',
  reason: string,
  startTime: string,
  completionTime?: string,
  taskCount?: { total: number; succeeded: number; failed?: number; running?: number },
): PipelineRunKind =>
  ({
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name,
      namespace,
      uid: `${name}-uid-${Math.random().toString(36).slice(2, 8)}`,
      creationTimestamp: startTime,
      labels: {
        'tekton.dev/pipeline': pipeline,
      },
    },
    spec: {
      pipelineRef: { name: pipeline },
    },
    status: {
      conditions: [
        {
          type: 'Succeeded',
          status,
          reason,
          lastTransitionTime: completionTime || startTime,
        },
      ],
      startTime,
      completionTime,
      ...(taskCount
        ? {
            childReferences: Array.from(
              { length: taskCount.total },
              (_, i) => ({
                name: `${name}-task-${i + 1}`,
                pipelineTaskName: `task-${i + 1}`,
                kind: 'TaskRun',
              }),
            ),
          }
        : {}),
    },
  }) as unknown as PipelineRunKind;

// ── local-cluster ────────────────────────────────────
const localClusterPLRs: PipelineRunKind[] = [
  makePLR('build-images-main', 'default', 'build-images', 'True', 'Succeeded',
    '2026-07-22T10:00:00Z', '2026-07-22T10:05:30Z', { total: 4, succeeded: 4 }),
  makePLR('deploy-frontend-hub', 'default', 'deploy-frontend', 'Unknown', 'Running',
    '2026-07-22T11:30:00Z', undefined, { total: 3, succeeded: 1, running: 1 }),
  makePLR('integration-tests-nightly', 'ci', 'integration-tests', 'False', 'Failed',
    '2026-07-22T09:00:00Z', '2026-07-22T09:12:00Z', { total: 6, succeeded: 4, failed: 1 }),
  makePLR('security-scan-main', 'ci', 'security-scan', 'True', 'Succeeded',
    '2026-07-22T08:00:00Z', '2026-07-22T08:03:00Z', { total: 2, succeeded: 2 }),
  makePLR('nightly-build-20220722', 'builds', 'nightly-build', 'True', 'Succeeded',
    '2026-07-22T02:00:00Z', '2026-07-22T02:45:00Z', { total: 5, succeeded: 5 }),
  makePLR('lint-check-pr-142', 'ci', 'lint-check', 'True', 'Succeeded',
    '2026-07-22T07:15:00Z', '2026-07-22T07:16:30Z', { total: 1, succeeded: 1 }),
  makePLR('e2e-tests-pr-142', 'ci', 'e2e-tests', 'Unknown', 'Running',
    '2026-07-22T11:45:00Z', undefined, { total: 8, succeeded: 5, running: 2 }),
  makePLR('promote-staging', 'production', 'promote-pipeline', 'True', 'Succeeded',
    '2026-07-22T06:00:00Z', '2026-07-22T06:08:00Z', { total: 3, succeeded: 3 }),
];

// ── spoke-east-1 ─────────────────────────────────────
const spokeEast1PLRs: PipelineRunKind[] = [
  makePLR('build-api-east-main', 'default', 'build-api', 'True', 'Succeeded',
    '2026-07-22T10:01:00Z', '2026-07-22T10:06:00Z', { total: 3, succeeded: 3 }),
  makePLR('deploy-api-east-v2', 'production', 'deploy-api', 'Unknown', 'Running',
    '2026-07-22T11:00:00Z', undefined, { total: 4, succeeded: 2, running: 1 }),
  makePLR('smoke-tests-east-prod', 'production', 'smoke-tests', 'True', 'Succeeded',
    '2026-07-22T09:30:00Z', '2026-07-22T09:35:00Z', { total: 3, succeeded: 3 }),
  makePLR('canary-deploy-east-v2', 'production', 'canary-deploy', 'False', 'Failed',
    '2026-07-22T08:30:00Z', '2026-07-22T08:42:00Z', { total: 5, succeeded: 3, failed: 1 }),
  makePLR('rollback-east-v1', 'production', 'rollback', 'True', 'Succeeded',
    '2026-07-22T08:45:00Z', '2026-07-22T08:48:00Z', { total: 2, succeeded: 2 }),
  makePLR('db-migrate-east-003', 'production', 'db-migration', 'True', 'Succeeded',
    '2026-07-22T05:00:00Z', '2026-07-22T05:03:00Z', { total: 2, succeeded: 2 }),
  makePLR('build-worker-east', 'default', 'build-worker', 'False', 'CouldntGetTask',
    '2026-07-22T04:00:00Z', '2026-07-22T04:00:05Z', { total: 1, succeeded: 0, failed: 1 }),
  makePLR('perf-tests-east-nightly', 'staging', 'perf-tests', 'True', 'Succeeded',
    '2026-07-22T03:00:00Z', '2026-07-22T03:30:00Z', { total: 4, succeeded: 4 }),
  makePLR('scan-deps-east', 'ci', 'dependency-scan', 'True', 'Succeeded',
    '2026-07-22T07:00:00Z', '2026-07-22T07:02:00Z', { total: 1, succeeded: 1 }),
];

// ── spoke-west-2 ─────────────────────────────────────
const spokeWest2PLRs: PipelineRunKind[] = [
  makePLR('build-app-west-main', 'default', 'build-app', 'True', 'Succeeded',
    '2026-07-22T10:02:00Z', '2026-07-22T10:07:30Z', { total: 4, succeeded: 4 }),
  makePLR('deploy-api-west-v3', 'production', 'deploy-api', 'True', 'Succeeded',
    '2026-07-22T10:30:00Z', '2026-07-22T10:38:00Z', { total: 3, succeeded: 3 }),
  makePLR('load-test-west-peak', 'staging', 'load-test', 'Unknown', 'Running',
    '2026-07-22T11:15:00Z', undefined, { total: 2, succeeded: 0, running: 2 }),
  makePLR('db-migration-west-004', 'production', 'db-migration', 'False', 'Failed',
    '2026-07-22T07:00:00Z', '2026-07-22T07:02:00Z', { total: 3, succeeded: 2, failed: 1 }),
  makePLR('backup-west-daily', 'ops', 'backup-pipeline', 'True', 'Succeeded',
    '2026-07-22T06:00:00Z', '2026-07-22T06:20:00Z', { total: 2, succeeded: 2 }),
  makePLR('build-ml-model-west', 'ml-pipelines', 'train-model', 'True', 'Succeeded',
    '2026-07-22T01:00:00Z', '2026-07-22T02:15:00Z', { total: 6, succeeded: 6 }),
  makePLR('deploy-ml-west', 'ml-pipelines', 'deploy-model', 'Unknown', 'Running',
    '2026-07-22T11:50:00Z', undefined, { total: 3, succeeded: 1, running: 1 }),
  makePLR('compliance-scan-west', 'ci', 'compliance-check', 'True', 'Succeeded',
    '2026-07-22T04:00:00Z', '2026-07-22T04:10:00Z', { total: 2, succeeded: 2 }),
];

// ── spoke-apac-3 ─────────────────────────────────────
const spokeApac3PLRs: PipelineRunKind[] = [
  makePLR('build-app-apac', 'default', 'build-app', 'True', 'Succeeded',
    '2026-07-22T00:02:00Z', '2026-07-22T00:08:00Z', { total: 4, succeeded: 4 }),
  makePLR('deploy-api-apac-v1', 'production', 'deploy-api', 'True', 'Succeeded',
    '2026-07-22T00:30:00Z', '2026-07-22T00:36:00Z', { total: 3, succeeded: 3 }),
  makePLR('smoke-tests-apac', 'production', 'smoke-tests', 'False', 'Failed',
    '2026-07-22T00:40:00Z', '2026-07-22T00:43:00Z', { total: 3, succeeded: 2, failed: 1 }),
  makePLR('rollback-apac', 'production', 'rollback', 'True', 'Succeeded',
    '2026-07-22T00:45:00Z', '2026-07-22T00:47:00Z', { total: 2, succeeded: 2 }),
  makePLR('nightly-cleanup-apac', 'ops', 'cleanup', 'True', 'Succeeded',
    '2026-07-21T23:00:00Z', '2026-07-21T23:05:00Z', { total: 1, succeeded: 1 }),
];

export const mockMultiClusterPipelineRunsResponse: MultiClusterPipelineRunsResponse =
  {
    clusters: [
      { clusterName: 'local-cluster', items: localClusterPLRs },
      { clusterName: 'spoke-east-1', items: spokeEast1PLRs },
      { clusterName: 'spoke-west-2', items: spokeWest2PLRs },
      { clusterName: 'spoke-apac-3', items: spokeApac3PLRs },
    ],
  };

export const mockClusterNames = [
  'local-cluster',
  'spoke-east-1',
  'spoke-west-2',
  'spoke-apac-3',
];
