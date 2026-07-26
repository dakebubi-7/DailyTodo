# DailyTodo Local Delete, Obsidian Archive Design

**Date:** 2026-07-26

## Goal

Keep Obsidian daily notes as a durable archive while allowing DailyTodo (DT) to clean its own active task data.

Deleting a task, subtask, or completion review in DT must remove it only from DT. A later DT-to-Obsidian sync must not remove the corresponding existing record from an Obsidian daily note.

## User-Facing Rules

1. Creating, editing, completing, reprioritizing, and adding or editing completion reviews in DT continues to update Obsidian through the existing automatic sync flow.
2. Deleting a task or subtask in DT removes it from every DT task view and from DT's active task data. The item remains available only as an internal Obsidian archive record.
3. Deleting a completion review in DT removes that review from DT's review view and task state. The deleted review remains in Obsidian after later DT syncs.
4. Obsidian is independently editable. To remove an archived task or review from Obsidian, the user deletes it in Obsidian.
5. If a record still exists in DT and the user deletes it from Obsidian manually, a later sync caused by a DT change writes the record back to Obsidian. DT remains the source of truth for non-deleted, active records.
6. Sync continues to update only DailyTodo-managed blocks. User-authored content outside those markers is not changed.

## Data Model

DT will persist a new local archive collection for deleted task records in addition to the existing retained deleted-review collection.

Each archived task record contains the full task snapshot at deletion time and its deletion timestamp. A task snapshot includes its subtasks and all completion reviews, so deleting a parent retains the complete historical tree for Obsidian synchronization.

The existing retained review collection continues to represent individual reviews deleted from still-active tasks. Its semantics become unconditional: it always retains the deleted review for Obsidian sync, rather than depending on a settings flag.

Archived task records and retained reviews are internal sync inputs only. They never feed the task list, date navigator task counts, review view, task search, or task commands.

## Deletion Flow

### Task and Subtask Deletion

Before removing a task from `allTasks`, DT finds its current tree node and saves its complete snapshot into the deleted-task archive. It then removes that node from `allTasks` using the existing tree mutation.

Deleting a parent records the parent once, including descendants. Deleting a subtask records only that subtask. Repeated deletion requests for the same task identity must not create duplicate archived records.

### Completion Review Deletion

Before removing a review from its task, DT retains that exact review with the relevant task snapshot. This happens regardless of any prior `syncDeletedReviewsToObsidian` setting.

Removing the last review continues to change the active DT task back to incomplete, as it does today. The archived review still remains available to the Obsidian sync projection.

## Obsidian Sync Projection

The sync projection combines, in this order:

1. Current DT tasks from `allTasks`.
2. Retained deleted reviews, merged into their active task where the task remains in DT, or emitted as an archived task when it does not.
3. Archived deleted tasks, preserving their task and review snapshots.

The projection must deduplicate by task ID. If an archived task and a current DT task share an ID, the current DT task is authoritative, with any retained deleted reviews merged into it. A task that was deleted from DT has no current counterpart and is emitted from its archived snapshot.

The existing date-planning logic continues to write the selected daily note and any affected task or review dates. Because deleted records remain in the projection, their previously written entries continue to be present in managed task blocks rather than disappearing during a later sync.

## Settings and Copy

`syncDeletedReviewsToObsidian` no longer controls behavior and is removed from the user-facing sync settings. The old persisted value may still be read during settings normalization for backward compatibility, but it does not alter deletion or sync behavior.

The confirmation setting remains as `confirmBeforeDeletingReview`, but its wording is local-only. It must say that deletion removes the review from DailyTodo and that Obsidian is not changed by this deletion.

Delete controls and confirmations for tasks should also state the local-only effect where appropriate, especially for destructive confirmation UI introduced in the future.

## Error Handling

If saving the local archived snapshot fails, DT must not remove the active task or review. In the current local-state architecture, persistence failures are surfaced through the existing storage error pathway; the mutation should maintain state consistency rather than create an untracked deletion.

An Obsidian sync failure does not restore a locally deleted record to DT. The archived snapshot remains persisted and will participate in the next successful sync.

## Tests

Focused tests will verify:

1. Deleting a task records its snapshot for Obsidian sync and removes it from active DT tasks.
2. Deleting a parent task retains nested subtasks and reviews without duplicate archive entries.
3. Deleting a subtask retains only the subtask snapshot.
4. Deleting a review always retains the review for Obsidian, including when the old setting is false or absent.
5. The sync projection includes archived tasks and retained reviews while UI selectors receive only active DT tasks.
6. A retained review merges into an active task and does not duplicate that task in the sync projection.
7. An archived task with no active counterpart is emitted to the sync projection.
8. Existing sync behavior for non-deletion edits, completions, and manually removed Obsidian entries remains intact: a current DT record is written again on a subsequent sync.
9. The sync settings UI no longer exposes the removed deleted-review synchronization toggle, while the review deletion confirmation preference remains available.

## History Visibility and Cleanup

The All and Review views are working surfaces, not the complete long-term archive. By default, each view shows records from the preceding three calendar months, inclusive of the current day.

The range is configurable in settings and applies independently to both views. The available choices are two months, three months, six months, all history, and a custom start date. The custom range includes records on or after the chosen local date. The setting is persisted locally and has no Obsidian effect.

All-task range filtering uses a task's effective task date. Review range filtering uses each review's review timestamp, so a task can remain visible in All while an older review is hidden from Review, or vice versa.

Each history view exposes a cleanup mode. When it is active, the user can select individual visible entries or select every currently filtered entry, then delete the selection after a clear local-only confirmation. Cleanup never includes records outside the active view, date range, search query, status filter, priority filter, or source filter.

Batch deletion uses the same local archive behavior as single deletion: it removes active records from DT and preserves their snapshots for later Obsidian synchronization. In the Review view, deleting a selected review removes that review only. In the All view, deleting a selected task removes that task tree. The controls show the selected count and remain disabled until at least one visible item is selected.

## Scope Boundaries

This change does not add a DT recycle bin, restore command, bidirectional Obsidian import, or synchronization of user edits outside DailyTodo-managed markers. Those are separate product decisions.
