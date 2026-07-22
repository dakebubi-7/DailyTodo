# Daily Execution Focus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep DailyTodo's daily tasks as the complete task pool, while adding Today Focus, contextual next-day handoff, and AI handoff data that survives custom review-template changes.

**Architecture:** `Task` remains the only task model. Today Focus is an optional date-scoped projection of existing tasks rendered above the existing list. AI review Markdown stays user-template-controlled; a separate typed handoff record provides short progress, blocker, and next-step information without parsing Markdown.

**Tech Stack:** Electron 34, React 18, TypeScript, electron-store, Vitest, existing Obsidian and AI-review systems.

---

## Product Rules

1. Daily Tasks remain unchanged: they contain everything planned, captured, deferred, and completed for the day.
2. Today Focus selects 1-3 existing daily tasks; it is not another task list and does not replace priority.
3. Yesterday's unfinished focus becomes a carryover candidate with context, never an automatic focus task. The user confirms it for today.
4. Review Markdown is presentation data. A typed handoff is workflow data. Never extract next steps by parsing a user-customized template.
5. Ship manual Focus and rollover before AI suggestions, widget redesign, payment, or licensing.

## Data Contract

Modify `src/types/task.ts` to add optional fields:

```ts
export type FocusState = 'not-started' | 'in-progress' | 'blocked' | 'completed';

export interface TaskHandoff {
  status: 'done' | 'partial' | 'blocked' | 'in-progress';
  progressSummary: string;
  blocker: string;
  nextStep: string;
  shouldCarryForward: boolean;
  createdAt: string;
  source: 'manual' | 'ai';
}

interface Task {
  focusDate?: string;
  focusOrder?: number;
  focusState?: FocusState;
  focusReason?: string;
  nextStep?: string;
  handoff?: TaskHandoff;
  carryoverContext?: TaskHandoff;
}
```

`focusDate` is the only field that determines whether a task is focused for a date. `focusOrder` is meaningful only alongside it. `carryoverContext` is copied to a new carryover task; it does not mutate historical data. Existing stored tasks must load unchanged.

## File Boundaries

| File | Responsibility |
| --- | --- |
| `src/types/task.ts` | Focus and handoff contracts. |
| `src/hooks/taskPersistenceTransforms.ts` | Backward-compatible validation of optional task fields. |
| `src/hooks/taskFocus.ts` | Pure promote, demote, order, selection, and candidate helpers. |
| `src/hooks/taskCarryover.ts` | Contextual carryover without automatic focus promotion. |
| `src/hooks/taskSelectors.ts` | Derive focus tasks, normal task pool, and carryover candidates. |
| `src/hooks/taskTreeActions.ts`, `src/hooks/useTaskActions.ts` | Focus mutations through the current action layer. |
| `src/components/TodayFocusPanel.tsx` | Focus and carryover section above the existing task list. |
| `src/components/FocusTaskCard.tsx` | Reason, next step, state, and action display. |
| `src/components/TaskFocusEditor.tsx` | Focus details editor. |
| `shared/aiReview/handoff.ts` | Strict typed AI handoff parsing and prompt construction. |
| `electron/aiReview/runner.ts`, `electron/aiReviewDailyRunner.ts` | Separate, non-fatal handoff extraction. |
| `shared/obsidianDailyNoteRendering.ts` | Optional typed Focus export block. |

## Milestone 1: Data and Manual Focus

### Task 1: Add Task Metadata and Persistence Migration

**Files:** `src/types/task.ts`, `src/hooks/taskPersistenceTransforms.ts`, `tests/taskFocus.test.ts`

- [ ] Add failing tests for legacy task loading, valid focus data, invalid date/state removal, and malformed handoff removal.
- [ ] Run `npm test -- --run tests/taskFocus.test.ts`; confirm failure.
- [ ] Add `FocusState`, `TaskHandoff`, and optional `Task` fields.
- [ ] Extend the existing task normalizer with object guards and `isDateKey`; preserve legacy tasks and valid text as stored.
- [ ] Run `npm test -- --run tests/taskFocus.test.ts && npm run typecheck`; confirm pass.
- [ ] Commit: `feat: add task focus metadata`.

