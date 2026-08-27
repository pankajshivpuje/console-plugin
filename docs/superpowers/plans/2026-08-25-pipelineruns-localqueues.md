# PipelineRuns Wireframe Gaps — LocalQueues, Output/TaskRuns Tabs, List Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mock-data-driven LocalQueues management tab (full CRUD) to the Pipelines page, add Output and TaskRuns tabs to the PipelineRun details view, and apply minor multi-cluster polish to the PipelineRuns list.

**Architecture:** Follows the existing mock-data pattern (`src/components/__demo__/`). LocalQueues state is held in-memory in a single container component (`LocalQueuesList`); all other LocalQueue components are presentational and communicate via props/callbacks. Detail tabs read from existing hooks (`useTaskRuns`) and the PipelineRun object. No real Kueue CRD wiring.

**Tech Stack:** React 18 + TypeScript, PatternFly 6 (`@patternfly/react-core`, `@patternfly/react-table`, `@patternfly/react-icons`), `react-i18next`, Jest + `@testing-library/react`, OpenShift Console dynamic-plugin-sdk.

**Spec:** `docs/superpowers/specs/2026-08-25-pipelineruns-localqueues-design.md`

## Global Constraints

- **i18n namespace:** every `useTranslation` call uses `'plugin__pipelines-console-plugin'`; every user-facing string is wrapped in `t()`.
- **New i18n keys** are added to `locales/en/plugin__pipelines-console-plugin.json` (Task 11). Other locales are left to fall back to key.
- **PatternFly 6 only.** Use the composable APIs already in this repo: `Modal` + `ModalHeader`/`ModalBody`/`ModalFooter`; kebab via `Dropdown` + `MenuToggle variant="plain"` + `EllipsisVIcon` + `DropdownList`/`DropdownItem`; tables via `Table`/`Thead`/`Tbody`/`Tr`/`Th`/`Td` from `@patternfly/react-table`.
- **Mock-data only** — no k8s calls, no new k8s model, no RBAC. LocalQueue CRUD mutates in-memory React state.
- **NEVER run `yarn lint`** in this repo — its autofix corrupts source tree-wide. Verify with `yarn tsc --noEmit` and `yarn jest <path>` only.
- **Branch:** `multi-cluster` (already checked out). Do not merge/push without explicit user consent.
- **Commit trailer** on every commit:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  ```
- **Test conventions:** mock `react-i18next` as `{ useTranslation: () => ({ t: (k: string) => k }) }` (matches existing specs).

---

### Task 1: LocalQueue mock data + types

**Files:**
- Create: `src/components/__demo__/mock-localqueue-data.ts`
- Test: `src/components/__demo__/__tests__/mock-localqueue-data.spec.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `type SchedulingPolicy = 'hub-only' | 'any-spoke' | 'selected-spokes'`
  - `type LocalQueueStatus = 'Ready' | 'Pending' | 'Error'`
  - `interface LocalQueue { name: string; namespace: string; resourceFlavor: string; schedulingPolicy: SchedulingPolicy; spokeClusterNames: string[]; status: LocalQueueStatus; lastUpdated: string; }`
  - `interface SpokeClusterOption { name: string; region: string; }`
  - `const MOCK_LOCAL_QUEUES: LocalQueue[]`
  - `const SPOKE_CLUSTERS: SpokeClusterOption[]`
  - `const NAMESPACE_OPTIONS: string[]`
  - `const RESOURCE_FLAVOR_OPTIONS: string[]`

- [ ] **Step 1: Write the failing test**

```ts
// src/components/__demo__/__tests__/mock-localqueue-data.spec.ts
import {
  MOCK_LOCAL_QUEUES,
  SPOKE_CLUSTERS,
  NAMESPACE_OPTIONS,
  RESOURCE_FLAVOR_OPTIONS,
} from '../mock-localqueue-data';

describe('mock-localqueue-data', () => {
  it('provides the six wireframe LocalQueues', () => {
    expect(MOCK_LOCAL_QUEUES).toHaveLength(6);
    expect(MOCK_LOCAL_QUEUES.map((q) => q.name)).toContain('ci-builds-fast');
    expect(MOCK_LOCAL_QUEUES.map((q) => q.name)).toContain('security-scans');
  });

  it('marks security-scans as an Error hub-only queue', () => {
    const q = MOCK_LOCAL_QUEUES.find((lq) => lq.name === 'security-scans');
    expect(q?.status).toBe('Error');
    expect(q?.schedulingPolicy).toBe('hub-only');
  });

  it('gives selected-spokes queues their spoke names', () => {
    const q = MOCK_LOCAL_QUEUES.find((lq) => lq.name === 'gpu-ml-validation');
    expect(q?.schedulingPolicy).toBe('selected-spokes');
    expect(q?.spokeClusterNames).toEqual(['spoke-east-gpu-01', 'spoke-west-gpu-02']);
  });

  it('provides option lists for the create form', () => {
    expect(SPOKE_CLUSTERS.length).toBeGreaterThanOrEqual(7);
    expect(NAMESPACE_OPTIONS).toContain('cicd-platform');
    expect(RESOURCE_FLAVOR_OPTIONS).toEqual(
      expect.arrayContaining(['default', 'gpu-enabled', 'arm64', 'high-memory']),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/__demo__/__tests__/mock-localqueue-data.spec.ts`
Expected: FAIL — cannot find module `../mock-localqueue-data`.

- [ ] **Step 3: Write the mock data module**

