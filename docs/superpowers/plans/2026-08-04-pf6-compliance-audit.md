# PatternFly 6 Compliance Audit - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring all custom SCSS and component code into full PatternFly 6 compliance so the plugin visually matches the PF6 design system used by the OpenShift console.

**Architecture:** The plugin already uses PF6 packages (`@patternfly/react-core ^6.4.0`, etc.) and most component APIs are correct (Dropdown/MenuToggle, composable Table, new Select). The gaps are: (1) SCSS files with hardcoded colors/spacing/fonts instead of PF6 design tokens, (2) a handful of deprecated component props, and (3) inline styles that should use PF6 layout components or utility classes.

**Tech Stack:** PatternFly 6 (`@patternfly/react-core`, `react-table`, `react-topology`, `react-tokens`), SCSS, TypeScript/React

## Global Constraints

- All color values must use PF6 design tokens (`--pf-t--global--color--*`, `--pf-t--color--white`, etc.) not hex/rgb literals
- All spacing must use PF6 spacer tokens (`--pf-t--global--spacer--xs` through `--pf-t--global--spacer--4xl`)
- All font sizes must use PF6 typography tokens (`--pf-t--global--font--size--xs` through `--pf-t--global--font--size--2xl`)
- Border radius must use PF6 tokens (`--pf-t--global--border--radius--small|medium|large`)
- No deprecated PF6 component enums (e.g. `TooltipPosition`, `PopoverPosition`) — use string literals
- No deprecated `isCompact` prop — use `size="compact"` on Card and DataList
- Inline flex layouts should use PF6 `<Flex>` / `<FlexItem>` components where practical
- ANSI terminal colors in log viewer are exempt (standardized spec values)
- Every change must compile cleanly with `npx webpack` (the dev server auto-recompiles)
- Test visually in browser at http://localhost:9000 after each task

---

### Task 1: Replace deprecated component props and enums (TSX)

**Files:**
- Modify: `src/components/topology/build-decorators/PipelineRunDecorator.tsx:3,121`
- Modify: `src/components/pipeline-topology/PlusNodeDecorator.tsx:3,13`
- Modify: `src/components/pipeline-topology/BuilderNode.tsx:2,75`
- Modify: `src/components/status/PipelineRunStatusContent.tsx:3,40`
- Modify: `src/components/pipeline-builder/PipelineBuilderFormEditor.tsx:52`
- Modify: `src/components/quick-search/QuickSearchList.tsx:104`
- Modify: `src/components/modals/error-modal.tsx:21`
- Modify: `src/components/approval-tasks/ApprovalTaskActionDropdown.tsx:178,202`

**Interfaces:**
- Consumes: PF6 `@patternfly/react-core` exports (Tooltip, Popover, Card, DataList, ModalHeader, Dropdown)
- Produces: No interface changes — same components, updated prop usage

- [ ] **Step 1: Replace `TooltipPosition` enum with string literals**

In `PipelineRunDecorator.tsx`:
```tsx
// Before
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
// ...
position={TooltipPosition.left}

// After
import { Tooltip } from '@patternfly/react-core';
// ...
position="left"
```

In `PlusNodeDecorator.tsx`:
```tsx
// Before
import { Tooltip, TooltipPosition } from '@patternfly/react-core';
tooltipPosition?: TooltipPosition;

// After
import { Tooltip } from '@patternfly/react-core';
tooltipPosition?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
```

In `BuilderNode.tsx`:
```tsx
// Before
import { TooltipPosition } from '@patternfly/react-core';
tooltipPosition={TooltipPosition.bottom}

// After — remove the import, use string
tooltipPosition="bottom"
```

- [ ] **Step 2: Replace `PopoverPosition` enum with string literal**

In `PipelineRunStatusContent.tsx`:
```tsx
// Before
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';
position={PopoverPosition.auto}

// After
import { Button, Popover } from '@patternfly/react-core';
position="auto"
```

- [ ] **Step 3: Replace `isCompact` with `size="compact"`**

In `PipelineBuilderFormEditor.tsx:52`:
```tsx
// Before
<Card isCompact isPlain>

// After
<Card size="compact" isPlain>
```

In `QuickSearchList.tsx:104`:
```tsx
// Before
<DataList isCompact

// After
<DataList size="compact"
```

- [ ] **Step 4: Replace `titleIconVariant` with standard PF6 pattern**

