# Today Focus Execution Zone Design

## Purpose

Reframe Today Focus from a toolbar-triggered selection form into a persistent, lightweight execution zone for the current day. It should answer three practical questions without duplicating the task list: what matters today, what should be advanced now, and what has moved forward.

## Scope

The feature applies only while viewing the current date. It retains the existing maximum of three focused tasks and uses the existing date-scoped focus metadata on `Task`: `focusDate`, `focusOrder`, `focusState`, and optional `focusReason`. Existing AI review fields, including `focusAction` and `focusAdoption`, remain compatible but are not given new behavior in this change.

## Experience

### Default execution zone

The task list shows a Today Focus zone above the normal task rows whenever the current date is selected.

- The header presents Today Focus, the completed-to-total count, and an Adjust action.
- A maximum of three focused tasks appear in `focusOrder` order.
- Each row shows its ordinal, task name, current manual state, and its task action control.
- The first incomplete task is marked as the current next step. If another task is manually marked `in-progress`, it is presented as the active task instead.
- A completed row remains visible for the day so progress is legible, but no longer becomes the current next step.
- An empty state has a direct action to enter adjustment mode.

The zone is compact, uses the existing neutral surface and accent color, and does not reproduce task priority, subtasks, dates, or the full task-list toolbar.

### Adjustment mode

Adjust replaces the display zone with the existing candidate picker. It accepts only incomplete, available tasks on the current date, preserves the three-task limit, and uses selection order as focus order. Saving returns to the execution zone; canceling restores the saved focus set. The toolbar no longer contains a standalone Today Focus button, avoiding the current disconnected entry point.

## Manual Focus State

Each focused task can be set manually to one of four states:

| State | Meaning | Completion effect |
| --- | --- | --- |
| `not-started` | Chosen for today but not begun. | Task remains open. |
| `in-progress` | The task currently being advanced. | Task remains open. |
| `blocked` | Work cannot continue for now. | Task remains open; a reason may be added. |
| `completed` | The focused task is finished. | The underlying task becomes completed. |

The state picker is local to each focus row. Setting `blocked` reveals an optional, short reason field. The state is saved even when no reason is supplied; clearing or changing away from `blocked` removes the reason.

The interface does not automatically mark the next focus task as `in-progress`. After the current task completes, the next unfinished task is promoted visually to the next step and waits for an explicit user action to begin it.

## Synchronization Rules

Task completion remains single-source-of-truth behavior:

1. Setting a focus item to `completed` invokes the same completion update as checking its original task row. Both surfaces become complete.
2. Completing a focused task from the normal task list sets that focus entry to `completed` and refreshes the execution-zone progress.
3. Reopening a completed focused task from the normal task list sets its focus state to `not-started` unless the user subsequently chooses another manual state.
4. A focus state other than `completed` never overrides an already completed task. Completed tasks cannot be re-added through adjustment mode.
5. Any task deletion, clear/hide behavior, date change, or candidate invalidation removes or refreshes the associated focus entry through the existing selection validation path.

Only one focus item should normally be `in-progress`; choosing `in-progress` for a different focused task returns the previous active focus task to `not-started`. Multiple tasks may be blocked. If persisted legacy data contains multiple active tasks, the earliest `focusOrder` task is rendered active until the user changes a state.

## Data and Component Boundaries

`shared/todayFocus.ts` remains the focused-task domain module. It gains focused helpers for state transitions and reconciliation with task completion, keeping tree traversal and metadata normalization outside React components.

`TaskList` owns the display-versus-adjustment mode and derives the ordered focused tasks from all tasks for the current date. It passes explicit callbacks to two focused components:

- `TodayFocusExecutionZone`: renders the default display, state controls, optional blocker input, progress, empty state, and Adjust command.
- `TodayFocusPanel`: remains the bounded selection editor and retains save, clear, and cancel behavior.

The task mutation layer owns the persisted updates. It exposes narrow operations to change a focused task state and to reconcile focus metadata when generic task completion changes. Existing task-row completion mutations call the reconciliation operation so direct list interactions cannot diverge.

## Accessibility and Responsive Behavior

All state controls carry accessible names that include the task title and state. Keyboard users can open adjustment mode, select candidate tasks, operate the state picker, edit a blocker reason, save, and cancel. Escape cancels only the adjustment editor.

On narrow windows, focus rows preserve the ordinal and state control while task text wraps rather than overlapping. The zone remains a full-width, compact band above the scrollable list; it does not force horizontal scrolling.

## Failure Handling

Invalid focus updates do not partially modify the task tree. The UI retains the last saved focus state and does not imply success. A stale candidate, completed candidate, or selection over three follows existing validation and remains unavailable in the editor.

## Verification

Tests cover:

- ordered selection, the three-item limit, and current-date availability;
- each manual state transition, including single-active-task behavior and optional blocked reasons;
- completion synchronization from focus zone to task row and from task row to focus zone;
- reopening a completed focus task;
- next-step promotion without auto-starting it;
- adjustment save, clear, cancel, and empty state;
- DOM behavior for the execution zone and narrow layout-sensitive controls.