```ts
// src/components/__demo__/mock-localqueue-data.ts
export type SchedulingPolicy = 'hub-only' | 'any-spoke' | 'selected-spokes';
export type LocalQueueStatus = 'Ready' | 'Pending' | 'Error';

export interface LocalQueue {
  name: string;
  namespace: string;
  resourceFlavor: string;
  schedulingPolicy: SchedulingPolicy;
  spokeClusterNames: string[];
  status: LocalQueueStatus;
  lastUpdated: string;
}

export interface SpokeClusterOption {
  name: string;
  region: string;
}

export const MOCK_LOCAL_QUEUES: LocalQueue[] = [
  { name: 'ci-builds-fast', namespace: 'cicd-platform', resourceFlavor: 'default', schedulingPolicy: 'any-spoke', spokeClusterNames: [], status: 'Ready', lastUpdated: '2 hours ago' },
  { name: 'release-pipeline-queue', namespace: 'release-eng', resourceFlavor: 'high-memory', schedulingPolicy: 'hub-only', spokeClusterNames: [], status: 'Ready', lastUpdated: 'Yesterday' },
  { name: 'gpu-ml-validation', namespace: 'team-alpha', resourceFlavor: 'gpu-enabled', schedulingPolicy: 'selected-spokes', spokeClusterNames: ['spoke-east-gpu-01', 'spoke-west-gpu-02'], status: 'Ready', lastUpdated: '3 days ago' },
  { name: 'nightly-integration', namespace: 'pipelines-infra', resourceFlavor: 'default', schedulingPolicy: 'any-spoke', spokeClusterNames: [], status: 'Pending', lastUpdated: '5 minutes ago' },
  { name: 'arm-builds', namespace: 'team-beta', resourceFlavor: 'arm64', schedulingPolicy: 'selected-spokes', spokeClusterNames: ['spoke-arm-central-01'], status: 'Ready', lastUpdated: '1 day ago' },
  { name: 'security-scans', namespace: 'cicd-platform', resourceFlavor: 'default', schedulingPolicy: 'hub-only', spokeClusterNames: [], status: 'Error', lastUpdated: '30 minutes ago' },
];

export const SPOKE_CLUSTERS: SpokeClusterOption[] = [
  { name: 'spoke-east-01', region: 'us-east-1' },
  { name: 'spoke-east-gpu-01', region: 'us-east-1' },
  { name: 'spoke-west-01', region: 'us-west-2' },
  { name: 'spoke-west-gpu-02', region: 'us-west-2' },
  { name: 'spoke-eu-central-01', region: 'eu-central-1' },
  { name: 'spoke-arm-central-01', region: 'us-central-1' },
  { name: 'spoke-apac-01', region: 'ap-southeast-1' },
];

export const NAMESPACE_OPTIONS: string[] = [
  'cicd-platform',
  'pipelines-infra',
  'team-alpha',
  'team-beta',
  'release-eng',
];

export const RESOURCE_FLAVOR_OPTIONS: string[] = [
  'default',
  'gpu-enabled',
  'arm64',
  'high-memory',
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/__demo__/__tests__/mock-localqueue-data.spec.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/__demo__/mock-localqueue-data.ts src/components/__demo__/__tests__/mock-localqueue-data.spec.ts
git commit -m "feat(localqueues): add mock LocalQueue data and types

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Presenters — SchedulingPolicyBadge + LocalQueueStatusIcon

**Files:**
- Create: `src/components/localqueues-list/SchedulingPolicyBadge.tsx`
- Create: `src/components/localqueues-list/LocalQueueStatusIcon.tsx`
- Test: `src/components/localqueues-list/__tests__/presenters.spec.tsx`

**Interfaces:**
- Consumes: `SchedulingPolicy`, `LocalQueueStatus` from `../__demo__/mock-localqueue-data`.
- Produces:
  - `SchedulingPolicyBadge: FC<{ policy: SchedulingPolicy }>`
  - `LocalQueueStatusIcon: FC<{ status: LocalQueueStatus }>`

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/localqueues-list/__tests__/presenters.spec.tsx
import { render, screen } from '@testing-library/react';
import SchedulingPolicyBadge from '../SchedulingPolicyBadge';
import LocalQueueStatusIcon from '../LocalQueueStatusIcon';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueue presenters', () => {
  it('renders policy labels', () => {
    const { rerender } = render(<SchedulingPolicyBadge policy="hub-only" />);
    expect(screen.getByText('Hub Only')).toBeTruthy();
    rerender(<SchedulingPolicyBadge policy="any-spoke" />);
    expect(screen.getByText('Any Spoke')).toBeTruthy();
    rerender(<SchedulingPolicyBadge policy="selected-spokes" />);
    expect(screen.getByText('Selected Spokes')).toBeTruthy();
  });

  it('renders status text', () => {
    const { rerender } = render(<LocalQueueStatusIcon status="Ready" />);
    expect(screen.getByText('Ready')).toBeTruthy();
    rerender(<LocalQueueStatusIcon status="Error" />);
    expect(screen.getByText('Error')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/localqueues-list/__tests__/presenters.spec.tsx`
Expected: FAIL — cannot find modules.

- [ ] **Step 3: Write the presenters**

```tsx
// src/components/localqueues-list/SchedulingPolicyBadge.tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@patternfly/react-core';
import type { SchedulingPolicy } from '../__demo__/mock-localqueue-data';

const CONFIG: Record<SchedulingPolicy, { key: string; color: 'purple' | 'blue' | 'teal' }> = {
  'hub-only': { key: 'Hub Only', color: 'purple' },
  'any-spoke': { key: 'Any Spoke', color: 'blue' },
  'selected-spokes': { key: 'Selected Spokes', color: 'teal' },
};

const SchedulingPolicyBadge: FC<{ policy: SchedulingPolicy }> = ({ policy }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { key, color } = CONFIG[policy];
  return (
    <Label isCompact color={color}>
      {t(key)}
    </Label>
  );
};

export default SchedulingPolicyBadge;
```

```tsx
// src/components/localqueues-list/LocalQueueStatusIcon.tsx
import type { FC, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@patternfly/react-core';
import {
  CheckCircleIcon,
  InProgressIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import type { LocalQueueStatus } from '../__demo__/mock-localqueue-data';

const CONFIG: Record<
  LocalQueueStatus,
  { icon: ReactNode; status: 'success' | 'warning' | 'danger' }
> = {
  Ready: { icon: <CheckCircleIcon />, status: 'success' },
  Pending: { icon: <InProgressIcon />, status: 'warning' },
  Error: { icon: <ExclamationCircleIcon />, status: 'danger' },
};

const LocalQueueStatusIcon: FC<{ status: LocalQueueStatus }> = ({ status }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const { icon, status: iconStatus } = CONFIG[status];
  return (
    <span className="pf-v6-l-flex pf-v6-u-align-items-center pf-v6-l-gap-sm">
      <Icon status={iconStatus}>{icon}</Icon> {t(status)}
    </span>
  );
};

export default LocalQueueStatusIcon;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/localqueues-list/__tests__/presenters.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/localqueues-list/SchedulingPolicyBadge.tsx src/components/localqueues-list/LocalQueueStatusIcon.tsx src/components/localqueues-list/__tests__/presenters.spec.tsx
git commit -m "feat(localqueues): add policy badge and status icon presenters

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: LocalQueuesTable

**Files:**
- Create: `src/components/localqueues-list/LocalQueuesTable.tsx`
- Test: `src/components/localqueues-list/__tests__/LocalQueuesTable.spec.tsx`

**Interfaces:**
- Consumes: `LocalQueue` type; `SchedulingPolicyBadge`; `LocalQueueStatusIcon`.
- Produces:
  - `interface LocalQueuesTableProps { rows: LocalQueue[]; onEdit: (lq: LocalQueue) => void; onDelete: (lq: LocalQueue) => void; }`
  - `LocalQueuesTable: FC<LocalQueuesTableProps>` (default export)

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/localqueues-list/__tests__/LocalQueuesTable.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueuesTable from '../LocalQueuesTable';
import { MOCK_LOCAL_QUEUES } from '../../__demo__/mock-localqueue-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueuesTable', () => {
  it('renders a row per queue with namespace and spoke chips', () => {
    render(
      <LocalQueuesTable rows={MOCK_LOCAL_QUEUES} onEdit={jest.fn()} onDelete={jest.fn()} />,
    );
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    expect(screen.getByText('spoke-east-gpu-01')).toBeTruthy();
    expect(screen.getAllByText('cicd-platform').length).toBeGreaterThan(0);
  });

  it('fires onEdit and onDelete from the kebab menu', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(
      <LocalQueuesTable rows={[MOCK_LOCAL_QUEUES[0]]} onEdit={onEdit} onDelete={onDelete} />,
    );
    fireEvent.click(screen.getByLabelText('Actions for ci-builds-fast'));
    fireEvent.click(screen.getByText('Edit'));
    expect(onEdit).toHaveBeenCalledWith(MOCK_LOCAL_QUEUES[0]);

    fireEvent.click(screen.getByLabelText('Actions for ci-builds-fast'));
    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith(MOCK_LOCAL_QUEUES[0]);
  });

  it('renders an empty state when there are no rows', () => {
    render(<LocalQueuesTable rows={[]} onEdit={jest.fn()} onDelete={jest.fn()} />);
    expect(screen.getByText('No LocalQueues found')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueuesTable.spec.tsx`
Expected: FAIL — cannot find module `../LocalQueuesTable`.

- [ ] **Step 3: Write the table (with a per-row kebab)**

