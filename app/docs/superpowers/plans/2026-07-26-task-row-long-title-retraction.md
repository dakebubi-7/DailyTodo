# Task Row Long Title Retraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make main desktop task rows prioritize title readability at rest, then retract a long title to one ellipsized line while revealing drag, review, and delete controls on hover or keyboard focus.

**Architecture:** Preserve task data, callbacks, and action components. Add a presentation-only dual title layer in `TaskMainContent`, wrap the existing drag button in a collapsible slot, and append a late CSS layer for normal main task cards. At rest it frees both the drag column and the trailing action reservation; hover and `:focus-within` synchronize title retraction and control reveal.

**Tech Stack:** React 18, TypeScript, Framer Motion, CSS, Node `assert` source-verification scripts, npm.

---

## File Structure

- Modify: `src/components/taskItem/taskItemControls.tsx` - paired browse/active title layers and a collapsible drag slot.
- Modify: `src/components/TaskItem.tsx` - remove the obsolete leading spacer from normal rows.
- Modify: `src/styles/globals.css` - align main-row grid and append desktop-only stateful layout rules.
- Create: `scripts/verify-task-row-title-retraction.ts` - focused verification for markup, CSS, accessibility, and command registration.
- Modify: `scripts/verify-task-list-interactions.ts` - replace old permanent-safe-space assertions with the approved stateful model.
- Modify: `package.json` - register the focused verifier.
- Modify: `scripts/verify-cleanup-core.ts` - include the focused verifier in cleanup-core.

## Guardrails

1. Apply title retraction only to normal main rows, never to subtasks.
2. Keep completion, priority, review eligibility, delete callbacks, drag listeners, double-click editing, parent collapse, and right-click context-menu behavior unchanged.
3. Keep action buttons in the DOM when visually hidden. Do not use `display: none`, `visibility: hidden`, `aria-hidden`, or a changed tab order for review/delete controls.
4. Use the same `.task-card:not(.history-cleanup-task-card):is(:hover, :focus-within)` selector for the action width, drag reveal, action reveal, and one-line title state.
5. Scope desktop compression to `@media (hover: hover) and (pointer: fine)`. Touch/no-hover devices retain their current always-available controls.
6. Editing returns only `TaskEditInput`; it must not render a compressed title layer. Its focus should reserve the active action width through `:focus-within`.
7. Keep history-cleanup rows free of the normal action lane. Use reduced-motion rules to disable transition motion.

### Task 1: Create a Failing Focused Verifier

**Files:**
- Create: `scripts/verify-task-row-title-retraction.ts`
- Modify: `package.json`
- Modify: `scripts/verify-cleanup-core.ts`

- [ ] **Step 1: Write the failing source-level contract**

Create `scripts/verify-task-row-title-retraction.ts`:

```ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const controls = readFileSync(join(root, 'src/components/taskItem/taskItemControls.tsx'), 'utf8');
const actionControls = readFileSync(join(root, 'src/components/taskItem/taskItemActionControls.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};

assert.match(controls, /className="task-text task-text-browse"/, 'Main titles should expose a two-line browse layer.');
assert.match(controls, /className="task-text task-text-active"/, 'Main titles should expose a one-line active layer.');
assert.match(controls, /className="task-text-row"\s+title=\{getTaskTextTitle\(task\)\}\s+onDoubleClick=\{onStartEdit\}/s, 'The title row should preserve its tooltip and double-click editing entry point.');
assert.match(controls, /className="task-text task-text-active"\s+aria-hidden="true"/s, 'Decorative active copy must not duplicate the accessible task name.');
assert.match(controls, /className="task-drag-slot"/, 'The drag activator should use a collapsible layout slot.');
assert.doesNotMatch(taskItem, /task-cluster-main-spacer/, 'Main rows should not retain a blank leading spacer.');
assert.match(taskItem, /!isCleanupMode && \(\s*<TaskActionLayer/s, 'History-cleanup rows must keep omitting the normal action layer.');
assert.match(actionControls, /className="task-action-layer"/, 'The existing action component must retain action-layer ownership.');

assert.match(globals, /\.task-card-no-children \{\n  grid-template-columns: auto auto auto minmax\(0, 1fr\) !important;/, 'Main rows should use drag, completion, priority, and content columns.');
assert.match(globals, /\.task-card > \.task-text-wrap,\n\.task-card > \.task-edit-input \{\n  grid-column: 4 !important;/, 'Content and editing should occupy the fourth main-row grid column.');
assert.match(globals, /@media \(hover: hover\) and \(pointer: fine\) \{/, 'Retraction must be limited to precise-hover desktop devices.');
assert.match(globals, /\.task-card:not\(\.history-cleanup-task-card\):is\(:hover, :focus-within\) \{\n    --task-row-action-space: var\(--task-action-safe-space\);/, 'Hover and focus should reserve the action lane together.');
assert.match(globals, /\.task-card:not\(\.history-cleanup-task-card\) > \.task-action-layer \{\n    opacity: 0;\n    pointer-events: none;/, 'Idle actions should be hidden without leaving the DOM.');
assert.match(globals, /\.task-card:not\(\.history-cleanup-task-card\):is\(:hover, :focus-within\) > \.task-action-layer \{\n    opacity: 1;\n    pointer-events: auto;/, 'Hover and focus should make actions operable.');
assert.match(globals, /\.task-text-browse \{[\s\S]*?-webkit-line-clamp: 2;/, 'The browse layer should clamp to two lines.');
assert.match(globals, /\.task-text-active \{[\s\S]*?text-overflow: ellipsis;[\s\S]*?white-space: nowrap;/, 'The active layer should use a one-line ellipsis.');
assert.match(globals, /\.task-card:not\(\.history-cleanup-task-card\):is\(:hover, :focus-within\) \.task-text-row \{\n    height: 1\.25em;/, 'Active rows should visibly retract to one title line.');
assert.match(globals, /\.task-card\.history-cleanup-task-card \{\n  grid-template-columns: auto minmax\(0, 1fr\) !important;/, 'Cleanup rows should not reserve normal action space.');
assert.match(globals, /@media \(prefers-reduced-motion: reduce\) \{[\s\S]*?\.task-text-row,[\s\S]*?\.task-drag-slot,[\s\S]*?\.task-action-layer \{[\s\S]*?transition: none !important;/, 'Reduced-motion users should not receive retraction motion.');

assert.equal(packageJson.scripts['verify:task-row-title-retraction'], 'tsx scripts/verify-task-row-title-retraction.ts', 'package.json should expose the focused verifier.');
assertCleanupCoreIncludes('verify:task-row-title-retraction', 'cleanup-core should include the focused verifier.');

console.log('Task row title retraction verification passed');
```

- [ ] **Step 2: Register the verifier**

Add this command next to the other task-item verifier scripts in `package.json`:

```json
"verify:task-row-title-retraction": "tsx scripts/verify-task-row-title-retraction.ts"
```

Add this command to `cleanupCoreCommands` immediately after `"verify:task-item-action-controls-module",` in `scripts/verify-cleanup-core.ts`:

```ts
  "verify:task-row-title-retraction",
```

- [ ] **Step 3: Run the failing test**

Run:

```powershell
npm run verify:task-row-title-retraction
```

Expected: failure with `AssertionError` stating that the two-line browse layer does not exist yet.

- [ ] **Step 4: Commit the test contract**

```powershell
git add scripts/verify-task-row-title-retraction.ts package.json scripts/verify-cleanup-core.ts
git commit -m "test: specify task row title retraction"
```

### Task 2: Add Main-Row Presentation Structure

**Files:**
- Modify: `src/components/taskItem/taskItemControls.tsx:85-135`
- Modify: `src/components/TaskItem.tsx:168-180`
- Modify: `src/styles/globals.css:8206-8217,9340-9361`

