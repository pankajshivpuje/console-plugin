import { TektonResourceLabel } from '../../consts';
import { PipelineRunKind } from '../../types';
import { PropPipelineData } from '../utils/pipeline-augment';

export const MOCK_PIPELINES: PropPipelineData[] = [
  {
    metadata: {
      name: 'buildah-deploy',
      namespace: 'default',
      uid: 'mock-pipeline-buildah-deploy',
      creationTimestamp: '2025-11-01T10:00:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-source', taskRef: { name: 'git-clone' } },
        { name: 'build-image', taskRef: { name: 'buildah' } },
        { name: 'deploy', pipelineRef: { name: 'deploy-to-cluster' } },
      ],
      workspaces: [
        { name: 'shared-workspace' },
        { name: 'docker-credentials' },
      ],
    },
  },
  {
    metadata: {
      name: 's2i-java',
      namespace: 'default',
      uid: 'mock-pipeline-s2i-java',
      creationTimestamp: '2025-10-15T08:30:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-repo', taskRef: { name: 'git-clone' } },
        { name: 'build', taskRef: { name: 's2i-java' } },
        { name: 'deploy', taskRef: { name: 'openshift-client' } },
        { name: 'verify', pipelineRef: { name: 'integration-tests' } },
      ],
      workspaces: [{ name: 'workspace' }],
    },
  },
  {
    metadata: {
      name: 'docker-build-push',
      namespace: 'default',
      uid: 'mock-pipeline-docker-build-push',
      creationTimestamp: '2025-09-20T14:00:00Z',
    },
    spec: {
      tasks: [
        { name: 'clone', taskRef: { name: 'git-clone' } },
        { name: 'build-and-push', taskRef: { name: 'kaniko' } },
      ],
      workspaces: [{ name: 'source' }, { name: 'dockerconfig' }],
    },
  },
  {
    metadata: {
      name: 'nodejs-deploy',
      namespace: 'default',
      uid: 'mock-pipeline-nodejs-deploy',
      creationTimestamp: '2025-08-10T09:15:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-source', taskRef: { name: 'git-clone' } },
        { name: 'install-deps', taskRef: { name: 'npm' } },
        { name: 'run-tests', pipelineRef: { name: 'test-suite' } },
        { name: 'build-image', taskRef: { name: 'buildah' } },
        { name: 'deploy-app', taskRef: { name: 'openshift-client' } },
      ],
      workspaces: [{ name: 'shared-workspace' }, { name: 'npm-cache' }],
    },
  },
  {
    metadata: {
      name: 'scan-and-deploy',
      namespace: 'default',
      uid: 'mock-pipeline-scan-and-deploy',
      creationTimestamp: '2025-07-05T16:45:00Z',
    },
    spec: {
      tasks: [
        { name: 'fetch-source', taskRef: { name: 'git-clone' } },
        { name: 'build-image', taskRef: { name: 'buildah' } },
        { name: 'scan-image', taskRef: { name: 'trivy-scanner' } },
        { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
      ],
      finally: [{ name: 'notify', pipelineRef: { name: 'slack-notify' } }],
      workspaces: [{ name: 'workspace' }, { name: 'scan-results' }],
    },
  },
] as any;