```tsx
// src/components/localqueues-list/LocalQueuesTable.tsx
import type { FC, Ref } from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from '@patternfly/react-table';
import {
  Bullseye,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  Label,
  LabelGroup,
  MenuToggle,
  MenuToggleElement,
} from '@patternfly/react-core';
import EllipsisVIcon from '@patternfly/react-icons/dist/esm/icons/ellipsis-v-icon';
import type { LocalQueue } from '../__demo__/mock-localqueue-data';
import SchedulingPolicyBadge from './SchedulingPolicyBadge';
import LocalQueueStatusIcon from './LocalQueueStatusIcon';

export interface LocalQueuesTableProps {
  rows: LocalQueue[];
  onEdit: (lq: LocalQueue) => void;
  onDelete: (lq: LocalQueue) => void;
}

const RowKebab: FC<{
  lq: LocalQueue;
  onEdit: (lq: LocalQueue) => void;
  onDelete: (lq: LocalQueue) => void;
}> = ({ lq, onEdit, onDelete }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [open, setOpen] = useState(false);
  return (
    <Dropdown
      isOpen={open}
      onSelect={() => setOpen(false)}
      onOpenChange={setOpen}
      popperProps={{ position: 'right' }}
      toggle={(toggleRef: Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          variant="plain"
          aria-label={t('Actions for {{name}}', { name: lq.name })}
          isExpanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem key="edit" component="button" onClick={() => onEdit(lq)}>
          {t('Edit')}
        </DropdownItem>
        <DropdownItem key="delete" component="button" onClick={() => onDelete(lq)}>
          {t('Delete')}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

const TargetClusters: FC<{ lq: LocalQueue }> = ({ lq }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (lq.schedulingPolicy === 'hub-only') {
    return <span className="pf-v6-u-color-200">{t('Hub cluster')}</span>;
  }
  if (lq.schedulingPolicy === 'any-spoke') {
    return <span className="pf-v6-u-color-200">{t('All available spokes')}</span>;
  }
  return (
    <LabelGroup numLabels={5}>
      {lq.spokeClusterNames.map((s) => (
        <Label key={s} isCompact>
          {s}
        </Label>
      ))}
    </LabelGroup>
  );
};

const LocalQueuesTable: FC<LocalQueuesTableProps> = ({ rows, onEdit, onDelete }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  if (rows.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No LocalQueues found')}</span>
      </Bullseye>
    );
  }

  return (
    <Table aria-label={t('LocalQueues')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Namespace')}</Th>
          <Th>{t('Scheduling Policy')}</Th>
          <Th>{t('Target Clusters')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Last Updated')}</Th>
          <Th screenReaderText={t('Actions')} />
        </Tr>
      </Thead>
      <Tbody>
        {rows.map((lq) => (
          <Tr key={`${lq.namespace}/${lq.name}`}>
            <Td dataLabel={t('Name')}>
              <Button variant="link" isInline component="a">
                {lq.name}
              </Button>
            </Td>
            <Td dataLabel={t('Namespace')}>{lq.namespace}</Td>
            <Td dataLabel={t('Scheduling Policy')}>
              <SchedulingPolicyBadge policy={lq.schedulingPolicy} />
            </Td>
            <Td dataLabel={t('Target Clusters')}>
              <TargetClusters lq={lq} />
            </Td>
            <Td dataLabel={t('Status')}>
              <LocalQueueStatusIcon status={lq.status} />
            </Td>
            <Td dataLabel={t('Last Updated')}>{lq.lastUpdated}</Td>
            <Td isActionCell>
              <RowKebab lq={lq} onEdit={onEdit} onDelete={onDelete} />
            </Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default LocalQueuesTable;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueuesTable.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/localqueues-list/LocalQueuesTable.tsx src/components/localqueues-list/__tests__/LocalQueuesTable.spec.tsx
git commit -m "feat(localqueues): add LocalQueues table with row actions

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: LocalQueueModal (Create/Edit form)

**Files:**
- Create: `src/components/localqueues-list/LocalQueueModal.tsx`
- Test: `src/components/localqueues-list/__tests__/LocalQueueModal.spec.tsx`

**Interfaces:**
- Consumes: `LocalQueue`, `SchedulingPolicy`, `SPOKE_CLUSTERS`, `NAMESPACE_OPTIONS`, `RESOURCE_FLAVOR_OPTIONS`.
- Produces:
  - `interface LocalQueueFormValues { name: string; namespace: string; resourceFlavor: string; schedulingPolicy: SchedulingPolicy; spokeClusterNames: string[]; }`
  - `interface LocalQueueModalProps { isOpen: boolean; editTarget: LocalQueue | null; onClose: () => void; onSubmit: (values: LocalQueueFormValues) => void; }`
  - `LocalQueueModal: FC<LocalQueueModalProps>` (default export)

**Notes:** The modal is a controlled form using local `useState`; it does **not** validate business rules (duplicate name) — it only requires name+namespace non-empty to enable submit, and passes values up. `editTarget !== null` switches the title to "Edit LocalQueue", the submit label to "Save", and disables the name field.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/localqueues-list/__tests__/LocalQueueModal.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueueModal from '../LocalQueueModal';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueueModal', () => {
  it('reveals spoke checkboxes only for selected-spokes policy', () => {
    render(
      <LocalQueueModal isOpen editTarget={null} onClose={jest.fn()} onSubmit={jest.fn()} />,
    );
    expect(screen.queryByLabelText(/spoke-east-01/)).toBeNull();
    fireEvent.click(screen.getByLabelText('Selected Spokes'));
    expect(screen.getByText(/spoke-east-01/)).toBeTruthy();
  });

  it('submits collected values for a new queue', () => {
    const onSubmit = jest.fn();
    render(
      <LocalQueueModal isOpen editTarget={null} onClose={jest.fn()} onSubmit={onSubmit} />,
    );
    fireEvent.change(screen.getByLabelText('Name', { exact: false }), {
      target: { value: 'my-queue' },
    });
    fireEvent.change(screen.getByLabelText('Namespace', { exact: false }), {
      target: { value: 'team-alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'my-queue',
        namespace: 'team-alpha',
        schedulingPolicy: 'hub-only',
      }),
    );
  });

  it('pre-fills and disables the name field in edit mode', () => {
    render(
      <LocalQueueModal
        isOpen
        editTarget={{
          name: 'arm-builds',
          namespace: 'team-beta',
          resourceFlavor: 'arm64',
          schedulingPolicy: 'selected-spokes',
          spokeClusterNames: ['spoke-arm-central-01'],
          status: 'Ready',
          lastUpdated: '1 day ago',
        }}
        onClose={jest.fn()}
        onSubmit={jest.fn()}
      />,
    );
    const nameInput = screen.getByLabelText('Name', { exact: false }) as HTMLInputElement;
    expect(nameInput.value).toBe('arm-builds');
    expect(nameInput.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueueModal.spec.tsx`
Expected: FAIL — cannot find module `../LocalQueueModal`.

- [ ] **Step 3: Write the modal**

