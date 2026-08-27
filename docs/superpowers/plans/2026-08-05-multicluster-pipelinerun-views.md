# Multi-Cluster PipelineRun Views Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance PipelineRuns list and details views with multi-cluster execution context using mock data.

**Architecture:** Incremental enhancement of existing `pipelineRuns-list` and `pipelineRuns-details` components. New shared components live in `src/components/cluster/`. All multi-cluster data comes from mock data files — no real API calls.

**Tech Stack:** React 18, TypeScript, PatternFly 6 (`@patternfly/react-core` ^6.4.0), OpenShift dynamic plugin SDK, Jest + jsdom

## Global Constraints

- PatternFly 6 components first, minimal custom CSS
- All multi-cluster data is mock — no real API integration
- Test files use `.spec.tsx` extension (per jest config `testRegex`)
- Translations use `useTranslation('plugin__pipelines-console-plugin')` — wrap all user-visible strings in `t()`
- Follow existing patterns: `tableColumnInfo` array for columns, `GetDataViewRows` for row rendering
- CSS class prefix: `opp-` (existing convention in this plugin)
- Mock CSS/SCSS via `moduleNameMapper` in jest — no need to mock styles in tests

---

### Task 1: Mock Data Layer

**Files:**
- Modify: `src/components/__demo__/mock-data.ts` (add annotations to existing `MOCK_PIPELINE_RUNS`)
- Create: `src/components/__demo__/mock-cluster-data.ts`

**Interfaces:**
- Consumes: `PipelineRunKind` from `src/types/pipelineRun.ts`
- Produces:
  - `ClusterInfo`: `{ type: 'hub' | 'spoke'; region: string; regionName: string; provider: string; ocpVersion: string; pipelinesVersion: string; status: 'Ready' | 'Degraded' }`
  - `RoutingDecision`: `{ dispatchedBy: string; targetCluster: string; reason: string; queueWait: string; alternatives?: string; cpuAtDispatch?: string; routeQuality: 'optimal' | 'constrained' }`
  - `ClusterResources`: `{ cpuPercent: number; memoryPercent: number; queueUsed: number; queueCapacity: number; node: string; vCPU: number; ramGi: number }`
  - `LogEntry`: `{ timestamp: string; step: string; level: 'info' | 'warn' | 'error'; message: string }`
  - `DispatchTimelineData`: `{ submitted: string; queueDuration: string; dispatched: string; completed?: string }`
  - `ClusterQueueInfo`: `{ name: string; flavor: string; pending: number; active: number }`
  - `SecretSyncInfo`: `{ lastSync: string; synced: number; total: number }`
  - `PipelineRunClusterData`: `{ clusterInfo: ClusterInfo; routing: RoutingDecision; resources: ClusterResources; logs: LogEntry[]; timeline: DispatchTimelineData; clusterQueue: ClusterQueueInfo; secretSync: SecretSyncInfo }`
  - `getClusterDataForPipelineRun(plrName: string): PipelineRunClusterData | undefined`
  - `getAllClusterNames(): string[]`

- [ ] **Step 1: Add cluster annotations to MOCK_PIPELINE_RUNS**

In `src/components/__demo__/mock-data.ts`, add `annotations` to each mock PipelineRun's `metadata`. Map each run to a cluster:

```typescript
// buildah-deploy-run-7xk2m (Succeeded)
annotations: {
  'tekton.dev/cluster': 'spoke-prod-east',
  'multikueue.x-k8s.io/dispatch-reason': 'Lowest queue depth (2)',
  'multikueue.x-k8s.io/queue-wait': '4s',
},

// buildah-deploy-run-9ab3f (Failed)
annotations: {
  'tekton.dev/cluster': 'spoke-edge',
  'multikueue.x-k8s.io/dispatch-reason': 'Only cluster with matching node selector (arch: arm64)',
  'multikueue.x-k8s.io/queue-wait': '2m 14s',
},

// s2i-java-run-c4d8e (Succeeded)
annotations: {
  'tekton.dev/cluster': 'hub-central',
  'multikueue.x-k8s.io/dispatch-reason': 'Pipeline annotation: tekton.dev/prefer-local: "true"',
  'multikueue.x-k8s.io/queue-wait': '0s',
},

// docker-build-push-run-f2g7h (Running)
annotations: {
  'tekton.dev/cluster': 'spoke-staging',
  'multikueue.x-k8s.io/dispatch-reason': 'Lowest utilization (45% CPU, 38% mem)',
  'multikueue.x-k8s.io/queue-wait': '0s',
},

// nodejs-deploy-run-j5k8l (Succeeded)
annotations: {
  'tekton.dev/cluster': 'spoke-prod-west',
  'multikueue.x-k8s.io/dispatch-reason': 'Region affinity (us-west-2)',
  'multikueue.x-k8s.io/queue-wait': '2s',
},

// scan-and-deploy-run-m9n1p (Failed)
annotations: {
  'tekton.dev/cluster': 'spoke-dev',
  'multikueue.x-k8s.io/dispatch-reason': 'Namespace affinity (dev-team-*)',
  'multikueue.x-k8s.io/queue-wait': '48s',
},
```

- [ ] **Step 2: Create mock-cluster-data.ts with types and data**

Create `src/components/__demo__/mock-cluster-data.ts`:

