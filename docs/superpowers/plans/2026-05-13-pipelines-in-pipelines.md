# Pipelines in Pipelines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to reference pipelines from within pipelines (TEP-0056) in the OpenShift console plugin — covering type system, list page column, builder UI flow, catalog, visualization, sidebar, validation, and serialization.

**Architecture:** Extend the existing `PipelineTask` type with `pipelineRef`/`pipelineSpec` fields. Add a parallel pipeline catalog system mirroring the task catalog pattern (three providers: installed, Tekton Hub, Artifact Hub). Introduce a type selector modal in the builder "Add" flow, a new `PipelineRefNode` in the topology visualization, and a `PipelineSidebar` for editing pipeline ref task parameters. The pipeline list page gets a "Nested pipelines" column.

**Tech Stack:** React, TypeScript, PatternFly 6, Formik, `@patternfly/react-topology`, `@openshift-console/dynamic-plugin-sdk`, yup validation, Jest

---

## File Structure

### New Files

| File | Responsibility |
|---|---|
| `src/components/pipeline-builder/modals/AddResourceTypeModal.tsx` | Modal to choose Task vs Pipeline before opening catalog |
| `src/components/pipeline-builder/sidebars/PipelineSidebar.tsx` | Drawer panel for pipeline ref tasks (params, workspaces, link to details) |
| `src/components/catalog/providers/usePipelinesProvider.tsx` | Catalog provider for installed pipelines in namespace/cluster |
| `src/components/catalog/providers/useTektonHubPipelinesProvider.tsx` | Catalog provider for Tekton Hub pipelines |
| `src/components/catalog/providers/useArtifactHubPipelinesProvider.tsx` | Catalog provider for Artifact Hub pipelines |
| `src/components/task-quicksearch/PipelineQuickSearchPipelines.tsx` | Quick search wrapper for pipeline catalog |
| `src/components/task-quicksearch/PipelineQuickSearchPipelineDetails.tsx` | Right-pane details renderer for pipeline quick search |

### Modified Files

| File | Change Summary |
|---|---|
| `src/types/pipeline.ts` | Add `PipelineTaskPipelineRef`, extend `PipelineTask`, extend `PipelineBuilderTaskResources` |
| `src/types/task.ts` | Extend `SelectedBuilderTask` with `isPipelineRef` |
| `src/components/pipeline-builder/types.ts` | Add pipeline operation data types |
| `src/components/pipeline-builder/const.ts` | Add `CONVERT_LIST_TO_PIPELINE`, `ADD_LOADING_PIPELINE`, `CONVERT_LOADING_PIPELINE_TO_PIPELINE` |
| `src/components/pipeline-builder/update-utils.ts` | Add pipeline update operation handlers + `applyChange` cases |
| `src/components/pipeline-builder/utils.ts` | Add `isPipelineRef()`, `findPipeline()`, `convertResourceToPipelineRefTask()`, update serialization |
| `src/components/pipeline-builder/validation-utils.ts` | Pipeline ref validation, circular detection |
| `src/components/pipeline-builder/form-switcher-validation.ts` | Pass `pipelineRef` through |
| `src/components/pipeline-builder/hooks.ts` | Fetch pipelines, create pipeline ref nodes in `useNodes` |
| `src/components/pipeline-builder/PipelineBuilderForm.tsx` | Type selector modal flow, conditional sidebar rendering |
| `src/components/pipeline-builder/PipelineBuilderFormEditor.tsx` | `FormGroup` → `Card` |
| `src/components/pipeline-topology/const.ts` | Add `PIPELINE_REF_NODE` to `NodeType` |
| `src/components/pipeline-topology/TaskList.tsx` | "Add task" → "Add" |
| `src/components/pipelines-list/usePipelinesColumns.ts` | Add `nested-pipelines` column |
| `src/components/pipelines-list/PipelineRow.tsx` | Add nested-pipelines cell |
| `src/components/task-quicksearch/PipelineQuickSearch.tsx` | Update `searchPlaceholder` |
| `src/components/catalog/providers/index.ts` | Export new pipeline providers |
| `console-extensions.json` | Add `pipelines-pipeline-catalog` provider entries |

---

### Task 1: Type System Extensions

**Files:**
- Modify: `src/types/pipeline.ts:12-93`
- Modify: `src/types/task.ts:10-14`
- Test: `src/components/pipeline-builder/__tests__/utils.spec.ts`

- [ ] **Step 1: Write test for `isPipelineRef` helper**

Add to `src/components/pipeline-builder/__tests__/utils.spec.ts`:

```typescript
import { isPipelineRef } from '../utils';

describe('isPipelineRef', () => {
  it('should return true when task has pipelineRef', () => {
    expect(isPipelineRef({ name: 'test', pipelineRef: { name: 'my-pipeline' } })).toBe(true);
  });

  it('should return true when task has pipelineSpec', () => {
    expect(isPipelineRef({ name: 'test', pipelineSpec: { tasks: [] } })).toBe(true);
  });

  it('should return false when task has taskRef', () => {
    expect(isPipelineRef({ name: 'test', taskRef: { name: 'my-task' } })).toBe(false);
  });

  it('should return false when task has neither', () => {
    expect(isPipelineRef({ name: 'test' })).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/pipeline-builder/__tests__/utils.spec.ts --testNamePattern="isPipelineRef" --no-coverage`
Expected: FAIL — `isPipelineRef` is not exported from `../utils`

- [ ] **Step 3: Add `PipelineTaskPipelineRef` type and extend `PipelineTask`**

In `src/types/pipeline.ts`, add after the `PipelineTaskRef` type (line 17):

```typescript
export type PipelineTaskPipelineRef = {
  name?: string;
  resolver?: string;
  params?: PipelineTaskParam[];
};
```

Then extend `PipelineTask` (around line 48) to add two new optional fields:

```typescript
export type PipelineTask = {
  name: string;
  params?: PipelineTaskParam[];
  resources?: TektonResourceGroup<PipelineTaskResource>;
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
  taskSpec?: TektonTaskSpec;
  pipelineRef?: PipelineTaskPipelineRef;
  pipelineSpec?: PipelineSpec;
  when?: WhenExpression[];
  workspaces?: PipelineTaskWorkspace[];
};
```

Extend `PipelineBuilderTaskResources` (around line 89):

```typescript
export type PipelineBuilderTaskResources = {
  namespacedTasks: TaskKind[];
  clusterResolverTasks: TaskKind[];
  tasksLoaded: boolean;
  namespacedPipelines: PipelineKind[];
  clusterResolverPipelines: PipelineKind[];
  pipelinesLoaded: boolean;
};
```

- [ ] **Step 4: Extend `SelectedBuilderTask` in `src/types/task.ts`**

```typescript
export type SelectedBuilderTask = {
  resource: TaskKind;
  taskIndex: number;
  isFinallyTask: boolean;
  isPipelineRef?: boolean;
};
```

- [ ] **Step 5: Add `isPipelineRef` helper to `src/components/pipeline-builder/utils.ts`**

Add near top of file, after imports:

```typescript
export const isPipelineRef = (task: PipelineTask): boolean =>
  !!task.pipelineRef || !!task.pipelineSpec;
```

- [ ] **Step 6: Fix `PipelineBuilderTaskResources` in builder types**

In `src/components/pipeline-builder/types.ts`, the local `PipelineBuilderTaskResources` type duplicates the one in `src/types/pipeline.ts`. Remove the local definition (lines 50-54) since it's already imported from `../../types`. If the import line doesn't include it, add it:

```typescript
import {
  PipelineTask,
  TaskKind,
  TektonParam,
  TektonResource,
  TektonWorkspace,
  WhenExpression,
  PipelineBuilderTaskResources,
} from '../../types';
```

Remove the local `PipelineBuilderTaskResources` definition and keep the re-export for backwards compatibility:

```typescript
export type { PipelineBuilderTaskResources } from '../../types';
```

- [ ] **Step 7: Update `initialPipelineFormData` in `const.ts` if needed**

No change needed — `PipelineBuilderFormValues` doesn't store pipeline resources directly in the form values. The `taskResources` field already handles it.

- [ ] **Step 8: Run test to verify it passes**