In `error-modal.tsx:21`:
```tsx
// Before
<ModalHeader title={titleText} titleIconVariant="warning" />

// After
import { WarningTriangleIcon } from '@patternfly/react-icons';
<ModalHeader title={titleText} titleIconVariant={WarningTriangleIcon} />
```

- [ ] **Step 5: Remove deprecated `popperProps={{ position }}` pattern**

In `ApprovalTaskActionDropdown.tsx:178,202`:
```tsx
// Before
<Dropdown popperProps={{ position: 'right' }} ...>

// After
<Dropdown popperProps={{ position: Popper.right }} ...>
```
Note: Verify if `popperProps.position` still works in PF6. If it does, leave as-is. If not, remove the prop entirely — PF6 auto-positions dropdowns.

- [ ] **Step 6: Verify the build compiles cleanly**

Run: `npx webpack 2>&1 | tail -5`
Expected: `compiled successfully`

- [ ] **Step 7: Commit**

```bash
git add src/components/topology/build-decorators/PipelineRunDecorator.tsx \
  src/components/pipeline-topology/PlusNodeDecorator.tsx \
  src/components/pipeline-topology/BuilderNode.tsx \
  src/components/status/PipelineRunStatusContent.tsx \
  src/components/pipeline-builder/PipelineBuilderFormEditor.tsx \
  src/components/quick-search/QuickSearchList.tsx \
  src/components/modals/error-modal.tsx \
  src/components/approval-tasks/ApprovalTaskActionDropdown.tsx
git commit -m "refactor: replace deprecated PF5 component props with PF6 equivalents"
```

---

### Task 2: Replace hardcoded colors in visualization SCSS with PF6 tokens

**Files:**
- Modify: `src/components/pipelines-details/PipelineVisualizationTask.scss:2-6,10,13,26`
- Modify: `src/components/pipeline-topology/PipelineTaskNode.scss:14,16`
- Modify: `src/components/pipelines-details/PipelineVisualizationLegend.scss:22`
- Modify: `src/components/triggers-details/DynamicResourceLinkList.scss:20`
- Modify: `src/components/badges/Badge.scss:3`

**Interfaces:**
- Consumes: PF6 design token CSS custom properties (available globally from PF6 CSS)
- Produces: No interface changes — visual only

- [ ] **Step 1: Replace SCSS color variables in PipelineVisualizationTask.scss**

```scss
// Before (lines 2-6)
$pf-v6-color-black-300: #d2d2d2 !default;
$pf-v6-color-black-500: #8a8d90 !default;
$pf-v6-color-blue-200: #73bcf7 !default;
$pf-v6-color-blue-400: #06c !default;
$pf-v6-color-orange-200: #ef9234 !default;

// After — use CSS custom properties via SCSS interpolation
$pf-v6-color-black-300: var(--pf-t--global--color--nonstatus--gray--default) !default;
$pf-v6-color-black-500: var(--pf-t--global--color--nonstatus--gray--hover) !default;
$pf-v6-color-blue-200: var(--pf-t--global--color--brand--200) !default;
$pf-v6-color-blue-400: var(--pf-t--global--color--brand--default) !default;
$pf-v6-color-orange-200: var(--pf-t--global--color--nonstatus--orange--default) !default;
```

```scss
// Before (lines 10, 13)
$selected-fill-color: #a5c4e2;
$interactive-fill-color: #a5c4e2;

// After
$selected-fill-color: var(--pf-t--global--color--brand--200);
$interactive-fill-color: var(--pf-t--global--color--brand--200);
```

```scss
// Before (line 26)
$default-edge-stroke-color: #bbbbbb;

// After
$default-edge-stroke-color: var(--pf-t--global--border--color--default);
```

- [ ] **Step 2: Replace hardcoded colors in PipelineTaskNode.scss**

```scss
// Before (lines 14, 16)
stroke: #0066cc !important;
fill: #e7f1fa !important;

// After
stroke: var(--pf-t--global--color--brand--default) !important;
fill: var(--pf-t--global--background--color--primary--default) !important;
```

- [ ] **Step 3: Replace `#fff` in PipelineVisualizationLegend.scss and DynamicResourceLinkList.scss**

In `PipelineVisualizationLegend.scss:22`:
```scss
// Before
color: #fff;
// After
color: var(--pf-t--global--text--color--on-brand--default);
```

In `DynamicResourceLinkList.scss:20`:
```scss
// Before
color: #fff;
// After
color: var(--pf-t--global--text--color--on-brand--default);
```

- [ ] **Step 4: Replace hardcoded color in Badge.scss**