```typescript
export interface ClusterInfo {
  type: 'hub' | 'spoke';
  region: string;
  regionName: string;
  provider: string;
  ocpVersion: string;
  pipelinesVersion: string;
  status: 'Ready' | 'Degraded';
}

export interface RoutingDecision {
  dispatchedBy: string;
  targetCluster: string;
  reason: string;
  queueWait: string;
  alternatives?: string;
  cpuAtDispatch?: string;
  routeQuality: 'optimal' | 'constrained';
}

export interface ClusterResources {
  cpuPercent: number;
  memoryPercent: number;
  queueUsed: number;
  queueCapacity: number;
  node: string;
  vCPU: number;
  ramGi: number;
}

export interface LogEntry {
  timestamp: string;
  step: string;
  level: 'info' | 'warn' | 'error';
  message: string;
}

export interface DispatchTimelineData {
  submitted: string;
  queueDuration: string;
  dispatched: string;
  completed?: string;
}

export interface ClusterQueueInfo {
  name: string;
  flavor: string;
  pending: number;
  active: number;
}

export interface SecretSyncInfo {
  lastSync: string;
  synced: number;
  total: number;
}

export interface PipelineRunClusterData {
  clusterInfo: ClusterInfo;
  routing: RoutingDecision;
  resources: ClusterResources;
  logs: LogEntry[];
  timeline: DispatchTimelineData;
  clusterQueue: ClusterQueueInfo;
  secretSync: SecretSyncInfo;
}

const MOCK_CLUSTER_INFO: Record<string, ClusterInfo> = {
  'hub-central': {
    type: 'hub', region: 'local', regionName: 'Local',
    provider: 'Bare Metal', ocpVersion: '4.17.8',
    pipelinesVersion: '1.18.0', status: 'Ready',
  },
  'spoke-prod-east': {
    type: 'spoke', region: 'us-east-1', regionName: 'N. Virginia',
    provider: 'AWS (ROSA)', ocpVersion: '4.17.8',
    pipelinesVersion: '1.18.0', status: 'Ready',
  },
  'spoke-prod-west': {
    type: 'spoke', region: 'us-west-2', regionName: 'Oregon',
    provider: 'AWS (ROSA)', ocpVersion: '4.17.6',
    pipelinesVersion: '1.18.0', status: 'Ready',
  },
  'spoke-staging': {
    type: 'spoke', region: 'eu-west-1', regionName: 'Ireland',
    provider: 'AWS (ROSA)', ocpVersion: '4.17.8',
    pipelinesVersion: '1.18.0', status: 'Ready',
  },
  'spoke-dev': {
    type: 'spoke', region: 'us-east-2', regionName: 'Ohio',
    provider: 'AWS (ROSA)', ocpVersion: '4.17.5',
    pipelinesVersion: '1.17.2', status: 'Ready',
  },
  'spoke-edge': {
    type: 'spoke', region: 'ap-se-1', regionName: 'Singapore',
    provider: 'AWS (ROSA)', ocpVersion: '4.17.4',
    pipelinesVersion: '1.17.2', status: 'Degraded',
  },
};

// One entry per mock PipelineRun name, keyed by metadata.name
const MOCK_PLR_CLUSTER_DATA: Record<string, Omit<PipelineRunClusterData, 'clusterInfo'> & { clusterName: string }> = {
  'buildah-deploy-run-7xk2m': {
    clusterName: 'spoke-prod-east',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)', targetCluster: 'spoke-prod-east',
      reason: 'Lowest queue depth (2)', queueWait: '4s',
      alternatives: 'spoke-prod-west (4), spoke-staging (0)',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 68, memoryPercent: 62, queueUsed: 2, queueCapacity: 15,
      node: 'worker-3.spoke-prod-east.ocp.internal', vCPU: 8, ramGi: 16,
    },
    logs: [
      { timestamp: '12:27:04', step: 'fetch-source', level: 'info', message: 'Cloning https://github.com/org/app.git@main' },
      { timestamp: '12:27:12', step: 'fetch-source', level: 'info', message: 'Clone complete (8s)' },
      { timestamp: '12:27:14', step: 'build-image', level: 'info', message: 'Building with Buildah...' },
      { timestamp: '12:28:02', step: 'build-image', level: 'info', message: 'Successfully pushed image-registry.openshift-image-registry.svc:5000/gitops-sample/app:v1.4.2' },
      { timestamp: '12:28:06', step: 'gitops-update', level: 'info', message: 'Patching deployment manifest...' },
      { timestamp: '12:28:22', step: 'gitops-update', level: 'info', message: 'Commit pushed to gitops repo' },
      { timestamp: '12:28:26', step: '', level: 'info', message: 'PipelineRun completed successfully' },
    ],
    timeline: { submitted: '12:27:00', queueDuration: '4s', dispatched: '12:27:04', completed: '12:28:26' },
    clusterQueue: { name: 'build-workloads', flavor: 'x86-medium (4cpu/8gi)', pending: 0, active: 2 },
    secretSync: { lastSync: '2 minutes ago', synced: 12, total: 12 },
  },
  'buildah-deploy-run-9ab3f': {
    clusterName: 'spoke-edge',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)', targetCluster: 'spoke-edge',
      reason: 'Only cluster with matching node selector (arch: arm64)', queueWait: '2m 14s',
      cpuAtDispatch: '91%', routeQuality: 'constrained',
    },
    resources: {
      cpuPercent: 91, memoryPercent: 88, queueUsed: 23, queueCapacity: 25,
      node: 'worker-1.spoke-edge.ocp.internal', vCPU: 4, ramGi: 8,
    },
    logs: [
      { timestamp: '11:32:08', step: 'fetch-source', level: 'info', message: 'Cloning https://github.com/org/app.git@main' },
      { timestamp: '11:32:16', step: 'fetch-source', level: 'info', message: 'Clone complete (8s)' },
      { timestamp: '11:32:18', step: 'build-image', level: 'info', message: 'Building with Buildah (arm64)...' },
      { timestamp: '11:32:34', step: 'build-image', level: 'error', message: 'ERROR: OOMKilled — container exceeded memory limit (512Mi)' },
      { timestamp: '11:32:34', step: 'build-image', level: 'error', message: 'Step exited with code 137 (SIGKILL)' },
      { timestamp: '11:32:36', step: '', level: 'warn', message: 'spoke-edge memory pressure: 88% utilized, 3 OOMKill events in last hour' },
      { timestamp: '11:32:38', step: '', level: 'error', message: 'PipelineRun failed — build-image task OOMKilled' },
    ],
    timeline: { submitted: '11:30:00', queueDuration: '2m 14s', dispatched: '11:32:14', completed: '11:32:38' },
    clusterQueue: { name: 'arm64-workloads', flavor: 'arm64-small (2cpu/4gi)', pending: 5, active: 23 },
    secretSync: { lastSync: '8 minutes ago', synced: 10, total: 12 },
  },
  's2i-java-run-c4d8e': {
    clusterName: 'hub-central',
    routing: {
      dispatchedBy: 'Local scheduler (Hub)', targetCluster: 'hub-central (local)',
      reason: 'Pipeline annotation: tekton.dev/prefer-local: "true"', queueWait: '0s',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 52, memoryPercent: 48, queueUsed: 3, queueCapacity: 20,
      node: 'master-1.hub-central.ocp.internal', vCPU: 16, ramGi: 32,
    },
    logs: [
      { timestamp: '11:00:02', step: 'fetch-repo', level: 'info', message: 'Cloning repository...' },
      { timestamp: '11:00:10', step: 'build', level: 'info', message: 'Building with S2I...' },
      { timestamp: '11:10:00', step: 'deploy', level: 'info', message: 'Deploying to OpenShift...' },
      { timestamp: '11:12:30', step: '', level: 'info', message: 'PipelineRun completed successfully' },
    ],
    timeline: { submitted: '11:00:00', queueDuration: '0s', dispatched: '11:00:00', completed: '11:12:30' },
    clusterQueue: { name: 'default-workloads', flavor: 'x86-large (8cpu/16gi)', pending: 0, active: 3 },
    secretSync: { lastSync: '1 minute ago', synced: 8, total: 8 },
  },
  'docker-build-push-run-f2g7h': {
    clusterName: 'spoke-staging',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)', targetCluster: 'spoke-staging',
      reason: 'Lowest utilization (45% CPU, 38% mem)', queueWait: '0s',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 48, memoryPercent: 42, queueUsed: 1, queueCapacity: 25,
      node: 'worker-2.spoke-staging.ocp.internal', vCPU: 8, ramGi: 16,
    },
    logs: [
      { timestamp: '16:45:02', step: 'clone', level: 'info', message: 'Cloning repository...' },
      { timestamp: '16:45:10', step: 'clone', level: 'info', message: 'Clone complete (8s)' },
      { timestamp: '16:45:12', step: 'build-and-push', level: 'info', message: 'Building with Kaniko...' },
    ],
    timeline: { submitted: '16:45:00', queueDuration: '0s', dispatched: '16:45:00' },
    clusterQueue: { name: 'build-workloads', flavor: 'x86-medium (4cpu/8gi)', pending: 0, active: 1 },
    secretSync: { lastSync: '30 seconds ago', synced: 10, total: 10 },
  },
  'nodejs-deploy-run-j5k8l': {
    clusterName: 'spoke-prod-west',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)', targetCluster: 'spoke-prod-west',
      reason: 'Region affinity (us-west-2)', queueWait: '2s',
      alternatives: 'spoke-prod-east (2), spoke-staging (0)',
      routeQuality: 'optimal',
    },
    resources: {
      cpuPercent: 64, memoryPercent: 58, queueUsed: 4, queueCapacity: 15,
      node: 'worker-1.spoke-prod-west.ocp.internal', vCPU: 8, ramGi: 16,
    },
    logs: [
      { timestamp: '08:00:04', step: 'fetch-source', level: 'info', message: 'Cloning repository...' },
      { timestamp: '08:00:12', step: 'install-deps', level: 'info', message: 'Running npm install...' },
      { timestamp: '08:05:00', step: 'build-image', level: 'info', message: 'Building with Buildah...' },
      { timestamp: '08:15:10', step: '', level: 'info', message: 'PipelineRun completed successfully' },
    ],
    timeline: { submitted: '08:00:00', queueDuration: '2s', dispatched: '08:00:02', completed: '08:15:10' },
    clusterQueue: { name: 'build-workloads', flavor: 'x86-medium (4cpu/8gi)', pending: 1, active: 4 },
    secretSync: { lastSync: '5 minutes ago', synced: 12, total: 12 },
  },
  'scan-and-deploy-run-m9n1p': {
    clusterName: 'spoke-dev',
    routing: {
      dispatchedBy: 'MultiKueue (Hub)', targetCluster: 'spoke-dev',
      reason: 'Namespace affinity (dev-team-*)', queueWait: '48s',
      routeQuality: 'constrained',
    },
    resources: {
      cpuPercent: 83, memoryPercent: 76, queueUsed: 12, queueCapacity: 25,
      node: 'worker-2.spoke-dev.ocp.internal', vCPU: 8, ramGi: 16,
    },
    logs: [
      { timestamp: '13:30:04', step: 'fetch-source', level: 'info', message: 'Cloning repository...' },
      { timestamp: '13:30:12', step: 'build-image', level: 'info', message: 'Building with Buildah...' },
      { timestamp: '13:39:08', step: 'build-image', level: 'info', message: 'Successfully pushed' },
      { timestamp: '13:39:10', step: 'scan-image', level: 'info', message: 'Running Trivy scan...' },
      { timestamp: '13:39:28', step: 'scan-image', level: 'error', message: 'FAIL: 3 critical vulnerabilities found' },
      { timestamp: '13:45:55', step: '', level: 'error', message: 'PipelineRun failed — scan-image task failed' },
    ],
    timeline: { submitted: '13:29:12', queueDuration: '48s', dispatched: '13:30:00', completed: '13:45:55' },
    clusterQueue: { name: 'dev-workloads', flavor: 'x86-medium (4cpu/8gi)', pending: 3, active: 12 },
    secretSync: { lastSync: '6 minutes ago', synced: 11, total: 12 },
  },
};

export const getClusterDataForPipelineRun = (plrName: string): PipelineRunClusterData | undefined => {
  const data = MOCK_PLR_CLUSTER_DATA[plrName];
  if (!data) return undefined;
  const clusterInfo = MOCK_CLUSTER_INFO[data.clusterName];
  if (!clusterInfo) return undefined;
  return { ...data, clusterInfo };
};

export const getAllClusterNames = (): string[] => Object.keys(MOCK_CLUSTER_INFO);
```