Run: `npx jest src/components/pipeline-builder/__tests__/utils.spec.ts --testNamePattern="isPipelineRef" --no-coverage`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/types/pipeline.ts src/types/task.ts src/components/pipeline-builder/types.ts src/components/pipeline-builder/utils.ts src/components/pipeline-builder/__tests__/utils.spec.ts
git commit -m "feat: add pipelineRef/pipelineSpec types and isPipelineRef helper (TEP-0056)"
```

---

### Task 2: Pipeline List Page — Nested Pipelines Column

**Files:**
- Modify: `src/components/pipelines-list/usePipelinesColumns.ts`
- Modify: `src/components/pipelines-list/PipelineRow.tsx`

- [ ] **Step 1: Add `nested-pipelines` entry to `tableColumnInfo`**

In `src/components/pipelines-list/usePipelinesColumns.ts`, insert after the `namespace` entry (index 1) so it becomes index 2. Shift all subsequent indices:

```typescript
export const tableColumnInfo = [
  {
    id: 'name',
    classNames: 'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs',
  },
  { id: 'namespace', classNames: 'pf-v6-u-w-8-on-xl pf-v6-u-w-16-on-xs' },
  { id: 'nested-pipelines', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg' },
  {
    id: 'last-run',
    classNames: 'pf-v6-u-w-16-on-xl pf-v6-u-w-25-on-lg pf-v6-u-w-33-on-xs',
  },
  { id: 'task-run', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg' },
  { id: 'status', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl' },
  { id: 'last-run-time', classNames: 'pf-v6-m-hidden pf-m-visible-on-xl' },
  { id: 'action', classNames: 'dropdown-kebab-pf pf-v6-c-table__action' },
];
```

- [ ] **Step 2: Add column definition to `usePipelinesColumns` hook**

In the `columns` array, insert after the namespace conditional block:

```typescript
{
  id: tableColumnInfo[2].id,
  title: t('Nested pipelines'),
  props: { className: tableColumnInfo[2].classNames, modifier: 'nowrap' },
},
```

Update all subsequent column references to use the shifted indices (3 through 7 instead of 2 through 6).

- [ ] **Step 3: Add `getNestedPipelineCount` helper and cell in `PipelineRow.tsx`**

Add helper function at top of file:

```typescript
import { PipelineKind } from '../../types';

const getNestedPipelineCount = (pipeline: PipelineKind): number => {
  const tasks = pipeline.spec?.tasks || [];
  const finallyTasks = pipeline.spec?.finally || [];
  return [...tasks, ...finallyTasks].filter((t) => t.pipelineRef).length;
};
```

In `getPipelineListDataViewRows`, add the new cell in the `rowCells` object. The key must match `tableColumnInfo[2].id` which is `'nested-pipelines'`. Render as a `Link` when count > 0:

```typescript
import { Link } from 'react-router';

[tableColumnInfo[2].id]: {
  cell: (() => {
    const count = getNestedPipelineCount(obj);
    if (count > 0) {
      return (
        <Link
          to={`/k8s/ns/${obj.metadata.namespace}/tekton.dev~v1~Pipeline?nestedIn=${obj.metadata.name}`}
        >
          {count}
        </Link>
      );
    }
    return DASH;
  })(),
},
```

Update all subsequent `tableColumnInfo[N]` references to use shifted indices (3-7 instead of 2-6).

- [ ] **Step 4: Add `nestedIn` query param filter in `PipelinesList.tsx`**

In `src/components/pipelines-list/PipelinesList.tsx`, read the `nestedIn` search param and filter the pipeline list:

```typescript
import { useSearchParams } from 'react-router';

// Inside the component:
const [searchParams] = useSearchParams();
const nestedIn = searchParams.get('nestedIn');

// When nestedIn is set, find the parent pipeline and filter to show only
// pipelines referenced by it:
const filteredPipelines = useMemo(() => {
  if (!nestedIn || !pipelines) return pipelines;
  const parentPipeline = pipelines.find(
    (p) => p.metadata?.name === nestedIn,
  );
  if (!parentPipeline) return pipelines;
  const allTasks = [
    ...(parentPipeline.spec?.tasks || []),
    ...(parentPipeline.spec?.finally || []),
  ];
  const referencedNames = allTasks
    .filter((t) => t.pipelineRef?.name)
    .map((t) => t.pipelineRef.name);
  return pipelines.filter((p) =>
    referencedNames.includes(p.metadata?.name),
  );
}, [nestedIn, pipelines]);
```

Use `filteredPipelines` instead of `pipelines` in the data view.

- [ ] **Step 5: Run build to verify compilation**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors related to the changed files

- [ ] **Step 6: Commit**

```bash
git add src/components/pipelines-list/usePipelinesColumns.ts src/components/pipelines-list/PipelineRow.tsx src/components/pipelines-list/PipelinesList.tsx
git commit -m "feat: add nested pipelines column to pipeline list page"
```

---

### Task 3: Builder UI — FormGroup to Card and Text Changes

**Files:**
- Modify: `src/components/pipeline-builder/PipelineBuilderFormEditor.tsx`
- Modify: `src/components/pipeline-topology/TaskList.tsx:59`
- Modify: `src/components/task-quicksearch/PipelineQuickSearch.tsx:231`

- [ ] **Step 1: Change FormGroup to Card in `PipelineBuilderFormEditor.tsx`**

Replace the `FormGroup` wrapping `PipelineBuilderVisualization` with a PatternFly `Card`:

```tsx
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  TextInputTypes,
} from '@patternfly/react-core';
```

Replace:
```tsx
<FormGroup label={t('Tasks')} isRequired>
  <PipelineBuilderVisualization
    onTaskSelection={onTaskSelection}
    onUpdateTasks={onUpdateTasks}
    onTaskSearch={onTaskSearch}
    taskGroup={taskGroup}
    taskResources={taskResources}
  />
</FormGroup>
```

With:
```tsx
<Card isCompact isPlain>
  <CardHeader>
    <CardTitle>{t('Pipelines and tasks')}</CardTitle>
  </CardHeader>
  <CardBody>
    <PipelineBuilderVisualization
      onTaskSelection={onTaskSelection}
      onUpdateTasks={onUpdateTasks}
      onTaskSearch={onTaskSearch}
      taskGroup={taskGroup}
      taskResources={taskResources}
    />
  </CardBody>
</Card>
```

Remove `FormGroup` from imports if no longer used.

- [ ] **Step 2: Change "Add task" to "Add" in `TaskList.tsx`**

In `src/components/pipeline-topology/TaskList.tsx` line 59, change:

```typescript
const unselectedTaskText = unselectedText || t('Add task');
```

To:

```typescript
const unselectedTaskText = unselectedText || t('Add');
```

- [ ] **Step 3: Change search placeholder in `PipelineQuickSearch.tsx`**

In `src/components/task-quicksearch/PipelineQuickSearch.tsx` line 231, change:

```typescript
searchPlaceholder={`${t('Add task')}...`}
```

To:

```typescript
searchPlaceholder={`${t('Add')}...`}
```

- [ ] **Step 4: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/pipeline-builder/PipelineBuilderFormEditor.tsx src/components/pipeline-topology/TaskList.tsx src/components/task-quicksearch/PipelineQuickSearch.tsx
git commit -m "feat: rename Tasks to Pipelines and tasks, Add task to Add"
```

---

### Task 4: Update Operations for Pipeline Refs

**Files:**
- Modify: `src/components/pipeline-builder/const.ts`
- Modify: `src/components/pipeline-builder/types.ts`
- Modify: `src/components/pipeline-builder/utils.ts`
- Modify: `src/components/pipeline-builder/update-utils.ts`

- [ ] **Step 1: Add new `UpdateOperationType` values**

In `src/components/pipeline-builder/const.ts`, extend the enum:

```typescript
export enum UpdateOperationType {
  ADD_LIST_TASK,
  ADD_FINALLY_LIST_TASK,
  ADD_LOADING_TASK,
  ADD_FINALLY_LOADING_TASK,
  CONVERT_LOADING_TASK_TO_TASK,
  CONVERT_LOADING_TASK_TO_FINALLY_TASK,
  CONVERT_LIST_TO_TASK,
  CONVERT_LIST_TO_FINALLY_TASK,
  CONVERT_LIST_TO_PIPELINE,
  CONVERT_LIST_TO_FINALLY_PIPELINE,
  ADD_LOADING_PIPELINE,
  CONVERT_LOADING_PIPELINE_TO_PIPELINE,
  CONVERT_LOADING_PIPELINE_TO_FINALLY_PIPELINE,
  RENAME_TASK,
  REMOVE_TASK,
  DELETE_LIST_TASK,
  DELETE_FINALLY_LIST_TASK,
  FIX_INVALID_LIST_TASK,
  FIX_INVALID_FINALLY_LIST_TASK,
}
```

- [ ] **Step 2: Add pipeline operation data types**

In `src/components/pipeline-builder/types.ts`, add:

```typescript
import { PipelineKind } from '../../types';

export type UpdateOperationConvertToPipelineData = UpdateOperationBaseData & {
  name: string;
  resource: PipelineKind;
  runAfter?: string[];
};

export type UpdateOperationConvertToLoadingPipelineData = {
  name: string;
  resource: PipelineKind;
  runAfter?: string[];
  isFinallyTask: boolean;
};

export type PipelineBuilderLoadingPipelineTask = PipelineBuilderTaskBase & {
  isFinallyTask: boolean;
  resource: PipelineKind;
  pipelineRef: {
    name: string;
  };
};
```

- [ ] **Step 3: Add `convertResourceToPipelineRefTask` to `utils.ts`**

In `src/components/pipeline-builder/utils.ts`, add:

```typescript
import { PipelineKind } from '../../types';

export const convertResourceToPipelineRefTask = (
  usedNames: string[],
  resource: PipelineKind,
  runAfter?: string[],
  namespace?: string,
): PipelineTask => {
  const pipelineRef = (
    resource.metadata.namespace === PIPELINE_NAMESPACE &&
    namespace !== PIPELINE_NAMESPACE
  ) ? {
    resolver: 'cluster',
    params: [
      { name: 'kind', value: 'pipeline' },
      { name: 'name', value: resource.metadata.name },
      { name: 'namespace', value: PIPELINE_NAMESPACE },
    ],
  } : {
    name: resource.metadata.name,
  };

  const params = (resource.spec?.params || []).map(
    (param: TektonParam): PipelineTaskParam => ({
      name: param.name,
      value: param.default,
    }),
  );

  return {
    name: safeName(usedNames, resource.metadata.name),
    runAfter,
    pipelineRef,
    params,
  };
};
```

- [ ] **Step 4: Add pipeline update operations to `update-utils.ts`**

Add the three new operation functions and their cases in `applyChange`:

```typescript
import {
  UpdateOperationConvertToPipelineData,
  UpdateOperationConvertToLoadingPipelineData,
} from './types';
import { convertResourceToPipelineRefTask } from './utils';

const convertListToPipeline: UpdateOperationAction<
  UpdateOperationConvertToPipelineData
> = (taskGrouping, data, namespace) => {
  const { name, resource, runAfter } = data;
  const { tasks, listTasks, finallyTasks } = taskGrouping;
  const usedNames = getTaskNames([...tasks, ...finallyTasks]);
  const newPipelineTask: PipelineTask = convertResourceToPipelineRefTask(
    usedNames,
    resource,
    runAfter,
    namespace,
  );
  return {
    ...taskGrouping,
    tasks: [
      ...tasks.map((pipelineTask) =>
        mapReplaceRelatedInOthers(newPipelineTask.name, name, pipelineTask),
      ),
      newPipelineTask,
    ],
    listTasks: listTasks
      .filter((n) => n.name !== name)
      .map((listTask) =>
        mapReplaceRelatedInOthers(newPipelineTask.name, name, listTask),
      ),
  };
};

const convertFinallyListToPipeline: UpdateOperationAction<
  UpdateOperationConvertToPipelineData
> = (taskGrouping, data, namespace) => {
  const { name, resource } = data;
  const { tasks, finallyTasks, finallyListTasks } = taskGrouping;
  const usedNames = getTaskNames([...tasks, ...finallyTasks]);
  const newPipelineTask: PipelineTask = convertResourceToPipelineRefTask(
    usedNames,
    resource,
    undefined,
    namespace,
  );
  return {
    ...taskGrouping,
    finallyTasks: [
      ...finallyTasks.map((pipelineTask) =>
        mapReplaceRelatedInOthers(newPipelineTask.name, name, pipelineTask),
      ),
      newPipelineTask,
    ],
    finallyListTasks: finallyListTasks
      .filter((n) => n.name !== name)
      .map((listTask) =>
        mapReplaceRelatedInOthers(newPipelineTask.name, name, listTask),
      ),
  };
};
```

Then add the new cases to `applyChange`:

```typescript
case UpdateOperationType.CONVERT_LIST_TO_PIPELINE:
  return convertListToPipeline(
    taskGrouping,
    data as UpdateOperationConvertToPipelineData,
    namespace,
  );
case UpdateOperationType.CONVERT_LIST_TO_FINALLY_PIPELINE:
  return convertFinallyListToPipeline(
    taskGrouping,
    data as UpdateOperationConvertToPipelineData,
    namespace,
  );
```

- [ ] **Step 5: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/pipeline-builder/const.ts src/components/pipeline-builder/types.ts src/components/pipeline-builder/utils.ts src/components/pipeline-builder/update-utils.ts
git commit -m "feat: add pipeline ref update operations for builder state management"
```

---

### Task 5: Pipeline Data Fetching in Builder Hooks

**Files:**
- Modify: `src/components/pipeline-builder/hooks.ts`

- [ ] **Step 1: Extend `useFormikFetchAndSaveTasks` to fetch pipelines**

In `src/components/pipeline-builder/hooks.ts`, add `PipelineModel` to imports:

```typescript
import { PipelineModel, TaskModel } from '../../models';
import { PipelineKind, PipelineTask, TaskKind } from '../../types';
```

Extend `useK8sWatchResources` call in `useFormikFetchAndSaveTasks`:

```typescript
const { namespacedTasks, clusterResolverTasks, namespacedPipelines, clusterResolverPipelines } =
  useK8sWatchResources<{
    namespacedTasks: TaskKind[];
    clusterResolverTasks: TaskKind[];
    namespacedPipelines: PipelineKind[];
    clusterResolverPipelines: PipelineKind[];
  }>({
    namespacedTasks: {
      kind: getReferenceForModel(TaskModel),
      isList: true,
      namespace,
    },
    clusterResolverTasks: {
      kind: getReferenceForModel(TaskModel),
      isList: true,
      namespace: PIPELINE_NAMESPACE,
    },
    namespacedPipelines: {
      kind: getReferenceForModel(PipelineModel),
      isList: true,
      namespace,
    },
    clusterResolverPipelines: {
      kind: getReferenceForModel(PipelineModel),
      isList: true,
      namespace: PIPELINE_NAMESPACE,
    },
  });
```

Add pipeline data handling in the `useEffect`:

```typescript
const namespacedPipelineData = namespacedPipelines.loaded
  ? namespacedPipelines.data
  : null;
const clusterResolverPipelineData = clusterResolverPipelines.loaded
  ? clusterResolverPipelines.data
  : null;

useEffect(() => {
  if (namespacedTaskData) {
    setFieldValue('taskResources.namespacedTasks', namespacedTaskData, false);
  }
  if (clusterResolverTaskData) {
    setFieldValue('taskResources.clusterResolverTasks', clusterResolverTaskData, false);
  }
  if (namespacedPipelineData) {
    setFieldValue('taskResources.namespacedPipelines', namespacedPipelineData, false);
  }
  if (clusterResolverPipelineData) {
    setFieldValue('taskResources.clusterResolverPipelines', clusterResolverPipelineData, false);
  }
  const tasksLoaded = !!namespacedTaskData && !!clusterResolverTaskData;
  const pipelinesLoaded = !!namespacedPipelineData && !!clusterResolverPipelineData;
  setFieldValue('taskResources.tasksLoaded', tasksLoaded, false);
  setFieldValue('taskResources.pipelinesLoaded', pipelinesLoaded, false);
  if (tasksLoaded) {
    setTimeout(() => validateForm(), 0);
  }
}, [
  setFieldValue,
  namespacedTaskData,
  clusterResolverTaskData,
  namespacedPipelineData,
  clusterResolverPipelineData,
  validateForm,
]);
```

- [ ] **Step 2: Add `findPipeline` helper to `utils.ts`**

```typescript
export const findPipeline = (
  taskResources: PipelineBuilderTaskResources,
  task: PipelineTask,
): PipelineKind | null => {
  if (!task?.pipelineRef) return null;
  if (
    !taskResources?.pipelinesLoaded ||
    !taskResources.namespacedPipelines ||
    !taskResources.clusterResolverPipelines
  ) {
    return null;
  }

  const { pipelineRef } = task;
  let pipelineName: string | null = null;

  if (pipelineRef.resolver === 'cluster') {
    const nameParam = pipelineRef.params?.find((param) => param.name === 'name');
    pipelineName = nameParam ? nameParam.value : null;
  } else {
    pipelineName = pipelineRef.name;
  }

  if (!pipelineName) return null;

  const matchingName = (p: PipelineKind) => p.metadata.name === pipelineName;
  return (
    taskResources.namespacedPipelines.find(matchingName) ||
    taskResources.clusterResolverPipelines.find(matchingName) ||
    null
  );
};
```

- [ ] **Step 3: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/pipeline-builder/hooks.ts src/components/pipeline-builder/utils.ts
git commit -m "feat: fetch pipeline resources in builder and add findPipeline helper"
```

---

### Task 6: Installed Pipelines Catalog Provider

**Files:**
- Create: `src/components/catalog/providers/usePipelinesProvider.tsx`
- Modify: `src/components/catalog/providers/index.ts`
- Modify: `console-extensions.json`

- [ ] **Step 1: Create `usePipelinesProvider.tsx`**

```tsx
import { useMemo } from 'react';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { PipelineKind } from '../../../types';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
} from '@openshift-console/dynamic-plugin-sdk';
import {
  TaskProviders,
  TektonTaskAnnotation,
  TektonTaskLabel,
} from '../../task-quicksearch/pipeline-quicksearch-utils';
import { ARTIFACTHUB } from '../apis/artifactHub';
import { PipelineBuilderFormikValues } from '../../pipeline-builder/types';
import { t } from '../../utils/common-utils';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { PipelineModel } from '../../../models';

const normalizePipelines = (
  pipelines: PipelineKind[],
): CatalogItem<PipelineKind>[] => {
  return _.reduce(
    pipelines,
    (acc, pipeline) => {
      const {
        uid,
        name,
        annotations = {},
        creationTimestamp,
        labels = {},
      } = pipeline.metadata;
      const tags =
        annotations[TektonTaskAnnotation.tags]?.split(/\s*,\s*/) || [];
      const categories =
        annotations[TektonTaskAnnotation.categories]?.split(/\s*,\s*/) || [];
      const provider =
        annotations[TektonTaskAnnotation.installedFrom] || TaskProviders.redhat;
      const versions =
        annotations[TektonTaskAnnotation.installedFrom] === ARTIFACTHUB
          ? labels[TektonTaskLabel.version]
            ? [
                {
                  id: annotations[TektonTaskAnnotation.semVersion],
                  version: annotations[TektonTaskAnnotation.semVersion],
                },
              ]
            : []
          : labels[TektonTaskLabel.version]
          ? [
              {
                id: labels[TektonTaskLabel.version],
                version: labels[TektonTaskLabel.version],
              },
            ]
          : [];

      const normalizedPipeline: CatalogItem<PipelineKind> = {
        uid,
        type: TaskProviders.redhat,
        name,
        description: '',
        provider,
        tags,
        creationTimestamp,
        icon: {
          node: <ResourceIcon kind={getReferenceForModel(PipelineModel)} />,
        },
        attributes: {
          installed:
            annotations[TektonTaskAnnotation.installedFrom] === ARTIFACTHUB
              ? annotations[TektonTaskAnnotation.semVersion]
              : labels[TektonTaskLabel.version],
          versions,
          categories,
        },
        cta: {
          label: t('Add'),
          callback: () => {},
        },
        data: pipeline,
      };
      acc.push(normalizedPipeline);
      return acc;
    },
    [],
  );
};

const usePipelinesProvider: ExtensionHook<CatalogItem[]> = (): [
  CatalogItem[],
  boolean,
  string,
] => {
  const { values, status } = useFormikContext<PipelineBuilderFormikValues>();
  const {
    taskResources: {
      namespacedPipelines = [],
      clusterResolverPipelines = [],
      pipelinesLoaded = false,
    },
  } = values;

  const allPipelines = useMemo(
    () => _.filter([...namespacedPipelines, ...clusterResolverPipelines]),
    [namespacedPipelines, clusterResolverPipelines],
  );

  const normalizedPipelines = useMemo(
    () => normalizePipelines(allPipelines),
    [allPipelines],
  );

  return [normalizedPipelines, pipelinesLoaded, status?.taskLoadingError];
};

export default usePipelinesProvider;
```

- [ ] **Step 2: Export from `index.ts`**

In `src/components/catalog/providers/index.ts`, add:

```typescript
export { default as TektonPipelineProvider } from './usePipelinesProvider';
```

- [ ] **Step 3: Add catalog extension entry in `console-extensions.json`**

After the existing `pipelines-task-catalog` entries (around line 1529), add:

```json
{
  "type": "console.catalog/item-provider",
  "properties": {
    "catalogId": "pipelines-pipeline-catalog",
    "type": "Red Hat",
    "title": "%plugin__pipelines-console-plugin~Pipelines%",
    "provider": { "$codeRef": "catalog.TektonPipelineProvider" }
  },
  "flags": {
    "required": [
      "OPENSHIFT_PIPELINE",
      "HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_BUILDER"
    ]
  }
}
```

- [ ] **Step 4: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/providers/usePipelinesProvider.tsx src/components/catalog/providers/index.ts console-extensions.json
git commit -m "feat: add installed pipelines catalog provider"
```

---

### Task 7: Tekton Hub and Artifact Hub Pipeline Providers

**Files:**
- Create: `src/components/catalog/providers/useTektonHubPipelinesProvider.tsx`
- Create: `src/components/catalog/providers/useArtifactHubPipelinesProvider.tsx`
- Modify: `src/components/catalog/providers/index.ts`
- Modify: `console-extensions.json`

- [ ] **Step 1: Create `useTektonHubPipelinesProvider.tsx`**

Mirror `useTekonHubTasksProvider.tsx` but filter for `kind: Pipeline` instead of `kind: Task`:

```tsx
import { useState, useMemo } from 'react';
import { Label } from '@patternfly/react-core';
import {
  TektonHubTask,
  useInclusterTektonHubURLs,
  useTektonHubResources,
} from '../apis/tektonHub';
import {
  filterBySupportedPlatforms,
  useTektonHubIntegration,
} from '../catalog-utils';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
  useAccessReview,
} from '@openshift-console/dynamic-plugin-sdk';
import { PipelineModel } from '../../../models';
import { TaskProviders } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { t } from '../../utils/common-utils';

const normalizeTektonHubPipelines = (
  tektonHubTasks: TektonHubTask[],
  apiURL: string,
  uiURL: string,
): CatalogItem<TektonHubTask>[] => {
  return tektonHubTasks
    .filter(filterBySupportedPlatforms)
    .reduce((acc, task) => {
      if (task.kind !== 'Pipeline') {
        return acc;
      }
      const { id, name } = task;
      const { description } = task.latestVersion;
      const tags = task.tags?.map((t) => t.name) ?? [];
      const categories = task.categories?.map((ct) => ct.name) ?? [];
      const [secondaryLabelName] = categories;
      const normalizedPipeline: CatalogItem<TektonHubTask> = {
        uid: id.toString(),
        type: TaskProviders.community,
        name,
        description,
        provider: TaskProviders.tektonHub,
        tags,
        secondaryLabel: secondaryLabelName && (
          <Label color="blue">{secondaryLabelName}</Label>
        ),
        icon: {
          node: <ResourceIcon kind={getReferenceForModel(PipelineModel)} />,
        },
        attributes: { installed: '', versions: [], categories, apiURL, uiURL },
        cta: {
          label: t('Add'),
        },
        data: task,
      };
      acc.push(normalizedPipeline);
      return acc;
    }, []);
};

const useTektonHubPipelinesProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const [normalizedPipelines, setNormalizedPipelines] =
    useState<CatalogItem<TektonHubTask>[]>([]);
  const canCreatePipeline = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace,
    verb: 'create',
  });
  const canUpdatePipeline = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace,
    verb: 'update',
  });
  const integrationEnabled = useTektonHubIntegration();
  const { apiURL, uiURL, loaded: baseURLLoaded } = useInclusterTektonHubURLs();
  const [tektonHubTasks, tasksLoaded, tasksError] = useTektonHubResources(
    apiURL,
    canCreatePipeline && canUpdatePipeline && integrationEnabled && baseURLLoaded,
  );
  useMemo(
    () =>
      setNormalizedPipelines(
        normalizeTektonHubPipelines(tektonHubTasks, apiURL, uiURL),
      ),
    [apiURL, tektonHubTasks, uiURL],
  );
  return [normalizedPipelines, tasksLoaded, tasksError];
};