```scss
// Before (line 3)
--pf-v6-c-label--BackgroundColor: #d93f00;
// After
--pf-v6-c-label--BackgroundColor: var(--pf-t--global--color--status--danger--default);
```

- [ ] **Step 5: Verify the build compiles and check visuals**

Run: `npx webpack 2>&1 | tail -5`
Expected: `compiled successfully`

Open http://localhost:9000 and navigate to a Pipeline details page to verify the visualization colors look correct.

- [ ] **Step 6: Commit**

```bash
git add src/components/pipelines-details/PipelineVisualizationTask.scss \
  src/components/pipeline-topology/PipelineTaskNode.scss \
  src/components/pipelines-details/PipelineVisualizationLegend.scss \
  src/components/triggers-details/DynamicResourceLinkList.scss \
  src/components/badges/Badge.scss
git commit -m "refactor: replace hardcoded hex colors with PF6 design tokens in visualization SCSS"
```

---

### Task 3: Replace hardcoded spacing and font sizes in SCSS with PF6 tokens

**Files:**
- Modify: `src/components/status/status-box.scss:2,26-27`
- Modify: `src/components/pipelines-details/PipelineVisualizationStepList.scss:11,24`
- Modify: `src/components/pipelines-details/PipelineVisualizationLegend.scss:20,23`
- Modify: `src/components/triggers-details/DynamicResourceLinkList.scss:18,21`
- Modify: `src/components/logs/LogSnippet.scss:6,7,10`
- Modify: `src/components/quick-search/QuickSearchBar.scss:14,31`
- Modify: `src/components/quick-search/QuickSearchDetails.scss:22`
- Modify: `src/components/task-quicksearch/PipelineQuickSearchDetails.scss:22`
- Modify: `src/components/pipeline-topology/ErrorNodeDecorator.scss:3`
- Modify: `src/components/pipelines-tasks/tasks-details-pages/events/toggle-play.scss:8`
- Modify: `src/components/approval-tasks/ApprovalRow.scss:2`
- Modify: `src/components/approval-tasks/approval-notification/ApprovalToastContent.scss:2`
- Modify: `src/components/side-bar/TopologySideBarTabSection.scss:2`

**Interfaces:**
- Consumes: PF6 spacer tokens (`--pf-t--global--spacer--*`) and font size tokens (`--pf-t--global--font--size--*`)
- Produces: No interface changes — visual only

- [ ] **Step 1: Replace hardcoded spacing in status-box.scss**

```scss
// Before (line 2)
padding: 40px 20px;
// After
padding: var(--pf-t--global--spacer--xl) var(--pf-t--global--spacer--md);

// Before (lines 26-27)
margin-bottom: 30px;
margin-top: 20px;
// After
margin-bottom: var(--pf-t--global--spacer--lg);
margin-top: var(--pf-t--global--spacer--md);
```

- [ ] **Step 2: Replace hardcoded spacing in PipelineVisualizationStepList.scss**

```scss
// Before (lines 11, 24)
margin: 0 auto 10px auto;
// After
margin: 0 auto var(--pf-t--global--spacer--sm) auto;
```

- [ ] **Step 3: Replace hardcoded spacing and font sizes in PipelineVisualizationLegend.scss and DynamicResourceLinkList.scss**

In `PipelineVisualizationLegend.scss`:
```scss
// Before (line 20)
padding: 0 4px;
// After
padding: 0 var(--pf-t--global--spacer--xs);

// Before (line 23)
font-size: 10px;
// After
font-size: var(--pf-t--global--font--size--xs);
```

In `DynamicResourceLinkList.scss`:
```scss
// Before (line 18)
padding: 0 4px;
// After
padding: 0 var(--pf-t--global--spacer--xs);

// Before (line 21)
font-size: 10px;
// After
font-size: var(--pf-t--global--font--size--xs);
```

- [ ] **Step 4: Replace hardcoded spacing in LogSnippet.scss**

```scss
// Before (line 6)
margin-left: 6px;
// After
margin-left: var(--pf-t--global--spacer--xs);

// Before (line 7)
padding: 10px 0 10px 13px;
// After
padding: var(--pf-t--global--spacer--sm) 0 var(--pf-t--global--spacer--sm) var(--pf-t--global--spacer--md);

// Before (line 10)
margin-bottom: 10px;
// After
margin-bottom: var(--pf-t--global--spacer--sm);
```

