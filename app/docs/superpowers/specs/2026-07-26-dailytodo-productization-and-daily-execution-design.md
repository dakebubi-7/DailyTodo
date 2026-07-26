# DailyTodo Productization and Daily Execution Design

**Status:** Approved product design; implementation has not started.

## 1. Purpose

This is the consolidated product plan for DailyTodo. It combines the earlier Windows productization plan with the approved daily-execution design:

- local reliability, recovery, and supportability;
- a deliberate one-to-three-task Today Focus commitment;
- next-business-day AI review based on the user's actual completion records;
- public stable-release readiness after local quality is proven.

DailyTodo remains a local-first Windows desktop application. AI is an optional enhancement layer: no task, completion record, backup, restore, or ordinary carryover flow may depend on AI availability.

## 2. Product Decisions Already Made

### Release Direction

- The intended public release is a stable release, but release work is not imminent. Local reliability and repeated validation come first.
- The current `DailyTodo-backup` repository remains private as the development/archive source.
- A separate, audited public `DailyTodo` repository will be created from a clean release snapshot only after the release gate is met.
- The public repository will use the MIT License.
- The first update experience, when release infrastructure exists, is user-initiated: the user checks for an update and explicitly confirms installation. Silent updates are out of scope.

### Backup and Restore

- DailyTodo has one simple backup-and-restore entry point rather than a visible backup-management system.
- At app startup, it creates at most one automatic local recovery point per calendar day and retains the newest three internally.
- The user may explicitly export a long-term backup copy.
- Backups contain DailyTodo's logical local state: tasks, task history, task ordering, local review records, settings, UI preferences, integrations, templates, and AI-review configuration.
- Backups exclude credentials and AI API keys, and never copy or overwrite an Obsidian vault.
- Restore validates the artifact before replacing data, creates a recovery point immediately before replacement, requires confirmation, and restarts the app on success.

### Window and Tray Behavior

- By default, both close and minimize hide DailyTodo to the system tray.
- The tray is the explicit route to quit.
- Settings retain an advanced close-to-exit option. Minimizing never exits the app.
- Existing close-to-tray preferences migrate without changing a user's current behavior.

### Today Focus

- Today Focus is a voluntary daily commitment, not a replacement for priority or the full task list.
- The user selects one to three existing tasks for the current business date.
- Priority expresses durable importance or urgency and can apply to many tasks. Today Focus expresses a specific promise for one day and is limited to one to three tasks.
- AI never chooses Today Focus automatically. The user can use AI context, but must explicitly select or confirm every focus task.
- Ordinary unfinished tasks carry over normally. They do not each demand a next-day decision or AI advice merely because they are unfinished.

## 3. Scope and Boundaries

### In Scope

1. Correct task-completion semantics and preserve the user's stage records.
2. Generate a next-day AI review from the user's latest completion-record content.
3. Let the user review, edit, and optionally adopt a task-specific AI action as Today Focus.
4. Keep task-row density and task-title width intact.
5. Add local data recovery, diagnostics access, and explicit Windows tray behavior.
6. Prepare an auditable path to a future public stable release.

### Explicitly Out of Scope for This Plan

- Accounts, cloud synchronization, shared workspaces, telemetry, or multi-device conflict resolution.
- Copying, backing up, restoring, or deleting external Obsidian vault content.
- Silent background updates.
- A permanent task-row button, icon, or expanded AI text for Today Focus.
- AI automatically rewriting task titles, auto-promoting priorities, or auto-selecting Today's Focus.
- Requiring AI to use DailyTodo's normal task, review, or backup features.

## 4. Current Baseline and Gaps

DailyTodo already has an Electron shell, system tray, settings, local diagnostics, NSIS packaging, AI Review, task carryover, completion-record fields, Obsidian integration, and structured AI handoff data.

The product work is targeted, not a rewrite. Important gaps are:

- A `partial` or `blocked` completion review can currently mark a task `completed`, which can make ongoing work disappear from ordinary carryover and AI handoff processing.
- The current handoff prompt receives the task title, a task-level next step, and previous carryover context, but not the user's latest completion percentage, summary, blocker, or next step.
- The current AI runner skips `completed` tasks, so a stage recorded as 70% complete can be omitted from the next-day review.
- Existing handoff suggestions are created from an AI Review action and are not yet a deliberate next-day task-page experience.
- Backup/restore, user-facing support paths, release hygiene, and update infrastructure are incomplete for a public stable release.

## 5. Daily Execution Design

### 5.1 Completion Records Are Evidence, Not a Task's Final State

The existing completion dialog remains the source of the user's factual record:

- completion status: `done`, `partial`, or `blocked`;
- percentage complete;
- today's progress summary;
- blockers or unknowns;
- the user's stated next step.

Each saved record is retained in the task's review history. A new record does not overwrite the evidence from an earlier stage.

The UI must distinguish "I recorded a work stage" from "this task is truly over":

| Completion record | Task outcome | Next-day treatment |
| --- | --- | --- |
| `done` and no next step | Task is finished and can be archived as completed. | Include only in the completion summary. |
| `partial` | Task stays open in the ordinary task pool. | Eligible for a task-specific AI suggestion. |
| `blocked` | Task stays open and is visibly blocked where status is shown. | Eligible for a task-specific AI suggestion. |
| `done` with a next step | The recorded stage is complete, but a possible continuation exists. The task is not automatically reopened. | Eligible for a task-specific AI suggestion and user decision. |

When the user adopts a continuation for a completed-stage task, DailyTodo reopens that existing task deliberately, keeps its completion-review history, and records the adopted action as the current focus action. Cancelling or ignoring the suggestion changes nothing.

### 5.2 What AI Receives

For each eligible task, the next-day review supplies structured context rather than asking the model to infer the work from a short title. The input includes:

- task title and current open/completed-stage state;
- the latest completion record's status and completion percentage;
- the user's progress summary;
- the user's blockers or unknowns;
- the user's stated next step;
- applicable previous carryover or handoff context;
- whether the task was Yesterday's Focus and remains unfinished.

The user's completion record is primary evidence. Existing task metadata and older handoffs are supporting context only.

### 5.3 AI Output Rules

Each eligible task receives an independent structured result:

- concise progress summary;
- concise blocker, when one is recorded;
- one optional suggested action;
- a carry-forward recommendation;
- provenance that identifies the source completion record and review run.

The model must:

- preserve the meaning of the user's stated next step;
- summarize and clarify, not invent facts or silently expand scope;
- avoid adding deliverables, tests, or technical steps not supported by the user's record;
- return no suggested action when the task is genuinely complete and has no continuation;
- keep one suggestion tied to one task, never combine multiple tasks into one fabricated action.

For example, if the user recorded "test environment startup fails" and "diagnose the startup error, then add login-flow tests", the AI may clarify the ordering, but it may not invent a new requirement such as verifying unrelated optimization outcomes.

### 5.4 Eligibility for Next-Day Suggestions

AI creates an optional suggestion only for:

1. tasks with a latest record of `partial`;
2. tasks with a latest record of `blocked`;
3. tasks whose latest stage is `done` but whose user record includes a meaningful next step;
4. Yesterday's Today Focus tasks that remain unfinished, including tasks that lack a new completion record but have existing carryover context.

Completed tasks with no next step appear only in the previous-day completion summary. Ordinary unfinished tasks remain in the normal task pool and are not automatically targeted merely because they carried over.

### 5.5 Generation Timing and Cost Control

The review concerns the prior business date and is generated as one daily batch, never separately every time a task is completed.

Opening the task page must not silently issue a model request or spend balance. Generation uses the user's already configured AI Review flow:

- when automatic daily generation is explicitly enabled, the scheduled or next-day daily run creates the batch;
- when it is not enabled, the user can initiate the same batch from the existing AI Review flow or the quiet next-day prompt;
- the task page observes the local result and shows the appropriate state; it is not itself a hidden billing trigger.

Each batch is keyed by source date and input-record revisions. It must be idempotent: a retry resumes unresolved items, preserves successful task results, and never produces duplicate suggestions for the same evidence.

### 5.6 AI Unavailable and Failure States

The user's local review records remain readable and actionable even if AI cannot run.

| Situation | Behavior |
| --- | --- |
| Balance insufficient, key missing, or account/configuration unavailable | Save and display the user's records. Do not automatically retry. Offer a user-initiated retry after configuration or balance is fixed. |
| Temporary network, timeout, or model-service failure | Attempt one quiet retry for that logical batch. If it also fails, stop and wait for the user's explicit retry. |
| Partial batch failure | Preserve already generated task suggestions and expose unresolved tasks without duplicating completed work. |
| Invalid AI response | Reject it, preserve source records, log a diagnostic, and allow a later retry. |

The UI language should be factual and non-alarming. Examples:

```text
Yesterday's records are saved. AI review is temporarily unavailable. [View] [Retry]
Yesterday's records are saved. AI review needs available balance. [View] [Retry after updating]
```

No failure may alter task status, Today Focus, ordinary carryover, or backup data. No failure may repeatedly spend balance through uncontrolled retries.

## 6. Task-Page Experience

### 6.1 Preserve Main Task Space

The main task list remains concise. No persistent button, focus label, AI icon, or full suggestion is added to ordinary task rows. Task-title width must remain unchanged outside a temporary selection mode.

Today Focus is reached from a compact top-level control and, secondarily, an accessible context-menu action. The top control opens a temporary selection mode or lightweight on-demand panel where the user chooses up to three existing tasks, then confirms or cancels. Keyboard and touch users must have equivalent access; hover-only controls are not acceptable for this core action.

### 6.2 Daily Prompt

On the first visit to the task page on a day, DailyTodo may show one compact, non-blocking line when there are actionable prior-day records or a review state that needs the user's attention:

```text
Yesterday's review is ready · 2 optional actions   [View]
```

It does not open a modal, does not expand automatically, does not play sound, and does not compress task rows. If the user has not viewed it, it stays as that quiet line for the remainder of the day. Viewing or dismissing it hides the prompt for that day. A new prompt can appear only for a new source date.

If no actionable continuation exists, DailyTodo does not show a next-day prompt. The completed summary remains available from the review area.

When AI is unavailable, the same one-line surface gives access to the saved human records and an explicit retry action. It must not pretend a review was generated.

### 6.3 Review Detail

Selecting `View` opens the review detail, not a long text block inside the task workspace. Suggestions are grouped by original task, never merged into a single synthetic to-do list.

Each task section shows:

```text
Task title

Your record
70% complete · Test environment startup fails
Next step: Diagnose the startup error, then add login-flow tests

AI suggested action
Fix the test-environment startup error first; after it works, add the login-flow tests.

[Adopt as Today Focus] [Edit before adopting]
```

The user's original record and the AI result remain separately visible. The user can view the source record even when no AI result exists.

### 6.4 Adopting a Suggested Action

`Adopt as Today Focus` opens a short confirmation surface. It contains a prefilled suggested action and offers:

- confirm unchanged;
- edit, then confirm;
- cancel.

Only confirmed text becomes the user's current focus action. The original completion record and AI wording remain immutable review evidence. Adoption records the source and time so the user can see whether the active wording came from the AI suggestion or was edited by the user.

The compact focus summary may expose the number of selected tasks and open the on-demand focus view, but it never becomes a large permanent panel. Full review prose stays in the review detail or its linked daily record.

## 7. Data, Migration, and Local APIs

### Data Principles

