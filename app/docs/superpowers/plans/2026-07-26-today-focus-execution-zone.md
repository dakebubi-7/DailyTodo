# Today Focus Execution Zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the toolbar-only Today Focus picker with a persistent current-day execution zone whose manual state controls stay synchronized with the underlying task.

**Architecture:** Keep focus membership, ordering, state transitions, and completion reconciliation as pure tree transformations in `shared/todayFocus.ts`. Expose narrow task-tree actions for focus state and normal completion, then make `TaskList` render either the execution zone or the existing bounded picker. The execution component owns only presentation and transient blocker-reason editing.

**Tech Stack:** React 18, TypeScript, Vitest, Testing Library, existing task tree utilities, existing global CSS.

---

## File Structure

- Modify: `shared/todayFocus.ts` - add validated state mutation, completion reconciliation, and active/next-step derivation helpers.
- Modify: `src/hooks/taskTreeActions.ts` - route normal task/subtask toggles and explicit focus-state changes through the shared focus rules.
- Modify: `src/hooks/useTaskActions.ts` - expose the new focus-state mutation action.
- Modify: `src/app/appShellCompositionInputs.ts` and `src/app/appShellMainContentComposition.tsx` - pass the focus-state action into `TaskList`.
- Modify: `src/components/TaskList.tsx` - render the persistent zone and keep the selection picker exclusively in adjustment mode.
- Create: `src/components/taskList/TodayFocusExecutionZone.tsx` - present progress, ordered focus tasks, state controls, and optional blocker reason.
- Modify: `src/components/taskList/TaskListToolbar.tsx` - remove the standalone Today Focus toolbar action.
- Modify: `src/i18n/shellTextEn.ts` and `src/i18n/shellTextZh.ts` - provide accessible labels for the execution zone and its state controls.
- Modify: `src/styles/globals.css` - style the compact zone, state controls, empty state, and narrow layouts in both themes.
- Modify: `tests/todayFocus.test.ts`, `tests/todayFocusActions.test.ts`, and `tests/taskListTodayFocusRequest.dom.test.tsx` - cover domain and action wiring.
- Create: `tests/todayFocusExecutionZone.dom.test.tsx` - cover visible execution-zone behavior and keyboard-accessible controls.

### Task 1: Add Focus State and Completion Domain Rules

**Files:**
- Modify: `shared/todayFocus.ts`
- Modify: `tests/todayFocus.test.ts`

- [ ] **Step 1: Write failing tests for manual focus state and completion reconciliation**

Add tests that call the following new functions with a top-level task and a nested subtask:

```ts
const result = applyTodayFocusState(tasks, '2026-07-26', 'second', 'in-progress');
expect(result.ok).toBe(true);
expect(getTodayFocusTasks(result.tasks, '2026-07-26')).toMatchObject([
  { id: 'first', focusState: 'not-started' },
  { id: 'second', focusState: 'in-progress' },
]);

const completed = reconcileTodayFocusCompletion(result.tasks, '2026-07-26', 'second', true);
expect(getTodayFocusTasks(completed, '2026-07-26')[1]).toMatchObject({
  id: 'second', focusState: 'completed',
});

const reopened = reconcileTodayFocusCompletion(completed, '2026-07-26', 'second', false);
expect(getTodayFocusTasks(reopened, '2026-07-26')[1]).toMatchObject({
  id: 'second', focusState: 'not-started',
});
```

Add cases for an optional blocked reason, clearing the reason when leaving `blocked`, rejecting an id outside the selected date's focus set, and retaining only one `in-progress` task.

- [ ] **Step 2: Run the domain test to verify RED**

Run: `npm test -- --run tests/todayFocus.test.ts`

Expected: FAIL because `applyTodayFocusState` and `reconcileTodayFocusCompletion` do not exist.

- [ ] **Step 3: Implement pure focus update helpers**

In `shared/todayFocus.ts`, export the following contract:

```ts
export type TodayFocusStateResult<T extends TodayFocusTask> =
  | { ok: true; tasks: T[] }
  | { ok: false; reason: 'invalid-date' | 'task-unavailable'; tasks: T[] };

export function applyTodayFocusState<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  taskId: string,
  state: TodayFocusState,
  reason?: string,
): TodayFocusStateResult<T>;

export function reconcileTodayFocusCompletion<T extends TodayFocusTask>(
  tasks: T[],
  date: string,
  taskId: string,
  completed: boolean,
): T[];

export function getTodayFocusExecution<T extends TodayFocusTask>(tasks: T[], date: string): {
  tasks: T[];
  completedCount: number;
  activeTaskId?: string;
  nextTaskId?: string;
};
```

`applyTodayFocusState` must reject non-focus or wrong-date ids without mutation; trim the optional blocker reason; remove a reason for every non-blocked state; set other focused tasks on the date from `in-progress` to `not-started` before setting the requested task active; and preserve all unrelated metadata and nested tree identity. `reconcileTodayFocusCompletion` updates only a focused task on the supplied date to `completed` or `not-started`. `getTodayFocusExecution` selects the earliest ordered `in-progress` task as active, otherwise the earliest incomplete task as next, and never auto-promotes it to active.

- [ ] **Step 4: Run the domain test to verify GREEN**

Run: `npm test -- --run tests/todayFocus.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the domain slice**

```bash
git add shared/todayFocus.ts tests/todayFocus.test.ts
git commit -m "feat: add today focus state transitions"
```

### Task 2: Route Task Completion and Focus State Through One Action Layer

**Files:**
- Modify: `src/hooks/taskTreeActions.ts`
- Modify: `src/hooks/useTaskActions.ts`
- Modify: `src/app/appShellCompositionInputs.ts`
- Modify: `src/app/appShellMainContentComposition.tsx`
- Modify: `tests/todayFocusActions.test.ts`

- [ ] **Step 1: Write failing action tests**

Extend the task-tree harness with a focused task and assert both directions:

```ts
handlers.setTodayFocusState('first', 'blocked', 'Waiting for API access');
expect(getTasks()[0]).toMatchObject({
  id: 'first', focusState: 'blocked', focusReason: 'Waiting for API access', completed: false,
});

handlers.toggleTask('first');
expect(getTasks()[0]).toMatchObject({ id: 'first', completed: true, focusState: 'completed' });

handlers.toggleTask('first');
expect(getTasks()[0]).toMatchObject({ id: 'first', completed: false, focusState: 'not-started' });
```

Add a nested focused subtask case and assert that changing a second focus task to `in-progress` resets the first one.

- [ ] **Step 2: Run the action test to verify RED**

Run: `npm test -- --run tests/todayFocusActions.test.ts`

Expected: FAIL because `setTodayFocusState` is not exposed and normal toggles do not reconcile focus state.

- [ ] **Step 3: Implement task-tree action wiring**

Import `applyTodayFocusState` and `reconcileTodayFocusCompletion` in `src/hooks/taskTreeActions.ts`. Add a local completion helper so `toggleTask` and `toggleSubtask` first call `toggleTaskCompletion(task, timestamp)` and then reconcile the resulting `completed` field against `currentDate`:

```ts
function toggleTaskAndReconcileFocus(previous: Task[], id: string, timestamp: string, currentDate: string) {
  let nextCompleted: boolean | undefined;
  const toggled = mapTaskTree(previous, id, (task) => {
    const nextTask = toggleTaskCompletion(task, timestamp);
    nextCompleted = nextTask.completed;
    return nextTask;
  });
  return nextCompleted === undefined
    ? previous
    : reconcileTodayFocusCompletion(toggled, currentDate, id, nextCompleted);
}
```

Expose `setTodayFocusState(taskId, state, reason?)`, pass `currentDate`, and update the `TaskActions`, shell-input, and main-content composition types so `TaskList` receives the callback.

- [ ] **Step 4: Run the action test to verify GREEN**

Run: `npm test -- --run tests/todayFocusActions.test.ts tests/taskCompletionActions.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the action slice**

