# Local Delete Archive and History Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep DT deletions local while projecting deleted snapshots to Obsidian, and make All and Review manageable through a configurable three-month history window and scoped cleanup.

**Architecture:** Store deleted task snapshots separately from active tasks. Build Obsidian sync input from active tasks, retained deleted reviews, and archived deleted tasks; UI selectors continue receiving active tasks only. Store one history-range setting in app behavior settings, apply it in pure selectors/grouping helpers, and expose cleanup mode at the view layer so only already visible records can be selected.

**Tech Stack:** React, TypeScript, Electron Store, existing `tsx` verification scripts, CSS modules through `src/styles/globals.css`.

---

### Task 1: Archive Deleted Task Snapshots

**Files:**
- Create: `shared/obsidianTaskArchive.ts`
- Modify: `src/hooks/taskPersistenceInitialization.ts`
- Modify: `src/hooks/taskPersistence.ts`
- Modify: `src/hooks/useTasks.ts`
- Modify: `src/hooks/useTaskActions.ts`
- Modify: `src/hooks/taskTreeActions.ts`
- Modify: `scripts/verify-task-tree-actions.ts`
- Create: `scripts/verify-obsidian-task-archive.ts`

- [ ] **Step 1: Write failing archive helper tests**

```ts
const archived = retainDeletedTask([], parent, '2026-07-26T09:00:00.000Z');
assert.equal(archived[0].task.subtasks?.[0].id, 'child-1');
assert.equal(retainDeletedTask(archived, parent).length, 1);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx scripts/verify-obsidian-task-archive.ts`

Expected: failure because `obsidianTaskArchive.ts` or `retainDeletedTask` does not exist.

- [ ] **Step 3: Add the smallest archive model and persistence boundary**

```ts
export interface ArchivedObsidianTask {
  task: Task;
  deletedAt: string;
}

export function retainDeletedTask(archive: ArchivedObsidianTask[], task: Task, deletedAt = new Date().toISOString()) {
  return archive.some((entry) => entry.task.id === task.id) ? archive : [...archive, { task, deletedAt }];
}
```

Add `ARCHIVED_OBSIDIAN_TASKS_KEY`, parsing, initialization state, and a setter. Pass the setter and persistence callback to tree actions. Find the live task before removal and archive it first; then remove it from the active tree.

- [ ] **Step 4: Run focused archive tests**

Run: `npx tsx scripts/verify-obsidian-task-archive.ts && npx tsx scripts/verify-task-tree-actions.ts`

Expected: both scripts exit `0`; parent and subtask deletions preserve exactly the deleted subtree in the archive.

### Task 2: Make Deletion Retention Unconditional in the Obsidian Projection

**Files:**
- Modify: `shared/obsidianReviewRetention.ts`
- Modify: `src/hooks/taskReviewMutations.ts`
- Modify: `src/hooks/taskCompletionActions.ts`
- Modify: `src/hooks/taskObsidianSync.ts`
- Modify: `src/hooks/useTaskObsidianSyncEffects.ts`
- Modify: `src/hooks/taskHookState.ts`
- Modify: `src/hooks/taskAppStateActions.ts`
- Modify: `src/hooks/useTaskActions.ts`
- Modify: `src/components/settings/SyncSettingsSection.tsx`
- Modify: `scripts/verify-task-completion-actions.ts`
- Modify: `scripts/verify-task-obsidian-sync.ts`
- Modify: `scripts/verify-settings-sync-section.ts`

- [ ] **Step 1: Write failing projection and review-deletion tests**

```ts
const tasks = buildObsidianSyncTasks({ allTasks: [], retainedObsidianReviews: [], archivedObsidianTasks: [{ task, deletedAt }], });
assert.equal(tasks[0].id, task.id);

actions.deleteTaskReview('task-1', 'review-1');
assert.equal(retainedReviews.length, 1);
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx tsx scripts/verify-task-obsidian-sync.ts && npx tsx scripts/verify-task-completion-actions.ts`

Expected: failure because archived tasks are not accepted by the projection and review retention still depends on a setting.

- [ ] **Step 3: Implement unconditional merge order**

```ts
export function buildObsidianSyncTasks({ allTasks, retainedObsidianReviews, archivedObsidianTasks }: BuildObsidianSyncTasksInput) {
  return mergeRetainedReviewsForObsidian(
    mergeArchivedTasksForObsidian(allTasks, archivedObsidianTasks),
    retainedObsidianReviews,
  );
}
```

Ensure merge helpers deduplicate by task id and active tasks win. Always retain a deleted review before removing it from the active task. Remove the obsolete deleted-review sync toggle from behavior comparisons, action cleanup, effect dependencies, and sync settings UI. Keep reading its persisted field only for backwards compatibility.

- [ ] **Step 4: Run focused sync and settings verification**

Run: `npx tsx scripts/verify-task-completion-actions.ts && npx tsx scripts/verify-task-obsidian-sync.ts && npx tsx scripts/verify-settings-sync-section.ts`

Expected: all scripts exit `0`; old setting cannot make a deleted record disappear from the sync projection.

### Task 3: Add Configurable History Range Selection