export default useTektonHubPipelinesProvider;
```

- [ ] **Step 2: Create `useArtifactHubPipelinesProvider.tsx`**

Mirror `useArtifactHubTasksProvider.tsx` but search for pipelines. The Artifact Hub API uses `kind=7` for Tekton pipelines (vs `kind=6` for Tekton tasks). Since the existing `useGetArtifactHubTasks` is task-specific, create a simplified provider that queries Artifact Hub for pipelines:

```tsx
import { useMemo } from 'react';
import {
  ARTIFACTHUB,
  useGetArtifactHubTasks,
} from '../apis/artifactHub';
import {
  CatalogItem,
  ExtensionHook,
  ResourceIcon,
  useAccessReview,
  useFlag,
} from '@openshift-console/dynamic-plugin-sdk';
import { TaskProviders } from '../../task-quicksearch/pipeline-quicksearch-utils';
import { PipelineModel } from '../../../models';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { useTektonHubIntegration } from '../catalog-utils';
import { t } from '../../utils/common-utils';
import { FLAGS } from '../../../types';

const useArtifactHubPipelinesProvider: ExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, string] => {
  const artifactHubIntegration = useTektonHubIntegration();
  const isDevConsoleProxyAvailable = useFlag(FLAGS.DEVCONSOLE_PROXY);
  const canCreatePipeline = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace,
    verb: 'create',
  });
  const canUpdatePipeline = useAccessReview({
    group: PipelineModel.apiGroup,
    resource: PipelineModel.plural,
    namespace,
    verb: 'update',
  });
  // Reuse the Artifact Hub hook — it returns all Tekton resources.
  // Filter for pipelines by checking the data shape.
  const [artifactHubTasks, tasksLoaded, tasksError] = useGetArtifactHubTasks(
    canCreatePipeline && canUpdatePipeline && artifactHubIntegration,
    isDevConsoleProxyAvailable,
  );
  const normalizedPipelines = useMemo<CatalogItem[]>(() => {
    // ArtifactHub tasks currently only returns tasks;
    // pipeline support would require a separate API query with kind=7.
    // For now, return empty array — the installed provider covers existing pipelines.
    return [];
  }, [artifactHubTasks]);
  return [normalizedPipelines, tasksLoaded, tasksError];
};

