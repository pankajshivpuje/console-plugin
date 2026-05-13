# Pipelines in Pipelines — Console Plugin Design Spec

**Date:** 2026-05-13
**TEP Reference:** [TEP-0056](https://github.com/tektoncd/community/blob/main/teps/0056-pipelines-in-pipelines.md)
**Approach:** Full Parallel Catalog (pipeline catalog alongside task catalog)

## Overview

Enable users to reference pipelines from within pipelines (TEP-0056) in the OpenShift console plugin. This involves changes to the pipeline list page, the pipeline builder, the catalog system, and the topology visualization.

A `PipelineTask` can now reference either a Task (`taskRef`/`taskSpec`) or a Pipeline (`pipelineRef`/`pipelineSpec`). The console must support creating, visualizing, and editing these nested references.

---

## 1. Type System & Data Model

### PipelineTask Extension

`src/types/pipeline.ts`:

```typescript
export type PipelineTaskPipelineRef = {
  name?: string;
  resolver?: string;
  params?: PipelineTaskParam[];
};

export type PipelineTask = {
  name: string;
  params?: PipelineTaskParam[];
  resources?: TektonResourceGroup<PipelineTaskResource>;
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
  taskSpec?: TektonTaskSpec;
  pipelineRef?: PipelineTaskPipelineRef;  // NEW
  pipelineSpec?: PipelineSpec;             // NEW
  when?: WhenExpression[];
  workspaces?: PipelineTaskWorkspace[];
};
```

A `PipelineTask` has either `taskRef`/`taskSpec` OR `pipelineRef`/`pipelineSpec`, never both.

### Builder Task Resources Extension

`src/components/pipeline-builder/types.ts`:

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

### Helper

```typescript
export const isPipelineRef = (task: PipelineTask): boolean =>
  !!task.pipelineRef || !!task.pipelineSpec;
```

### SelectedBuilderTask Extension

```typescript
export type SelectedBuilderTask = {
  resource: TaskKind | PipelineKind;
  taskIndex: number;
  isFinallyTask: boolean;
  isPipelineRef?: boolean;
};
```

---

## 2. Pipeline List Page — Nested Pipelines Column

### Column Definition

New column in `usePipelinesColumns.ts` between Name/Namespace and Last run:

- **ID:** `nested-pipelines`
- **Title:** "Nested pipelines"
- **Visibility:** Hidden on small screens (`pf-v6-m-hidden pf-m-visible-on-lg`)
- **Sort:** Custom sort by count of `pipelineRef` tasks

New entry in `tableColumnInfo`:
```typescript
{ id: 'nested-pipelines', classNames: 'pf-v6-m-hidden pf-m-visible-on-lg' }
```

### Row Cell

In `PipelineRow.tsx`:

```typescript
const getNestedPipelineCount = (pipeline: PipelineKind): number => {
  const tasks = pipeline.spec?.tasks || [];
  const finallyTasks = pipeline.spec?.finally || [];
  return [...tasks, ...finallyTasks].filter(t => t.pipelineRef).length;
};
```

- Count > 0: render as link navigating to pipeline list filtered by `?nestedIn=<pipelineName>` showing only the referenced pipelines
- Count === 0: render DASH

### List Page Filter

`PipelinesList.tsx` reads the `nestedIn` query parameter and filters the pipeline list to show only pipelines whose names match the `pipelineRef.name` values in the parent pipeline's tasks.

---

## 3. Pipeline Builder — "Add" Flow

### 3a. FormGroup Label → Card

`PipelineBuilderFormEditor.tsx`:

Replace `<FormGroup label="Tasks">` with a PatternFly `Card`:
```tsx
<Card isCompact isPlain>
  <CardHeader>
    <CardTitle>{t('Pipelines and tasks')}</CardTitle>
  </CardHeader>
  <CardBody>
    <PipelineBuilderVisualization ... />
  </CardBody>
</Card>
```

### 3b. "Add task" → "Add"

- `TaskList.tsx`: default text changes from `t('Add task')` to `t('Add')`
- `PipelineQuickSearch.tsx`: `searchPlaceholder` changes from `"Add task..."` to `"Add..."`

### 3c. Type Selector Modal

New component: `src/components/pipeline-builder/modals/AddResourceTypeModal.tsx`

- PatternFly `Modal` with `ModalVariant.small`
- Title: "Select"
- Two selectable cards: **Task** (T icon) and **Pipeline** (P icon)
- On selection: closes modal, opens the corresponding QuickSearchModal (task catalog or pipeline catalog)
- Uses `useOverlay` pattern from `@openshift-console/dynamic-plugin-sdk`

Flow in `PipelineBuilderForm.tsx`:
1. User clicks "Add" → `onTaskSearch` fires
2. `launchOverlay(AddResourceTypeModal, { onSelect })` opens type selector
3. User picks Task or Pipeline
4. `setResourceType(type)` + `setMenuOpen(true)` opens the correct quick search
5. Conditionally renders `PipelineQuickSearch` (tasks) or `PipelineQuickSearchPipelines` (pipelines) based on `resourceType` state

---

## 4. Pipeline Catalog

### 4a. Catalog Providers

Three new providers mirroring the task catalog pattern:

**`src/components/catalog/providers/usePipelinesProvider.tsx`**
- Sources: `taskResources.namespacedPipelines` + `taskResources.clusterResolverPipelines`
- Normalizes `PipelineKind[]` → `CatalogItem<PipelineKind>[]`
- Provider: `TaskProviders.redhat` for installed pipelines
- Icon: Pipeline `ResourceIcon` ("P")
- CTA: `t('Add')`

**`src/components/catalog/providers/useTektonHubPipelinesProvider.tsx`**
- Queries Tekton Hub API for `kind: Pipeline`
- Same version handling as task Hub provider
- CTA: `t('Install and add')` for uninstalled

**`src/components/catalog/providers/useArtifactHubPipelinesProvider.tsx`**
- Searches Artifact Hub for pipelines
- Same dev-console-proxy pattern

Registered under catalog ID `pipelines-pipeline-catalog` in `console-extensions.json` as `console.catalog/item-provider` entries — three new entries mirroring the existing `pipelines-task-catalog` entries for Red Hat, TektonHub, and ArtifactHub providers. Each entry references its provider via `$codeRef` and requires the `OPENSHIFT_PIPELINE` and `HIDE_STATIC_PIPELINE_PLUGIN_PIPELINE_BUILDER` feature flags (same as task providers).

### 4b. Pipeline Quick Search

**`src/components/task-quicksearch/PipelineQuickSearchPipelines.tsx`**
- Wraps `CatalogServiceProvider` with `catalogId="pipelines-pipeline-catalog"`
- Pipeline-specific CTA callbacks (install via `k8sCreate`, then resolve)
- Custom details renderer: `PipelineQuickSearchPipelineDetails`

**`src/components/task-quicksearch/PipelineQuickSearchPipelineDetails.tsx`**
- Pipeline name, provider badge
- Version dropdown
- CTA button: "Add" / "Install and add"
- Shows task count and workspace count from pipeline spec
- Categories, tags, Hub link

### 4c. Data Fetching

`src/components/pipeline-builder/hooks.ts` — extend `useFormikFetchAndSaveTasks`:
- Fetch namespaced pipelines via `useK8sWatchResource(PipelineModel)`
- Fetch cluster resolver pipelines
- Set `taskResources.namespacedPipelines`, `clusterResolverPipelines`, `pipelinesLoaded`

---

## 5. Builder Visualization — Expandable Pipeline Nodes

### Node Type

`src/components/pipeline-topology/const.ts`:
```typescript
export const NODE_PIPELINE_REF_TYPE = 'pipeline-ref-node';
```

### Node Model

```typescript
export type PipelinePipelineRefNodeModel = PipelineRunAfterNodeModel & {
  type: typeof NODE_PIPELINE_REF_TYPE;
  data: {
    pipelineRef: PipelineTaskPipelineRef;
    pipeline?: PipelineKind;
    expanded?: boolean;
    task: PipelineTask;
  };
};
```

### Node Component

`src/components/pipeline-topology/PipelineRefNode.tsx`:

**Collapsed:** Double-bordered rectangle (dashed border), pipeline icon "P", pipeline name, task count summary, expand chevron.

**Expanded:** Shows nested pipeline's task DAG as read-only child nodes. Uses `PipelineTopologyGraph` in compact/read-only mode. Child nodes are not clickable/editable.

### Factory Registration

`builderComponentsFactory` in `factories.ts` maps `NODE_PIPELINE_REF_TYPE` → `PipelineRefNode`.

### Node Creation

`hooks.ts` `useNodes`: when iterating tasks, if `task.pipelineRef` exists → create `PipelinePipelineRefNodeModel` instead of task node. Resolve pipeline from `taskResources` by name.

### Update Operations

New operations in `const.ts`:
```typescript
CONVERT_LIST_TO_PIPELINE
ADD_LOADING_PIPELINE
CONVERT_LOADING_PIPELINE_TO_PIPELINE
```

`update-utils.ts` handles these by creating `PipelineTask` with `pipelineRef` instead of `taskRef`.

---

## 6. Side Drawer — Pipeline vs Task Selection

### Task Selection (unchanged)

Clicking a task node opens `TaskSidebar` — display name, parameters, workspaces, when-expressions. All editable.

### Pipeline Selection

Clicking a pipeline ref node opens `PipelineSidebar` (new component).

`src/components/pipeline-builder/sidebars/PipelineSidebar.tsx`:

**Editable fields:**
- Display name (`PipelineTask.name`) — rename with runAfter fixing
- Parameters (`PipelineTask.params`) — mapped to nested pipeline's `spec.params`
- Workspaces (`PipelineTask.workspaces`) — mapped to nested pipeline's `spec.workspaces`
- When expressions

**Non-editable / navigational:**
- "View pipeline details" button → navigates to `/k8s/ns/<namespace>/tekton.dev~v1~Pipeline/<name>`
- Nested pipeline internals not editable from parent builder

### Routing in PipelineBuilderForm

```typescript
const isPipelineRefTask = !!selectedPipelineTask?.pipelineRef;

// DrawerPanelContent renders:
{isPipelineRefTask ? <PipelineSidebar ... /> : <TaskSidebar ... />}
```

### Editing Constraints

- Parent pipeline: fully editable
- Nested pipeline ref parameters/workspaces: editable (args passed to nested pipeline)
- Nested pipeline internals: NOT editable from parent — navigate to nested pipeline's own builder

---

## 7. Validation, Serialization, Edge Cases

### Validation

- **Mutual exclusivity:** PipelineTask must have exactly one of taskRef, taskSpec, pipelineRef, pipelineSpec
- **Pipeline ref resolution:** Validate pipelineRef.name exists in namespace/cluster. Show "Pipeline not found" error if unresolved.
- **Parameter matching:** Validate params against nested pipeline's spec.params. Required params enforced.
- **Workspace matching:** Validate workspace bindings against nested pipeline's spec.workspaces.
- **Circular reference detection:** Walk pipelineRef chain, flag error if cycle found. Prevents infinite recursion.

### Serialization

`convertBuilderFormToPipeline()`: serialize pipeline ref tasks with `pipelineRef: { name }`, strip taskRef/taskSpec.

`convertPipelineToBuilderForm()`: parse pipelineRef tasks into builder state with isPipelineRef flag.

`sanitizeToForm()` / `sanitizeToYaml()`: pass pipelineRef through without transformation.

### pipelineSpec Scope

Form builder supports `pipelineRef` only. Inline `pipelineSpec` is only editable via YAML editor. Form editor shows read-only indicator for pipelineSpec tasks.

### Edge Cases

| Scenario | Behavior |
|---|---|
| Nested pipeline deleted from cluster | Node shows "invalid" state (red border). User can remove or re-resolve. |
| Circular pipeline reference | Validation error on node: "Circular pipeline reference detected". Prevents save. |
| `pipelineSpec` (inline) in YAML | Supported in YAML editor only. Form editor shows read-only indicator. |
| Nested pipeline has no params/workspaces | Sidebar shows empty state messages. |
| Pipeline from Hub not yet installed | "Install and add" CTA installs via k8sCreate. Loading node shown during install. |
| Finally block pipeline refs | Fully supported. Same visualization and sidebar behavior. |

---

## 8. Testing Strategy

### Unit Tests

- `isPipelineRef()` type guard
- `getNestedPipelineCount()` — counts across spec.tasks and spec.finally
- `detectCircularReference()` — direct and transitive cycles
- Mutual exclusivity validation
- Parameter/workspace matching validation
- `convertBuilderFormToPipeline()` — correct YAML with pipelineRef
- `convertPipelineToBuilderForm()` — parses pipelineRef tasks
- Round-trip form ↔ YAML preserves pipeline ref data
- New update operations: CONVERT_LIST_TO_PIPELINE, loading state transitions
- Pipeline ref task removal cleans up runAfter references

### Component Tests

- `AddResourceTypeModal` — renders options, fires onSelect, cancel closes
- Pipeline list column — renders count, link when > 0, DASH when 0, correct navigation
- `PipelineSidebar` — renders name/params/workspaces, "View details" link, remove, rename
- `PipelineRefNode` — pipeline icon, dashed border, expand/collapse, click selection

### Integration / E2E Tests

- Full create flow: Add → select Pipeline → catalog → select → pipeline ref node → sidebar → edit params → save → verify YAML
- List page: pipeline with nested pipelines → column count → click → filtered list
- Hub install: uninstalled pipeline → "Install and add" → loading → installed → ref added
- Edge case: delete nested pipeline → invalid node state in parent builder

### Existing Test Updates

- `FormGroup label="Tasks"` assertions → Card "Pipelines and tasks"
- `searchPlaceholder` "Add task" → "Add"
- `PipelineBuilderTaskResources` mocks → add pipeline fields
- `usePipelinesColumns` tests → verify new column

---

## File Impact Summary

### New Files

| File | Purpose |
|---|---|
| `pipeline-builder/modals/AddResourceTypeModal.tsx` | Type selector modal (Task vs Pipeline) |
| `pipeline-builder/sidebars/PipelineSidebar.tsx` | Side drawer for pipeline ref tasks |
| `pipeline-topology/PipelineRefNode.tsx` | Expandable pipeline node in visualization |
| `task-quicksearch/PipelineQuickSearchPipelines.tsx` | Pipeline catalog quick search wrapper |
| `task-quicksearch/PipelineQuickSearchPipelineDetails.tsx` | Pipeline details in quick search |
| `catalog/providers/usePipelinesProvider.tsx` | Installed pipeline catalog provider |
| `catalog/providers/useTektonHubPipelinesProvider.tsx` | Tekton Hub pipeline provider |
| `catalog/providers/useArtifactHubPipelinesProvider.tsx` | Artifact Hub pipeline provider |

### Modified Files

| File | Change |
|---|---|
| `types/pipeline.ts` | Add PipelineTaskPipelineRef, extend PipelineTask |
| `types/task.ts` | Extend SelectedBuilderTask |
| `pipeline-builder/types.ts` | Extend PipelineBuilderTaskResources |
| `pipeline-builder/const.ts` | New UpdateOperationType values |
| `pipeline-builder/PipelineBuilderForm.tsx` | Type selector flow, conditional sidebar |
| `pipeline-builder/PipelineBuilderFormEditor.tsx` | FormGroup → Card |
| `pipeline-builder/PipelineBuilderVisualization.tsx` | Handle pipeline ref nodes |
| `pipeline-builder/hooks.ts` | Fetch pipelines, create pipeline ref nodes |
| `pipeline-builder/update-utils.ts` | Handle pipeline update operations |
| `pipeline-builder/utils.ts` | Serialization for pipelineRef |
| `pipeline-builder/validation-utils.ts` | Pipeline ref validation, circular detection |
| `pipeline-builder/form-switcher-validation.ts` | pipelineRef in form ↔ YAML |
| `pipeline-topology/const.ts` | NODE_PIPELINE_REF_TYPE |
| `pipeline-topology/types.ts` | PipelinePipelineRefNodeModel |
| `pipeline-topology/factories.ts` | Register PipelineRefNode |
| `pipeline-topology/TaskList.tsx` | "Add task" → "Add" |
| `pipelines-list/usePipelinesColumns.ts` | New nested-pipelines column |
| `pipelines-list/PipelineRow.tsx` | New column cell |
| `pipelines-list/PipelinesList.tsx` | nestedIn query param filter |
| `task-quicksearch/PipelineQuickSearch.tsx` | searchPlaceholder text |
| `catalog/providers/index.ts` | Register new providers |
| `console-extensions.json` | Add pipeline catalog provider entries |