- [ ] **Step 3: Write test for getClusterDataForPipelineRun**

Create `src/components/__demo__/__tests__/mock-cluster-data.spec.ts`:

```typescript
import {
  getClusterDataForPipelineRun,
  getAllClusterNames,
} from '../mock-cluster-data';

describe('mock-cluster-data', () => {
  it('returns cluster data for a known PipelineRun', () => {
    const data = getClusterDataForPipelineRun('buildah-deploy-run-7xk2m');
    expect(data).toBeDefined();
    expect(data.clusterInfo.type).toBe('spoke');
    expect(data.routing.targetCluster).toBe('spoke-prod-east');
    expect(data.resources.cpuPercent).toBe(68);
    expect(data.logs.length).toBeGreaterThan(0);
    expect(data.timeline.submitted).toBeDefined();
  });

  it('returns undefined for an unknown PipelineRun', () => {
    expect(getClusterDataForPipelineRun('nonexistent-run')).toBeUndefined();
  });

  it('getAllClusterNames returns all cluster names', () => {
    const names = getAllClusterNames();
    expect(names).toContain('hub-central');
    expect(names).toContain('spoke-prod-east');
    expect(names.length).toBe(6);
  });
});
```

- [ ] **Step 4: Run tests**

```bash
yarn test -- --testPathPattern="mock-cluster-data" --no-coverage
```

Expected: all 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/__demo__/mock-data.ts src/components/__demo__/mock-cluster-data.ts src/components/__demo__/__tests__/mock-cluster-data.spec.ts
git commit -m "feat: add multi-cluster mock data for PipelineRuns"
```

---

### Task 2: Shared Cluster Components

**Files:**
- Create: `src/components/cluster/ClusterBadge.tsx`
- Create: `src/components/cluster/RoutingPill.tsx`
- Create: `src/components/cluster/ResourceMeter.tsx`
- Create: `src/components/cluster/DispatchTimeline.tsx`
- Create: `src/components/cluster/ClusterBadge.scss`
- Create: `src/components/cluster/index.ts`
- Create: `src/components/cluster/__tests__/ClusterBadge.spec.tsx`

**Interfaces:**
- Consumes: PF6 `Label`, `Progress`, `ProgressStepper`, `ProgressStep` from `@patternfly/react-core`
- Produces:
  - `<ClusterBadge clusterName={string} clusterType={'hub'|'spoke'} region?={string} />`
  - `<RoutingPill quality={'optimal'|'constrained'} text={string} />`
  - `<ResourceMeter label={string} value={number} displayValue?={string} thresholds?={{ warning: number, danger: number }} />`
  - `<DispatchTimeline timeline={DispatchTimelineData} />`

- [ ] **Step 1: Create ClusterBadge component**

Create `src/components/cluster/ClusterBadge.tsx`:

```tsx
import type { FC } from 'react';
import { Label } from '@patternfly/react-core';
import './ClusterBadge.scss';