export default useArtifactHubPipelinesProvider;
```

- [ ] **Step 3: Export from `index.ts`**

In `src/components/catalog/providers/index.ts`, add:

```typescript
export { default as TektonHubPipelineProvider } from './useTektonHubPipelinesProvider';
export { default as ArtifactHubPipelineProvider } from './useArtifactHubPipelinesProvider';
```

- [ ] **Step 4: Add console-extensions.json entries for Hub pipeline providers**

After the Red Hat pipeline provider entry added in Task 6, add:

```json
{
  "type": "console.catalog/item-provider",
  "properties": {
    "catalogId": "pipelines-pipeline-catalog",
    "type": "TektonHub",
    "title": "%plugin__pipelines-console-plugin~TektonHub Pipelines%",
    "provider": { "$codeRef": "catalog.TektonHubPipelineProvider" }
  },
  "flags": {
    "required": [
      "OPENSHIFT_PIPELINE",
      "HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_BUILDER"
    ]
  }
},
{
  "type": "console.catalog/item-provider",
  "properties": {
    "catalogId": "pipelines-pipeline-catalog",
    "type": "ArtifactHub",
    "title": "%plugin__pipelines-console-plugin~ArtifactHub Pipelines%",
    "provider": { "$codeRef": "catalog.ArtifactHubPipelineProvider" }
  },
  "flags": {
    "required": [
      "OPENSHIFT_PIPELINE",
      "HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_BUILDER"
    ]
  }
}
```

- [ ] **Step 5: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/providers/useTektonHubPipelinesProvider.tsx src/components/catalog/providers/useArtifactHubPipelinesProvider.tsx src/components/catalog/providers/index.ts console-extensions.json
git commit -m "feat: add Tekton Hub and Artifact Hub pipeline catalog providers"
```