- Preserve all existing `completionReview` and `completionReviews` records.
- Keep existing task IDs when a user resumes a completed-stage task; do not lose history by creating a lookalike replacement task.
- Store suggested actions independently from a task's free-form `nextStep`, with provenance to the source date and completion-record revision.
- Store review-run state separately from the task so retry status, failure category, attempt count, and source-date idempotency are inspectable.
- Persist the user's final Today Focus wording separately from the AI suggestion, including whether the wording was adopted unchanged or edited.
- Validate every persisted structure at the Electron boundary and provide migrations from prior task settings/state.

### Required Main-Process Services

1. **Completion-state service:** applies the table in section 5.1 consistently for parent tasks and subtasks.
2. **Daily review source service:** selects the latest eligible evidence without changing task state.
3. **Daily review orchestration service:** creates idempotent batches, retries only as allowed, classifies failures, and persists individual outcomes.
4. **Focus service:** selects at most three tasks for a business date, records focus actions, promotes/reopens only after user confirmation, and never auto-selects a task.
5. **Backup service:** serializes redacted logical state to versioned artifacts, validates before restore, and owns recovery-point creation.
6. **Product paths and diagnostics service:** exposes safe folder-opening and support-bundle information without exposing secrets.

The renderer receives narrow IPC commands and validated results. It must not access raw Electron-store files, credentials, or filesystem locations directly.

## 8. Implementation Roadmap

### Phase 0: Baseline Protection and Product Data Contract

1. Inventory current persisted state, task flows, daily AI paths, tray behavior, and public-source hygiene risks.
2. Define versioned logical-state migration rules and backup artifact validation before altering task semantics.
3. Add focused tests for current task completion, carryover, AI handoff, persistence, and Obsidian synchronization behavior.
4. Preserve all active user and concurrent-work changes; no broad refactor is part of this phase.

**Exit criteria:** A testable schema/migration boundary exists, existing completion histories can be loaded, and a corrupted or incomplete persisted record cannot silently alter tasks.

### Phase 1: Local Recovery, Window Behavior, and Supportability

1. Implement the daily recovery-point and export/restore service with secret and Obsidian-vault exclusion.
2. Add restore preview, validation, pre-restore recovery snapshot, explicit confirmation, and restart-on-success.
3. Complete display-aware window recovery and make close/minimize-to-tray policy explicit while preserving existing preferences.
4. Expose product paths, diagnostics log access, and a concise support bundle entry through existing Settings/General surfaces.

**Exit criteria:** A user can recover task/settings state safely, no personal credentials or external vault contents enter a backup, the app remains recoverable after display changes, and tray quitting is unambiguous.

### Phase 2: Completion Semantics and Today Focus Foundation

1. Change completion persistence so `partial` and `blocked` save a review without falsely completing a task.
2. Preserve `done`-with-next-step as a completed stage and candidate continuation without auto-reopening it.
3. Add validated storage/migration for Today Focus membership, order, focus action, and adoption provenance.
4. Add a compact top-level focus entry, temporary selection mode, context-menu fallback, focus limit enforcement, and accessible selection behavior.

**Exit criteria:** A 70% partial task stays visible and carries forward normally; a blocked task remains actionable; a user can select one to three tasks without permanent task-row crowding; existing priority behavior is unchanged.

### Phase 3: Next-Day Review and Optional Suggested Actions

1. Feed the latest structured completion record into the AI handoff prompt and enforce the evidence-first output rules.
2. Build the persisted daily-batch state, eligibility filtering, provenance, idempotency, and controlled retry rules.
3. Integrate with the existing daily AI Review flow without making a task-page visit an implicit charged request.
4. Add the quiet first-visit prompt, per-task review detail, readable human-only state, and retry actions.
5. Add the confirmation/edit/cancel adoption flow and deliberate reopening for a completed-stage continuation.

**Exit criteria:** Suggestions stay tied to their source tasks; human records remain visible if AI fails; no duplicate suggestions are produced after retry; the user alone decides Today Focus; task-list width remains stable.