- [ ] **Step 5: Replace hardcoded spacing and font sizes in QuickSearch components**

In `QuickSearchBar.scss`:
```scss
// Before (line 14)
padding: 5px 8px;
// After
padding: var(--pf-t--global--spacer--xs) var(--pf-t--global--spacer--sm);

// Before (line 31)
padding: 8px;
// After
padding: var(--pf-t--global--spacer--sm);
```

In `QuickSearchDetails.scss:22`:
```scss
// Before
font-size: 15px !important;
// After
font-size: var(--pf-t--global--font--size--md) !important;
```

In `PipelineQuickSearchDetails.scss:22`:
```scss
// Before
font-size: 15px !important;
// After
font-size: var(--pf-t--global--font--size--md) !important;
```

- [ ] **Step 6: Replace hardcoded values in remaining files**

In `ErrorNodeDecorator.scss:3`:
```scss
// Before
font-size: 10px;
// After
font-size: var(--pf-t--global--font--size--xs);
```

In `toggle-play.scss:8`:
```scss
// Before
margin-right: 15px;
// After
margin-right: var(--pf-t--global--spacer--md);
```

In `ApprovalRow.scss:2`:
```scss
// Before
margin-left: -10px;
// After
margin-left: calc(var(--pf-t--global--spacer--sm) * -1);
```

In `ApprovalToastContent.scss:2`:
```scss
// Before
padding-top: 5px;
// After
padding-top: var(--pf-t--global--spacer--xs);
```

In `TopologySideBarTabSection.scss:2`:
```scss
// Before
padding: 0 20px;
// After
padding: 0 var(--pf-t--global--spacer--md);
```

- [ ] **Step 7: Verify the build compiles**

Run: `npx webpack 2>&1 | tail -5`
Expected: `compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add src/components/status/status-box.scss \
  src/components/pipelines-details/PipelineVisualizationStepList.scss \
  src/components/pipelines-details/PipelineVisualizationLegend.scss \
  src/components/triggers-details/DynamicResourceLinkList.scss \
  src/components/logs/LogSnippet.scss \
  src/components/quick-search/QuickSearchBar.scss \
  src/components/quick-search/QuickSearchDetails.scss \
  src/components/task-quicksearch/PipelineQuickSearchDetails.scss \
  src/components/pipeline-topology/ErrorNodeDecorator.scss \
  src/components/pipelines-tasks/tasks-details-pages/events/toggle-play.scss \
  src/components/approval-tasks/ApprovalRow.scss \
  src/components/approval-tasks/approval-notification/ApprovalToastContent.scss \
  src/components/side-bar/TopologySideBarTabSection.scss
git commit -m "refactor: replace hardcoded spacing and font sizes with PF6 design tokens"
```

---

### Task 4: Replace hardcoded border-radius and z-index with PF6 tokens

**Files:**
- Modify: `src/components/pipelines-details/PipelineVisualizationLegend.scss:21`
- Modify: `src/components/triggers-details/DynamicResourceLinkList.scss:19`
- Modify: `src/components/pipeline-topology/PipelineTopologyGraph.scss:8,13`
- Modify: `src/components/pipelines-details/PipelineVisualization.scss:7`
- Modify: `src/components/pac/PacPage.scss:36`
- Modify: `src/components/quick-search/QuickSearchDetails.scss:31`
- Modify: `src/components/pipeline-builder/task-sidebar/TaskSidebar.scss:12`
- Modify: `src/components/quick-search/QuickSearchModalBody.scss:6,15`
- Modify: `src/components/pipeline-topology/TaskListNode.scss:6`

**Interfaces:**
- Consumes: PF6 border-radius tokens (`--pf-t--global--border--radius--*`), z-index tokens (`--pf-t--global--z-index--*`), box-shadow tokens (`--pf-t--global--box-shadow--*`)
- Produces: No interface changes — visual only

- [ ] **Step 1: Replace hardcoded border-radius values**

In `PipelineVisualizationLegend.scss:21`:
```scss
// Before
border-radius: 4px;
// After
border-radius: var(--pf-t--global--border--radius--small);
```

In `DynamicResourceLinkList.scss:19`:
```scss
// Before
border-radius: 4px;
// After
border-radius: var(--pf-t--global--border--radius--small);
```

In `PipelineTopologyGraph.scss:8,13`:
```scss
// Before
border-radius: 20px;
// After
border-radius: var(--pf-t--global--border--radius--large);
```

