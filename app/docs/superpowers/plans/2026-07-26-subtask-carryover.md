# Subtask Carryover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve prior-day task history while creating clean next-day continuation parents that copy only incomplete direct subtasks and expose their source/progress when expanded.

**Architecture:** Extend the task schema with a validated, immutable subtask carryover snapshot. Broaden carryover eligibility at the parent boundary, create fresh child task instances during rollover, normalize the optional snapshot defensively, and include it in Obsidian sync equivalence. Pass application language from `TaskList` to the lazily loaded expanded subtask viewport, where a read-only localized notice renders ahead of the virtual child list.

**Tech Stack:** TypeScript, React 18, Framer Motion, Vitest, Electron IPC guards, existing task rollover/persistence modules.

---

## File Structure

- `src/types/task.ts`: renderer task contract and carryover snapshot type.
- `shared/taskValidation.ts`: persistence contract that continues accepting legacy tasks with malformed optional snapshots.
- `src/hooks/taskPersistenceTransforms.ts`: normalizes valid snapshots and strips invalid ones without discarding their task.
- `src/hooks/taskCarryover.ts`: selects eligible parents, generates continuation parent/subtask copies, and records the immutable snapshot.
- `electron/sharedTypes.ts`, `electron/obsidianSyncValidation.ts`, `electron/aiReviewTaskPayload.ts`: preserve the snapshot across renderer-to-main task payload validation.
- `src/hooks/taskObsidianSync.ts`: treats a changed snapshot as a selected-day sync change.
- `src/components/TaskList.tsx`, `src/components/TaskItem.tsx`, and `src/components/taskList/*`: route the selected app language to each task item in both static and drag-and-drop render paths.
- `src/components/taskItem/taskItemPresentation.tsx`: formats localized continuation metadata.
- `src/components/taskItem/TaskSubtasksViewport.tsx`: renders the expanded-only continuation notice before virtualized child rows.
- `src/styles/globals.css`: applies muted, non-interactive notice styling without changing card interaction geometry.
- `tests/taskCarryover.test.ts`: behavioral carryover and legacy normalization coverage.
- `tests/taskSubtaskCarryoverPresentation.test.tsx`: expanded viewport rendering and localization coverage.
- `tests/taskObsidianSync.test.ts`: sync-equivalence coverage for snapshot changes.
- `scripts/verify-task-carryover.ts`, `scripts/verify-task-item-subtasks-viewport.ts`, `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`: source-level contracts aligned with the new fields.

### Task 1: Add Carryover Regression Tests

**Files:**
- Modify: `tests/taskCarryover.test.ts`
- Modify: `scripts/verify-task-carryover.ts`

- [ ] **Step 1: Write a failing test for an incomplete parent that copies only eligible direct subtasks**

```ts
it('creates clean continuation children and records a source snapshot', () => {
  const source = task('parent', {
    text: 'Release checklist',
    subtasks: [task('done-child', { completed: true, parentTaskId: 'parent' }), task('open-child', { parentTaskId: 'parent' })],
  });

  const result = carryForwardTasks([source], '2026-07-21', {}, settings);
  const carried = result.tasks[0]!;

  expect(carried.text).toBe('Release checklist');
  expect(carried.completed).toBe(false);
  expect(carried.subtaskCarryoverProgress).toEqual({ total: 2, remaining: 1 });
  expect(carried.subtasks).toHaveLength(1);
  expect(carried.subtasks?.[0]).toMatchObject({ text: 'open-child', completed: false, taskDate: '2026-07-21', isToday: true, parentTaskId: carried.id });
  expect(carried.subtasks?.[0]?.id).not.toBe('open-child');
  expect(source.subtasks?.[1]?.id).toBe('open-child');
});
```

- [ ] **Step 2: Write failing tests for completed parents, partial child reviews, completed children, and idempotency**

```ts
it('continues a completed parent when a direct child remains eligible', () => {
  const result = carryForwardTasks([task('parent', { completed: true, subtasks: [task('open-child')] })], '2026-07-21', {}, settings);
  expect(result.tasks[0]).toMatchObject({ completed: false, subtaskCarryoverProgress: { total: 1, remaining: 1 } });
});

it('copies a partially completed child as incomplete work and skips a 100 percent child', () => {
  const partial = task('partial', { completed: true, completionReview: review(60) });
  const done = task('done', { completed: true, completionReview: review(100) });
  const result = carryForwardTasks([task('parent', { completed: true, subtasks: [partial, done] })], '2026-07-21', {}, settings);
  expect(result.tasks[0]?.subtasks?.map((child) => child.text)).toEqual(['partial']);
  expect(result.tasks[0]?.subtasks?.[0]?.completed).toBe(false);
});
```

- [ ] **Step 3: Run the focused test to verify it fails for missing child carryover behavior**

Run: `npm test -- --run tests/taskCarryover.test.ts`

