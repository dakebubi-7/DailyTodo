# Card Base Accordion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make parent tasks with subtasks feel like the reference image: a tight card with a thin bottom-base accordion that stays close to the task row, opens to reveal subtasks, and leaves a faint base shadow after expansion.

**Architecture:** Keep the current `Task.collapsed` persistence and the existing parent-task click target. The implementation stays inside `TaskItem.tsx` and `globals.css`, with the regression script updated to pin the new structure and class names. The card-base illusion comes from a thin stacked layer under the parent card plus a tightly clipped subtask reveal animation; it is not a new data model or a single-open accordion.

**Tech Stack:** Electron, React 18, TypeScript, Framer Motion, global CSS, `tsx` verification scripts.

---

### Task 1: Lock the reference behavior in the regression script

**Files:**
- Modify: `app/scripts/verify-ui-feedback-regressions.ts`

- [ ] **Step 1: Add assertions for the parent card base and the subtask reveal wrapper**

Add these checks near the existing `taskItem` / `globals` accordion assertions:

```ts
expectIncludes(taskItem, 'className={`task-card-accordion-shell ${hasChildren ? 'task-card-accordion-shell-has-children' : ''} ${hasChildren && task.collapsed ? 'task-card-accordion-shell-collapsed' : ''} ${hasChildren && !task.collapsed ? 'task-card-accordion-shell-open' : ''}`', 'Parent tasks should expose open/collapsed shell states for the card-base accordion.');
expectIncludes(taskItem, 'className="task-card-accordion-shell-layers"', 'Collapsed parent tasks should render the thin stacked base layer.');
expectIncludes(taskItem, 'className="task-subtasks task-subtasks-nested task-subtasks-motion"', 'Expanded parent tasks should still render the subtask reveal wrapper.');
expectIncludes(taskItem, "initial={{ height: 0, opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0)' }}", 'Subtasks should enter from the card base with a clipped reveal motion.');
expectIncludes(globals, '.task-card-accordion-shell-collapsed {', 'Collapsed parent tasks should keep a visible thin base under the card.');
expectIncludes(globals, '.task-card-accordion-shell-open {', 'Expanded parent tasks should keep a faint base state after opening.');
expectIncludes(globals, '.task-card-accordion-shell-layers {', 'The stacked base layer needs dedicated layout styling.');
expectIncludes(globals, '.task-card-accordion-shell-layers > span:nth-child(1) {', 'The base layer should still render stacked page slices.');
expectIncludes(globals, '.task-subtasks-motion {', 'Subtask reveal animation should use an overflow-clipped motion wrapper.');
```

- [ ] **Step 2: Run the regression script and confirm the new assertions fail before implementation**

Run:

```bash
npm --prefix app run verify:ui-feedback-regressions
```

Expected: FAIL with one or more of the new assertion messages, because the current implementation does not yet match the final card-base behavior.

- [ ] **Step 3: Commit the guardrail update**

```bash
git add app/scripts/verify-ui-feedback-regressions.ts
git commit -m "test: pin card-base accordion regression checks"
```

### Task 2: Shape the parent-task shell in `TaskItem.tsx`

**Files:**
- Modify: `app/src/components/TaskItem.tsx`

- [ ] **Step 1: Preserve the existing parent click target, but split the shell into a top card and a bottom base layer**

Update the parent task rendering so the shell class includes the new collapsed/open states, and render the base layer only for parent tasks. The shell should stay in the same component; do not add new state. Use this structure around the parent task card:

```tsx
return (
  <span className="task-tree-node">
    <span
      className={`task-card-accordion-shell ${hasChildren ? 'task-card-accordion-shell-has-children' : ''} ${hasChildren && task.collapsed ? 'task-card-accordion-shell-collapsed' : ''} ${hasChildren && !task.collapsed ? 'task-card-accordion-shell-open' : ''}`}
      style={{ ['--accordion-layer-count' as const]: accordionLayerCount } as CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 48 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onContextMenu={...}
        className={`task-card group ${hasChildren ? 'task-card-has-children' : 'task-card-no-children'} ${hasTags ? 'task-card-has-tags' : 'task-card-no-tags'} ${canOpenReviewAction ? 'task-card-has-review-action' : 'task-card-no-review-action'} ${task.completed ? 'task-card-completed' : ''}`}
        data-priority={task.priority}
      >
        ...existing content...
      </motion.div>

      {hasChildren && (
        <span className="task-card-accordion-shell-layers" aria-hidden="true">
          {Array.from({ length: accordionLayerCount }).map((_, index) => (
            <span key={`accordion-layer-${task.id}-${index}`} />
          ))}
        </span>
      )}
    </span>

    <AnimatePresence initial={false}>
      {task.subtasks && task.subtasks.length > 0 && !task.collapsed && (
        <motion.span
          key={`task-subtasks-${task.id}`}
          id={`task-subtasks-${task.id}`}
          className="task-subtasks task-subtasks-nested task-subtasks-motion"
          aria-label="子任务"
          initial={{ height: 0, opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0)' }}
          animate={{ height: 'auto', opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
          exit={{ height: 0, opacity: 0, y: -8, clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
        >
          {renderSubtaskTree(task.subtasks, {
            depth: 1,
            onToggleSubtask,
            onDeleteSubtask,
            onToggleCollapse,
            onViewSubtaskReview,
          })}
        </motion.span>
      )}
    </AnimatePresence>
  </span>
);
```

Keep the existing parent click handling on the title/button area and preserve the current guard that prevents accidental toggles from action buttons.