In `PipelineVisualization.scss:7`:
```scss
// Before
border-radius: 1rem;
// After
border-radius: var(--pf-t--global--border--radius--medium);
```

In `PacPage.scss:36`:
```scss
// Before
border-radius: 16px;
// After
border-radius: var(--pf-t--global--border--radius--large);
```

In `QuickSearchDetails.scss:31`:
```scss
// Before
border-radius: 10px;
// After
border-radius: var(--pf-t--global--border--radius--medium);
```

- [ ] **Step 2: Replace hardcoded z-index values**

In `TaskSidebar.scss:12`:
```scss
// Before
z-index: 10000;
// After
z-index: var(--pf-t--global--z-index--xl);
```

In `QuickSearchModalBody.scss:15`:
```scss
// Before
z-index: 1;
// After
z-index: var(--pf-t--global--z-index--xs);
```

- [ ] **Step 3: Replace component-level box-shadow references with design tokens**

In `QuickSearchModalBody.scss:6`:
```scss
// Before
box-shadow: var(--pf-v6-c-modal-box--BoxShadow);
// After
box-shadow: var(--pf-t--global--box-shadow--md);
```

In `TaskListNode.scss:6`:
```scss
// Before
box-shadow: var(--pf-v6-c-dropdown__menu--BoxShadow);
// After
box-shadow: var(--pf-t--global--box-shadow--md);
```

- [ ] **Step 4: Verify the build compiles**

Run: `npx webpack 2>&1 | tail -5`
Expected: `compiled successfully`

- [ ] **Step 5: Commit**

```bash
git add src/components/pipelines-details/PipelineVisualizationLegend.scss \
  src/components/triggers-details/DynamicResourceLinkList.scss \
  src/components/pipeline-topology/PipelineTopologyGraph.scss \
  src/components/pipelines-details/PipelineVisualization.scss \
  src/components/pac/PacPage.scss \
  src/components/quick-search/QuickSearchDetails.scss \
  src/components/pipeline-builder/task-sidebar/TaskSidebar.scss \
  src/components/quick-search/QuickSearchModalBody.scss \
  src/components/pipeline-topology/TaskListNode.scss
git commit -m "refactor: replace hardcoded border-radius, z-index, and box-shadow with PF6 tokens"
```

---

### Task 5: Replace inline flex styles with PF6 Flex components

**Files:**
- Modify: `src/components/pipeline-builder/form-utils/FlexForm.tsx`
- Modify: `src/components/pipeline-builder/form-utils/FormBody.tsx`
- Modify: `src/components/pipeline-builder/WorkspaceTypeDropdown.tsx:24-43`
- Modify: `src/components/details-page/DetailsPage.tsx:79`
- Modify: `src/components/repositories/WebhookSection.tsx`
- Modify: `src/components/repositories/RepositoryOverview.tsx`

**Interfaces:**
- Consumes: PF6 `<Flex>`, `<FlexItem>` from `@patternfly/react-core`
- Produces: Same rendered output, using PF6 layout components

- [ ] **Step 1: Replace inline flex in FlexForm.tsx**

```tsx
// Before
const FlexForm: FC<FlexFormProps & HTMLProps<HTMLFormElement>> = ({
  children,
  ...props
}) => (
  <form
    {...props}
    style={{ display: 'flex', flex: 1, flexDirection: 'column' }}
  >
    {children}
  </form>
);

// After — keep as form element but use CSS class instead of inline style
// Create a minimal CSS class or use PF6 utility classes
const FlexForm: FC<FlexFormProps & HTMLProps<HTMLFormElement>> = ({
  children,
  ...props
}) => (
  <form
    {...props}
    className={classNames('pf-v6-u-display-flex pf-v6-u-flex-direction-column pf-v6-u-flex-grow-1', props.className)}
  >
    {children}
  </form>
);
```
Add import: `import classNames from 'classnames';`

- [ ] **Step 2: Replace inline flex in FormBody.tsx**

```tsx
// Before
style={
  flexLayout
    ? {
        display: 'flex',
        flex: 1,
        flexDirection: 'column',
        paddingBottom: 0,
        ...(style ?? {}),
      }
    : { paddingBottom: 0, ...(style ?? {}) }
}

// After
className={classNames(
  'pf-v6-c-form',
  { 'co-m-pane__body': !disablePaneBody },
  { 'pf-v6-u-display-flex pf-v6-u-flex-direction-column pf-v6-u-flex-grow-1': flexLayout },
  className,
)}
style={{ paddingBottom: 0, ...(style ?? {}) }}
```