```tsx
// src/components/localqueues-list/LocalQueueModal.tsx
import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInput,
  FormSelect,
  FormSelectOption,
  Radio,
  Checkbox,
} from '@patternfly/react-core';
import type {
  LocalQueue,
  SchedulingPolicy,
} from '../__demo__/mock-localqueue-data';
import {
  SPOKE_CLUSTERS,
  NAMESPACE_OPTIONS,
  RESOURCE_FLAVOR_OPTIONS,
} from '../__demo__/mock-localqueue-data';

export interface LocalQueueFormValues {
  name: string;
  namespace: string;
  resourceFlavor: string;
  schedulingPolicy: SchedulingPolicy;
  spokeClusterNames: string[];
}

export interface LocalQueueModalProps {
  isOpen: boolean;
  editTarget: LocalQueue | null;
  onClose: () => void;
  onSubmit: (values: LocalQueueFormValues) => void;
}

const emptyValues: LocalQueueFormValues = {
  name: '',
  namespace: '',
  resourceFlavor: RESOURCE_FLAVOR_OPTIONS[0],
  schedulingPolicy: 'hub-only',
  spokeClusterNames: [],
};

const POLICIES: { value: SchedulingPolicy; label: string; desc: string }[] = [
  {
    value: 'hub-only',
    label: 'Hub Only',
    desc: 'PipelineRuns execute only on the hub cluster. Use for sensitive workloads or when spoke clusters are unavailable.',
  },
  {
    value: 'any-spoke',
    label: 'Any Spoke',
    desc: 'PipelineRuns are distributed to any available spoke cluster. Kueue selects the best fit based on resource availability.',
  },
  {
    value: 'selected-spokes',
    label: 'Selected Spokes',
    desc: 'PipelineRuns are restricted to a specific set of spoke clusters that you choose below.',
  },
];

const LocalQueueModal: FC<LocalQueueModalProps> = ({
  isOpen,
  editTarget,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const isEdit = editTarget !== null;
  const [values, setValues] = useState<LocalQueueFormValues>(emptyValues);

  useEffect(() => {
    if (editTarget) {
      setValues({
        name: editTarget.name,
        namespace: editTarget.namespace,
        resourceFlavor: editTarget.resourceFlavor,
        schedulingPolicy: editTarget.schedulingPolicy,
        spokeClusterNames: [...editTarget.spokeClusterNames],
      });
    } else {
      setValues(emptyValues);
    }
  }, [editTarget, isOpen]);

  const set = <K extends keyof LocalQueueFormValues>(
    key: K,
    val: LocalQueueFormValues[K],
  ) => setValues((prev) => ({ ...prev, [key]: val }));

  const toggleSpoke = (name: string, checked: boolean) =>
    set(
      'spokeClusterNames',
      checked
        ? [...values.spokeClusterNames, name]
        : values.spokeClusterNames.filter((s) => s !== name),
    );

  const canSubmit = values.name.trim() !== '' && values.namespace !== '';

  return (
    <Modal variant="medium" isOpen={isOpen} onClose={onClose}>
      <ModalHeader title={isEdit ? t('Edit LocalQueue') : t('Create LocalQueue')} />
      <ModalBody>
        <Form id="localqueue-form">
          <FormGroup label={t('Name')} isRequired fieldId="lq-name">
            <TextInput
              id="lq-name"
              isRequired
              isDisabled={isEdit}
              value={values.name}
              onChange={(_e, v) => set('name', v)}
              placeholder="e.g. ci-builds-fast"
            />
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t(
                    'Must be a valid Kubernetes resource name (lowercase, alphanumeric, dashes).',
                  )}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('Namespace')} isRequired fieldId="lq-namespace">
            <FormSelect
              id="lq-namespace"
              value={values.namespace}
              onChange={(_e, v) => set('namespace', v)}
              aria-label={t('Namespace')}
            >
              <FormSelectOption value="" label={t('Select namespace...')} isDisabled />
              {NAMESPACE_OPTIONS.map((ns) => (
                <FormSelectOption key={ns} value={ns} label={ns} />
              ))}
            </FormSelect>
          </FormGroup>

          <FormGroup label={t('Resource Flavor')} isRequired fieldId="lq-flavor">
            <FormSelect
              id="lq-flavor"
              value={values.resourceFlavor}
              onChange={(_e, v) => set('resourceFlavor', v)}
              aria-label={t('Resource Flavor')}
            >
              {RESOURCE_FLAVOR_OPTIONS.map((f) => (
                <FormSelectOption key={f} value={f} label={f} />
              ))}
            </FormSelect>
            <FormHelperText>
              <HelperText>
                <HelperTextItem>
                  {t('Kueue ResourceFlavor for resource quota allocation.')}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          </FormGroup>

          <FormGroup label={t('Scheduling Policy')} isRequired fieldId="lq-policy" role="radiogroup">
            {POLICIES.map((p) => (
              <Radio
                key={p.value}
                id={`lq-policy-${p.value}`}
                name="lq-policy"
                label={t(p.label)}
                description={t(p.desc)}
                isChecked={values.schedulingPolicy === p.value}
                onChange={() => set('schedulingPolicy', p.value)}
              />
            ))}
          </FormGroup>

          {values.schedulingPolicy === 'selected-spokes' && (
            <FormGroup label={t('Select Spoke Clusters')} fieldId="lq-spokes">
              {SPOKE_CLUSTERS.map((sc) => (
                <Checkbox
                  key={sc.name}
                  id={`lq-spoke-${sc.name}`}
                  label={`${sc.name} (${sc.region})`}
                  isChecked={values.spokeClusterNames.includes(sc.name)}
                  onChange={(_e, checked) => toggleSpoke(sc.name, checked)}
                />
              ))}
            </FormGroup>
          )}
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="submit"
          variant="primary"
          isDisabled={!canSubmit}
          onClick={() => onSubmit(values)}
        >
          {isEdit ? t('Save') : t('Create')}
        </Button>
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default LocalQueueModal;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueueModal.spec.tsx`
Expected: PASS. If PatternFly `Modal` renders into a portal and queries fail, the render still occurs in `document.body`; Testing Library's `screen` searches the whole document, so no extra config is needed.

- [ ] **Step 5: Commit**

```bash
git add src/components/localqueues-list/LocalQueueModal.tsx src/components/localqueues-list/__tests__/LocalQueueModal.spec.tsx
git commit -m "feat(localqueues): add create/edit LocalQueue modal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 5: LocalQueueDeleteModal

**Files:**
- Create: `src/components/localqueues-list/LocalQueueDeleteModal.tsx`
- Test: `src/components/localqueues-list/__tests__/LocalQueueDeleteModal.spec.tsx`

**Interfaces:**
- Consumes: `LocalQueue`.
- Produces:
  - `interface LocalQueueDeleteModalProps { target: LocalQueue | null; onClose: () => void; onConfirm: () => void; }`
  - `LocalQueueDeleteModal: FC<LocalQueueDeleteModalProps>` (default export). Open state is derived from `target !== null`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/localqueues-list/__tests__/LocalQueueDeleteModal.spec.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import LocalQueueDeleteModal from '../LocalQueueDeleteModal';
import { MOCK_LOCAL_QUEUES } from '../../__demo__/mock-localqueue-data';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('LocalQueueDeleteModal', () => {
  it('names the target and confirms deletion', () => {
    const onConfirm = jest.fn();
    render(
      <LocalQueueDeleteModal
        target={MOCK_LOCAL_QUEUES[0]}
        onClose={jest.fn()}
        onConfirm={onConfirm}
      />,
    );
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('renders nothing when target is null', () => {
    const { container } = render(
      <LocalQueueDeleteModal target={null} onClose={jest.fn()} onConfirm={jest.fn()} />,
    );
    expect(container.textContent).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueueDeleteModal.spec.tsx`
Expected: FAIL — cannot find module.

- [ ] **Step 3: Write the delete modal**

