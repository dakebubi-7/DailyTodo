# DailyTodo Codebase Map

This document is the current working map of the DailyTodo codebase. It focuses on where behavior lives, how data moves, and which files should be treated carefully during future cleanup.

## Product Shape

DailyTodo is an Electron desktop workflow app. The visible product is a small always-available task window, but the system now covers a larger loop:

- capture daily tasks, daily work notes, and inspiration notes;
- complete tasks with optional review records;
- carry unfinished work across business days;
- sync managed Markdown blocks into Obsidian;
- generate daily, weekly, monthly, and external reports with AI;
- run as a tray app with normal, pinned, and desktop-style window modes.

## Runtime Architecture

```text
React renderer
  src/App.tsx
  src/hooks/useTasks.ts
  src/components/*
        |
        | window.electronAPI
        v
Preload bridge
  electron/preload.ts
        |
        | ipcRenderer.invoke / ipcRenderer.on
        v
Electron main process
  electron/main.ts
  electron/aiReview/*
  electron/obsidianCompanion.ts
        |
        v
Local state and files
  electron-store config.json
  Obsidian vault Markdown files
```

Shared code under `shared/` is used by both renderer-facing code and the Electron main process. Keep those modules free of browser-only and Electron-only assumptions unless the import path already proves otherwise.

## Main Directories

### `src/`

Renderer code. React components, hooks, styles, task types, and UI utilities live here.

- `src/App.tsx`: top-level UI composition and cross-feature state wiring.
- `src/app/appViewportStyle.ts`: app-shell CSS variable construction for theme colors, glass opacity, blur, and radius tokens used by the viewport style prop.
- `src/hooks/useTasks.ts`: task state, persistence, date rollover, carryover, completion review mutation, Obsidian autosync trigger.
- `src/hooks/taskCarryover.ts`: task carry-forward creation, business-date normalization, and ledger updates for business-day rollover.
- `src/hooks/taskHookState.ts`: pure hook-side state decisions for initial sync status, selected-date rollover, incoming broadcast normalization, and settings-update cleanup rules.
- `src/hooks/taskMutations.ts`: pure task creation, text/field/collapse updates, completion, priority, clear-completed, review lookup/mutation, deleted-review retention, delete-review confirmation copy, and subtask mutation helpers used by `useTasks.ts`.
- `src/hooks/taskReviewMutations.ts`: pure completion-review mutation, lookup, deletion, deleted-review retention, and delete confirmation copy helpers re-exported by `taskMutations.ts` for compatibility.
- `src/hooks/taskObsidianSync.ts`: renderer-side Obsidian sync task merging, selected daily-note payload construction, and sync execution.
- `src/hooks/taskOrderingState.ts`: pure source and in-source task order state updates, plus task deletion order cleanup used by `useTasks.ts`.
- `src/hooks/taskPersistence.ts`: renderer task store keys, initial task state loading, and UI state persistence helpers.
- `src/hooks/taskSelectors.ts`: pure derived task view state for filtering, display sorting, date lists, counts, and selected-date command ordering.
- `src/hooks/taskTransforms.ts`: pure task date, normalization, and task-tree transform helpers used by `useTasks.ts`.
- `src/store/taskStore.ts`: renderer-side wrapper around `window.electronAPI`.
- `src/components/`: visible UI panels, task list, task item, settings, review dialogs, Obsidian companion panel.
- `src/components/settings/SettingsControls.tsx`: shared settings form controls used by the large settings panel.
- `src/components/settings/appearanceSettings.ts`: pure Appearance-tab helpers for theme recommendations, opacity fallback values, and unified glass-opacity updates.
- `src/components/settings/AiReviewSettingsWidgets.tsx`: AI review settings widgets and helpers, including account management UI, generation progress, diagnostics cards, and report date helpers.
- `src/components/settings/TemplatesSettingsSection.tsx`: template edit-entry settings tab.
- `src/components/settings/ScheduleSettingsSection.tsx`: rollover, auto carry-forward, and clear-completed settings tab.
- `src/components/settings/GeneralSettingsSection.tsx`: language, completion-record, startup, tray, and always-on-top settings tab.
- `src/components/dateNavigator/dateNavigatorUtils.ts`: pure date navigator helpers for date parsing, month-cell construction, daily task summaries, and heat-map backgrounds.
- `src/styles/`: global styles and theme-specific surfaces.
- `src/styles/index.css`: renderer style entry point. Add global style imports here instead of importing leaf CSS files from React components.
- `src/utils/taskTree.ts`: pure task-tree helpers for recursive lookup and subtask checks.
- `src/i18n.ts`: shell text for Chinese and English UI. This file currently contains visible mojibake in several strings and should be cleaned in a dedicated pass.