- [ ] **Step 3: Replace inline flex in WorkspaceTypeDropdown.tsx**

```tsx
// Before
<div style={{ display: 'flex', gap: 'var(--pf-t--global--spacer--md)' }}>
  <div style={{ flex: workspaceType === VolumeTypes.PVC ? '0 0 50%' : '1 1 auto' }}>
    ...
  </div>
  {workspaceType === VolumeTypes.PVC && (
    <div style={{ flex: '1 1 50%' }}>
      ...
    </div>
  )}
</div>

// After
import { Flex, FlexItem } from '@patternfly/react-core';

<Flex spaceItems={{ default: 'spaceItemsMd' }}>
  <FlexItem flex={{ default: workspaceType === VolumeTypes.PVC ? 'flexNone' : 'flex_1' }}
            style={workspaceType === VolumeTypes.PVC ? { flexBasis: '50%' } : undefined}>
    ...
  </FlexItem>
  {workspaceType === VolumeTypes.PVC && (
    <FlexItem flex={{ default: 'flex_1' }}>
      ...
    </FlexItem>
  )}
</Flex>
```

- [ ] **Step 4: Replace inline style in DetailsPage.tsx**

```tsx
// Before (line 79)
<Flex style={{ paddingTop: 'var(--pf-t--global--spacer--md)' }}>

// After
<Flex className="pf-v6-u-pt-md">
```

- [ ] **Step 5: Replace inline styles in RepositoryOverview.tsx**

Replace `style={{ marginTop: '.5em' }}` with `className="pf-v6-u-mt-sm"` and `style={{ flex: '1', marginTop: '.5em' }}` with `className="pf-v6-u-flex-grow-1 pf-v6-u-mt-sm"`.

- [ ] **Step 6: Replace inline styles in WebhookSection.tsx**

Replace `style={{ flex: '1' }}` with `<FlexItem flex={{ default: 'flex_1' }}>` where the parent is already a Flex, or use `className="pf-v6-u-flex-grow-1"`.

- [ ] **Step 7: Verify the build compiles and test visually**

Run: `npx webpack 2>&1 | tail -5`
Expected: `compiled successfully`

Open http://localhost:9000, navigate to Pipeline Builder and Repository pages to verify layouts render correctly.

- [ ] **Step 8: Commit**

```bash
git add src/components/pipeline-builder/form-utils/FlexForm.tsx \
  src/components/pipeline-builder/form-utils/FormBody.tsx \
  src/components/pipeline-builder/WorkspaceTypeDropdown.tsx \
  src/components/details-page/DetailsPage.tsx \
  src/components/repositories/WebhookSection.tsx \
  src/components/repositories/RepositoryOverview.tsx
git commit -m "refactor: replace inline flex styles with PF6 Flex components and utility classes"
```

---

## Audit Summary

| Category | Files | Issues | Severity |
|----------|-------|--------|----------|
| Deprecated component props/enums | 8 | 9 | HIGH |
| Hardcoded hex colors in SCSS | 5 | 14 | HIGH |
| Hardcoded spacing in SCSS | 13 | 19 | MEDIUM |
| Hardcoded font sizes in SCSS | 5 | 5 | MEDIUM |
| Hardcoded border-radius | 6 | 7 | LOW-MEDIUM |
| Hardcoded z-index | 3 | 3 | LOW |
| Inline flex styles in TSX | 6 | 9 | HIGH |
| **Total** | **~30 unique files** | **~66** | |

### Out of scope (acceptable exceptions)
- `src/components/logs/ansi-log-colors.scss` — 32 ANSI terminal color hex values. These are standardized spec colors for terminal emulation fidelity and should remain hardcoded.
- SVG positioning styles in `Popper.tsx`, `Tippy.tsx`, `BuildDecoratorBubble.tsx` — dynamic positioning requires inline styles.
- `toggle-play.scss` `border-radius: 50%` — circle shape, not a design token concern.

### Already PF6-compliant (no changes needed)
- Dropdown/MenuToggle pattern (all instances correct)
- Select/MenuToggle pattern (all instances correct)
- Table composable pattern (Thead/Tbody/Tr/Th/Td)
- EmptyState with `titleText` prop
- ModalVariant enum usage
- DropdownList wrapping
- Toolbar/ToolbarContent/ToolbarItem usage
- Grid/GridItem with `hasGutter`
- Stack/StackItem usage
- 79 of 99 SCSS files already clean
