# Task Menu Verifier Calibration Design

## Purpose

Restore `verify:cleanup-core` by aligning the task-menu structural verifier with the current ownership boundary, without changing runtime task-menu behavior.

## Context

`src/app/taskMenuActions.ts` owns application-level parsing of normalized task-menu actions and dispatches them as `addSubtask`, `delete`, `edit`, `update`, or `noop` actions.

`shared/taskMenuActionUpdates.ts` owns untrusted-payload normalization. It imports `isObjectRecord`, validates a non-empty `taskId`, and filters update fields to the shared allowlist.

The current verifier incorrectly requires `taskMenuActions.ts` itself to import `isObjectRecord` and retain a local `isTaskMenuActionPayload` guard. That requirement describes an older implementation and now fails even though the helper delegates correctly to the shared normalizer.

## Chosen Approach

Update `scripts/verify-app-task-menu-actions-module.ts` to assert the real module boundary:

- `taskMenuActions.ts` imports and uses `normalizeTaskMenuActionPayload` from the shared normalizer.
- `taskMenuActionUpdates.ts` imports and uses `isObjectRecord` for unknown-value narrowing.
- The shared normalizer validates a non-empty `taskId` and produces only object-shaped updates from the approved key set.
- `taskMenuActions.ts` remains responsible for special-action decoding, generic-update control-field removal, no-op handling, handler routing, and Electron listener registration.

## Scope

Only the focused verifier and planning records change in this phase. Runtime TypeScript modules, task-menu payload behavior, and localization content are out of scope.

## Validation

1. Add or adjust the focused structural assertions so they fail against the obsolete boundary and pass against the current shared-normalizer boundary.
2. Run `npm.cmd run verify:app-task-menu-actions-module`.
3. Run `npm.cmd run verify:cleanup-core`.
4. Run `npm.cmd run typecheck`.
5. Run `npm.cmd run build`.
6. Run `git diff --check` for the phase changes.

## Risks And Mitigations

The main risk is making a structural verifier too permissive. The replacement assertions preserve ownership checks at both sides of the boundary rather than merely removing the stale requirement. Runtime behavior is not modified, and aggregate verification confirms the calibration does not hide another regression.
