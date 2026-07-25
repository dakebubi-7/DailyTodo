# Task Source Switching Design

## Goal

Allow a user to correct an existing top-level task that was created with the wrong source by switching it between Personal and External from the task context menu. The task must immediately appear in the matching source group and continue through the existing persistence and Obsidian sync flow.

## Scope

This change applies to existing top-level tasks opened from the task context menu.

- New-task source selection remains unchanged.
- The context menu gains a `Task type` item alongside the existing date, subtask, and tag controls.
- Selecting `Task type` opens a second pane with `Personal task` and `External task` choices.
- The current source is visibly selected and cannot be dispatched again.
- Selecting the other source sends a generic task update for only the parent task, then closes the menu.
- The changed task moves into the matching source group on the next render.
- Child tasks retain their current `source` fields. Changing a parent source does not recursively rewrite a task tree.

## Architecture

The task context menu already sends allowlisted partial task updates over IPC. `source` is already allowlisted by the shared payload normalizer, and the renderer task action layer already forwards generic partial updates to `updateTask`.

The implementation therefore adds a focused `source` menu pane and reuses the existing `dispatch(task.id, { source })` path. No task schema, persistence format, IPC channel, or synchronization logic changes are needed.

## Interaction Flow

1. The user right-clicks a task and selects `Task type`.
2. The source pane presents Personal task and External task.
3. The current source is marked selected and disabled.
4. The user selects the other source.
5. The popup dispatches `{ taskId, updates: { source } }` and closes.
6. The renderer applies the update to the selected task; its task-list derivation places it in the new group.
7. Existing local persistence and Obsidian synchronization observe the changed task list as they do for other task mutations.

## Error Handling

The context-menu IPC handler retains its existing validation boundary. Invalid payloads or values outside the shared update allowlist are rejected and the popup closes. The source pane only emits the `personal` and `external` union values, so it cannot produce another value through normal UI interaction.

## Testing

Focused tests cover:

- The menu action parser recognizes a source-only update and forwards `{ source }` through `updateTask`.
- The source pane exposes both supported source options, marks the current source selected, and dispatches only the changed source.
- Updating a top-level task source moves it to the expected task-list group without rewriting the source of its child task.

Run the focused tests, TypeScript check, lint, and the existing task UI verification after implementation.
