# Collapsed Task Stack Segments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace collapsed rear-card stack silhouettes with strict equal-height stack segments that show direct subtask count up to three while keeping the collapsed parent card opaque.

**Architecture:** Remove the current faux-card stack layer rendering from `TaskItem.tsx` and replace it with a dedicated segmented stack base driven by direct subtask count. Use CSS variables on the stack shell to reserve exactly one, two, or three equal-height bands beneath the main card, and update the verifier to lock in the segmented structure, opaque main card treatment, and shadow-only separation.

**Tech Stack:** Electron, React, TypeScript, Framer Motion, CSS, existing `tsx` verification script.

---

## File Structure

- Modify `app/src/components/TaskItem.tsx`: replace stack-layer constants/helpers and collapsed rendering with segment-based markup and count-driven shell style.
- Modify `app/src/styles/globals.css`: remove old `.task-stack-layer*` geometry and add `.task-stack-segments` / `.task-stack-segment*` styles with equal-height bands and opaque collapsed parent card styling.
- Modify `app/scripts/verify-task-cluster-stack.ts`: assert the segmented-base implementation, equal-height segment spacing, opacity-only motion, and removal of black border styling.

## Task 1: Update the static verifier first

**Files:**
- Modify: `app/scripts/verify-task-cluster-stack.ts`

- [ ] **Step 1: Replace layer-specific block lookups with segment-specific block lookups**

Replace the block extraction section with:

```ts
const taskClusterBlock = getCssBlock(globals, '.task-cluster');
const stackShellBlock = getCssBlock(globals, '.task-cluster-stack-shell');
const expandedStackShellBlock = getCssBlock(globals, '.task-cluster-expanded .task-cluster-stack-shell');
const stackSegmentsBlock = getCssBlock(globals, '.task-stack-segments');
const stackSegmentBlock = getCssBlock(globals, '.task-stack-segment');
const collapsedMainCardBlock = getCssBlock(globals, '.task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card');
const darkCollapsedMainCardBlock = getCssBlock(globals, '.dark .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card');
```

- [ ] **Step 2: Replace TaskItem assertions with segment assertions**

Replace the collapsed-stack assertions with:

```ts
assert(taskItem.includes("const TASK_STACK_SEGMENT_CLASSES = ['task-stack-segment-1', 'task-stack-segment-2', 'task-stack-segment-3'] as const;"), 'Collapsed stack should define up to three stack segment classes.');
assert(taskItem.includes('const TASK_STACK_SEGMENT_TRANSITIONS = TASK_STACK_SEGMENT_CLASSES.map'), 'Collapsed stack should precompute segment transitions.');
assert(taskItem.includes('const stackSegmentCount = getStackSegmentCount(subtaskCount);'), 'Collapsed stack segment count should be derived through the shared helper.');
assert(taskItem.includes("'--task-stack-segment-count': segmentCount"), 'Collapsed stack shell should receive the segment count through a CSS variable.');
assert(taskItem.includes('className="task-stack-segments"'), 'Collapsed clusters should render a dedicated segment container.');
assert(taskItem.includes('className={`task-stack-segment ${segmentClass}`}'), 'Collapsed clusters should render stack segment elements rather than faux cards.');
assert(taskItem.includes('return Math.min(subtaskCount, TASK_STACK_SEGMENT_CLASSES.length);'), 'Stack segment helper should cap visible segments at three.');
assert(!taskItem.includes('task-stack-layer task-cluster-faux-card task-card'), 'Collapsed clusters should not render faux rear cards once segments are introduced.');
```

- [ ] **Step 3: Replace CSS assertions with segment geometry and opaque-main-card assertions**

Replace the CSS assertions with:

```ts
assert(taskClusterBlock.includes('display: grid;'), 'Task cluster should remain a structural grid wrapper.');
assert(stackShellBlock.includes('--task-stack-segment-height: 0.42rem;'), 'Collapsed stack shell should define a fixed segment height.');
assert(stackShellBlock.includes('padding-bottom: calc(var(--task-stack-segment-count, 0) * var(--task-stack-segment-height));'), 'Collapsed stack shell should reserve height from segment count.');
assert(expandedStackShellBlock.includes('padding-bottom: 0;'), 'Expanded clusters should not reserve segment space.');
assert(stackSegmentsBlock.includes('height: calc(var(--task-stack-segment-count, 0) * var(--task-stack-segment-height));'), 'Segment container height should be driven by segment count.');
assert(stackSegmentBlock.includes('height: var(--task-stack-segment-height);'), 'Every exposed segment should use the same height.');
assert(stackSegmentBlock.includes('border: none !important;'), 'Segments should not use dark border lines.');
assert(stackSegmentBlock.includes('box-shadow:'), 'Segments should use shadow separation.');
assert(collapsedMainCardBlock.includes('background: var(--solid-surface, rgba(255, 255, 255, 0.92)) !important;'), 'Collapsed parent main card should remain opaque.');
assert(darkCollapsedMainCardBlock.includes('background: var(--solid-surface-dark, rgba(15, 23, 42, 0.95)) !important;'), 'Dark-mode collapsed parent main card should remain opaque.');
```