**Files:**
- Create: `src/hooks/taskHistoryRange.ts`
- Modify: `shared/appSettings.ts`
- Modify: `src/hooks/taskHookState.ts`
- Modify: `src/hooks/taskSelectors.ts`
- Modify: `src/hooks/useTasks.ts`
- Modify: `src/components/reviewView/reviewGrouping.ts`
- Modify: `src/components/ReviewView.tsx`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Modify: `src/i18n/shellTextZhSettings.ts`
- Modify: `src/i18n/shellTextEnSettings.ts`
- Create: `scripts/verify-task-history-range.ts`

- [ ] **Step 1: Write failing date-window tests**

```ts
assert.equal(getHistoryRangeStart('three-months', '2026-07-26'), '2026-05-01');
assert.equal(taskIsInHistoryRange({ taskDate: '2026-04-30' }, settings, '2026-07-26'), false);
assert.equal(reviewIsInHistoryRange('2026-05-01T00:00:00.000Z', settings, '2026-07-26'), true);
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx tsx scripts/verify-task-history-range.ts`

Expected: failure because history-range helpers and settings fields do not exist.

- [ ] **Step 3: Implement settings and pure filters**

```ts
export type TaskHistoryRange = 'two-months' | 'three-months' | 'six-months' | 'all' | 'custom';
export interface AppBehaviorSettings { taskHistoryRange: TaskHistoryRange; taskHistoryStartDate?: string; }
```

Default to `'three-months'`. Use first-day-of-month boundaries for fixed ranges and a validated local date for custom range. Apply the task predicate only for `activeTab === 'all'`; pass the review predicate to `buildReviewDateGroups` for Review. Render the setting in General settings with a native select and a conditional date input.

- [ ] **Step 4: Run focused range checks**

Run: `npx tsx scripts/verify-task-history-range.ts && npx tsc --noEmit -p tsconfig.json`

Expected: range calculations and selectors compile cleanly.

### Task 4: Add Scoped Batch Cleanup

**Files:**
- Create: `src/components/historyCleanup/historyCleanupSelection.ts`
- Create: `src/components/historyCleanup/HistoryCleanupToolbar.tsx`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/taskList/TaskListStaticContent.tsx`
- Modify: `src/components/taskList/TaskListContent.tsx`
- Modify: `src/components/TaskItem.tsx`
- Modify: `src/components/ReviewView.tsx`
- Modify: `src/components/reviewView/ReviewRecordBlock.tsx`
- Modify: `src/app/appShellMainContentComposition.tsx`
- Modify: `src/app/appShellCompositionInputs.ts`
- Modify: `src/app/useAppShellComposition.ts`
- Modify: `src/hooks/useTaskActions.ts`
- Modify: `src/styles/globals.css`
- Modify: `src/i18n/shellTextZhApp.ts`
- Modify: `src/i18n/shellTextEnApp.ts`
- Create: `scripts/verify-history-cleanup.ts`

- [ ] **Step 1: Write failing pure selection tests**

```ts
assert.deepEqual(toggleHistorySelection([], 'task-1'), ['task-1']);
assert.deepEqual(selectVisibleHistoryItems(['task-1', 'task-2']), ['task-1', 'task-2']);
assert.deepEqual(keepVisibleSelection(['task-1', 'task-3'], ['task-1']), ['task-1']);
```

- [ ] **Step 2: Run the selection test to verify it fails**

Run: `npx tsx scripts/verify-history-cleanup.ts`

Expected: failure because the history-cleanup selection helper does not exist.

- [ ] **Step 3: Implement selection and action routing**

```ts
deleteTasks(ids: string[]) {
  ids.forEach((id) => deleteTask(id));
}

deleteTaskReviews(records: Array<{ taskId: string; reviewId: string }>) {
  records.forEach(({ taskId, reviewId }) => deleteTaskReview(taskId, reviewId));
}
```

Enable cleanup only in All and Review. Give it an icon button with a tooltip, a select-visible checkbox, item checkboxes, selected count, cancel button, and a destructive command disabled at zero selected. Build selection IDs from the already filtered props; clear selections when the visible IDs change. Confirm once, with text that says the action removes only DT items and preserves existing Obsidian records.

- [ ] **Step 4: Run cleanup checks and renderer typecheck**

Run: `npx tsx scripts/verify-history-cleanup.ts && npm run verify:task-list-interactions && npx tsc --noEmit -p tsconfig.json`

Expected: cleanup cannot select hidden items, routes All through task deletion and Review through review deletion, and the UI compiles.

### Task 5: Verify End-to-End Behavior and Presentation

**Files:**
- Modify: `.planning/2026-07-26-local-delete-history-cleanup/task_plan.md`
- Modify: `.planning/2026-07-26-local-delete-history-cleanup/findings.md`
- Modify: `.planning/2026-07-26-local-delete-history-cleanup/progress.md`

- [ ] **Step 1: Run all affected verification scripts**

Run: `npm run verify:task-core && npx tsx scripts/verify-obsidian-task-archive.ts && npx tsx scripts/verify-task-history-range.ts && npx tsx scripts/verify-history-cleanup.ts && npm run typecheck`

Expected: exit code `0` for every command.

- [ ] **Step 2: Run the app and inspect the UI**

Run: `npm run dev`

Expected: the desktop window starts. Check All and Review at normal desktop width and a 375px narrow viewport, including opening the range setting and entering/leaving cleanup mode.

- [ ] **Step 3: Record final evidence**

Update the task plan and progress notes with command results, layout observations, modified files, and any remaining limitations.