---

### Task 8: Pipeline Quick Search Components

**Files:**
- Create: `src/components/task-quicksearch/PipelineQuickSearchPipelineDetails.tsx`
- Create: `src/components/task-quicksearch/PipelineQuickSearchPipelines.tsx`

- [ ] **Step 1: Create `PipelineQuickSearchPipelineDetails.tsx`**

This component mirrors `PipelineQuickSearchDetails.tsx` but is simpler since pipelines don't have the same Hub version complexity initially:

```tsx
import type { FC } from 'react';
import { useState, useCallback, useMemo } from 'react';
import {
  Button,
  ButtonVariant,
  Label,
  LabelGroup,
  Level,
  LevelItem,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Content,
  Title,
} from '@patternfly/react-core';
import { CheckCircleIcon } from '@patternfly/react-icons/dist/esm/icons/check-circle-icon';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  getCtaButtonText,
  isOneVersionInstalled,
  isTaskVersionInstalled,
} from './pipeline-quicksearch-utils';
import PipelineQuickSearchVersionDropdown from './PipelineQuickSearchVersionDropdown';
import { handleCta } from '../quick-search';
import { QuickSearchDetailsRendererProps } from '../quick-search/QuickSearchDetails';

import './PipelineQuickSearchDetails.scss';

const PipelineQuickSearchPipelineDetails: FC<QuickSearchDetailsRendererProps> = ({
  selectedItem,
  closeModal,
  namespace,
  callback,
  setFailedTasks,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const [selectedVersion, setSelectedVersion] = useState<string>(
    selectedItem?.attributes?.installed ?? '',
  );
  const versions = selectedItem?.attributes?.versions ?? [];
  const hasInstalledVersion = isOneVersionInstalled(selectedItem);

  const taskCount = selectedItem?.data?.spec?.tasks?.length ?? 0;
  const workspaceCount = selectedItem?.data?.spec?.workspaces?.length ?? 0;

  return (
    <div className="opp-quick-search-details">
      <Level hasGutter>
        <LevelItem>
          <Title data-test="pipeline-name" headingLevel="h4">
            {selectedItem.name}
          </Title>
        </LevelItem>
        <LevelItem>
          <Label data-test="pipeline-provider">{selectedItem.provider}</Label>
        </LevelItem>
      </Level>
      <Level hasGutter>
        <LevelItem>
          <Split hasGutter>
            <SplitItem>
              <Button
                data-test="pipeline-cta"
                variant={ButtonVariant.primary}
                className="opp-quick-search-details__form-button"
                onClick={(e) => {
                  handleCta(e, selectedItem, closeModal, navigate, {
                    selectedVersion,
                    selectedItem,
                    isDevConsoleProxyAvailable: false,
                    namespace,
                    callback,
                    setFailedTasks,
                  });
                }}
              >
                {getCtaButtonText(selectedItem, selectedVersion)}
              </Button>
            </SplitItem>
            {versions.length > 0 && (
              <SplitItem data-test="pipeline-version-dropdown">
                <PipelineQuickSearchVersionDropdown
                  key={selectedItem.uid}
                  versions={versions}
                  item={selectedItem}
                  selectedVersion={selectedVersion}
                  onChange={setSelectedVersion}
                />
              </SplitItem>
            )}
          </Split>
        </LevelItem>
        {hasInstalledVersion && (
          <LevelItem>
            <Label
              color="green"
              icon={<CheckCircleIcon />}
              data-test="pipeline-installed-badge"
            >
              {t('Installed')}
            </Label>
          </LevelItem>
        )}
      </Level>
      <Content
        className="opp-quick-search-details__description"
        data-test="pipeline-description"
      >
        {selectedItem.description}
      </Content>
      <Stack className="opp-quick-search-details__badges-section" hasGutter>
        <StackItem>
          <Split hasGutter>
            <SplitItem>
              <Label color="blue">{t('{{count}} tasks', { count: taskCount })}</Label>
            </SplitItem>
            <SplitItem>
              <Label color="blue">{t('{{count}} workspaces', { count: workspaceCount })}</Label>
            </SplitItem>
          </Split>
        </StackItem>
        {selectedItem?.attributes?.categories?.length > 0 && (
          <StackItem>
            <LabelGroup
              categoryName={t('Categories')}
              data-test="pipeline-category-list"
            >
              {selectedItem.attributes.categories.map((category) => (
                <Label color="blue" key={category}>
                  {category}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
        {selectedItem?.tags?.length > 0 && (
          <StackItem>
            <LabelGroup categoryName={t('Tags')} data-test="pipeline-tag-list">
              {selectedItem.tags.map((tag) => (
                <Label color="blue" key={tag}>
                  {tag}
                </Label>
              ))}
            </LabelGroup>
          </StackItem>
        )}
      </Stack>
    </div>
  );
};

export default PipelineQuickSearchPipelineDetails;
```

- [ ] **Step 2: Create `PipelineQuickSearchPipelines.tsx`**

This component mirrors `PipelineQuickSearch.tsx` but uses `pipelines-pipeline-catalog`:

```tsx
import type { FC } from 'react';
import { useRef, useState, memo } from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { useTranslation } from 'react-i18next';
import {
  PipelineBuilderTaskGroup,
  TaskSearchCallback,
  UpdateTasksCallback,
} from '../pipeline-builder/types';
import {
  isOneVersionInstalled,
  isTaskSearchable,
  TaskProviders,
  findInstalledTask,
} from './pipeline-quicksearch-utils';
import { safeName } from '../pipeline-builder/utils';
import PipelineQuickSearchPipelineDetails from './PipelineQuickSearchPipelineDetails';
import { CatalogServiceProvider } from '../catalog/service';
import { CatalogService } from '../catalog/types';
import { QuickSearchProviders } from './quick-search-types';
import { QuickSearchController } from '../quick-search';

interface PipelineQuickSearchPipelinesProps {
  namespace: string;
  viewContainer?: HTMLElement;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  callback: TaskSearchCallback;
  onUpdateTasks: UpdateTasksCallback;
  taskGroup: PipelineBuilderTaskGroup;
}

const PipelineContents: FC<
  { catalogService: CatalogService } & PipelineQuickSearchPipelinesProps
> = ({
  catalogService,
  namespace,
  viewContainer,
  isOpen,
  setIsOpen,
  callback,
  onUpdateTasks,
  taskGroup,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const savedCallback = useRef(null);
  savedCallback.current = callback;

  const catalogServiceItems = catalogService.items.reduce((acc, item) => {
    item.cta.callback = () => {
      return new Promise((resolve) => {
        resolve(savedCallback.current(item.data));
      });
    };

    if (isTaskSearchable(catalogService.items, item)) {
      acc.push(item);
    }
    return acc;
  }, []);

  const quickSearchProviders: QuickSearchProviders = [
    {
      catalogType: 'pipelinesPipelineCatalog',
      items: catalogServiceItems,
      loaded: catalogService.loaded,
      getCatalogURL: (searchTerm: string, ns: string) =>
        `/search/ns/${ns}?keyword=${searchTerm}`,
      catalogLinkLabel: t('View all pipelines ({{itemCount, number}})'),
      extensions: catalogService.catalogExtensions,
    },
  ];

  return (
    <QuickSearchController
      quickSearchProviders={quickSearchProviders}
      allItemsLoaded={catalogService.loaded}
      searchPlaceholder={`${t('Add')}...`}
      namespace={namespace}
      viewContainer={viewContainer}
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      disableKeyboardOpen
      icon={<PlusCircleIcon width="1.5em" height="1.5em" />}
      callback={savedCallback.current}
      detailsRenderer={(props) => (
        <PipelineQuickSearchPipelineDetails {...props} />
      )}
    />
  );
};

const PipelineQuickSearchPipelines: FC<PipelineQuickSearchPipelinesProps> = (props) => {
  const { namespace } = props;
  return (
    <CatalogServiceProvider
      namespace={namespace}
      catalogId="pipelines-pipeline-catalog"
    >
      {(catalogService: CatalogService) => (
        <PipelineContents {...props} catalogService={catalogService} />
      )}
    </CatalogServiceProvider>
  );
};

export default memo(PipelineQuickSearchPipelines);
```

- [ ] **Step 3: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/task-quicksearch/PipelineQuickSearchPipelineDetails.tsx src/components/task-quicksearch/PipelineQuickSearchPipelines.tsx
git commit -m "feat: add pipeline quick search components for pipeline catalog"
```

---

### Task 8: Type Selector Modal (Add Resource Type)

**Files:**
- Create: `src/components/pipeline-builder/modals/AddResourceTypeModal.tsx`
- Modify: `src/components/pipeline-builder/PipelineBuilderForm.tsx`

- [ ] **Step 1: Create the `AddResourceTypeModal` component**

```tsx
import type { FC } from 'react';
import {
  Modal,
  ModalVariant,
  ModalBody,
  ModalHeader,
  Card,
  CardBody,
  Gallery,
  Title,
} from '@patternfly/react-core';
import { ResourceIcon } from '@openshift-console/dynamic-plugin-sdk';
import { useTranslation } from 'react-i18next';
import { getReferenceForModel } from '../../pipelines-overview/utils';
import { TaskModel, PipelineModel } from '../../../models';

export type ResourceType = 'task' | 'pipeline';

type AddResourceTypeModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ResourceType) => void;
};

const AddResourceTypeModal: FC<AddResourceTypeModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');

  return (
    <Modal
      variant={ModalVariant.small}
      isOpen={isOpen}
      onClose={onClose}
      aria-label={t('Select')}
    >
      <ModalHeader title={t('Select')} />
      <ModalBody>
        <Gallery hasGutter>
          <Card
            isSelectable
            isCompact
            data-test="add-resource-type-task"
            onClick={() => {
              onSelect('task');
              onClose();
            }}
          >
            <CardBody>
              <ResourceIcon kind={getReferenceForModel(TaskModel)} />
              {' '}
              <Title headingLevel="h4" size="md">
                {t('Task')}
              </Title>
            </CardBody>
          </Card>
          <Card
            isSelectable
            isCompact
            data-test="add-resource-type-pipeline"
            onClick={() => {
              onSelect('pipeline');
              onClose();
            }}
          >
            <CardBody>
              <ResourceIcon kind={getReferenceForModel(PipelineModel)} />
              {' '}
              <Title headingLevel="h4" size="md">
                {t('Pipeline')}
              </Title>
            </CardBody>
          </Card>
        </Gallery>
      </ModalBody>
    </Modal>
  );
};

export default AddResourceTypeModal;
```

- [ ] **Step 2: Integrate into `PipelineBuilderForm.tsx`**

Add imports:

```typescript
import AddResourceTypeModal, {
  ResourceType,
} from './modals/AddResourceTypeModal';
import PipelineQuickSearchPipelines from '../task-quicksearch/PipelineQuickSearchPipelines';
```

Add state:

```typescript
const [resourceType, setResourceType] = useState<ResourceType>('task');
const [typeModalOpen, setTypeModalOpen] = useState<boolean>(false);
```

Modify `onTaskSearch` to open the type selector modal instead of directly opening quick search:

```typescript
const onTaskSearch: TaskSearchCallback = (callback: () => void): void => {
  resetSelectedTask();
  savedCallback.current = callback;
  setTypeModalOpen(true);
};
```

Add the modal and conditional quick search rendering. In the JSX, alongside the existing `PipelineQuickSearch`, add:

```tsx
<AddResourceTypeModal
  isOpen={typeModalOpen}
  onClose={() => setTypeModalOpen(false)}
  onSelect={(type) => {
    setResourceType(type);
    setMenuOpen(true);
  }}
/>
{resourceType === 'task' ? (
  <PipelineQuickSearch
    namespace={namespace}
    viewContainer={contentRef.current}
    isOpen={menuOpen}
    callback={savedCallback.current}
    setIsOpen={(open) => setMenuOpen(open)}
    onUpdateTasks={onUpdateTasks}
    taskGroup={taskGroup}
  />
) : (
  <PipelineQuickSearchPipelines
    namespace={namespace}
    viewContainer={contentRef.current}
    isOpen={menuOpen}
    callback={savedCallback.current}
    setIsOpen={(open) => setMenuOpen(open)}
    onUpdateTasks={onUpdateTasks}
    taskGroup={taskGroup}
  />
)}
```

- [ ] **Step 3: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/pipeline-builder/modals/AddResourceTypeModal.tsx src/components/pipeline-builder/PipelineBuilderForm.tsx
git commit -m "feat: add type selector modal for choosing Task vs Pipeline in builder"
```

---

### Task 9: Pipeline Sidebar

**Files:**
- Create: `src/components/pipeline-builder/sidebars/PipelineSidebar.tsx`
- Modify: `src/components/pipeline-builder/PipelineBuilderForm.tsx`

- [ ] **Step 1: Create `PipelineSidebar.tsx`**