### Task 2: Build Pure Focus Helpers and Selectors

**Files:** Create `src/hooks/taskFocus.ts`; modify `src/hooks/taskSelectors.ts`; test `tests/taskFocus.test.ts`

- [ ] Add failing tests for `getFocusTasks`, `promoteTaskToFocus`, `demoteTaskFromFocus`, `reorderFocusTasks`, and `getCarryoverFocusCandidates`.
- [ ] Promotion must append after current focused items and set `focusState: 'not-started'`.
- [ ] Demotion must remove only focus fields and preserve handoff data.
- [ ] Candidates must be incomplete carryover tasks with non-empty `carryoverContext`, not tasks detected by title suffixes.
- [ ] Have `selectTaskViewState` return `focusTasks`, `taskPoolTasks`, and `carryoverFocusCandidates` while leaving `sortedTasks` available for compatibility.
- [ ] Run focused tests and `npm run typecheck`; commit `feat: add today focus selectors`.

### Task 3: Expose Focus Actions

**Files:** `src/hooks/taskTreeActions.ts`, `src/hooks/useTaskActions.ts`, `tests/taskFocus.test.ts`

- [ ] Add failing handler tests for promote, demote, reorder, and `updateFocusDetails`.
- [ ] Extend `TaskActions` with `promoteTaskToFocus(id)`, `demoteTaskFromFocus(id)`, `reorderFocusTasks(activeId, overId)`, and `updateFocusDetails(id, { focusReason, nextStep, focusState })`.
- [ ] Use `selectedDate` as the only focus date passed to mutations.
- [ ] Run focused tests and typecheck; commit `feat: expose today focus actions`.

## Milestone 2: Homepage With Both Daily Tasks and Focus

### Task 4: Render the Today Focus Panel

**Files:** Create `src/components/TodayFocusPanel.tsx`, `src/components/FocusTaskCard.tsx`, `src/components/TaskFocusEditor.tsx`; modify `src/components/AppMainContent.tsx`, `src/app/appShellMainContentComposition.tsx`, `src/hooks/useTasks.ts`; create `tests/todayFocusPanel.dom.test.tsx`

- [ ] Add DOM tests: panel renders before task list; empty state invites task selection; card shows title/reason/next step/state; editor updates details.
- [ ] Pass pre-derived tasks and callbacks into the panel; it must not read store state itself.
- [ ] Place panel after `AppTopContent` and before `TaskList`.
- [ ] Feed `taskPoolTasks` to `TaskList`, retaining filters, DnD, source grouping, subtasks, and the completed-review tab.
- [ ] Run `npm test -- --run tests/todayFocusPanel.dom.test.tsx && npm run typecheck && npm run lint`; commit `feat: add today focus panel`.

### Task 5: Confirm Yesterday's Focus Explicitly

**Files:** `src/components/TodayFocusPanel.tsx`, `src/components/FocusTaskCard.tsx`, `tests/todayFocusPanel.dom.test.tsx`

- [ ] Add DOM tests for three candidate actions: `Continue as today's focus`, `Keep in task pool`, and `Mark blocked`.
- [ ] `Continue` promotes the task and keeps its context visible.
- [ ] `Keep in task pool` dismisses only the suggestion and does not delete the task.
- [ ] `Mark blocked` requires explicit promotion and saves a short blocker or next step; it never silently alters a historical task.
- [ ] Add a `View yesterday's record` action that opens existing review history rather than copying a long review into the card.
- [ ] Run DOM tests and typecheck; commit `feat: add focus carryover confirmation`.

### Task 6: Add Promote and Demote to Existing Task Controls

**Files:** `src/components/TaskItem.tsx`, `src/components/taskItem/taskItemActionControls.tsx`, `src/app/taskMenuActions.ts`, `src/taskMenuView.tsx`, `shared/taskMenuActionUpdates.ts`, `tests/taskMenuActionUpdates.test.ts`, `tests/taskDialogs.dom.test.tsx`