export interface ClusterBadgeProps {
  clusterName: string;
  clusterType: 'hub' | 'spoke';
  region?: string;
}

const HubIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="4.5" />
    <circle cx="7" cy="7" r="1.5" />
  </svg>
);

const SpokeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.3">
    <circle cx="7" cy="7" r="4.5" />
  </svg>
);

const ClusterBadge: FC<ClusterBadgeProps> = ({
  clusterName,
  clusterType,
  region,
}) => {
  const isHub = clusterType === 'hub';
  return (
    <Label
      variant="outline"
      className={`opp-cluster-badge opp-cluster-badge--${clusterType}`}
      icon={isHub ? <HubIcon /> : <SpokeIcon />}
    >
      {clusterName}
      {region && (
        <span className="opp-cluster-badge__region">{region}</span>
      )}
    </Label>
  );
};

export default ClusterBadge;
```

Create `src/components/cluster/ClusterBadge.scss`:

```scss
.opp-cluster-badge {
  &--hub {
    --pf-v6-c-label--BackgroundColor: rgba(138, 109, 215, 0.15);
    --pf-v6-c-label--Color: #b094e8;
    --pf-v6-c-label--BorderColor: rgba(138, 109, 215, 0.3);
  }
  &--spoke {
    --pf-v6-c-label--BackgroundColor: rgba(57, 135, 229, 0.1);
    --pf-v6-c-label--Color: #6da7ec;
    --pf-v6-c-label--BorderColor: rgba(57, 135, 229, 0.25);
  }
  &__region {
    font-weight: 400;
    color: var(--pf-t--global--text--color--subtle);
    font-size: var(--pf-t--global--font--size--xs);
    margin-left: var(--pf-t--global--spacer--xs);
  }
}
```

- [ ] **Step 2: Create RoutingPill component**

Create `src/components/cluster/RoutingPill.tsx`:

```tsx
import type { FC } from 'react';
import { Label } from '@patternfly/react-core';

export interface RoutingPillProps {
  quality: 'optimal' | 'constrained';
  text: string;
}

const RoutingPill: FC<RoutingPillProps> = ({ quality, text }) => {
  const color = quality === 'optimal' ? 'green' : 'gold';
  return (
    <Label isCompact color={color}>
      {text}
    </Label>
  );
};

export default RoutingPill;
```

- [ ] **Step 3: Create ResourceMeter component**

Create `src/components/cluster/ResourceMeter.tsx`:

```tsx
import type { FC } from 'react';
import {
  Progress,
  ProgressMeasureLocation,
  ProgressVariant,
} from '@patternfly/react-core';

export interface ResourceMeterProps {
  label: string;
  value: number;
  displayValue?: string;
  thresholds?: { warning: number; danger: number };
}

const ResourceMeter: FC<ResourceMeterProps> = ({
  label,
  value,
  displayValue,
  thresholds = { warning: 70, danger: 85 },
}) => {
  let variant: ProgressVariant | undefined;
  if (value >= thresholds.danger) {
    variant = ProgressVariant.danger;
  } else if (value >= thresholds.warning) {
    variant = ProgressVariant.warning;
  }

  return (
    <Progress
      title={label}
      value={value}
      label={displayValue ?? `${value}%`}
      measureLocation={ProgressMeasureLocation.outside}
      variant={variant}
    />
  );
};

export default ResourceMeter;
```

- [ ] **Step 4: Create DispatchTimeline component**

Create `src/components/cluster/DispatchTimeline.tsx`:

```tsx
import type { FC } from 'react';
import {
  ProgressStepper,
  ProgressStep,
  ProgressStepVariant,
} from '@patternfly/react-core';
import type { DispatchTimelineData } from '../__demo__/mock-cluster-data';

export interface DispatchTimelineProps {
  timeline: DispatchTimelineData;
}

const DispatchTimeline: FC<DispatchTimelineProps> = ({ timeline }) => {
  const isRunning = !timeline.completed;

  return (
    <ProgressStepper isCompact>
      <ProgressStep
        variant={ProgressStepVariant.success}
        id="submitted"
        titleId="submitted-title"
        aria-label="Submitted"
        description={timeline.submitted}
      >
        Submitted
      </ProgressStep>
      <ProgressStep
        variant={ProgressStepVariant.success}
        id="queued"
        titleId="queued-title"
        aria-label="Queued"
        description={timeline.queueDuration}
      >
        Queued
      </ProgressStep>
      <ProgressStep
        variant={ProgressStepVariant.success}
        id="dispatched"
        titleId="dispatched-title"
        aria-label="Dispatched"
        description={timeline.dispatched}
      >
        Dispatched
      </ProgressStep>
      <ProgressStep
        variant={
          isRunning
            ? ProgressStepVariant.info
            : ProgressStepVariant.success
        }
        isCurrent={isRunning}
        id="completed"
        titleId="completed-title"
        aria-label="Completed"
        description={timeline.completed ?? 'In progress...'}
      >
        {isRunning ? 'Running' : 'Completed'}
      </ProgressStep>
    </ProgressStepper>
  );
};

export default DispatchTimeline;
```

- [ ] **Step 5: Create barrel export**

Create `src/components/cluster/index.ts`:

```typescript
export { default as ClusterBadge } from './ClusterBadge';
export type { ClusterBadgeProps } from './ClusterBadge';
export { default as RoutingPill } from './RoutingPill';
export type { RoutingPillProps } from './RoutingPill';
export { default as ResourceMeter } from './ResourceMeter';
export type { ResourceMeterProps } from './ResourceMeter';
export { default as DispatchTimeline } from './DispatchTimeline';
export type { DispatchTimelineProps } from './DispatchTimeline';
```

- [ ] **Step 6: Write tests for shared components**

Create `src/components/cluster/__tests__/ClusterBadge.spec.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import ClusterBadge from '../ClusterBadge';
import RoutingPill from '../RoutingPill';
import ResourceMeter from '../ResourceMeter';

describe('ClusterBadge', () => {
  it('renders spoke cluster with region', () => {
    render(
      <ClusterBadge
        clusterName="spoke-prod-east"
        clusterType="spoke"
        region="us-east-1"
      />,
    );
    expect(screen.getByText('spoke-prod-east')).toBeTruthy();
    expect(screen.getByText('us-east-1')).toBeTruthy();
  });

  it('renders hub cluster', () => {
    render(
      <ClusterBadge clusterName="hub-central" clusterType="hub" />,
    );
    expect(screen.getByText('hub-central')).toBeTruthy();
  });
});