Expected: FAIL because continuation tasks do not yet contain copied subtasks or `subtaskCarryoverProgress`.

### Task 2: Implement Continuation Copies

**Files:**
- Modify: `src/types/task.ts`
- Modify: `src/hooks/taskCarryover.ts`
- Modify: `tests/taskCarryover.test.ts`
- Modify: `scripts/verify-task-carryover.ts`

- [ ] **Step 1: Define the immutable snapshot type**

```ts
export interface SubtaskCarryoverProgress {
  total: number;
  remaining: number;
}

export interface Task {
  // existing fields
  subtaskCarryoverProgress?: SubtaskCarryoverProgress;
}
```

- [ ] **Step 2: Build fresh direct child copies before creating the parent**

```ts
function buildCarryoverSubtasks(task: Task, parentTaskId: string, targetDate: string) {
  return (task.subtasks || [])
    .filter(shouldCarryTaskForward)
    .map((subtask) => ({
      id: crypto.randomUUID(),
      text: subtask.text,
      completed: false,
      priority: subtask.priority,
      source: subtask.source,
      createdAt: new Date().toISOString(),
      taskDate: targetDate,
      isToday: true,
      parentTaskId,
      ...(subtask.handoff ? { carryoverContext: subtask.handoff } : {}),
    }));
}
```

- [ ] **Step 3: Broaden parent selection and create a clean parent title**

```ts
function shouldCarryParentForward(task: Task) {
  return shouldCarryTaskForward(task) || Boolean(task.subtasks?.some(shouldCarryTaskForward));
}

function buildCarryoverTask(task: Task, targetDate: string): Task {
  const id = crypto.randomUUID();
  const subtasks = buildCarryoverSubtasks(task, id, targetDate);
  return {
    id,
    text: task.text,
    completed: false,
    // existing provenance/context fields
    ...(subtasks.length ? { subtasks, subtaskCarryoverProgress: { total: task.subtasks?.length || 0, remaining: subtasks.length } } : {}),
  };
}
```

- [ ] **Step 4: Run focused behavior tests and source-level verification**

Run: `npm test -- --run tests/taskCarryover.test.ts && npm run verify:task-carryover && npm run verify:native-task-ids`

Expected: PASS; copied child IDs are fresh, existing source tasks remain unmodified, and repeated rollover produces one parent.

### Task 3: Persist and Validate Carryover Snapshots

**Files:**
- Modify: `shared/taskValidation.ts`
- Modify: `src/hooks/taskPersistenceTransforms.ts`
- Modify: `electron/sharedTypes.ts`
- Modify: `electron/obsidianSyncValidation.ts`
- Modify: `electron/aiReviewTaskPayload.ts`
- Modify: `tests/taskCarryover.test.ts`
- Modify: `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts`

- [ ] **Step 1: Write a failing normalization test for malformed optional snapshot metadata**

```ts
it('retains legacy tasks while stripping malformed carryover snapshots', () => {
  const [stored] = parseStoredTasks([{ ...baseTask, subtaskCarryoverProgress: { total: 2, remaining: 3 } }], '2026-07-20');
  expect(stored).toMatchObject({ id: baseTask.id, text: baseTask.text });
  expect(stored).not.toHaveProperty('subtaskCarryoverProgress');
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- --run tests/taskCarryover.test.ts`

Expected: FAIL because the stored snapshot remains unvalidated or is not typed.

- [ ] **Step 3: Add an optional structural guard that does not reject its enclosing task**

```ts
function isSubtaskCarryoverProgress(value: unknown): value is SubtaskCarryoverProgress {
  return isObjectRecord(value)
    && Number.isInteger(value.total) && value.total > 0
    && Number.isInteger(value.remaining) && value.remaining > 0
    && value.remaining <= value.total;
}
```

Use the guard in renderer normalization to retain only valid snapshots. Keep `isTaskLike` permissive for this optional field so legacy malformed metadata is stripped rather than making the complete task unreadable. Require valid snapshots in Electron IPC task guards whenever the field is present.

- [ ] **Step 4: Run persistence and IPC-focused verification**

Run: `npm test -- --run tests/taskCarryover.test.ts && npm run verify:task-persistence-transforms && npm run verify:electron-ai-review-daily-run-inspect-ipc-module`

Expected: PASS; valid snapshots survive task load and invalid optional values disappear while other legacy task data remains.

### Task 4: Sync Equivalence And Expanded Presentation