### `electron/`

Main process and preload code.

- `electron/main.ts`: app lifecycle, window/tray behavior, store, IPC handlers, Obsidian sync, AI report IPC, Windows native window handling.
- `electron/appIcons.ts`: app and tray icon path resolution, native image creation, and fallback icon data.
- `electron/windowState.ts`: persisted window bounds, compact/settings-mode sizing, and restored-state normalization.
- `electron/safeStore.ts`: safe Electron Store creation, with corrupt `config.json` backup and reset before retrying.
- `electron/diagnostics.ts`: diagnostic log path, append-only logger, crash reporter startup, and process-level error listeners.
- `electron/preload.ts`: exposes the IPC API as `window.electronAPI`.
- `electron/aiReview/`: report generation and daily review runner implementation.
- `electron/obsidianCompanion.ts`: companion sync planning/writing.
- `electron/*.verify.ts`: focused verification scripts for Electron-facing helpers.

### `shared/`

Cross-runtime business logic and schemas.

- `shared/appSettings.ts`: behavior settings and Obsidian template settings defaults/normalizers.
- `shared/taskRollover.ts`: business date and carry-forward rules.
- `shared/obsidianTemplates.ts`: Markdown marker rendering, task line rendering, managed block replacement, sync preview.
- `shared/aiReview/*`: AI review settings, prompt construction, source collection, stats, diagnostics, template recognition.
- `shared/llm/openaiClient.ts`: provider/client logic for AI model calls and model listing.
- `shared/windowMode.ts`: normal/onTop/desktop mode model.

### `scripts/`

Verification and development helper scripts. Most `verify:*` package scripts point here and test narrow behavior without launching the full UI.

Useful cleanup regression commands added during modularization:

- `npm run verify:cleanup-core`: task core, context menu, renderer route, style entry, App helper modules, and TypeScript checks.
- `npm run verify:settings-panel-modules`: ensures shared settings controls stay outside `SettingsPanel.tsx`.
- `npm run verify:electron-main-modules`: ensures icon helpers stay outside `electron/main.ts`.
- `npm run verify:electron-window-state-module`: ensures settings-mode/window-state helpers stay outside `electron/main.ts`.
- `npm run verify:electron-foundation-modules`: ensures safe store and diagnostic helpers stay outside `electron/main.ts`.
- `npm run verify:style-entry`: ensures global CSS imports are centralized.
- `npm run verify:app-viewport-style-module`: ensures app-shell style tokens stay in `src/app/appViewportStyle.ts`.
- `npm run verify:app-task-tree-module`: ensures task-tree helpers stay in `src/utils/taskTree.ts` and date shifting uses `shared/taskRollover.ts`.
- `npm run verify:date-navigator-module`: ensures date navigator pure helpers stay in `src/components/dateNavigator/dateNavigatorUtils.ts`.
- `npm run verify:settings-appearance-module`: ensures Appearance-tab pure helpers stay outside `SettingsPanel.tsx`.
- `npm run verify:settings-ai-review-module`: ensures AI review settings widgets stay outside `SettingsPanel.tsx`.

## Data Model

The current `Task` shape is defined in `src/types/task.ts`. Important fields:

- `id`, `text`, `completed`, `priority`, `createdAt`: base task data.
- `taskDate`: the logical business date the task belongs to.
- `source`: `personal` or `external`, used for grouping.
- `cleared`: hides completed tasks in the app without deleting them or removing them from Obsidian sync.
- `completionReview` and `completionReviews`: latest review and full review history.
- `subtasks`, `parentTaskId`, `collapsed`: nested task support.
- `scheduledDates`, `tags`: extended organization fields.

Task mutations should usually go through `useTasks.ts`, because that hook owns persistence, normalization, tree updates, and sync side effects.

## Storage Keys

Electron Store is created in `electron/main.ts`. Common keys include:

- `tasks`: all task data.
- `dailyWorkNotes`: daily work text keyed by date.
- `dailyInspirationNotes`: inspiration text keyed by date.
- `selectedDate`, `activeTab`, `lastActiveDay`: UI/date state.
- `taskCarryoverLedger`: prevents duplicate carry-forward copies.
- `taskListOrderByDate`: source and task ordering.
- `retainedObsidianReviews`: deleted review records retained for Obsidian compatibility when delete-sync is off.
- `appBehaviorSettings`: app behavior settings.
- `obsidianTemplateSettings`: template and path settings.
- `aiReviewSettings`: AI account, routing, timer, source, and report settings.
- `windowMode`, `windowState`, `compactMode`, `autoStart`: desktop shell state.

## Obsidian Sync

Obsidian daily-note sync uses managed markers so user-owned content outside those ranges is preserved.

Managed markers:

- `<!-- DAILYTODO:WORK:START -->` / `<!-- DAILYTODO:WORK:END -->`
- `<!-- DAILYTODO:INSPIRATION:START -->` / `<!-- DAILYTODO:INSPIRATION:END -->`
- `<!-- DAILYTODO:TASKS:START -->` / `<!-- DAILYTODO:TASKS:END -->`

Core sync path:

```text
useTasks state changes
  -> syncTasksToObsidian(...)
  -> electron/main.ts IPC handler
  -> shared/obsidianTemplates.ts rendering helpers
  -> Markdown file under configured vault path
```

Default daily path is configured in `shared/appSettings.ts` as `logs/daily/DailyTodo/{{date}}.md`.

## AI Review

AI review behavior is split between main-process orchestration and shared prompt/source utilities.

- Settings schema and profile routing: `shared/aiReview/aiReviewSettings.ts`.
- Daily run orchestration: `electron/aiReview/runner.ts`.
- Weekly/monthly/export report writing: `electron/aiReview/exportReports.ts`.
- Source collection: `shared/aiReview/sourceMaterials.ts`.
- Prompt defaults/building: `shared/aiReview/defaultPrompts.ts`, `shared/aiReview/promptBuilder.ts`, `shared/aiReview/monthly.ts`.
- Run diagnostics and progress payloads: `shared/aiReview/runDiagnostics.ts`.
- IPC handlers and timers: `electron/main.ts`.

AI generation should fail before calling a model when there is no usable account, vault path, or source material. Preserve that guardrail during refactors.

## Window Behavior

Window behavior is unusually important in this app because it behaves like a desktop widget.

- `shared/windowMode.ts` defines `normal`, `onTop`, and `desktop` modes.
- `electron/main.ts` applies the modes, tray behavior, Windows native handling, and diagnostics.
- `electron/preload.ts` exposes mode and window controls.
- `src/components/TitleBar.tsx` is the main UI entry point for window controls.

Be conservative when editing `electron/main.ts`; much of its complexity exists to avoid Windows transparent-window edge cases.

## High-Risk Files

These files are large or cross many feature boundaries:

- `electron/main.ts` is over 2,000 lines and mixes app lifecycle, window management, store, Obsidian sync, AI IPC, timers, and context menu windows.
- `src/components/SettingsPanel.tsx` is over 1,400 lines and contains appearance, sync, templates, AI accounts, report generation, scheduling, and general settings UI.
- `src/App.tsx` wires most feature state together. Some pure helpers have been extracted, but avoid moving cross-feature effects without focused verification.
- `src/hooks/useTasks.ts` is about 680 lines and is the main task state machine.
- `src/i18n.ts` is central to UI text and currently needs an encoding cleanup pass.

## Recommended Cleanup Order

1. Documentation and code map cleanup. Keep behavior unchanged.
2. Encoding and i18n cleanup. Restore readable Chinese strings or move text into clearly encoded resource files.
3. Continue extracting `electron/main.ts` by responsibility: window/tray, store/settings IPC, Obsidian IPC, AI IPC, task context menu. Icon helpers, window-state helpers, safe-store creation, and diagnostics already live in focused modules.
4. Extract `SettingsPanel.tsx` by section: sync/templates, schedule, and general settings are the next safest candidates. Shared controls, Appearance helpers, and AI review widgets already live in `src/components/settings/`.
5. Continue splitting `useTasks.ts` into sync effects and hook state orchestration. Pure task tree/date helpers now live in `src/hooks/taskTransforms.ts`, base task mutation helpers now live in `src/hooks/taskMutations.ts`, completion-review mutation helpers now live in `src/hooks/taskReviewMutations.ts`, hook-side decision helpers now live in `src/hooks/taskHookState.ts`, drag-and-drop order state updates now live in `src/hooks/taskOrderingState.ts`, derived view selectors now live in `src/hooks/taskSelectors.ts`, carry-forward ledger logic now lives in `src/hooks/taskCarryover.ts`, renderer task persistence helpers now live in `src/hooks/taskPersistence.ts`, and renderer Obsidian sync helpers now live in `src/hooks/taskObsidianSync.ts`.
6. Add focused verification scripts before each extraction, then keep existing `verify:*` scripts passing.

## Safe Change Rules

- Do not rename storage keys without a migration.
- Do not change managed marker strings unless you also provide recovery/migration behavior.
- Do not overwrite Obsidian content outside managed blocks.
- Do not bypass `useTasks.ts` for task mutations from the renderer.
- Do not move AI settings fields without normalizer support in `normalizeAiReviewSettings`.
- Do not simplify Windows window-mode code without testing `normal`, `onTop`, `desktop`, tray hide/show, and Win+D behavior.