- [ ] **Step 2: Keep the subtask container id stable and the subtask tree unchanged**

Do not change `renderSubtaskTree` logic, nested subtask toggles, or the action zones inside subtasks. The only animation change is the parent reveal wrapper above the subtask list.

- [ ] **Step 3: Commit the shell refactor**

```bash
git add app/src/components/TaskItem.tsx
git commit -m "feat: reshape parent task accordion shell"
```

### Task 3: Build the tight card-base styling in `globals.css`

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Replace the loose accordion spacing with a tight stacked base**

Update the parent shell styling so the base sits right under the card, not as a separate distant row:

```css
.task-tree-node {
  display: grid;
  gap: 0.18rem;
}

.task-subtask-popout-motion {
  display: block;
  will-change: transform, opacity;
}

.task-card-accordion-shell {
  --accordion-layer-count: 0;
  --accordion-max-layers: 4;
  position: relative;
  display: grid;
  padding-bottom: 0;
  margin-bottom: 0;
  overflow: visible;
}

.task-card-accordion-shell-has-children {
  margin-bottom: 0;
}

.task-card-accordion-shell-collapsed {
  padding-bottom: 0;
}

.task-card-accordion-shell-open {
  padding-bottom: 0;
}

.task-card-accordion-shell .task-card {
  position: relative;
  z-index: 2;
  transform: translateY(0.02rem);
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07);
}

.task-card-accordion-shell-layers {
  pointer-events: none;
  position: relative;
  z-index: 1;
  display: block;
  height: calc(1.72rem + (min(var(--accordion-layer-count), var(--accordion-max-layers)) - 1) * 0.28rem);
  margin-top: -0.68rem;
  overflow: visible;
}

.task-card-accordion-shell-layers > span {
  position: absolute;
  left: 0.35rem;
  right: 0.35rem;
  height: 1.72rem;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-top: 0;
  border-radius: 0 0 calc(var(--card-radius) * 0.92) calc(var(--card-radius) * 0.92);
  background: rgba(255, 255, 255, 0.16);
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.07);
  opacity: 0.72;
}

.task-card-accordion-shell-layers > span:nth-child(1) {
  top: 0.18rem;
}

.task-card-accordion-shell-layers > span:nth-child(2) {
  top: 0.46rem;
  left: 0.56rem;
  right: 0.56rem;
  opacity: 0.54;
}

.task-card-accordion-shell-layers > span:nth-child(3) {
  top: 0.74rem;
  left: 0.78rem;
  right: 0.78rem;
  opacity: 0.4;
}

.task-card-accordion-shell-layers > span:nth-child(4) {
  top: 1.02rem;
  left: 1rem;
  right: 1rem;
  opacity: 0.28;
}

.task-card-accordion-shell-open .task-card-accordion-shell-layers > span {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.62);
  opacity: 0.4;
}

.dark .task-card-accordion-shell-layers > span {
  border-color: rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.045);
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.2);
}

.dark .task-card-accordion-shell-open .task-card-accordion-shell-layers > span {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.14);
  opacity: 0.32;
}

.task-subtasks-motion {
  overflow: hidden;
  transform-origin: top;
  will-change: height, opacity, transform, clip-path;
}
```

Keep the existing subtask row styling, but make sure the new shell/base rules appear before the subtask styles so the stacking context is clear.

- [ ] **Step 2: Make the collapsed and open states visually distinct without adding extra distance**

Add a very subtle open-state lift to the base layer and a slightly more pronounced collapsed-state edge, but do not increase the gap between the card and the base.

```css
.task-card-accordion-shell-collapsed .task-card-accordion-shell-layers > span {
  background: rgba(255, 255, 255, 0.22);
  opacity: 0.68;
}

.task-card-accordion-shell-open .task-card-accordion-shell-layers > span:nth-child(1) {
  opacity: 0.28;
}
```

The intent is that the base is always present, but after expansion it becomes a faint remnant rather than a second full card.

- [ ] **Step 3: Commit the visual styling**

```bash
git add app/src/styles/globals.css
git commit -m "feat: add tight card-base accordion styling"
```

### Task 4: Verify the visual contract and type safety

**Files:**
- Modify: `app/scripts/verify-ui-feedback-regressions.ts`
- Verify: `app/src/components/TaskItem.tsx`
- Verify: `app/src/styles/globals.css`

- [ ] **Step 1: Run the regression script**

Run:

```bash
npm --prefix app run verify:ui-feedback-regressions
```

Expected: PASS and print:

```text
verify-ui-feedback-regressions passed
```

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm --prefix app run typecheck
```

Expected: exit code 0 with no TypeScript errors.

- [ ] **Step 3: Commit the verification pass**

```bash
git add app/scripts/verify-ui-feedback-regressions.ts app/src/components/TaskItem.tsx app/src/styles/globals.css
git commit -m "test: verify card-base accordion implementation"
```

## Self-Review Checklist

Before implementation begins, confirm the plan covers the spec:

- The plan keeps `Task.collapsed` and `toggleTaskCollapse(taskId)` intact.
- The plan keeps the parent click target on the task body, not on a global accordion mode.
- The plan makes the base layer tight to the card instead of leaving a large gap.
- The plan keeps the base visible in collapsed state and faintly visible in open state.
- The plan preserves subtask ids, nested subtask logic, and the existing action buttons.
- The plan includes regression checks and typecheck verification.

If any styling change drifts away from the reference image, update the CSS and regression assertions together so the implementation stays pinned to the intended card-base look.