describe('RoutingPill', () => {
  it('renders optimal pill', () => {
    render(<RoutingPill quality="optimal" text="Optimal route" />);
    expect(screen.getByText('Optimal route')).toBeTruthy();
  });
});

describe('ResourceMeter', () => {
  it('renders with percentage', () => {
    render(<ResourceMeter label="CPU" value={68} />);
    expect(screen.getByText('68%')).toBeTruthy();
  });

  it('renders with custom display value', () => {
    render(
      <ResourceMeter label="Queue" value={13} displayValue="2/15" />,
    );
    expect(screen.getByText('2/15')).toBeTruthy();
  });
});
```

- [ ] **Step 7: Run tests**

```bash
yarn test -- --testPathPattern="cluster" --no-coverage
```

Expected: all tests pass. If `@testing-library/react` is not installed, install it first:

```bash
yarn add -D @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 8: Commit**

```bash
git add src/components/cluster/
git commit -m "feat: add shared cluster components (ClusterBadge, RoutingPill, ResourceMeter, DispatchTimeline)"
```

---

### Task 3: PipelineRuns List — Cluster Column & Row Rendering

**Files:**
- Modify: `src/components/pipelineRuns-list/usePipelineRunsColumns.ts` (add cluster column to `tableColumnInfo` and `usePipelineRunsColumns`)
- Modify: `src/components/pipelineRuns-list/PipelineRunsRow.tsx` (add cluster cell rendering)

**Interfaces:**
- Consumes: `ClusterBadge` from `src/components/cluster/`, `ClusterInfo` from `src/components/__demo__/mock-cluster-data`, `MOCK_CLUSTER_INFO` lookup via annotation
- Produces: Updated table with Cluster column between Name and Nested PipelineRuns

- [ ] **Step 1: Add cluster column to tableColumnInfo**

In `src/components/pipelineRuns-list/usePipelineRunsColumns.ts`, insert a new entry at index 1 in `tableColumnInfo` (shifting all subsequent indices):

```typescript
export const tableColumnInfo = [
  { id: 'name', classNames: 'pf-v6-m-width-20' },
  {
    id: 'cluster',
    classNames: 'pf-v6-m-hidden pf-m-visible-on-lg',
  },
  {
    id: 'nested-pipelineruns',
    classNames: 'pf-v6-m-hidden pf-m-visible-on-lg',
  },
  // ... rest unchanged, but indices shift by 1
```

Add the column definition in `usePipelineRunsColumns` after the name column:

```typescript
{
  id: tableColumnInfo[1].id,
  title: t('Cluster'),
  sort: `metadata.annotations.tekton.dev/cluster`,
  props: { className: tableColumnInfo[1].classNames, modifier: 'nowrap' },
},
```

Update all subsequent `tableColumnInfo[N]` references to `tableColumnInfo[N+1]` throughout the file.

- [ ] **Step 2: Add cluster cell to PipelineRunsRow**

In `src/components/pipelineRuns-list/PipelineRunsRow.tsx`:

Add import:
```typescript
import ClusterBadge from '../cluster/ClusterBadge';
import { getClusterDataForPipelineRun } from '../__demo__/mock-cluster-data';
```

Add the cluster cell in `rowCells` after the name cell, using the new `tableColumnInfo[1]`:

```typescript
[tableColumnInfo[1].id]: {
  cell: (() => {
    const clusterData = getClusterDataForPipelineRun(obj.metadata.name);
    if (!clusterData) return DASH;
    return (
      <ClusterBadge
        clusterName={obj.metadata.annotations?.['tekton.dev/cluster'] || ''}
        clusterType={clusterData.clusterInfo.type}
        region={clusterData.clusterInfo.region}
      />
    );
  })(),
  props: { modifier: 'nowrap' },
},
```

Update all existing `tableColumnInfo[N]` references in the rowCells map to `tableColumnInfo[N+1]` (since cluster was inserted at index 1).

- [ ] **Step 3: Verify build compiles**

```bash
yarn webpack --mode development --no-devtool 2>&1 | tail -5
```

Expected: `compiled successfully` (or `compiled with warnings` for non-breaking warnings).

- [ ] **Step 4: Commit**

```bash
git add src/components/pipelineRuns-list/usePipelineRunsColumns.ts src/components/pipelineRuns-list/PipelineRunsRow.tsx
git commit -m "feat: add Cluster column to PipelineRuns list"
```

---

### Task 4: PipelineRuns List — Expandable Rows

**Files:**
- Create: `src/components/pipelineRuns-list/PipelineRunExpandedContent.tsx`
- Create: `src/components/pipelineRuns-list/PipelineRunExpandedContent.scss`
- Modify: `src/components/pipelineRuns-list/PipelineRunsList.tsx` (add expand state management and render expanded content)

**Interfaces:**
- Consumes: `PipelineRunClusterData`, `getClusterDataForPipelineRun` from mock-cluster-data; `ClusterBadge`, `RoutingPill`, `ResourceMeter` from cluster components
- Produces: `<PipelineRunExpandedContent clusterData={PipelineRunClusterData} clusterName={string} />`

- [ ] **Step 1: Create PipelineRunExpandedContent component**

Create `src/components/pipelineRuns-list/PipelineRunExpandedContent.tsx`:

```tsx
import type { FC } from 'react';
import {
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Grid,
  GridItem,
  CodeBlock,
  CodeBlockCode,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import { RoutingPill, ResourceMeter } from '../cluster';
import type { PipelineRunClusterData } from '../__demo__/mock-cluster-data';
import { useTranslation } from 'react-i18next';

import './PipelineRunExpandedContent.scss';

export interface PipelineRunExpandedContentProps {
  clusterData: PipelineRunClusterData;
  clusterName: string;
}

const PipelineRunExpandedContent: FC<PipelineRunExpandedContentProps> = ({
  clusterData,
  clusterName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { routing, resources, logs } = clusterData;

  const logText = logs
    .map((entry) => {
      const step = entry.step ? `[${entry.step}] ` : '';
      return `[${entry.timestamp}] ${step}${entry.message}`;
    })
    .join('\n');

  const queueDisplay = `${resources.queueUsed}/${resources.queueCapacity}`;
  const queuePercent = Math.round(
    (resources.queueUsed / resources.queueCapacity) * 100,
  );

  return (
    <Grid hasGutter className="opp-plr-expanded">
      <GridItem sm={12} md={4}>
        <Title headingLevel="h4" size="sm" className="opp-plr-expanded__title">
          {t('Routing Decision')}
        </Title>
        <DescriptionList isCompact isHorizontal>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Dispatched by')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.dispatchedBy}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Target cluster')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.targetCluster}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Reason')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.reason}
            </DescriptionListDescription>
          </DescriptionListGroup>
          <DescriptionListGroup>
            <DescriptionListTerm>{t('Queue wait')}</DescriptionListTerm>
            <DescriptionListDescription>
              {routing.queueWait}
            </DescriptionListDescription>
          </DescriptionListGroup>
          {routing.alternatives && (
            <DescriptionListGroup>
              <DescriptionListTerm>{t('Alternatives')}</DescriptionListTerm>
              <DescriptionListDescription>
                {routing.alternatives}
              </DescriptionListDescription>
            </DescriptionListGroup>
          )}
        </DescriptionList>
        <div className="opp-plr-expanded__pill">
          <RoutingPill
            quality={routing.routeQuality}
            text={
              routing.routeQuality === 'optimal'
                ? t('Optimal route')
                : t('Constrained route — no alternatives')
            }
          />
        </div>
      </GridItem>

      <GridItem sm={12} md={4}>
        <Title headingLevel="h4" size="sm" className="opp-plr-expanded__title">
          {t('Aggregated Logs')} ({clusterName})
        </Title>
        <CodeBlock>
          <CodeBlockCode>{logText}</CodeBlockCode>
        </CodeBlock>
        <a className="opp-plr-expanded__link" href="#">
          <ExternalLinkAltIcon /> {t('View full logs on')} {clusterName}
        </a>
      </GridItem>

      <GridItem sm={12} md={4}>
        <Title headingLevel="h4" size="sm" className="opp-plr-expanded__title">
          {t('Cluster Resources')}
        </Title>
        <ResourceMeter label={t('CPU')} value={resources.cpuPercent} />
        <ResourceMeter label={t('Memory')} value={resources.memoryPercent} />
        <ResourceMeter
          label={t('Queue')}
          value={queuePercent}
          displayValue={queueDisplay}
        />
        <div className="opp-plr-expanded__node-info">
          {t('Node:')} {resources.node} &middot; {resources.vCPU} vCPU &middot;{' '}
          {resources.ramGi}Gi
        </div>
      </GridItem>
    </Grid>
  );
};

export default PipelineRunExpandedContent;
```

Create `src/components/pipelineRuns-list/PipelineRunExpandedContent.scss`:

```scss
.opp-plr-expanded {
  padding: var(--pf-t--global--spacer--md) var(--pf-t--global--spacer--lg);

  &__title {
    margin-bottom: var(--pf-t--global--spacer--sm);
  }
  &__pill {
    margin-top: var(--pf-t--global--spacer--sm);
  }
  &__link {
    display: inline-flex;
    align-items: center;
    gap: var(--pf-t--global--spacer--xs);
    margin-top: var(--pf-t--global--spacer--sm);
    font-size: var(--pf-t--global--font--size--sm);
    color: var(--pf-t--global--text--color--link--default);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
  &__node-info {
    margin-top: var(--pf-t--global--spacer--sm);
    font-size: var(--pf-t--global--font--size--xs);
    color: var(--pf-t--global--text--color--subtle);
  }
}
```

- [ ] **Step 2: Integrate expandable rows into PipelineRunsList**

This step depends on how `ConsoleDataView` supports expandable rows. The `ConsoleDataView` component from the dynamic plugin SDK may or may not support `ExpandableRowContent` natively.

**Option A — If ConsoleDataView supports `expandableContent` in row data:**

In `src/components/pipelineRuns-list/PipelineRunsRow.tsx`, add `expandableContent` to each row returned by `getPipelineRunsListDataViewRows`:

```typescript
import PipelineRunExpandedContent from './PipelineRunExpandedContent';
import { getClusterDataForPipelineRun } from '../__demo__/mock-cluster-data';

// Inside getPipelineRunsListDataViewRows, after building rowCells:
const clusterData = getClusterDataForPipelineRun(obj.metadata.name);
const clusterName = obj.metadata.annotations?.['tekton.dev/cluster'];

// Return format that includes expandable content:
return {
  cells: columns.map(({ id }) => ({ id, cell: rowCells[id]?.cell, props: rowCells[id]?.props })),
  expandableContent: clusterData && clusterName ? (
    <PipelineRunExpandedContent clusterData={clusterData} clusterName={clusterName} />
  ) : undefined,
};
```

**Option B — If ConsoleDataView doesn't support expandable rows:**

Wrap the table in a custom component that manages expand state. Add expand toggle buttons to each row's first column and render the expanded content as an additional row.

Check the ConsoleDataView API by looking at its type definition. If it doesn't support expandable rows, use the simpler approach of a dedicated expandable section below each row managed by local state in `PipelineRunsList.tsx`.

The implementer should check the `GetDataViewRows` return type and `ConsoleDataView` props to determine which option applies. Start with Option A; fall back to Option B if the API doesn't support it.

- [ ] **Step 3: Verify in browser**

```bash
# Dev server should already be running on port 9001
# Navigate to http://localhost:9000 → Pipelines → PipelineRuns tab
# Verify: Cluster column visible, expand arrows visible for mock rows, expanded content shows routing/logs/resources
```

- [ ] **Step 4: Commit**

```bash
git add src/components/pipelineRuns-list/PipelineRunExpandedContent.tsx src/components/pipelineRuns-list/PipelineRunExpandedContent.scss src/components/pipelineRuns-list/PipelineRunsRow.tsx src/components/pipelineRuns-list/PipelineRunsList.tsx
git commit -m "feat: add expandable rows with routing, logs, and resource details"
```

---

### Task 5: PipelineRuns List — Cluster Filter & Info Banner

**Files:**
- Modify: `src/components/pipelineRuns-list/PipelineRunsList.tsx` (add cluster filter and info banner)

**Interfaces:**
- Consumes: `getAllClusterNames()` from mock-cluster-data, `Alert` and `Select` from PF6
- Produces: Cluster filter dropdown in toolbar, dismissable info banner above filter toolbar

- [ ] **Step 1: Add cluster filter to useDataViewFilter**

In `src/components/pipelineRuns-list/PipelineRunsList.tsx`, add cluster filtering logic after the existing `useDataViewFilter` call:

```typescript
import { useState, useCallback } from 'react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import {
  Select,
  SelectOption,
  SelectList,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import { getAllClusterNames } from '../__demo__/mock-cluster-data';

// Inside PipelineRunsList component, after existing filteredData:

const [selectedCluster, setSelectedCluster] = useState<string>('all');
const [clusterSelectOpen, setClusterSelectOpen] = useState(false);
const [bannerDismissed, setBannerDismissed] = useState(() =>
  localStorage.getItem('opp-multicluster-banner-dismissed') === 'true',
);

const clusterFilteredData = useMemo(() => {
  if (selectedCluster === 'all') return filteredData;
  return filteredData.filter(
    (plr) =>
      plr.metadata?.annotations?.['tekton.dev/cluster'] === selectedCluster,
  );
}, [filteredData, selectedCluster]);

const handleBannerDismiss = useCallback(() => {
  setBannerDismissed(true);
  localStorage.setItem('opp-multicluster-banner-dismissed', 'true');
}, []);

const clusterNames = getAllClusterNames();
```

