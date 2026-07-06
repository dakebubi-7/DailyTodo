# Collapsed Task Stack Layers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Collapsed parent tasks should keep the same main-card visual treatment as tasks without children, while showing up to three bottom stack layers based on child count.

**Architecture:** Restore explicit faux stack layer rendering in `TaskItem.tsx` for collapsed tasks with children. Remove the collapsed preview well approach and special collapsed-main-card visual overrides so the main task card uses the normal `.task-card` styling. Keep changes focused to component markup, CSS, and the existing static verifier.

**Tech Stack:** Electron, React, TypeScript, CSS, existing `tsx` verification script.

---

## File Structure

- Modify `app/src/components/TaskItem.tsx`: render up to three decorative stack layers behind collapsed parent task cards; remove collapsed preview rows.
- Modify `app/src/styles/globals.css`: style stack layers as bottom-revealed card silhouettes; remove preview-well and collapsed-main-card special visual overrides.
- Modify `app/scripts/verify-task-cluster-stack.ts`: assert stack layer behavior, max three layers, no collapsed preview well, and main-card visual parity.

## Task 1: Update static verification first

**Files:**
- Modify: `app/scripts/verify-task-cluster-stack.ts`

- [ ] **Step 1: Replace preview-well assertions with stack-layer assertions**

Update the verifier so it expects:

```ts
assert(taskItem.includes("const TASK_STACK_LAYER_CLASSES = ['task-stack-layer-1', 'task-stack-layer-2', 'task-stack-layer-3'] as const;"), 'Collapsed stack should define up to three stack layer classes.');
assert(taskItem.includes('const stackLayerCount = Math.min(directSubtasks.length, TASK_STACK_LAYER_CLASSES.length);'), 'Collapsed stack layer count should match child count up to three.');
assert(taskItem.includes('!isExpanded && stackLayerCount > 0 && ('), 'Collapsed clusters should render decorative stack layers only when collapsed and children exist.');
assert(taskItem.includes('TASK_STACK_LAYER_CLASSES.slice(0, stackLayerCount).map'), 'Collapsed clusters should render one stack layer per child up to the maximum.');
assert(taskItem.includes('className={`task-stack-layer task-cluster-faux-card task-card ${layerClass}`}'), 'Stack layers should reuse task-card silhouette styling.');
assert(!taskItem.includes('className="task-subtasks task-subtasks-preview"'), 'Collapsed clusters should not render the preview well shell.');
assert(!taskItem.includes('task-subtask-preview-card'), 'Collapsed clusters should not render hidden preview subtask rows.');
assert(!taskItem.includes('task-subtask-preview-priority'), 'Collapsed clusters should not render hidden preview priority dots.');
```

Also update CSS assertions so they expect `.task-stack-layer`, `.task-stack-layer-1`, `.task-stack-layer-2`, and `.task-stack-layer-3`, and assert no `.task-subtasks-preview` block remains.

- [ ] **Step 2: Run verification to confirm RED**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: FAIL because the implementation still uses the preview well and does not render stack layers.

## Task 2: Restore stack layer rendering

**Files:**
- Modify: `app/src/components/TaskItem.tsx`

- [ ] **Step 1: Add three stack layer classes**

Add near the task constants:

```ts
const TASK_STACK_LAYER_CLASSES = ['task-stack-layer-1', 'task-stack-layer-2', 'task-stack-layer-3'] as const;
```

- [ ] **Step 2: Compute layer count from child count**

Inside `TaskItem`, replace preview-only state with:

```ts
const stackLayerCount = Math.min(directSubtasks.length, TASK_STACK_LAYER_CLASSES.length);
```

- [ ] **Step 3: Render stack layers below the main card in the stack shell**

Inside `.task-cluster-stack-shell`, before the main `motion.div`, render:

```tsx
<AnimatePresence initial={false}>
  {!isExpanded && stackLayerCount > 0 && (
    <>
      {TASK_STACK_LAYER_CLASSES.slice(0, stackLayerCount).map((layerClass, layerIndex) => (
        <motion.span
          key={layerClass}
          className={`task-stack-layer task-cluster-faux-card task-card ${layerClass}`}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 0, scale: 1 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 0, scale: 1 }}
          transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : { ...TASK_CLUSTER_SPRING, delay: layerIndex * 0.025 }}
          aria-hidden="true"
        />
      ))}
    </>
  )}
</AnimatePresence>
```