```tsx
import type { FC } from 'react';
import {
  Button,
  ButtonVariant,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import {
  PipelineKind,
  PipelineTask,
  PipelineTaskParam,
  TektonParam,
  TektonWorkspace,
  SelectedBuilderTask,
} from '../../../types';
import TaskSidebarHeader from '../task-sidebar/TaskSidebarHeader';
import TaskSidebarName from '../task-sidebar/TaskSidebarName';
import TaskSidebarParam from '../task-sidebar/TaskSidebarParam';
import TaskSidebarWorkspace from '../task-sidebar/TaskSidebarWorkspace';
import TaskSidebarWhenExpression from '../task-sidebar/TaskSidebarWhenExpression';
import { TaskType, UpdateOperationRenameTaskData } from '../types';
import { CloseButton } from '@patternfly/react-component-groups';

import '../task-sidebar/TaskSidebar.scss';

function safeIndex<T>(list: T[], comparatorFunc: (v: T) => boolean): number {
  const idx = list.findIndex(comparatorFunc);
  return idx === -1 ? list.length : idx;
}

type PipelineSidebarProps = {
  pipeline: PipelineKind;
  onRemoveTask: (taskName: string) => void;
  onRenameTask: (data: UpdateOperationRenameTaskData) => void;
  workspaceList: TektonWorkspace[];
  selectedData: SelectedBuilderTask;
  onClose: () => void;
};

const PipelineSidebar: FC<PipelineSidebarProps> = ({
  pipeline,
  onRemoveTask,
  onRenameTask,
  workspaceList,
  selectedData,
  onClose,
}) => {
  const { t } = useTranslation('plugin__pipelines-console-plugin');
  const navigate = useNavigate();
  const { isFinallyTask, taskIndex } = selectedData;
  const taskType: TaskType = isFinallyTask ? 'finallyTasks' : 'tasks';
  const formikTaskReference = `formData.${taskType}.${taskIndex}`;
  const [{ value: thisTask }] = useField<PipelineTask>(formikTaskReference);

  const params: TektonParam[] = pipeline?.spec?.params || [];
  const pipelineWorkspaces: TektonWorkspace[] = pipeline?.spec?.workspaces || [];
  const pipelineName = pipeline?.metadata?.name || '';
  const pipelineNamespace = pipeline?.metadata?.namespace || '';

  return (
    <Stack className="opp-task-sidebar">
      <StackItem className="co-sidebar-dismiss clearfix">
        <CloseButton onClick={onClose} dataTestID="sidebar-close-button" />
      </StackItem>
      <StackItem className="opp-task-sidebar__header">
        <Title headingLevel="h2" size="lg">
          {pipelineName}
        </Title>
        <Button
          variant={ButtonVariant.link}
          data-test="remove-pipeline-ref"
          onClick={() => onRemoveTask(thisTask.name)}
        >
          {t('Remove')}
        </Button>
      </StackItem>
      <StackItem className="opp-task-sidebar__content pf-v6-c-form">
        <TaskSidebarName
          name={`${formikTaskReference}.name`}
          taskName={pipelineName}
          onChange={(newName) =>
            onRenameTask({ preChangePipelineTask: thisTask, newName })
          }
        />

        {params.length > 0 && (
          <div>
            <Title headingLevel="h2">{t('Parameters')}</Title>
            {params.map((param) => {
              const taskParams: PipelineTaskParam[] = thisTask.params || [];
              const paramIdx = safeIndex(
                taskParams,
                (thisParam) => thisParam.name === param.name,
              );
              return (
                <div key={param.name} className="opp-task-sidebar__param">
                  <TaskSidebarParam
                    hasParam={!!taskParams[paramIdx]}
                    name={`${formikTaskReference}.params.${paramIdx}`}
                    resourceParam={param}
                    selectedData={selectedData}
                  />
                </div>
              );
            })}
          </div>
        )}

        {pipelineWorkspaces.length > 0 && (
          <div>
            <h2>{t('Workspaces')}</h2>
            {pipelineWorkspaces.map((workspace) => {
              const taskWorkspaces: TektonWorkspace[] = thisTask.workspaces || [];
              const workspaceIdx = safeIndex(
                taskWorkspaces,
                (w) => w.name === workspace.name,
              );
              return (
                <div key={workspace.name} className="opp-task-sidebar__workspace">
                  <TaskSidebarWorkspace
                    availableWorkspaces={workspaceList}
                    hasWorkspace={!!taskWorkspaces[workspaceIdx]}
                    name={`${formikTaskReference}.workspaces.${workspaceIdx}`}
                    resourceWorkspace={workspace}
                  />
                </div>
              );
            })}
          </div>
        )}

        <div className="opp-task-sidebar__when-expressions">
          <TaskSidebarWhenExpression
            hasParam={false}
            name={`${formikTaskReference}.when`}
            selectedData={selectedData}
          />
        </div>

        <div>
          <Button
            variant={ButtonVariant.secondary}
            data-test="view-pipeline-details"
            onClick={() =>
              navigate(
                `/k8s/ns/${pipelineNamespace}/tekton.dev~v1~Pipeline/${pipelineName}`,
              )
            }
          >
            {t('View pipeline details')}
          </Button>
        </div>
      </StackItem>
    </Stack>
  );
};

export default PipelineSidebar;
```

- [ ] **Step 2: Integrate `PipelineSidebar` into `PipelineBuilderForm.tsx`**

Import:
```typescript
import PipelineSidebar from './sidebars/PipelineSidebar';
import { findPipeline, isPipelineRef } from './utils';
```

Modify `onTaskSelection` to detect pipeline refs:

```typescript
const onTaskSelection = (
  task: PipelineTask,
  resource: TaskKind,
  isFinallyTask: boolean,
) => {
  const builderNodes = isFinallyTask ? formData.finallyTasks : formData.tasks;
  setSelectedTask({
    isFinallyTask,
    taskIndex: builderNodes.findIndex(({ name }) => name === task.name),
    resource,
    isPipelineRef: isPipelineRef(task),
  });
};
```

In the `DrawerPanelContent`, conditionally render based on `isPipelineRef`:

```tsx
<DrawerPanelContent>
  {selectedTask?.isPipelineRef ? (
    <PipelineSidebar
      key={selectedTask?.taskIndex + String(selectedTask?.isFinallyTask)}
      pipeline={findPipeline(
        taskResources,
        formData[nodeType][selectedTask?.taskIndex],
      )}
      onClose={() => setSelectedTask(null)}
      workspaceList={formData.workspaces || []}
      onRenameTask={(data: UpdateOperationRenameTaskData) => {
        updateTasks(
          applyChange(
            taskGroup,
            { type: UpdateOperationType.RENAME_TASK, data },
            namespace,
          ),
        );
      }}
      onRemoveTask={(taskName: string) => {
        launchOverlay(RemoveTaskModal, {
          taskName,
          onRemove: () => handleRemoveTask(taskName),
        });
      }}
      selectedData={selectedTask}
    />
  ) : (
    <TaskSidebar
      key={
        selectedTask?.resource?.metadata?.name +
        selectedTask?.taskIndex +
        String(selectedTask?.isFinallyTask)
      }
      onClose={() => setSelectedTask(null)}
      resourceList={formData.resources || []}
      workspaceList={formData.workspaces || []}
      errorMap={status?.tasks || {}}
      onRenameTask={(data: UpdateOperationRenameTaskData) => {
        updateTasks(
          applyChange(
            taskGroup,
            { type: UpdateOperationType.RENAME_TASK, data },
            namespace,
          ),
        );
      }}
      onRemoveTask={(taskName: string) => {
        launchOverlay(RemoveTaskModal, {
          taskName,
          onRemove: () => handleRemoveTask(taskName),
        });
      }}
      selectedData={selectedTask}
    />
  )}
</DrawerPanelContent>
```

- [ ] **Step 3: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 4: Commit**

```bash
git add src/components/pipeline-builder/sidebars/PipelineSidebar.tsx src/components/pipeline-builder/PipelineBuilderForm.tsx
git commit -m "feat: add PipelineSidebar for pipeline ref task editing"
```

---

### Task 10: Validation — Mutual Exclusivity and Circular Detection

**Files:**
- Modify: `src/components/pipeline-builder/validation-utils.ts`
- Modify: `src/components/pipeline-builder/utils.ts`
- Test: `src/components/pipeline-builder/__tests__/validation-utils.spec.ts`

- [ ] **Step 1: Write test for circular reference detection**

Add to `src/components/pipeline-builder/__tests__/validation-utils.spec.ts`:

```typescript
import { detectCircularPipelineRef } from '../utils';
import { PipelineKind } from '../../../types';

describe('detectCircularPipelineRef', () => {
  it('should return false when no cycle exists', () => {
    const pipelines: PipelineKind[] = [
      {
        metadata: { name: 'a' },
        apiVersion: 'tekton.dev/v1',
        kind: 'Pipeline',
        spec: { tasks: [{ name: 't1', taskRef: { name: 'some-task' } }] },
      },
    ];
    expect(detectCircularPipelineRef('a', pipelines)).toBe(false);
  });

  it('should return true for direct self-reference', () => {
    const pipelines: PipelineKind[] = [
      {
        metadata: { name: 'a' },
        apiVersion: 'tekton.dev/v1',
        kind: 'Pipeline',
        spec: {
          tasks: [{ name: 't1', pipelineRef: { name: 'a' } }],
        },
      },
    ];
    expect(detectCircularPipelineRef('a', pipelines)).toBe(true);
  });

  it('should return true for transitive cycle', () => {
    const pipelines: PipelineKind[] = [
      {
        metadata: { name: 'a' },
        apiVersion: 'tekton.dev/v1',
        kind: 'Pipeline',
        spec: { tasks: [{ name: 't1', pipelineRef: { name: 'b' } }] },
      },
      {
        metadata: { name: 'b' },
        apiVersion: 'tekton.dev/v1',
        kind: 'Pipeline',
        spec: { tasks: [{ name: 't1', pipelineRef: { name: 'a' } }] },
      },
    ];
    expect(detectCircularPipelineRef('a', pipelines)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/pipeline-builder/__tests__/validation-utils.spec.ts --testNamePattern="detectCircularPipelineRef" --no-coverage`
Expected: FAIL

- [ ] **Step 3: Implement `detectCircularPipelineRef` in `utils.ts`**