**Files:**
- Modify: `src/hooks/taskObsidianSync.ts`
- Create: `tests/taskObsidianSync.test.ts`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/taskList/TaskListContent.tsx`
- Modify: `src/components/taskList/TaskListStaticContent.tsx`
- Modify: `src/components/taskList/SortableTaskItem.tsx`
- Modify: `src/components/TaskItem.tsx`
- Modify: `src/components/taskItem/taskItemPresentation.tsx`
- Modify: `src/components/taskItem/TaskSubtasksViewport.tsx`
- Modify: `src/styles/globals.css`
- Create: `tests/taskSubtaskCarryoverPresentation.test.tsx`
- Modify: `scripts/verify-task-item-subtasks-viewport.ts`
- Modify: `scripts/verify-task-obsidian-sync.ts`

- [ ] **Step 1: Write failing sync-equivalence and viewport-rendering tests**

```ts
it('requires a sync when the carryover snapshot changes', () => {
  expect(areSelectedDailyNoteSyncInputsEquivalent(
    { ...input, tasks: [{ ...task, subtaskCarryoverProgress: { total: 3, remaining: 2 } }] },
    { ...input, tasks: [{ ...task, subtaskCarryoverProgress: { total: 3, remaining: 1 } }] },
  )).toBe(false);
});

it('renders localized continuation metadata above expanded subtask rows', () => {
  render(<TaskSubtasksViewport {...props} language="zh-CN" carriedFromDate="2026-07-20" subtaskCarryoverProgress={{ total: 3, remaining: 2 }} />);
  expect(screen.getByText(/承接自/)).toHaveTextContent('承接自 2026/7/20 · 剩余 2/3 项');
});
```

- [ ] **Step 2: Run focused tests to verify they fail**

Run: `npm test -- --run tests/taskObsidianSync.test.ts tests/taskSubtaskCarryoverPresentation.test.tsx`

Expected: FAIL because snapshots are ignored by equality and the viewport has no continuation notice props.

- [ ] **Step 3: Compare snapshot values in selected-day sync inputs**

```ts
function areSubtaskCarryoverProgressEqual(left: Task['subtaskCarryoverProgress'], right: Task['subtaskCarryoverProgress']) {
  return left === right || Boolean(left && right && left.total === right.total && left.remaining === right.remaining);
}
```

Call the helper inside `areTasksEquivalentForObsidianSync` before recursively comparing subtasks.

- [ ] **Step 4: Format and render localized metadata only inside the expanded viewport**

```ts
export function getSubtaskCarryoverNotice(language: AppLanguage, carriedFromDate: string | undefined, progress: Task['subtaskCarryoverProgress']) {
  if (!carriedFromDate || !progress) return undefined;
  const date = new Intl.DateTimeFormat(language, { year: 'numeric', month: 'numeric', day: 'numeric' }).format(new Date(`${carriedFromDate}T00:00:00`));
  return language === 'zh-CN'
    ? `\u627f\u63a5\u81ea ${date} \u00b7 \u5269\u4f59 ${progress.remaining}/${progress.total} \u9879`
    : `Continued from ${date} \u00b7 ${progress.remaining}/${progress.total} remaining`;
}
```

Thread `language` through `TaskList` content props into `TaskItem`, then pass the parent provenance/snapshot to `TaskSubtasksViewport`. Render a non-interactive `.task-subtask-carryover-notice` immediately before the virtual list only when the formatter returns text.

- [ ] **Step 5: Add muted responsive styles without card-like framing**

```css
.task-subtask-carryover-notice {
  padding: 0.2rem 0.72rem 0.1rem 1.55rem;
  color: var(--task-meta-color);
  font-size: 0.68rem;
  line-height: 1.35;
}
```

Use existing theme tokens or the local task metadata palette and add a dark-mode override only if it is needed for contrast.

- [ ] **Step 6: Run focused UI and sync verification**

Run: `npm test -- --run tests/taskObsidianSync.test.ts tests/taskSubtaskCarryoverPresentation.test.tsx && npm run verify:task-obsidian-sync && npm run verify:task-item-subtasks-viewport`

Expected: PASS; collapsed parents do not mount the viewport, and expanded parents alone show the notice.

### Task 5: Full Verification And Review

**Files:**
- Review: all files above

- [ ] **Step 1: Run the complete targeted verification set**

Run: `npm test -- --run tests/taskCarryover.test.ts tests/taskObsidianSync.test.ts tests/taskSubtaskCarryoverPresentation.test.tsx && npm run verify:task-carryover && npm run verify:native-task-ids && npm run verify:task-item-subtasks-viewport && npm run verify:task-persistence-transforms && npm run verify:task-obsidian-sync && npm run typecheck && npm run lint`

Expected: every command exits with code 0.

- [ ] **Step 2: Inspect the final diff against the approved design**

```bash
git diff --check
git diff -- src/types/task.ts src/hooks/taskCarryover.ts src/hooks/taskPersistenceTransforms.ts src/hooks/taskObsidianSync.ts src/components/TaskItem.tsx src/components/taskItem/TaskSubtasksViewport.tsx
git status --short
```

Confirm: no new task title suffixes, no settings toggle, no source tree mutation, direct children only, and no unrelated changes.

- [ ] **Step 3: Commit the implementation after fresh verification**

```bash
git add src shared electron tests scripts docs/superpowers/plans/2026-07-26-subtask-carryover.md
git commit -m "feat: carry forward incomplete subtasks"
```