```tsx
// src/components/localqueues-list/LocalQueueDeleteModal.tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Content,
} from '@patternfly/react-core';
import type { LocalQueue } from '../__demo__/mock-localqueue-data';

export interface LocalQueueDeleteModalProps {
  target: LocalQueue | null;
  onClose: () => void;
  onConfirm: () => void;
}

const LocalQueueDeleteModal: FC<LocalQueueDeleteModalProps> = ({
  target,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  if (!target) {
    return null;
  }
  return (
    <Modal variant="small" isOpen onClose={onClose}>
      <ModalHeader title={t('Delete LocalQueue')} titleIconVariant="warning" />
      <ModalBody>
        <Content component="p">
          {t('Are you sure you want to delete LocalQueue')}{' '}
          <strong>{target.name}</strong>?
        </Content>
        <Content component="p" className="pf-v6-u-color-200">
          {t(
            'This action cannot be undone. Any PipelineRuns referencing this LocalQueue will lose their scheduling configuration.',
          )}
        </Content>
      </ModalBody>
      <ModalFooter>
        <Button key="delete" variant="danger" onClick={onConfirm}>
          {t('Delete')}
        </Button>
        <Button key="cancel" variant="secondary" onClick={onClose}>
          {t('Cancel')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default LocalQueueDeleteModal;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueueDeleteModal.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/localqueues-list/LocalQueueDeleteModal.tsx src/components/localqueues-list/__tests__/LocalQueueDeleteModal.spec.tsx
git commit -m "feat(localqueues): add delete confirmation modal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 6: LocalQueuesList container (CRUD, search, toasts, auto-open) + index + scss

**Files:**
- Create: `src/components/localqueues-list/LocalQueuesList.tsx`
- Create: `src/components/localqueues-list/index.ts`
- Create: `src/components/localqueues-list/LocalQueues.scss`
- Test: `src/components/localqueues-list/__tests__/LocalQueuesList.spec.tsx`

**Interfaces:**
- Consumes: `MOCK_LOCAL_QUEUES`, `LocalQueue`; `LocalQueuesTable`; `LocalQueueModal` + `LocalQueueFormValues`; `LocalQueueDeleteModal`.
- Produces: `LocalQueuesList: FC` (default export) and named re-export from `index.ts`.

**Behavior:**
- Holds `queues` state seeded from `MOCK_LOCAL_QUEUES`.
- Search filters by name (case-insensitive).
- "Create LocalQueue" opens the modal in create mode; kebab Edit opens it in edit mode; kebab Delete opens the delete modal.
- On create submit: reject duplicate name (danger toast); reject `selected-spokes` with no spokes (danger toast); otherwise prepend a `Pending` queue with `lastUpdated: 'Just now'` and success toast.
- On edit submit: same spoke validation; merge changes, set `lastUpdated: 'Just now'`, success toast.
- On delete confirm: remove and success toast.
- Toasts rendered via `AlertGroup isToast isLiveRegion` with per-alert `timeout`.
- Auto-open: if `useSearchParams` has `create=1`, open the create modal on mount and strip the param.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/localqueues-list/__tests__/LocalQueuesList.spec.tsx
import { render, screen, fireEvent, within } from '@testing-library/react';
import LocalQueuesList from '../LocalQueuesList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const setSearchParams = jest.fn();
jest.mock('react-router', () => ({
  useSearchParams: () => [new URLSearchParams(), setSearchParams],
}));

describe('LocalQueuesList', () => {
  beforeEach(() => setSearchParams.mockClear());

  it('renders the seed queues', () => {
    render(<LocalQueuesList />);
    expect(screen.getByText('ci-builds-fast')).toBeTruthy();
    expect(screen.getByText('security-scans')).toBeTruthy();
  });

  it('filters by name', () => {
    render(<LocalQueuesList />);
    fireEvent.change(screen.getByLabelText('Search by name', { exact: false }), {
      target: { value: 'gpu' },
    });
    expect(screen.getByText('gpu-ml-validation')).toBeTruthy();
    expect(screen.queryByText('ci-builds-fast')).toBeNull();
  });

  it('creates a new queue via the modal', () => {
    render(<LocalQueuesList />);
    fireEvent.click(screen.getByRole('button', { name: 'Create LocalQueue' }));
    fireEvent.change(screen.getByLabelText('Name', { exact: false }), {
      target: { value: 'brand-new-queue' },
    });
    fireEvent.change(screen.getByLabelText('Namespace', { exact: false }), {
      target: { value: 'team-alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getByText('brand-new-queue')).toBeTruthy();
  });

  it('rejects a duplicate name with a danger toast', () => {
    render(<LocalQueuesList />);
    fireEvent.click(screen.getByRole('button', { name: 'Create LocalQueue' }));
    fireEvent.change(screen.getByLabelText('Name', { exact: false }), {
      target: { value: 'ci-builds-fast' },
    });
    fireEvent.change(screen.getByLabelText('Namespace', { exact: false }), {
      target: { value: 'team-alpha' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    expect(
      screen.getByText('A LocalQueue with this name already exists.'),
    ).toBeTruthy();
  });

  it('deletes a queue after confirmation', () => {
    render(<LocalQueuesList />);
    const row = screen.getByText('arm-builds').closest('tr') as HTMLElement;
    fireEvent.click(within(row).getByLabelText('Actions for arm-builds'));
    fireEvent.click(screen.getByText('Delete'));
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.queryByText('arm-builds')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueuesList.spec.tsx`
Expected: FAIL — cannot find module `../LocalQueuesList`.

- [ ] **Step 3: Write the container**

```tsx
// src/components/localqueues-list/LocalQueuesList.tsx
import type { FC } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  AlertVariant,
  Button,
  SearchInput,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
} from '@patternfly/react-core';
import { ListPageBody } from '@openshift-console/dynamic-plugin-sdk';
import {
  MOCK_LOCAL_QUEUES,
  LocalQueue,
} from '../__demo__/mock-localqueue-data';
import LocalQueuesTable from './LocalQueuesTable';
import LocalQueueModal, { LocalQueueFormValues } from './LocalQueueModal';
import LocalQueueDeleteModal from './LocalQueueDeleteModal';

import './LocalQueues.scss';

interface ToastAlert {
  key: number;
  variant: AlertVariant;
  title: string;
}

const LocalQueuesList: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const [searchParams, setSearchParams] = useSearchParams();

  const [queues, setQueues] = useState<LocalQueue[]>(() => [...MOCK_LOCAL_QUEUES]);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<LocalQueue | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<LocalQueue | null>(null);
  const [alerts, setAlerts] = useState<ToastAlert[]>([]);
  const [alertKey, setAlertKey] = useState(0);

  const addToast = (variant: AlertVariant, title: string) => {
    setAlertKey((k) => k + 1);
    setAlerts((prev) => [...prev, { key: alertKey, variant, title }]);
  };
  const removeToast = (key: number) =>
    setAlerts((prev) => prev.filter((a) => a.key !== key));

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      setEditTarget(null);
      setModalOpen(true);
      const next = new URLSearchParams(searchParams);
      next.delete('create');
      setSearchParams(next, { replace: true });
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? queues.filter((lq) => lq.name.toLowerCase().includes(q)) : queues;
  }, [queues, search]);

  const openCreate = () => {
    setEditTarget(null);
    setModalOpen(true);
  };
  const openEdit = (lq: LocalQueue) => {
    setEditTarget(lq);
    setModalOpen(true);
  };
  const closeModal = () => {
    setModalOpen(false);
    setEditTarget(null);
  };

  const handleSubmit = (values: LocalQueueFormValues) => {
    if (
      values.schedulingPolicy === 'selected-spokes' &&
      values.spokeClusterNames.length === 0
    ) {
      addToast(AlertVariant.danger, t('Select at least one spoke cluster.'));
      return;
    }
    if (editTarget) {
      setQueues((prev) =>
        prev.map((lq) =>
          lq.name === editTarget.name && lq.namespace === editTarget.namespace
            ? { ...lq, ...values, lastUpdated: t('Just now') }
            : lq,
        ),
      );
      addToast(
        AlertVariant.success,
        t('LocalQueue "{{name}}" updated successfully.', { name: values.name }),
      );
    } else {
      if (queues.some((lq) => lq.name === values.name)) {
        addToast(
          AlertVariant.danger,
          t('A LocalQueue with this name already exists.'),
        );
        return;
      }
      setQueues((prev) => [
        { ...values, status: 'Pending', lastUpdated: t('Just now') },
        ...prev,
      ]);
      addToast(
        AlertVariant.success,
        t('LocalQueue "{{name}}" created successfully.', { name: values.name }),
      );
    }
    closeModal();
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setQueues((prev) =>
      prev.filter(
        (lq) =>
          !(lq.name === deleteTarget.name && lq.namespace === deleteTarget.namespace),
      ),
    );
    setDeleteTarget(null);
    addToast(AlertVariant.success, t('LocalQueue "{{name}}" deleted.', { name }));
  };

  return (
    <ListPageBody>
      <Toolbar className="pf-v6-u-px-0">
        <ToolbarContent>
          <ToolbarItem>
            <SearchInput
              aria-label={t('Search by name')}
              placeholder={t('Search by name...')}
              value={search}
              onChange={(_e, v) => setSearch(v)}
              onClear={() => setSearch('')}
            />
          </ToolbarItem>
          <ToolbarItem align={{ default: 'alignEnd' }}>
            <Button variant="primary" onClick={openCreate}>
              {t('Create LocalQueue')}
            </Button>
          </ToolbarItem>
        </ToolbarContent>
      </Toolbar>

      <LocalQueuesTable rows={filtered} onEdit={openEdit} onDelete={setDeleteTarget} />

      <div className="pf-v6-u-py-sm pf-v6-u-color-200">
        {t('{{count}} of {{total}} items', {
          count: filtered.length,
          total: queues.length,
        })}
      </div>

      <LocalQueueModal
        isOpen={modalOpen}
        editTarget={editTarget}
        onClose={closeModal}
        onSubmit={handleSubmit}
      />
      <LocalQueueDeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      <AlertGroup isToast isLiveRegion>
        {alerts.map((a) => (
          <Alert
            key={a.key}
            variant={a.variant}
            title={a.title}
            timeout={8000}
            onTimeout={() => removeToast(a.key)}
            actionClose={
              <AlertActionCloseButton
                title={a.title}
                onClose={() => removeToast(a.key)}
              />
            }
          />
        ))}
      </AlertGroup>
    </ListPageBody>
  );
};

export default LocalQueuesList;
```