- [ ] **Step 2: Render info banner and cluster filter**

In the JSX return of `PipelineRunsList`, add the banner before `DataViewFilterToolbar` and add the cluster select after it:

```tsx
<ListPageBody>
  {!bannerDismissed && (
    <Alert
      variant="info"
      isInline
      title={t('Multi-cluster routing active')}
      actionClose={<AlertActionCloseButton onClose={handleBannerDismiss} />}
      className="opp-plr-multicluster-banner"
    >
      {t(
        'PipelineRuns are dynamically dispatched via MultiKueue to the optimal spoke cluster based on current fleet capacity. The Cluster column shows where each run executed.',
      )}
    </Alert>
  )}
  {!hideTextFilter && (
    <DataViewFilterToolbar
      filterValues={filterValues}
      onFilterChange={onFilterChange}
      onClearAll={onClearAll}
      checkboxFilters={updatedCheckboxFilters}
    >
      <Select
        isOpen={clusterSelectOpen}
        onOpenChange={setClusterSelectOpen}
        onSelect={(_e, value) => {
          setSelectedCluster(value as string);
          setClusterSelectOpen(false);
        }}
        selected={selectedCluster}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
          <MenuToggle
            ref={toggleRef}
            onClick={() => setClusterSelectOpen(!clusterSelectOpen)}
            isExpanded={clusterSelectOpen}
          >
            {selectedCluster === 'all' ? t('All Clusters') : selectedCluster}
          </MenuToggle>
        )}
      >
        <SelectList>
          <SelectOption value="all">{t('All Clusters')}</SelectOption>
          {clusterNames.map((name) => (
            <SelectOption key={name} value={name}>
              {name}
            </SelectOption>
          ))}
        </SelectList>
      </Select>
    </DataViewFilterToolbar>
  )}
  <ConsoleDataView<PipelineRunKind>
    // ... existing props, but change data={filteredData} to data={clusterFilteredData}
    data={clusterFilteredData}
    // ... rest unchanged
  />
</ListPageBody>
```

Note: If `DataViewFilterToolbar` doesn't accept children, render the cluster `Select` as a separate element in the toolbar area, or modify `DataViewFilterToolbar` to accept `additionalFilters` prop. Check the component's props before implementing.

- [ ] **Step 3: Add banner styling**

Add to `src/components/pipelineRuns-list/PipelineRunsList.scss`:

```scss
.opp-plr-multicluster-banner {
  margin: var(--pf-t--global--spacer--md) var(--pf-t--global--spacer--lg) 0;
}
```

- [ ] **Step 4: Verify in browser**

```
# Navigate to PipelineRuns list
# Verify: info banner visible with dismiss button, cluster dropdown appears in toolbar
# Dismiss banner → refresh → should stay dismissed
# Select a cluster → table filters to only that cluster's runs
# Select "All Clusters" → shows all runs again
```

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelineRuns-list/PipelineRunsList.tsx src/components/pipelineRuns-list/PipelineRunsList.scss
git commit -m "feat: add cluster filter dropdown and multi-cluster info banner"
```

---

### Task 6: PipelineRun Details — Cluster Badge & Execution Card

**Files:**
- Modify: `src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx` (add ClusterBadge to title)
- Create: `src/components/pipelineRuns-details/ClusterExecutionCard.tsx`
- Create: `src/components/pipelineRuns-details/ClusterExecutionCard.scss`
- Modify: `src/components/pipelineRuns-details/PipelineRunDetails.tsx` (render ClusterExecutionCard)

**Interfaces:**
- Consumes: `ClusterBadge`, `RoutingPill`, `ResourceMeter`, `DispatchTimeline` from `src/components/cluster/`; `getClusterDataForPipelineRun` from mock-cluster-data
- Produces: Cluster badge in title row, `<ClusterExecutionCard pipelineRunName={string} />` component

- [ ] **Step 1: Add ClusterBadge to PipelineRunDetailsPage title**

In `src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx`, add import:

```typescript
import ClusterBadge from '../cluster/ClusterBadge';
import { getClusterDataForPipelineRun } from '../__demo__/mock-cluster-data';
```

In the `resourceTitleFunc` useMemo, add the ClusterBadge after the `<ResourceStatus>` block, inside the flex div:

```tsx
{(() => {
  const clusterData = getClusterDataForPipelineRun(pipelineRun?.metadata?.name);
  if (!clusterData) return null;
  const clusterName = pipelineRun?.metadata?.annotations?.['tekton.dev/cluster'];
  return clusterName ? (
    <ClusterBadge
      clusterName={clusterName}
      clusterType={clusterData.clusterInfo.type}
      region={clusterData.clusterInfo.region}
    />
  ) : null;
})()}
```

- [ ] **Step 2: Create ClusterExecutionCard component**

Create `src/components/pipelineRuns-details/ClusterExecutionCard.tsx`:

```tsx
import type { FC } from 'react';
import {
  Card,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Divider,
  Grid,
  GridItem,
  Title,
} from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import {
  ClusterBadge,
  RoutingPill,
  ResourceMeter,
  DispatchTimeline,
} from '../cluster';
import { useTranslation } from 'react-i18next';
import type { PipelineRunClusterData } from '../__demo__/mock-cluster-data';

import './ClusterExecutionCard.scss';

export interface ClusterExecutionCardProps {
  clusterData: PipelineRunClusterData;
  clusterName: string;
}