- [ ] **Step 1: Give normal titles browse and active layers**

Replace the existing one-title span in `TaskMainContent` with this structure. Do not change the `isEditing` branch, tags, dates, `getTaskTextTitle`, or the `onStartEdit` prop type.

```tsx
<span className="task-text-wrap">
  <span
    className="task-text-row"
    title={getTaskTextTitle(task)}
    onDoubleClick={onStartEdit}
  >
    <span className="task-text task-text-browse">
      {task.text}
    </span>
    <span className="task-text task-text-active" aria-hidden="true">
      {task.text}
    </span>
  </span>
  {/* Keep the existing visibleTags and visibleScheduledDates rendering here. */}
</span>
```

The browse span remains exposed to assistive technology and provides the stable accessible task name, even while it is visually transparent in the active state. The active span is a decorative visual copy and must remain `aria-hidden`.

- [ ] **Step 2: Wrap the existing drag button in a shrinkable slot**

Replace the return structure of `DragHandleButton` with this wrapper, retaining every button prop and event handler inside it:

```tsx
return (
  <span className="task-drag-slot">
    <button
      type="button"
      ref={dragHandleProps?.setActivatorNodeRef}
      className="task-drag-handle"
      disabled={dragHandleProps?.disabled ?? true}
      aria-label={TASK_DRAG_HANDLE_LABEL}
      onClick={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      {...(dragHandleProps?.attributes || {})}
      {...(dragHandleProps?.listeners || {})}
      aria-disabled={dragHandleProps?.disabled ?? true}
    >
      <DragDotsIcon />
    </button>
  </span>
);
```

Do not mark `task-drag-slot` as `aria-hidden`; keyboard focus on the button must activate the row's `:focus-within` state before the user operates it.

- [ ] **Step 3: Remove the retired blank column**

Delete this JSX element from the normal-row fragment in `src/components/TaskItem.tsx`:

```tsx
<span className="task-cluster-main-spacer task-cluster-leading-spacer" aria-hidden="true" />
```

The normal in-flow child order becomes drag slot, completion action, priority wrapper, and task content. Do not move `TaskActionLayer`; it remains absolutely positioned and guarded by `!isCleanupMode`.

- [ ] **Step 4: Change the late main-row grid from five columns to four**

At both existing main-row grid declarations, replace:

```css
grid-template-columns: auto auto auto auto minmax(0, 1fr) !important;
```

with:

```css
grid-template-columns: auto auto auto minmax(0, 1fr) !important;
```

Replace the final child placement section with:

```css
.task-card > .task-text-wrap,
.task-card > .task-edit-input {
  grid-column: 4 !important;
  grid-row: 1 !important;
  align-self: center !important;
}

.task-card > .priority-dot-button,
.task-card > .task-complete-action,
.task-card > .task-tree-toggle,
.task-card > .task-tree-spacer,
.task-card > .task-drag-slot {
  grid-row: 1 !important;
  align-self: center !important;
}
```

Leave the historical tree selectors intact, but replace the direct-child `task-drag-handle` selector with `task-drag-slot`.

- [ ] **Step 5: Run the focused verifier**

Run:

```powershell
npm run verify:task-row-title-retraction
```

Expected: structural assertions pass; the command fails only on the missing desktop hover/focus CSS contract.

- [ ] **Step 6: Commit the presentation structure**

```powershell
git add src/components/taskItem/taskItemControls.tsx src/components/TaskItem.tsx src/styles/globals.css
git commit -m "feat: prepare task title retraction structure"
```

### Task 3: Implement Desktop Retraction CSS

**Files:**
- Modify: `src/styles/globals.css` (append after the current final task/history-cleanup layer)

- [ ] **Step 1: Append the stateful main-row CSS layer**

Append this exact CSS after the existing final rules so it wins over old compact, action-alignment, and padding declarations:

```css
/* 2026-07-26 main task title retraction: reclaim title width at rest on desktop. */
.task-drag-slot {
  display: inline-grid;
  width: 0.95rem;
  height: 1.5rem;
  place-items: center;
  overflow: hidden;
}

.task-card.history-cleanup-task-card {
  grid-template-columns: auto minmax(0, 1fr) !important;
  padding-right: 0.5rem !important;
}

.history-cleanup-task-card > .task-text-wrap,
.history-cleanup-task-card > .task-edit-input {
  grid-column: 2 !important;
}

.task-text-browse {
  display: block;
}

.task-text-active {
  display: none;
}

@media (hover: hover) and (pointer: fine) {
  .task-card:not(.history-cleanup-task-card) {
    --task-row-action-space: 0rem;
    column-gap: 0 !important;
    padding-right: calc(0.5rem + var(--task-row-action-space)) !important;
    transition: border-color 180ms ease, background 180ms ease, box-shadow 180ms ease, padding-right 180ms ease;
  }

  .task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) {
    --task-row-action-space: var(--task-action-safe-space);
  }

  .task-card:not(.history-cleanup-task-card) > .task-complete-action {
    margin-right: 0.32rem !important;
  }

  .task-card:not(.history-cleanup-task-card) > .task-priority-stop {
    margin-right: 0.32rem;
  }

  .task-card:not(.history-cleanup-task-card) > .task-drag-slot {
    width: 0;
    margin-right: 0;
    opacity: 0;
    transform: translateX(-0.3rem);
    transition: width 180ms ease, margin-right 180ms ease, opacity 120ms ease, transform 180ms ease;
  }

  .task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) > .task-drag-slot:has(.task-drag-handle:not(:disabled)) {
    width: 0.95rem;
    margin-right: 0.32rem;
    opacity: 1;
    transform: translateX(0);
  }

  .task-card:not(.history-cleanup-task-card) > .task-action-layer {
    opacity: 0;
    pointer-events: none;
    transform: translate(0.3rem, -50%) !important;
    transition: opacity 120ms ease, transform 180ms ease;
  }

  .task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) > .task-action-layer {
    opacity: 1;
    pointer-events: auto;
    transform: translateY(-50%) !important;
  }

  .task-card:not(.history-cleanup-task-card) .task-text-row {
    position: relative;
    display: grid;
    min-width: 0;
    height: 2.5em;
    overflow: hidden;
    transition: height 180ms ease;
  }

  .task-card:not(.history-cleanup-task-card) .task-text-browse,
  .task-card:not(.history-cleanup-task-card) .task-text-active {
    grid-area: 1 / 1;
    min-width: 0;
    transition: opacity 120ms ease, transform 180ms ease;
  }

  .task-card:not(.history-cleanup-task-card) .task-text-browse {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    white-space: normal !important;
    opacity: 1;
    transform: translateY(0);
  }

  .task-card:not(.history-cleanup-task-card) .task-text-active {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: 0;
    transform: translateY(0.55em);
  }

  .task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) .task-text-row {
    height: 1.25em;
  }

  .task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) .task-text-browse {
    opacity: 0;
    transform: translateY(-0.55em);
  }

  .task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) .task-text-active {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .task-card:not(.history-cleanup-task-card),
  .task-card:not(.history-cleanup-task-card) .task-text-row,
  .task-card:not(.history-cleanup-task-card) .task-text-browse,
  .task-card:not(.history-cleanup-task-card) .task-text-active,
  .task-card:not(.history-cleanup-task-card) .task-drag-slot,
  .task-card:not(.history-cleanup-task-card) > .task-action-layer {
    transition: none !important;
  }
}
```

Do not add a floating toolbar. Do not move review to the context menu. Do not apply this to `.task-subtask-row`.

- [ ] **Step 2: Verify state and precedence before running the script**