### Phase 4: Release Hygiene and Repeatable Windows Delivery

1. Remove committed development-machine paths and replace them with portable defaults, explicit configuration, or ignored local overrides.
2. Audit tracked files, imported history, build artifacts, and configuration for credentials, personal data, local paths, and private operational material.
3. Add reproducible Windows build verification, installer checks, version/release metadata, and a release checklist.
4. Run clean-machine installation, launch, restore, tray, AI-unavailable, and uninstall/reinstall acceptance tests.

**Exit criteria:** A clean audited snapshot can be created without exposing personal data; the NSIS installer works on a clean Windows machine; product data survives expected upgrade/reinstall scenarios as documented.

### Phase 5: Deferred Public Stable Release and Manual Updates

1. Create the new public `DailyTodo` repository only after Phase 4 passes.
2. Publish the MIT-licensed audited source and reproducible GitHub Release assets.
3. Introduce user-initiated update checks backed by the public release feed, with explicit installation confirmation.
4. Run the full public-release quality gate before marking any release stable.

**Exit criteria:** The user can install, recover, diagnose, and manually update DailyTodo without relying on the development environment or hidden background behavior.

## 9. Verification Strategy

### Automated Coverage

- Task-state tests: done, partial, blocked, done-with-next-step, reopen-on-adoption, subtasks, carryover, and history preservation.
- AI tests: evidence passed to prompts, output validation, task eligibility, one-task-one-suggestion association, invalid response handling, no hidden generation on task-page render, and retry idempotency.
- UI tests: focus limit, keyboard/context-menu entry, prompt dismissal for a single day, failure states, confirmation/edit/cancel adoption, and unchanged ordinary task-row layout.
- Backup tests: logical-state round trip, secret redaction, Obsidian exclusion, invalid artifact rejection, pre-restore recovery point, and schema migration.
- Electron tests: tray/window policy, diagnostics IPC validation, and restricted renderer APIs.
- Build checks: typecheck, lint, test suite, packaging verification, security scan, and portable environment checks.

### Manual Acceptance

1. Record a task as 70% partial with a blocker and next step; verify it remains open and is represented accurately in the next day's review.
2. Record a fully completed task with no next step; verify it is summarized but does not reappear as an action suggestion.
3. Record a completed stage with a next step; verify it is only reopened after the user adopts a continuation.
4. Exhaust AI balance or disable credentials; verify records remain visible, no task state changes, and no automatic retry occurs.
5. Simulate a temporary model/network fault; verify at most one quiet retry and no duplicated results.
6. Verify the prompt is quiet, non-modal, daily-dismissible, and does not reduce normal task-title width.
7. Restore a backup and verify validation, confirmation, pre-restore snapshot, redaction, and restart behavior.
8. Test close/minimize/tray behavior and display recovery on at least one clean Windows machine.

## 10. Public Stable Release Gate

DailyTodo is not ready for a public stable release until all of these are true:

- no known data-loss path in task completion, carryover, backup, or restore;
- recovery and manual support paths have been tested outside the development environment;
- AI failure and insufficient-balance behavior is calm, non-destructive, and repeatable;
- the task workspace remains efficient at normal usage density;
- the audited source snapshot has no personal paths, keys, private documents, or unsupported development defaults;
- the installer, clean-machine acceptance, and release checks pass from a reproducible build;
- update behavior is user-controlled and fully explained in product settings/release notes.

Until then, this is a local-stability roadmap, not a promise of immediate public publication.

## 11. Deferred Work

After the stable-release gate, evaluate rather than pre-commit to:

- update download automation after the user has opted in;
- code signing and reputation improvements;
- a privacy-preserving crash-reporting opt-in;
- richer support-bundle export;
- multi-platform packaging;
- cloud sync or account-backed services.

None of these may weaken the local-first, user-controlled decisions in this design.