- [ ] Add failing tests for typed `Set as today's focus` and `Remove from today's focus` actions.
- [ ] Keep existing menu actions intact and only show the inline control on hover/selection.
- [ ] Make availability depend on the selected date, so another date's focus state is not accidentally changed.
- [ ] Run task-menu tests and typecheck; commit `feat: manage today focus from task controls`.

## Milestone 3: Contextual Carryover

### Task 7: Carry Focus Context, Not Focus State

**Files:** `src/hooks/taskCarryover.ts`, `shared/taskRollover.ts`, `tests/taskCarryover.test.ts`

- [ ] Add failing tests for ordinary carryover compatibility, unfinished focus carryover, completed-task exclusion, and no auto-focus on the new task.
- [ ] If `handoff` exists, copy it into the new task's `carryoverContext`.
- [ ] Otherwise derive a manual context from the most recent completion review summary, blocker, and next step.
- [ ] Clear `focusDate`, `focusOrder`, `focusState`, `focusReason`, and `nextStep` on the newly created carryover task.
- [ ] Run `npm test -- --run tests/taskCarryover.test.ts && npm run typecheck`; commit `feat: carry focus context to the next day`.

## Milestone 4: AI Handoff That Ignores Review Templates

### Task 8: Define a Separate AI Handoff Protocol

**Files:** Create `shared/aiReview/handoff.ts`; modify `shared/aiReview/promptBuilder.ts`; create `tests/aiReviewHandoff.test.ts`

- [ ] Add failing parser tests for valid JSON, fenced JSON, missing fields, invalid status, overlong next step, and a review containing no JSON.
- [ ] Add `buildHandoffMessages` separate from `buildReviewMessages`.
- [ ] Require JSON only: `status`, `progressSummary`, `blocker`, `nextStep`, `shouldCarryForward`.
- [ ] Validate maximum lengths: progress 40 Chinese characters, blocker 60, next step 35.
- [ ] Reject vague next steps when `shouldCarryForward` is true; parser returns `undefined` and never throws.
- [ ] Run handoff tests and typecheck; commit `feat: add structured AI handoff protocol`.

### Task 9: Run and Review Handoffs Independently

**Files:** `electron/aiReview/runner.ts`, `electron/aiReviewDailyRunner.ts`, `electron/aiReviewTaskPayload.ts`, `electron/aiReviewIpc.ts`, `electron/preload.ts`, `src/vite-env.d.ts`, `tests/aiReviewDailyRunner.test.ts`, `tests/aiReviewHandoff.test.ts`

- [ ] Extend daily run results with non-fatal `handoffs: Array<{ taskId: string; handoff: TaskHandoff }>`.
- [ ] Generate review Markdown using the existing customizable templates unchanged.
- [ ] Make separate handoff calls only for incomplete focused tasks and carryover candidates, using typed task fields, last review, carryover context, and daily-note snapshot.
- [ ] Verify an extraction failure leaves Markdown generation and the user’s current `nextStep` untouched.
- [ ] Add typed IPC and renderer action `applyTaskHandoff(taskId, handoff)`.
- [ ] Run `npm test -- --run tests/aiReviewDailyRunner.test.ts tests/aiReviewHandoff.test.ts && npm run verify:ai-review && npm run typecheck`; commit `feat: return template-independent AI handoffs`.

### Task 10: Provide an Editable Manual Handoff Fallback

**Files:** Create `src/components/TaskHandoffDialog.tsx`; modify `src/app/appReviewDialogState.ts`, `src/app/appCompletionFlow.ts`, `src/components/TaskReviewDialog.tsx`; test `tests/taskDialogs.dom.test.tsx`