- [ ] **Step 4: Remove collapsed preview well JSX**

Delete the block:

```tsx
{!isExpanded && hasChildren && (
  <span className="task-subtasks task-subtasks-preview" aria-hidden="true">
    ...
  </span>
)}
```

Remove `priorityDotColors` and `previewSubtasks` if they become unused.

## Task 3: Replace preview-well CSS with bottom stack silhouettes

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Remove outer pocket styling from collapsed clusters**

Ensure `.task-cluster` stays structural only:

```css
.task-cluster {
  position: relative;
  display: grid;
  gap: 0.38rem;
  isolation: isolate;
}
```

Delete `.task-cluster-collapsed.task-cluster-has-children.task-cluster` pocket background/shadow rules and their dark equivalents.

- [ ] **Step 2: Add bottom space only for stack layers**

Set the shell padding so layers can show below the main card:

```css
.task-cluster-stack-shell {
  position: relative;
  display: grid;
  min-width: 0;
  padding-bottom: 1.05rem;
}

.task-cluster-no-children .task-cluster-stack-shell,
.task-cluster-expanded .task-cluster-stack-shell {
  padding-bottom: 0;
}
```

- [ ] **Step 3: Add decorative stack layer rules**

Use stack layers positioned beneath the main card:

```css
.task-stack-layer {
  position: absolute;
  left: 0.18rem;
  right: 0.18rem;
  bottom: 0;
  z-index: 5;
  min-height: 3.15rem !important;
  pointer-events: none;
  transform-origin: center top;
}

.task-stack-layer.task-cluster-faux-card {
  border-color: rgba(76, 91, 112, 0.075) !important;
  background: rgba(255, 255, 255, 0.56) !important;
  box-shadow: 0 6px 16px rgba(54, 68, 88, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.48) !important;
}

.task-stack-layer-1 {
  transform: translateY(0.34rem) scaleX(0.985);
  opacity: 0.82;
}

.task-stack-layer-2 {
  transform: translateY(0.68rem) scaleX(0.965);
  opacity: 0.62;
}

.task-stack-layer-3 {
  transform: translateY(1.02rem) scaleX(0.945);
  opacity: 0.44;
}
```

Add dark-mode counterparts with subdued surfaces.

- [ ] **Step 4: Remove preview-well CSS and collapsed-main-card special visuals**

Delete CSS blocks for:

```css
.task-subtasks-preview
.task-subtasks-preview .task-subtask-row.task-subtask-card.task-subtask-preview-card
.task-subtasks-preview .task-subtask-text
.task-subtasks-preview .task-subtask-preview-priority
.task-subtasks-preview .task-subtask-complete
.task-subtask-preview-priority
.task-subtask-preview-priority span
.task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card
.dark .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card
.task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card:hover
.dark .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card:hover
```

The main card should inherit normal `.task-card` and `.task-card:hover` visuals.

## Task 4: Verify and report

**Files:**
- Read-only check: `app/src/components/TaskItem.tsx`
- Read-only check: `app/src/styles/globals.css`
- Run: verification commands

- [ ] **Step 1: Run stack verification**

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: `Task cluster stack verification passed`.

- [ ] **Step 2: Run TypeScript check**

```bash
cd /g/Personal-AI/DailyTodo/app && npm run typecheck
```

Expected: exit code 0.

- [ ] **Step 3: Check relevant diff for whitespace errors**

```bash
git -C /g/Personal-AI/DailyTodo diff --check -- app/src/components/TaskItem.tsx app/src/styles/globals.css app/scripts/verify-task-cluster-stack.ts
```

Expected: exit code 0. Git may warn about LF/CRLF, but there should be no whitespace error.

- [ ] **Step 4: Report exact result**

Tell the user:

- Main cards with children now keep the same card styling as no-child tasks.
- Collapsed child tasks show 1, 2, or 3 bottom stack layers based on child count.
- Expanded tasks hide stack layers and show real subtasks.
- Verification command results.

## Self-Review

- Spec coverage: The plan covers child-count-based layers, max three layers, main-card visual parity, collapsed-only rendering, expanded-state behavior, and verification.
- Placeholder scan: No TBD/TODO placeholders remain.
- Type consistency: The stack layer class names match across JSX, CSS, and verification.
- Commit note: This repository has user-managed uncommitted work; do not commit unless the user explicitly requests it.