const ClusterExecutionCard: FC<ClusterExecutionCardProps> = ({
  clusterData,
  clusterName,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const {
    clusterInfo,
    routing,
    resources,
    timeline,
    clusterQueue,
    secretSync,
  } = clusterData;

  const queueDisplay = `${resources.queueUsed} / ${resources.queueCapacity}`;
  const queuePercent = Math.round(
    (resources.queueUsed / resources.queueCapacity) * 100,
  );

  return (
    <div className="opp-cluster-execution">
      <div className="opp-cluster-execution__header">
        <Title headingLevel="h2" size="lg">
          {t('Cluster Execution')}
        </Title>
        <ClusterBadge
          clusterName={clusterName}
          clusterType={clusterInfo.type}
          region={clusterInfo.region}
        />
      </div>

      <Card isPlain className="opp-cluster-execution__card">
        <CardBody>
          <Grid hasGutter>
            {/* Panel 1: Dispatch & Routing */}
            <GridItem sm={12} md={4}>
              <Title headingLevel="h4" size="sm" className="opp-cluster-execution__panel-title">
                {t('Dispatch & Routing')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Dispatched by')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.dispatchedBy}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Target cluster')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.targetCluster}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Routing reason')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.reason}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Queue wait')}</DescriptionListTerm>
                  <DescriptionListDescription>{routing.queueWait}</DescriptionListDescription>
                </DescriptionListGroup>
                {routing.alternatives && (
                  <DescriptionListGroup>
                    <DescriptionListTerm>{t('Alternatives')}</DescriptionListTerm>
                    <DescriptionListDescription>{routing.alternatives}</DescriptionListDescription>
                  </DescriptionListGroup>
                )}
              </DescriptionList>
              <RoutingPill
                quality={routing.routeQuality}
                text={
                  routing.routeQuality === 'optimal'
                    ? t('Optimal route')
                    : t('Constrained route')
                }
              />
              <Divider className="opp-cluster-execution__divider" />
              <Title headingLevel="h5" size="sm" className="opp-cluster-execution__sub-title">
                {t('Dispatch timeline')}
              </Title>
              <DispatchTimeline timeline={timeline} />
            </GridItem>

            {/* Panel 2: Cluster Resources */}
            <GridItem sm={12} md={4}>
              <Title headingLevel="h4" size="sm" className="opp-cluster-execution__panel-title">
                {t('Cluster Resources (at execution)')}
              </Title>
              <ResourceMeter label={t('CPU')} value={resources.cpuPercent} />
              <ResourceMeter label={t('Memory')} value={resources.memoryPercent} />
              <ResourceMeter
                label={t('Queue')}
                value={queuePercent}
                displayValue={queueDisplay}
              />
              <div className="opp-cluster-execution__node-info">
                {t('Node:')} <strong>{resources.node}</strong>
                <br />
                {resources.vCPU} vCPU &middot; {resources.ramGi} Gi RAM
              </div>
              <Divider className="opp-cluster-execution__divider" />
              <Title headingLevel="h5" size="sm" className="opp-cluster-execution__sub-title">
                {t('ClusterQueue')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Name')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.name}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Flavor')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.flavor}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Pending')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.pending}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Active')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterQueue.active}</DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
            </GridItem>

            {/* Panel 3: Cluster Info */}
            <GridItem sm={12} md={4}>
              <Title headingLevel="h4" size="sm" className="opp-cluster-execution__panel-title">
                {t('Cluster Info')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Cluster')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    <ClusterBadge
                      clusterName={clusterName}
                      clusterType={clusterInfo.type}
                    />
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Region')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {clusterInfo.region} ({clusterInfo.regionName})
                  </DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Provider')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.provider}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('OCP version')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.ocpVersion}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Pipelines ver.')}</DescriptionListTerm>
                  <DescriptionListDescription>{clusterInfo.pipelinesVersion}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Status')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {clusterInfo.status}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <Divider className="opp-cluster-execution__divider" />
              <Title headingLevel="h5" size="sm" className="opp-cluster-execution__sub-title">
                {t('Secret sync')}
              </Title>
              <DescriptionList isCompact isHorizontal>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Last sync')}</DescriptionListTerm>
                  <DescriptionListDescription>{secretSync.lastSync}</DescriptionListDescription>
                </DescriptionListGroup>
                <DescriptionListGroup>
                  <DescriptionListTerm>{t('Secrets synced')}</DescriptionListTerm>
                  <DescriptionListDescription>
                    {secretSync.synced} / {secretSync.total}
                  </DescriptionListDescription>
                </DescriptionListGroup>
              </DescriptionList>
              <a className="opp-cluster-execution__external-link" href="#">
                <ExternalLinkAltIcon /> {t('Open')} {clusterName} {t('console')}
              </a>
            </GridItem>
          </Grid>
        </CardBody>
      </Card>
    </div>
  );
};

export default ClusterExecutionCard;
```

Create `src/components/pipelineRuns-details/ClusterExecutionCard.scss`:

```scss
.opp-cluster-execution {
  margin-bottom: var(--pf-t--global--spacer--lg);

  &__header {
    display: flex;
    align-items: center;
    gap: var(--pf-t--global--spacer--md);
    margin-bottom: var(--pf-t--global--spacer--md);
  }
  &__card {
    border: 1px solid var(--pf-t--global--border--color--default);
    border-radius: var(--pf-t--global--border--radius--medium);
  }
  &__panel-title {
    margin-bottom: var(--pf-t--global--spacer--md);
  }
  &__sub-title {
    margin-bottom: var(--pf-t--global--spacer--sm);
  }
  &__divider {
    margin: var(--pf-t--global--spacer--md) 0;
  }
  &__node-info {
    margin-top: var(--pf-t--global--spacer--md);
    font-size: var(--pf-t--global--font--size--xs);
    color: var(--pf-t--global--text--color--subtle);
  }
  &__external-link {
    display: inline-flex;
    align-items: center;
    gap: var(--pf-t--global--spacer--xs);
    margin-top: var(--pf-t--global--spacer--md);
    font-size: var(--pf-t--global--font--size--sm);
    color: var(--pf-t--global--text--color--link--default);
    text-decoration: none;
    &:hover {
      text-decoration: underline;
    }
  }
}
```

- [ ] **Step 3: Integrate ClusterExecutionCard into PipelineRunDetails**

In `src/components/pipelineRuns-details/PipelineRunDetails.tsx`:

Add imports:
```typescript
import ClusterExecutionCard from './ClusterExecutionCard';
import { getClusterDataForPipelineRun } from '../__demo__/mock-cluster-data';
```

Add the card between `PipelineRunVisualization` and the `Grid`:

```tsx
const PipelineRunDetails: FC<PipelineRunDetailsProps> = ({
  obj: pipelineRun,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!pipelineRun) {
    return <Loading />;
  }

  const clusterData = getClusterDataForPipelineRun(pipelineRun.metadata?.name);
  const clusterName = pipelineRun.metadata?.annotations?.['tekton.dev/cluster'];

  return (
    <PageSection
      key={pipelineRun?.metadata?.uid + pipelineRun?.metadata?.name}
      hasBodyWrapper={false}
      isFilled
    >
      <Title headingLevel="h2">{t('PipelineRun details')}</Title>
      <PipelineRunVisualization pipelineRun={pipelineRun} />
      {clusterData && clusterName && (
        <ClusterExecutionCard
          clusterData={clusterData}
          clusterName={clusterName}
        />
      )}
      <Grid hasGutter>
        {/* ... existing ResourceSummary + PipelineRunCustomDetails ... */}
      </Grid>
    </PageSection>
  );
};
```

- [ ] **Step 4: Verify in browser**

```
# Navigate to a PipelineRun detail page (click a mock PLR name)
# Verify: ClusterBadge visible in title row next to status
# Verify: Cluster Execution card visible with 3 panels between visualization and detail fields
# Verify: Dispatch timeline stepper renders correctly
# Verify: Resource meters show correct values with color coding
```

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx src/components/pipelineRuns-details/ClusterExecutionCard.tsx src/components/pipelineRuns-details/ClusterExecutionCard.scss src/components/pipelineRuns-details/PipelineRunDetails.tsx
git commit -m "feat: add cluster badge to title and ClusterExecutionCard to PipelineRun details"
```