- [ ] Test editing, clearing a next step, choosing not to carry forward, and using the dialog with AI disabled.
- [ ] Display only short progress, blocker, next step, and carry-forward controls.
- [ ] Link to existing long review history; do not duplicate review Markdown in the dialog.
- [ ] On save, update `task.handoff`; update `task.nextStep` only if the user explicitly accepts it as the current focus next step.
- [ ] Run dialog tests, typecheck, and lint; commit `feat: review and edit task handoffs`.

## Milestone 5: Reuse Obsidian and Widget Assets

### Task 11: Export Optional Focus Block to Obsidian

**Files:** `shared/obsidianTemplateTaskLines.ts`, `shared/obsidianDailyNoteRendering.ts`, `shared/obsidianTemplateSettings.ts`, `tests/obsidianSyncRequest.test.ts`

- [ ] Add a `focusEnabled` and `focusSectionTitle` template setting with backward-compatible defaults.
- [ ] Render a managed `DAILYTODO:FOCUS` block before ordinary tasks when a task's `focusDate` matches the note date.
- [ ] Render task title, reason, next step, state, and optional carryover progress from typed fields only.
- [ ] Preserve existing task and completion-review export behavior.
- [ ] Run `npm test -- --run tests/obsidianSyncRequest.test.ts && npm run verify:obsidian && npm run typecheck`; commit `feat: export today focus to obsidian`.

### Task 12: Make Desktop Widget Focus-First Only After Loop Validation

**Files:** `electron/desktopWidgetState.ts`, `electron/desktopWidgetStateApplier.ts`, `electron/desktopWidgetState.verify.ts`

- [ ] Add tests selecting up to three focused tasks in focus order and falling back to the existing widget task projection when none exist.
- [ ] Display title, state, and one-line next step only; do not introduce focus management or AI chat into the widget.
- [ ] Preserve existing desktop-window and glass-fallback behavior.
- [ ] Run `npx tsx electron/desktopWidgetState.verify.ts && npm run typecheck`; commit `feat: prioritize today focus in widget`.

## Milestone 6: Beta and Commercial Decision

### Task 13: Validate the Daily Execution Loop

**Files:** Create `docs/daily-execution-beta.md`

- [ ] Recruit 10-20 independent developers for a six-week private beta.
- [ ] Record opt-in local aggregate events: daily open, 1-3 focus selection, carryover confirmation, focus completion, handoff save, and weekly-review generation.
- [ ] Consider early-bird Pro only when: 50% of active days have 1-3 Focus tasks; 35% of users complete Focus -> handoff -> next-day confirmation on three days; 25% use a weekly review/export; interviews report clearer starts or less lost context.
- [ ] Run the full release gate: focused Vitest suites, `npm run verify:task-ui`, `npm run verify:ai-review`, `npm run verify:obsidian`, `npm run typecheck`, and `npm run lint`.
- [ ] Commit: `docs: define daily execution beta gates`.

## Explicitly Deferred

- AI automatic prioritization and broad task reordering.
- Payment, licensing, entitlement enforcement, and pricing screens.
- Cloud sync, mobile apps, teams, shared calendars, and meeting scheduling.
- General AI chat workspace.
- Rewrites of the task tree, ordering, Obsidian sync engine, report templates, or desktop shell.

## Acceptance Criteria

1. A user can keep using Daily Tasks with no Focus selection and no regression.
2. A user can manually select, order, edit, complete, and demote 1-3 Focus tasks for a date.
3. Unfinished Focus work appears tomorrow as a contextual candidate, not an automatic Focus task.
4. Changing an AI review template cannot break handoff extraction or manual handoff editing.
5. Missing/invalid AI handoff cannot overwrite a user next step or stop review Markdown output.
6. Obsidian Focus export is optional and data-driven.
7. Widget changes come after the manual daily loop is validated.

## Self-Review

- Daily Tasks + Focus coexistence: Milestones 1-2.
- Yesterday-to-today context: Milestone 3.
- Custom-template-safe AI: Milestone 4.
- Existing Obsidian/widget assets: Milestone 5.
- Commercial validation before payment work: Milestone 6.