```bash
git add src/hooks/taskTreeActions.ts src/hooks/useTaskActions.ts src/app/appShellCompositionInputs.ts src/app/appShellMainContentComposition.tsx tests/todayFocusActions.test.ts
git commit -m "feat: synchronize focus state with task completion"
```

### Task 3: Build the Today Focus Execution Zone

**Files:**
- Create: `src/components/taskList/TodayFocusExecutionZone.tsx`
- Modify: `src/components/TaskList.tsx`
- Modify: `src/components/taskList/TaskListToolbar.tsx`
- Modify: `src/i18n/shellTextEn.ts`
- Modify: `src/i18n/shellTextZh.ts`
- Modify: `tests/taskListTodayFocusRequest.dom.test.tsx`
- Create: `tests/todayFocusExecutionZone.dom.test.tsx`

- [ ] **Step 1: Write failing execution-zone DOM tests**

Render focused tasks with one `in-progress`, one blocked task with a reason, and one completed task. Assert the progress count, active label, task-order labels, blocker reason, and accessible state selector. Fire a state selection and assert the passed callback:

```ts
fireEvent.change(screen.getByRole('combobox', { name: /State for Draft release/i }), {
  target: { value: 'blocked' },
});
expect(onStateChange).toHaveBeenCalledWith('draft-release', 'blocked', undefined);

fireEvent.change(screen.getByRole('textbox', { name: /Blocker reason for Draft release/i }), {
  target: { value: 'Missing final approval' },
});
fireEvent.blur(screen.getByRole('textbox', { name: /Blocker reason for Draft release/i }));
expect(onStateChange).toHaveBeenLastCalledWith('draft-release', 'blocked', 'Missing final approval');
```

Add a TaskList test that a context-menu request opens adjustment mode, and assert no Today Focus button remains in the toolbar.

- [ ] **Step 2: Run the DOM tests to verify RED**

Run: `npm test -- --run tests/todayFocusExecutionZone.dom.test.tsx tests/taskListTodayFocusRequest.dom.test.tsx`

Expected: FAIL because `TodayFocusExecutionZone` does not exist and `TaskList` has no focus-state callback.

- [ ] **Step 3: Implement the execution component and TaskList mode**

Create `TodayFocusExecutionZone` with this external interface:

```ts
interface TodayFocusExecutionZoneProps {
  focusTasks: Task[];
  activeTaskId?: string;
  nextTaskId?: string;
  completedCount: number;
  text: ReturnType<typeof getShellText>['app'];
  onAdjust: () => void;
  onStateChange: (taskId: string, state: FocusState, reason?: string) => void;
}
```

Render a compact `section` with a heading, a count such as `1 / 3`, an Adjust button, and a list. Use a native `select` for the four manual states. Show a controlled blocker-reason input only for `blocked`; call `onStateChange` on blur and on Enter. The empty state contains only the heading, short empty label, and Adjust action.

In `TaskList`, replace `isTodayFocusOpen` with `isTodayFocusAdjusting`. Always render the execution zone for the current date, pass `getTodayFocusExecution(allTasks, currentDate)`, and render `TodayFocusPanel` only while adjusting. Keep `todayFocusRequest` opening adjustment mode and preloading the current draft. Remove Today Focus props and button from `TaskListToolbar`.

Add English and Chinese text keys for Adjust, empty focus, active, next step, completed count, manual state labels, and blocker reason. Use ASCII source syntax for all new code and existing escaped Unicode style in `shellTextZh.ts` where necessary.

- [ ] **Step 4: Run the DOM tests to verify GREEN**