- [ ] **Step 4: Run the verifier to confirm RED**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: FAIL with at least one message about missing `TASK_STACK_SEGMENT_CLASSES`, missing `task-stack-segments`, or missing segment-height assertions because the implementation still uses `task-stack-layer`.

- [ ] **Step 5: Commit the failing verifier update**

```bash
git add app/scripts/verify-task-cluster-stack.ts
git commit -m "test: redefine collapsed stack as segments"
```

## Task 2: Replace stack-layer helpers with segment helpers in TaskItem

**Files:**
- Modify: `app/src/components/TaskItem.tsx`

- [ ] **Step 1: Add the `CSSProperties` type import**

Update the React import block to include the type:

```ts
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from 'react';
```

- [ ] **Step 2: Replace layer constants with segment constants**

Replace the existing stack-layer constants with:

```ts
const TASK_STACK_SEGMENT_CLASSES = ['task-stack-segment-1', 'task-stack-segment-2', 'task-stack-segment-3'] as const;

export const TASK_CLUSTER_SPRING = {
  stiffness: 180,
  damping: 25,
  mass: 1,
};

const TASK_STACK_SEGMENT_TRANSITIONS = TASK_STACK_SEGMENT_CLASSES.map((_, segmentIndex) => ({
  ...TASK_CLUSTER_SPRING,
  delay: segmentIndex * 0.025,
}));
```

- [ ] **Step 3: Replace the count helper and add a shell-style helper**

Replace the old helper section with:

```ts
export function getStackSegmentCount(subtaskCount: number) {
  if (subtaskCount <= 0) return 0;
  return Math.min(subtaskCount, TASK_STACK_SEGMENT_CLASSES.length);
}

function getStackSegmentStyle(segmentCount: number): CSSProperties {
  return {
    '--task-stack-segment-count': segmentCount,
  } as CSSProperties;
}
```

- [ ] **Step 4: Run TypeScript-focused verification to confirm this step still fails only on rendering/CSS**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: FAIL, but the failure should move forward from the old layer assertions to rendering/CSS assertions because the helpers now exist.

- [ ] **Step 5: Commit the helper rename**

```bash
git add app/src/components/TaskItem.tsx
git commit -m "refactor: rename collapsed stack helpers to segments"
```

## Task 3: Render the segmented stack base in TaskItem

**Files:**
- Modify: `app/src/components/TaskItem.tsx`

- [ ] **Step 1: Replace per-task computed state with segment count and segment shell style**

Inside `TaskItem`, replace the current stack-layer state with:

```ts
const directSubtasks = task.subtasks || [];
const subtaskCount = directSubtasks.length;
const hasChildren = subtaskCount > 0;
const hasTags = Boolean(task.tags?.length);
const hasReview = hasTaskReview(task);
const canOpenReviewAction = task.completed || hasReview;
const isExpanded = hasChildren && !task.collapsed;
const virtualSubtasks = useVirtualSubtasks(directSubtasks, isExpanded);
const stackSegmentCount = getStackSegmentCount(subtaskCount);
const stackSegmentStyle = !isExpanded && stackSegmentCount > 0
  ? getStackSegmentStyle(stackSegmentCount)
  : undefined;
```

- [ ] **Step 2: Replace the collapsed stack JSX with a dedicated segment container**

Replace the existing `AnimatePresence` block inside `.task-cluster-stack-shell` with:

```tsx
<span className="task-cluster-stack-shell" style={stackSegmentStyle}>
  <AnimatePresence initial={false}>
    {!isExpanded && stackSegmentCount > 0 && (
      <span className="task-stack-segments" aria-hidden="true">
        {TASK_STACK_SEGMENT_CLASSES.slice(0, stackSegmentCount).map((segmentClass, segmentIndex) => (
          <motion.span
            key={segmentClass}
            className={`task-stack-segment ${segmentClass}`}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
            transition={shouldReduceMotion ? TASK_CLUSTER_REDUCED_TRANSITION : TASK_STACK_SEGMENT_TRANSITIONS[segmentIndex]}
          />
        ))}
      </span>
    )}
  </AnimatePresence>
```

- [ ] **Step 3: Remove any remaining faux-card stack class usage**

After the JSX replacement, the collapsed rendering should no longer contain this line anywhere in the file:

```tsx
className={`task-stack-layer task-cluster-faux-card task-card ${layerClass}`}
```

