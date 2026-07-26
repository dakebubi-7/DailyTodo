# DailyTodo Productization and Daily Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the approved local-first DailyTodo product workflow: safe recovery and support paths, truthful completion state, manual Today Focus, and optional evidence-based next-day AI review.

**Architecture:** Keep task workflow data in validated renderer persistence, and keep backup, restore, diagnostics, and restart operations in narrow Electron main-process services. Add small, pure shared modules for completion semantics, Today Focus selection, next-day review batches, and backup artifact validation so the React UI and Electron IPC share one contract.

**Tech Stack:** Electron, electron-vite, React, TypeScript, Vitest, electron-store, existing structured verification scripts.

---

## File Structure

- Create: `shared/taskCompletionSemantics.ts` - maps an evidence record to task completion state.
- Create: `shared/todayFocus.ts` - validates, normalizes, and selects one to three daily focus entries.
- Create: `shared/dailyReview.ts` - validates persisted review batches, suggestions, provenance, eligibility, and idempotency.
- Create: `shared/localBackup.ts` - validates versioned logical backup artifacts and redacts credentials.
- Create: `electron/productPaths.ts` - owns local recovery, export, diagnostics, and support paths.
- Create: `electron/localBackupService.ts` - creates daily recovery points, exports, previews, and restores validated artifacts.
- Create: `electron/productSupportIpc.ts` - registers backup, restore, diagnostics, and product-path IPC handlers.
- Create: focused unit tests for each new shared module and Electron service.
- Modify: `src/types/task.ts`, `shared/taskValidation.ts`, persistence transforms, and carryover code - preserve task identity and completion evidence.
- Modify: existing AI handoff prompt/runner/settings composition - require explicit AI-assisted mode and include completion evidence.
- Modify: task-list composition and General/AI settings - surface compact Focus and recovery controls without widening task rows.
- Modify: `electron/preload.ts`, `src/vite-env.d.ts`, `src/store/electronApi.ts`, and main composition - expose restricted typed product APIs.
- Modify: `electron/appEnvironment.ts`, package/release docs, and verification scripts - remove portable-source hazards and document repeatable Windows verification.

## Task 1: Product Contracts and Completion Semantics

**Files:**
- Create: `tests/taskCompletionSemantics.test.ts`
- Create: `shared/taskCompletionSemantics.ts`
- Modify: `src/hooks/taskReviewMutations.ts`
- Modify: `src/hooks/taskCarryover.ts`
- Modify: `tests/taskCompletionActions.test.ts`

- [ ] **Step 1: Write failing completion-semantic tests**

Cover `done` as completed; `partial` and `blocked` as open; and a completed `done` record with a next step remaining completed until an explicit continuation is adopted.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/taskCompletionSemantics.test.ts`

- [ ] **Step 3: Add the pure completion-semantic helper**

Return the correct `completed` and `completedAt` fields from a task review while preserving all review evidence.

- [ ] **Step 4: Route completion mutations through the helper**

Use the helper from `appendCompletionReviewToTask` and make carryover naturally retain partial/blocked work.

- [ ] **Step 5: Run focused completion tests and verify GREEN**

Run: `npm test -- --run tests/taskCompletionSemantics.test.ts tests/taskCompletionActions.test.ts tests/taskCarryover.test.ts`

## Task 2: Today Focus Data and Manual Workflow

**Files:**
- Create: `tests/todayFocus.test.ts`
- Create: `shared/todayFocus.ts`
- Modify: `shared/appSettings.ts`
- Modify: `shared/taskValidation.ts`
- Modify: `src/types/task.ts`
- Modify: task persistence and task action wiring
- Modify: task-list composition and styles

- [ ] **Step 1: Write failing Today Focus unit tests**

Cover current-business-date membership, stable ordering, one-to-three selection, manual removal, and preserving normal task priority/carryover behavior.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/todayFocus.test.ts`

- [ ] **Step 3: Implement validated focus state and actions**

Persist focus membership/order separately from task titles and cap deliberate selection at three existing open tasks.

- [ ] **Step 4: Add compact task-workspace controls**

Add one top-level Focus entry and temporary selection mode plus accessible context-menu fallback. No permanent row action or task-title width loss is permitted.

- [ ] **Step 5: Run focused UI/data tests and typecheck**

Run: `npm test -- --run tests/todayFocus.test.ts tests/taskListToolbar.dom.test.tsx && npm run typecheck`

## Task 3: Optional Next-Day AI Review Batches

**Files:**
- Create: `tests/dailyReview.test.ts`
- Create: `shared/dailyReview.ts`
- Modify: `shared/aiReview/handoff.ts`
- Modify: `electron/aiReviewDailyRunner.ts`
- Modify: AI review settings and renderer persistence