Run: `npm test -- --run tests/todayFocusExecutionZone.dom.test.tsx tests/taskListTodayFocusRequest.dom.test.tsx tests/todayFocusPanel.dom.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the UI slice**

```bash
git add src/components/taskList/TodayFocusExecutionZone.tsx src/components/TaskList.tsx src/components/taskList/TaskListToolbar.tsx src/i18n/shellTextEn.ts src/i18n/shellTextZh.ts tests/todayFocusExecutionZone.dom.test.tsx tests/taskListTodayFocusRequest.dom.test.tsx
git commit -m "feat: show today focus execution zone"
```

### Task 4: Style the Compact Execution Zone and Validate the Feature

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `tests/todayFocusExecutionZone.dom.test.tsx`

- [ ] **Step 1: Add a failing narrow-layout assertion**

Add a DOM assertion for the execution-zone class names that protect wrapping task titles and the stable state-control width:

```ts
expect(screen.getByText('Prepare release notes').closest('.today-focus-execution-item')).toHaveClass('today-focus-execution-item');
expect(screen.getByRole('combobox', { name: /State for Prepare release notes/i })).toHaveClass('today-focus-state-select');
```

- [ ] **Step 2: Run the focused UI test to verify RED**

Run: `npm test -- --run tests/todayFocusExecutionZone.dom.test.tsx`

Expected: FAIL until the stable component classes are present.

- [ ] **Step 3: Add theme-aware execution-zone styles**

In `src/styles/globals.css`, add styles adjacent to the existing `.today-focus-panel` block:

```css
.today-focus-execution-zone { display: grid; gap: 0.38rem; min-width: 0; border: 1px solid rgba(76, 91, 112, 0.14); border-radius: 0.52rem; background: rgba(255, 255, 255, 0.68); padding: 0.54rem 0.62rem; }
.today-focus-execution-item { display: grid; grid-template-columns: 1.5rem minmax(0, 1fr) auto; gap: 0.42rem; align-items: center; }
.today-focus-execution-title { min-width: 0; overflow-wrap: anywhere; }
.today-focus-state-select { width: 6.8rem; min-height: 1.8rem; }
```

Add dark-mode equivalents using the existing `--personal-secondary` convention. In an existing narrow container query, change focus rows to two grid rows so the state select remains visible and task text wraps. Do not add a card inside the execution zone.

- [ ] **Step 4: Run focused UI and static verification**

Run: `npm test -- --run tests/todayFocusExecutionZone.dom.test.tsx tests/todayFocusPanel.dom.test.tsx tests/taskListTodayFocusRequest.dom.test.tsx && npm run verify:task-list-interactions`

Expected: PASS.

- [ ] **Step 5: Run typecheck, lint, focused feature tests, and diff validation**

Run:

```bash
npm run typecheck
npm run lint
npm test -- --run tests/todayFocus.test.ts tests/todayFocusActions.test.ts tests/todayFocusExecutionZone.dom.test.tsx tests/todayFocusPanel.dom.test.tsx tests/taskListTodayFocusRequest.dom.test.tsx tests/taskCompletionActions.test.ts
git diff --check
```

Expected: every command exits with status `0`.

- [ ] **Step 6: Commit the validation slice**

```bash
git add src/styles/globals.css tests/todayFocusExecutionZone.dom.test.tsx
git commit -m "style: polish today focus execution zone"
```

## Final Requirements Audit

- [ ] Confirm the zone appears only for the current date, defaults to visible, and no toolbar-only focus control remains.
- [ ] Confirm the user can select up to three tasks in adjustment mode and selection order remains focus order.
- [ ] Confirm four manual states work, blocker reason is optional, and there can be only one active focus task.
- [ ] Confirm marking a focus task completed updates the original task, original task completion updates focus state, reopening resets focus state, and next task does not auto-start.
- [ ] Confirm light, dark, and narrow layouts have no text overlap or horizontal scrolling.