export const MOCK_PIPELINE_RUNS: PipelineRunKind[] = [
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'buildah-deploy-run-7xk2m',
      namespace: 'default',
      uid: 'mock-plr-buildah-1',
      creationTimestamp: '2025-11-10T14:30:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'buildah-deploy' },
    },
    spec: { pipelineRef: { name: 'buildah-deploy' } },
    status: {
      startTime: '2025-11-10T14:30:00Z',
      completionTime: '2025-11-10T14:38:22Z',
      conditions: [
        {
          type: 'Succeeded',
          status: 'True',
          reason: 'Succeeded',
          lastTransitionTime: '2025-11-10T14:38:22Z',
          message: 'Tasks Completed: 3 (Failed: 0, Cancelled: 0), Skipped: 0',
        },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy', pipelineRef: { name: 'deploy-to-cluster' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'buildah-deploy-run-9ab3f',
      namespace: 'default',
      uid: 'mock-plr-buildah-2',
      creationTimestamp: '2025-11-09T09:15:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'buildah-deploy' },
    },
    spec: { pipelineRef: { name: 'buildah-deploy' } },
    status: {
      startTime: '2025-11-09T09:15:00Z',
      completionTime: '2025-11-09T09:22:45Z',
      conditions: [
        {
          type: 'Succeeded',
          status: 'False',
          reason: 'Failed',
          lastTransitionTime: '2025-11-09T09:22:45Z',
          message:
            'Tasks Completed: 3 (Failed: 1, Cancelled: 0), Skipped: 0',
        },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 's2i-java-run-c4d8e',
      namespace: 'default',
      uid: 'mock-plr-s2i-java-1',
      creationTimestamp: '2025-10-20T11:00:00Z',
      labels: { [TektonResourceLabel.pipeline]: 's2i-java' },
    },
    spec: { pipelineRef: { name: 's2i-java' } },
    status: {
      startTime: '2025-10-20T11:00:00Z',
      completionTime: '2025-10-20T11:12:30Z',
      conditions: [
        {
          type: 'Succeeded',
          status: 'True',
          reason: 'Succeeded',
          lastTransitionTime: '2025-10-20T11:12:30Z',
          message:
            'Tasks Completed: 4 (Failed: 0, Cancelled: 0), Skipped: 0',
        },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-repo', taskRef: { name: 'git-clone' } },
          { name: 'build', taskRef: { name: 's2i-java' } },
          { name: 'deploy', taskRef: { name: 'openshift-client' } },
          { name: 'verify', pipelineRef: { name: 'integration-tests' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'docker-build-push-run-f2g7h',
      namespace: 'default',
      uid: 'mock-plr-docker-1',
      creationTimestamp: '2025-09-25T16:45:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'docker-build-push' },
    },
    spec: { pipelineRef: { name: 'docker-build-push' } },
    status: {
      startTime: '2025-09-25T16:45:00Z',
      conditions: [
        {
          type: 'Succeeded',
          status: 'Unknown',
          reason: 'Running',
          lastTransitionTime: '2025-09-25T16:45:00Z',
          message:
            'Tasks Completed: 1 (Failed: 0, Cancelled: 0), Incomplete: 1, Skipped: 0',
        },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'clone', taskRef: { name: 'git-clone' } },
          { name: 'build-and-push', taskRef: { name: 'kaniko' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'nodejs-deploy-run-j5k8l',
      namespace: 'default',
      uid: 'mock-plr-nodejs-1',
      creationTimestamp: '2025-08-15T08:00:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'nodejs-deploy' },
    },
    spec: { pipelineRef: { name: 'nodejs-deploy' } },
    status: {
      startTime: '2025-08-15T08:00:00Z',
      completionTime: '2025-08-15T08:15:10Z',
      conditions: [
        {
          type: 'Succeeded',
          status: 'True',
          reason: 'Succeeded',
          lastTransitionTime: '2025-08-15T08:15:10Z',
          message:
            'Tasks Completed: 5 (Failed: 0, Cancelled: 0), Skipped: 0',
        },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'install-deps', taskRef: { name: 'npm' } },
          { name: 'run-tests', pipelineRef: { name: 'test-suite' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'deploy-app', taskRef: { name: 'openshift-client' } },
        ],
      },
    },
  },
  {
    apiVersion: 'tekton.dev/v1',
    kind: 'PipelineRun',
    metadata: {
      name: 'scan-and-deploy-run-m9n1p',
      namespace: 'default',
      uid: 'mock-plr-scan-1',
      creationTimestamp: '2025-07-10T13:30:00Z',
      labels: { [TektonResourceLabel.pipeline]: 'scan-and-deploy' },
    },
    spec: { pipelineRef: { name: 'scan-and-deploy' } },
    status: {
      startTime: '2025-07-10T13:30:00Z',
      completionTime: '2025-07-10T13:45:55Z',
      conditions: [
        {
          type: 'Succeeded',
          status: 'False',
          reason: 'Failed',
          lastTransitionTime: '2025-07-10T13:45:55Z',
          message:
            'Tasks Completed: 4 (Failed: 1, Cancelled: 0), Skipped: 0',
        },
      ],
      pipelineSpec: {
        tasks: [
          { name: 'fetch-source', taskRef: { name: 'git-clone' } },
          { name: 'build-image', taskRef: { name: 'buildah' } },
          { name: 'scan-image', taskRef: { name: 'trivy-scanner' } },
          { name: 'deploy', taskRef: { name: 'kubernetes-actions' } },
        ],
      },
    },
  },
] as any;