- [ ] **Step 1: Write failing review-batch and prompt tests**

Cover evidence fields in the handoff prompt, only eligible source tasks, a single suggestion per task, disabled-mode blocking, retry idempotency, and no suggested action for a fully done task without continuation.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/dailyReview.test.ts tests/aiReviewHandoff.test.ts`

- [ ] **Step 3: Implement persisted review batches and suggestion provenance**

Store source date, source completion-review identity, attempt/failure state, suggestion, and adoption state independently from `Task.nextStep`.

- [ ] **Step 4: Upgrade prompt/runner evidence handling**

Pass the latest completion record, carryover context, and yesterday-focus fact to the handoff protocol. Enforce concise evidence-only output and retain human records on AI failure.

- [ ] **Step 5: Gate all task-page AI entry points behind AI-assisted review**

The default remains human-only. The task page observes stored results but does not make a chargeable request on render.

- [ ] **Step 6: Add quiet prompt/detail/adoption UI**

Provide daily dismissal, readable human-only state, retry only in enabled AI mode, and confirm/edit/cancel suggestion adoption. Reopen a completed stage only when the user deliberately adopts a continuation.

- [ ] **Step 7: Run focused AI and UI tests**

Run: `npm test -- --run tests/dailyReview.test.ts tests/aiReviewHandoff.test.ts tests/aiReviewDailyRunner.test.ts && npm run verify:ai-review`

## Task 4: Local Recovery, Restore, and Support Paths

**Files:**
- Create: `tests/localBackup.test.ts`
- Create: `shared/localBackup.ts`
- Create: `electron/productPaths.ts`
- Create: `electron/localBackupService.ts`
- Create: `electron/productSupportIpc.ts`
- Modify: Electron main/preload/API types/settings UI

- [ ] **Step 1: Write failing logical-backup tests**

Cover versioned round-trip data, credential redaction, Obsidian-content exclusion, invalid artifact rejection, daily retention of three recovery points, and pre-restore recovery behavior.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/localBackup.test.ts`

- [ ] **Step 3: Implement pure artifact serialization and validation**

Include logical DailyTodo state only; redact every provider/profile API key and retain configuration paths without copying external vault files.

- [ ] **Step 4: Implement main-process recovery/export/restore services**

Create at most one local recovery point per calendar day, retain the newest three, preview before restore, validate before replacement, write a pre-restore snapshot, request confirmation through the renderer, and relaunch only after success.

- [ ] **Step 5: Expose restricted typed IPC and General settings controls**

Add Export Backup, Restore Backup, product-data folder, diagnostics-log folder, and concise support summary actions to the existing General surface.

- [ ] **Step 6: Run focused recovery tests and typecheck**

Run: `npm test -- --run tests/localBackup.test.ts && npm run typecheck`

## Task 5: Window/Tray Policy and Portable Release Hygiene

**Files:**
- Modify: `shared/appSettings.ts`
- Modify: `electron/mainWindowEvents.ts`
- Modify: `electron/windowIpc.ts`
- Modify: `electron/appEnvironment.ts`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Create: release/support verification documentation and scripts

- [ ] **Step 1: Write failing settings/window-policy tests**

Cover migration from `minimizeToTrayOnClose`, default close/minimize hide-to-tray, close-to-exit override, and minimize never quitting.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- --run tests/windowState.test.ts tests/minimizeRecovery.test.ts`

- [ ] **Step 3: Implement the explicit tray policy**

Preserve existing behavior on migration, keep the tray as the explicit quit route by default, and expose only the advanced close-to-exit control.

- [ ] **Step 4: Remove committed machine-specific defaults**

Replace development paths with environment/configuration-based optional overrides, then update verification to enforce portable source.

- [ ] **Step 5: Add release and clean-machine checklists**

Document reproducible Windows packaging, installation, restore, tray, AI-disabled, uninstall/reinstall, and public-source audit gates. Do not add update delivery or a public repository in this phase.

- [ ] **Step 6: Run focused shell, security, lint, test, build-output verification**

Run: `npm run verify:window-mode && npm run verify:security && npm run lint && npm test && npm run verify:build-output`

## Task 6: Final Requirements Audit

- [ ] Re-read `docs/superpowers/specs/2026-07-26-dailytodo-productization-and-daily-execution-design.md` and map every in-scope non-deferred requirement to code, tests, or release documentation.
- [ ] Run the complete relevant verification suite from a fresh shell and inspect `git diff --check`.
- [ ] Record any clean-machine or installer steps that require a human-run Windows environment as explicit follow-up evidence rather than claiming them complete.