```ts
// src/components/localqueues-list/index.ts
export { default as LocalQueuesList } from './LocalQueuesList';
```

```scss
// src/components/localqueues-list/LocalQueues.scss
.opp-localqueues {
  &__spoke-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--pf-t--global--spacer--xs);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/localqueues-list/__tests__/LocalQueuesList.spec.tsx`
Expected: PASS. (If the duplicate-key React warning appears from `alertKey` reuse, it's cosmetic in tests; the `alertKey` increments per toast.)

- [ ] **Step 5: Commit**

```bash
git add src/components/localqueues-list/LocalQueuesList.tsx src/components/localqueues-list/index.ts src/components/localqueues-list/LocalQueues.scss src/components/localqueues-list/__tests__/LocalQueuesList.spec.tsx
git commit -m "feat(localqueues): add LocalQueues list container with CRUD, search, toasts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 7: Wire the LocalQueues tab + Create→LocalQueue dropdown entry

**Files:**
- Modify: `src/components/pipelines-list/PipelinesTabbedPage.tsx` (imports; `pages` array ~66-99; `menuActions` ~53-65)

**Interfaces:**
- Consumes: `LocalQueuesList` from `../localqueues-list`.
- Produces: a new `local-queues` NavPage and a `localQueue` create-menu action navigating to `…/local-queues?create=1`.

- [ ] **Step 1: Add the import**

Add near the other list imports (after line 18 `import { PipelineRunsList } from '../pipelineRuns-list';`):

```ts
import { LocalQueuesList } from '../localqueues-list';
```

- [ ] **Step 2: Append the tab to `pages`**

Add as the final entry of the `pages: NavPage[]` array (after the `isApprovalTaskEnabled` block, before the closing `];`):

```ts
    {
      href: 'local-queues',
      name: t('LocalQueues'),
      component: LocalQueuesList,
    },
```

- [ ] **Step 3: Add the Create-dropdown action**

In the `menuActions` object, add a `localQueue` entry. Because this action opens a modal on the tab rather than creating a k8s resource, give it a `label` and an `onSelection` that returns the tab URL with `?create=1`:

```ts
    localQueue: {
      label: t('LocalQueue'),
      onSelection: (_key: string, _action: MenuAction, _url: string) =>
        `/pipelines/ns/${ns ?? 'default'}/local-queues?create=1`,
    },
```

Add `const { ns } = useParams();` if not already present in `PageContents` — it is not; import `useParams` from `react-router` (already imported at line 31 `import { useLocation, useParams } from 'react-router';`) and call it at the top of `PageContents`. The `MenuAction` type is already imported (line 26).

> Note: `MenuAction.onSelection` requires `model` to be optional in the type. Verify `MenuAction` in `src/components/multi-tab-list/multi-tab-list-page-types.ts` allows a `label`-only action (no `model`). If `model` is required, add `label?: string` / make `model?` optional there in this step and adjust `MultiTabListPage`'s label resolver (it already falls back to `menuAction.label`).

- [ ] **Step 4: Type-check and smoke-test the app**

Run: `yarn tsc --noEmit`
Expected: no new errors.

Manually verify (or via the existing dev flow) that the Pipelines page shows a "LocalQueues" tab and the Create dropdown lists "LocalQueue". Since `PipelinesTabbedPage` depends on console SDK context that is awkward to unit-test, rely on `tsc` + manual verification here (no new spec).

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-list/PipelinesTabbedPage.tsx src/components/multi-tab-list/multi-tab-list-page-types.ts
git commit -m "feat(localqueues): add LocalQueues tab and Create dropdown entry

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 8: PipelineRun details — TaskRuns tab

**Files:**
- Create: `src/components/pipelineRuns-details/PipelineRunTaskRuns.tsx`
- Modify: `src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx` (imports; `pages` array ~154-179)
- Test: `src/components/pipelineRuns-details/__tests__/PipelineRunTaskRuns.spec.tsx`

**Interfaces:**
- Consumes: `useTaskRuns(namespace, pipelineRunName)` from `../hooks/useTaskRuns` → `[TaskRunKind[], boolean, boolean, Error | undefined, ...]`; `PipelineRunKind`, `TaskRunKind` from `../../types`.
- Produces: `PipelineRunTaskRuns: FC<{ obj: PipelineRunKind }>` (default export).

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/pipelineRuns-details/__tests__/PipelineRunTaskRuns.spec.tsx
import { render, screen } from '@testing-library/react';
import PipelineRunTaskRuns from '../PipelineRunTaskRuns';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

const mockUseTaskRuns = jest.fn();
jest.mock('../../hooks/useTaskRuns', () => ({
  useTaskRuns: (...args: unknown[]) => mockUseTaskRuns(...args),
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelineRuns-details/__tests__/PipelineRunTaskRuns.spec.tsx`
Expected: FAIL — cannot find module `../PipelineRunTaskRuns`.

- [ ] **Step 3: Write the TaskRuns tab**