Confirm the block comes after CSS that sets `.task-card` right padding, `.task-action-layer` transforms, `.task-text` one-line truncation, and `.task-drag-handle` dimensions. Confirm `:focus-within` gives edit input, drag, review, and delete the active trailing action space before the focused item is operated.

- [ ] **Step 3: Run the focused verifier**

Run:

```powershell
npm run verify:task-row-title-retraction
```

Expected: `Task row title retraction verification passed`.

- [ ] **Step 4: Commit the interaction styling**

```powershell
git add src/styles/globals.css
git commit -m "feat: retract task titles for row actions"
```

### Task 4: Update Regression Verification and Run Automated Checks

**Files:**
- Modify: `scripts/verify-task-list-interactions.ts:324-390`

- [ ] **Step 1: Replace legacy permanent-space expectations**

Remove the assertions that require `task-cluster-main-spacer`, a permanent `--task-action-safe-space`, or five main-row columns. Add this exact assertion group in their place:

```ts
assert(taskItem.includes('<TaskActionLayer') && taskItemActionControls.includes('task-delete-zone') && taskItemActionControls.includes('task-action-layer'), 'TaskItem should preserve the extracted review/delete action layer.');
assert(!taskItem.includes('task-cluster-main-spacer'), 'Main task rows should not retain an empty leading spacer after the drag slot collapses.');
assert(taskItemControls.includes('task-drag-slot'), 'Main task drag handles should use a collapsible layout slot.');
assert(taskItemControls.includes('task-text-browse') && taskItemControls.includes('task-text-active'), 'Main task titles should provide browse and active presentation layers.');
assert(globals.includes('.task-card-no-children {\n  grid-template-columns: auto auto auto minmax(0, 1fr) !important;'), 'Main task rows should keep four in-flow grid columns.');
assert(globals.includes('@media (hover: hover) and (pointer: fine) {'), 'Title retraction should be limited to precise-hover desktop devices.');
assert(globals.includes('.task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) {\n    --task-row-action-space: var(--task-action-safe-space);'), 'Hover and keyboard focus should reveal action width together.');
assert(globals.includes('.task-card:not(.history-cleanup-task-card) > .task-action-layer {\n    opacity: 0;\n    pointer-events: none;'), 'Idle desktop actions should not receive pointer input.');
assert(globals.includes('.task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) > .task-action-layer {\n    opacity: 1;\n    pointer-events: auto;'), 'Hover and focus should reveal actionable controls.');
assert(globals.includes('.task-card:not(.history-cleanup-task-card):is(:hover, :focus-within) .task-text-row {\n    height: 1.25em;'), 'Active rows should retract titles to one line.');
assert(globals.includes('.task-card.history-cleanup-task-card {\n  grid-template-columns: auto minmax(0, 1fr) !important;'), 'History-cleanup rows should not reserve normal action space.');
```

Keep existing assertions for completion, priority, DnD collision rules, subtask controls, cluster semantics, context menu behavior, and memoization.

- [ ] **Step 2: Run focused checks**

Run:

```powershell
npm run verify:task-row-title-retraction
npm run verify:task-list-interactions
npm run verify:task-item-action-controls-module
npm run verify:task-action-alignment
npm run verify:task-layout-unified-glass
```

Expected: every command exits `0` and prints its existing pass message.

- [ ] **Step 3: Run broader static and unit checks**

Run:

```powershell
npm run typecheck
npm run lint
npm test
```

Expected: all commands exit `0`. Correct only failures introduced by this feature; do not alter unrelated dirty-worktree files.

- [ ] **Step 4: Commit the regression coverage update**

```powershell
git add scripts/verify-task-list-interactions.ts
git commit -m "test: cover task row title retraction"
```

### Task 5: Perform Manual UI Verification and Final Review

**Files:**
- Review: `src/components/TaskItem.tsx`
- Review: `src/components/taskItem/taskItemControls.tsx`
- Review: `src/components/taskItem/taskItemActionControls.tsx`
- Review: `src/styles/globals.css`
- Review: `scripts/verify-task-row-title-retraction.ts`
- Review: `scripts/verify-task-list-interactions.ts`
- Review: `package.json`
- Review: `scripts/verify-cleanup-core.ts`