```typescript
export const detectCircularPipelineRef = (
  pipelineName: string,
  allPipelines: PipelineKind[],
): boolean => {
  const visited = new Set<string>();
  const stack = [pipelineName];

  while (stack.length > 0) {
    const current = stack.pop();
    if (visited.has(current)) return true;
    visited.add(current);

    const pipeline = allPipelines.find((p) => p.metadata?.name === current);
    if (!pipeline) continue;

    const allTasks = [
      ...(pipeline.spec?.tasks || []),
      ...(pipeline.spec?.finally || []),
    ];

    for (const task of allTasks) {
      if (task.pipelineRef?.name) {
        if (task.pipelineRef.name === pipelineName) return true;
        stack.push(task.pipelineRef.name);
      }
    }
  }

  return false;
};
```

- [ ] **Step 4: Update validation schema for mutual exclusivity**

In `src/components/pipeline-builder/validation-utils.ts`, update the test at line 306-310:

```typescript
.test(
  'taskRef-or-taskSpec-or-pipelineRef',
  t('Exactly one of TaskSpec, TaskRef, or PipelineRef must be provided.'),
  function (task) {
    const refs = [!!task.taskRef, !!task.taskSpec, !!task.pipelineRef, !!task.pipelineSpec];
    return refs.filter(Boolean).length === 1;
  },
),
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest src/components/pipeline-builder/__tests__/validation-utils.spec.ts --testNamePattern="detectCircularPipelineRef" --no-coverage`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add src/components/pipeline-builder/utils.ts src/components/pipeline-builder/validation-utils.ts src/components/pipeline-builder/__tests__/validation-utils.spec.ts
git commit -m "feat: add circular pipeline reference detection and mutual exclusivity validation"
```

---

### Task 11: Serialization — Form to YAML and YAML to Form

**Files:**
- Modify: `src/components/pipeline-builder/utils.ts`
- Modify: `src/components/pipeline-builder/form-switcher-validation.ts`

- [ ] **Step 1: Update `convertBuilderFormToPipeline` to preserve `pipelineRef`**

The current implementation in `convertBuilderFormToPipeline` already passes through unknown task properties via the spread in the tasks array. However, we need to ensure `pipelineRef` tasks don't get their fields stripped. The `removeEmptyFormFields` function currently only handles `params`, `resources`, and `workspaces` — it will pass `pipelineRef` through unchanged, so no change is needed there.

Verify: In `convertBuilderFormToPipeline`, tasks are mapped with `removeEmptyFormFields(removeListRunAfters(task, listIds))`. The `removeEmptyFormFields` function only modifies `params`, `resources`, and `workspaces` — `pipelineRef` is preserved.

- [ ] **Step 2: Update `convertPipelineToBuilderForm` to handle `pipelineRef`**

No changes needed — the current implementation does `tasks = [],` which preserves all fields on each task including `pipelineRef`.

- [ ] **Step 3: Update `findTask` to handle `pipelineRef` tasks**

Currently `findTask` returns `null` if neither `taskRef` nor `taskSpec` is present. For pipeline ref tasks, it should also return null (since we use `findPipeline` separately), which is already the behavior. No change needed.

- [ ] **Step 4: Run full test suite to verify nothing is broken**

Run: `npx jest src/components/pipeline-builder/__tests__/ --no-coverage`
Expected: All tests pass

- [ ] **Step 5: Commit (only if changes were made)**

If any code changes were needed:
```bash
git add src/components/pipeline-builder/utils.ts src/components/pipeline-builder/form-switcher-validation.ts
git commit -m "feat: ensure pipelineRef passes through form/YAML serialization"
```

---

### Task 12: Integration Wiring — Pipeline Ref in Node Builder

**Files:**
- Modify: `src/components/pipeline-builder/hooks.ts`

- [ ] **Step 1: Handle pipeline ref tasks in `useNodes`**

In the `useNodes` hook, after the task validation split, add pipeline ref detection:

```typescript
import { findPipeline, isPipelineRef } from './utils';

// Inside useNodes, after validTaskList/invalidTaskList definitions:
const pipelineRefTasks = taskGroup.tasks.filter(
  (task) => isPipelineRef(task) && !!findPipeline(taskResources, task),
);
const regularValidTaskList = validTaskList.filter(
  (task) => !isPipelineRef(task),
);
```

For pipeline ref tasks, create builder nodes that use the `onTaskSelection` callback to trigger the `PipelineSidebar` (via the `isPipelineRef` flag on `SelectedBuilderTask`). The pipeline ref tasks use the same `tasksToBuilderNodes` but with a custom selection callback:

```typescript
const pipelineRefNodes: PipelineBuilderTaskNodeModel[] =
  pipelineRefTasks.length > 0
    ? tasksToBuilderNodes(
        pipelineRefTasks,
        onNewListNode,
        (task) => onTaskSelection(task, null, false),
        getTopLevelErrorMessage(tasksInError.tasks),
        taskGroup.highlightedIds,
      )
    : [];
```

Include them in the final nodes array:

```typescript
const nodes: PipelineMixedNodeModel[] = handleParallelToParallelNodes([
  ...taskNodes,
  ...pipelineRefNodes,
  ...taskListNodes,
  ...invalidTaskListNodes,
  ...loadingNodes,
]);
```

Use `regularValidTaskList` instead of `validTaskList` for the task nodes:

```typescript
const taskNodes: PipelineBuilderTaskNodeModel[] =
  regularValidTaskList.length > 0
    ? tasksToBuilderNodes(
        regularValidTaskList,
        onNewListNode,
        (task) => onTaskSelection(task, findTask(taskResources, task), false),
        getTopLevelErrorMessage(tasksInError.tasks),
        taskGroup.highlightedIds,
      )
    : [];
```

- [ ] **Step 2: Run build to verify**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/pipeline-builder/hooks.ts
git commit -m "feat: wire pipeline ref tasks into builder visualization nodes"
```

---

### Task 13: Existing Test Updates

**Files:**
- Modify: `src/components/pipeline-builder/__tests__/utils.spec.ts`
- Modify: `src/components/pipeline-builder/__tests__/validation-utils.spec.ts`

- [ ] **Step 1: Update `createFormValues` helper in test files**

The `PipelineBuilderTaskResources` type now requires pipeline fields. Update `createFormValues` in `utils.spec.ts`:

```typescript
const createFormValues = (
  clusterResolverTasks = [],
  namespacedTasks = [],
): PipelineBuilderFormikValues => {
  return {
    editorType: EditorType.Form,
    yamlData: '',
    formData: initialPipelineFormData,
    taskResources: {
      clusterResolverTasks,
      namespacedTasks,
      tasksLoaded:
        clusterResolverTasks.length > 0 || namespacedTasks.length > 0,
      namespacedPipelines: [],
      clusterResolverPipelines: [],
      pipelinesLoaded: false,
    },
  };
};
```

- [ ] **Step 2: Add `getNestedPipelineCount` test**

Add to `utils.spec.ts`:

```typescript
import { getNestedPipelineCount } from '../../pipelines-list/PipelineRow';

describe('getNestedPipelineCount', () => {
  it('should return 0 when no pipelineRef tasks', () => {
    const pipeline = {
      spec: { tasks: [{ name: 't1', taskRef: { name: 'task1' } }] },
    };
    expect(getNestedPipelineCount(pipeline as any)).toBe(0);
  });

  it('should count pipelineRef tasks in both tasks and finally', () => {
    const pipeline = {
      spec: {
        tasks: [
          { name: 't1', pipelineRef: { name: 'p1' } },
          { name: 't2', taskRef: { name: 'task1' } },
        ],
        finally: [{ name: 'f1', pipelineRef: { name: 'p2' } }],
      },
    };
    expect(getNestedPipelineCount(pipeline as any)).toBe(2);
  });
});
```

Note: Export `getNestedPipelineCount` from `PipelineRow.tsx` if it isn't already.

- [ ] **Step 3: Run all pipeline-builder tests**

Run: `npx jest src/components/pipeline-builder/__tests__/ --no-coverage`
Expected: All pass

- [ ] **Step 4: Commit**

```bash
git add src/components/pipeline-builder/__tests__/ src/components/pipelines-list/PipelineRow.tsx
git commit -m "test: update existing tests for pipeline ref support"
```

---

## Post-Implementation Verification

After all tasks are complete:

1. `npx tsc --noEmit` — full type check passes
2. `npx jest --no-coverage` — all tests pass
3. `yarn dev` — dev server starts without errors
4. Manual verification in browser:
   - Pipeline list page shows "Nested pipelines" column
   - Builder form shows "Pipelines and tasks" card title
   - Clicking "Add" shows type selector modal
   - Selecting "Task" opens task catalog
   - Selecting "Pipeline" opens pipeline catalog
   - Selecting a pipeline ref task opens `PipelineSidebar`
   - "View pipeline details" navigates correctly