```tsx
// src/components/pipelineRuns-details/PipelineRunTaskRuns.tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Bullseye } from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { PipelineRunKind, TaskRunKind } from '../../types';
import { useTaskRuns } from '../hooks/useTaskRuns';
import { LoadingBox } from '../status/status-box';
import Status from '../status/Status';
import { pipelineRunFilterReducer } from '../utils/pipeline-filter-reducer';

const taskName = (tr: TaskRunKind): string =>
  tr.spec?.taskRef?.name ||
  tr.metadata?.labels?.['tekton.dev/pipelineTask'] ||
  '-';

const started = (tr: TaskRunKind): string => tr.status?.startTime || '-';

const PipelineRunTaskRuns: FC<{ obj: PipelineRunKind }> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const namespace = obj?.metadata?.namespace;
  const name = obj?.metadata?.name;
  const [taskRuns, k8sLoaded, trLoaded] = useTaskRuns(namespace, name);
  const loaded = k8sLoaded || trLoaded;

  if (!loaded) {
    return <LoadingBox />;
  }
  if (!taskRuns || taskRuns.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No TaskRuns found')}</span>
      </Bullseye>
    );
  }

  return (
    <Table aria-label={t('TaskRuns')} variant="compact">
      <Thead>
        <Tr>
          <Th>{t('Name')}</Th>
          <Th>{t('Task')}</Th>
          <Th>{t('Status')}</Th>
          <Th>{t('Started')}</Th>
        </Tr>
      </Thead>
      <Tbody>
        {taskRuns.map((tr) => (
          <Tr key={tr.metadata?.uid || tr.metadata?.name}>
            <Td dataLabel={t('Name')}>{tr.metadata?.name}</Td>
            <Td dataLabel={t('Task')}>{taskName(tr)}</Td>
            <Td dataLabel={t('Status')}>
              <Status status={pipelineRunFilterReducer(tr)} />
            </Td>
            <Td dataLabel={t('Started')}>{started(tr)}</Td>
          </Tr>
        ))}
      </Tbody>
    </Table>
  );
};

export default PipelineRunTaskRuns;
```

> Note: `pipelineRunFilterReducer` accepts any resource with `status.conditions` and returns a `ComputedStatus`; it is already used across this folder for both PipelineRuns and TaskRuns. Confirm the import path `../utils/pipeline-filter-reducer` (used by `PipelineRunDetailsPage.tsx`).

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelineRuns-details/__tests__/PipelineRunTaskRuns.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Wire the tab into the details page**

In `PipelineRunDetailsPage.tsx`, add the import near the other tab imports (after line 33 `import PipelineRunEvents from './PipelineRunEvents';`):

```ts
import PipelineRunTaskRuns from './PipelineRunTaskRuns';
```

In the `pages` array, add after `navFactory.events(PipelineRunEvents),` (line 169) and before the `...(isFailed …)` block:

```ts
        {
          href: 'task-runs',
          name: t('TaskRuns'),
          component: (props) => <PipelineRunTaskRuns obj={pipelineRun} {...props} />,
        },
```

- [ ] **Step 6: Type-check and commit**

Run: `yarn tsc --noEmit` → no new errors.

```bash
git add src/components/pipelineRuns-details/PipelineRunTaskRuns.tsx src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx src/components/pipelineRuns-details/__tests__/PipelineRunTaskRuns.spec.tsx
git commit -m "feat(pipelinerun-details): add TaskRuns tab

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 9: PipelineRun details — Output tab

**Files:**
- Create: `src/components/pipelineRuns-details/PipelineRunOutput.tsx`
- Modify: `src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx` (imports; `pages` array)
- Test: `src/components/pipelineRuns-details/__tests__/PipelineRunOutput.spec.tsx`

**Interfaces:**
- Consumes: `PipelineRunKind` from `../../types`.
- Produces: `PipelineRunOutput: FC<{ obj: PipelineRunKind }>` (default export). Reads results from `obj.status.results` (v1) falling back to `obj.status.pipelineResults` (v1beta1); each result is `{ name: string; value: string }`.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/pipelineRuns-details/__tests__/PipelineRunOutput.spec.tsx
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelineRuns-details/__tests__/PipelineRunOutput.spec.tsx`
Expected: FAIL — cannot find module `../PipelineRunOutput`.

- [ ] **Step 3: Write the Output tab**

```tsx
// src/components/pipelineRuns-details/PipelineRunOutput.tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Bullseye,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
} from '@patternfly/react-core';
import { PipelineRunKind } from '../../types';

interface PipelineRunResult {
  name: string;
  value: string;
}

const PipelineRunOutput: FC<{ obj: PipelineRunKind }> = ({ obj }) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const status = obj?.status as
    | { results?: PipelineRunResult[]; pipelineResults?: PipelineRunResult[] }
    | undefined;
  const results = status?.results || status?.pipelineResults || [];

  if (results.length === 0) {
    return (
      <Bullseye className="pf-v6-u-py-2xl">
        <span className="pf-v6-u-color-200">{t('No output results')}</span>
      </Bullseye>
    );
  }

  return (
    <DescriptionList
      isHorizontal
      className="pf-v6-u-p-md"
      aria-label={t('Output')}
    >
      {results.map((r) => (
        <DescriptionListGroup key={r.name}>
          <DescriptionListTerm>{r.name}</DescriptionListTerm>
          <DescriptionListDescription>{r.value}</DescriptionListDescription>
        </DescriptionListGroup>
      ))}
    </DescriptionList>
  );
};

export default PipelineRunOutput;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `yarn jest src/components/pipelineRuns-details/__tests__/PipelineRunOutput.spec.tsx`
Expected: PASS.

- [ ] **Step 5: Wire the tab into the details page**

Add the import after the `PipelineRunTaskRuns` import from Task 8:

```ts
import PipelineRunOutput from './PipelineRunOutput';
```

In the `pages` array, add the Output entry immediately before the `task-runs` entry (so tab order is …Events / Output / TaskRuns, matching the wireframe):

```ts
        {
          href: 'output',
          name: t('Output'),
          component: (props) => <PipelineRunOutput obj={pipelineRun} {...props} />,
        },
```

- [ ] **Step 6: Type-check and commit**

Run: `yarn tsc --noEmit` → no new errors.

```bash
git add src/components/pipelineRuns-details/PipelineRunOutput.tsx src/components/pipelineRuns-details/PipelineRunDetailsPage.tsx src/components/pipelineRuns-details/__tests__/PipelineRunOutput.spec.tsx
git commit -m "feat(pipelinerun-details): add Output tab

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 10: List-view polish — connectivity legend

**Files:**
- Modify: `src/components/pipelineRuns-list/PipelineRunsList.tsx` (add a legend beside the cluster `Select`, ~136-164)
- Modify: `src/components/pipelineRuns-list/PipelineRunsList.scss` (legend styles)
- Test: `src/components/pipelineRuns-list/__tests__/PipelineRunsConnectivityLegend.spec.tsx`

**Interfaces:**
- Produces: an inline `ConnectivityLegend` presentational component (module-local; not exported) rendering three labeled dots (Connected / Idle / Disconnected).

**Note:** Keep it self-contained. Rather than thread it through the existing `PipelineRunsList` (which needs SDK context to render in tests), extract the legend into its own tiny file so it is unit-testable, and render it in `PipelineRunsList` next to the cluster filter.

- [ ] **Step 1: Write the failing test**

```tsx
// src/components/pipelineRuns-list/__tests__/PipelineRunsConnectivityLegend.spec.tsx
import { render, screen } from '@testing-library/react';
import ConnectivityLegend from '../ConnectivityLegend';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

describe('ConnectivityLegend', () => {
  it('renders the three connectivity states', () => {
    render(<ConnectivityLegend />);
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.getByText('Idle')).toBeTruthy();
    expect(screen.getByText('Disconnected')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `yarn jest src/components/pipelineRuns-list/__tests__/PipelineRunsConnectivityLegend.spec.tsx`
Expected: FAIL — cannot find module `../ConnectivityLegend`.

- [ ] **Step 3: Write the legend and render it**

```tsx
// src/components/pipelineRuns-list/ConnectivityLegend.tsx
import type { FC } from 'react';
import { useTranslation } from 'react-i18next';

const DOTS: { key: string; className: string }[] = [
  { key: 'Connected', className: 'opp-connectivity-dot--connected' },
  { key: 'Idle', className: 'opp-connectivity-dot--idle' },
  { key: 'Disconnected', className: 'opp-connectivity-dot--disconnected' },
];

const ConnectivityLegend: FC = () => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  return (
    <span className="opp-connectivity-legend">
      {DOTS.map((d) => (
        <span key={d.key} className="opp-connectivity-legend__item">
          <span className={`opp-connectivity-dot ${d.className}`} />
          {t(d.key)}
        </span>
      ))}
    </span>
  );
};