- [ ] **Step 1: Verify the approved interaction in the running desktop app**

Use a main task title that needs more than two lines. At a desktop width, check:

1. Resting row shows completion, priority, and up to two title lines; drag/review/delete consume no title width.
2. Hover reveals drag and applicable review/delete controls; title visibly retracts to a single ellipsized line.
3. Pointer exit returns controls to hidden and restores the two-line title.
4. Tab through completion, priority, drag, review, and delete. Each is visible on focus and no child action toggles a parent task cluster.
5. Double-click title, verify useful edit width, submit with Enter, cancel with Escape, and confirm no title overlap.
6. Verify completion, priority change, drag reorder, review/backfill, delete, and right-click context menu retain current behavior.
7. Check completed, tagged, scheduled, parent, history-cleanup, narrow desktop, light/dark, and reduced-motion states for overlap, clipping, and blank action space.
8. Check a no-hover/touch viewport: controls remain reachable without a first tap merely to reveal them.

- [ ] **Step 2: Inspect the scoped diff and whitespace**

Run:

```powershell
git diff --check
git diff -- src/components/TaskItem.tsx src/components/taskItem/taskItemControls.tsx src/components/taskItem/taskItemActionControls.tsx src/styles/globals.css scripts/verify-task-row-title-retraction.ts scripts/verify-task-list-interactions.ts package.json scripts/verify-cleanup-core.ts
git status --short
```

Expected: no whitespace errors. The intended files change only presentation and verification; no task persistence, task data type, review storage, DnD engine, or unrelated user changes are staged.

- [ ] **Step 3: Re-run the final evidence set**

Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run verify:task-row-title-retraction
npm run verify:task-list-interactions
npm run verify:task-item-action-controls-module
npm run verify:task-action-alignment
npm run verify:task-layout-unified-glass
```

Expected: every command exits `0`.

- [ ] **Step 4: Create an isolated delivery commit only for remaining intended files**

```powershell
git add src/components/TaskItem.tsx src/components/taskItem/taskItemControls.tsx src/styles/globals.css scripts/verify-task-row-title-retraction.ts scripts/verify-task-list-interactions.ts package.json scripts/verify-cleanup-core.ts
git commit -m "feat: prioritize task titles until row interaction"
```

Do not stage unrelated paths shown by `git status --short`. Skip this commit step if Tasks 1-4 already committed every intended file and the worktree has no remaining intended changes.

## Plan Self-Review

### Spec Coverage

- Default checkbox, priority, and title-first browsing: Tasks 2 and 3 remove the spacer, collapse drag width, and eliminate idle action reservation.
- Two-line browsing and visible one-line retraction: Tasks 2 and 3 define paired title layers and the `2.5em` to `1.25em` transition.
- Hover and keyboard-focus reveal: Task 3 uses the same `:is(:hover, :focus-within)` trigger for drag, actions, spacing, and title state.
- Accessibility: Tasks 2 and 3 retain focusable buttons in DOM; Task 5 validates actual tab behavior.
- Edit, cleanup, touch, subtask, theme, and reduced-motion boundaries: Tasks 2-5 explicitly preserve and test them.
- Existing review/delete/drag behavior and context menu: component callbacks stay untouched and Task 5 checks all operations.

### Placeholder Scan

The plan names every modified file, selector, JSX structure, assertion, command, expected result, and commit scope. It contains no `TODO`, `TBD`, or unspecified testing step.

### Type and Naming Consistency

- `task-text-browse`, `task-text-active`, and `task-drag-slot` match across JSX, CSS, and verification.
- `--task-row-action-space` is local to the desktop presentation layer and resolves through existing `--task-action-safe-space`.
- No new task type, persisted field, callback signature, external dependency, or business state is introduced.