The only collapsed decorative classes should now be `task-stack-segments` and `task-stack-segment*`.

- [ ] **Step 4: Run the verifier to confirm TaskItem now satisfies the structure checks**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: FAIL, but now on CSS-specific assertions such as missing `--task-stack-segment-height`, missing `.task-stack-segments`, or missing opaque main-card rules.

- [ ] **Step 5: Commit the rendering swap**

```bash
git add app/src/components/TaskItem.tsx
git commit -m "feat: render collapsed stack as equal segments"
```

## Task 4: Replace layer CSS with segment CSS

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Make the collapsed shell reserve exact segment height**

Replace the current stack-shell block with:

```css
.task-cluster-stack-shell {
  --task-stack-segment-height: 0.42rem;
  --task-stack-segment-count: 0;
  position: relative;
  display: grid;
  min-width: 0;
  padding-bottom: calc(var(--task-stack-segment-count, 0) * var(--task-stack-segment-height));
}

.task-cluster-no-children .task-cluster-stack-shell,
.task-cluster-expanded .task-cluster-stack-shell {
  padding-bottom: 0;
}
```

- [ ] **Step 2: Make the collapsed parent main card explicitly opaque**

Add these rules near the stack shell / stack segment styles:

```css
.task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card {
  background: var(--solid-surface, rgba(255, 255, 255, 0.92)) !important;
}

.dark .task-cluster-collapsed.task-cluster-has-children .task-cluster-main-card.task-card {
  background: var(--solid-surface-dark, rgba(15, 23, 42, 0.95)) !important;
}
```

- [ ] **Step 3: Replace `.task-stack-layer*` blocks with segment blocks**

Replace the current stack-layer CSS with:

```css
.task-stack-segments {
  position: absolute;
  left: 0.18rem;
  right: 0.18rem;
  bottom: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: calc(var(--task-stack-segment-count, 0) * var(--task-stack-segment-height));
  pointer-events: none;
}

.task-stack-segment {
  height: var(--task-stack-segment-height);
  border: none !important;
  border-radius: 0 0 calc(var(--card-radius) * 0.82) calc(var(--card-radius) * 0.82);
  background: rgba(255, 255, 255, 0.88) !important;
  box-shadow: 0 6px 12px rgba(54, 68, 88, 0.08);
}

.dark .task-stack-segment {
  background: rgba(15, 23, 42, 0.9) !important;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.24);
}

.task-stack-segment-1 {
  margin-inline: 0.18rem;
  opacity: 0.96;
}

.task-stack-segment-2 {
  margin-inline: 0.38rem;
  opacity: 0.88;
}

.task-stack-segment-3 {
  margin-inline: 0.58rem;
  opacity: 0.8;
}
```

- [ ] **Step 4: Remove the old layer-only rules entirely**

Delete these blocks so the new segment approach is the only remaining collapsed-stack styling:

```css
.task-stack-layer
.task-stack-layer.task-cluster-faux-card
.dark .task-stack-layer.task-cluster-faux-card
.task-stack-layer-1
.task-stack-layer-2
.task-stack-layer-3
```

- [ ] **Step 5: Run the verifier to confirm GREEN for the static checks**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: PASS with `Task cluster stack verification passed`.

- [ ] **Step 6: Commit the CSS transition to segments**

```bash
git add app/src/styles/globals.css app/scripts/verify-task-cluster-stack.ts app/src/components/TaskItem.tsx
git commit -m "feat: style collapsed stack as equal-height segments"
```

## Task 5: Final verification in the real app

**Files:**
- Read-only check: `app/src/components/TaskItem.tsx`
- Read-only check: `app/src/styles/globals.css`
- Run: local dev app and static verifier

- [ ] **Step 1: Run the static verifier again before opening the app**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run verify:task-cluster-stack
```

Expected: PASS with `Task cluster stack verification passed`.

- [ ] **Step 2: Run the dev app and inspect two collapsed cases**

Run:

```bash
cd /g/Personal-AI/DailyTodo/app && npm run dev
```

In the running app, collapse:

- a task with exactly 2 subtasks,
- a task with 3 or more subtasks.

Expected visual result:

- the main collapsed parent card is opaque,
- 2 subtasks shows exactly 2 equal-height exposed bands,
- 3 or more subtasks shows exactly 3 equal-height exposed bands,
- there is no visible black outline on the exposed bands,
- the next task starts below the exposed bands instead of covering them.

- [ ] **Step 3: Commit the finished implementation if the visual pass matches the spec**

```bash
git add app/src/components/TaskItem.tsx app/src/styles/globals.css app/scripts/verify-task-cluster-stack.ts
git commit -m "fix: convert collapsed task stack to segmented base"
```