export default ConnectivityLegend;
```

In `PipelineRunsList.tsx`, import it (after the `MultiClusterPipelineRunsTable` import, line 22):

```ts
import ConnectivityLegend from './ConnectivityLegend';
```

And render it right after the cluster `Select` (immediately before the closing `</DataViewFilterToolbar>` tag, after line 163):

```tsx
          <ConnectivityLegend />
```

Append to `PipelineRunsList.scss`:

```scss
.opp-connectivity-legend {
  display: inline-flex;
  align-items: center;
  gap: var(--pf-t--global--spacer--md);
  margin-inline-start: var(--pf-t--global--spacer--md);
  color: var(--pf-t--global--text--color--subtle);
  font-size: var(--pf-t--global--font--size--sm);

  &__item {
    display: inline-flex;
    align-items: center;
    gap: var(--pf-t--global--spacer--xs);
  }
}

.opp-connectivity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;

  &--connected {
    background: var(--pf-t--global--color--status--success--default);
  }
  &--idle {
    background: var(--pf-t--global--color--status--warning--default);
  }
  &--disconnected {
    background: var(--pf-t--global--color--status--danger--default);
  }
}
```

- [ ] **Step 4: Run test + type-check**

Run: `yarn jest src/components/pipelineRuns-list/__tests__/PipelineRunsConnectivityLegend.spec.tsx` → PASS.
Run: `yarn tsc --noEmit` → no new errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelineRuns-list/ConnectivityLegend.tsx src/components/pipelineRuns-list/PipelineRunsList.tsx src/components/pipelineRuns-list/PipelineRunsList.scss src/components/pipelineRuns-list/__tests__/PipelineRunsConnectivityLegend.spec.tsx
git commit -m "feat(pipelineruns-list): add connectivity legend to cluster filter

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 11: i18n keys + full verification

**Files:**
- Modify: `locales/en/plugin__pipelines-console-plugin.json`

**Interfaces:** none (data file).

- [ ] **Step 1: Collect the new keys**

Add the following keys to `locales/en/plugin__pipelines-console-plugin.json` (alphabetical insertion, value === key unless it contains interpolation). Only add keys not already present:

```
"LocalQueues": "LocalQueues",
"LocalQueue": "LocalQueue",
"Create LocalQueue": "Create LocalQueue",
"Edit LocalQueue": "Edit LocalQueue",
"Delete LocalQueue": "Delete LocalQueue",
"Scheduling Policy": "Scheduling Policy",
"Target Clusters": "Target Clusters",
"Last Updated": "Last Updated",
"Hub Only": "Hub Only",
"Any Spoke": "Any Spoke",
"Selected Spokes": "Selected Spokes",
"Hub cluster": "Hub cluster",
"All available spokes": "All available spokes",
"Resource Flavor": "Resource Flavor",
"Select namespace...": "Select namespace...",
"Select Spoke Clusters": "Select Spoke Clusters",
"Kueue ResourceFlavor for resource quota allocation.": "Kueue ResourceFlavor for resource quota allocation.",
"Must be a valid Kubernetes resource name (lowercase, alphanumeric, dashes).": "Must be a valid Kubernetes resource name (lowercase, alphanumeric, dashes).",
"PipelineRuns execute only on the hub cluster. Use for sensitive workloads or when spoke clusters are unavailable.": "PipelineRuns execute only on the hub cluster. Use for sensitive workloads or when spoke clusters are unavailable.",
"PipelineRuns are distributed to any available spoke cluster. Kueue selects the best fit based on resource availability.": "PipelineRuns are distributed to any available spoke cluster. Kueue selects the best fit based on resource availability.",
"PipelineRuns are restricted to a specific set of spoke clusters that you choose below.": "PipelineRuns are restricted to a specific set of spoke clusters that you choose below.",
"Select at least one spoke cluster.": "Select at least one spoke cluster.",
"A LocalQueue with this name already exists.": "A LocalQueue with this name already exists.",
"LocalQueue \"{{name}}\" created successfully.": "LocalQueue \"{{name}}\" created successfully.",
"LocalQueue \"{{name}}\" updated successfully.": "LocalQueue \"{{name}}\" updated successfully.",
"LocalQueue \"{{name}}\" deleted.": "LocalQueue \"{{name}}\" deleted.",
"No LocalQueues found": "No LocalQueues found",
"Actions for {{name}}": "Actions for {{name}}",
"Search by name": "Search by name",
"Search by name...": "Search by name...",
"{{count}} of {{total}} items": "{{count}} of {{total}} items",
"Just now": "Just now",
"Output": "Output",
"TaskRuns": "TaskRuns",
"Task": "Task",
"No TaskRuns found": "No TaskRuns found",
"No output results": "No output results",
"Connected": "Connected",
"Idle": "Idle",
"Disconnected": "Disconnected"
```

> Verify each key against the file first (`grep '"Output"' locales/en/plugin__pipelines-console-plugin.json`); several (e.g. `Name`, `Namespace`, `Status`, `Started`, `Edit`, `Delete`, `Cancel`, `Create`, `Actions`) already exist — do not duplicate. Keep the JSON valid (no trailing comma on the last entry).

- [ ] **Step 2: Validate JSON**

Run: `node -e "require('./locales/en/plugin__pipelines-console-plugin.json'); console.log('ok')"`
Expected: prints `ok`.

- [ ] **Step 3: Full type-check + test suite**

Run: `yarn tsc --noEmit`
Expected: no errors.

Run: `yarn jest src/components/localqueues-list src/components/pipelineRuns-details src/components/pipelineRuns-list src/components/__demo__`
Expected: all specs pass.

**Do NOT run `yarn lint`.**

- [ ] **Step 4: Commit**

```bash
git add locales/en/plugin__pipelines-console-plugin.json
git commit -m "chore(i18n): add LocalQueues and detail-tab strings

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- §2.1 list polish → Task 10 (legend) + Task 7 (Create→LocalQueue). ✅
- §2.2 Output/TaskRuns tabs → Tasks 9 / 8. ✅
- §2.3 LocalQueues greenfield → Tasks 1-7. ✅ (data, presenters, table, create/edit modal, delete modal, container, wiring)
- §4.1 data layer → Task 1. §4.2 components → Tasks 2-6. §4.3 wiring → Task 7. §4.4 detail tabs → Tasks 8-9. §4.5 polish → Tasks 7+10. §4.6 i18n → Task 11. ✅
- §6 testing → each task ships specs; Task 11 runs the full suite. ✅

**Type consistency:** `LocalQueue`, `SchedulingPolicy`, `LocalQueueStatus`, `LocalQueueFormValues` are defined in Tasks 1/4 and consumed with identical names throughout. `LocalQueuesTable` props (`rows`/`onEdit`/`onDelete`), `LocalQueueModal` props (`isOpen`/`editTarget`/`onClose`/`onSubmit`), and `LocalQueueDeleteModal` props (`target`/`onClose`/`onConfirm`) match their consumers in Task 6. `useTaskRuns(namespace, name)` destructuring matches the real signature (`[TaskRunKind[], boolean, boolean, Error?]`).

**Open risks flagged for the executor:**
- Task 7: `MenuAction` may require `model`; the step includes making it optional if needed.
- Task 8: confirms `pipelineRunFilterReducer` handles TaskRuns (it is already used folder-wide).
- Task 9: PipelineRun results live under `status.results` or `status.pipelineResults` depending on API version — both are handled.
- PatternFly `Modal`/`AlertGroup` render via portals; Testing Library `screen` queries the whole document, so specs need no portal config. If a spec cannot find portal content, wrap assertions with `within(document.body)`.
