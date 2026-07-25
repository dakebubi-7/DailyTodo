# Subtask Carryover Design

## Goal

When automatic task carryover creates a next-business-day copy, preserve the previous day as an immutable record while creating a clean continuation task with only the incomplete subtask work. The continuation must communicate its origin and remaining subtask progress only after its subtask list is expanded.

## Scope

This change extends the existing automatic next-business-day carryover path for top-level tasks.

- A source top-level task is eligible when it is incomplete, or when it contains at least one subtask that should carry forward.
- A carryover parent is a new, incomplete task with a new ID and the existing `carriedFromDate` and `carriedFromTaskId` provenance fields.
- The carryover parent contains newly created copies of only source subtasks that should carry forward.
- Every copied subtask has a new ID, a `parentTaskId` pointing to the new parent, the target business date, and an incomplete state.
- A source subtask should carry forward when the shared `shouldCarryTaskForward` rule says it should: it is incomplete, or its latest completion review is below 100 percent.
- Completed subtasks with a 100 percent latest completion review remain only in the historical source task.
- The source task and its source subtasks are never modified.
- A task that has no subtasks retains the existing carryover behavior.

## Parent Eligibility

The current parent-level `shouldCarryTaskForward` rule is broadened only for candidate selection: a parent also qualifies when one or more direct subtasks qualify. This covers a completed parent whose remaining work lives in incomplete children.

The carryover parent is always incomplete. It is a new day-specific work instance, rather than an alteration of the previous day's completed state.

## Snapshot Metadata

The continuation parent stores optional, validated carryover progress metadata:

```ts
subtaskCarryoverProgress?: {
  total: number;
  remaining: number;
};
```

`total` is the number of direct subtasks on the source parent at the time of carryover. `remaining` is the number that were copied. This is a historical snapshot, not a live calculation; subsequent edits to either day do not rewrite it.

The metadata exists only when the source parent had subtasks and at least one was copied. It is persisted, normalized defensively, and included in task-equivalence checks used by Obsidian synchronization.

## Presentation

The parent task title is never changed for new carryovers. In particular, the carryover implementation stops appending a textual `inherited from` suffix to the task text.

When a carryover parent with subtask progress metadata is expanded, the subtask viewport displays a muted read-only line above its copied subtasks:

```
Continued from <localized source date> · <remaining>/<total> remaining
```

The line is hidden while the task is collapsed. It is not a user setting in this version because it is contextual provenance that is already scoped to an explicitly expanded task.

Existing task titles that already contain a legacy inherited-from suffix are not changed automatically.

## Deduplication And Chained Carryover

The existing carryover ledger and `carriedFromTaskId` target-date index remain the source of idempotency. A given source parent creates no more than one carryover parent for a target date, including when the app starts repeatedly or the business-date effect runs more than once.

On another unfinished day, the prior continuation becomes the source. Its remaining subtasks are copied with fresh IDs again, and its recorded snapshot remains unchanged. There is no cross-day synchronization between task instances.

## Error Handling And Compatibility

- Missing or malformed optional progress metadata is discarded during task normalization without rejecting an otherwise valid stored task.
- Legacy tasks without subtasks or carryover metadata remain valid and keep their current behavior.
- Nested subtasks are outside the current UI model and scope; the implementation processes direct children only.

## Testing

Focused tests cover:

- Existing no-subtask carryover behavior remains unchanged.
- An incomplete parent copies only its carry-forward-eligible direct subtasks, with fresh IDs and parent references.
- A completed parent with an eligible subtask still creates an incomplete continuation parent.
- Fully completed subtasks are not copied; partially completed subtasks are copied as incomplete work.
- The progress snapshot records the source total and copied remaining count, and invalid stored snapshots are removed safely.
- Repeating carryover for the same target date does not duplicate a parent or its copied subtasks.
- New carryover titles remain unchanged while the expanded subtask viewport renders the provenance/progress line only when metadata exists.

Run focused carryover and presentation tests, TypeScript checking, linting, and relevant task UI verification after implementation.
