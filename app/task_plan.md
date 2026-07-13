# DailyTodo Code Cleanup Plan

## Goal
Make the DailyTodo codebase easier to maintain by clarifying module boundaries, preserving existing behavior, and keeping focused verification commands available for future changes.

## Current Phase
Phase 498: Electron Main AI Review Services Composition

## Phases

### Phase 1: Baseline And Verification
- [x] Confirmed the worktree had existing changes and avoided reverting unrelated work.
- [x] Created persistent planning files for this cleanup pass.
- [x] Added and updated focused verification scripts for the extracted task, renderer, settings, and Electron modules.
- **Status:** complete

### Phase 2: Low-Risk Renderer Cleanup
- [x] Centralized global renderer style imports in `src/styles/index.css`.
- [x] Added structure checks for the style entry and App helper modules.
- [x] Kept `App` focused on application composition by extracting viewport style and task-tree helpers.
- **Status:** complete

### Phase 3: SettingsPanel Modularization
- [x] Added settings panel module-boundary verification.
- [x] Extracted shared settings controls to `src/components/settings/SettingsControls.tsx`.
- [x] Extracted Appearance helpers to `src/components/settings/appearanceSettings.ts`.
- [x] Extracted AI review account/progress/diagnostic widgets to `src/components/settings/AiReviewSettingsWidgets.tsx`.
- [x] Preserved existing `SettingsPanel` props and behavior.
- **Status:** complete

### Phase 4: Electron Main Modularization
- [x] Added Electron module-boundary verification.
- [x] Extracted app icon helpers to `electron/appIcons.ts`.
- [x] Extracted window-state/settings-mode helpers to `electron/windowState.ts`.
- [x] Extracted safe store creation to `electron/safeStore.ts`.
- [x] Extracted crash diagnostics to `electron/diagnostics.ts`.
- [x] Kept high-risk IPC, AI, Obsidian, and lifecycle wiring in `electron/main.ts` for now.
- **Status:** complete

### Phase 5: Documentation And Final Regression
- [x] Updated `../docs/DailyTodo-Codebase-Map.md`.
- [x] Updated `../docs/DailyTodo-Developer-Code-Guide.md`.
- [x] Calibrated stale verification scripts after modularization.
- [x] Removed duplicate `package.json` script key.
- [x] Ran focused cleanup regression, broad release-candidate regression, TypeScript, and production build.
- **Status:** complete

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Add verification before and during module extraction | The project already had many moving parts, so focused scripts protect behavior during cleanup. |
| Extract pure helpers and low-coupling UI first | This improves maintainability without changing runtime behavior. |
| Keep `electron/main.ts` partially monolithic | IPC, AI, Obsidian, tray, and window lifecycle are tightly coupled and safer to split in a later test-backed pass. |
| Avoid bulk UI text cleanup in this pass | Some terminal output shows encoding issues; visible text cleanup should be done deliberately with UI review. |

## Final Verification

| Command | Result |
|---------|--------|
| `npm run verify:cleanup-core` | passed |
| `npm run verify:rc` | passed |
| `npm run build` | passed |

## Remaining Safe Follow-Ups

- Split the remaining `electron/main.ts` IPC sections by feature after adding per-section regression scripts.
- Split the remaining `SettingsPanel.tsx` sync/templates/schedule/general sections after adding focused checks.
- Clean `src/i18n.ts` and any mojibake UI text in a dedicated encoding pass with visual review.

### Phase 393: OpenAI Client Transport Extraction
- [x] Recalibrated App shell and AI Review structural verifiers after concurrent responsibility moves.
- [x] Re-ran focused verification, TypeScript checking, cleanup-core, and production build after calibration.
- [x] Reviewed a transport extraction boundary and deliberately deferred it because mixed historical encoding made a behavior-preserving patch unsafe.
- **Status:** complete (deferred)

### Phase 395: TitleBar Window-Mode Hook Extraction
- [x] Added RED structural verification requiring the TitleBar window-mode lifecycle to live in a dedicated hook.
- [x] Extracted pinned-state initialization, focus/visibility refresh, IPC mode subscription, no-op state guard, and always-on-top fallback reads to `src/components/useTitleBarWindowMode.ts`.
- [x] Kept `TitleBar.tsx` responsible for event presentation and button interaction only.
- [x] Ran focused window IPC and app shell checks, TypeScript typecheck, whitespace validation, and production build.
- [ ] Recalibrate the unrelated Companion IPC verifier to follow `isObjectRecord(...)` after the previous runtime-guard reuse extraction.
- **Status:** complete (with unrelated verifier follow-up)

### Phase 409: DailyWorkPanel Resize Lifecycle Extraction
- [x] Added a focused RED/GREEN verifier for the inline-editor resize lifecycle.
- [x] Extracted initial height, min/max clamping, pointer dragging, and listener cleanup to `src/components/dailyWorkPanel/useDailyWorkPanelResize.ts`.
- [x] Kept `DailyWorkPanel.tsx` responsible for editor/menu presentation and hook composition only.
- [x] Added the focused resize check to `verify:cleanup-core`.
- [x] Recalibrated stale RC UI and UI-feedback assertions to follow their extracted composition owners.
- [x] Ran focused checks, TypeScript checking, aggregate cleanup verification, production build, and whitespace validation.
- **Status:** complete

### Phase 410: DailyWorkPanel Command Menu Hook Extraction
- [x] Added a focused RED/GREEN verifier for command-menu state and keyboard routing ownership.
- [x] Extracted slash detection, open/close/index reset, arrow navigation, and Enter selection routing to `src/components/dailyWorkPanel/useDailyWorkPanelCommands.ts`.
- [x] Kept `DailyWorkPanel.tsx` responsible for markdown insertion, editor commits, and menu presentation.
- [x] Added the focused command hook check to `verify:cleanup-core`.
- [x] Ran aggregate cleanup verification, production build, and whitespace validation.
- **Status:** complete

### Phase 411: TitleBar More-Menu Hook Extraction
- [x] Added a focused RED/GREEN verifier for the TitleBar more-menu lifecycle.
- [x] Extracted menu open state, outside-click listener cleanup, toggle action, and reset-position close behavior to `src/components/useTitleBarMoreMenu.ts`.
- [x] Kept `TitleBar.tsx` responsible for the titlebar controls and menu presentation.
- [x] Recalibrated existing UI and window IPC verifiers to follow the extracted command/menu lifecycle owners.
- [x] Added the focused more-menu hook check to `verify:cleanup-core`.
- [x] Ran focused checks, TypeScript checking, aggregate cleanup verification, production build, and whitespace validation.
- **Status:** complete

### Phase 397: Task Display Ordering Extraction
- [x] Added RED structural verification requiring display sorting to move out of the task-order mutation module.
- [x] Extracted source normalization, display sorting, priority insertion, and completion bucketing into `src/utils/taskDisplayOrdering.ts`.
- [x] Kept `src/utils/taskOrdering.ts` as the stable compatibility entrypoint while retaining only drag/order mutation ownership.
- [x] Ran focused ordering checks, aggregate cleanup verification, TypeScript checking, production build, and whitespace validation.
- **Status:** complete

### Phase 398: Task Persistence Initialization Extraction
- [x] Added focused RED verification for task-state parsing and startup loading ownership.
- [x] Moved stored-value parsing and initial task-state construction into `src/hooks/taskPersistenceInitialization.ts`.
- [x] Kept `taskPersistence.ts` as the stable entrypoint for debounce persistence and compatibility exports.
- [x] Recalibrated the task-list interaction verifier to inspect the initialization owner of manual-order storage.
- [x] Ran focused task persistence checks, aggregate cleanup, TypeScript, build, and whitespace checks.
- **Status:** complete

### Phase 399: Task Business-Date Effects Extraction
- [x] Added RED structural verification requiring business-date lifecycle effects to have a focused hook boundary.
- [x] Extracted the rollover timer, date transition, carryover-ledger loading, and idempotent carryover writeback to `src/hooks/useTaskBusinessDateEffects.ts`.
- [x] Kept `useTaskLifecycleEffects.ts` as the composition owner for startup, business-date, persistence, broadcast, and Obsidian effects.
- [x] Recalibrated task persistence checks to inspect the new business-date owner for carryover behavior.
- [x] Ran focused task checks, aggregate cleanup, production build, and whitespace validation.
- **Status:** complete


### Phase 6: SettingsPanel Basic Sections Split
- [x] Added red/green structural verification for SettingsPanel basic section modules.
- [x] Extracted `src/components/settings/TemplatesSettingsSection.tsx`.
- [x] Extracted `src/components/settings/ScheduleSettingsSection.tsx`.
- [x] Extracted `src/components/settings/GeneralSettingsSection.tsx`.
- [x] Removed unused `SettingsPanel.tsx` imports/helper after extraction.
- [x] Run focused cleanup regression and production build.
- **Status:** complete


## SettingsPanel Basic Sections Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-basic-sections` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |
| `npm run verify:task-item-stack-helper` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |
| `npm run verify:settings-basic-sections`; `npm run verify:settings-panel-modules`; `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 7: Electron Window IPC Module Split
- [x] Added red/green structural verification for the Electron `window:*` IPC boundary.
- [x] Extracted `electron/windowIpc.ts` with explicit dependency injection from `electron/main.ts`.
- [x] Kept window mode, settings-mode sizing, lock-position, compact-mode, and autostart IPC behavior unchanged.
- [x] Added `verify:electron-window-ipc-module` to `verify:cleanup-core`.
- [x] Ran focused Electron IPC verification, focused cleanup regression, and production build.
- **Status:** complete

## Electron Window IPC Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 8: Electron Store And Settings IPC Module Split
- [x] Added red/green structural verification for the Electron `store:*` and `settings:*` IPC boundary.
- [x] Extracted `electron/settingsIpc.ts` with explicit dependency injection from `electron/main.ts`.
- [x] Preserved task-change broadcasting for `store:set` and Obsidian template reset behavior.
- [x] Added `verify:electron-settings-ipc-module` to `verify:cleanup-core`.
- [x] Ran focused settings IPC verification, focused cleanup regression, and production build.
- **Status:** complete

## Electron Store/Settings IPC Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-settings-ipc-module` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 9: Electron Task Context Menu IPC Module Split
- [x] Added red/green structural verification for the Electron `taskContextMenu:*` IPC boundary.
- [x] Extracted `electron/taskContextMenuIpc.ts` with explicit dependency injection from `electron/main.ts`.
- [x] Kept popup BrowserWindow creation, closing, renderer loading, and mutable popup state in `electron/main.ts`.
- [x] Preserved popup resize height clamping, work-area y clamping, and action forwarding behavior.
- [x] Updated `verify:context-menu` and `verify:cleanup-core` for the new module boundary.
- [x] Ran context-menu verification, focused cleanup regression, and production build.
- **Status:** complete

## Electron Task Context Menu IPC Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-task-context-menu-ipc-module` | passed |
| `npm run verify:context-menu` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 10: App Task Menu Action Helper Split
- [x] Added red/green structural verification for the App task-menu action parsing boundary.
- [x] Extracted `src/app/taskMenuActions.ts` for popup action payload normalization and edit-request nonce creation.
- [x] Kept `App.tsx` responsible for subscribing to `onTaskMenuAction` and applying task mutations through existing hook callbacks.
- [x] Preserved add-subtask text coercion, delete/edit routing, and ordinary task update behavior.
- [x] Added `verify:app-task-menu-actions-module` to `verify:cleanup-core`.
- [x] Ran focused App helper verification, focused cleanup regression, and production build.
- **Status:** complete

## App Task Menu Action Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-task-menu-actions-module` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 11: TaskItem Context Menu Helper Split
- [x] Added red/green structural verification for the TaskItem context-menu helper boundary.
- [x] Extracted `src/components/taskItem/taskItemContextMenu.ts` for popup theme and payload construction.
- [x] Kept `TaskItem.tsx` responsible for React event handling, DOM lookup, and IPC invocation.
- [x] Preserved theme-id detection, CSS variable fallbacks, screen coordinates, dark-mode flag, task payload, and tag payload behavior.
- [x] Updated `verify:context-menu` and `verify:cleanup-core` for the new helper boundary.
- [x] Ran focused TaskItem/context-menu verification, focused cleanup regression, and production build.
- **Status:** complete

## TaskItem Context Menu Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-context-menu-helper` | passed |
| `npm run verify:context-menu` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 12: TaskItem Virtual Subtasks Hook Split
- [x] Added red/green structural verification for the TaskItem virtual-subtasks hook boundary.
- [x] Extracted `src/components/taskItem/useVirtualSubtasks.ts` for subtask virtualization constants and scroll-window calculation.
- [x] Kept `TaskItem.tsx` responsible for rendering subtask rows, animations, and subtask actions.
- [x] Preserved viewport height, row height, overscan, virtualization threshold, passive scroll tracking, total height, and virtual item top positioning behavior.
- [x] Added `verify:task-item-virtual-subtasks-hook` to `verify:cleanup-core`.
- [x] Ran focused TaskItem hook verification, focused cleanup regression, and production build.
- **Status:** complete

## TaskItem Virtual Subtasks Hook Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-virtual-subtasks-hook` | passed |
| `npm run verify:context-menu` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 13: TaskItem SubtaskCard Module Split
- [x] Added red/green structural verification for the TaskItem subtask row component boundary.
- [x] Extracted `src/components/taskItem/SubtaskCard.tsx` for individual child-task row rendering and actions.
- [x] Extracted `src/components/taskItem/taskItemPresentation.tsx` for shared priority labels, review detection, action buttons, and SVG icons.
- [x] Kept `TaskItem.tsx` responsible for parent task rendering, context-menu DOM lookup, virtual-list animation, and callback wiring.
- [x] Preserved subtask toggle, trimmed edit submission, priority change, review routing, delete routing, row classes, and action classes.
- [x] Added `verify:task-item-subtask-card-module` to `verify:cleanup-core`.
- [x] Run focused TaskItem subtask verification, focused cleanup regression, and production build.
- **Status:** complete

## TaskItem SubtaskCard Module Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-task-item-subtask-card-module.ts` before extraction | failed as expected because `SubtaskCard.tsx` did not exist |
| `npm run verify:task-item-subtask-card-module` | passed |
| `npm run typecheck` after repairing extraction boundary | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 14: TaskItem Stack Helper Split
- [x] Added red/green structural verification for TaskItem stack presentation constants and helpers.
- [x] Extracted `src/components/taskItem/taskItemStack.ts` for collapsed-stack segment classes, spring settings, transition values, subtask stagger timing, and `getStackSegmentCount`.
- [x] Kept `TaskItem.tsx` responsible for rendering the stack segment DOM and applying virtual-list animation.
- [x] Preserved segment class names, spring values, reduced-motion transition, per-segment delay, subtask stagger timing, and stack segment count cap.
- [x] Added `verify:task-item-stack-helper` to `verify:cleanup-core`.
- [x] Run focused TaskItem stack verification, focused cleanup regression, and production build.
- **Status:** complete

## TaskItem Stack Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-task-item-stack-helper.ts` before extraction | failed as expected because `taskItemStack.ts` did not exist |
| `npm exec -- tsx scripts/verify-task-item-stack-helper.ts` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:task-item-stack-helper` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 15: App Task View Helper Split
- [x] Added red/green structural verification for App task-view derivation.
- [x] Extracted `src/app/appTaskView.ts` for `PriorityFilter`, visible task filtering, drag-disabled derivation, and selected-date command task aliasing.
- [x] Kept `App.tsx` responsible for owning filter/search state, persistence effects, task handlers, and rendering.
- [x] Preserved open-only filtering, priority filtering, trimmed case-insensitive text search, `isTaskDragDisabled` delegation, and `selectedDateTaskCommands` passthrough.
- [x] Added `verify:app-task-view-module` to `verify:cleanup-core`.
- [x] Run focused App task-view verification, focused cleanup regression, and production build.
- **Status:** complete

## App Task View Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-task-view-module.ts` before extraction | failed as expected because `appTaskView.ts` did not exist |
| `npm exec -- tsx scripts/verify-app-task-view-module.ts` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:app-task-view-module` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 16: App Personalization Helper Split
- [x] Added red/green structural verification for App personalization persistence and theme override helpers.
- [x] Extracted `src/app/appPersonalization.ts` for personalization store keys, font-scale clamping, loaded-settings normalization, theme override seeding/merging, preset application, reset calculation, and override memory.
- [x] Kept `App.tsx` responsible for React state, Electron store calls, document font-size side effect, and settings panel wiring.
- [x] Preserved default merging, theme preset matching for old settings, unknown theme fallback, seeded-vs-stored override precedence, per-theme opacity memory, reset-to-minimal fallback, and font-scale clamp range.
- [x] Added `verify:app-personalization-module` to `verify:cleanup-core`.
- **Status:** complete

## App Personalization Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-personalization-module` before extraction | failed as expected because `src/app/appPersonalization.ts` did not exist |
| `npm run verify:app-personalization-module` after extraction | passed |
| `npm run typecheck` | passed |

### Phase 17: App Completion Flow Helper Split
- [x] Added red/green structural verification for App completion/review routing decisions.
- [x] Extracted `src/app/appCompletionFlow.ts` for completion target types, task/subtask toggle decisions, fallback target resolution, and completion-review view routing.
- [x] Kept `App.tsx` responsible for React state setters, task mutation calls, dialog state cleanup, and rendering.
- [x] Preserved direct toggle for missing/completed main tasks, no-review main completion toggle, no-review subtask completion mutation, review-request routing, fallback-to-main target resolution, existing review detection, subtask-vs-task view target detection, and completed-without-review edit routing.
- [x] Added `verify:app-completion-flow-module` to `verify:cleanup-core`.
- [x] Calibrated stale `verify:app-task-tree-module` after `isSubtask` moved from direct App usage to the completion-flow helper.
- [x] Run focused App completion-flow verification, focused cleanup regression, and production build.
- **Status:** complete

## App Completion Flow Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-completion-flow-module` before extraction | failed as expected because `src/app/appCompletionFlow.ts` did not exist |
| `npm run verify:app-completion-flow-module` after extraction and verifier regex repair | passed |
| `npm run typecheck` | passed |
| `npm run verify:app-task-tree-module` after stale-boundary calibration | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 18: App Template Editor Helper Split
- [x] Added red/green structural verification for App template-editor kind mapping.
- [x] Extracted `src/app/appTemplateEditor.ts` for template kind types, kind-to-field mapping, initial template fallback selection, and typed template update merging.
- [x] Kept `App.tsx` responsible for modal open/close state, `updateObsidianTemplates`, and save/cancel event wiring.
- [x] Preserved daily, personal weekly/monthly, and external weekly/monthly default template fallbacks plus the five existing Obsidian template fields.
- [x] Added `verify:app-template-editor-module` to `verify:cleanup-core`.
- [x] Run focused template-editor verification, focused cleanup regression, and production build.
- **Status:** complete

## App Template Editor Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-template-editor-module` before extraction | failed as expected because `src/app/appTemplateEditor.ts` did not exist |
| `npm run verify:app-template-editor-module` after extraction and verifier regex repair | passed |
| `npm run typecheck` after repairing an import-fragment syntax error | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 19: App Keyboard Shortcuts Helper Split
- [x] Added red/green structural verification for App keyboard shortcut decision logic.
- [x] Extracted `src/app/appKeyboardShortcuts.ts` for pure shortcut-to-action mapping.
- [x] Kept `App.tsx` responsible for event listener registration, `preventDefault`, React state updates, date shifting, and opening the selected daily note.
- [x] Preserved Ctrl+K compact-mode toggle, Ctrl+O daily-note opening, `[`/`]` date navigation, and INPUT/TEXTAREA typing guards.
- [x] Added `verify:app-keyboard-shortcuts-module` to `verify:cleanup-core`.
- [x] Run focused keyboard-shortcuts verification, focused cleanup regression, and production build.
- **Status:** complete

## App Keyboard Shortcuts Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-keyboard-shortcuts-module` before package script registration | failed as expected because the package script did not exist |
| `npm exec -- tsx scripts/verify-app-keyboard-shortcuts-module.ts` before extraction | failed as expected because `src/app/appKeyboardShortcuts.ts` did not exist |
| `npm run verify:app-keyboard-shortcuts-module` after extraction | passed |
| `npm run verify:cleanup-core` initially after extraction | failed at stale `verify:app-task-tree-module` date-delta assertion |
| `npm run verify:app-task-tree-module` after stale-boundary calibration | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` after stale verifier calibration | passed |
| `npm run build` | passed |

### Phase 20: App Companion Status Helper Split
- [x] Added red/green structural verification for App companion status message mapping.
- [x] Extracted `src/app/appCompanionStatus.ts` for pure preview, sync, and mobile-inbox import status text derivation.
- [x] Kept `App.tsx` responsible for Companion store calls, sync-plan state, mobile capture item mutation, and panel wiring.
- [x] Preserved preview success change count, sync success copy, mobile import item count, and space-joined error messages.
- [x] Added `verify:app-companion-status-module` to `verify:cleanup-core`.
- [x] Run focused companion-status verification, focused cleanup regression, and production build.
- **Status:** complete

## App Companion Status Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-companion-status-module.ts` before extraction | failed as expected because `src/app/appCompanionStatus.ts` did not exist |
| `npm run verify:app-companion-status-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 21: App Scheduled Reports Helper Split
- [x] Added red/green structural verification for App scheduled AI report date/error helpers.
- [x] Extracted `src/app/appScheduledReports.ts` for weekly/monthly target date-key calculation and scheduled-report result error diagnostics.
- [x] Kept `App.tsx` responsible for AI review tick listener registration, Electron IPC generation calls, and task-list inputs.
- [x] Preserved previous-week date selection, previous-month-end date selection, YYYY-MM-DD formatting, console warning, window diagnostic key, and no-source-materials fallback message.
- [x] Added `verify:app-scheduled-reports-module` to `verify:cleanup-core`.
- [x] Run focused scheduled-reports verification, focused cleanup regression, and production build.
- **Status:** complete

## App Scheduled Reports Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-scheduled-reports-module.ts` first attempt | failed because verifier regex encoded Chinese fallback as invalid `?` regex |
| `npm exec -- tsx scripts/verify-app-scheduled-reports-module.ts` before extraction after verifier repair | failed as expected because `src/app/appScheduledReports.ts` did not exist |
| `npm run verify:app-scheduled-reports-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 22: App Theme State Helper Split
- [x] Added red/green structural verification for App theme-state derivation.
- [x] Extracted `src/app/appThemeState.ts` for active theme id fallback, theme CSS class construction, and invisible-theme detection.
- [x] Kept `App.tsx` responsible for DOM classes/data attributes, viewport style creation, React state, and settings actions.
- [x] Preserved `personalization.themeId || matchThemePreset(personalization)`, `theme-${activeThemeId}` class construction, invisible theme detection, reset-theme id usage, and low-opacity handling.
- [x] Added `verify:app-theme-state-module` to `verify:cleanup-core`.
- [x] Run focused App theme-state verification, focused cleanup regression, and production build.
- **Status:** complete

## App Theme State Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-theme-state-module.ts` before extraction | failed as expected because `src/app/appThemeState.ts` did not exist |
| `npm run verify:app-theme-state-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 23: App Review Dialog State Helper Split
- [x] Added red/green structural verification for App review/completion dialog derived state.
- [x] Extracted `src/app/appReviewDialogState.ts` for completion dialog task passthrough and current review task lookup.
- [x] Kept `App.tsx` responsible for React state, completion/review handlers, task mutations, and dialog rendering.
- [x] Preserved `reviewTask ? findTaskInTree(allTasks, reviewTask.id) : null` lookup behavior and completion task passthrough.
- [x] Added `verify:app-review-dialog-state-module` to `verify:cleanup-core`.
- [x] Run focused App review-dialog-state verification, focused cleanup regression, and production build.
- **Status:** complete

## App Review Dialog State Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-review-dialog-state-module.ts` before extraction | failed as expected because `src/app/appReviewDialogState.ts` did not exist |
| `npm run verify:app-review-dialog-state-module` | passed |
| `npm run typecheck` | passed after restoring `findTaskInTree` import for subtask toggle logic |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 24: App Companion Capture Helper Split
- [x] Added red/green structural verification for App Companion capture item composition.
- [x] Extracted `src/app/appCompanionCapture.ts` for combining desktop capture items with imported mobile capture items.
- [x] Kept `App.tsx` responsible for lazy preview/sync invocation, Companion settings, async IPC/store calls, mobile inbox import state, and status updates.
- [x] Preserved `buildCaptureItems(allTasks, selectedDate, dailyWork, dailyInspiration)` and appending `mobileCaptureItems` after desktop-derived items.
- [x] Added `verify:app-companion-capture-module` to `verify:cleanup-core`.
- [x] Run focused App companion-capture verification, focused cleanup regression, and production build.
- **Status:** complete

## App Companion Capture Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-companion-capture-module.ts` before extraction | failed as expected because `src/app/appCompanionCapture.ts` did not exist |
| `npm run verify:app-companion-capture-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 25: App Companion Mobile Helper Split
- [x] Added red/green structural verification for App Companion mobile inbox item merging.
- [x] Extracted `src/app/appCompanionMobile.ts` for appending imported mobile capture items to existing imported items.
- [x] Kept `App.tsx` responsible for mobile inbox import IPC, state setter ownership, and Companion status updates.
- [x] Preserved no-item identity behavior and append ordering for imported mobile capture items.
- [x] Added `verify:app-companion-mobile-module` to `verify:cleanup-core`.
- [x] Run focused App companion-mobile verification, focused cleanup regression, and production build.
- **Status:** complete

## App Companion Mobile Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-companion-mobile-module.ts` before extraction | failed as expected because `src/app/appCompanionMobile.ts` did not exist |
| `npm run verify:app-companion-mobile-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 26: App Task Menu Action Routing Helper Split
- [x] Added red/green structural verification for App popup task-menu action routing.
- [x] Extended `src/app/taskMenuActions.ts` so it owns parsed action dispatch to add-subtask, delete, edit-request, and update handlers.
- [x] Kept `App.tsx` responsible for Electron listener registration, task mutation functions, and React edit-request state ownership.
- [x] Preserved add-subtask text coercion, delete/edit/update routing, and edit nonce creation through `createEditRequest`.
- [x] Kept `verify:app-task-menu-actions-module` inside `verify:cleanup-core`.
- [x] Run focused App task-menu verification, focused cleanup regression, and production build.
- **Status:** complete

## App Task Menu Action Routing Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-task-menu-actions-module` after verifier expansion, before helper implementation | failed as expected because `applyParsedTaskMenuAction` did not exist |
| `npm run verify:app-task-menu-actions-module` after extraction | passed |
| `npm run typecheck` | passed |


### Phase 27: Electron Companion IPC Module Split
- [x] Added red/green structural verification for the Electron `companion:*` IPC boundary.
- [x] Extracted `electron/companionIpc.ts` with explicit Companion settings accessor injection from `electron/main.ts`.
- [x] Kept Companion settings storage/default-vault fallback in `electron/main.ts` while moving sync plan preview/write and mobile inbox IPC handlers into the module.
- [x] Preserved `items || []` fallback behavior for preview/write sync and `{ ok: true }` response for settings writes.
- [x] Added `verify:electron-companion-ipc-module` to `verify:cleanup-core`.
- [x] Run focused Electron Companion IPC verification, focused cleanup regression, and production build.
- **Status:** complete

## Electron Companion IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-companion-ipc-module.ts` before extraction | failed as expected because `electron/companionIpc.ts` did not exist |
| `npm run verify:electron-companion-ipc-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 28: SettingsPanel Sync Section Split
- [x] Added red/green structural verification for the SettingsPanel sync section boundary.
- [x] Extracted `src/components/settings/SyncSettingsSection.tsx` for Obsidian vault/path settings, sync preview display, and deleted-review sync toggles.
- [x] Kept `SettingsPanel.tsx` responsible for top-level section navigation, app props, and cross-section state while passing explicit sync props into the section component.
- [x] Preserved vault chooser, template path defaults and updates, preview trigger, preview counts, `syncDeletedReviewsToObsidian`, and `confirmBeforeDeletingReview` behavior.
- [x] Added `verify:settings-sync-section` to `verify:cleanup-core`.
- [x] Run focused SettingsPanel sync-section verification, focused cleanup regression, and production build.
- **Status:** complete

## SettingsPanel Sync Section Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-settings-sync-section.ts` before extraction | failed as expected because `src/components/settings/SyncSettingsSection.tsx` did not exist |
| `npm run verify:settings-sync-section` after extraction | passed |
| `npm run typecheck` after syntax fix | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 29: SettingsPanel Appearance Section Split
- [x] Added red/green structural verification for the SettingsPanel appearance section boundary.
- [x] Extracted `src/components/settings/AppearanceSettingsSection.tsx` for theme preset cards, global appearance sliders, unified glass opacity control, and color inputs.
- [x] Kept `SettingsPanel.tsx` responsible for top-level section navigation and parent-provided theme/settings callbacks while passing explicit appearance props into the section component.
- [x] Preserved theme preset filtering, reset-theme callback, default theme recommendation values, unified opacity updates, radius/font/blur updates, and primary/secondary color edits.
- [x] Added `verify:settings-appearance-section` to `verify:cleanup-core`.
- [x] Run focused SettingsPanel appearance-section verification and TypeScript verification.
- **Status:** complete

## SettingsPanel Appearance Section Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-settings-appearance-section.ts` before extraction | failed as expected because `src/components/settings/AppearanceSettingsSection.tsx` did not exist |
| `npm run verify:settings-appearance-section` after extraction | passed |
| `npm run typecheck` after clearing stale inline helper variables | passed |
| `npm run verify:settings-appearance-module` after verifier boundary update | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 30: SettingsPanel AI Review Timer Section Split
- [x] Added red/green structural verification for the AI Review timer settings boundary.
- [x] Extracted `src/components/settings/AiReviewTimerSettingsSection.tsx` for personal weekly/monthly auto-generation controls, external weekly/monthly auto-generation controls, and external anonymization toggle.
- [x] Kept `SettingsPanel.tsx` responsible for AI review settings persistence, generation actions, progress refs/timers, and report source/account controls while passing explicit timer props into the section component.
- [x] Preserved weekday option rendering, numeric weekday coercion, monthly-day fallback, timer time updates, and all existing AI review setting keys.
- [x] Added `verify:settings-ai-review-timer-section` to `verify:cleanup-core`.
- [x] Run focused AI Review timer-section verification and TypeScript verification.
- **Status:** complete

## SettingsPanel AI Review Timer Section Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-settings-ai-review-timer-section.ts` before extraction | failed as expected because `src/components/settings/AiReviewTimerSettingsSection.tsx` did not exist |
| `npm run verify:settings-ai-review-timer-section` after extraction | passed |
| `npm run typecheck` | passed |



### Phase 31: SettingsPanel AI Review Report Routing Section Split
- [x] Added red/green structural verification for the AI Review report-account routing boundary.
- [x] Extracted `src/components/settings/AiReviewReportRoutingSection.tsx` for daily, personal weekly, and personal monthly report account selection.
- [x] Kept `SettingsPanel.tsx` responsible for AI review settings persistence, account profile management, manual generation, diagnostics, and report source controls while passing explicit routing props into the section component.
- [x] Preserved follow-current-account option, missing-profile fallback display, configured-profile option rendering, and direct `updateAiReview` writes to the same report profile keys.
- [x] Added `verify:settings-ai-review-report-routing-section` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## SettingsPanel AI Review Report Routing Section Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-settings-ai-review-report-routing-section.ts` before extraction | failed as expected because `src/components/settings/AiReviewReportRoutingSection.tsx` did not exist |
| `npm run verify:settings-ai-review-report-routing-section` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 32: SettingsPanel AI Review Source Settings Section Split
- [x] Added red/green structural verification for the AI Review report-source/base-settings boundary.
- [x] Extracted `src/components/settings/AiReviewSourceSettingsSection.tsx` for report source selects, request timeout, daily timer time, startup backfill, backfill days, and daily timer toggle.
- [x] Kept `SettingsPanel.tsx` responsible for AI review settings persistence, profile management, manual generation, diagnostics, and top-level section composition while passing explicit source/base props into the section component.
- [x] Preserved personal/external weekly/monthly source keys, option hint lookup, source-mode casts, timeout fallback, backfill-day fallback, startup-backfill toggle, and daily timer toggle.
- [x] Added `verify:settings-ai-review-source-section` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## SettingsPanel AI Review Source Settings Section Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-settings-ai-review-source-section.ts` before extraction | failed as expected because `src/components/settings/AiReviewSourceSettingsSection.tsx` did not exist |
| `npm run verify:settings-ai-review-source-section` after extraction | passed |
| `npm run typecheck` after removing stale `Field` import | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 33: SettingsPanel AI Review Manual Generation Section Split
- [x] Added red/green structural verification for the AI Review manual-generation UI boundary.
- [x] Extracted `src/components/settings/AiReviewManualGenerationSection.tsx` for manual generation buttons, generation status, progress display, and diagnostic card rendering.
- [x] Kept `SettingsPanel.tsx` responsible for generation side effects, IPC calls, progress timers/refs, and diagnostic state while passing explicit display props and callbacks into the section component.
- [x] Preserved personal weekly/monthly, external weekly/monthly, and daily regeneration actions; disabled-button behavior while generating; progress button labels; status display; and diagnostic close callback.
- [x] Added `verify:settings-ai-review-manual-generation-section` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## SettingsPanel AI Review Manual Generation Section Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-settings-ai-review-manual-generation-section.ts` before extraction | failed as expected because `src/components/settings/AiReviewManualGenerationSection.tsx` did not exist |
| `npm run verify:settings-ai-review-manual-generation-section` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 34: App UI State Persistence Helper Split
- [x] Added red/green structural verification for App startup UI-state loading and persistence.
- [x] Extracted `src/app/appUiStatePersistence.ts` for compact mode, panel open state, task search/filter state, personalization/theme override loading, and guarded persistence.
- [x] Kept `App.tsx` responsible for React hooks, Companion/template settings loading, and top-level state wiring while delegating store key details to the helper.
- [x] Preserved personalization normalization, theme override seeding/merging, dark-mode loading, priority-filter validation, and the `personalizationReady` persistence guard.
- [x] Added `verify:app-ui-state-persistence-module` to `verify:cleanup-core` and refreshed the personalization verifier to accept the new helper boundary.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App UI State Persistence Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-ui-state-persistence-module.ts` before extraction | failed as expected because `src/app/appUiStatePersistence.ts` did not exist |
| `npm run verify:app-ui-state-persistence-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` after refreshing stale personalization boundary check | passed |
| `npm run build` | passed |


### Phase 35: App Shell Effects Helper Split
- [x] Added red/green structural verification for App shell/UI side-effect helpers.
- [x] Extracted `src/app/appShellEffects.ts` for settings-mode synchronization, document theme class toggles, document font scaling, and always-on-top preference synchronization.
- [x] Kept React `useEffect` hooks in `App.tsx` while delegating only side-effect details to plain helper functions.
- [x] Preserved optional IPC calls, dark/texture-disabled class toggles, font-scale clamping and rem formula, and the always-on-top guard.
- [x] Added `verify:app-shell-effects-module` to `verify:cleanup-core` and refreshed the personalization verifier to accept the shell-effects helper as the font-scale clamp consumer.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Shell Effects Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-shell-effects-module.ts` before extraction | failed as expected because `src/app/appShellEffects.ts` did not exist |
| `npm run verify:app-shell-effects-module` after extraction | passed |
| `npm run verify:app-personalization-module` after refreshing stale boundary check | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 36: App Companion Actions Helper Split
- [x] Added red/green structural verification for App Companion action-handler workflows.
- [x] Extracted `src/app/appCompanionActions.ts` for vault selection, Companion preview, Companion sync, and mobile inbox import actions.
- [x] Kept `App.tsx` responsible for React state, lazy capture item construction, settings state, and IPC/store dependency wiring while passing explicit dependencies into the action factory.
- [x] Preserved cancelled vault chooser guard, vault-path settings merge, preview/sync/mobile import status mapping, lazy capture lookup, and mobile inbox item merge behavior.
- [x] Added `verify:app-companion-actions-module` to `verify:cleanup-core` and refreshed companion status/mobile verifiers to accept the new action-helper consumer boundary.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Companion Actions Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-companion-actions-module.ts` before extraction | failed as expected because `src/app/appCompanionActions.ts` did not exist |
| `npm run verify:app-companion-actions-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:app-companion-status-module` after refreshing stale boundary check | passed |
| `npm run verify:app-companion-mobile-module` after refreshing stale boundary check | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 37: App Obsidian Template Actions Helper Split
- [x] Added red/green structural verification for App Obsidian template/settings sync action workflows.
- [x] Extracted `src/app/appObsidianTemplateActions.ts` for template settings updates, template reset, and settings sync preview actions.
- [x] Kept `App.tsx` responsible for React state, current task/note inputs, modal wiring, and store dependency wiring while passing explicit dependencies into the action factory.
- [x] Preserved local template state update before persistence, sync-preview clearing after template changes/reset, reset result guard, settings sync preview inputs, and `preview || null` fallback.
- [x] Added `verify:app-obsidian-template-actions-module` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Obsidian Template Actions Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-obsidian-template-actions-module.ts` before extraction | failed as expected because `src/app/appObsidianTemplateActions.ts` did not exist |
| `npm run verify:app-obsidian-template-actions-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 38: App AI Review Lifecycle Helper Split
- [x] Added red/green structural verification for App AI review startup/tick/onboarding lifecycle wiring.
- [x] Extracted `src/app/appAiReviewLifecycle.ts` for startup backfill, daily AI review tick handling, weekly/monthly scheduled report generation, and onboarding request checks.
- [x] Kept `App.tsx` responsible for React effect placement, `allTasksRef`, `isLoaded` gating, and `aiOnboarding` state while passing explicit dependencies into the helper.
- [x] Preserved startup backfill guard, lazy task lookup for scheduled callbacks, scheduled report date/result helper usage, listener cleanup, and onboarding active guard.
- [x] Added `verify:app-ai-review-lifecycle-module` to `verify:cleanup-core` and refreshed the scheduled report verifier to accept the new lifecycle-helper consumer boundary.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App AI Review Lifecycle Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-ai-review-lifecycle-module.ts` before extraction | failed as expected because `src/app/appAiReviewLifecycle.ts` did not exist |
| `npm run verify:app-ai-review-lifecycle-module` after extraction | passed |
| `npm run verify:app-scheduled-reports-module` after refreshing stale boundary check | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 39: App Startup Settings Helper Split
- [x] Added red/green structural verification for App startup Companion/template settings loading.
- [x] Extracted `src/app/appStartupSettings.ts` for Companion settings loading and Obsidian template settings loading with default fallbacks.
- [x] Kept `App.tsx` responsible for React effect placement, UI-state startup loading order, and state initialization while passing explicit dependencies into the helper.
- [x] Preserved Companion settings direct success setter, Companion catch fallback, guarded Obsidian template success setter, and Obsidian template catch fallback.
- [x] Added `verify:app-startup-settings-module` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Startup Settings Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-startup-settings-module.ts` before extraction | failed as expected because `src/app/appStartupSettings.ts` did not exist |
| `npm run verify:app-startup-settings-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 40: App UI Actions Helper Split
- [x] Added red/green structural verification for App inline UI action wiring.
- [x] Extracted `src/app/appUiActions.ts` for daily-work panel, inspiration panel, task search, and open-only filter toggles.
- [x] Kept `App.tsx` responsible for React state ownership, JSX layout, persistence effects, and task filtering while passing setter dependencies into the helper.
- [x] Preserved mutual exclusion between daily-work and inspiration panels, close-panel behavior, search toggle behavior, and open-only toggle behavior.
- [x] Added `verify:app-ui-actions-module` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App UI Actions Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-ui-actions-module.ts` before extraction | failed as expected because `src/app/appUiActions.ts` did not exist |
| `npm run verify:app-ui-actions-module` after extraction | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 41: App Completion Actions Helper Split
- [x] Added red/green structural verification for App task/subtask completion action workflows.
- [x] Extracted `src/app/appCompletionActions.ts` for main task toggles, subtask toggles, completion dialog save/no-review actions, review viewing, and subtask priority updates.
- [x] Kept `App.tsx` responsible for React state ownership, dialog rendering, task data sources, and mutation dependency wiring while passing explicit dependencies into the helper.
- [x] Preserved main-task review gating, recursive subtask lookup, no-review subtask completion, completion-target resolution, dialog cleanup, review-view routing, and tree-aware subtask priority updates.
- [x] Added `verify:app-completion-actions-module` to `verify:cleanup-core` and refreshed stale task-list/task-tree/completion-flow verifiers to accept the new action-helper consumer boundary.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Completion Actions Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-completion-actions-module.ts` before extraction | failed as expected because `src/app/appCompletionActions.ts` did not exist |
| `npm run verify:app-completion-actions-module` after extraction | passed |
| `npm run typecheck` after extraction | initially failed on stale `TaskCompletionReview` import in `App.tsx`; passed after removing the unused import |
| `npm run verify:task-list-interactions` after refreshing stale boundary check | passed |
| `npm run verify:app-task-tree-module` after refreshing stale boundary check | passed |
| `npm run verify:app-completion-flow-module` after refreshing stale boundary check | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 42: App Modal Actions Helper Split
- [x] Added red/green structural verification for App modal and shell action wiring.
- [x] Extracted `src/app/appModalActions.ts` for TitleBar compact/settings/lock-position actions, SettingsPanel close/Companion opener, AI onboarding completion, template editor save/cancel, and Companion panel close.
- [x] Kept `App.tsx` responsible for React state ownership, JSX layout, and current settings/template values while passing explicit dependencies into the helper.
- [x] Preserved lock-window setting update shape, Settings-to-Companion panel transition, AI onboarding `setSettings` side effect and cleanup, guarded template save, and modal close behavior.
- [x] Added `verify:app-modal-actions-module` to `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Modal Actions Helper Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-app-modal-actions-module.ts` before extraction | failed as expected because `src/app/appModalActions.ts` did not exist |
| `npm run verify:app-modal-actions-module` after extraction | passed |
| `npm run typecheck` after extraction | initially failed on overly-wide optional `setSettings` helper type; passed after narrowing the dependency type |
| `npm run verify:app-template-editor-module` after refreshing stale boundary check | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 43: App Dialog State Actions Extension
- [x] Extended the App modal actions verifier before implementation and confirmed the red state because `cancelCompletion`, `closeReview`, and `addCompletionRecord` did not exist in `src/app/appModalActions.ts`.
- [x] Extended `src/app/appModalActions.ts` to cover TaskCompletionDialog cancel, TaskReviewDialog close, and TaskReviewDialog add-record state callbacks with explicit `Task` state setter dependencies.
- [x] Updated `src/App.tsx` to use `appModalActions.cancelCompletion`, `appModalActions.closeReview`, and `appModalActions.addCompletionRecord` instead of inline closures.
- [x] Kept completion save/no-review business workflows in `src/app/appCompletionActions.ts`; this slice only moved pure dialog state callbacks.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Dialog State Actions Extension Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-modal-actions-module` after extending verifier, before implementation | failed as expected because `cancelCompletion` was missing from the helper |
| `npm run verify:app-modal-actions-module` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 44: App Template Edit Action Extension
- [x] Extended the App modal actions verifier before implementation and confirmed the red state because `editTemplate` did not exist in `src/app/appModalActions.ts`.
- [x] Extended `src/app/appModalActions.ts` to cover the SettingsPanel template-editor opener with an explicit `AppTemplateKind` setter action.
- [x] Updated `src/App.tsx` to use `appModalActions.editTemplate` instead of the inline `onEditTemplate={(kind) => setEditingTemplateKind(kind)}` callback.
- [x] Kept template save/cancel behavior unchanged in the existing modal actions helper.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Template Edit Action Extension Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-modal-actions-module` after extending verifier, before implementation | failed as expected because `editTemplate` was missing from the helper |
| `npm run verify:app-modal-actions-module` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 45: App Keyboard Shortcut Action Helper Extension
- [x] Extended the App keyboard shortcuts verifier before implementation and confirmed the red state because `applyAppKeyboardShortcutAction` did not exist in `src/app/appKeyboardShortcuts.ts`.
- [x] Extended `src/app/appKeyboardShortcuts.ts` to own shortcut action application for compact-mode toggle, selected daily note opening, and selected-date shifting while preserving the existing shortcut decision helper.
- [x] Updated `src/App.tsx` to keep the React `keydown` effect/listener but delegate action application to `applyAppKeyboardShortcutAction` with explicit setter/action dependencies.
- [x] Moved the `shiftDateKey` consumer for keyboard shortcuts from `App.tsx` into the keyboard shortcut helper without changing the `[` / `]` shortcut behavior.
- [x] Refreshed stale date/task-tree verifiers that still expected `App.tsx` to import `shiftDateKey` directly; they now verify the helper consumer boundary.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Keyboard Shortcut Action Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-keyboard-shortcuts-module` after extending verifier, before implementation | failed as expected because `applyAppKeyboardShortcutAction` was missing from the helper |
| `npm run verify:app-keyboard-shortcuts-module` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:app-task-tree-module` after refreshing stale boundary check | passed |
| `npm run verify:date-key-reuse` after refreshing stale boundary check | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 46: App Task Menu Listener Registrar
- [x] Extended the App task-menu actions verifier before implementation and confirmed the red state because `registerTaskMenuActionListener` did not exist in `src/app/taskMenuActions.ts`.
- [x] Extended `src/app/taskMenuActions.ts` to own Electron task-menu popup listener registration while preserving parsing and action application through `parseTaskMenuAction` and `applyParsedTaskMenuAction`.
- [x] Updated `src/App.tsx` to keep the React `useEffect` lifecycle and dependency array but delegate listener registration to `registerTaskMenuActionListener(window.electronAPI, handlers)`.
- [x] Refreshed the stale context-menu verifier boundary so popup IPC forwarding is checked in `taskMenuActions.ts` and App wiring is checked through the registrar helper.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Task Menu Listener Registrar Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-task-menu-actions-module` after extending verifier, before implementation | failed as expected because `registerTaskMenuActionListener` was missing from the helper |
| `npm run verify:app-task-menu-actions-module` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:context-menu` after refreshing stale boundary check | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 47: App AddTaskInput Direct Handler Cleanup
- [x] Extended the App UI actions verifier before implementation and confirmed the red state because `AddTaskInput` still received a pure pass-through inline wrapper around `addTask`.
- [x] Updated `src/App.tsx` to pass `addTask` directly to `AddTaskInput` as `onAdd={addTask}`.
- [x] Preserved the existing add-task argument order and default selected-date fallback because `AddTaskInput` and `useTasks.addTask` already share the same compatible callback shape.
- [x] Kept this as a JSX wiring cleanup only; no UI copy, storage keys, task mutation behavior, or AddTaskInput parsing behavior changed.
- [x] Run focused verifier and TypeScript after this slice.
- **Status:** complete

## App AddTaskInput Direct Handler Cleanup Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-ui-actions-module` after extending verifier, before implementation | failed as expected because `AddTaskInput` used a pure inline `addTask` pass-through wrapper |
| `npm run verify:app-ui-actions-module` after implementation | passed |
| `npm run typecheck` after implementation | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 48: App Personalization Actions Helper Extension
- [x] Extended the App personalization verifier before implementation and confirmed the red state because `createAppPersonalizationActions` did not exist in `src/app/appPersonalization.ts`.
- [x] Extended `src/app/appPersonalization.ts` to expose theme/personality action wiring for applying theme presets, resetting the current theme defaults, recording personalization changes with remembered opacity overrides, and toggling dark mode.
- [x] Updated `src/App.tsx` to create `appPersonalizationActions` with explicit state setter dependencies and pass those actions to `SettingsPanel` and `Header` instead of keeping inline handlers.
- [x] Preserved the existing theme preset override memory, reset fallback through `getThemeDefaultsReset`, personalization override recording through `rememberThemeOverride`, and dark-mode toggle forwarding.
- [x] Refreshed the personalization verifier boundary so the low-level personalization helpers are now checked inside `appPersonalization.ts` instead of as direct `App.tsx` calls.
- [x] Run focused verifier and TypeScript after this slice.
- **Status:** complete

## App Personalization Actions Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-personalization-module` after extending verifier, before implementation | failed as expected because `createAppPersonalizationActions` was missing from the helper |
| `npm run verify:app-personalization-module` after implementation | passed |
| `npm run typecheck` after implementation | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 49: App Companion Settings Updater Helper
- [x] Extended the App Companion actions verifier before implementation and confirmed the red state because `App.tsx` still owned the inline state-plus-persistence updater and did not import `createCompanionSettingsUpdater`.
- [x] Extended `src/app/appCompanionActions.ts` to expose `createCompanionSettingsUpdater`, preserving the previous local-state-first then store-persistence order.
- [x] Updated `src/App.tsx` to create `updateCompanionSettings` through the helper and removed the now-unneeded direct `CompanionSettings` type import.
- [x] Tightened the verifier to check both helper implementation details and App wiring.
- [x] Run focused verifier and TypeScript after this slice.
- **Status:** complete

## App Companion Settings Updater Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-companion-actions-module` after extending verifier, before implementation | failed as expected because `App.tsx` did not import/use `createCompanionSettingsUpdater` |
| `npm run verify:app-companion-actions-module` after implementation | passed |
| `npm run typecheck` after widening the persistence dependency to `Promise<unknown>` | passed |


### Phase 50: App Companion Capture Getter Helper
- [x] Extended the App Companion capture verifier before implementation and confirmed the red state because `createAppCompanionCaptureGetter` did not exist in `src/app/appCompanionCapture.ts`.
- [x] Extended `src/app/appCompanionCapture.ts` to expose a lazy capture getter factory that delegates to `createAppCompanionCaptureItems` at call time.
- [x] Updated `src/App.tsx` to create `getCurrentCaptureItems` through `createAppCompanionCaptureGetter` while preserving the same current task/date/note/mobile inputs.
- [x] Tightened the verifier so `App.tsx` imports only the getter helper and no longer inlines the lazy capture construction callback.
- [x] Run focused verifier and TypeScript after this slice.
- **Status:** complete

## App Companion Capture Getter Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-companion-capture-module` after extending verifier, before implementation | failed as expected because `createAppCompanionCaptureGetter` was missing from the helper |
| `npm run verify:app-companion-capture-module` after implementation | passed |
| `npm run typecheck` after removing the unused direct capture-items import from `App.tsx` | passed |

### Phase 51: App Keyboard Shortcut Listener Registrar
- [x] Extended the App keyboard shortcuts verifier before implementation and confirmed the red state because `registerAppKeyboardShortcutListener` did not exist in `src/app/appKeyboardShortcuts.ts`.
- [x] Extended `src/app/appKeyboardShortcuts.ts` to own DOM `keydown` listener registration and cleanup while reusing the existing shortcut decision and action-application helpers.
- [x] Updated `src/App.tsx` to keep the React `useEffect` lifecycle and dependency array but delegate listener registration to `registerAppKeyboardShortcutListener(window, deps)`.
- [x] Preserved compact-mode, selected daily note, and selected-date shortcut behavior without changing visible UI copy, storage keys, or IPC channels.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Keyboard Shortcut Listener Registrar Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-keyboard-shortcuts-module` after extending verifier, before implementation | failed as expected because `registerAppKeyboardShortcutListener` was missing from the helper |
| `npm run verify:app-keyboard-shortcuts-module` after implementation | passed |
| `npm run typecheck` after implementation | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 52: App Startup State Orchestrator
- [x] Extended the App startup settings verifier before implementation and confirmed the red state because `loadAppStartupState` did not exist in `src/app/appStartupSettings.ts`.
- [x] Extended `src/app/appStartupSettings.ts` to expose `loadAppStartupState`, which calls `loadAppUiState(uiState)` before `loadAppStartupSettings(startupSettings)` to preserve startup load ordering.
- [x] Updated `src/App.tsx` to keep the React startup `useEffect` lifecycle but delegate startup UI-state plus Companion/template settings loading through one orchestrator.
- [x] Refreshed the UI-state persistence verifier boundary so direct startup loading is checked through the orchestrator while `persistAppUiState` remains the persistence boundary.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## App Startup State Orchestrator Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-startup-settings-module` after extending verifier, before implementation | failed as expected because `loadAppStartupState` was missing from the helper |
| `npm run verify:app-startup-settings-module` after implementation | passed |
| `npm run verify:app-ui-state-persistence-module` after boundary refresh | passed |
| `npm run typecheck` after implementation | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 53: SettingsPanel AI Review Root Section Extraction
- [x] Added red/green structural verification for the AI Review root settings section boundary.
- [x] Extracted `src/components/settings/AiReviewSettingsSection.tsx` as the presentational root wrapper for AI Review settings.
- [x] Updated `src/components/SettingsPanel.tsx` to render `AiReviewSettingsSection` instead of directly composing AI account, routing, manual generation, source, and timer subsections.
- [x] Preserved AI Review state ownership, persistence, generation IPC side effects, progress fallback, and diagnostics in `SettingsPanel.tsx` while moving only JSX composition into the new section module.
- [x] Refreshed stale settings verifier boundaries so child-section checks target `AiReviewSettingsSection` after the parent extraction, and shared controls are checked through settings section consumers instead of direct `SettingsPanel` imports.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## SettingsPanel AI Review Root Section Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-ai-review-section` after adding verifier, before implementation | failed as expected because `AiReviewSettingsSection` did not exist |
| `npm run verify:settings-ai-review-section` after implementation | passed |
| `npm run verify:settings-ai-review-report-routing-section` after boundary refresh | passed |
| `npm run verify:settings-ai-review-source-section` after boundary refresh | passed |
| `npm run verify:settings-ai-review-manual-generation-section` after boundary refresh | passed |
| `npm run verify:settings-ai-review-timer-section` after boundary refresh | passed |
| `npm run verify:settings-panel-modules` after boundary refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 54: TaskItem Stack Segment Style Helper
- [x] Extended the focused TaskItem stack verifier before implementation and confirmed the red state because `getStackSegmentStyle` was still local to `TaskItem.tsx`.
- [x] Moved `getStackSegmentStyle` into `src/components/taskItem/taskItemStack.ts` alongside the collapsed stack constants and segment-count helper.
- [x] Updated `src/components/TaskItem.tsx` to import the style helper from the stack module and removed the now-unused local `CSSProperties` type import.
- [x] Preserved collapsed child-task stack CSS variable naming, segment counts, animation constants, and rendering behavior.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Stack Segment Style Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-stack-helper` after extending verifier, before implementation | failed as expected because `taskItemStack.ts` did not yet export `getStackSegmentStyle` |
| `npm run verify:task-item-stack-helper` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 55: TaskItem Interaction Propagation Helper
- [x] Added red/green structural verification for the TaskItem interaction helper boundary.
- [x] Extracted `stopClusterToggle` into `src/components/taskItem/taskItemInteractions.ts` as a hook-free helper that only stops event propagation.
- [x] Updated `src/components/TaskItem.tsx` to import `stopClusterToggle` from the interactions module and removed the now-unused React `MouseEvent`/`PointerEvent` type imports.
- [x] Added `verify:task-item-interactions-helper` and included it in `verify:cleanup-core`.
- [x] Preserved nested action-layer click/pointer propagation blocking and double-click text-edit propagation behavior.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Interaction Propagation Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-interactions-helper` after adding verifier, before implementation | failed as expected because `taskItemInteractions.ts` did not exist |
| `npm run verify:task-item-interactions-helper` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 56: TaskItem Editing Decision Helper
- [x] Added red/green structural verification for the TaskItem editing helper boundary.
- [x] Extracted submitted text normalization into `src/components/taskItem/taskItemEditing.ts` so trimming and empty-text suppression are owned by a pure helper.
- [x] Extracted edit-key action mapping into `getTaskEditKeyAction`, preserving Enter submit, Escape cancel, and null for unrelated keys.
- [x] Updated `src/components/TaskItem.tsx` to keep React state and callbacks local while delegating edit decisions to the helper.
- [x] Added `verify:task-item-editing-helper` and included it in `verify:cleanup-core`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Editing Decision Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-editing-helper` after adding verifier, before implementation | failed as expected because `taskItemEditing.ts` did not exist |
| `npm run verify:task-item-editing-helper` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 57: TaskItem Cluster Keyboard Toggle Helper
- [x] Extended the TaskItem interactions verifier before implementation and confirmed the red state because `shouldToggleTaskClusterForKey` was missing from `src/components/taskItem/taskItemInteractions.ts`.
- [x] Added `shouldToggleTaskClusterForKey(key)` to keep the parent-task cluster keyboard toggle key decision next to the existing propagation helper.
- [x] Updated `src/components/TaskItem.tsx` so `handleClusterKeyDown` delegates Enter/Space filtering to the helper while preserving local `preventDefault()` and `onToggleCollapse(task.id)` behavior.
- [x] Preserved the no-children guard, Enter/Space keyboard accessibility behavior, and React event ownership in `TaskItem.tsx`.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Cluster Keyboard Toggle Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-interactions-helper` after extending verifier, before implementation | failed as expected because `shouldToggleTaskClusterForKey` was missing |
| `npm run verify:task-item-interactions-helper` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 58: TaskItem Parent Text Title Helper
- [x] Extended the focused TaskItem SubtaskCard/presentation verifier before implementation and confirmed the red state because `getTaskTextTitle` was missing from `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Added `getTaskTextTitle(task)` to `taskItemPresentation.tsx` so parent task tooltip text formatting lives with the shared priority-title presentation helpers.
- [x] Updated `src/components/TaskItem.tsx` to use `title={getTaskTextTitle(task)}` and removed inline parent title formatting from the component.
- [x] Preserved the existing tooltip format: task text, middle-dot separator, and localized priority title.
- [x] Run focused verification and TypeScript after this slice.
- **Status:** complete

## TaskItem Parent Text Title Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `getTaskTextTitle` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 59: TaskItem Parent Card ClassName Helper
- [x] Extended the focused TaskItem SubtaskCard/presentation verifier before implementation and confirmed the red state because `getTaskCardClassName` was missing from `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Added `getTaskCardClassName(options)` to `taskItemPresentation.tsx` so parent task-card class composition lives with the shared presentation helpers.
- [x] Updated `src/components/TaskItem.tsx` to pass `hasChildren`, `hasTags`, `canOpenReviewAction`, and `task.completed` into the helper instead of inlining the long className template.
- [x] Refreshed the stale `verify:task-list-interactions` boundary so it checks the helper module for preserved review-action class reservation and `TaskItem.tsx` for helper wiring.
- [x] Preserved base task card classes, child/tag/review/completed state classes, review backfill layout reservation, and accessible cluster-toggle surface behavior.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Parent Card ClassName Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `getTaskCardClassName` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` after boundary refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 60: TaskItem Parent Cluster ClassName Helper
- [x] Extended the focused TaskItem SubtaskCard/presentation verifier before implementation and confirmed the red state because `getTaskClusterClassName` was missing from `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Added `TaskClusterClassNameOptions` and `getTaskClusterClassName(options)` so the outer parent task-cluster wrapper class composition lives with the shared presentation helpers.
- [x] Updated `src/components/TaskItem.tsx` to pass `hasChildren` and `isExpanded` into the helper instead of inlining the cluster wrapper template.
- [x] Refreshed the stale `verify:context-menu` boundary so it checks preserved cluster child-state classes in `taskItemPresentation.tsx` and continued collapse wiring in `TaskItem.tsx`.
- [x] Preserved child/no-child cluster classes, expanded/collapsed classes, click/key collapse behavior, and accessible parent cluster toggling.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Parent Cluster ClassName Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `getTaskClusterClassName` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:context-menu` after boundary refresh | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 61: TaskItem Parent Metadata Preview Helpers
- [x] Extended the focused TaskItem SubtaskCard/presentation verifier before implementation and confirmed the red state because `getVisibleTaskTags` was missing from `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Added `getVisibleTaskTags(tags)` and `getVisibleScheduledDates(scheduledDates)` so parent task metadata preview slicing/counting lives with shared presentation helpers.
- [x] Updated `src/components/TaskItem.tsx` to derive `visibleTags`, `remainingTagCount`, `visibleScheduledDates`, and `remainingScheduledDateCount` from helpers instead of inlining slice/count expressions.
- [x] Preserved the existing parent metadata rendering structure, first-two tag preview, first-three scheduled-date preview, `+N` overflow behavior, and displayed scheduled-date separator/copy.
- [x] Run focused cleanup regression and production build after this slice.
- **Status:** complete

## TaskItem Parent Metadata Preview Helpers Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `getVisibleTaskTags` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:context-menu` | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 62: TaskItem Completion Action Presentation Helpers
- [x] Added red/green structural verification for parent completion action presentation helpers.
- [x] Extracted `getTaskCompleteActionClassName` into `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Extracted `getTaskCompleteActionLabel` into `src/components/taskItem/taskItemPresentation.tsx` and reused it for both `aria-label` and `title`.
- [x] Kept `TaskItem.tsx` responsible for click handling, event propagation, and task toggle callback wiring.
- [x] Ran focused TaskItem verifier, task-list interactions, TypeScript, cleanup-core, and production build.
- **Status:** complete

## TaskItem Completion Action Presentation Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` | failed as RED before helper extraction, then passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 63: TaskItem Review Action Label Helper
- [x] Added red/green structural verification for the parent review action label helper.
- [x] Extracted `getTaskReviewActionLabel` into `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Updated `TaskItem.tsx` to derive `reviewActionLabel` and pass it into `ReviewActionButton`.
- [x] Updated stale task-list interaction verification so concrete review-action copy is protected in `taskItemPresentation.tsx` while `TaskItem.tsx` proves helper wiring.
- [x] Preserved review action visibility, click routing, and layout-reservation behavior.
- **Status:** complete

## TaskItem Review Action Label Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` | failed as RED before helper extraction, then passed |
| `npm run verify:task-list-interactions` | failed on stale inline-location assertion, then passed after boundary update |
| `npm run typecheck` | passed |

### Phase 64: TaskItem Accessible Copy Constants
- [x] Added red/green structural verification for parent TaskItem accessibility labels.
- [x] Moved drag-handle, edit-input, delete-action, and subtasks-region labels into `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Updated `src/components/TaskItem.tsx` to consume shared label constants instead of inlining presentation copy.
- [x] Preserved drag, edit, delete, and expanded-subtask accessibility attributes while keeping event handling and state local to `TaskItem.tsx`.
- **Status:** complete

## TaskItem Accessible Copy Constants Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `TASK_DRAG_HANDLE_LABEL` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run typecheck` | passed |

### Phase 65: TaskItem Delete Action Component
- [x] Added red/green structural verification for the parent TaskItem delete action component boundary.
- [x] Extracted `DeleteActionButton` into `src/components/taskItem/taskItemPresentation.tsx` beside `ReviewActionButton` and the shared icons.
- [x] Updated `src/components/TaskItem.tsx` to render `DeleteActionButton onClick={onDelete}` instead of inlining the Framer Motion delete button markup.
- [x] Preserved delete button hover/tap animation, CSS classes, shared accessible copy, and callback routing.
- **Status:** complete

## TaskItem Delete Action Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `DeleteActionButton` was missing |
| `npm run typecheck` after implementation | passed |
| `npm run verify:task-item-subtask-card-module` after verifier boundary refresh | passed |
| `npm run verify:task-list-interactions` | passed |

### Phase 66: TaskItem Complete Action Component
- [x] Added red/green structural verification for the parent TaskItem completion action component boundary.
- [x] Extracted `CompleteActionButton` into `src/components/taskItem/taskItemPresentation.tsx` beside the other parent action controls.
- [x] Updated `src/components/TaskItem.tsx` to render `CompleteActionButton` instead of inlining the completion button and checkmark SVG.
- [x] Preserved completion action classes, accessible label/title reuse, checkmark SVG, click propagation blocking, pointer propagation blocking, and `onToggle` callback routing.
- **Status:** complete

## TaskItem Complete Action Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `CompleteActionButton` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` after boundary refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 67: TaskItem Drag Handle Button Component
- [x] Added red/green structural verification for the parent TaskItem drag-handle component boundary.
- [x] Extracted `TaskDragHandleProps` and `DragHandleButton` into `src/components/taskItem/taskItemPresentation.tsx` beside the other parent action controls.
- [x] Updated `src/components/TaskItem.tsx` to render `DragHandleButton` while re-exporting `TaskDragHandleProps` so the existing `TaskList.tsx` import path stays stable.
- [x] Preserved drag activator ref wiring, attributes/listeners spreading, disabled fallback, accessible label, pointer/click propagation blocking, and `aria-disabled` behavior.
- [x] Refreshed stale interaction/layout verifiers so drag-handle and completion-button structure are checked at the new presentation boundary.
- **Status:** complete

## TaskItem Drag Handle Button Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `TaskDragHandleProps` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` after boundary refresh | passed |
| `npm run verify:task-layout-unified-glass` after boundary refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 68: TaskItem Edit Input Component
- [x] Added red/green structural verification for the parent TaskItem edit-input component boundary.
- [x] Extracted `TaskEditInputProps` and `TaskEditInput` into `src/components/taskItem/taskItemPresentation.tsx` beside the other parent presentation controls.
- [x] Updated `src/components/TaskItem.tsx` to render `TaskEditInput` while keeping edit state, submit/cancel decisions, and task mutation callbacks local.
- [x] Preserved input type, value binding, text-change routing, blur submit, keydown routing, autofocus, CSS class, accessible label, and click/pointer propagation blocking.
- [x] Ran focused TaskItem verifier, interaction/layout checks, TypeScript, cleanup-core, and production build.
- **Status:** complete

## TaskItem Edit Input Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `TaskEditInputProps` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 69: TaskItem Action Layer Component
- [x] Added red/green structural verification for the parent TaskItem action-layer presentation boundary.
- [x] Extracted `TaskActionLayer` into `src/components/taskItem/taskItemPresentation.tsx` so the review/delete slot wrapper lives beside the action buttons it renders.
- [x] Updated `src/components/TaskItem.tsx` to render `TaskActionLayer` while keeping review visibility, review routing, delete callback ownership, and parent row placement local.
- [x] Preserved action-layer class names, review/delete slot classes, review-zone/delete-zone reservations, click/pointer propagation blocking, review button visibility, and delete button routing.
- [x] Refreshed stale interaction/layout/action-alignment verifiers so action-layer structure is checked at the presentation boundary and `TaskItem.tsx` proves component wiring.
- **Status:** complete

## TaskItem Action Layer Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `TaskActionLayer` was missing |
| `npm run verify:task-item-subtask-card-module` after implementation and verifier boundary refresh | passed |
| `npm run verify:task-list-interactions` after boundary refresh | passed |
| `npm run verify:task-action-alignment` after boundary refresh | passed |
| `npm run verify:task-layout-unified-glass` after boundary refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 70: TaskItem Stack Segments Component
- [x] Added red/green structural verification for the collapsed stack segment component boundary.
- [x] Extracted `TaskStackSegments` into `src/components/taskItem/TaskStackSegments.tsx` so the fixed Framer Motion segment markup lives outside `TaskItem.tsx`.
- [x] Updated `src/components/TaskItem.tsx` to render `TaskStackSegments` while keeping collapsed/expanded decisions, stack shell style, and subtask virtualization ownership local.
- [x] Preserved segment container and item classes, decorative `aria-hidden`, opacity-only animation, reduced-motion behavior, and shared transition constants.
- [x] Refreshed stale `verify:task-cluster-stack` assertions so stack constants live in `taskItemStack.ts`, segment JSX lives in `TaskStackSegments.tsx`, and subtask delete markup lives in `SubtaskCard.tsx`.
- **Status:** complete

## TaskItem Stack Segments Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-stack-helper` after extending verifier, before implementation | failed as expected because `TaskStackSegments.tsx` was missing |
| `npm run verify:task-item-stack-helper` after implementation | passed |
| `npm run verify:task-cluster-stack` after stale boundary refresh | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 71: TaskItem Context Menu Open Payload Helper
- [x] Added red/green structural verification for composing the TaskItem context-menu open payload in the helper module.
- [x] Extracted theme+payload composition into `src/components/taskItem/taskItemContextMenu.ts` while keeping DOM lookup and IPC invocation in `TaskItem.tsx`.
- [x] Refreshed stale context-menu/theme verification boundaries that still expected theme token strings inline in `TaskItem.tsx`.
- [x] Ran focused context-menu/theme verification, cleanup regression, TypeScript, and production build.
- **Status:** complete

## TaskItem Context Menu Open Payload Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-context-menu-helper` after extending verifier, before implementation | failed as expected because `createTaskContextMenuOpenPayload` was missing |
| `npm run verify:task-item-context-menu-helper` after implementation | passed |
| `npm run verify:context-menu` after stale boundary refresh | passed |
| `npm run verify:theme-no-blue` after stale boundary refresh | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 72: TaskItem Main Content Component
- [x] Add red/green structural verification for the parent task main-content presentation boundary.
- [x] Extract the parent edit/text/tags/scheduled-date JSX into `TaskMainContent` in `src/components/taskItem/taskItemPresentation.tsx`.
- [x] Keep edit state, submit/cancel decisions, and task callbacks in `TaskItem.tsx` while delegating fixed presentation markup.
- [x] Refresh stale verifiers that still expect parent text/tag/date markup directly in `TaskItem.tsx`.
- [x] Run focused TaskItem verification, related layout/context checks, cleanup regression, TypeScript, and production build.
- **Status:** complete

## TaskItem Main Content Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` before verifier calibration | failed as expected on the missing/new `TaskMainContent` boundary, then exposed stale `getTaskTextTitle` location assertion |
| `npm run verify:task-item-subtask-card-module` after implementation and verifier refresh | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:context-menu` | passed |
| `npm run verify:task-layout-unified-glass` after stale boundary refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 73: TaskItem Subtasks View Component
- [x] Add red/green structural verification for the expanded subtask viewport component boundary.
- [x] Extract expanded subtask viewport/list/spacer JSX into `TaskSubtasksViewport` in `src/components/taskItem/TaskSubtasksViewport.tsx`.
- [x] Keep expansion state, virtual-subtask hook ownership, and parent task callbacks in `TaskItem.tsx` while delegating fixed viewport rendering.
- [x] Refresh stale verifiers that still expect virtual subtask list markup directly in `TaskItem.tsx`.
- [x] Run focused TaskItem verification, related stack/interaction/layout checks, cleanup regression, TypeScript, and production build.
- **Status:** complete

## TaskItem Subtasks View Component Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtasks-viewport` before implementation | failed as expected because `TaskSubtasksViewport.tsx` did not exist |
| `npm run verify:task-item-subtasks-viewport` after implementation | passed |
| `npm run verify:task-item-subtask-card-module` after stale boundary refresh | passed |
| `npm run verify:task-cluster-stack` after stale boundary refresh | passed |
| `npm run verify:task-list-interactions` after stale boundary refresh | passed |
| `npm run verify:context-menu` after stale boundary refresh | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` after stale verifier calibration | passed |
| `npm run build` | passed |

### Phase 74: TaskItem SVG Icons Module
- [x] Re-read current TaskItem presentation/icon boundaries and chose the next low-risk extraction.
- [x] Extended focused structural verification before implementation and confirmed RED because `src/components/taskItem/taskItemIcons.tsx` did not exist.
- [x] Extracted pure SVG icon components into `src/components/taskItem/taskItemIcons.tsx`.
- [x] Updated `taskItemPresentation.tsx` and `SubtaskCard.tsx` to import icons from the new icon module.
- [x] Preserved the existing review-eye, empty-review document, drag-dots, and trash SVG paths.
- [x] Ran focused TaskItem verification, related interaction/layout checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskItem SVG Icons Module Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `taskItemIcons.tsx` did not exist |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 75: SubtaskCard Editing Helper Reuse
- [x] Re-read current TaskItem submodules and chose the next low-risk duplication cleanup.
- [x] Extended focused editing-helper verification before implementation and confirmed RED because `SubtaskCard.tsx` still inlined edit text trimming and Enter/Escape decisions.
- [x] Updated `SubtaskCard.tsx` to reuse `getSubmittedTaskText(editText)` before `onEditSubtask`.
- [x] Updated `SubtaskCard.tsx` to reuse `getTaskEditKeyAction(event.key)` for submit/cancel key handling.
- [x] Refreshed the stale SubtaskCard verifier assertion so trimmed submission is protected through the shared helper instead of inline `editText.trim()`.
- [x] Ran focused TaskItem editing/subtask verification, task-list interaction checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## SubtaskCard Editing Helper Reuse Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-editing-helper` after extending verifier, before implementation | failed as expected because `SubtaskCard.tsx` did not import the editing helpers |
| `npm run verify:task-item-editing-helper` after implementation | passed |
| `npm run verify:task-item-subtask-card-module` before stale verifier refresh | failed on the old inline `editText.trim()` assertion |
| `npm run verify:task-item-subtask-card-module` after verifier refresh | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 76: SubtaskCard Presentation Copy Helper
- [x] Re-read current TaskItem submodule boundaries and chose the next low-risk subtask-card extraction.
- [x] Extended focused structural verification before implementation and confirmed RED because `src/components/taskItem/subtaskCardPresentation.ts` did not exist.
- [x] Added `subtaskCardPresentation.ts` for subtask completion labels, priority picker title, edit input label, text title formatting, review action labels, and delete action label.
- [x] Updated `SubtaskCard.tsx` to consume the new helper while keeping edit state, callbacks, JSX layout, and icon rendering local.
- [x] Stored Chinese copy as Unicode escapes in the helper to preserve runtime strings and avoid terminal encoding damage.
- [x] Ran focused TaskItem verification, related interaction/layout checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## SubtaskCard Presentation Copy Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `subtaskCardPresentation.ts` did not exist |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-item-editing-helper` | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 77: SubtaskCard Controls Component Module
- [x] Re-read current SubtaskCard boundaries and chose the next low-risk component extraction.
- [x] Extended focused structural verification before implementation and confirmed RED because `src/components/taskItem/subtaskCardControls.tsx` did not exist.
- [x] Added `subtaskCardControls.tsx` for the subtask completion button, priority picker wrapper, edit input, review button, delete button, and action layer.
- [x] Updated `SubtaskCard.tsx` so it keeps edit state, text synchronization, and callback routing while delegating fixed controls to the new module.
- [x] Refreshed stale action-alignment verification so concrete subtask action classes are protected in the controls module while `SubtaskCard.tsx` proves component wiring.
- [x] Ran focused TaskItem verification, related interaction/layout/action checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## SubtaskCard Controls Component Module Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `subtaskCardControls.tsx` did not exist |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-item-editing-helper` | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-action-alignment` before stale verifier refresh | failed on old SubtaskCard implementation-location assertion |
| `npm run verify:task-action-alignment` after verifier refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 78: SubtaskCard Row And Text Presentation Helpers
- [x] Re-read current SubtaskCard/control boundaries and chose a low-risk final row/text presentation extraction.
- [x] Extended focused structural verification before implementation and confirmed RED because `SubtaskCard.tsx` still inlined row class composition and text markup.
- [x] Added `getSubtaskRowClassName(completed)` to `subtaskCardPresentation.ts`.
- [x] Added `SubtaskText` to `subtaskCardControls.tsx` for the non-editing text span, title helper usage, and double-click edit callback.
- [x] Updated `SubtaskCard.tsx` to use the row class helper and `SubtaskText`, while keeping edit-state and completed-task edit gating local.
- [x] Ran focused TaskItem verification, related interaction/layout/action checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## SubtaskCard Row And Text Presentation Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `SubtaskCard.tsx` still inlined row class/text markup |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-item-editing-helper` | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 79: TaskItem Parent Controls Module
- [x] Re-read current TaskItem parent/subtask boundaries and chose a low-risk parent-controls extraction.
- [x] Extended focused structural verification before implementation and confirmed RED because `src/components/taskItem/taskItemControls.tsx` did not exist.
- [x] Added `taskItemControls.tsx` for the parent drag handle, completion button, edit input, main content, review/delete buttons, and action layer.
- [x] Updated `TaskItem.tsx` to import parent controls from the controls module while keeping task state, context-menu behavior, priority picker placement, and callback routing local.
- [x] Reduced `taskItemPresentation.tsx` to pure presentation helpers, labels, class helpers, review detection, and metadata preview derivation.
- [x] Refreshed stale interaction/layout/action-alignment verification so fixed parent control markup is protected in `taskItemControls.tsx` while `TaskItem.tsx` proves component wiring.
- [x] Ran focused TaskItem verification, related interaction/layout/action checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskItem Parent Controls Module Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-subtask-card-module` after extending verifier, before implementation | failed as expected because `taskItemControls.tsx` did not exist |
| `npm run verify:task-item-subtask-card-module` after implementation | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 80: TaskList DnD Helper And UX Verifier Calibration
- [x] Re-read the current TaskList and task-item boundaries after the parent/subtask control extractions.
- [x] Confirmed the next safe slice was verifier calibration around TaskList source grouping and extracted DnD helpers rather than another product-facing behavior change.
- [x] Confirmed `verify:task-cluster-stack` passed after the stale SubtaskCard control boundary refresh.
- [x] Rebuilt `scripts/verify-ux-polish.ts` so it checks the current grouped source headers, unified glass opacity settings, review backfill actions, and extracted task-item controls.
- [x] Confirmed RED/GREEN for the stale UX verifier: it first failed on the old source-badge expectation, then passed after calibration.
- [x] Ran focused verification, related TaskList/task-item regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList DnD Helper And UX Verifier Calibration Verification

| Command | Result |
|---------|--------|
| `npm run verify:ux-polish` before verifier calibration | failed as expected on the stale per-row source badge assertion |
| `npm run verify:ux-polish` after calibration | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-list-dnd-module` | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 81: TaskList Presentation Boundary Slice
- [x] Re-read current large-module boundaries and TaskList implementation details.
- [x] Extended focused structural verification before implementation and confirmed RED because `src/components/taskList/SortableSourceSection.tsx` did not exist.
- [x] Extracted `SortableSourceSection` from `src/components/TaskList.tsx` into `src/components/taskList/SortableSourceSection.tsx`.
- [x] Reused the shared `DragDotsIcon` from `src/components/taskItem/taskItemIcons.tsx` and removed the duplicate inline icon from TaskList.
- [x] Refreshed stale TaskList/UX verifier boundaries so source-section markup is checked in `SortableSourceSection.tsx` while `TaskList.tsx` proves component wiring.
- [x] Ran focused verification, related regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList Presentation Boundary Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-list-dnd-module` after extending verifier, before implementation | failed as expected because `SortableSourceSection.tsx` did not exist |
| `npm run verify:task-list-dnd-module` after implementation | passed |
| `npm run verify:task-list-interactions` after stale boundary refresh | passed |
| `npm run verify:ux-polish` after stale boundary refresh | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 82: TaskList Sortable Task Item Boundary Slice
- [x] Re-read current TaskList sortable task item implementation details.
- [x] Extended focused structural verification before implementation and confirmed RED because `src/components/taskList/SortableTaskItem.tsx` did not exist.
- [x] Extracted `SortableTaskItem` into `src/components/taskList/SortableTaskItem.tsx` without changing task rendering behavior.
- [x] Refreshed stale TaskList interaction verification so task sortable shell, spring motion, drag activators, and jump-to-rest behavior are checked in `SortableTaskItem.tsx` while `TaskList.tsx` proves component wiring.
- [x] Ran focused verification, related regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList Sortable Task Item Boundary Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-list-dnd-module` after extending verifier, before implementation | failed as expected because `SortableTaskItem.tsx` did not exist |
| `npm run verify:task-list-dnd-module` after implementation and boundary cleanup | passed |
| `npm run verify:task-list-interactions` after stale boundary refresh | passed |
| `npm run verify:ux-polish` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 83: TaskList Filter Toolbar Boundary Slice
- [x] Re-read the remaining `TaskList.tsx` responsibilities after the sortable item/source-section extractions.
- [x] Add or extend focused structural verification for a low-risk filter/search toolbar boundary.
- [x] Extract the fixed task toolbar controls into a task-list submodule without changing filter/search behavior.
- [x] Run focused verification, related regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList Filter Toolbar Boundary Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-list-interactions` after extending verifier, before implementation | failed as expected because `src/components/taskList/TaskListToolbar.tsx` did not exist |
| `npm run verify:task-list-interactions` after implementation | passed |
| `npm run verify:task-list-dnd-module` | passed |
| `npm run verify:ux-polish` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 84: TaskList Empty State Boundary Slice
- [x] Re-read the remaining `TaskList.tsx` presentation responsibilities after the toolbar extraction.
- [x] Add or extend focused structural verification for a low-risk empty-state boundary.
- [x] Extract the fixed empty task-list presentation into a task-list submodule without changing empty-list behavior.
- [x] Run focused verification, related regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList Empty State Boundary Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-list-interactions` after extending verifier, before implementation | failed as expected because `src/components/taskList/TaskListEmptyState.tsx` did not exist |
| `npm run verify:task-list-interactions` after implementation | passed |
| `npm run verify:task-list-dnd-module` | passed |
| `npm run verify:ux-polish` | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 85: TaskList Derived Data Helper Module
- [x] Re-read remaining `TaskList.tsx` data derivation responsibilities after the presentation extractions.
- [x] Add or extend focused structural and behavior verification for tag history/source grouping helpers.
- [x] Extract pure task-list derivation helpers without changing grouping, ordering, or tag-history behavior.
- [x] Run focused verification, related regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList Derived Data Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-list-dnd-module` after extending verifier, before implementation | failed as expected because `src/components/taskList/taskListDerivations.ts` did not exist |
| `npm run verify:task-list-dnd-module` after implementation | passed |
| `npm run verify:task-list-interactions` | passed |
| `npm run verify:ux-polish` after stale boundary refresh | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 86: TaskList Render Helper Boundary Review
- [x] Re-read the now-small `TaskList.tsx` and decided the content rendering helpers were a safe low-risk boundary.
- [x] Extended focused structural verification for `TaskListContent.tsx` before implementation and confirmed RED because the component did not exist.
- [x] Extracted empty/grouped/flat task-list composition, sortable contexts, and task/source render helpers into `src/components/taskList/TaskListContent.tsx`.
- [x] Kept `TaskList.tsx` responsible for toolbar state, scroll/floating-scrollbar ownership, DnD sensors/lifecycle handlers, drag state, and pure derivation memoization.
- [x] Refreshed stale verifier boundaries that still expected `SortableContext`, `TaskListEmptyState`, `SortableSourceSection`, or `SortableTaskItem` directly in `TaskList.tsx`.
- [x] Run focused verification, related regression checks, cleanup-core, TypeScript, and production build.
- **Status:** complete

## TaskList Render Helper Boundary Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-list-interactions` after extending verifier, before implementation | failed as expected because `TaskListContent.tsx` did not exist |
| `npm run verify:task-list-interactions` after implementation and stale boundary refresh | passed |
| `npm run verify:task-list-dnd-module` after stale boundary refresh | passed |
| `npm run verify:ux-polish` after stale boundary refresh | passed |
| `npm run verify:task-layout-unified-glass` | passed |
| `npm run verify:task-cluster-stack` | passed |
| `npm run verify:task-action-alignment` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 87: SettingsPanel Shell And Navigation Boundary
- [x] Re-read the remaining `SettingsPanel.tsx` shell and navigation responsibilities after the earlier section extractions.
- [x] Extended focused structural verification and confirmed RED because `SettingsPanelShell.tsx` and `settingsPanelNavigation.ts` did not exist.
- [x] Extracted `src/components/settings/SettingsPanelShell.tsx` for the motion shell, sidebar, grouped navigation, floating close button, and page title wrapper.
- [x] Extracted `src/components/settings/settingsPanelNavigation.ts` for section metadata, primary-section flags, and grouped navigation derivation.
- [x] Kept `src/components/SettingsPanel.tsx` responsible for AI Review state/effects, generation flow, source option arrays, and section-content composition.
- [x] Rewrote touched Chinese literals with Unicode escapes to avoid terminal mojibake while preserving runtime behavior.
- [x] Ran focused SettingsPanel verification, related section checks, TypeScript, cleanup-core, and production build.
- **Status:** complete

## SettingsPanel Shell And Navigation Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-panel-modules` before implementation | failed as expected because `SettingsPanelShell.tsx` did not exist |
| `npm run verify:ux-polish` before implementation | failed as expected because `SettingsPanelShell.tsx` did not exist |
| `npm run verify:settings-panel-modules` after implementation | passed |
| `npm run verify:ux-polish` after implementation | passed |
| `npm run verify:settings-basic-sections` | passed |
| `npm run verify:settings-sync-section` | passed |
| `npm run verify:settings-appearance-section` | passed |
| `npm run verify:settings-ai-review-section` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 88: Verification Boundary Refresh After Modularization
- [x] Reproduced the remaining `verify:rc` failures after the latest renderer/electron modularization.
- [x] Confirmed the failures were stale verifier assumptions about implementation location, not runtime regressions.
- [x] Refreshed focused verifiers to follow the current module boundaries for AI review IPC, window IPC, settings sections, scheduled reports, appearance reset behavior, and template editing delegation.
- [x] Preserved runtime behavior by changing verifier expectations instead of moving working code back into larger files.
- [x] Re-ran focused failing verifiers until green, then re-ran the full verification set plus production build.
- **Status:** complete

## Verification Boundary Refresh Verification

| Command | Result |
|---------|--------|
| `npm run verify:ai-progress-ui` | passed |
| `npm run verify:ai-regenerate-detection` | passed |
| `npm exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm run verify:completion-review-settings` | passed |
| `npm run verify:window-mode` | passed |
| `npm run verify:theme-visual-isolation` | passed |
| `npm run verify:ui-feedback-regressions` | passed |
| `npm run verify:ai-timer` | passed |
| `npm run verify:obsidian-template-ui` | passed |
| `npm run verify:rc` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 64: App Daily Panel Presentation Helper
- [x] Added red/green structural verification for App daily panel tab presentation helpers.
- [x] Extracted `src/app/appDailyPanelPresentation.ts` for daily panel content detection, tab className composition, and tab title generation.
- [x] Updated `src/App.tsx` to derive `hasDailyWorkContent` / `hasDailyInspirationContent` through the helper and reuse helper-driven class/title decisions.
- [x] Preserved click handlers, aria wiring, JSX structure, and content-dot rendering behavior.
- [x] Added the focused verifier to `package.json` and `verify:cleanup-core`.
- **Status:** complete

## App Daily Panel Presentation Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-daily-panel-presentation-module` | failed as RED before helper extraction, then passed |
| `npm run verify:app-ui-actions-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 89: App Shell Presentation Helper
- [x] Added red/green structural verification for App shell presentation helpers.
- [x] Extracted `src/app/appShellPresentation.ts` for app-shell className composition and low-opacity flag derivation.
- [x] Updated `src/App.tsx` to delegate the shell `className` and `data-low-opacity` decisions into the helper.
- [x] Preserved `data-theme`, layout structure, viewport style wiring, and all runtime theme/personalization behavior.
- [x] Added the focused verifier to `package.json` and `verify:cleanup-core`.
- **Status:** complete

## App Shell Presentation Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-shell-presentation-module` | failed as RED before helper extraction, then passed |
| `npm run verify:app-theme-state-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 90: App Frame Presentation Helper Extension
- [x] Extended App shell presentation verification to cover the outer viewport class and shell `data-theme` fallback.
- [x] Extended `src/app/appShellPresentation.ts` with `getAppViewportClassName` and `getAppShellThemeValue`.
- [x] Updated `src/App.tsx` to delegate the outer viewport loaded/opacity class and shell `data-theme` fallback to the helper.
- [x] Preserved viewport style wiring, shell layout structure, and theme-state ownership.
- [x] Reused the existing focused verifier and kept it in `verify:cleanup-core`.
- **Status:** complete

## App Frame Presentation Extension Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-shell-presentation-module` | failed as RED before helper extension, then passed |
| `npm run verify:app-viewport-style-module` | passed |
| `npm run verify:app-theme-state-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 91: App Overlay Stack Boundary
- [x] Added red/green structural verification for an App overlay-stack composition boundary.
- [x] Extracted `src/components/AppOverlayStack.tsx` to own SettingsPanel, AI onboarding, template editor, Companion panel, and completion/review dialog composition.
- [x] Updated `src/App.tsx` to derive overlay prop bags and delegate overlay rendering into `AppOverlayStack`.
- [x] Preserved existing helper ownership by keeping template fallback derivation in `App.tsx` and passing explicit modal/personalization/completion props through the new boundary.
- [x] Refreshed stale focused verifiers so modal/personalization/completion action checks follow the new prop-bag and overlay component split instead of requiring direct overlay JSX in `App.tsx`.
- [x] Kept the focused verifier in `verify:cleanup-core` and re-ran the full cleanup regression plus production build.
- **Status:** complete

## App Overlay Stack Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-overlay-stack-module` | failed as RED before extraction because `src/components/AppOverlayStack.tsx` did not exist, then passed |
| `npm run verify:app-modal-actions-module` | failed on stale direct-`App.tsx` overlay assertions, then passed after boundary refresh |
| `npm run verify:app-personalization-module` | failed on stale direct `SettingsPanel` personalization assertions during cleanup-core, then passed after boundary refresh |
| `npm run verify:app-completion-actions-module` | failed on stale direct `TaskCompletionDialog` assertions during cleanup-core, then passed after boundary refresh |
| `npm run verify:app-template-editor-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 92: App Top Content Boundary
- [x] Added red/green structural verification for an App top-content composition boundary.
- [x] Extracted `src/components/AppTopContent.tsx` to own `Header`, `DateNavigator`, daily panel tabs, both `DailyWorkPanel` instances, and `TabBar` composition.
- [x] Updated `src/App.tsx` to derive `headerProps`, `dateNavigatorProps`, `tabBarProps`, and `topContentProps`, then delegate top-area rendering into `AppTopContent`.
- [x] Refreshed stale focused verifiers so UI-action, daily-panel presentation, and personalization checks follow the new prop-bag/component split.
- [x] Kept the focused verifier in `verify:cleanup-core` and re-ran the full cleanup regression plus production build.
- **Status:** complete

## App Top Content Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-top-content-module` | failed as RED before extraction because `src/components/AppTopContent.tsx` did not exist, then passed |
| `npm run verify:app-ui-actions-module` | failed on stale task-list/daily-panel assertions, then passed after boundary refresh |
| `npm run verify:app-daily-panel-presentation-module` | failed on stale direct `App.tsx` tab-presentation assertions, then passed after boundary refresh |
| `npm run verify:app-personalization-module` | failed on stale direct `Header` forwarding assertions, then passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 93: App Main Content Boundary
- [x] Added red/green structural verification for an App main-content composition boundary.
- [x] Extracted `src/components/AppMainContent.tsx` to own the main motion shell, `app-main-scroll` container, completed-review vs task-list branch, and `AddTaskInput` forwarding.
- [x] Updated `src/App.tsx` to derive `reviewViewProps`, `taskListProps`, `addTaskInputProps`, and `mainContentProps`, then delegate main-body rendering into `AppMainContent`.
- [x] Refreshed stale focused verifiers so task-list UI/completion wiring and review/add-task expectations follow the new prop-bag/component split.
- [x] Kept the focused verifier in `verify:cleanup-core` and re-ran the full cleanup regression plus production build.
- **Status:** complete

## App Main Content Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-main-content-module` | failed as RED before extraction because `src/components/AppMainContent.tsx` did not exist, then passed |
| `npm run typecheck` | initially failed on a ref typing mismatch in `AppMainContent.tsx`, then passed after narrowing the forwarded ref prop type |
| `npm run verify:app-ui-actions-module` | failed on stale direct `TaskList` / `AddTaskInput` assertions, then passed after boundary refresh |
| `npm run verify:app-completion-actions-module` | failed on stale direct `TaskList` completion-action assertions, then passed after boundary refresh |
| `npm run verify:task-list-interactions` | failed on stale direct `App.tsx` subtask-priority wiring assertions, then passed after boundary refresh |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 94: App Shell Composition Boundary
- [x] Added red/green structural verification for an App shell-composition helper boundary.
- [x] Extracted `src/app/appShellComposition.tsx` to own `TitleBar`, `AppOverlayStack`, and `AppMainContent` prop-bag assembly plus shell-local derived values.
- [x] Updated `src/App.tsx` to delegate shell rendering through `createAppShellComposition(...)` and spread `shellComposition.titleBarProps`, `shellComposition.overlayStackProps`, and `shellComposition.mainContentProps`.
- [x] Refreshed stale focused verifiers so top-content, main-content, overlay, modal, completion, personalization, review-dialog-state, template-editor, and task-list interaction checks follow the new App → shell helper → child component boundary.
- [x] Kept the focused verifier in `verify:cleanup-core` and re-ran the full cleanup regression plus production build.
- **Status:** complete

## App Shell Composition Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-shell-composition-module` | failed as RED before extraction because `src/app/appShellComposition.tsx` did not exist, then passed |
| `npm run verify:app-top-content-module` | failed on stale direct `App.tsx` top-content assertions, then passed after boundary refresh |
| `npm run verify:app-main-content-module` | failed on stale direct `App.tsx` main-content prop-bag assertions, then passed after boundary refresh |
| `npm run verify:app-overlay-stack-module` | failed on stale direct `App.tsx` overlay prop-bag assertions, then passed after boundary refresh |
| `npm run verify:app-ui-actions-module` | failed on stale direct `App.tsx` UI prop-bag assertions, then passed after boundary refresh |
| `npm run verify:app-completion-actions-module` | failed on stale direct `App.tsx` completion prop-bag assertions, then passed after boundary refresh |
| `npm run verify:app-modal-actions-module` | failed on stale direct `App.tsx` title-bar and overlay action assertions, then passed after boundary refresh |
| `npm run verify:app-personalization-module` | failed on stale direct `App.tsx` settings/header prop-bag assertions, then passed after boundary refresh |
| `npm run verify:task-list-interactions` | failed on stale direct `App.tsx` subtask-priority wiring assertions, then passed after boundary refresh |
| `npm run verify:app-review-dialog-state-module` | failed on stale direct `App.tsx` review-dialog consumption assertions, then passed after boundary refresh |
| `npm run verify:app-template-editor-module` | failed on stale direct `App.tsx` template-initialization assertions, then passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 95: Electron Obsidian IPC Module Split
- [x] Added red/green structural verification for the remaining Obsidian IPC boundary in `electron/main.ts`.
- [x] Extracted `electron/obsidianIpc.ts` to own `obsidianTemplate:*` and `obsidian:*` handler registration through explicit dependency injection.
- [x] Updated `electron/main.ts` to delegate Obsidian IPC registration through `registerObsidianIpcHandlers(...)`.
- [x] Refreshed stale `verify:obsidian-template-ui` expectations so it follows the new `main.ts -> obsidianIpc.ts` boundary.
- [x] Kept the focused verifier in `verify:cleanup-core` and re-ran the full cleanup regression plus production build.
- **Status:** complete

## Electron Obsidian IPC Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` | failed as RED before extraction because `electron/obsidianIpc.ts` did not exist, then passed |
| `npm run verify:obsidian-template-ui` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | initially failed on an unterminated string literal caused by copied mojibake text in `electron/obsidianIpc.ts`, then passed after rewriting the touched strings with Unicode escapes |

### Phase 96: Electron Task Menu Window Module Split
- [x] Added red/green structural verification for the task-menu popup BrowserWindow boundary in `electron/main.ts`.
- [x] Extracted `electron/taskMenuWindow.ts` to own popup placement, BrowserWindow creation, renderer loading, and popup lifecycle wiring.
- [x] Updated `electron/main.ts` to keep `taskMenuWindow` state ownership while delegating popup creation through `createTaskMenuWindow(...)`.
- [x] Refreshed `verify:context-menu` so it follows the new `main.ts -> taskMenuWindow.ts` boundary instead of requiring popup placement inline in `main.ts`.
- [x] Added `verify:electron-task-menu-window-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related context-menu regression, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Task Menu Window Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-task-menu-window-module` | failed as RED before extraction because `electron/taskMenuWindow.ts` did not exist, then passed |
| `npm run verify:context-menu` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 97: Electron Tray Menu Module Split
- [x] Added red/green structural verification for the tray/menu wiring boundary in `electron/main.ts`.
- [x] Extracted `electron/trayMenu.ts` to own tray menu template construction and Tray creation.
- [x] Updated `electron/main.ts` to keep `tray` state ownership and quit-state wiring while delegating tray creation and menu refresh through helper functions.
- [x] Refreshed `verify:main-window-structure` so it follows the new `main.ts -> trayMenu.ts` boundary instead of requiring tray labels inline in `main.ts`.
- [x] Added `verify:electron-tray-menu-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related main-window verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Tray Menu Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-tray-menu-module` | failed as RED before extraction because `electron/trayMenu.ts` did not exist, then passed |
| `npm run verify:main-window-structure` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 98: Electron Main Window Events Module Split
- [x] Added red/green structural verification for the main-window event registration boundary in `electron/main.ts`.
- [x] Extracted `electron/mainWindowEvents.ts` to own the BrowserWindow event wiring for ready/show/focus/desktop-guard/persist/quit-related handlers.
- [x] Updated `electron/main.ts` to keep mutable state ownership while delegating event registration through `registerMainWindowEventHandlers(...)`.
- [x] Refreshed `verify:main-window-structure` so it follows the new `main.ts -> mainWindowEvents.ts` boundary instead of requiring the event handlers inline in `main.ts`.
- [x] Added `verify:electron-main-window-events-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related main-window verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Window Events Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-events-module` | failed as RED before extraction because `electron/mainWindowEvents.ts` did not exist, then passed |
| `npm run verify:main-window-structure` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 99: Electron Main Window Factory Module Split
- [x] Added red/green structural verification for the main-window factory/bootstrap boundary in `electron/main.ts`.
- [x] Extracted `electron/mainWindowFactory.ts` to own main `BrowserWindow` creation plus the fixed bootstrap order for tray/renderer/event/IPC setup callbacks.
- [x] Updated `electron/main.ts` to keep all mutable state ownership while delegating window creation through `createMainBrowserWindow(...)` and fixed setup sequencing through `setupMainBrowserWindow(...)`.
- [x] Added `verify:electron-main-window-factory-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related main-window verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Window Factory Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-main-window-factory-module.ts` | failed as RED before extraction because `electron/mainWindowFactory.ts` did not exist, then passed |
| `npm run verify:main-window-structure` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 100: Electron App Lifecycle Module Split
- [x] Added red/green structural verification for the Electron app lifecycle/bootstrap boundary in `electron/main.ts`.
- [x] Extracted `electron/appLifecycle.ts` to own `whenReady`, `child-process-gone`, `before-quit`, `will-quit`, `quit`, `window-all-closed`, and `activate` registration.
- [x] Updated `electron/main.ts` to keep mutable state ownership while delegating lifecycle registration through `registerAppLifecycleHandlers(...)`.
- [x] Added `verify:electron-app-lifecycle-module` to `verify:cleanup-core`.
- [x] Ran focused verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron App Lifecycle Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-app-lifecycle-module.ts` | failed as RED before extraction because `electron/appLifecycle.ts` did not exist, then passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 101: Electron Desktop Window Mode Module Split
- [x] Added red/green structural verification for the desktop guard / owner / window-mode boundary in `electron/main.ts`.
- [x] Extracted `electron/desktopWindowMode.ts` to own desktop foreground polling, desktop widget state transitions, owner attach/clear, desktop guard start/stop, and window-mode/z-order application helpers.
- [x] Updated `electron/main.ts` to keep `windowMode` and `userHidden` ownership while delegating desktop-mode behavior through `createDesktopWindowModeController(...)`.
- [x] Refreshed related structural verifiers so `verify:main-window-structure` and `electron/windowMode.verify.ts` follow the new `main.ts -> desktopWindowMode.ts` boundary.
- [x] Added `verify:electron-desktop-window-mode-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related window/main verifiers, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Desktop Window Mode Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-desktop-window-mode-module.ts` | failed as RED before extraction because `electron/desktopWindowMode.ts` did not exist, then passed |
| `npm run verify:main-window-structure` | passed |
| `npm run verify:window-mode` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 102: Electron Obsidian Daily Note Content Module Split
- [x] Added red/green structural verification for the Obsidian daily-note content helper boundary in `electron/main.ts`.
- [x] Extracted `electron/obsidianDailyNoteContent.ts` to own task/work/inspiration block builders, daily-note bootstrap generation, legacy work/inspiration migration, managed-block wrapper helpers, and blog-draft assembly.
- [x] Updated `electron/main.ts` to create the helper set through `createObsidianDailyNoteContentHelpers(...)` while keeping sync orchestration, vault/file I/O, preview building, and AI review triggering in place.
- [x] Kept `electron/obsidianIpc.ts` on the existing contract by continuing to pass `buildDailyTemplate` through `main.ts`.
- [x] Added `verify:electron-obsidian-daily-note-content-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related Obsidian wiring verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Obsidian Daily Note Content Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-obsidian-daily-note-content-module.ts` | failed as RED before extraction because `electron/obsidianDailyNoteContent.ts` did not exist, then passed |
| `npm run verify:electron-obsidian-daily-note-content-module` | passed |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:obsidian-template-ui` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 103: Electron Obsidian Sync Module Split
- [x] Added red/green structural verification for the remaining Obsidian sync/orchestration boundary in `electron/main.ts`.
- [x] Extracted `electron/obsidianSync.ts` to own daily-note path resolution, overview refresh triggering, single-note sync writes, affected-date collection, task sync orchestration, and sync preview assembly.
- [x] Updated `electron/main.ts` to keep app settings/vault state ownership while delegating Obsidian sync behavior through `createObsidianSyncHelpers(...)`.
- [x] Preserved existing `electron/obsidianIpc.ts` and `electron/aiReviewIpc.ts` contracts by continuing to pass `getDailyFilePath`, `triggerOverviewUpdate`, `syncTasksToObsidian`, and `previewTasksToObsidian` from `main.ts`.
- [x] Added `verify:electron-obsidian-sync-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related Obsidian wiring verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Obsidian Sync Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-obsidian-sync-module.ts` | failed as RED before extraction because `electron/obsidianSync.ts` did not exist, then passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:obsidian-template-ui` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 104: Electron AI Review Runtime Module Split
- [x] Added red/green structural verification for the shared AI review runtime/diagnostics boundary in `electron/main.ts`.
- [x] Extracted `electron/aiReviewRuntime.ts` to own report-profile LLM availability checks, staged progress emission, diagnostic assembly, and DOCX text extraction.
- [x] Updated `electron/main.ts` to keep the daily review runner in place while delegating shared AI runtime helpers through `createAiReviewRuntimeHelpers(...)`.
- [x] Refreshed related diagnostics verification so `verify-ai-run-diagnostics` follows the new `main.ts -> aiReviewRuntime.ts` boundary instead of requiring progress/diagnostic internals inline in `main.ts`.
- [x] Added `verify:electron-ai-review-runtime-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related diagnostics/AI IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Runtime Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-runtime-module.ts` | failed as RED before extraction because `electron/aiReviewRuntime.ts` did not exist, then passed |
| `npm run verify:electron-ai-review-runtime-module` | passed |
| `npm run verify:ai-run-diagnostics` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 105: Electron AI Daily Review Runner Module Split
- [x] Added red/green structural verification for the remaining daily AI review runner boundary in `electron/main.ts`.
- [x] Extracted `electron/aiReviewDailyRunner.ts` to own daily-note AI-content inspection plus `runReviewForDate(...)` orchestration.
- [x] Updated `electron/main.ts` to create the daily runner through `createAiReviewDailyRunner(...)` while preserving the `obsidianSync -> runReviewForDate(...)` callback contract through a narrow initialization wrapper.
- [x] Refreshed related regeneration/diagnostics verification so daily runner assertions follow the new `main.ts -> aiReviewDailyRunner.ts` boundary instead of requiring inspection/diagnostic stages inline in `main.ts`.
- [x] Added `verify:electron-ai-review-daily-runner-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related regeneration/diagnostics/AI IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Daily Review Runner Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-daily-runner-module` | failed as RED before extraction because `electron/aiReviewDailyRunner.ts` did not exist, then passed |
| `npm run verify:ai-regenerate-detection` | passed |
| `npm exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm run verify:ai-run-diagnostics` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 106: Electron AI Timer Scheduling Module Split
- [x] Added red/green structural verification for the remaining AI timer scheduling boundary in `electron/main.ts`.
- [x] Extracted `electron/aiReviewTimers.ts` to own daily, weekly, monthly, external weekly, and external monthly timer scheduling plus the shared `scheduleAiTimers()` entrypoint.
- [x] Updated `electron/main.ts` to create the timer scheduler through `createAiReviewTimerScheduler(...)` and continue passing the shared `scheduleAiTimers` callback into window bootstrap and AI Review IPC wiring.
- [x] Refreshed related AI Review IPC verification so timer scheduling assertions follow the new `main.ts -> aiReviewTimers.ts` boundary instead of requiring inline scheduler functions in `main.ts`.
- [x] Added `verify:electron-ai-review-timer-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related timer/AI IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Timer Scheduling Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-timer-module` | failed as RED before extraction because `electron/aiReviewTimers.ts` did not exist, then passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run verify:ai-timer` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 107: Electron Win32 / Native Helper Module Split
- [x] Added red/green structural verification for the remaining Win32/native helper boundary in `electron/main.ts`.
- [x] Extracted `electron/win32Native.ts` to own Win32 `koffi` binding creation, desktop foreground detection, tool-window style helper retention, and native background-material helper wiring.
- [x] Updated `electron/main.ts` to create the Win32/native helper set through `createWin32NativeHelpers(...)` and continue injecting `win32`, `applyToolWindowStyle`, and `applyNativeBackgroundMaterial` into the existing desktop/window consumers.
- [x] Added `verify:electron-win32-native-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related main-window/window-mode verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Win32 / Native Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-win32-native-module` before extraction | failed as RED because `electron/win32Native.ts` did not exist |
| `npm run verify:electron-win32-native-module` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run verify:window-mode` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 108: Legacy Task Export Path Cleanup
- [x] Added red/green structural verification for removing the dead legacy `taskExportPath` concept.
- [x] Removed the unused `getTaskExportFilePath(...)` helper and its `resolveTemplatePath` dependency from `electron/main.ts`.
- [x] Removed dead `taskExportPath` compatibility and i18n labels from the remaining runtime/template surfaces.
- [x] Added `verify:legacy-task-export-path-cleanup` to `verify:cleanup-core`.
- [x] Ran focused verification, related Electron/template verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Legacy Task Export Path Cleanup Verification

| Command | Result |
|---------|--------|
| `npm run verify:legacy-task-export-path-cleanup` before cleanup | failed as RED because `electron/main.ts` still contained `getTaskExportFilePath(...)` |
| `npm run verify:legacy-task-export-path-cleanup` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run verify:obsidian-template-ui` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 109: Electron App State Accessors Module Split
- [x] Added red/green structural verification for extracting the remaining store-backed accessor island from `electron/main.ts`.
- [x] Extracted `electron/appStateAccessors.ts` to own vault/app/template/companion/AI-review accessors plus daily-source-rule and shared LLM-caller derivation.
- [x] Updated `electron/main.ts` to create the accessor set through `createAppStateAccessors(...)` and continue injecting the same functions into window/settings/companion/AI-review/Obsidian consumers.
- [x] Added `verify:electron-app-state-accessors-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related Electron IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron App State Accessors Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before extraction | failed as RED because `electron/appStateAccessors.ts` did not exist |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 110: Electron Shared Types Module Split
- [x] Added red/green structural verification for consolidating repeated Electron task/store/vault type definitions.
- [x] Extracted `electron/sharedTypes.ts` to own shared Electron task, completion-review, inspect-daily, vault-status, and store-interface types.
- [x] Updated the affected Electron modules to import the shared types instead of keeping duplicated inline definitions.
- [x] Added `verify:electron-shared-types-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related Electron module verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Shared Types Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-shared-types-module` before extraction | failed as RED because `electron/sharedTypes.ts` did not exist |
| `npm run verify:electron-shared-types-module` | passed |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-settings-ipc-module` | passed |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run verify:electron-ai-review-daily-runner-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 111: Electron Main Shell / Tray / Task Menu Controller Split
- [x] Added red/green structural verification for extracting the remaining main-shell / tray / task-menu controller boundary from `electron/main.ts`.
- [x] Extracted `electron/mainShellController.ts` to own `showMainWindow`, `hideMainWindow`, `refreshTrayMenu`, `createTray`, `closeTaskMenuWindow`, and `openTaskMenuWindow`.
- [x] Updated `electron/main.ts` to keep tray/task-menu/userHidden state ownership while delegating shell behavior through `createMainShellController(...)`.
- [x] Refreshed related structural verifiers so tray, popup, desktop-mode, and main-window boundary checks follow the new `main.ts -> mainShellController.ts` split.
- [x] Added `verify:electron-main-shell-controller-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related Electron shell verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Shell Controller Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-shell-controller-module` before extraction | failed as RED because `electron/mainShellController.ts` did not exist |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-events-module` | passed |
| `npm run verify:electron-task-menu-window-module` | passed |
| `npm run verify:electron-tray-menu-module` | passed |
| `npm run verify:context-menu` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 112: Electron Main Window Persistence Module Split
- [x] Added red/green structural verification for extracting the remaining startup-bounds / persisted-window-state / stored-window-mode boundary from `electron/main.ts`.
- [x] Extracted `electron/mainWindowPersistence.ts` to own `getInitialBounds`, `persistWindowState`, and `getStoredWindowMode`.
- [x] Updated `electron/main.ts` to keep store ownership while delegating debounced window persistence and startup state resolution through `createMainWindowPersistence(...)`.
- [x] Refreshed the related UI feedback verifier so the normalized-bounds assertion follows the new `main.ts -> mainWindowPersistence.ts` boundary.
- [x] Added `verify:electron-main-window-persistence-module` to `verify:cleanup-core`.
- [x] Ran focused verification, related Electron window verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Window Persistence Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-persistence-module` before extraction | failed as RED because `electron/mainWindowPersistence.ts` did not exist |
| `npm run verify:electron-main-window-persistence-module` | passed |
| `npm run verify:electron-window-state-module` | passed |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-events-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 113: Electron Main Window Bootstrap Wiring Module Split
- [x] Added red/green structural verification for the remaining main-window bootstrap callback wiring boundary in `electron/main.ts`.
- [x] Extracted `electron/mainWindowBootstrap.ts` to own the `setupMainBrowserWindow(...)` callback bundle assembly for renderer load, event registration, and feature IPC registration.
- [x] Updated `electron/main.ts` to keep state truth sources and narrow dependency injection while delegating callback composition through `createMainWindowBootstrap(...)`.
- [x] Refreshed the affected structural verifiers so the callback-registration assertions follow the new `main.ts -> mainWindowBootstrap.ts` boundary.
- [x] Ran focused verification, broad cleanup regression, TypeScript, and production build.
- **Status:** complete

## Electron Main Window Bootstrap Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-bootstrap-module` before extraction | failed as RED because `electron/mainWindowBootstrap.ts` did not exist |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-main-window-factory-module` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-settings-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 114: Electron Task Date Helper Module Split
- [x] Added red/green structural verification for the remaining task-date / review helper boundary in `electron/main.ts`.
- [x] Extracted `electron/taskDateHelpers.ts` to own `getTodayDate`, `getDateKey`, `getTaskDate`, `getReviewDate`, and `getCompletionReviews`.
- [x] Updated `electron/main.ts` to import the helper module and removed the now-dead inline `escapeTaskText`, `formatDateTime`, and unused `DesktopWidgetState` alias.
- [x] Ran focused verification, broad cleanup regression, TypeScript, and production build.
- **Status:** complete

## Electron Task Date Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-task-date-helpers-module` before extraction | failed as RED because `electron/taskDateHelpers.ts` did not exist |
| `npm run verify:electron-task-date-helpers-module` | passed |
| `npm run verify:electron-obsidian-daily-note-content-module` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 115: Electron Main Window Mode Controller Split
- [x] Added red/green structural verification for the remaining `setWindowMode(...)` orchestration boundary in `electron/main.ts`.
- [x] Extracted `electron/mainWindowModeController.ts` to own persisted window-mode updates, delayed z-order reapply, renderer `window:modeChanged` broadcasting, and tray refresh triggering.
- [x] Updated `electron/main.ts` to keep `windowMode` and `tray` truth sources local while delegating mode-change behavior through `createMainWindowModeController(...)`.
- [x] Refreshed the related desktop-mode verifier so it follows the new `main.ts -> mainWindowModeController.ts -> desktopWindowMode.ts` boundary.
- [x] Ran focused verification, broad cleanup regression, TypeScript, and production build.
- **Status:** complete

## Electron Main Window Mode Controller Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-mode-controller-module` before extraction | failed as RED because `electron/mainWindowModeController.ts` did not exist |
| `npm run verify:electron-main-window-mode-controller-module` | passed |
| `npm run verify:window-mode` | passed |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-tray-menu-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 116: Electron Renderer Loader Module Split
- [x] Added red/green structural verification for the shared renderer-loading orchestration boundary in `electron/main.ts`.
- [x] Extracted `electron/rendererLoader.ts` to own dev-server URL resolution, renderer query construction, diagnostics, and `loadURL` / `loadFile` routing.
- [x] Updated `electron/main.ts` to create the shared `loadRenderer` callback through `createRendererLoader(...)` while preserving the existing main-window and task-menu consumers.
- [x] Ran focused verification, related Electron window verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Renderer Loader Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-renderer-loader-module` before extraction | failed as RED because `electron/rendererLoader.ts` did not exist |
| `npm run verify:electron-renderer-loader-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-main-window-factory-module` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run verify:electron-task-menu-window-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 117: Electron App Environment Module Split
- [x] Added red/green structural verification for the remaining development-environment / icon-path helper boundary in `electron/main.ts`.
- [x] Extracted `electron/appEnvironment.ts` to own development-path constants, build-mode detection, dev `userData` override wiring, and icon-path option construction.
- [x] Updated `electron/main.ts` to create the shared environment helper through `createAppEnvironment(...)` while preserving existing consumers in app-state accessors, Obsidian sync, tray creation, and main-window creation.
- [x] Refreshed stale verifier expectations so related Electron verifiers follow the new `main.ts -> appEnvironment.ts` boundary.
- [x] Ran focused verification, broad cleanup regression, TypeScript, and production build.
- **Status:** complete

## Electron App Environment Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-environment-module` before extraction | failed as RED because `electron/appEnvironment.ts` did not exist |
| `npm run verify:electron-app-environment-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run verify:electron-foundation-modules` | passed |
| `npm run verify:electron-app-state-accessors-module` | passed after stale-boundary refresh |
| `npm run verify:electron-obsidian-sync-module` | passed after stale-boundary refresh |
| `npm run verify:electron-main-window-factory-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 118: Electron Single Instance Module Split
- [x] Added red/green structural verification for the remaining single-instance boot policy boundary in `electron/main.ts`.
- [x] Extracted `electron/singleInstance.ts` to own lock acquisition, duplicate-instance quit behavior, and `second-instance` restore/show/focus handling.
- [x] Updated `electron/main.ts` to delegate single-instance startup policy through `registerSingleInstancePolicy(...)` while preserving existing behavior.
- [x] Ran focused verification, related Electron lifecycle/structure verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Single Instance Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-single-instance-module` before extraction | failed as RED because `electron/singleInstance.ts` did not exist |
| `npm run verify:electron-single-instance-module` | passed |
| `npm run verify:electron-app-lifecycle-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 119: Electron Main Window Startup Module Split
- [x] Added red/green structural verification for the remaining main-window startup orchestration boundary in `electron/main.ts`.
- [x] Extracted `electron/mainWindowStartup.ts` to own default vault-path seeding, initial bounds/mode resolution, `createMainBrowserWindow(...)`, injected main-window assignment, initial mode application, and fixed bootstrap ordering.
- [x] Updated `electron/main.ts` to create `createWindow` through `createMainWindowStarter(...)` while preserving `mainWindow` state ownership and bootstrap dependency assembly.
- [x] Refreshed stale factory/bootstrap verifier boundaries so they now follow `main.ts -> mainWindowStartup.ts -> mainWindowFactory.ts` and `main.ts -> createBootstrap(...) -> mainWindowBootstrap.ts`.
- [x] Ran focused verification, related Electron startup/factory/bootstrap verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Window Startup Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-startup-module` before extraction | failed as RED because `electron/mainWindowStartup.ts` did not exist |
| `npm run verify:electron-main-window-startup-module` | passed |
| `npm run verify:electron-main-window-factory-module` | passed after boundary refresh |
| `npm run verify:electron-main-window-bootstrap-module` | passed after boundary refresh |
| `npm run verify:electron-app-lifecycle-module` | passed |
| `npm run verify:main-window-structure` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 120: Electron Settings Mode State Module Split
- [x] Added red/green structural verification for the remaining settings-mode state boundary shared across `electron/main.ts`, `electron/mainWindowBootstrap.ts`, `electron/mainWindowEvents.ts`, and `electron/windowIpc.ts`.
- [x] Extracted `electron/settingsModeState.ts` to own the shared `SettingsModeState` type plus `createSettingsModeState(...)` state creation.
- [x] Updated `electron/main.ts` to replace inline `settingsModeOpen` / `settingsModeRestoreWidth` ownership with a shared `settingsMode` state helper.
- [x] Updated `electron/mainWindowBootstrap.ts`, `electron/mainWindowEvents.ts`, and `electron/windowIpc.ts` to consume the shared settings-mode state contract instead of redefining local shapes or passing a redundant getter callback.
- [x] Ran focused verification, related Electron bootstrap/events/window IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Settings Mode State Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-settings-mode-state-module` before extraction | failed as RED because `electron/settingsModeState.ts` did not exist |
| `npm run verify:electron-settings-mode-state-module` | passed |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-main-window-events-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 121: Electron User Hidden State Module Split
- [x] Added red/green structural verification for the remaining user-hidden state boundary shared by `electron/main.ts`, `electron/mainShellController.ts`, `electron/mainWindowBootstrap.ts`, `electron/mainWindowEvents.ts`, and `electron/desktopWindowMode.ts`.
- [x] Extracted `electron/userHiddenState.ts` to own the shared `UserHiddenState` type plus `createUserHiddenState()` state creation.
- [x] Updated `electron/main.ts` to replace inline `let userHidden = false` and ad hoc getter/setter callbacks with a shared `userHidden` state helper.
- [x] Updated shell, bootstrap, main-window events, and desktop-window-mode modules to consume the shared user-hidden state contract through narrow read/write surfaces.
- [x] Refreshed stale structural verifiers so they follow `userHidden.isHidden()` / `userHidden.setHidden(...)` instead of the old callback boundary.
- [x] Ran focused verification, related Electron shell/desktop/events/structure verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron User Hidden State Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-user-hidden-state-module` before extraction | failed as RED because `electron/userHiddenState.ts` did not exist |
| `npm run verify:electron-user-hidden-state-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run verify:electron-desktop-window-mode-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-main-window-events-module` | passed |
| `npm run verify:main-window-structure` | passed after stale-boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 122: UI Feedback Regression Verifier Boundary Refresh
- [x] Reproduced the stale verifier failure in `verify:ui-feedback-regressions` at the old `App.tsx` review/add-task prop assertions.
- [x] Confirmed the product code had not regressed: `src/App.tsx` now delegates shell prop composition through `createAppShellComposition(...)`, while `src/app/appShellComposition.tsx` owns `reviewViewProps` and `addTaskInputProps`.
- [x] Refreshed `scripts/verify-ui-feedback-regressions.ts` so it verifies the current `App.tsx -> appShellComposition.tsx -> AppMainContent.tsx` boundary instead of requiring those props inline in `App.tsx`.
- [x] Preserved the existing behavior checks for delete-review forwarding and quick-capture `addTask` forwarding.
- [x] Ran focused UI feedback verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## UI Feedback Regression Verifier Boundary Verification

| Command | Result |
|---------|--------|
| `npm run verify:ui-feedback-regressions` before refresh | failed as RED because the verifier still expected `const reviewViewProps = {` in `src/App.tsx` |
| `npm run verify:ui-feedback-regressions` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 123: Electron Main Store Keys Module Split
- [x] Added red/green structural verification for extracting the remaining Electron main store-key constants from `electron/main.ts`.
- [x] Extracted `electron/mainStoreKeys.ts` to own `OBSIDIAN_PATH_KEY`, `WINDOW_STATE_KEY`, `COMPACT_MODE_KEY`, and `AUTO_START_KEY`.
- [x] Updated `electron/main.ts` to import those constants while preserving the existing injection points into main-window persistence, startup, and bootstrap composition.
- [x] Added `verify:electron-main-store-keys-module` to `verify:cleanup-core`.
- [x] Ran focused store-key verification, related Electron startup/persistence/bootstrap verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Store Keys Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-main-store-keys-module.ts` before extraction | failed as RED because `electron/mainStoreKeys.ts` did not exist |
| `npm run verify:electron-main-store-keys-module` | passed |
| `npm run verify:electron-main-window-persistence-module` | passed |
| `npm run verify:electron-main-window-startup-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 124: Electron AI Review Runner Bridge Module Split
- [x] Added red/green structural verification for extracting the delayed AI daily-review runner bridge from `electron/main.ts`.
- [x] Extracted `electron/aiReviewRunnerBridge.ts` to own the nullable runner state, the delayed `runReviewForDate` callback, and the existing `AI daily review runner not initialized` guard.
- [x] Updated `electron/main.ts` to create `aiReviewRunnerBridge`, inject `aiReviewRunnerBridge.runReviewForDate` into Obsidian sync helpers, and set the real runner after `createAiReviewDailyRunner(...)` returns.
- [x] Added `verify:electron-ai-review-runner-bridge-module` to `verify:cleanup-core`.
- [x] Ran focused bridge verification, related AI daily runner / Obsidian sync / main module verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Runner Bridge Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-runner-bridge-module.ts` before extraction | failed as RED because `electron/aiReviewRunnerBridge.ts` did not exist |
| `npm run verify:electron-ai-review-runner-bridge-module` | passed |
| `npm run verify:electron-ai-review-daily-runner-module` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 125: Electron App Quit State Module Split
- [x] Added red/green structural verification for extracting the remaining app quit-state boolean from `electron/main.ts`.
- [x] Extracted `electron/appQuitState.ts` to own the shared `AppQuitState` type plus `createAppQuitState()` state creation.
- [x] Updated `electron/main.ts` to replace inline `let isQuitting = false` and direct `isQuitting = true` writes with `appQuitState.isQuitting` / `appQuitState.markQuitting`.
- [x] Preserved existing quit-state injection into main shell, main-window bootstrap, and app lifecycle boundaries.
- [x] Added `verify:electron-app-quit-state-module` to `verify:cleanup-core`.
- [x] Ran focused quit-state verification, related lifecycle/bootstrap/shell verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron App Quit State Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-app-quit-state-module.ts` before extraction | failed as RED because `electron/appQuitState.ts` did not exist |
| `npm run verify:electron-app-quit-state-module` | passed |
| `npm run verify:electron-app-lifecycle-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 126: Electron Window Mode State Module Split
- [x] Added red/green structural verification for extracting the remaining process-local window-mode state from `electron/main.ts`.
- [x] Extracted `electron/windowModeState.ts` to own the shared `WindowModeState` type plus `createWindowModeState(initialMode)` state creation.
- [x] Updated `electron/main.ts` to replace inline `let windowMode: WindowMode = 'onTop'` and ad hoc getter/setter callbacks with `windowModeState.getMode` / `windowModeState.setMode`.
- [x] Preserved existing mode behavior by keeping desktop-mode application, persisted mode updates, shell reads, bootstrap reads, and lifecycle reads in their existing downstream modules.
- [x] Added `verify:electron-window-mode-state-module` to `verify:cleanup-core`.
- [x] Ran focused window-mode state verification, related Electron mode/shell/bootstrap/lifecycle verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Window Mode State Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-window-mode-state-module.ts` before extraction | failed as RED because `electron/windowModeState.ts` did not exist |
| `npm run verify:electron-window-mode-state-module` | passed |
| `npm run verify:electron-main-window-mode-controller-module` | passed |
| `npm run verify:electron-desktop-window-mode-module` | passed after stale-boundary refresh |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-app-lifecycle-module` | passed |
| `npm run verify:window-mode` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 127: Electron Main Runtime State Module Split
- [x] Added red/green structural verification for extracting the remaining Electron main runtime references from `electron/main.ts`.
- [x] Extracted `electron/mainRuntimeState.ts` to own the shared `MainRuntimeState` type plus `createMainRuntimeState()` state creation.
- [x] Updated `electron/main.ts` to replace inline `mainWindow`, `tray`, and `taskMenuWindow` references with `runtimeState` read/write helpers.
- [x] Preserved existing behavior by keeping single-instance activation, AI timer targeting, mode-controller tray refresh checks, shell tray/menu ownership, startup main-window assignment, bootstrap task-menu access, and lifecycle clearing in their existing downstream modules.
- [x] Refreshed stale structural verifiers so they follow the new `runtimeState` boundary instead of requiring bare runtime references in `main.ts`.
- [x] Added `verify:electron-main-runtime-state-module` to `verify:cleanup-core`.
- [x] Ran focused runtime-state verification, related Electron startup/bootstrap/lifecycle/shell/tray/task-menu/timer verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Runtime State Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-main-runtime-state-module.ts` before extraction | failed as RED because `electron/mainRuntimeState.ts` did not exist |
| `npm run verify:electron-main-runtime-state-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed after stale-boundary refresh |
| `npm run verify:electron-main-window-startup-module` | passed after stale-boundary refresh |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-app-lifecycle-module` | passed |
| `npm run verify:electron-main-window-mode-controller-module` | passed after stale-boundary refresh |
| `npm run verify:electron-single-instance-module` | passed after stale-boundary refresh |
| `npm run verify:electron-ai-review-timer-module` | passed after stale-boundary refresh |
| `npm run verify:electron-main-window-factory-module` | passed after stale-boundary refresh |
| `npm run verify:electron-task-menu-window-module` | passed after stale-boundary refresh |
| `npm run verify:electron-tray-menu-module` | passed after stale-boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 132: Electron Diagnostics Safe Start Module Split
- [x] Added red/green structural verification for moving the crash-diagnostics startup guard out of `electron/main.ts`.
- [x] Added `startCrashDiagnosticsSafely(diag)` to `electron/diagnostics.ts`, preserving the existing `crash diagnostics startup failed` fallback log.
- [x] Updated `electron/main.ts` to call `startCrashDiagnosticsSafely(diag)` after creating the logger instead of owning the try/catch inline.
- [x] Preserved the low-level `startCrashDiagnostics(diag)` helper and existing crash reporter / process exception handlers.
- [x] Added `verify:electron-diagnostics-safe-start-module` to `verify:cleanup-core`.
- [x] Ran focused diagnostics safe-start verification, related foundation/main/native-occlusion verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Diagnostics Safe Start Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-diagnostics-safe-start-module.ts` before extraction | failed as RED because `diagnostics.ts` did not export `startCrashDiagnosticsSafely` |
| `npm run verify:electron-diagnostics-safe-start-module` | passed |
| `npm run verify:electron-foundation-modules` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run verify:electron-native-occlusion-policy-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 130: Electron Main Dead Task Alias Cleanup
- [x] Added red/green structural verification for removing the dead `Task = ElectronTask` alias from `electron/main.ts`.
- [x] Removed the now-unused `ElectronTask` type import and local `Task` alias from `electron/main.ts`.
- [x] Refreshed `verify-electron-shared-types-module` so it no longer treats `electron/main.ts` as an `ElectronTask` consumer after the dead alias cleanup.
- [x] Added `verify:electron-main-dead-task-alias-cleanup` to `verify:cleanup-core`.
- [x] Ran focused dead-alias verification, related shared-types/main-module verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Dead Task Alias Cleanup Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-main-dead-task-alias-cleanup.ts` before cleanup | failed as RED because `main.ts` still imported `ElectronTask` and defined `type Task = ElectronTask` |
| `npm run verify:electron-main-dead-task-alias-cleanup` | passed |
| `npm run verify:electron-shared-types-module` | passed after stale-boundary refresh |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 128: Electron Main Localization Helper Split
- [x] Added red/green structural verification for extracting the tiny Electron main-process localizer from `electron/main.ts`.
- [x] Extracted `electron/mainLocalization.ts` to own the shared `MainLocalizer` type plus the existing identity `zh(text)` helper.
- [x] Updated `electron/main.ts` to import `zh` while preserving all existing injection points into app-state, Obsidian daily-note content, shell, and bootstrap helpers.
- [x] Kept the pass intentionally narrow: no renderer i18n changes, no visible text changes, and no broad mojibake/encoding cleanup.
- [x] Added `verify:electron-main-localization-module` to `verify:cleanup-core`.
- [x] Ran focused localization verification, related Electron app-state/Obsidian/shell/bootstrap/main-module verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Localization Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-main-localization-module.ts` before extraction | failed as RED because `electron/mainLocalization.ts` did not exist |
| `npm run verify:electron-main-localization-module` | passed |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-obsidian-daily-note-content-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 129: Electron Tray Refresh Bridge Module Split
- [x] Added red/green structural verification for extracting the remaining delayed tray-refresh callback bridge from `electron/main.ts`.
- [x] Extracted `electron/trayRefreshBridge.ts` to own the nullable `refreshTrayMenuImpl` callback plus `createTrayRefreshBridge()`.
- [x] Updated `electron/main.ts` to create `trayRefreshBridge`, inject `trayRefreshBridge.refreshTrayMenu` into the main-window mode controller, and call `trayRefreshBridge.setRefreshTrayMenu(refreshTrayMenu)` after the shell controller creates the real refresh callback.
- [x] Preserved existing optional-call behavior so mode changes before tray refresh wiring remain no-ops instead of throwing.
- [x] Added `verify:electron-tray-refresh-bridge-module` to `verify:cleanup-core`.
- [x] Ran focused tray-refresh bridge verification, related mode-controller/shell/tray verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Tray Refresh Bridge Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-tray-refresh-bridge-module.ts` before extraction | failed as RED because `electron/trayRefreshBridge.ts` did not exist |
| `npm run verify:electron-tray-refresh-bridge-module` | passed |
| `npm run verify:electron-main-window-mode-controller-module` | passed |
| `npm run verify:electron-main-shell-controller-module` | passed |
| `npm run verify:electron-tray-menu-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 131: Electron Native Occlusion Policy Module Split
- [x] Added red/green structural verification for extracting the Chromium native window occlusion startup policy from `electron/main.ts`.
- [x] Extracted `electron/nativeOcclusionPolicy.ts` to own the narrow `NativeOcclusionPolicyApp` contract plus `disableNativeWindowOcclusion(app)`.
- [x] Updated `electron/main.ts` to call `disableNativeWindowOcclusion(app)` before app-environment setup, preserving the required before-ready startup timing.
- [x] Preserved the exact Chromium feature-disable switch: `disable-features=CalculateNativeWinOcclusion`.
- [x] Added `verify:electron-native-occlusion-policy-module` to `verify:cleanup-core`.
- [x] Ran focused native-occlusion verification, related app-environment/main-module verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Native Occlusion Policy Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-native-occlusion-policy-module.ts` before extraction | failed as RED because `electron/nativeOcclusionPolicy.ts` did not exist |
| `npm run verify:electron-native-occlusion-policy-module` | passed |
| `npm run verify:electron-app-environment-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |



### Phase 133: Electron Main Diagnostics Bootstrap Module Split
- [x] Added red/green structural verification for moving the remaining main-process diagnostics bootstrap sequence out of `electron/main.ts`.
- [x] Added `createMainDiagnostics()` to `electron/diagnostics.ts` to create the diagnostics logger, start crash diagnostics through `startCrashDiagnosticsSafely(diag)`, emit the existing `=== app starting ===` message, and return `diag` for downstream composition.
- [x] Updated `electron/main.ts` to import only `createMainDiagnostics` from diagnostics and call `const diag = createMainDiagnostics()` instead of owning the logger/safe-start/startup-message sequence inline.
- [x] Preserved the low-level `startCrashDiagnostics(diag)` helper and the safe wrapper `startCrashDiagnosticsSafely(diag)` as separate diagnostics layers.
- [x] Added `verify:electron-main-diagnostics-bootstrap-module` to `verify:cleanup-core` and refreshed the safe-start verifier for the new higher-level boundary.
- [x] Ran focused diagnostics bootstrap verification, related Electron foundation/main verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron Main Diagnostics Bootstrap Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-main-diagnostics-bootstrap-module.ts` before extraction | failed as RED because `diagnostics.ts` did not export `createMainDiagnostics` |
| `npm run verify:electron-main-diagnostics-bootstrap-module` | passed |
| `npm run verify:electron-diagnostics-safe-start-module` | passed |
| `npm run verify:electron-foundation-modules` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 134: Cleanup Core Runner Module Split
- [x] Added red/green structural verification for replacing the huge inline `verify:cleanup-core` package script with a maintainable runner module.
- [x] Added `scripts/verify-cleanup-core.ts` to own the ordered cleanup-core command list as structured data and run each package script sequentially with inherited stdio and fail-fast exit codes.
- [x] Updated `package.json` so `verify:cleanup-core` delegates to `tsx scripts/verify-cleanup-core.ts` and added `verify:cleanup-core-runner-module` for the runner boundary.
- [x] Added `scripts/verifyCleanupCore.ts` as a shared verifier helper for checking cleanup-core membership from the runner command list instead of the old package-script string.
- [x] Refreshed stale focused verifier membership assertions to use `assertCleanupCoreIncludes(...)` after the cleanup-core source of truth moved from `package.json` to the runner file.
- [x] Fixed a Windows `spawnSync('npm.cmd', ..., shell:false)` portability failure by invoking npm through the current Node executable and `process.env.npm_execpath`.
- [x] Ran focused runner verification, representative migrated verifiers, TypeScript, cleanup-core through the new runner, and production build.
- **Status:** complete

## Cleanup Core Runner Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-cleanup-core-runner-module.ts` before runner extraction | failed as RED because `verify:cleanup-core` was still the long inline package script |
| `npm run verify:cleanup-core-runner-module` after first runner extraction | failed because the verifier expected single-quoted commands while the generated runner used JSON double quotes |
| `npm run verify:cleanup-core` after first runner extraction | failed before child output because `spawnSync('npm.cmd', ..., shell:false)` returned `EINVAL` on this Windows/Node environment |
| Node spawn probe with `process.execPath` + `process.env.npm_execpath` | passed for `verify:task-hook-state` |
| `npm run verify:cleanup-core-runner-module` | passed |
| `npm run verify:electron-main-diagnostics-bootstrap-module` | passed |
| `npm run verify:app-ai-review-lifecycle-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed through the new runner |
| `npm run build` | passed |


### Phase 135: Cleanup Core Runner Export Boundary Split
- [x] Added red/green structural verification for making the cleanup-core runner importable instead of only parseable as source text.
- [x] Updated `scripts/verify-cleanup-core.ts` to export `cleanupCoreCommands` and `runCleanupCore()` while preserving script entrypoint behavior through an `import.meta.url` / `process.argv[1]` guard.
- [x] Updated `scripts/verifyCleanupCore.ts` to import `cleanupCoreCommands` directly instead of reading and regex-parsing `verify-cleanup-core.ts`.
- [x] Added `verify:cleanup-core-runner-exports-module` to `package.json` and to the cleanup-core runner command list immediately after the runner structural verifier.
- [x] Preserved ordered, fail-fast cleanup-core execution through the same `process.execPath + process.env.npm_execpath` npm invocation.
- [x] Ran focused runner export verification, existing runner verification, representative focused verifier, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Cleanup Core Runner Export Boundary Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-cleanup-core-runner-exports-module.ts` before export extraction | failed as RED because `verify-cleanup-core.ts` did not export `cleanupCoreCommands` |
| `npm run verify:cleanup-core-runner-exports-module` | passed |
| `npm run verify:cleanup-core-runner-module` | passed |
| `npm run verify:electron-main-diagnostics-bootstrap-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed through the exported runner module |
| `npm run build` | passed |


### Phase 136: Electron AI Review IPC Helpers Module Split
- [x] Added red/green structural verification for extracting pure AI Review IPC helper logic from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewIpcHelpers.ts` to own `buildSourceCharsMessage`, `getWeekDates`, and `getMonthDates`.
- [x] Updated `electron/aiReviewIpc.ts` to import those helpers while preserving all IPC channel registrations and AI Review generation flow.
- [x] Added `verify:electron-ai-review-ipc-helpers-module` to `package.json` and to the cleanup-core runner command list after `verify:electron-ai-review-ipc-module`.
- [x] Ran focused helper verification, related AI Review IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review IPC Helpers Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-ipc-helpers-module.ts` before extraction | failed as RED because `electron/aiReviewIpcHelpers.ts` did not exist |
| `npm run verify:electron-ai-review-ipc-helpers-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 137: Electron AI Review IPC Messages Module Split
- [x] Added red/green structural verification for extracting AI Review IPC labels, progress messages, errors, and picker text from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewIpcMessages.ts` to own the AI Review IPC message/error constants.
- [x] Updated `electron/aiReviewIpc.ts` to import those constants while preserving all IPC channel registrations, progress emission labels, error returns, and picker localization calls.
- [x] Added `verify:electron-ai-review-ipc-messages-module` to `package.json` and to the cleanup-core runner command list after the AI Review IPC helper verifier.
- [x] Ran focused message verification, related AI Review IPC/helper verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review IPC Messages Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-ipc-messages-module.ts` before extraction | failed as RED because `electron/aiReviewIpcMessages.ts` did not exist |
| `npm run verify:electron-ai-review-ipc-messages-module` after first extraction | failed because the verifier assumed import-name order; calibrated to be order-independent |
| `npm run verify:electron-ai-review-ipc-messages-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-helpers-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 138: Electron AI Review IPC Month Range Reuse
- [x] Added red/green structural verification for removing the remaining direct `monthRange` dependency from `electron/aiReviewIpc.ts`.
- [x] Updated monthly report generation to reuse `getMonthDates(month)` from `electron/aiReviewIpcHelpers.ts` for `first` / `last` range derivation.
- [x] Removed `monthRange` from the direct shared-monthly import in `electron/aiReviewIpc.ts`, leaving the helper module as the single owner of direct month-range expansion.
- [x] Added `verify:electron-ai-review-ipc-month-range-reuse` to `package.json` and to the cleanup-core runner command list after the AI Review IPC message verifier.
- [x] Ran focused month-range reuse verification, related AI Review IPC/helper verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review IPC Month Range Reuse Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-ipc-month-range-reuse.ts` before refactor | failed as RED because `electron/aiReviewIpc.ts` still imported and used `monthRange` directly |
| `npm run verify:electron-ai-review-ipc-month-range-reuse` | passed |
| `npm run verify:electron-ai-review-ipc-helpers-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
| `npm run verify:cleanup-core` | passed |


### Phase 139: Electron AI Review Template Tools IPC Module Split
- [x] Added red/green structural verification for extracting AI Review template recognition, report-template recognition, model listing, and template-file picker IPC handlers from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewTemplateToolsIpc.ts` with `registerAiReviewTemplateToolsIpcHandlers(...)` and explicit dependencies for settings, sections, LLM caller, vault path, DOCX extraction, localization, and picker window ownership.
- [x] Updated `electron/aiReviewIpc.ts` to delegate the four template/tool handlers while keeping report generation, source testing, settings, backfill, and daily runner IPC in the parent AI Review IPC module.
- [x] Refreshed stale AI Review IPC and message verifiers so they follow the new parent/child boundary instead of requiring template/tool wiring to remain inline in the parent module.
- [x] Added `verify:electron-ai-review-template-tools-ipc-module` to `package.json` and to the cleanup-core runner command list after the month-range reuse verifier.
- [x] Ran focused template/tools verification, related AI Review IPC/message verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Template Tools IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-template-tools-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewTemplateToolsIpc.ts` did not exist |
| `npm run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` before stale verifier refresh | failed because it still required template/tool wiring inline in `aiReviewIpc.ts` |
| `npm run verify:electron-ai-review-ipc-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-messages-module` before stale verifier refresh | failed because message consumers now include the new template/tools module |
| `npm run verify:electron-ai-review-ipc-messages-module` after refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 140: Electron AI Review Source Materials IPC Module Split
- [x] Added red/green structural verification for extracting `aiReview:testSourceMaterials` from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewSourceMaterialsIpc.ts` with `registerAiReviewSourceMaterialsIpcHandlers(...)` and explicit dependencies for vault status, AI Review settings, Obsidian template settings, date normalization, and daily source-rule construction.
- [x] Updated `electron/aiReviewIpc.ts` to delegate source-material testing while retaining report-generation source collection in the parent AI Review IPC module.
- [x] Refreshed `verify-electron-ai-review-ipc-module.ts` so it follows the new source-materials child boundary.
- [x] Added `verify:electron-ai-review-source-materials-ipc-module` to `package.json` and to the cleanup-core runner command list after the template/tools verifier.
- [x] Ran focused source-materials verification, related AI Review IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Source Materials IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-source-materials-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewSourceMaterialsIpc.ts` did not exist |
| `npm run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 141: Electron AI Review Backfill IPC Module Split
- [x] Added red/green structural verification for extracting `aiReview:backfill` from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewBackfillIpc.ts` with `registerAiReviewBackfillIpcHandlers(...)` and explicit dependencies for app settings, AI Review settings, daily file path resolution, review sections, Obsidian template settings, and LLM caller access.
- [x] Updated `electron/aiReviewIpc.ts` to delegate backfill registration while retaining weekly/monthly/external report-generation IPC in the parent module.
- [x] Refreshed `verify-electron-ai-review-ipc-module.ts` so it follows the new backfill child boundary.
- [x] Added `verify:electron-ai-review-backfill-ipc-module` to `package.json` and to the cleanup-core runner command list after the source-materials verifier.
- [x] Ran focused backfill verification, related AI Review IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Backfill IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-backfill-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewBackfillIpc.ts` did not exist |
| `npm run verify:electron-ai-review-backfill-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |


### Phase 142: Electron AI Review External Report IPC Module Split
- [x] Added red/green structural verification for extracting `aiReview:generateExternal` from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewExternalReportIpc.ts` with `registerAiReviewExternalReportIpcHandlers(...)` and explicit dependencies for AI Review settings, vault status, date normalization, daily source rules, and LLM caller access.
- [x] Updated `electron/aiReviewIpc.ts` to delegate external report registration while retaining personal weekly/monthly report-generation IPC in the parent module.
- [x] Preserved external weekly/monthly behavior: active-profile guard, vault guard, weekly and monthly period-key/date expansion, source collection, no-source-materials error, output directory fallbacks, prompt fallbacks, redacted message building, zeroed stats, and `generateExternalReport(...)`.
- [x] Refreshed stale AI Review IPC, message, and month-range reuse verifiers so they follow the new external-report child boundary.
- [x] Added `verify:electron-ai-review-external-report-ipc-module` to `package.json` and to the cleanup-core runner command list after the backfill verifier.
- [x] Ran focused external-report verification, related AI Review IPC/message/month-range verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review External Report IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-external-report-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewExternalReportIpc.ts` did not exist |
| `npm run verify:electron-ai-review-external-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` before stale verifier refresh | failed because it still required external report generation inline in `aiReviewIpc.ts` |
| `npm run verify:electron-ai-review-ipc-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-messages-module` before stale verifier refresh | failed because `AI_REVIEW_DISABLED_ERROR` is now consumed by the external-report IPC module |
| `npm run verify:electron-ai-review-ipc-messages-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-month-range-reuse` before stale verifier refresh | failed because external monthly date/message wiring moved to `aiReviewExternalReportIpc.ts` |
| `npm run verify:electron-ai-review-ipc-month-range-reuse` after refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` after verifier refreshes | passed |
| `npm run build` | passed |


### Phase 143: Electron AI Review Weekly Report IPC Module Split
- [x] Added red/green structural verification for extracting `aiReview:generateWeekly` from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewWeeklyReportIpc.ts` with `registerAiReviewWeeklyReportIpcHandlers(...)` and explicit dependencies for AI Review settings, vault status, date normalization, daily source rules, report LLM resolution, progress emission, stage construction, and diagnostic construction.
- [x] Updated `electron/aiReviewIpc.ts` to delegate weekly report registration while retaining monthly report-generation IPC in the parent module.
- [x] Preserved weekly behavior: progress events, account-unavailable diagnostics, vault failure diagnostics, week date expansion, manual-files source behavior, source-character messages, no-source-materials diagnostics, weekly range stats, weekly output directory fallback, custom prompt selection, LLM invocation, provider/write diagnostic status, and truncated warning status.
- [x] Refreshed stale AI Review IPC, helper, and message verifiers so they follow the new weekly-report child boundary.
- [x] Added `verify:electron-ai-review-weekly-report-ipc-module` to `package.json` and to the cleanup-core runner command list after the external-report verifier.
- [x] Ran focused weekly-report verification, related AI Review IPC/helper/message verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Weekly Report IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-weekly-report-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewWeeklyReportIpc.ts` did not exist |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` after boundary refresh | passed |
| `npm run verify:electron-ai-review-ipc-helpers-module` before stale verifier refresh | failed because `getWeekDates` moved to a new consumer module |
| `npm run verify:electron-ai-review-ipc-helpers-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-messages-module` before stale verifier refresh | failed because weekly progress constants are now consumed by the weekly-report IPC module |
| `npm run verify:electron-ai-review-ipc-messages-module` after refresh | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 144: Electron AI Review Monthly Report IPC Module Split
- [x] Added red/green structural verification for extracting `aiReview:generateMonthly` from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewMonthlyReportIpc.ts` with `registerAiReviewMonthlyReportIpcHandlers(...)` and explicit dependencies for AI Review settings, vault status, date normalization, daily source rules, report LLM resolution, progress emission, stage construction, and diagnostic construction.
- [x] Updated `electron/aiReviewIpc.ts` to delegate monthly report registration, leaving the parent AI Review IPC module as an aggregator plus settings/sections/daily runner/inspection handlers.
- [x] Preserved monthly behavior: prepare/request/write progress events, account-unavailable diagnostics, vault write-failed diagnostics, month range derivation, monthly source collection, source-character messages, no-source-materials diagnostics, monthly range stats, monthly output directory fallback, custom prompt selection, LLM invocation, provider/write diagnostic status, and truncated warning status.
- [x] Refreshed stale AI Review IPC, helper, message, and month-range verifiers so they follow the new monthly-report child boundary.
- [x] Added `verify:electron-ai-review-monthly-report-ipc-module` to `package.json` and to the cleanup-core runner command list after the weekly-report verifier.
- [x] Ran focused monthly-report verification, related AI Review IPC/helper/message/month-range verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Monthly Report IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-monthly-report-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewMonthlyReportIpc.ts` did not exist |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` before stale verifier refresh | failed because it still required monthly report generation inline in `aiReviewIpc.ts` |
| `npm run verify:electron-ai-review-ipc-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-helpers-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-messages-module` before stale verifier refresh | failed because the parent no longer imports monthly progress constants |
| `npm run verify:electron-ai-review-ipc-messages-module` after refresh | passed |
| `npm run verify:electron-ai-review-ipc-month-range-reuse` before stale verifier refresh | failed because personal monthly `getMonthDates(month)` moved to `aiReviewMonthlyReportIpc.ts` |
| `npm run verify:electron-ai-review-ipc-month-range-reuse` after refresh | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-external-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 145: Electron AI Review Settings/Sections IPC Module Split
- [x] Added red/green structural verification for extracting the AI Review settings and review-section IPC handlers from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewSettingsSectionsIpc.ts` with `registerAiReviewSettingsSectionsIpcHandlers(...)` and explicit dependencies for AI Review settings access, review-section access, and AI timer rescheduling.
- [x] Updated `electron/aiReviewIpc.ts` to delegate `aiReview:getSettings`, `aiReview:setSettings`, `aiReview:getSections`, and `aiReview:setSections` registration while preserving daily run/inspect ownership in the parent aggregator.
- [x] Preserved behavior: settings getter return value, settings setter normalization, `scheduleAiTimers()` after settings updates, sections getter return value, and sections setter normalization.
- [x] Refreshed `verify-electron-ai-review-ipc-module.ts` so the four settings/sections channels are owned by `electron/aiReviewSettingsSectionsIpc.ts` instead of inline in the parent.
- [x] Added `verify:electron-ai-review-settings-sections-ipc-module` to `package.json` and to the cleanup-core runner command list after the monthly-report verifier.
- [x] Ran focused settings/sections verification, related AI Review IPC/report/backfill verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Settings/Sections IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-settings-sections-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewSettingsSectionsIpc.ts` did not exist |
| `npm run verify:electron-ai-review-settings-sections-ipc-module` before verifier calibration | failed because the verifier treated delegated `scheduleAiTimers,` dependency passing as an inline `scheduleAiTimers()` call |
| `npm run verify:electron-ai-review-settings-sections-ipc-module` after verifier calibration | passed |
| `npm run verify:electron-ai-review-ipc-module` before stale verifier refresh | failed because it still expected settings/sections channel registrations in `aiReviewIpc.ts` |
| `npm run verify:electron-ai-review-ipc-module` after refresh | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-backfill-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 146: Electron AI Review Daily Run/Inspect IPC Module Split
- [x] Added red/green structural verification for extracting the remaining daily run and inspection IPC handlers from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewDailyRunInspectIpc.ts` with `registerAiReviewDailyRunInspectIpcHandlers(...)` and explicit dependencies for date normalization, daily review execution, and daily content inspection.
- [x] Updated `electron/aiReviewIpc.ts` to delegate `aiReview:runForDate` and `aiReview:inspectDaily`, leaving it as an AI Review IPC aggregation/composition module with no direct `ipcMain` import.
- [x] Preserved behavior: `getDateKey(date)` normalization for both handlers, `Boolean(force)` coercion for forced daily review runs, task passthrough, and daily inspection return shape.
- [x] Refreshed `verify-electron-ai-review-ipc-module.ts` so the daily run/inspect channels are owned by `electron/aiReviewDailyRunInspectIpc.ts` instead of inline in the parent.
- [x] Added `verify:electron-ai-review-daily-run-inspect-ipc-module` to `package.json` and to the cleanup-core runner command list after the settings/sections verifier.
- [x] Ran focused daily run/inspect verification, related AI Review IPC/report/backfill verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Daily Run/Inspect IPC Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts` before extraction | failed as RED because `electron/aiReviewDailyRunInspectIpc.ts` did not exist |
| `npm run verify:electron-ai-review-daily-run-inspect-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed after boundary refresh |
| `npm run verify:electron-ai-review-settings-sections-ipc-module` | passed |
| `npm run verify:electron-ai-review-backfill-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 147: Electron AI Review Report IPC Shared Types Module
- [x] Added red/green structural verification for extracting duplicated AI Review report IPC type contracts from the parent, weekly, and monthly report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcTypes.ts` with shared type-only contracts for report LLM availability, progress emission, stage construction, and diagnostic construction.
- [x] Updated `electron/aiReviewIpc.ts`, `electron/aiReviewWeeklyReportIpc.ts`, and `electron/aiReviewMonthlyReportIpc.ts` to import the shared type contracts instead of declaring local duplicates.
- [x] Preserved behavior by changing only TypeScript type declarations; runtime IPC registration, LLM calls, diagnostics, progress events, and report-writing expressions were not changed.
- [x] Added `verify:electron-ai-review-report-ipc-types-module` to `package.json` and to the cleanup-core runner command list after the daily run/inspect verifier.
- [x] Ran focused report IPC types verification, related AI Review IPC/report verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Types Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-types-module.ts` before extraction | failed as RED because `electron/aiReviewReportIpcTypes.ts` did not exist |
| `npm run verify:electron-ai-review-report-ipc-types-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 148: Electron AI Review IPC Registration Types Module
- [x] Added red/green structural verification for extracting the large `RegisterAiReviewIpcHandlersOptions` dependency contract from `electron/aiReviewIpc.ts`.
- [x] Extracted `electron/aiReviewIpcRegistrationTypes.ts` with the full type-only registration dependency surface for the AI Review IPC aggregator.
- [x] Updated `electron/aiReviewIpc.ts` to import the registration options type and focus on child IPC module composition/registration order.
- [x] Removed registration-only imports from the parent aggregator, including Electron/shared settings/source/report/shared-type dependencies that are now isolated in the registration types module.
- [x] Registered `verify:electron-ai-review-ipc-registration-types-module` in `package.json` and added it to the cleanup-core runner after the report IPC types verifier.
- [x] Refreshed stale verifiers after the new type boundary: `verify-electron-ai-review-ipc-module.ts`, `verify-electron-shared-types-module.ts`, and `verify-electron-ai-review-report-ipc-types-module.ts`.
- [x] Ran focused registration-types verification, related AI Review/shared-types verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review IPC Registration Types Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-ipc-registration-types-module.ts` before extraction | failed as RED because `electron/aiReviewIpcRegistrationTypes.ts` did not exist |
| `npm run verify:electron-ai-review-ipc-registration-types-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed after boundary refresh |
| `npm run typecheck` | passed |
| `npm run verify:electron-shared-types-module` after stale verifier refresh | passed |
| `npm run verify:electron-ai-review-report-ipc-types-module` after stale verifier refresh | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

## Phase 148 Verifier Calibrations

| Verifier | Reason | Resolution |
|----------|--------|------------|
| `verify-electron-shared-types-module.ts` | It still expected `electron/aiReviewIpc.ts` to import `ElectronTask`, `InspectDailyResult`, and `VaultStatus` from `sharedTypes`. | Moved that expectation to `electron/aiReviewIpcRegistrationTypes.ts`, where the registration-only dependency types now live. |
| `verify-electron-ai-review-report-ipc-types-module.ts` | It still expected the parent aggregator to import shared report IPC types directly. | Moved that expectation to `electron/aiReviewIpcRegistrationTypes.ts`, while weekly/monthly report modules continue importing the shared report IPC types directly. |

### Phase 149: Electron AI Review Report IPC Diagnostics Helper
- [x] Added red/green structural and runtime-value verification for extracting shared report diagnostic final-status helpers from weekly/monthly AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcDiagnostics.ts` with `getReportFinalStatus(...)` and `getReportLlmResults(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` to use the shared helpers instead of duplicating final-status ternary logic and LLM-result array wrapping.
- [x] Preserved behavior: completed, completed-with-warning, provider-failed, and write-failed final-status decisions plus missing/present LLM-result diagnostic arrays.
- [x] Registered `verify:electron-ai-review-report-ipc-diagnostics-module` in `package.json` and added it to the cleanup-core runner after the registration-types verifier.
- [x] Refreshed weekly/monthly report IPC verifiers so they check helper usage rather than requiring duplicated diagnostic status strings inline.
- [x] Ran focused diagnostics verification, related weekly/monthly report IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Diagnostics Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-diagnostics-module.ts` before extraction | failed as RED because `electron/aiReviewReportIpcDiagnostics.ts` did not exist |
| `npm run verify:electron-ai-review-report-ipc-diagnostics-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed after verifier refresh |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed after verifier refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 150: Electron AI Review Report IPC Source Summary Helper
- [x] Added red/green structural and runtime-value verification for extracting shared source-character counting from weekly/monthly AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcSourceSummary.ts` with the minimal `AiReviewReportSourceContent` contract and `sumReportSourceChars(...)` helper.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` to use the shared helper instead of duplicating inline `reduce(...)` source-character counting.
- [x] Preserved behavior: empty source lists count as zero, and all content length calculations keep JavaScript string `.length` semantics.
- [x] Registered `verify:electron-ai-review-report-ipc-source-summary-module` in `package.json` and added it to the cleanup-core runner after the report diagnostics verifier.
- [x] Ran focused source-summary verification, related weekly/monthly report IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Source Summary Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-source-summary-module.ts` before extraction | failed as RED because `electron/aiReviewReportIpcSourceSummary.ts` did not exist |
| `npm run verify:electron-ai-review-report-ipc-source-summary-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 151: Electron AI Review Report IPC LLM Progress Helper
- [x] Added red/green structural and runtime-value verification for extracting shared request-AI progress emission around weekly/monthly report LLM calls.
- [x] Extracted `electron/aiReviewReportIpcLlmProgress.ts` with `callReportLlmWithProgress(...)` and explicit options for report kind, messages, provider caller, progress emitter, wait text, and received text.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` to call the shared helper instead of duplicating request-AI running/completed/failed progress logic around `llm.callLlm(messages)`.
- [x] Preserved behavior: request-AI running progress before provider call, completed/failed status selection from `LlmResult.ok`, successful received-message text, and failed error-message text.
- [x] Registered `verify:electron-ai-review-report-ipc-llm-progress-module` in `package.json` and added it to the cleanup-core runner after the report source-summary verifier.
- [x] Refreshed weekly/monthly report IPC verifiers so they require the shared LLM progress helper and its per-report message arguments instead of requiring inline provider-call progress logic.
- [x] Ran focused LLM-progress verification, related weekly/monthly report IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC LLM Progress Verification

| Command | Result |
|---------|--------|
| `npm exec -- tsx scripts/verify-electron-ai-review-report-ipc-llm-progress-module.ts` before extraction | failed as RED because `electron/aiReviewReportIpcLlmProgress.ts` did not exist |
| `npm run verify:electron-ai-review-report-ipc-llm-progress-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed after verifier refresh |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed after verifier refresh |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 152: Electron AI Review Report IPC Failure Helper
- [x] Added red/green structural and runtime-value verification for extracting shared failed-result/diagnostic construction from weekly/monthly AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcFailure.ts` with `AiReviewReportFailureFinalStatus`, `CreateReportFailureResultOptions`, and `createReportFailureResult(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so account-unavailable, vault write-failed, and no-source-materials early returns all flow through the shared failure helper.
- [x] Preserved behavior: failed return shape `{ ok: false, error, diagnostic }`, default empty-stage diagnostics for vault failures, request-AI failed stage diagnostics for account-unavailable, and source-char passthrough for no-source-materials.
- [x] Registered `verify:electron-ai-review-report-ipc-failure-module` in `package.json` and added it to the cleanup-core runner after the report LLM-progress verifier.
- [x] Refreshed weekly/monthly report IPC verifiers so they require the shared failure helper for the three early failure branches.
- [x] Ran focused failure-helper verification, related weekly/monthly report IPC verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Failure Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-failure-module` before extraction | failed as RED because `electron/aiReviewReportIpcFailure.ts` did not exist |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` before extraction | failed because the weekly report IPC module did not yet import/use the shared failure helper |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` before extraction | failed because the monthly report IPC module did not yet import/use the shared failure helper |
| `npm run verify:electron-ai-review-report-ipc-failure-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 154: Electron AI Review Report IPC Preflight Helper
- [x] Added red/green structural and runtime-value verification for extracting shared weekly/monthly report preflight logic from AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcPreflight.ts` with `StartReportPreflightOptions` and `startReportPreflight(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so started-at timing, prepare-materials running progress, LLM availability guard, and vault-status guard now flow through the shared helper.
- [x] Preserved behavior: prepare-materials running progress text, failed request-AI progress for account-unavailable, failed write-Obsidian progress for vault failures, account/vault failure diagnostic/result shapes, and successful `{ startedAt, settings, llm, vaultPath }` preflight data.
- [x] Registered `verify:electron-ai-review-report-ipc-preflight-module` in `package.json` and added it to the cleanup-core runner after the report prepare-progress verifier.
- [x] Refreshed stale verifiers so early-failure helper ownership follows the new boundary:
  - `verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `verify-electron-ai-review-report-ipc-failure-module.ts`
- [x] Ran focused preflight/failure/weekly/monthly verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Preflight Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-preflight-module` before extraction | failed as RED because `electron/aiReviewReportIpcPreflight.ts` did not exist |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` before extraction | failed because the weekly report IPC module did not yet import/use the shared preflight helper |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` before extraction | failed because the monthly report IPC module did not yet import/use the shared preflight helper |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` after initial extraction | failed at a stale expectation that all three early failure branches remain inline in the weekly report IPC module |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` after initial extraction | failed at a stale expectation that all three early failure branches remain inline in the monthly report IPC module |
| `npm run verify:electron-ai-review-report-ipc-preflight-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-failure-module` after verifier calibration | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` after verifier calibration | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` after verifier calibration | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 153: Electron AI Review Report IPC Prepare Progress Helper
- [x] Added red/green structural and runtime-value verification for extracting shared prepare-materials completed-stage/progress construction from weekly/monthly AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcPrepareProgress.ts` with `CompleteReportPrepareMaterialsOptions` and `completeReportPrepareMaterials(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so source-character message creation plus completed prepare-materials stage/progress emission now flow through the shared helper.
- [x] Preserved behavior: `buildSourceCharsMessage(sourceChars)`, completed `prepareMaterials` stage timing via `Date.now() - prepareStartedAt`, and completed prepare-materials progress emission.
- [x] Registered `verify:electron-ai-review-report-ipc-prepare-progress-module` in `package.json` and added it to the cleanup-core runner after the report completion verifier.
- [x] Refreshed stale verifiers so helper ownership follows the new boundary:
  - `verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `verify-electron-ai-review-ipc-helpers-module.ts`
- [x] Ran focused prepare-progress verification, related weekly/monthly/helper verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Prepare Progress Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-prepare-progress-module` before extraction | failed as RED because `electron/aiReviewReportIpcPrepareProgress.ts` did not exist |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` before extraction | failed because the weekly report IPC module did not yet import/use the shared prepare-progress helper |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` before extraction | failed because the monthly report IPC module did not yet import/use the shared prepare-progress helper |
| `npm run verify:electron-ai-review-ipc-helpers-module` after initial extraction | failed at a stale expectation that weekly/monthly still directly import `buildSourceCharsMessage` from `aiReviewIpcHelpers.ts` |
| `npm run verify:electron-ai-review-report-ipc-prepare-progress-module` after verifier calibration | passed |
| `npm run verify:electron-ai-review-ipc-helpers-module` after verifier calibration | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |

### Phase 155: Electron AI Review Report IPC No-Source Failure Helper
- [x] Added red/green structural and runtime-value verification for extracting the shared weekly/monthly no-source-materials failure path from AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcNoSourceFailure.ts` with `FailReportForNoSourceMaterialsOptions` and `failReportForNoSourceMaterials(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so failed prepare-materials progress emission plus no-source failure-result construction now flow through the shared helper.
- [x] Preserved behavior: failed prepare-materials progress text, `noSourceMaterials` final status, source-char passthrough, and failed return shape `{ ok: false, error, diagnostic }`.
- [x] Registered `verify:electron-ai-review-report-ipc-no-source-failure-module` in `package.json` and added it to the cleanup-core runner after the report preflight verifier.
- [x] Refreshed stale verifiers so helper ownership follows the new boundary:
  - `verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `verify-electron-ai-review-report-ipc-failure-module.ts`
  - `verify-electron-ai-review-ipc-messages-module.ts`
- [x] Ran focused no-source/failure/weekly/monthly/messages verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC No-Source Failure Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-no-source-failure-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-failure-module` | passed |
| `npm run verify:electron-ai-review-ipc-messages-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 156: Electron AI Review Report IPC Execution Helper
- [x] Added red/green structural and runtime-value verification for extracting the shared weekly/monthly execution tail from AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcExecution.ts` with `ExecuteReportGenerationOptions` and `executeReportGeneration(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so request-AI provider calls plus final result assembly now flow through the shared execution helper.
- [x] Preserved behavior: delayed `llmResult` capture, request-AI progress emission, report-writer callback shape, and final completion diagnostic assembly.
- [x] Registered `verify:electron-ai-review-report-ipc-execution-module` in `package.json` and added it to the cleanup-core runner after the no-source failure verifier.
- [x] Refreshed stale verifiers so helper ownership follows the new boundary:
  - `verify-electron-ai-review-report-ipc-diagnostics-module.ts`
  - `verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `verify-electron-ai-review-report-ipc-completion-module.ts`
  - `verify-electron-ai-review-report-ipc-llm-progress-module.ts`
- [x] Ran focused execution/weekly/monthly/completion/LLM-progress verification, TypeScript, cleanup-core, and production build.
- **Status:** complete

## Electron AI Review Report IPC Execution Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-execution-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-completion-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-llm-progress-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-diagnostics-module` after verifier calibration | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 157: Electron AI Review Report IPC Source Preparation Helper
- [x] Added red/green structural and runtime-value verification for extracting the shared weekly/monthly source-preparation orchestration from AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcSourcePreparation.ts` with `PrepareReportSourcesOptions` and `prepareReportSources(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so source-character summarization, completed prepare-materials progress, and no-source-materials failure return now flow through the shared helper.
- [x] Preserved behavior: source-character totals, completed-then-failed prepare-materials progress ordering for empty sources, successful `{ ok: true, sourceChars, stages }` return shape, and no-source diagnostic payload.
- [x] Registered `verify:electron-ai-review-report-ipc-source-preparation-module` in `package.json` and added it to the cleanup-core runner after the no-source failure verifier.
- [x] Refreshed stale verifiers so helper ownership follows the new boundary:
  - `verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `verify-electron-ai-review-report-ipc-source-summary-module.ts`
  - `verify-electron-ai-review-report-ipc-prepare-progress-module.ts`
  - `verify-electron-ai-review-report-ipc-no-source-failure-module.ts`
- [x] Ran focused source-preparation/source-summary/prepare-progress/no-source/failure/weekly/monthly/helpers/messages verification, cleanup-core, TypeScript, and production build.
- **Status:** complete

## Electron AI Review Report IPC Source Preparation Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-source-preparation-module` before extraction | failed as RED because `electron/aiReviewReportIpcSourcePreparation.ts` did not exist |
| `npm run verify:electron-ai-review-report-ipc-source-preparation-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-source-summary-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-prepare-progress-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-no-source-failure-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-failure-module` | passed |
| `npm run verify:electron-ai-review-ipc-helpers-module` | passed |
| `npm run verify:electron-ai-review-ipc-messages-module` | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 158: Electron AI Review Report IPC Source Collection Orchestration
- [x] Added red/green structural and runtime-value verification for extracting the remaining weekly/monthly source-collection orchestration from AI Review report IPC modules.
- [x] Extracted `electron/aiReviewReportIpcSourceCollection.ts` with a shared `collectPreparedReportSources(...)` skeleton plus `collectWeeklyReportSources(...)` and `collectMonthlyReportSources(...)`.
- [x] Updated `electron/aiReviewWeeklyReportIpc.ts` and `electron/aiReviewMonthlyReportIpc.ts` so range-specific date/range derivation plus source collection now flow through the shared helper.
- [x] Preserved behavior: weekly `manual-files` short-circuit, weekly selected/monday/weekDates derivation, monthly month/first/last derivation, monthly `collectMonthlySources(...)` wiring, mapped source payload shapes, and `prepareStartedAt` timing.
- [x] Registered `verify:electron-ai-review-report-ipc-source-collection-module` in `package.json` and added it to the cleanup-core runner before the source-preparation verifier.
- [x] Refreshed stale verifiers so helper ownership follows the new boundary:
  - `verify-electron-ai-review-weekly-report-ipc-module.ts`
  - `verify-electron-ai-review-monthly-report-ipc-module.ts`
  - `verify-electron-ai-review-ipc-month-range-reuse.ts`
- [x] Calibrated `verify-electron-ai-review-ipc-month-range-reuse.ts` after it initially failed at a stale assumption that personal monthly `monthKey/getMonthDates(...)` still lived in `electron/aiReviewMonthlyReportIpc.ts`.
- [x] Ran focused source-collection/weekly/monthly/source-preparation/month-range-reuse verification, cleanup-core, TypeScript, and production build.
- **Status:** complete

## Electron AI Review Report IPC Source Collection Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-report-ipc-source-collection-module` before extraction | failed as RED because `electron/aiReviewReportIpcSourceCollection.ts` did not exist |
| `npm run verify:electron-ai-review-report-ipc-source-collection-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-source-preparation-module` | passed |
| `npm run verify:electron-ai-review-ipc-month-range-reuse` after verifier calibration | passed |
| `npm run verify:cleanup-core` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 159: AI Review Export Reports Shared LLM-Backed Helper
- [x] Added focused structural verification that `electron/aiReview/exportReports.ts` owns a shared LLM-backed report-generation helper used by weekly, monthly, and external exports.
- [x] Extracted a shared `generateLlmBackedReport(...)` helper in `electron/aiReview/exportReports.ts`.
- [x] Further centralized report file-path and frontmatter creation through `resolveReportFilePath(...)`, `buildPersonalReportFrontmatter(...)`, and `buildExternalReportFrontmatter(...)`.
- [x] Preserved behavior: personal weekly/monthly and external exports still build the same prompts, keep the same output directories, preserve AI draft note injection, preserve truncation handling, and still avoid writing files when LLM generation fails.
- [x] Verified the refactor with focused export-report checks plus TypeScript and production build.
- **Status:** complete

## AI Review Export Reports Shared Helper Verification

| Command | Result |
|---------|--------|
| `npm run verify:export-reports` before helper extraction | failed as RED because the shared LLM-backed report helper did not exist |
| `npm run verify:export-reports` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 160: App Settings Legacy Path Migration Helper Cleanup
- [x] Added focused runtime verification for legacy monthly and external-monthly Obsidian report-directory migration in `scripts/verify-settings-sync.ts`.
- [x] Confirmed RED because legacy `monthlyDir` migration incorrectly produced a weekly `{{year}}-W{{week}}.md` filename pattern.
- [x] Extracted small shared path readers in `shared/appSettings.ts` via `readStringSetting(...)`, `resolveStoredPath(...)`, and `resolveStoredReportPath(...)`.
- [x] Fixed `migrateReportDir(...)` so monthly legacy paths now append `{{year}}-{{month}}.md` while weekly paths still append `{{year}}-W{{week}}.md`.
- [x] Preserved behavior: current explicit path keys still win, legacy `dailyNotePath` fallback still works, and weekly/external weekly migrations remain unchanged.
- [x] Verified the change with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## App Settings Legacy Path Migration Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before helper cleanup | failed as RED because legacy `monthlyDir` migrated to a weekly filename template |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 161: AI Review Section Config Custom-Block Fallback Cleanup
- [x] Added focused runtime verification for daily/report custom-block fallback behavior in `scripts/verify-section-config.ts`.
- [x] Confirmed RED because missing fields on later custom blocks incorrectly fell back to the first default block instead of the same-position default block.
- [x] Extracted `normalizeTemplateCustomBlocks(...)` in `shared/aiReview/sectionConfig.ts` so daily and report template normalization share the same custom-block list handling.
- [x] Updated `normalizeCustomBlock(...)` to accept an explicit fallback block, preserving per-index fallback semantics while keeping id generation and field normalization behavior unchanged.
- [x] Preserved behavior: empty or missing custom-block arrays still fall back to defaults, explicit ids still win, and render-type coercion remains unchanged.
- [x] Verified the cleanup with focused section-config checks plus TypeScript and production build.
- **Status:** complete

## AI Review Section Config Custom-Block Verification

| Command | Result |
|---------|--------|
| `npm run verify:section-config` before helper cleanup | failed as RED because later custom blocks reused the first default block for fallback fields |
| `npm run verify:section-config` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 162: AI Review Settings Empty-Profile Normalization Consistency
- [x] Added focused runtime verification in `scripts/verify-ai-settings.ts` for normalizing fresh default AI Review settings without inventing a synthetic profile.
- [x] Confirmed RED because `normalizeAiReviewSettings(createDefaultAiReviewSettings())` incorrectly migrated new-format `profiles: []` into a generated single profile.
- [x] Updated `shared/aiReview/aiReviewSettings.ts` so explicit stored `profiles` ownership is distinguished from legacy no-`profiles` data via `hasStoredProfiles`.
- [x] Preserved behavior: legacy single-account settings without a `profiles` field still migrate into one default profile, while explicit empty `profiles` stays empty and keeps `activeProfileId` blank.
- [x] Verified the fix with focused AI settings checks plus TypeScript and production build.
- **Status:** complete

## AI Review Settings Empty-Profile Verification

| Command | Result |
|---------|--------|
| `npm run verify:ai-settings` before normalization fix | failed as RED because fresh default settings normalized into a generated profile |
| `npm run verify:ai-settings` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 163: AI Review Section Config Blank Custom-Block Name Fallback
- [x] Tightened focused runtime verification in `scripts/verify-section-config.ts` so blank stored custom-block names must fall back to the same-position default block name.
- [x] Confirmed RED because `normalizeCustomBlock(...)` treated whitespace-only names as valid and preserved them instead of using the default label.
- [x] Updated `shared/aiReview/sectionConfig.ts` so custom-block `name` now falls back when the stored string is blank after trimming.
- [x] Preserved behavior: non-blank names still win, prompt empty-string behavior remains unchanged, and per-index fallback semantics from the previous cleanup stay intact.
- [x] Verified the fix with focused section-config checks plus TypeScript and production build.
- **Status:** complete

## AI Review Section Config Blank Name Verification

| Command | Result |
|---------|--------|
| `npm run verify:section-config` before blank-name fix | failed as RED because whitespace-only custom-block names were preserved instead of falling back to defaults |
| `npm run verify:section-config` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 164: AI Review Settings Malformed Profiles Fallback Consistency
- [x] Added focused runtime verification in `scripts/verify-ai-settings.ts` for malformed non-array `profiles` payloads during legacy single-account migration.
- [x] Confirmed RED because `normalizeAiReviewSettings(...)` treated malformed `profiles` values like explicit empty new-format data, which discarded legacy top-level credentials instead of migrating them into a default profile.
- [x] Updated `shared/aiReview/aiReviewSettings.ts` so only real profile arrays take the new-format normalization path; malformed or absent `profiles` values now continue through legacy single-account migration.
- [x] Preserved behavior: explicit `profiles: []` still stays empty, valid profile arrays still normalize in place, and legacy top-level provider/baseUrl/apiKey/model/timeout values still migrate into one generated default profile.
- [x] Verified the fix with focused AI settings checks plus TypeScript and production build.
- **Status:** complete

## AI Review Settings Malformed Profiles Verification

| Command | Result |
|---------|--------|
| `npm run verify:ai-settings` before malformed-profiles fix | failed as RED because non-array `profiles` discarded legacy credentials instead of migrating them |
| `npm run verify:ai-settings` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 165: Obsidian Retained Review Archived-Only Merge Consistency
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for merging multiple retained reviews back into the same archived-only task when that task no longer exists in the local task tree.
- [x] Confirmed RED because `mergeRetainedReviewsForObsidian(...)` overwrote earlier archived-only retained reviews with the later task snapshot instead of accumulating both reviews.
- [x] Updated `shared/obsidianReviewRetention.ts` so archived-only merge passes also reuse any already-accumulated same-id task from the local `archivedOnly` map before falling back to the incoming archived snapshot.
- [x] Preserved behavior: live tasks in the current task tree still update in place, duplicate retained review identities still dedupe, and latest review ordering still drives `completionReview`.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Retained Review Archived-Only Merge Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before archived-only merge fix | failed as RED because multiple retained reviews for the same missing task collapsed to only the later review |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 166: Obsidian Template Absolute Windows Path Rejection
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` to ensure `resolveTemplatePath(...)` rejects absolute Windows template paths before any sanitization.
- [x] Confirmed RED because `C:/secret/report.md` was sanitized into `G:\\vault\\C-\\secret\\report.md` instead of being rejected as an absolute path.
- [x] Updated `shared/obsidianTemplates.ts` so `resolveTemplatePath(...)` checks the raw rendered template path for absoluteness before applying invalid-character replacement.
- [x] Preserved behavior: relative template paths still sanitize invalid filename characters, and post-sanitization vault-escape checks remain unchanged.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Template Absolute Path Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before absolute-path fix | failed as RED because absolute Windows template paths were rewritten into misleading relative vault paths |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 167: Task Rollover Latest Review Ordering Robustness
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for completed tasks whose `completionReviews` array is out of chronological order.
- [x] Confirmed RED because `getLatestCompletionPercent(...)` incorrectly treated the last array element as latest, which caused rollover to carry forward tasks that were actually fully completed in the newest review.
- [x] Updated `shared/taskRollover.ts` so latest completion percent is now derived from the review with the greatest `reviewedAt` value instead of the last array element.
- [x] Preserved behavior: incomplete tasks still carry forward, single-review tasks still behave the same, and `completionReview` fallback still works when no review array exists.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Task Rollover Latest Review Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before rollover ordering fix | failed as RED because an older partial review at the end of the array overrode a newer 100% completion review |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 168: AI Review Section Config Blank Custom-Block Id Fallback
- [x] Added focused runtime verification in `scripts/verify-section-config.ts` for whitespace-only or empty custom-block ids in both daily and report template normalization.
- [x] Confirmed RED because `normalizeCustomBlock(...)` treated blank strings as valid ids and preserved them instead of generating replacement ids.
- [x] Updated `shared/aiReview/sectionConfig.ts` so custom-block `id` now falls back to a generated UUID when the stored string is blank after trimming.
- [x] Preserved behavior: explicit non-blank ids still win, name fallback semantics remain unchanged, and render-type normalization stays the same.
- [x] Verified the fix with focused section-config checks plus TypeScript and production build.
- **Status:** complete

## AI Review Section Config Blank Id Verification

| Command | Result |
|---------|--------|
| `npm run verify:section-config` before blank-id fix | failed as RED because whitespace-only and empty custom-block ids were preserved |
| `npm run verify:section-config` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 169: Task Review Mutations Legacy Empty-Array Fallback Consistency
- [x] Added focused runtime verification in `scripts/verify-task-mutations.ts` for tasks that still carry a legacy `completionReview` while `completionReviews` is present as an explicit empty array.
- [x] Confirmed RED because `findTaskReview(...)`, `appendCompletionReviewToTask(...)`, and `deleteReviewFromTask(...)` treated `completionReviews: []` as authoritative and ignored the legacy single review fallback.
- [x] Updated `src/hooks/taskReviewMutations.ts` to centralize existing-review lookup through a shared `getExistingTaskReviews(...)` helper that matches the existing length-based fallback semantics used elsewhere.
- [x] Preserved behavior: explicit non-empty `completionReviews` arrays still win, legacy single-review tasks still work, and review updates/deletions now stay consistent across append/find/delete paths.
- [x] Verified the fix with focused task-review checks plus TypeScript and production build.
- **Status:** complete

## Task Review Mutations Legacy Fallback Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-mutations` before legacy-fallback fix | failed as RED because explicit empty `completionReviews` hid the legacy `completionReview` from task review mutations |
| `npm run verify:task-mutations` | passed |
| `npm run verify:delete-review` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 170: Task Normalization Latest Review Ordering Consistency
- [x] Added focused runtime verification in `scripts/verify-task-hook-state.ts` for incoming tasks whose `completionReviews` array is out of chronological order.
- [x] Confirmed RED because `normalizeTask(...)` set `completionReview` to the last array element instead of the review with the latest `reviewedAt`.
- [x] Updated `src/hooks/taskTransforms.ts` to derive `completionReview` through a shared `getLatestCompletionReview(...)` helper while preserving the existing non-empty-array and legacy single-review fallback behavior.
- [x] Preserved behavior: task-date normalization still works, explicit non-empty `completionReviews` arrays still stay intact, and carryover consumers now receive the chronologically latest `completionReview` even when stored arrays are unsorted.
- [x] Verified the fix with focused task-hook-state/task-carryover checks plus TypeScript and production build.
- **Status:** complete

## Task Normalization Latest Review Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-hook-state` before ordering fix | failed as RED because out-of-order `completionReviews` made `normalizeIncomingTasks(...)` pick the last array element instead of the latest review by `reviewedAt` |
| `npm run verify:task-hook-state` | passed |
| `npm run verify:task-carryover` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 171: Task Review Mutations Latest Review Ordering Consistency
- [x] Added focused runtime verification in `scripts/verify-task-mutations.ts` for updating or deleting a non-latest review inside an out-of-order `completionReviews` array.
- [x] Confirmed RED because `updateTaskReview(...)` and `deleteReviewFromTask(...)` reset `completionReview` to the last remaining array element instead of the review with the latest `reviewedAt`.
- [x] Updated `src/hooks/taskReviewMutations.ts` to derive the post-mutation `completionReview` through a shared `getLatestTaskReview(...)` helper after filtering or updating review arrays.
- [x] Preserved behavior: explicit non-empty review arrays still remain in their stored order, legacy single-review fallback stays intact, and mutation flows now keep `completionReview` aligned with chronological recency.
- [x] Verified the fix with focused task-review checks plus TypeScript and production build.
- **Status:** complete

## Task Review Mutations Latest Review Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-mutations` before latest-review fix | failed as RED because updating an older review in an out-of-order array left `completionReview` pointing at the last array element instead of the newest review |
| `npm run verify:task-mutations` | passed |
| `npm run verify:delete-review` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 172: Shared Completion Review Chronological Ordering Consistency
- [x] Refreshed `scripts/verify-review-empty-fields.ts` to the current completion-review template copy so the focused verifier fails for the intended ordering bug instead of stale punctuation/text assumptions.
- [x] Added focused runtime verification in `scripts/verify-review-empty-fields.ts` for out-of-order `completionReviews` arrays and for `TaskReviewDialog` reusing the shared completion-review helper.
- [x] Confirmed RED because `getCompletionReviews(...)` returned the stored array order instead of chronological `reviewedAt` order, which made downstream review exports/rendering inherit unstable stage ordering.
- [x] Updated `shared/completionReviews.ts` so the shared helper now returns a chronologically ascending copy while preserving the existing non-empty-array and legacy single-review fallback behavior.
- [x] Updated `src/components/TaskReviewDialog.tsx` to reuse `getCompletionReviews(...)` instead of inlining its own unsorted fallback logic.
- [x] Verified the fix with focused review-field checks plus TypeScript and production build.
- **Status:** complete

## Shared Completion Review Ordering Verification

| Command | Result |
|---------|--------|
| `npm run verify:review-fields` before ordering fix | failed as RED because `getCompletionReviews(...)` preserved stored out-of-order review arrays instead of returning reviews in chronological order |
| `npm run verify:review-fields` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 173: Obsidian Sync Preview Cross-Date Review Task Counting
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for previewing a selected daily note that includes a task from an older `taskDate` only because it has a completion review on the selected date.
- [x] Confirmed RED because `buildSyncPreview(...)` reported `taskCount: 0` even though `buildDailyNoteContent(...)` would render that task into the selected daily note.
- [x] Updated `shared/obsidianTemplates.ts` to centralize the “task appears in this daily note” rule via a shared `taskAppliesToDate(task, date)` helper reused by both `buildTaskLines(...)` and `buildSyncPreview(...)`.
- [x] Preserved behavior: task sorting/rendering rules stay unchanged, review-only tasks from other dates now count correctly in preview, and preview continues to count flattened subtasks with the same visibility semantics as the actual note renderer.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Sync Preview Task Counting Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before preview-count fix | failed as RED because preview taskCount ignored tasks that would appear in the selected note only via same-day completion reviews |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 174: Obsidian Sync Preview Visible Completion Record Counting
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for a task whose completion review exists only on a different date and therefore should not contribute any completion-record count to the selected daily note preview.
- [x] Confirmed RED because `buildSyncPreview(...).completionRecordCount` counted all stored completion reviews even when `buildDailyNoteContent(...)` would render none of them for the selected date.
- [x] Updated `shared/obsidianTemplates.ts` to centralize per-date visible review selection through `getVisibleCompletionReviews(task, date)` and reused that helper in both `buildTaskLines(...)` and preview completion-record counting.
- [x] Preserved behavior: tasks dated on the selected day still count all of their reviews, cross-date review-only tasks still count only same-day reviews, and hidden off-date reviews no longer inflate preview counts.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Sync Preview Completion Record Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before visible-review fix | failed as RED because preview `completionRecordCount` included reviews that would not render into the selected daily note |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 175: Obsidian Sync Preview Visible Deleted Review Detection
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for deleting a review that belongs only to another date and therefore should not be reported as disappearing from the selected daily note preview.
- [x] Confirmed RED because `buildSyncPreview(...).deletedReviewWillDisappear` compared all stored review keys before/after deletion even when the removed review was never visible in the selected note.
- [x] Updated `shared/obsidianTemplates.ts` so preview review-key comparison now reuses the same per-date visible review selection used by note rendering and completion-record counting.
- [x] Preserved behavior: deleting a review that would actually appear in the selected note still reports disappearance, while deleting an off-date hidden review no longer triggers a false positive preview warning.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Sync Preview Deleted Review Visibility Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before visible-deleted-review fix | failed as RED because preview `deletedReviewWillDisappear` treated hidden off-date review deletions as visible changes |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 176: Obsidian Sync Cross-Date Deleted Review Affected-Date Propagation
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for deleting a selected-date completion review from a task whose `taskDate` is older, ensuring both preview and real sync include the older affected daily note.
- [x] Confirmed RED because `previewTasksToObsidian(...)` only listed the selected daily note file and `syncTasksToObsidian(...)` failed to refresh the original task-date note, leaving the deleted review stale there.
- [x] Updated `electron/obsidianSync.ts` so affected-date collection now unions before/after task trees, preview file lists include every affected daily note path, and real sync rewrites all affected dates with the post-delete task state.
- [x] Propagated optional `beforeTasks` through the renderer/Electron sync call chain so automatic sync can compare the last synced Obsidian task tree against the new one when review deletions remove the only selected-date linkage.
- [x] Preserved behavior: ordinary selected-date syncs still touch one file, preview still keeps the selected note managed-block summary, and cross-date deletions now clear stale review content from older task-date notes.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Sync Cross-Date Deletion Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before affected-date propagation fix | failed as RED because preview under-reported affected files and real sync left deleted cross-date review content stale in the original task-date note |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 177: Obsidian Sync Preview Multi-File Task Counting Consistency
- [x] Added focused runtime verification in `scripts/verify-settings-sync.ts` for a cross-date deleted-review preview that now spans two daily note files, ensuring `taskCount` reflects tasks rendered across all affected notes instead of only the selected date note.
- [x] Confirmed RED because the Electron preview layer expanded `files` to multiple affected dates but still reused the single-date `taskCount` / `completionRecordCount` / `deletedReviewWillDisappear` values from only the selected preview note.
- [x] Updated `electron/obsidianSync.ts` so multi-file preview now builds per-date previews for every affected daily note and aggregates their counts while preserving the selected-note managed-block summary.
- [x] Preserved behavior: single-file previews remain unchanged, file actions still reflect per-date create/update status, and cross-date preview counts now match the total rendered task/review blocks that the real sync will process.
- [x] Verified the fix with focused settings-sync checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Sync Preview Multi-File Count Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before multi-file preview count fix | failed as RED because preview `taskCount` still described only the selected note after `files` had expanded to multiple affected dates |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 178: Obsidian Daily Template Disabled Custom Block Visibility
- [x] Calibrated `scripts/verify-obsidian-template-center.ts` to the current monthly legacy-path migration behavior so the focused verifier checks the intended visibility bug instead of an old weekly-path expectation.
- [x] Added focused runtime verification in `scripts/verify-obsidian-template-center.ts` for the `work-review` preset, ensuring a disabled custom module (`knowledge`) does not keep rendering its heading into the generated daily note.
- [x] Confirmed RED because `buildDailyNoteContent(...)` still emitted the disabled custom block heading while only omitting its AI marker body.
- [x] Updated `shared/obsidianTemplates.ts` so disabled custom blocks now render nothing at all in daily note generation instead of leaving empty orphan headings behind.
- [x] Preserved behavior: enabled custom blocks still render their heading plus AI markers, and default daily review block output remains unchanged.
- [x] Verified the fix with focused template-center and daily-review-block checks plus TypeScript and production build.
- **Status:** complete

## Obsidian Disabled Custom Block Visibility Verification

| Command | Result |
|---------|--------|
| `npm run verify:obsidian-template-center` before visibility fix | failed as RED because disabled daily-template modules still rendered hidden custom block headings |
| `npm run verify:obsidian-template-center` | passed |
| `npm run verify:daily-review-blocks` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 179: Template Renderer Disabled Custom Block Visibility
- [x] Added focused runtime verification in `scripts/verify-obsidian-template-center.ts` for `renderDailyTemplate(...)` so disabled daily custom blocks do not render orphan headings.
- [x] Confirmed RED because `renderDailyTemplate(...)` still emitted the disabled `work-review` knowledge block heading even after `buildDailyNoteContent(...)` had been fixed.
- [x] Updated `shared/templateRenderer.ts` so disabled custom blocks are skipped entirely in daily template rendering.
- [x] Preserved behavior: enabled daily custom blocks still render their heading plus AI markers, and report template rendering semantics were intentionally left unchanged.
- [x] Verified the fix with focused template checks plus TypeScript and production build.
- **Status:** complete

## Template Renderer Disabled Custom Block Verification

| Command | Result |
|---------|--------|
| `npm run verify:obsidian-template-center` before renderer fix | failed as RED because `renderDailyTemplate(...)` still rendered the disabled daily custom block heading |
| `npm run verify:obsidian-template-center` | passed |
| `npm run verify:daily-markdown-template` | passed |
| `npm run verify:daily-template-markers` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 180: Legacy Disabled Fixed Daily Module Visibility
- [x] Investigated the Template Center fixed-module toggle path and confirmed current UI intentionally keeps work/inspiration/tasks fixed and non-toggleable.
- [x] Found a legacy-compatibility mismatch: `buildSyncPreview(...)` respected old `modules.work/inspiration/tasks.enabled=false`, but initial daily note generation still rendered those fixed managed blocks.
- [x] Added focused RED coverage in `scripts/verify-daily-template-markers.ts` for both fallback daily generation and custom `dailyMarkdownTemplate` token replacement.
- [x] Updated `shared/obsidianTemplates.ts` so fixed daily blocks consult the existing compat enabled flags before rendering, replacing tokens, or appending missing managed blocks.
- [x] Preserved behavior: current structured Template Center output remains unchanged because fixed modules are still enabled by default, custom AI block visibility remains controlled by `aiGenerate`, and sync preview semantics are now aligned with generated content.
- [x] Verified the fix with focused daily-template checks, adjacent sync/template checks, TypeScript, and production build.
- **Status:** complete

## Legacy Disabled Fixed Daily Module Verification

| Command | Result |
|---------|--------|
| `npm run verify:daily-template-markers` before fix | failed as RED because disabled legacy work/inspiration/tasks modules still rendered in generated daily content |
| `npm run verify:daily-template-markers` | passed |
| `npm run verify:settings-sync` | passed |
| `npm run verify:obsidian-template-center` | passed |
| `npm run verify:daily-markdown-template` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 181: Flexible Daily Template Token Replacement
- [x] Reproduced a daily-template generation mismatch: migration recognizes tokens such as `{{ work }}` / `{{ Inspiration }}` / `{{ TASKS }}`, but `buildDailyNoteFromTemplate(...)` only replaced exact lowercase no-space tokens.
- [x] Added focused RED coverage in `scripts/verify-daily-template-markers.ts` so spaced/case-varied daily tokens must render and must not leak raw `{{ ... }}` placeholders into generated notes.
- [x] Updated `shared/obsidianTemplates.ts` with a small `replaceDailyTemplateToken(...)` helper and reused it for `date`, `work`, `inspiration`, `inspire`, and `tasks`.
- [x] Preserved behavior: exact existing tokens still work, missing enabled core blocks are still appended, and Phase 180 legacy-disabled fixed modules still render empty output instead of managed blocks.
- [x] Verified the fix with focused daily-template checks, adjacent sync/template checks, TypeScript, and production build.
- **Status:** complete

## Flexible Daily Template Token Verification

| Command | Result |
|---------|--------|
| `npm run verify:daily-template-markers` before fix | failed as RED because `{{ DATE }}` / spaced core tokens leaked into generated notes |
| `npm run verify:daily-template-markers` | passed |
| `npm run verify:daily-markdown-template` | passed |
| `npm run verify:obsidian-template-center` | passed |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 182: Custom Daily AI Template Token Replacement
- [x] Reproduced the adjacent custom-token mismatch: migration recognizes `{{review}}`, `{{tomorrow}}`, and `{{knowledge}}`, but `buildDailyNoteFromTemplate(...)` left those placeholders raw and produced no AI marker blocks.
- [x] Added focused RED coverage in `scripts/verify-daily-template-markers.ts` so spaced/case-varied custom AI tokens must render as DailyTodo custom marker blocks.
- [x] Updated `shared/obsidianTemplates.ts` with `buildCustomTokenBlock(...)` and reused the Phase 181 token replacement helper for `review`, `tomorrow`, and `knowledge`.
- [x] Preserved behavior: disabled custom blocks still render empty output through `buildCustomAiBlock(...)`, and fixed token replacement/legacy-disabled fixed modules remain unchanged.
- [x] Verified the fix with focused daily-template checks, adjacent template recognition/sync checks, TypeScript, and production build.
- **Status:** complete

## Custom Daily AI Template Token Verification

| Command | Result |
|---------|--------|
| `npm run verify:daily-template-markers` before fix | failed as RED because `{{ review }}` did not render the expected custom AI marker block |
| `npm run verify:daily-template-markers` | passed |
| `npm run verify:daily-markdown-template` | passed |
| `npm run verify:obsidian-template-center` | passed |
| `npm run verify:obsidian-template-recognition` | passed |
| `npm run verify:settings-sync` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 183: Daily Path Template Variable Expansion
- [x] Reproduced a daily-path variable mismatch: report paths already support `{{year}}`, `{{month}}`, and spaced `{{ date }}` style variables, but `resolveTemplatePath(...)` only replaced exact `{{date}}`.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` so daily paths like `logs/daily/{{year}}/{{month}}/{{ date }}.md` expand to the selected date.
- [x] Updated `shared/obsidianTemplates.ts` so `resolveTemplatePath(...)` reuses the shared `expandPathTemplate(...)` helper with a local date-key parser.
- [x] Preserved behavior: absolute path rejection still happens before filename-character sanitization, vault escape checks remain unchanged, and unknown variables still remain visible instead of being silently dropped.
- [x] Verified the fix with focused settings-sync checks, adjacent template/path checks, TypeScript, and production build.
- **Status:** complete

## Daily Path Template Variable Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because daily paths still contained raw `{{year}}/{{month}}/{{ date }}` placeholders |
| `npm run verify:settings-sync` | passed |
| `npm run verify:daily-markdown-template` | passed |
| `npm run verify:obsidian-template-center` | passed |
| `npm run verify:template-source-settings` | passed |
| `npm run verify:daily-template-markers` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 184: Case-Insensitive Path Template Variables
- [x] Reproduced a shared path-template mismatch: daily/report path templates tolerated whitespace, but `expandPathTemplate(...)` only matched lowercase variable names.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` so `{{YEAR}}`, `{{Month}}`, and `{{ DATE }}` expand in daily paths.
- [x] Updated `shared/pathTemplate.ts` to make supported variables `date/year/month/week` case-insensitive while preserving unknown-variable passthrough.
- [x] Verified the fix with focused settings-sync checks, adjacent template-source checks, TypeScript, and production build.
- **Status:** complete

## Case-Insensitive Path Template Variable Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because uppercase/mixed-case variables stayed raw in the resolved daily path |
| `npm run verify:settings-sync` | passed |
| `npm run verify:template-source-settings` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 185: AI Review Source Path Template Parity
- [x] Reproduced an AI Review source-material path mismatch: daily source rules still used a private exact `{{date}}` renderer, so `{{YEAR}}/{{Month}}/{{ DATE }}` paths were not found.
- [x] Added focused RED coverage in `scripts/verify-source-materials.ts` for whitespace/case-tolerant daily source variables and Windows absolute source-path rejection.
- [x] Updated `shared/aiReview/sourceMaterials.ts` so source rules reuse `expandPathTemplate(...)` with local date-key parsing and reject absolute paths before filename-character sanitization.
- [x] Preserved behavior: relative source paths still sanitize invalid filename characters, vault-escape checks remain unchanged, disabled/manual source modes are untouched, and unknown variables remain visible.
- [x] Verified the fix with focused source-material checks, adjacent AI Review source-collection/IPС checks, TypeScript, and production build.
- **Status:** complete

## AI Review Source Path Template Verification

| Command | Result |
|---------|--------|
| `npm run verify:source-materials` before fix | failed as RED because mixed-case/spaced daily source variables stayed raw and no nested source note was found |
| `npm run verify:source-materials` | passed |
| `npm run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm run verify:electron-ai-review-report-ipc-source-collection-module` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 186: AI Review Weekly Source Directory Vault Guard
- [x] Reproduced a source-material path safety gap: direct callers of `collectMonthlySources(...)` could pass `weeklyDir: '../outside-weekly'` and read weekly report files outside the selected vault.
- [x] Added focused RED coverage in `scripts/verify-source-materials.ts` that creates an outside weekly report and requires `collectMonthlySources(...)` to reject the escaping directory.
- [x] Updated `shared/aiReview/sourceMaterials.ts` with `resolveRenderedVaultRelativePath(...)`, then reused it for both daily source rule paths and weekly report source files.
- [x] Preserved behavior: valid relative weekly report directories still work, weekly-only/manual modes remain unchanged, invalid filename character sanitization remains after absolute-path rejection, and vault-escape checks now cover weekly report sources too.
- [x] Verified the fix with focused source-material checks, adjacent AI Review source-collection/IPС checks, TypeScript, and production build.
- **Status:** complete

## AI Review Weekly Source Directory Vault Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:source-materials` before fix | failed as RED because `weeklyDir: '../outside-weekly'` did not throw |
| `npm run verify:source-materials` | passed |
| `npm run verify:electron-ai-review-report-ipc-source-collection-module` | passed |
| `npm run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 187: AI Review Report Output Vault Guard
- [x] Reproduced a report-output path safety gap: direct callers of `generatePersonalWeekly(...)` could pass `relativeDir: '../outside-export'` and write reports outside the selected vault.
- [x] Added focused RED coverage in `scripts/verify-export-reports.ts` requiring report writers to reject escaping output directories before LLM-backed writes complete.
- [x] Updated `electron/aiReview/exportReports.ts` so `resolveReportFilePath(...)` rejects absolute output dirs and vault escapes before returning the resolved report path.
- [x] Preserved behavior: default weekly/monthly/external output directories still work, valid custom relative dirs still override defaults, failed LLM calls still do not write, and external reports still redact before calling the LLM.
- [x] Verified the fix with focused export-report checks, adjacent weekly/monthly/external AI Review IPC checks, TypeScript, and production build.
- **Status:** complete

## AI Review Report Output Vault Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:export-reports` before fix | failed as RED because `relativeDir: '../outside-export'` did not reject |
| `npm run verify:export-reports` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm run verify:electron-ai-review-external-report-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 188: Companion Target Absolute Path Guard
- [x] Reproduced a Companion sync target path safety gap: target paths such as `C:/secret/{{date}}.md` were sanitized before absolute-path rejection, allowing them to be treated as relative vault paths.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` requiring absolute Windows target paths to be rejected before filename sanitization.
- [x] Updated `electron/obsidianCompanion.ts` so `resolveTargetPath(...)` checks the raw rendered target for absoluteness before replacing invalid filename characters.
- [x] Preserved behavior: valid relative Companion targets still sync, existing traversal rejection remains unchanged, and managed-block/append writes continue to use the same write plan behavior.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC/action checks, TypeScript, and production build.
- **Status:** complete

## Companion Target Absolute Path Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because absolute Windows targets were not rejected |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run verify:app-companion-actions-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |


### Phase 189: Companion Template Variable Flexibility
- [x] Reproduced a Companion template variable mismatch: `renderTemplate(...)` only replaced exact no-space tokens such as `{{date}}`, while nearby path/template systems now accept spaced and case-varied variables.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` for `{{ DATE }}`, `{{Content}}`, `{{ TAGS }}`, `{{PRIORITY}}`, `{{ CREATEDAT }}`, plus a Companion target path using `{{ DATE }}`.
- [x] Updated `electron/obsidianCompanion.ts` so Companion template rendering trims token whitespace and resolves known variables case-insensitively.
- [x] Preserved behavior: exact existing tokens still render, unknown tokens still render as empty strings, tag normalization remains unchanged, and Phase 188 target path safety still checks the rendered raw target before sanitization.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC/action checks, TypeScript, and production build.
- **Status:** complete

## Companion Template Variable Flexibility Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because `{{ DATE }}` did not render |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run verify:app-companion-actions-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 190: Companion Mobile Inbox File-Only Import
- [x] Reproduced a mobile-inbox import bug: `importMobileInbox(...)` filtered entries by extension only, so a directory named `archive.md` was treated as an import file, causing `EISDIR` and moving the directory into `_failed`.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with a real text file plus a `*.md` directory; import should process only the real file and leave the directory untouched.
- [x] Updated `electron/obsidianCompanion.ts` to call `fs.readdirSync(inboxPath, { withFileTypes: true })` and filter `entry.isFile()` before extension checks.
- [x] Preserved behavior: `.md/.txt/.json` files still import, processed files still move to `_processed`, invalid files still move to `_failed`, and unsupported entries remain ignored.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC/action checks, TypeScript, and production build.
- **Status:** complete

## Companion Mobile Inbox File-Only Import Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED with `EISDIR` when a `*.md` directory was read as a file |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run verify:app-companion-actions-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 191: Companion SyncPlan Direct Write Vault Guard
- [x] Reproduced a defense-in-depth gap: a malformed direct `writeSyncPlan(...)` call with `ok: true` could write a `SyncPlanChange.filePath` outside the selected vault, bypassing `buildSyncPlan(...)` target validation.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` that constructs a direct plan targeting `../outside-companion-direct.md` and asserts no outside file is created.
- [x] Updated `shared/obsidianCompanion.ts` so `SyncPlan` can carry `vaultPath`, and updated `buildSyncPlan(...)` to attach the selected vault path to generated plans.
- [x] Updated `electron/obsidianCompanion.ts` so `writeSyncPlan(...)` rejects missing vault paths and rejects any change path outside `plan.vaultPath` before mkdir/read/write.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion SyncPlan Direct Write Vault Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because direct `writeSyncPlan(...)` accepted a vault-escaping change path |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 192: Companion SyncPlan Preflight No Partial Write
- [x] Reproduced a partial-write gap left after the Phase 191 per-change vault guard: a malformed direct `writeSyncPlan(...)` plan with one safe change followed by one vault-escaping change could write the safe file before rejecting the unsafe one.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with a mixed safe/unsafe direct plan and assertions that neither the safe file nor the unsafe file is created.
- [x] Updated `electron/obsidianCompanion.ts` so `writeSyncPlan(...)` preflights all change paths before any `mkdir`, read, or write operation.
- [x] Kept the per-change guard inside the write loop as defense in depth after the batch preflight.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks; typecheck/build are deferred under fast batch mode because Phase 191 ran them and Phase 192 changed only local runtime/test logic.
- **Status:** complete

## Companion SyncPlan Preflight No Partial Write Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because a safe change was partially written before a later vault-escaping change was rejected |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 193: Companion Mobile Inbox JSON Content Guard
- [x] Reproduced a mobile-inbox JSON validation gap: a parsed `.json` capture with no `content` field was treated as successful by falling back to the raw JSON text as the item content.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` that imports `empty.json` with metadata but no content, expecting no capture item and a move to `_failed`.
- [x] Updated `electron/obsidianCompanion.ts` so JSON inbox captures must provide non-empty `content`; invalid JSON captures now throw before item creation and reuse the existing `_failed` move path.
- [x] Preserved plain `.md`/`.txt` behavior by keeping raw text fallback only for non-JSON files.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox JSON Content Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because JSON without content was imported successfully |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 194: Obsidian Sync Optional Blog Draft Directory Guard
- [x] Reproduced an optional-side-effect failure: if `localBlogDraftDir` existed but was a file, `syncTasksToObsidian(...)` tried to write `daily-memo-*.md` under that file path and threw, interrupting the main Obsidian daily-note sync.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` with a file-backed blog draft path, expecting sync not to throw, the daily note to be written, and the file not to be overwritten.
- [x] Updated `electron/obsidianSync.ts` so blog draft output is written only when `localBlogDraftDir` exists and is a real directory.
- [x] Preserved the existing optional behavior: missing blog draft dirs are skipped, and valid directories still receive generated drafts.
- [x] Verified the fix with focused settings sync, adjacent Obsidian sync module checks, TypeScript, and production build.
- **Status:** complete

## Obsidian Sync Optional Blog Draft Directory Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED with `ENOENT` when the optional blog draft path was a file |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 195: Companion Mobile Inbox Directory Guard
- [x] Reproduced a mobile-inbox input-shape bug: `importMobileInbox(...)` checked only that `inboxPath` existed, so a file-backed path threw while trying to create `_processed` / `_failed` beneath a file.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with a real file passed as the inbox path; import should not throw, should return an explicit failure result, and should not modify the file.
- [x] Updated `electron/obsidianCompanion.ts` so `importMobileInbox(...)` requires the inbox path to be a directory before creating processing folders.
- [x] Preserved existing behavior for missing paths, valid directories, valid `.md/.txt/.json` imports, and invalid JSON failure routing.
- [x] Verified the fix with focused Companion checks and adjacent Companion mobile UI wiring checks.
- **Status:** complete

## Companion Mobile Inbox Directory Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because a file-backed inbox path threw instead of returning a failure result |
| `npm run verify:companion` | passed |
| `npm run verify:app-companion-mobile-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 196: Companion Mobile Inbox Processing Directory Conflict Guard
- [x] Reproduced a processing-folder setup bug: if a valid mobile inbox already contained a file named `_processed`, `importMobileInbox(...)` threw while trying to create the processing directory.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with `_processed` occupied by a file and a pending `note.txt`; import should not throw, should fail explicitly, and should not move or overwrite files.
- [x] Added `ensureMobileInboxDirectory(...)` in `electron/obsidianCompanion.ts` so `_processed` and `_failed` are created only when absent and rejected if occupied by non-directories.
- [x] Preserved valid mobile inbox behavior and the Phase 195 file-backed inbox guard.
- [x] Verified the fix with focused Companion checks and adjacent Companion mobile UI wiring checks.
- **Status:** complete

## Companion Mobile Inbox Processing Directory Conflict Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because `_processed` occupied by a file caused an uncaught throw |
| `npm run verify:companion` | passed |
| `npm run verify:app-companion-mobile-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 197: Companion Mobile Inbox Blank Text Content Guard
- [x] Reproduced a content-validation gap: blank `.txt` / `.md` inbox files could create empty capture items and move to `_processed` even though JSON captures already required content.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with whitespace-only `blank.txt`; import should fail, create no item, mention content, move the file to `_failed`, and not move it to `_processed`.
- [x] Updated `electron/obsidianCompanion.ts` so every mobile inbox capture must have non-empty trimmed content, regardless of file type.
- [x] Preserved raw-text fallback for non-empty `.md` / `.txt` files and existing invalid JSON failure routing.
- [x] Verified the fix with focused Companion checks, adjacent Companion mobile UI wiring checks, TypeScript, and production build.
- **Status:** complete

## Companion Mobile Inbox Blank Text Content Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because whitespace-only `blank.txt` was imported successfully |
| `npm run verify:companion` | passed |
| `npm run verify:app-companion-mobile-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

## Phase 197 Error Log

| Error | Attempt | Resolution |
|-------|---------|------------|
| `Unterminated string literal` in the first RED test edit | Initial `blank.txt` test literal used an actual newline inside a single-quoted TypeScript string | Rewrote the test literal with escaped `\n` / `\t`, reran `npm run verify:companion`, and confirmed the intended RED failure |

### Phase 198: AI Review Source File-Only Collection Guard
- [x] Reproduced a source-material collection bug: `collectDailySourcesForDates(...)` checked only `fs.existsSync(...)`, so a rendered source path that existed as a directory threw `EISDIR` and interrupted collection.
- [x] Added focused RED coverage in `scripts/verify-source-materials.ts` with a directory named like a daily source file; collection should skip the directory and keep valid source files.
- [x] Updated `shared/aiReview/sourceMaterials.ts` with `readSourceFileIfPresent(...)` so source collection reads only real files with non-empty content.
- [x] Reused the same guard for weekly report source collection to keep daily and weekly source behavior consistent.
- [x] Verified the fix with focused source-material checks and adjacent AI Review source-materials IPC checks.
- **Status:** complete

## AI Review Source File-Only Collection Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:source-materials` before fix | failed as RED with `EISDIR` when a source candidate path was a directory |
| `npm run verify:source-materials` | passed |
| `npm run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 199: AI Review Atomic Snapshot Directory Guard
- [x] Reproduced an atomic snapshot bug: `readWithStamp(...)` treated any existing path as a readable file, so a directory-backed target threw `EISDIR` during snapshot creation.
- [x] Added focused RED coverage in `scripts/verify-atomic-write.ts` with a directory path passed to `readWithStamp(...)`; snapshot should not throw and should not produce file content or a file stamp.
- [x] Updated `electron/aiReview/atomicWrite.ts` so `readWithStamp(...)` returns `{ content: '', stamp: null }` for non-file paths.
- [x] Preserved existing atomic replace conflict behavior: directory-backed write targets with `expected: null` are still refused rather than overwritten.
- [x] Verified the fix with focused atomic-write checks and adjacent export-report checks.
- **Status:** complete

## AI Review Atomic Snapshot Directory Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:atomic-write` before fix | failed as RED with `EISDIR` when snapshotting a directory path |
| `npm run verify:atomic-write` | passed |
| `npm run verify:export-reports` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 200: Electron Vault Status Directory Guard
- [x] Reproduced a vault-status validation bug: `getVaultStatus()` accepted any existing configured Obsidian path, including a file, and returned `ok: true` even though downstream sync/source operations require a directory vault.
- [x] Added focused RED coverage in `scripts/verify-electron-app-state-accessors-module.ts` with `obsidianVaultPath` pointing to a real file; vault status should reject it with a folder/directory explanation.
- [x] Updated `electron/appStateAccessors.ts` with `isExistingDirectory(...)` and now require both the development default vault path and configured vault path to be real directories.
- [x] Preserved missing-path behavior and existing `getVaultPath()` fallback semantics.
- [x] Verified the fix with focused app-state accessor checks, adjacent Electron main module checks, TypeScript, and production build.
- **Status:** complete

## Electron Vault Status Directory Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before fix | failed as RED because a file-backed `obsidianVaultPath` returned `ok: true` |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

## Phase 200 Error Log

| Error | Attempt | Resolution |
|-------|---------|------------|
| Invalid regular expression in the first RED test edit | Initial reason assertion used Chinese alternatives that were transformed into `???` in a regex | Changed the test `zh` stub to prefix an English `directory required:` marker and asserted against `directory|folder`, then reran and confirmed the intended RED failure |

### Phase 201: Obsidian Sync Daily Note File Guard
- [x] Reproduced a daily-note target shape bug: `syncTasksToObsidian(...)` tried to read the selected daily note path whenever it existed, so a directory-backed `*.md` target threw `EISDIR` and escaped the sync API.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` with `logs/daily/DailyTodo/2026-05-28.md` occupied by a directory; sync should not throw and should return a structured failure explaining that the daily note target must be a file.
- [x] Updated `electron/obsidianSync.ts` with `readDailyNoteFileIfPresent(...)`, so existing daily note paths must be real files before reading.
- [x] Wrapped sync writes and preview reads in structured error handling, so directory-backed daily note targets fail cleanly instead of interrupting callers.
- [x] Verified the fix with focused settings sync and adjacent Obsidian sync module checks.
- **Status:** complete

## Obsidian Sync Daily Note File Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because a directory-backed daily note target threw from sync |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 202: Obsidian IPC Open Daily Note File Guard
- [x] Reproduced a daily-note IPC guard gap with focused static coverage: `obsidian:openDailyNote` created/opened the rendered daily note path without checking whether an existing target was a file.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring `openDailyNote` to check `fs.statSync(filePath).isFile()` before `shell.openPath(...)`.
- [x] Updated `electron/obsidianIpc.ts` so `openDailyNote` creates missing files, rejects existing non-file targets with a structured `{ ok: false, reason }`, and catches setup errors before shell open.
- [x] Preserved vault-status gating, daily-note bootstrap creation, overview refresh, and shell-open behavior for valid files.
- [x] Verified the fix with focused Obsidian IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Obsidian IPC Open Daily Note File Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because `openDailyNote` did not check existing targets with `statSync(...).isFile()` |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 203: Electron Icon Path File-Only Guard
- [x] Reproduced an icon-resource path-shape gap with focused static coverage: `resolveIconPath(...)` returned the first existing candidate even if that candidate was a directory named `icon.png` or `tray.png`.
- [x] Added focused RED coverage in `scripts/verify-electron-main-modules.ts` requiring `resolveIconPath(...)` to check `fs.statSync(candidate).isFile()` before returning an icon path.
- [x] Updated `electron/appIcons.ts` so icon candidates must exist and be real files before `nativeImage.createFromPath(...)` receives them.
- [x] Preserved fallback icon behavior for missing or unusable resource paths.
- [x] Verified the fix with focused Electron main module checks, adjacent app-environment checks, TypeScript, and production build.
- **Status:** complete

## Electron Icon Path File-Only Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-modules` before fix | failed as RED because `resolveIconPath(...)` did not require candidates to be files |
| `npm run verify:electron-main-modules` | passed |
| `npm run verify:electron-app-environment-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 204: Electron Development UserData Directory Guard
- [x] Reproduced a development environment path-shape gap with focused static coverage: `applyDevelopmentUserDataOverride()` applied the development `userData` override whenever `DEV_APPDATA_ROOT` existed, even if it was a file.
- [x] Added focused RED coverage in `scripts/verify-electron-app-environment-module.ts` requiring `fs.statSync(DEV_APPDATA_ROOT).isDirectory()` before `app.setPath('userData', DEV_APPDATA_ROOT)`.
- [x] Updated `electron/appEnvironment.ts` so the development `userData` override applies only when the configured path exists and is a real directory.
- [x] Preserved packaged-build behavior, missing-path no-op behavior, icon environment wiring, and exported environment helper shape.
- [x] Verified the fix with focused app-environment checks and adjacent Electron main module checks.
- **Status:** complete

## Electron Development UserData Directory Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-environment-module` before fix | failed as RED because the dev userData override did not require `DEV_APPDATA_ROOT` to be a directory |
| `npm run verify:electron-app-environment-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 205: SafeStore Config File-Only Guard
- [x] Reproduced a corrupt-config recovery path-shape gap with focused static coverage: `createSafeStore()` backed up and rewrote `configPath` whenever it existed, even if the path was a directory.
- [x] Added focused RED coverage in `scripts/verify-electron-foundation-modules.ts` requiring `fs.statSync(configPath).isFile()` before the corrupt-config backup/reset flow.
- [x] Updated `electron/safeStore.ts` so corrupt-config recovery runs only when the resolved config path exists and is a real file.
- [x] Preserved the existing corrupt file backup naming, reset-to-`{}` behavior, and second `new Store()` retry flow for valid file-backed configs.
- [x] Verified the fix with focused Electron foundation checks and adjacent Electron main module checks.
- **Status:** complete

## SafeStore Config File-Only Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-foundation-modules` before fix | failed as RED because `createSafeStore()` did not require `configPath` to be a real file before backup/reset |
| `npm run verify:electron-foundation-modules` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 206: Companion SyncPlan Directory Target No Partial Write Guard
- [x] Reproduced a partial-write gap in `writeSyncPlan(...)`: vault-relative changes were preflighted for vault escapes only, so a later directory-backed target inside the vault could throw `EISDIR` after earlier safe changes had already been written.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with a safe file change followed by a directory-backed target, asserting the whole plan is rejected and no safe change is written.
- [x] Updated `electron/obsidianCompanion.ts` so sync-plan preflight now rejects existing non-file targets before any filesystem side effect begins.
- [x] Kept the in-loop file-target guard as defense in depth in case a target path changes shape after preflight.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion SyncPlan Directory Target No Partial Write Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because `writeSyncPlan(...)` partially wrote a safe change before a later directory-backed target threw |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 207: AI Review Report Write Directory Conflict Structured Failure
- [x] Reproduced a report-write filesystem error gap: `writeReport(...)` let `mkdirSync(path.dirname(filePath))` throw when the configured output directory path was occupied by a file.
- [x] Added focused RED coverage in `scripts/verify-export-reports.ts` asserting personal weekly report generation returns `ok: false` instead of throwing when `logs/weekly-review` is file-backed.
- [x] Updated `electron/aiReview/exportReports.ts` so shared report writing catches filesystem setup/write exceptions and converts them into structured `{ ok: false, error }` report results.
- [x] Preserved existing path-validation throws for vault-escaping `relativeDir` values and preserved shared weekly/monthly/external LLM-backed write flow for valid paths.
- [x] Verified the fix with focused export-report checks and adjacent weekly report IPC module checks.
- **Status:** complete

## AI Review Report Write Directory Conflict Structured Failure Verification

| Command | Result |
|---------|--------|
| `npm run verify:export-reports` before fix | failed as RED because weekly report generation threw when `logs/weekly-review` was occupied by a file |
| `npm run verify:export-reports` | passed |
| `npm run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

## Phase 207 Error Log

| Error | Attempt | Resolution |
|-------|---------|------------|
| `Unterminated string literal` in the first RED test edit | Initial failing test inserted an actual newline inside a single-quoted TypeScript string literal | Replaced the literal with an escaped `\\n` string, reran `npm run verify:export-reports`, and confirmed the intended RED failure |

### Phase 208: Obsidian Optional Blog Draft Target File Guard
- [x] Reproduced an optional-side-effect failure: with a valid `localBlogDraftDir`, a directory occupying `daily-memo-<date>.md` caused `syncTasksToObsidian(...)` to throw `EISDIR` after the primary daily note sync.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` asserting the main sync does not throw, still returns `ok: true`, still writes the selected daily note, and does not replace the directory-backed optional blog draft target.
- [x] Updated `electron/obsidianSync.ts` so optional blog draft output writes only when the target is missing or a real file.
- [x] Wrapped the optional blog draft output path in a local try/catch so draft failures never interrupt primary Obsidian sync.
- [x] Verified the fix with focused settings sync checks and adjacent Obsidian sync module checks.
- **Status:** complete

## Obsidian Optional Blog Draft Target File Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED with `EISDIR` when optional `daily-memo-2026-05-27.md` was occupied by a directory |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 209: Companion SyncPlan Build Directory Target Guard
- [x] Reproduced a planning-layer file-shape gap: `buildSyncPlan(...)` emitted an `ok` plan with an `update-file` change when a resolved Companion target already existed as a directory.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` with a directory occupying the default daily note target before planning.
- [x] Updated `electron/obsidianCompanion.ts` so `buildSyncPlan(...)` rejects existing non-file targets before adding changes.
- [x] Preserved the Phase 206 `writeSyncPlan(...)` preflight/in-loop target guard as defense in depth for malformed direct plans and races.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion SyncPlan Build Directory Target Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because `buildSyncPlan(...)` accepted an existing directory-backed target path |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

## Phase 209 Error Log

| Error | Attempt | Resolution |
|-------|---------|------------|
| `TypeError: assert.equal is not a function` in the first GREEN verifier run | The new verifier assertion accidentally used `assert.equal(...)` in a file whose local `assert` helper is a boolean-only function | Replaced it with the local boolean assert style and reran `npm run verify:companion` successfully |

### Phase 210: Companion Mobile Inbox Processed Move Atomicity Guard
- [x] Reproduced an import atomicity bug: `importMobileInbox(...)` added a capture item to the success list before moving the source file to `_processed`.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by simulating a `_processed` move failure while allowing the fallback `_failed` move.
- [x] Updated `electron/obsidianCompanion.ts` so mobile inbox items are appended only after the source file is successfully moved to `_processed`.
- [x] Preserved existing invalid/blank capture behavior: failed captures still move to `_failed` and report errors.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox Processed Move Atomicity Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because a capture item remained in `items` even though moving it to `_processed` failed |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 211: Companion Mobile Inbox Failed Move Structured Error Guard
- [x] Reproduced a failure-path escape: if moving a capture to `_processed` failed and the fallback move to `_failed` also failed, `importMobileInbox(...)` threw from inside its catch block.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by simulating both `_processed` and `_failed` move failures.
- [x] Updated `electron/obsidianCompanion.ts` so fallback `_failed` move errors are captured into the structured `errors` array instead of escaping.
- [x] Preserved the Phase 210 invariant that failed captures do not appear in successful `items`.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox Failed Move Structured Error Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because `_failed` fallback move errors escaped from `importMobileInbox(...)` |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode |
| `npm run build` | deferred under fast batch mode |

### Phase 212: Companion Mobile Inbox Root Stat Structured Error Guard
- [x] Reproduced a root-validation failure path: `importMobileInbox(...)` checked `existsSync(...)` and then called `fs.statSync(inboxPath)` directly, so a disappearing/blocked inbox root or stat failure could throw instead of returning the importer's structured result shape.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by patching `fs.statSync` for the inbox root and asserting no throw, `ok: false`, a surfaced stat error, and no file moves.
- [x] Updated `electron/obsidianCompanion.ts` so inbox root `statSync` errors are caught and returned through `errors` before `_processed` / `_failed` setup or file import begins.
- [x] Preserved existing missing-path and file-backed-inbox behavior.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion Mobile Inbox Root Stat Structured Error Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because an inbox-root `statSync` failure escaped from `importMobileInbox(...)` |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 213: Companion Mobile Inbox Destination Race No-Overwrite Guard
- [x] Reproduced a mobile inbox destination race: if `_processed/note.txt` appears after uniqueness checking but before the move, `fs.renameSync(...)` can overwrite that existing destination.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by making `existsSync(...)` stale for the processed collision path; import should preserve the existing processed file and move the new capture to the next unique destination.
- [x] Updated `electron/obsidianCompanion.ts` with reserved-destination moving: destination names are opened with exclusive `wx` before rename, and `EEXIST` retries with the next unique path.
- [x] Reused the same no-overwrite move path for `_processed` and fallback `_failed` moves.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox Destination Race No-Overwrite Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because the raced `_processed/note.txt` destination was overwritten |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 212 |
| `npm run build` | deferred under fast batch mode; last run Phase 212 |

### Phase 214: Companion Mobile Inbox Readdir Structured Error Guard
- [x] Reproduced a mobile inbox enumeration failure path: after root and processing-directory validation, `importMobileInbox(...)` still called `fs.readdirSync(inboxPath, { withFileTypes: true })` directly.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by patching `fs.readdirSync` for the inbox root and asserting no throw, `ok: false`, a surfaced enumeration error, and no file moves.
- [x] Updated `electron/obsidianCompanion.ts` so inbox enumeration errors are caught and returned through `errors` before any per-file read or move begins.
- [x] Preserved existing valid-file filtering and directory-ignore behavior.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox Readdir Structured Error Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because an inbox `readdirSync(...)` failure escaped from `importMobileInbox(...)` |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 212 |
| `npm run build` | deferred under fast batch mode; last run Phase 212 |

### Phase 215: Companion Mobile Inbox Reservation Cleanup Error Preservation Guard
- [x] Reproduced a reserved-destination move failure reporting gap: when `moveToUniqueDestination(...)` reserved a destination, then `fs.renameSync(...)` failed, and cleanup of the reserved placeholder also failed, the cleanup error replaced the original move failure.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by simulating a `_processed` move failure plus a `_processed` reservation cleanup failure.
- [x] Updated `electron/obsidianCompanion.ts` so cleanup failures are appended to the original move error message instead of hiding it.
- [x] Preserved fallback routing to `_failed` and the no-success-item invariant from earlier mobile inbox phases.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion Mobile Inbox Reservation Cleanup Error Preservation Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because only the reservation cleanup failure surfaced, hiding the original processed move failure |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 216: Companion Mobile Inbox Reservation Close Cleanup Guard
- [x] Reproduced a reserved-destination setup leak: `reserveFilePath(...)` opened the destination placeholder with exclusive `wx`, but if `fs.closeSync(...)` failed, the placeholder could remain in `_processed` and block/contradict later fallback routing.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` by simulating a `_processed` reservation close failure after the placeholder file is created.
- [x] Updated `electron/obsidianCompanion.ts` so reservation close failures clean up the just-created placeholder and preserve cleanup failure details if cleanup also fails.
- [x] Preserved the structured importer failure shape, no-success-item invariant, and fallback routing to `_failed`.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox Reservation Close Cleanup Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because the reserved `_processed/note.txt` placeholder remained after a simulated reservation close failure |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 215 |
| `npm run build` | deferred under fast batch mode; last run Phase 215 |

### Phase 217: AI Review Daily Runner SourceChars Structured Failure Guard
- [x] Reproduced a daily-runner race/error gap: after `inspectDailyAiContent(...)` successfully read the daily note, the later `sourceChars = fs.readFileSync(filePath, 'utf-8').length` read could still fail and throw out of `runReviewForDate(...)`.
- [x] Added focused RED runtime coverage in `scripts/verify-electron-ai-review-daily-runner-module.ts` by simulating a second daily-note read failure during source character counting.
- [x] Updated `electron/aiReviewDailyRunner.ts` so source character counting failures return a structured `{ ok: false }` result with a failed `prepareMaterials` diagnostic instead of throwing.
- [x] Preserved earlier inspection failures, missing-file handling, LLM gating, prompt/build/write diagnostics, and successful sourceChars diagnostics.
- [x] Verified the fix with focused daily-runner checks and adjacent daily run/inspect IPC checks.
- **Status:** complete

## AI Review Daily Runner SourceChars Structured Failure Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-daily-runner-module` before fix | failed as RED because source character counting read failures threw out of `runReviewForDate(...)` |
| `npm run verify:electron-ai-review-daily-runner-module` | passed |
| `npm run verify:electron-ai-review-daily-run-inspect-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 215 |
| `npm run build` | deferred under fast batch mode; last run Phase 215 |

### Phase 218: AI Review Atomic Replace Temp Cleanup Guard
- [x] Reproduced an atomic-write cleanup gap with focused coverage: `atomicReplace(...)` wrote a same-directory tmp file and then attempted `fs.renameSync(tmp, filePath)`, but failure paths did not guarantee tmp cleanup.
- [x] Added RED coverage in `scripts/verify-atomic-write.ts` requiring `atomicReplace(...)` to clean up the temporary file when replacement fails.
- [x] Updated `electron/aiReview/atomicWrite.ts` so `atomicReplace(...)` tracks the tmp path and removes it in the catch path before returning the structured failure.
- [x] Preserved conflict detection, missing-file-with-stamp refusal, non-file read stamps, and successful atomic replacement behavior.
- [x] Verified the fix with focused atomic-write checks, adjacent export-report checks, TypeScript, and production build.
- **Status:** complete

## AI Review Atomic Replace Temp Cleanup Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:atomic-write` before fix | failed as RED because `atomicReplace(...)` did not prove tmp cleanup on replacement failure |
| `npm run verify:atomic-write` | passed |
| `npm run verify:export-reports` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 219: Obsidian Template Picker File-Only Guard
- [x] Reproduced a template-picker path-shape gap with focused coverage: `obsidianTemplate:pickTemplateFile` trusted the selected path and called `fs.readFileSync(...)` directly.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring the selected template path to pass `fs.statSync(filePath).isFile()` before reading.
- [x] Updated `electron/obsidianIpc.ts` so non-file selected template paths return a structured `{ ok: false, error }` before any file read.
- [x] Preserved dialog cancellation, empty-file handling, template text return, daily-note open guard, and Obsidian IPC module wiring.
- [x] Verified the fix with focused Obsidian IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Obsidian Template Picker File-Only Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because the template picker read selected paths without proving they are files |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 218 |
| `npm run build` | deferred under fast batch mode; last run Phase 218 |

### Phase 220: AI Review Atomic Replace Cleanup Error Preservation Guard
- [x] Reproduced an atomic-write diagnostic gap with focused coverage: after Phase 218, tmp cleanup ran on replacement failure, but cleanup failure could mask the original write/rename error.
- [x] Added RED coverage in `scripts/verify-atomic-write.ts` requiring atomic replacement failures to preserve original errors when temporary-file cleanup also fails.
- [x] Updated `electron/aiReview/atomicWrite.ts` so cleanup failures are appended as `temporary cleanup failed: ...` instead of replacing the primary error.
- [x] Preserved successful atomic replacement, conflict refusal, deleted-file refusal, non-file read stamps, and tmp cleanup behavior.
- [x] Verified the fix with focused atomic-write checks and adjacent export-report checks.
- **Status:** complete

## AI Review Atomic Replace Cleanup Error Preservation Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:atomic-write` before fix | failed as RED because cleanup-failure preservation was absent |
| `npm run verify:atomic-write` | passed |
| `npm run verify:export-reports` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 218 |
| `npm run build` | deferred under fast batch mode; last run Phase 218 |

### Phase 221: Electron Vault Path Store Type Guard
- [x] Reproduced a malformed-store boundary gap: `getVaultPath()` returned whatever `store.get('obsidianVaultPath')` produced, so a non-string stored value could become the active vault path and reach filesystem checks.
- [x] Added focused RED coverage in `scripts/verify-electron-app-state-accessors-module.ts` requiring malformed/non-string stored Obsidian paths not to be returned as active vault paths.
- [x] Updated `electron/appStateAccessors.ts` so `getVaultPath()` accepts only string stored values and otherwise falls back to the development default or empty path.
- [x] Preserved file-backed vault rejection, missing vault messaging, development default vault behavior, and accessor module wiring.
- [x] Verified the fix with focused app-state accessor checks and adjacent Electron main module checks.
- **Status:** complete

## Electron Vault Path Store Type Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before fix | failed as RED because a non-string stored vault value was returned as the active vault path |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-main-modules` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 218 |
| `npm run build` | deferred under fast batch mode; last run Phase 218 |

### Phase 222: Companion Settings Store Normalization Guard
- [x] Reproduced a malformed-store boundary gap: `getCompanionSettings()` returned any object from `store.get('obsidianCompanionSettings')` as `CompanionSettings`, so malformed persisted fields could reach UI, IPC, and sync planning.
- [x] Added focused RED coverage in `scripts/verify-electron-app-state-accessors-module.ts` requiring malformed Companion settings fields to fall back to valid default shapes.
- [x] Updated `electron/appStateAccessors.ts` with local Companion settings normalization for string fields, sync mode, boolean flags, and array-backed rules/templates.
- [x] Preserved default Companion settings, vault-path fallback, app-state accessor wiring, and Companion IPC behavior.
- [x] Verified the fix with focused app-state accessor checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion Settings Store Normalization Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before fix | failed as RED because malformed Companion settings fields were returned unchanged |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 223: Companion Settings Setter Normalization Guard
- [x] Reproduced a Companion settings write-boundary gap: `setCompanionSettings(...)` persisted IPC/input values directly, so malformed settings could be written into Electron Store even though reads are now normalized.
- [x] Added focused RED coverage in `scripts/verify-electron-app-state-accessors-module.ts` requiring malformed Companion settings passed to the setter to be persisted in normalized/default-safe shape.
- [x] Updated `electron/appStateAccessors.ts` so `setCompanionSettings(...)` reuses `normalizeCompanionSettings(...)` before writing to store.
- [x] Preserved existing Companion settings IPC wiring and read-time normalization behavior.
- [x] Verified the fix with focused app-state accessor checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Settings Setter Normalization Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before fix | failed as RED because malformed setter input was persisted unchanged |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 222 |
| `npm run build` | deferred under fast batch mode; last run Phase 222 |

### Phase 224: Companion Settings Rules/Templates Element Guard
- [x] Reproduced a Companion settings array-shape gap: `normalizeCompanionSettings(...)` accepted any array for `rules` and `templates`, so malformed rule/template elements could still reach Companion planning.
- [x] Added focused RED coverage in `scripts/verify-electron-app-state-accessors-module.ts` requiring malformed rule/template array elements to fall back to valid default objects.
- [x] Updated `electron/appStateAccessors.ts` with element-level type guards for Companion rules and templates.
- [x] Preserved valid custom rule/template arrays, read/write normalization, and Companion IPC behavior.
- [x] Verified the fix with focused app-state accessor checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion Settings Rules/Templates Element Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before fix | failed as RED because malformed rule/template array elements were accepted |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 225: Companion Rule Condition String Array Guard
- [x] Reproduced a Companion rule condition shape gap: rule objects could pass element-level validation while `when.tagsAny` / `tagsAll` / `containsAny` contained non-string elements that would later break `matchesRule(...)`.
- [x] Added focused RED coverage in `scripts/verify-electron-app-state-accessors-module.ts` requiring malformed condition string arrays to fall back before reaching Companion rule matching.
- [x] Updated `electron/appStateAccessors.ts` so Companion rule validation checks optional enum fields and string-array condition fields element-by-element.
- [x] Preserved valid custom rules/templates, read/write Companion settings normalization, and Companion IPC behavior.
- [x] Verified the fix with focused app-state accessor checks, adjacent Companion IPC checks, and TypeScript.
- **Status:** complete

## Companion Rule Condition String Array Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-app-state-accessors-module` before fix | failed as RED because malformed `tagsAny` elements were accepted |
| `npm run verify:electron-app-state-accessors-module` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | deferred under fast batch mode; last run Phase 224 |

### Phase 226: Companion BuildSyncPlan Runtime Settings Collection Guard
- [x] Reproduced a Companion IPC/planner runtime boundary gap: `buildSyncPlan(...)` assumed `settings.rules` and `settings.templates` were arrays, so malformed renderer/IPC input could throw before returning a structured plan result.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` requiring malformed runtime `rules/templates` collections to return a structured failure instead of throwing.
- [x] Updated `electron/obsidianCompanion.ts` so `buildSyncPlan(...)` validates runtime settings collection shape before constructing maps/sorted rules.
- [x] Preserved valid planning behavior, store-side Companion settings normalization, and Companion IPC wiring.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion BuildSyncPlan Runtime Settings Collection Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because malformed runtime `rules/templates` collections threw out of `buildSyncPlan(...)` |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last run Phase 225 |
| `npm run build` | deferred under fast batch mode; last run Phase 224 |
### Phase 227: Companion BuildSyncPlan Runtime Rule/Template Element Guard
- [x] Reproduced a runtime Companion planner boundary gap: renderer/IPC settings could provide array-shaped `rules` and `templates` whose elements were malformed, so `buildSyncPlan(...)` could still throw while reading rule/template fields.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` requiring malformed runtime rule/template elements to return a structured failed `SyncPlan` instead of throwing.
- [x] Updated `electron/obsidianCompanion.ts` with runtime element guards for Companion rules and templates at the `buildSyncPlan(...)` entry point.
- [x] Preserved valid planning behavior, store-side Companion settings normalization, and Companion IPC wiring.
- [x] Verified the fix with focused Companion checks, adjacent Companion IPC checks, TypeScript, and production build.
- **Status:** complete

## Companion BuildSyncPlan Runtime Rule/Template Element Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because malformed runtime rule/template elements threw out of `buildSyncPlan(...)` |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
### Phase 228: Companion BuildSyncPlan Runtime Capture Item Guard
- [x] Reproduced a runtime Companion planner boundary gap: renderer/IPC input could pass array-shaped but malformed capture items, such as non-string `tags`, and get unclear downstream template/matching errors.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` requiring malformed runtime capture items to return a structured failed `SyncPlan` instead of throwing or leaking low-level string-method errors.
- [x] Updated `electron/obsidianCompanion.ts` with a runtime `CaptureItem` guard at the `buildSyncPlan(...)` entry point.
- [x] Preserved valid planning behavior, runtime settings guards, and Companion IPC wiring.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion BuildSyncPlan Runtime Capture Item Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because malformed runtime capture items produced non-capture/item planner errors |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 227 |
| `npm run build` | deferred under fast batch mode; last passed Phase 227 |
### Phase 229: Obsidian Sync Runtime Tasks Array Guard
- [x] Reproduced an Obsidian sync/preview runtime boundary gap: `syncTasksToObsidian(...)` and `previewTasksToObsidian(...)` assumed renderer-provided `tasks` / `beforeTasks` were arrays before entering their filesystem/preview try-catch paths.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` requiring non-array runtime task input to return structured failures instead of throwing.
- [x] Updated `electron/obsidianSync.ts` so sync and preview reject non-array `tasks` / `beforeTasks` with clear task-array errors.
- [x] Preserved valid sync behavior, directory-backed daily-note handling, optional blog-draft skip behavior, and cross-date preview behavior.
- [x] Verified the fix with focused settings-sync checks and adjacent Obsidian sync module checks.
- **Status:** complete

## Obsidian Sync Runtime Tasks Array Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because non-array runtime `tasks` threw before structured sync/preview failures |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 227 |
| `npm run build` | deferred under fast batch mode; last passed Phase 227 |
### Phase 230: Obsidian Sync Runtime Task Element Guard
- [x] Reproduced an Obsidian sync/preview runtime boundary gap: `tasks` could be an array while containing malformed task entries, such as non-array `subtasks`, and still throw during affected-date derivation.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` requiring malformed runtime task entries to return structured sync/preview failures instead of throwing.
- [x] Updated `electron/obsidianSync.ts` with recursive runtime task-entry validation for core task fields, nested subtasks, and completion review arrays.
- [x] Preserved valid sync behavior, cross-date affected-note handling, optional blog-draft behavior, and Obsidian sync module boundaries.
- [x] Verified the fix with focused settings-sync checks, adjacent Obsidian sync module checks, TypeScript, and production build.
- **Status:** complete

## Obsidian Sync Runtime Task Element Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because malformed array task entries threw before structured sync/preview failures |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
### Phase 231: Obsidian Sync Runtime Daily Section Scalar Guard
- [x] Reproduced an Obsidian sync/preview runtime boundary gap: `dailyWork` / `inspiration` could be non-string runtime values and preview could still emit file plans instead of failing closed.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` requiring malformed daily section inputs to return structured failures with no file writes or preview files.
- [x] Updated `electron/obsidianSync.ts` so sync and preview require `dailyWork` and `inspiration` to be strings before date derivation, preview generation, or filesystem writes.
- [x] Preserved valid sync behavior, task payload guards, and Obsidian sync module boundaries.
- [x] Verified the fix with focused settings-sync checks and adjacent Obsidian sync module checks.
- **Status:** complete

## Obsidian Sync Runtime Daily Section Scalar Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because malformed runtime `inspiration` still emitted preview files |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 230 |
| `npm run build` | deferred under fast batch mode; last passed Phase 230 |
### Phase 232: Obsidian Sync Runtime Date Scalar Guard
- [x] Reproduced an Obsidian sync/preview runtime boundary gap: non-string selected date input could be treated as valid and reach path/template expansion.
- [x] Added focused RED coverage in `scripts/verify-settings-sync.ts` requiring malformed runtime date input to return structured failures with no writes or preview files.
- [x] Updated `electron/obsidianSync.ts` so sync and preview require optional `date` to be a string before date-key/path/template derivation.
- [x] Preserved valid sync behavior, task payload guards, daily section scalar guards, and Obsidian sync module boundaries.
- [x] Verified the fix with focused settings-sync checks and adjacent Obsidian sync module checks.
- **Status:** complete

## Obsidian Sync Runtime Date Scalar Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:settings-sync` before fix | failed as RED because non-string runtime `date` returned sync success instead of structured failure |
| `npm run verify:settings-sync` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 230 |
| `npm run build` | deferred under fast batch mode; last passed Phase 230 |
### Phase 233: Obsidian OpenDailyNote Runtime Date Guard
- [x] Reproduced an Obsidian IPC runtime boundary gap: `obsidian:openDailyNote` accepted non-string selected-date input before deriving the daily note path.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring `openDailyNote` to reject non-string runtime dates before `getDateKey(...)` / `getDailyFilePath(...)`.
- [x] Updated `electron/obsidianIpc.ts` so `obsidian:openDailyNote` returns a structured `{ ok: false, reason }` for non-string date input.
- [x] Preserved vault-status handling, file-only daily-note guard, daily-note bootstrap, overview refresh, and shell open behavior.
- [x] Verified the fix with focused Obsidian IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Obsidian OpenDailyNote Runtime Date Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because `openDailyNote` lacked a non-string date guard before path derivation |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 230 |
| `npm run build` | deferred under fast batch mode; last passed Phase 230 |
### Phase 234: Obsidian IPC Daily Section Forwarding Guard
- [x] Reproduced an Obsidian IPC forwarding gap: `obsidian:syncTasks` / `obsidian:previewTasks` used `dailyWork || ''` and `inspiration || ''`, which could hide falsy malformed runtime values before the Phase 231 scalar validators saw them.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring IPC forwarding to default only `undefined` daily section values.
- [x] Updated `electron/obsidianIpc.ts` so omitted values still default to empty strings, while falsy malformed values are preserved for downstream runtime validation.
- [x] Preserved task-sync delegation, preview delegation, open-daily-note guards, and main-window bootstrap wiring.
- [x] Verified the fix with focused Obsidian IPC checks, adjacent main-window bootstrap checks, TypeScript, and production build.
- **Status:** complete

## Obsidian IPC Daily Section Forwarding Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because IPC used `dailyWork || ''` / `inspiration || ''` |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
### Phase 235: Companion IPC Items Forwarding Guard
- [x] Reproduced a Companion IPC forwarding gap: `companion:previewSync` / `companion:writeSync` used `items || []`, which could hide falsy malformed runtime item payloads before the Phase 228 `buildSyncPlan(...)` item validator saw them.
- [x] Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring Companion IPC forwarding to default only omitted `items` values.
- [x] Updated `electron/companionIpc.ts` so omitted `items` still default to `[]`, while falsy malformed values are preserved for `buildSyncPlan(...)` runtime validation.
- [x] Preserved Companion settings get/set IPC, preview/write plan construction, mobile inbox import wiring, and main-window bootstrap wiring.
- [x] Verified the fix with focused Companion IPC checks and adjacent Companion planner checks.
- **Status:** complete

## Companion IPC Items Forwarding Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-companion-ipc-module` before fix | failed as RED because IPC used `items || []` |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run verify:companion` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 234 |
| `npm run build` | deferred under fast batch mode; last passed Phase 234 |
### Phase 236: Companion Mobile Inbox Runtime Path Guard
- [x] Reproduced a Companion mobile inbox runtime boundary gap: non-string `inboxPath` values could reach `fs.existsSync(...)` before structured validation.
- [x] Added focused RED coverage in `electron/obsidianCompanion.verify.ts` requiring malformed runtime inbox paths not to touch filesystem APIs and to return structured failures.
- [x] Updated `electron/obsidianCompanion.ts` so `importMobileInbox(...)` rejects non-string runtime inbox paths before filesystem checks.
- [x] Preserved missing-path handling, file-backed inbox handling, processing directory setup, per-file import behavior, and Companion IPC wiring.
- [x] Verified the fix with focused Companion checks and adjacent Companion IPC checks.
- **Status:** complete

## Companion Mobile Inbox Runtime Path Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:companion` before fix | failed as RED because non-string runtime inbox paths reached `fs.existsSync(...)` |
| `npm run verify:companion` | passed |
| `npm run verify:electron-companion-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 234 |
| `npm run build` | deferred under fast batch mode; last passed Phase 234 |
### Phase 237: Obsidian Template Recognition Input Validation Order Guard
- [x] Reproduced an Obsidian template-recognition IPC boundary gap: `obsidianTemplate:recognize` checked AI settings/API key before validating `rawTemplate`, so empty or malformed input could be masked by AI configuration errors.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring `validateObsidianTemplateRecognitionInput(rawTemplate)` to run before AI settings/key checks.
- [x] Updated `electron/obsidianIpc.ts` so template input validation happens before `getAiReviewSettings()` and LLM prompt construction.
- [x] Preserved AI enablement/API-key gating, LLM invocation, recognized draft parsing, and Obsidian IPC wiring.
- [x] Verified the fix with focused Obsidian IPC checks, adjacent template-recognition checks, TypeScript, and production build.
- **Status:** complete

## Obsidian Template Recognition Input Validation Order Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because input validation occurred after AI settings/key checks |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:obsidian-template-recognition` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |
### Phase 238: AI Review Template Recognition Input Validation Order Guard
- [x] Reproduced an AI Review template/tools IPC boundary gap: `aiReview:recognizeTemplate` and `aiReview:recognizeReportTemplate` checked AI settings/API key before validating `rawTemplate`, so empty or malformed template input could be masked by AI configuration errors.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring both recognition handlers to validate `rawTemplate` before AI settings/key checks.
- [x] Updated `electron/aiReviewTemplateToolsIpc.ts` so review-template and report-template input validation happens before `getAiReviewSettings()` and LLM prompt construction.
- [x] Preserved fallback sections, AI enablement/API-key gating, LLM invocation, recognized section/prompt parsing, and parent AI Review IPC delegation.
- [x] Verified the fix with focused AI Review template/tools IPC checks and adjacent AI Review IPC checks.
- **Status:** complete

## AI Review Template Recognition Input Validation Order Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because recognition input validation occurred after AI settings/key checks |
| `npm run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 237 |
| `npm run build` | deferred under fast batch mode; last passed Phase 237 |
### Phase 239: AI Review Template File Picker File-Only Guard
- [x] Reproduced an AI Review template-file picker filesystem boundary gap: selected paths were read with `fs.readFileSync(filePath)` without first proving the selected path is a real file.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring `fs.statSync(filePath).isFile()` before `fs.readFileSync(filePath)`.
- [x] Updated `electron/aiReviewTemplateToolsIpc.ts` so non-file selected template paths return a structured failure before reading.
- [x] Preserved dialog cancellation, supported template parsing, docx extraction wiring, and parent AI Review IPC delegation.
- [x] Verified the fix with focused AI Review template/tools IPC checks and adjacent AI Review IPC checks.
- **Status:** complete

## AI Review Template File Picker File-Only Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because selected template paths were read without `statSync(...).isFile()` |
| `npm run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 237 |
| `npm run build` | deferred under fast batch mode; last passed Phase 237 |

### Phase 240: AI Review Model List Runtime Provider Narrowing
- [x] Reproduced an AI Review model-list IPC runtime boundary gap: `cfg.provider` was forwarded from runtime IPC input with only a TypeScript annotation.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring explicit provider narrowing before `listModels(...)`.
- [x] Updated `electron/aiReviewTemplateToolsIpc.ts` so only `openai`, `anthropic`, `gemini`, or `auto` reach `listModels(...)`; malformed runtime values fall back to `auto`.
- [x] Preserved base URL/API-key scalar defaults, model-list timeout, and parent AI Review IPC delegation.
- [x] Verified the fix with focused AI Review template/tools IPC checks and adjacent AI Review IPC checks.
- **Status:** complete

## AI Review Model List Runtime Provider Narrowing Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because `cfg?.provider ?? 'auto'` could forward malformed runtime provider values |
| `npm run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 237 |
| `npm run build` | deferred under fast batch mode; last passed Phase 237 |

### Phase 241: AI Review Template Recognition Malformed Section Guard
- [x] Reproduced an AI Review template-recognition parser gap: LLM JSON could provide an array-shaped `sections` value containing malformed entries such as `null`, causing `.map(...)` to throw while reading `markerKey`.
- [x] Added focused RED coverage in `scripts/verify-recognize-template.ts` requiring malformed section entries to fall back instead of throwing.
- [x] Updated `shared/aiReview/recognizeTemplate.ts` so parsed section entries must be non-array objects before mapping.
- [x] Preserved valid JSON parsing, fenced JSON cleanup, fallback behavior, and confidence handling.
- [x] Verified the fix with focused recognition checks, adjacent AI Review template/tools IPC checks, TypeScript, and production build.
- **Status:** complete

## AI Review Template Recognition Malformed Section Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:recognize-template` before fix | failed as RED because `sections:[null]` threw while reading `markerKey` |
| `npm run verify:recognize-template` | passed |
| `npm run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 242: AI Review Template Picker Runtime Path Type Guard
- [x] Reproduced an AI Review template-file picker runtime boundary gap: a malformed non-string selected path could reach `path.basename(filePath)` before structured picker error handling.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring a runtime string guard before file-name derivation.
- [x] Updated `electron/aiReviewTemplateToolsIpc.ts` so malformed selected paths return a structured string-path failure before `path.basename(...)`, `statSync(...)`, or `readFileSync(...)`.
- [x] Preserved dialog cancellation, file-only guard, supported template parsing, docx extraction wiring, and parent AI Review IPC delegation.
- [x] Verified the fix with focused AI Review template/tools IPC checks and adjacent AI Review IPC checks.
- **Status:** complete

## AI Review Template Picker Runtime Path Type Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because `path.basename(filePath)` occurred before a runtime string guard |
| `npm run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm run verify:electron-ai-review-ipc-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 241 |
| `npm run build` | deferred under fast batch mode; last passed Phase 241 |

### Phase 243: Obsidian Template Picker Runtime Path Type Guard
- [x] Reproduced an Obsidian template-file picker runtime boundary gap: a malformed non-string selected path could reach `path.basename(filePath)` before structured picker error handling.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring a runtime string guard before file-name derivation.
- [x] Updated `electron/obsidianIpc.ts` so malformed selected template paths return a structured string-path failure before `path.basename(...)`, `statSync(...)`, or `readFileSync(...)`.
- [x] Preserved dialog cancellation, file-only guard, markdown template parsing, and main-window bootstrap delegation.
- [x] Verified the fix with focused Obsidian IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Obsidian Template Picker Runtime Path Type Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because `path.basename(filePath)` occurred before a runtime string guard |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 241 |
| `npm run build` | deferred under fast batch mode; last passed Phase 241 |

### Phase 244: Obsidian ChoosePath Runtime Path Type Guard
- [x] Reproduced an Obsidian choose-path IPC boundary gap: malformed non-string dialog path values could be persisted directly with `store.set(obsidianPathKey, result.filePaths[0])`.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring selected paths to be narrowed before store writes.
- [x] Updated `electron/obsidianIpc.ts` so `obsidian:choosePath` persists and returns only string selected paths; malformed selected paths fall back to the current/default vault path without writing.
- [x] Preserved dialog cancellation behavior, directory-picker options, and main-window bootstrap delegation.
- [x] Verified the fix with focused Obsidian IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Obsidian ChoosePath Runtime Path Type Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because raw `result.filePaths[0]` was written to store |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 241 |
| `npm run build` | deferred under fast batch mode; last passed Phase 241 |

### Phase 245: Obsidian Stored Path Return Normalization Guard
- [x] Reproduced an Obsidian path IPC boundary gap: `obsidian:getPath` and choosePath fallback branches could return truthy malformed stored path values directly via `store.get(obsidianPathKey) || getDefaultVaultPath()`.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring stored path reads to normalize to string values or default vault paths.
- [x] Updated `electron/obsidianIpc.ts` with `getStoredObsidianPath()` so malformed stored values are not returned to renderer path consumers.
- [x] Preserved valid stored paths, default vault fallback, choosePath cancellation behavior, and main-window bootstrap delegation.
- [x] Verified the fix with focused Obsidian IPC checks, adjacent main-window bootstrap checks, TypeScript, and production build.
- **Status:** complete

## Obsidian Stored Path Return Normalization Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-obsidian-ipc-module` before fix | failed as RED because `store.get(obsidianPathKey) || getDefaultVaultPath()` could return malformed truthy values |
| `npm run verify:electron-obsidian-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 246: Main Window Startup Stored Vault Path Seeding Guard
- [x] Reproduced a main-window startup store boundary gap: a truthy malformed stored Obsidian path could prevent default vault-path seeding.
- [x] Added focused RED coverage in `scripts/verify-electron-main-window-startup-module.ts` requiring startup seeding to treat non-string stored vault paths as unset.
- [x] Updated `electron/mainWindowStartup.ts` so only non-empty string stored vault paths suppress default vault-path seeding.
- [x] Preserved default vault-path seeding, window creation order, initial mode application, diagnostics, and bootstrap setup.
- [x] Verified the fix with focused main-window startup checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Main Window Startup Stored Vault Path Seeding Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-startup-module` before fix | failed as RED because `!store.get(obsidianPathKey)` treated truthy malformed values as valid seeded paths |
| `npm run verify:electron-main-window-startup-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 245 |
| `npm run build` | deferred under fast batch mode; last passed Phase 245 |

### Phase 247: Main Window Persistence Raw Store Normalization Guard
- [x] Reproduced a main-window persistence boundary smell: persisted window-state reads were cast to `WindowState` before normalization, hiding that store values are runtime `unknown`.
- [x] Added focused RED coverage in `scripts/verify-electron-main-window-persistence-module.ts` requiring raw persisted values to flow through `normalizeRestoredWindowState(...)` without `WindowState` casts.
- [x] Updated `electron/mainWindowPersistence.ts` so both initial bounds and compact-size preservation normalize raw store values directly.
- [x] Preserved initial bounds fallback, display work-area lookup, compact size preservation, debounce behavior, and stored window-mode resolution.
- [x] Verified the fix with focused main-window persistence checks and adjacent main-window startup checks.
- **Status:** complete

## Main Window Persistence Raw Store Normalization Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-main-window-persistence-module` before fix | failed as RED because persisted window-state reads used `as WindowState` casts before normalization |
| `npm run verify:electron-main-window-persistence-module` | passed |
| `npm run verify:electron-main-window-startup-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 245 |
| `npm run build` | deferred under fast batch mode; last passed Phase 245 |

### Phase 248: Window IPC Boolean Store Strictness Guard
- [x] Reproduced a window IPC boolean store boundary gap: `Boolean(store.get(...))` could treat truthy malformed persisted values such as strings or objects as enabled.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring compact-mode and autostart reads to use strict `=== true`.
- [x] Updated `electron/windowIpc.ts` so only a persisted boolean `true` enables compact mode or autostart reads.
- [x] Preserved compact/autostart setter wiring, login-item behavior, window IPC registration, and main-window bootstrap delegation.
- [x] Verified the fix with focused window IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Window IPC Boolean Store Strictness Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-window-ipc-module` before fix | failed as RED because compact/autostart reads used `Boolean(store.get(...))` |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 245 |
| `npm run build` | deferred under fast batch mode; last passed Phase 245 |

### Phase 249: Window IPC Boolean Setter Normalization Guard
- [x] Reproduced a window IPC boolean setter boundary gap: compact-mode and autostart setters persisted raw runtime IPC values and autostart forwarded raw values to `setLoginItemSettings(...)`.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring setters to normalize IPC values with strict `=== true` before persistence, login-item updates, and return values.
- [x] Updated `electron/windowIpc.ts` so malformed runtime boolean values are persisted/returned as `false`, and only strict `true` enables compact mode or autostart.
- [x] Preserved getter strictness, login-item path behavior, window IPC registration, and main-window bootstrap delegation.
- [x] Verified the fix with focused window IPC checks, adjacent main-window bootstrap checks, TypeScript, and production build.
- **Status:** complete

## Window IPC Boolean Setter Normalization Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-window-ipc-module` before fix | failed as RED because compact/autostart setters persisted raw runtime IPC values |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 250: Window Settings Mode Runtime Boolean Guard
- [x] Reproduced a window settings-mode IPC boundary gap: `window:setSettingsMode` used broad truthiness, so malformed truthy runtime values could open settings mode.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring settings mode to open only for strict `true`.
- [x] Updated `electron/windowIpc.ts` so `setSettingsMode` derives `shouldOpenSettings = open === true` before branching.
- [x] Preserved settings-mode sizing, restore-width behavior, compact-size persistence bypass, restore behavior, window IPC registration, and main-window bootstrap delegation.
- [x] Verified the fix with focused window IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Window Settings Mode Runtime Boolean Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-window-ipc-module` before fix | failed as RED because `setSettingsMode` used `if (open)` broad truthiness |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 249 |
| `npm run build` | deferred under fast batch mode; last passed Phase 249 |

### Phase 251: Window Lock Position Runtime Boolean Guard
- [x] Reproduced a window lock-position IPC boundary gap: `window:setLockWindowPosition` used `Boolean(locked)`, so malformed truthy runtime values could enable lock-position mode.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring lock-position writes to use strict `locked === true`.
- [x] Updated `electron/windowIpc.ts` so only strict `true` enables lock-position; malformed runtime values persist as false.
- [x] Preserved settings write normalization, z-order reapplication, return behavior, window IPC registration, and main-window bootstrap delegation.
- [x] Verified the fix with focused window IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Window Lock Position Runtime Boolean Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-window-ipc-module` before fix | failed as RED because lock-position setter used `Boolean(locked)` |
| `npm run verify:electron-window-ipc-module` | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 249 |
| `npm run build` | deferred under fast batch mode; last passed Phase 249 |

### Phase 252: Window Mode Runtime Input Narrowing Guard
- [x] Reproduced a window-mode IPC boundary gap: `window:setWindowMode` forwarded runtime `mode` directly to `setWindowMode(...)` based only on a TypeScript annotation.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring the shared `isWindowMode(...)` guard before calling the window-mode setter.
- [x] Updated `electron/windowIpc.ts` so malformed runtime mode values return the current mode without calling `setWindowMode(...)`.
- [x] Preserved valid window-mode switching, pinned-mode toggle behavior, window IPC registration, and main-window bootstrap delegation.
- [x] Verified the fix with focused window IPC checks and adjacent main-window bootstrap checks.
- **Status:** complete

## Window Mode Runtime Input Narrowing Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-window-ipc-module` before fix | failed as RED because `isWindowMode` was not imported/used before `setWindowMode(...)` |
| `npm run verify:electron-window-ipc-module` after product fix | initially failed because a verifier negative regex was too broad and matched the guarded setter path |
| `npm run verify:electron-window-ipc-module` after verifier calibration | passed |
| `npm run verify:electron-main-window-bootstrap-module` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 249 |
| `npm run build` | deferred under fast batch mode; last passed Phase 249 |

### Phase 253: Task Context Menu Resize Runtime Height Guard
- [x] Reproduced a task-context-menu resize IPC boundary gap: `Number(height) || defaultTaskMenuHeight` could coerce malformed runtime values such as strings or booleans into popup heights.
- [x] Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring resize to accept only finite numeric heights before clamping.
- [x] Updated `electron/taskContextMenuIpc.ts` so malformed runtime heights fall back to the default task-menu height, while valid finite numbers still clamp to `80..600`.
- [x] Preserved work-area y clamping, x/width preservation, popup-window dependency injection, action forwarding, and context-menu verification.
- [x] Verified the fix with focused task-context-menu IPC checks and adjacent context-menu checks.
- **Status:** complete

## Task Context Menu Resize Runtime Height Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-task-context-menu-ipc-module` before fix | failed as RED because resize used `Number(height) || defaultTaskMenuHeight` |
| `npm run verify:electron-task-context-menu-ipc-module` | passed |
| `npm run verify:context-menu` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 249 |
| `npm run build` | deferred under fast batch mode; last passed Phase 249 |

### Phase 254: Task Context Menu Open Payload Runtime Guard
- [x] Reproduced a task-context-menu open IPC boundary gap: malformed runtime payloads could reach popup creation with invalid `screenX` / `screenY` coordinates.
- [x] Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring a runtime `TaskMenuPayload` guard before `openTaskMenuWindow(...)`.
- [x] Updated `electron/taskContextMenuIpc.ts` so `taskContextMenu:open` accepts only object payloads with a task field, string tag arrays, and finite numeric screen coordinates.
- [x] Preserved valid popup creation, resize guard, action forwarding, and context-menu behavior.
- [x] Verified the fix with focused task-context-menu IPC checks and adjacent context-menu checks.
- **Status:** complete

## Task Context Menu Open Payload Runtime Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-task-context-menu-ipc-module` before fix | failed as RED because no runtime payload guard existed before `openTaskMenuWindow(payload)` |
| `npm run verify:electron-task-context-menu-ipc-module` after product fix | initially failed because verifier expected `value.screenX` while implementation used a safer `record.screenX` local |
| `npm run verify:electron-task-context-menu-ipc-module` after verifier calibration | passed |
| `npm run verify:context-menu` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 249 |
| `npm run build` | deferred under fast batch mode; last passed Phase 249 |

### Phase 255: Task Menu Window Coordinate Defense Guard
- [x] Reproduced a task-menu popup creation defense-in-depth gap: `createTaskMenuWindow(...)` clamped raw `payload.screenX` / `payload.screenY` directly, so future bypasses of the IPC guard could still feed malformed coordinates into BrowserWindow bounds.
- [x] Added focused RED coverage in `scripts/verify-context-menu.ts` requiring task-menu window creation to normalize coordinates to finite numbers before clamping.
- [x] Updated `electron/taskMenuWindow.ts` so malformed popup coordinates fall back to the screen center before the existing work-area clamp.
- [x] Preserved valid popup placement, work-area clamping, renderer loading, popup z-order, IPC payload guarding, and context-menu behavior.
- [x] Verified the fix with focused context-menu checks, adjacent task-context-menu IPC checks, TypeScript, and production build.
- **Status:** complete

## Task Menu Window Coordinate Defense Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:context-menu` before fix | failed as RED because popup creation clamped raw `payload.screenX` / `payload.screenY` directly |
| `npm run verify:context-menu` | passed |
| `npm run verify:electron-task-context-menu-ipc-module` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 256: Task Context Menu Renderer Payload Coordinate Guard
- [x] Reproduced a renderer task-context-menu payload builder defense gap: `createTaskContextMenuOpenPayload(...)` forwarded raw `screenX` / `screenY` into the IPC payload.
- [x] Added focused RED coverage in `scripts/verify-task-item-context-menu-helper.ts` requiring renderer payload coordinates to be finite-number normalized before IPC.
- [x] Updated `src/components/taskItem/taskItemContextMenu.ts` so non-finite coordinates fall back to `0` when building task-context-menu payloads.
- [x] Preserved theme capture, CSS numeric parsing, payload composition, TaskItem delegation, and context-menu behavior.
- [x] Verified the fix with focused TaskItem context-menu helper checks and adjacent context-menu checks.
- **Status:** complete

## Task Context Menu Renderer Payload Coordinate Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-context-menu-helper` before fix | failed as RED because no renderer coordinate normalizer existed |
| `npm run verify:task-item-context-menu-helper` | passed |
| `npm run verify:context-menu` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 255 |
| `npm run build` | deferred under fast batch mode; last passed Phase 255 |

### Phase 257: Task Context Menu Theme Numeric Clamp Guard
- [x] Reproduced a renderer task-context-menu theme numeric boundary gap: CSS numeric variables were only checked for finite values, so extreme opacity/blur/radius values could enter the popup payload.
- [x] Added focused RED coverage in `scripts/verify-task-item-context-menu-helper.ts` requiring parsed CSS numbers to be clamped to safe visual ranges.
- [x] Updated `src/components/taskItem/taskItemContextMenu.ts` so `parseCssNumber(...)` supports min/max bounds and menu opacity, blur strength, and card radius use bounded ranges.
- [x] Preserved theme capture, CSS fallback behavior, payload coordinate normalization, TaskItem delegation, and context-menu behavior.
- [x] Verified the fix with focused TaskItem context-menu helper checks and adjacent context-menu checks.
- **Status:** complete

## Task Context Menu Theme Numeric Clamp Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:task-item-context-menu-helper` before fix | failed as RED because CSS numbers were not clamped to safe bounds |
| `npm run verify:task-item-context-menu-helper` | passed |
| `npm run verify:context-menu` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 255 |
| `npm run build` | deferred under fast batch mode; last passed Phase 255 |

### Phase 258: Task Menu Action Runtime Payload Guard
- [x] Reproduced a renderer task-menu action parser boundary gap: malformed forwarded popup action payloads could be cast and then dereferenced as `{ taskId, updates }`, causing throws or bad task routing.
- [x] Added focused RED coverage in `scripts/verify-app-task-menu-actions-module.ts` requiring a runtime action-payload guard and a no-op parsed action for malformed payloads.
- [x] Updated `src/app/taskMenuActions.ts` so malformed runtime action payloads parse to `{ kind: 'noop' }` and apply as a no-op.
- [x] Preserved add-subtask/delete/edit/update routing, edit-request nonce behavior, listener registration, and context-menu behavior.
- [x] Verified the fix with focused task-menu action helper checks and adjacent context-menu checks.
- **Status:** complete

## Task Menu Action Runtime Payload Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:app-task-menu-actions-module` before fix | failed as RED because no `noop`/runtime payload guard existed |
| `npm run verify:app-task-menu-actions-module` | passed |
| `npm run verify:context-menu` | passed |
| `npm run typecheck` | deferred under fast batch mode; last passed Phase 255 |
| `npm run build` | deferred under fast batch mode; last passed Phase 255 |

### Phase 259: Task Context Menu Action Forwarding Payload Guard
- [x] Reproduced an Electron task-context-menu IPC forwarding boundary gap: malformed `taskContextMenu:action` payloads could be broadcast to the renderer even after the renderer-side parser guard.
- [x] Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring a runtime action-payload guard before `webContents.send(...)`.
- [x] Updated `electron/taskContextMenuIpc.ts` so malformed action payloads close the popup and return without broadcasting; valid non-empty `taskId` plus object-shaped `updates` still forwards.
- [x] Preserved open-payload guarding, resize guarding, close behavior, renderer no-op parsing, and context-menu behavior.
- [x] Verified the fix with focused task-context-menu IPC checks, adjacent context-menu checks, TypeScript, and production build.
- **Status:** complete

## Task Context Menu Action Forwarding Payload Guard Verification

| Command | Result |
|---------|--------|
| `npm run verify:electron-task-context-menu-ipc-module` before fix | failed as RED because malformed action payloads were still forwarded to `webContents.send(...)` |
| `npm run verify:electron-task-context-menu-ipc-module` | passed |
| `npm run verify:context-menu` | passed |
| `npm run typecheck` | passed |
| `npm run build` | passed |

### Phase 260: Task Menu Action Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed task-menu dispatch/listener payloads were trusted task objects even though runtime code treats them as `unknown`.
- [x] Added focused RED coverage in `scripts/verify-app-task-menu-actions-module.ts` requiring `dispatchTaskMenuAction` and `onTaskMenuAction` to expose unknown payload types in `src/vite-env.d.ts`.
- [x] Updated `src/vite-env.d.ts` so both task-menu APIs accept `unknown`, matching the preload/runtime guard boundary.
- [x] Preserved task-menu helper routing, renderer no-op parsing, and context-menu behavior.
- [x] Verified the fix with focused app task-menu helper checks, adjacent context-menu checks, TypeScript, and production build.
- **Status:** complete

## Task Menu Action Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-task-menu-actions-module` before fix | failed as RED because task-menu dispatch/listener types still claimed trusted task objects |
| `npm.cmd run verify:app-task-menu-actions-module` | passed |
| `npm run verify:context-menu` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 281: Obsidian Sync Runtime Payload Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: Obsidian sync and preview payloads still claimed task arrays and string fields even though the sync helpers validate every runtime input before date derivation, preview generation, or filesystem writes.
- [x] Added focused RED coverage requiring task lists, selected dates, daily work, inspiration, and before-task lists to expose `unknown` through preload, ambient types, IPC, registration injection, and sync helper entry points.
- [x] Updated `electron/obsidianIpc.ts`, `electron/obsidianSync.ts`, `electron/mainWindowBootstrap.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so those inputs use `unknown`.
- [x] Preserved omitted-text defaults and existing runtime validation for task arrays, task element shapes, daily text fields, and selected dates.
- [x] Verified the change with focused Obsidian IPC checks, adjacent sync-module checks, TypeScript, and a production build checkpoint.
- **Status:** complete

## Obsidian Sync Runtime Payload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-ipc-module` before fix | failed as RED because the injected sync dependency still typed runtime payloads as task arrays and strings |
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:electron-obsidian-sync-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 280: AI Review Date Input Runtime Hardening
- [x] Reproduced a runtime IPC boundary gap: AI Review report handlers pass date inputs into `getDateKey(...)`, which previously called `.slice()` on non-string input and could throw.
- [x] Added focused RED coverage requiring `getDateKey(...)` to accept runtime `unknown` values and fall back to today for malformed dates, while AI Review date IPC inputs expose `unknown`.
- [x] Updated `electron/taskDateHelpers.ts` so `getDateKey(date?: unknown)` accepts only non-empty strings and otherwise returns `getTodayDate()`.
- [x] Updated AI Review daily, weekly, monthly, external, and source-material date IPC/preload/ambient/type-injection contracts to expose runtime `unknown`.
- [x] Preserved valid date normalization, existing report workflows, source collection behavior, and daily regeneration force detection.
- [x] Verified the change with focused helper/AI Review IPC checks, related force detection, TypeScript, and a production build checkpoint.
- **Status:** complete

## AI Review Date Input Runtime Hardening Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-task-date-helpers-module` before fix | failed as RED because `getDateKey(...)` still accepted `string` and sliced it directly |
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` before fix | failed as RED because AI Review daily date IPC inputs still typed `date` as `string` |
| `npm.cmd run verify:electron-task-date-helpers-module` | passed |
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-external-report-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-report-ipc-source-collection-module` | passed |
| `npm.cmd run verify:electron-ai-review-ipc-module` | passed |
| `npm.cmd run verify:ai-regenerate-detection` | passed |
| `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 261: Tasks Changed Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed `onTasksChanged` listener payloads were trusted `Task[]` even though preload forwards `unknown` and `useTasks` normalizes runtime input.
- [x] Added focused RED coverage in `scripts/verify-task-hook-state.ts` requiring `onTasksChanged` callback payloads to expose `unknown` in `src/vite-env.d.ts`.
- [x] Updated `src/vite-env.d.ts` so `onTasksChanged` accepts `(tasks: unknown)`, matching `electron/preload.ts` and `normalizeIncomingTasks(...)`.
- [x] Preserved cross-window task sync behavior, task normalization, and task mutation behavior.
- [x] Verified the fix with focused task-hook checks, adjacent task-mutation checks, and TypeScript.
- **Status:** complete

## Tasks Changed Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-hook-state` before fix | failed as RED because `onTasksChanged` still advertised trusted `Task[]` payloads |
| `npm.cmd run verify:task-hook-state` | passed |
| `npm.cmd run verify:task-mutations` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 260 |

### Phase 262: Obsidian Sync Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed `syncTasksToObsidian(...)` and `previewTasksToObsidian(...)` accepted trusted `Task[]` inputs even though preload/runtime validation treats those arrays as runtime data.
- [x] Added focused coverage in `scripts/verify-settings-sync.ts` requiring Obsidian sync/preview task inputs and optional `beforeTasks` inputs to expose `unknown[]` at the preload boundary.
- [x] Updated `src/vite-env.d.ts` so Obsidian sync and preview task arrays use `unknown[]`, matching `electron/preload.ts` and the existing runtime normalization/validation path.
- [x] Preserved sync/preview behavior, daily note generation, and prior runtime validation coverage.
- [x] Verified the change with focused settings-sync checks and TypeScript.
- **Status:** complete

## Obsidian Sync Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:settings-sync` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 260 |

### Phase 263: Companion Sync Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed `previewCompanionSync(...)` and `writeCompanionSync(...)` accepted trusted `CompanionSettings` and `CaptureItem[]` inputs even though preload forwards those values as runtime data.
- [x] Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring Companion sync/preview ambient preload inputs to expose `unknown` settings and `unknown[]` items.
- [x] Updated `src/vite-env.d.ts` so Companion sync and write inputs use `unknown` / `unknown[]`, matching `electron/preload.ts` and existing Companion runtime validation paths.
- [x] Preserved Companion sync planning, writing, and mobile inbox behavior.
- [x] Verified the change with focused Companion IPC checks, adjacent Companion runtime checks, TypeScript, and production build.
- **Status:** complete

## Companion Sync Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-companion-ipc-module` before fix | failed as RED because Companion sync ambient types still claimed trusted settings/items |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:companion` | passed |

### Phase 288: Ambient Listener Payload Runtime Narrowing
- [x] Reproduced ambient listener overtrust: preload already forwarded mode/progress payloads loosely, but `src/vite-env.d.ts` still advertised trusted `WindowMode` and `AiReviewProgressEvent` callback payloads.
- [x] Added focused RED coverage in window IPC and AI run-diagnostics verifiers requiring ambient/preload listener payloads to remain `unknown` until renderer consumers narrow them.
- [x] Updated `electron/preload.ts` so `onWindowModeChanged(...)` forwards mode payloads as runtime `unknown`.
- [x] Updated `src/vite-env.d.ts` so ambient `onWindowModeChanged(...)` and `aiReview.onProgress(...)` expose callback payloads as `unknown`.
- [x] Added `isAiReviewProgressEvent(...)` in `shared/aiReview/runDiagnostics.ts` and used it in `SettingsPanel` before storing progress state.
- [x] Calibrated the AI diagnostics verifier to follow the extracted weekly/monthly report IPC modules after earlier modularization.
- [x] Verified the change with focused window IPC and diagnostics checks, adjacent progress/bootstrap checks, TypeScript, and a production build.
- **Status:** complete

## Ambient Listener Payload Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because preload still typed mode as `string` |
| `npm.cmd run verify:ai-run-diagnostics` before fix | failed as RED because ambient still claimed trusted progress events and the progress guard did not exist |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npm.cmd run verify:ai-progress-ui` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 289: Renderer Stored Task Payload Runtime Narrowing
- [x] Reproduced a renderer store/broadcast task payload gap: `loadTasks()` cast Electron Store values with `as Task[]`, and `normalizeIncomingTasks(...)` cast each array entry with `task as Task` before normalization.
- [x] Added focused RED coverage requiring malformed task entries to be dropped and requiring both store load and broadcast normalization to use a shared structural parser.
- [x] Added `isTaskLike(...)` and `parseStoredTasks(...)` in `src/hooks/taskTransforms.ts` for recursive task/subtask/completion-review validation.
- [x] Updated `normalizeIncomingTasks(...)` to parse first, then normalize only valid tasks.
- [x] Updated `loadTasks()` to return `parseStoredTasks(tasks)` instead of casting store values.
- [x] Verified the change with task hook/mutation/carryover checks, TypeScript, and a production build.
- **Status:** complete

## Renderer Stored Task Payload Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-hook-state` before fix | failed as RED because null/malformed entries were cast into `normalizeTask(...)` |
| `npm.cmd run verify:task-hook-state` | passed |
| `npm.cmd run verify:task-mutations` | passed |
| `npm.cmd run verify:task-carryover` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 290: Renderer Task UI Store Value Runtime Narrowing
- [x] Reproduced a renderer task-UI store boundary gap: `loadInitialTaskState()` cast selected date, active tab, carryover ledger, and retained review store values with `as`, while note maps and task list order only shallow-cast records.
- [x] Added focused RED coverage in `scripts/verify-task-persistence.ts` requiring runtime parsers for date keys, tabs, string records, carryover ledgers, task list order, and retained reviews, and requiring `useTasks` rollover to reuse the ledger parser.
- [x] Added exported parsers in `src/hooks/taskPersistence.ts` and switched `loadInitialTaskState()` to parse every relevant store value before hydration.
- [x] Updated `src/hooks/useTasks.ts` so business-date rollover parses carryover ledger store values instead of casting them.
- [x] Wired `verify:task-persistence` into `package.json` and `verify:task-core`.
- [x] Verified the change with task persistence, carryover, list-interaction, TypeScript, and production build checks.
- **Status:** complete

## Renderer Task UI Store Value Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-persistence` before fix | failed as RED because the store parsers did not exist |
| `npm.cmd run verify:task-persistence` | passed |
| `npm.cmd run verify:task-carryover` | passed |
| `npm.cmd run verify:task-list-interactions` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 291: Renderer Personalization And UI Store Runtime Narrowing
- [x] Reproduced remaining renderer UI store overtrust: personalization loading cast unknown store objects as `Partial<PersonalizationSettings>`, theme overrides cast as override records, and UI panel/search flags used `Boolean(...)` / `as string`.
- [x] Extended focused RED coverage in personalization and UI-state persistence verifiers to require field-level personalization parsing, theme-override parsing, strict boolean hydration, and string-only search query parsing.
- [x] Updated `src/app/appPersonalization.ts` so loaded personalization and stored theme overrides are parsed field-by-field, and themeId memory no longer uses `as string`.
- [x] Updated `src/app/appUiStatePersistence.ts` so panel/search flags require `value === true` and search query accepts only strings.
- [x] Verified the change with personalization/UI-state module checks, TypeScript, and a production build.
- **Status:** complete

## Renderer Personalization And UI Store Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-personalization-module` before fix | failed as RED because personalization still cast store payloads |
| `npm.cmd run verify:app-ui-state-persistence-module` before fix | failed as RED because UI store values still used `Boolean(...)` / `as string` |
| `npm.cmd run verify:app-personalization-module` | passed |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 292: Task Menu Popup URL Payload Runtime Narrowing
- [x] Reproduced a popup bootstrap boundary gap: `TaskMenuPopup` parsed URL payload JSON and cast `parsed.task as Task`, while also coercing `isDark` with `Boolean(...)`.
- [x] Extended focused RED coverage in `scripts/verify-context-menu.ts` requiring a pure payload parser, `isTaskLike(...)` task validation, string-only tags, and boolean-only dark mode.
- [x] Added `parseTaskMenuPopupPayload(...)` and switched URL bootstrap through it.
- [x] Verified the change with context-menu and task-menu action checks, TypeScript, and a production build.
- **Status:** complete

## Task Menu Popup URL Payload Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:context-menu` | passed |
| `npm.cmd run verify:app-task-menu-actions-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 293: Template Editor Kind Narrowing Without Casts
- [x] Reproduced template helper overtrust: `getInitialTemplateForKind` cast settings as `Partial<...>`, and `applyTemplateUpdate` cast union templates into daily/report fields.
- [x] Extended focused RED coverage in `scripts/verify-app-template-editor-module.ts` requiring structural daily/report narrowing and rejecting mismatched update payloads.
- [x] Updated `src/app/appTemplateEditor.ts` to read settings fields directly and narrow template updates with `isDailyTemplate(...)`.
- [x] Verified the change with template-editor checks, TypeScript, and a production build.
- **Status:** complete

## Template Editor Kind Narrowing Without Casts Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-template-editor-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 294: AI Review Generation Diagnostic Runtime Narrowing
- [x] Reproduced a SettingsPanel generation-result gap: daily results stored `result.diagnostic` without validation, and non-daily results cast with `result as { diagnostic?: AiReviewRunDiagnostic }` even though external generation results do not advertise diagnostics.
- [x] Extended focused RED coverage in `scripts/verify-ai-run-diagnostics.ts` requiring `isAiReviewRunDiagnostic(...)`, `readAiReviewRunDiagnostic(...)`, and SettingsPanel ownership of the guarded reader.
- [x] Added runtime diagnostic guards in `shared/aiReview/runDiagnostics.ts`.
- [x] Updated `src/components/SettingsPanel.tsx` so all generation paths store only validated diagnostics.
- [x] Verified the change with diagnostics/progress/manual-generation checks, TypeScript, and a production build.
- **Status:** complete

## AI Review Generation Diagnostic Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npm.cmd run verify:ai-progress-ui` | passed |
| `npm.cmd run verify:settings-ai-review-manual-generation-section` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 295: Settings Select Event Value Runtime Narrowing
- [x] Reproduced settings select/event value casts that wrote trusted app/AI settings enums from raw DOM strings: language, weekly/monthly source modes, and AI provider.
- [x] Extended focused RED coverage in settings basic/source/AI module verifiers so those controls must use runtime guards instead of `as` casts.
- [x] Exported `isAppLanguage(...)` from `shared/appSettings.ts` and `isAiProvider(...)` from `shared/aiReview/aiReviewSettings.ts`.
- [x] Updated settings UI to ignore invalid language/provider values and normalize source modes through existing shared helpers.
- [x] Verified the change with focused settings checks, adjacent AI settings checks, TypeScript, and a production build.
- **Status:** complete

## Settings Select Event Value Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:settings-basic-sections` | passed |
| `npm.cmd run verify:settings-ai-review-source-section` | passed |
| `npm.cmd run verify:settings-ai-review-module` | passed |
| `npm.cmd run verify:ai-settings` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 296: Task Priority Filter Runtime Narrowing
- [x] Reproduced a task-list priority filter gap: the toolbar cast DOM select strings with `event.target.value as PriorityFilter`, while UI-state hydration inlined the same enum checks.
- [x] Extended focused RED coverage in task-list interactions, app task-view, and app UI-state persistence verifiers to require a shared `isPriorityFilter(...)` guard.
- [x] Added `isPriorityFilter(...)` in `src/app/appTaskView.ts`.
- [x] Updated `TaskListToolbar` to ignore invalid select values and `loadAppUiState` to reuse the shared guard for store hydration.
- [x] Verified the change with focused task-list/UI-state checks, TypeScript, and a production build.
- **Status:** complete

## Task Priority Filter Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-list-interactions` | passed |
| `npm.cmd run verify:app-task-view-module` | passed |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 297: Completion Review Status Runtime Narrowing
- [x] Reproduced completion-review status select casts in `TaskCompletionDialog` and `ReviewView` that wrote trusted `TaskCompletionReview['status']` values from raw DOM strings.
- [x] Extended focused RED coverage in `scripts/verify-review-empty-fields.ts` for a shared `isTaskCompletionReviewStatus(...)` guard and both select owners.
- [x] Added `isTaskCompletionReviewStatus(...)` and `TaskCompletionReviewStatus` in `shared/completionReviews.ts`.
- [x] Updated both UI select handlers to ignore invalid status values before updating local review edit state.
- [x] Verified the change with review-fields checks, TypeScript, and a production build.
- **Status:** complete

## Completion Review Status Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:review-fields` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 298: Companion Write Mode Runtime Narrowing
- [x] Reproduced a Companion settings UI gap: rule write-mode select cast DOM strings with `event.target.value as WriteMode`, while main-process rule validation inlined the same enum checks.
- [x] Extended focused RED coverage in `electron/obsidianCompanion.verify.ts` for shared `isWriteMode(...)` and ObsidianCompanionPanel ownership.
- [x] Added `isWriteMode(...)` in `shared/obsidianCompanion.ts`.
- [x] Updated Companion panel select handling and reused the shared guard in Electron companion/app-state rule validation.
- [x] Verified the change with companion/app-state checks, TypeScript, and a production build.
- **Status:** complete

## Companion Write Mode Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run verify:electron-app-state-accessors-module` | passed |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 299: Template Render Type Runtime Narrowing
- [x] Reproduced template render-type select casts in `TemplateEditorModal` and `TemplateRecognitionModal` that wrote trusted `RenderType` values from raw DOM strings.
- [x] Extended focused RED coverage in `scripts/verify-section-config.ts` for shared `isRenderType(...)` and both modal owners.
- [x] Added `isRenderType(...)` in `shared/aiReview/sectionConfig.ts`.
- [x] Extracted daily/report default-template catalog construction from `shared/aiReview/sectionConfig.ts` into `shared/aiReview/sectionConfigDefaultTemplates.ts`, preserving the established facade exports and fresh-ID behavior.
- [x] Extracted Obsidian managed-block no-op detection and task-sync timestamp preservation from `electron/obsidianSyncDailyNote.ts` into `electron/obsidianManagedBlockSync.ts` without changing its file-write orchestration.
- [x] Extracted shared template-aware report execution from `electron/aiReview/exportReports.ts` into `electron/aiReview/templateReportGeneration.ts`, keeping weekly/monthly/external facade behavior and redaction ownership intact.
- [x] Updated both template modals to ignore invalid render-type select values before writing block state.
- [x] Verified the change with section-config checks, TypeScript, and a production build.
- **Status:** complete

## Template Render Type Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:section-config` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |


### Phase 300: Ambient Settings Getter Return Runtime Narrowing
- [x] Reproduced ambient IPC getter overtrust: `getAppSettings`, `getObsidianTemplateSettings`, `resetObsidianTemplateSettings`, `getCompanionSettings`, `aiReview.getSettings`, and `aiReview.getSections` claimed strongly typed returns across preload.
- [x] Extended focused RED coverage in settings/companion/AI Review IPC and renderer lifecycle/startup verifiers.
- [x] Shared Companion settings normalization via `isCompanionRule` / `isCompanionTemplate` / `normalizeCompanionSettings`.
- [x] Updated ambient declarations to `Promise<unknown>` and made renderer store/lifecycle/settings consumers re-establish trust with shared normalizers.
- [x] Verified the change with focused IPC/renderer checks, TypeScript, and a production build.
- **Status:** complete

## Ambient Settings Getter Return Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-settings-ipc-module` | passed |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module` | passed |
| `npm.cmd run verify:electron-app-state-accessors-module` | passed |
| `npm.cmd run verify:app-startup-settings-module` | passed |
| `npm.cmd run verify:app-ai-review-lifecycle-module` | passed |
| `npm.cmd run verify:companion` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |


### Phase 301: AI Review Settings Setter Return Runtime Narrowing
- [x] Reproduced ambient overtrust on AI Review setter returns: `setSettings` and `setSections` claimed trusted normalized objects even though preload only forwards IPC runtime results.
- [x] Extended focused RED coverage in `scripts/verify-electron-ai-review-settings-sections-ipc-module.ts` requiring both setter returns to be `Promise<unknown>`.
- [x] Updated `src/vite-env.d.ts` so AI Review settings/sections setter returns expose `unknown`.
- [x] Confirmed current renderer callers ignore setter returns and continue writing local trusted state they already constructed.
- [x] Verified the change with focused AI Review settings IPC checks, adjacent AI settings checks, and TypeScript/build.
- **Status:** complete

## AI Review Settings Setter Return Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module` | passed |
| `npm.cmd run verify:ai-settings` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |


### Phase 302: AI Review Generation Result Runtime Narrowing
- [x] Reproduced ambient overtrust on AI Review generation/inspection returns: `runForDate`, `inspectDaily`, `generateWeekly/Monthly/External` claimed structured result objects including diagnostics.
- [x] Extended focused RED coverage in `scripts/verify-ai-run-diagnostics.ts` for `readAiReviewGenerationResult(...)`, `readAiReviewDailyInspection(...)`, ambient `Promise<unknown>` returns, and SettingsPanel ownership.
- [x] Added generation/inspection result readers in `shared/aiReview/runDiagnostics.ts`.
- [x] Updated SettingsPanel generation paths and scheduled-report result handling to parse unknown IPC returns before side effects.
- [x] Verified with diagnostics/progress/manual-generation/lifecycle checks, TypeScript, and a production build.
- **Status:** complete

## AI Review Generation Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npm.cmd run verify:ai-progress-ui` | passed |
| `npm.cmd run verify:settings-ai-review-manual-generation-section` | passed |
| `npm.cmd run verify:app-ai-review-lifecycle-module` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |


### Phase 303: AI Review ListModels Result Runtime Narrowing
- [x] Reproduced ambient overtrust on `aiReview.listModels` returns that claimed a trusted success/failure union at the preload boundary.
- [x] Extended focused RED coverage in template-tools IPC, settings AI review module, and openai-client verifiers for `readListModelsResult(...)` and ambient `Promise<unknown>`.
- [x] Added `readListModelsResult(...)` in `shared/llm/openaiClient.ts`.
- [x] Updated AI account model-fetch UI to parse unknown IPC returns before reading `ok` / `models` / `error`.
- [x] Verified with focused IPC/UI/client checks, TypeScript, and a production build.
- **Status:** complete

## AI Review ListModels Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:settings-ai-review-module` | passed |
| `npm.cmd run verify:openai-client` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 304: Companion Preview/Write/Import Result Runtime Narrowing
- [x] Reproduced ambient overtrust on Companion preview/write/import returns that claimed trusted `SyncPlan` / write-result / import-result shapes at the preload boundary.
- [x] Extended focused RED coverage in Companion IPC and actions verifiers for ambient `Promise<unknown>` returns and local runtime readers.
- [x] Added shared `isCaptureItem(...)`, `isSyncPlan(...)`, `readCompanionSyncPlan(...)`, `readCompanionWriteResult(...)`, and `readCompanionMobileImportResult(...)` in `shared/obsidianCompanion.ts`.
- [x] Updated Companion actions to parse unknown IPC returns before plan/status/item side effects, with structured failure status for malformed payloads.
- [x] Reused shared `isCaptureItem(...)` from Electron Companion planning so capture-item trust establishment stays consistent.
- [x] Verified with focused Companion checks, TypeScript, and a production build.
- **Status:** complete

## Companion Preview/Write/Import Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:app-companion-actions-module` | passed |
| `npm.cmd run verify:app-companion-status-module` | passed |
| `npm.cmd run verify:app-companion-mobile-module` | passed |
| `npm.cmd run verify:companion` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 305: Obsidian Sync Preview Result Runtime Narrowing
- [x] Reproduced ambient overtrust on `previewTasksToObsidian` returns that claimed trusted `SyncPreview` at the preload boundary.
- [x] Extended focused RED coverage in Obsidian IPC, template-actions, and settings-sync verifiers for ambient `Promise<unknown>` returns and `readSyncPreview(...)`.
- [x] Added shared `isSyncPreview(...)` / `readSyncPreview(...)` in `shared/obsidianTemplates.ts`.
- [x] Updated store wrapper and template actions to parse unknown IPC returns before writing settings sync preview state.
- [x] Aligned stale settings-sync ambient input assertions with the current plain `unknown` payload contract.
- [x] Verified with focused Obsidian checks, TypeScript, and a production build.
- **Status:** complete

## Obsidian Sync Preview Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:app-obsidian-template-actions-module` | passed |
| `npm.cmd run verify:settings-sync` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 306: Window Mode Return Runtime Narrowing
- [x] Reproduced ambient overtrust on `getWindowMode` / `setWindowMode` returns that claimed trusted `WindowMode` at the preload boundary.
- [x] Extended focused RED coverage in window IPC and window-mode verifiers for ambient `Promise<unknown>` returns and `readWindowMode(...)`.
- [x] Added shared `readWindowMode(...)` next to `isWindowMode(...)`.
- [x] Updated TitleBar pin-state paths to revalidate unknown window-mode IPC/event payloads before UI updates.
- [x] Verified with focused window checks, TypeScript, and a production build.
- **Status:** complete

## Window Mode Return Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:window-mode` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 307: AI Review Backfill Result Runtime Narrowing
- [x] Reproduced ambient overtrust on `aiReview.backfill` returns that claimed trusted processed/filled/errors objects at the preload boundary.
- [x] Extended focused RED coverage in backfill IPC, lifecycle, and run-diagnostics verifiers for ambient `Promise<unknown>` and `readAiReviewBackfillReport(...)`.
- [x] Added shared `AiReviewBackfillReport` / `readAiReviewBackfillReport(...)` in `shared/aiReview/runDiagnostics.ts`.
- [x] Updated AI review lifecycle backfill call sites to revalidate unknown IPC returns even on fire-and-forget paths.
- [x] Verified with focused AI Review checks, TypeScript, and a production build.
- **Status:** complete

## AI Review Backfill Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-backfill-ipc-module` | passed |
| `npm.cmd run verify:app-ai-review-lifecycle-module` | passed |
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 308: AI Review Template Tools Result Runtime Narrowing
- [x] Reproduced ambient overtrust on `recognizeTemplate`, `recognizeReportTemplate`, and `testSourceMaterials` returns that claimed trusted structured results at the preload boundary.
- [x] Extended focused RED coverage in template/tools IPC, source-materials IPC, recognize-template, recognize-report, and source-materials verifiers for ambient `Promise<unknown>` returns and shared readers.
- [x] Added `readAiReviewRecognizeTemplateResult(...)`, `readAiReviewRecognizeReportTemplateResult(...)`, and `readAiReviewSourceMaterialsResult(...)` in shared modules.
- [x] Updated ambient AI Review template/source-materials result contracts to `Promise<unknown>`.
- [x] Verified with focused AI Review checks, TypeScript, and a production build.
- **Status:** complete

## AI Review Template Tools Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm.cmd run verify:recognize-template` | passed |
| `npm.cmd run verify:recognize-report` | passed |
| `npm.cmd run verify:source-materials` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 309: Obsidian Sync/Open Result Runtime Narrowing
- [x] Reproduced ambient overtrust on Obsidian path, sync, preview, and open-daily-note returns at the preload boundary.
- [x] Added browser-safe readers in `shared/obsidianIpcResults.ts` for Obsidian action/path/preview results.
- [x] Updated renderer task-store and Obsidian template action paths to parse unknown IPC returns before state updates or hook exposure.
- [x] Updated ambient Obsidian path/sync/preview/open contracts to `Promise<unknown>`.
- [x] Verified with focused Obsidian IPC/settings/template-action checks, TypeScript, and a production build.
- **Status:** complete

## Obsidian Sync/Open Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:settings-sync` | passed |
| `npm.cmd run verify:app-obsidian-template-actions-module` | passed |
| `npx.cmd tsc --noEmit -p tsconfig.json` | passed |
| `npm.cmd run build` | passed |

### Phase 310: Obsidian Template Recognition Result Runtime Narrowing
- [x] Reproduced ambient overtrust on Obsidian template recognition and picker returns at the preload boundary.
- [x] Added shared readers in `shared/obsidianTemplateRecognition.ts` for recognition results and template picker results.
- [x] Updated `ObsidianTemplateCenter` to parse unknown IPC returns before reading drafts, file text, or picker metadata.
- [x] Updated ambient Obsidian template recognition/picker and AI Review picker contracts to `Promise<unknown>`.
- [x] Verified with focused Obsidian template UI/recognition checks, adjacent IPC checks, TypeScript, and a production build.
- **Status:** complete

## Obsidian Template Recognition Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:obsidian-template-recognition` | passed |
| `npm.cmd run verify:obsidian-template-ui` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 311: Window Settings Mode Return Runtime Narrowing
- [x] Reproduced ambient return overtrust on `setSettingsMode(...)`, which claimed a trusted `{ ok: boolean; width?: number }` object even though preload only forwards runtime IPC data.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setSettingsMode(...)` to expose a `Promise<unknown>` return and to avoid advertising trusted settings-mode result objects.
- [x] Updated `src/vite-env.d.ts` so `setSettingsMode(...)` keeps the existing `unknown` input and now returns `Promise<unknown>`.
- [x] Calibrated `scripts/verify-settings-v2-window-mode.ts` to the current moduleized window/settings-mode structure instead of stale inline `main.ts` assertions.
- [x] Preserved fire-and-forget renderer behavior through `syncSettingsMode(settingsOpen)` and the existing strict `open === true` IPC narrowing.
- [x] Verified with focused window/settings-mode checks, app-shell effects checks, TypeScript, and a production build.
- **Status:** complete

## Window Settings Mode Return Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before ambient fix | failed as RED because `src/vite-env.d.ts` still claimed `setSettingsMode(...) => Promise<{ ok: boolean; width?: number }>` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:settings-v2-window-mode` before verifier calibration | failed because the script still expected the old inline `main.ts` settings-mode shape |
| `npm.cmd run verify:settings-v2-window-mode` | passed |
| `npm.cmd run verify:app-shell-effects-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 312: Settings Setter Return Runtime Narrowing
- [x] Reproduced ambient return overtrust on `setAppSettings(...)`, `setObsidianTemplateSettings(...)`, and `setCompanionSettings(...)`, which claimed trusted `{ ok: boolean }` write-result objects even though preload only forwards runtime IPC data.
- [x] Added focused RED coverage in `scripts/verify-electron-settings-ipc-module.ts` and `scripts/verify-electron-companion-ipc-module.ts` requiring those setter returns to expose `Promise<unknown>` and reject the old trusted write-result contracts.
- [x] Updated `src/vite-env.d.ts` so all three settings setter returns are `Promise<unknown>` while keeping their existing `unknown` inputs.
- [x] Calibrated `scripts/verify-electron-app-state-accessors-module.ts` to the current shared `normalizeCompanionSettings(...)` wiring instead of stale direct default-factory wiring.
- [x] Preserved existing main-process `{ ok: true }` setter IPC return shapes and renderer fire-and-forget/state-first setter usage.
- [x] Verified with focused settings/Companion IPC checks, adjacent app action/accessor checks, TypeScript, and a production build.
- **Status:** complete

## Settings Setter Return Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-settings-ipc-module` before ambient fix | failed as RED because app and Obsidian template setters still claimed `Promise<{ ok: boolean }>` |
| `npm.cmd run verify:electron-companion-ipc-module` before ambient fix | failed as RED because Companion settings setter still claimed `Promise<{ ok: boolean }>` |
| `npm.cmd run verify:electron-settings-ipc-module` | passed |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:app-companion-actions-module` | passed |
| `npm.cmd run verify:app-obsidian-template-actions-module` | passed |
| `npm.cmd run verify:electron-app-state-accessors-module` | passed with escalation because the verifier creates a temporary file-backed vault under Windows Temp |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 313: Window/System Boolean Return Runtime Narrowing
- [x] Reproduced ambient return overtrust on window/system boolean APIs: `getAlwaysOnTop(...)`, `toggleAlwaysOnTop(...)`, `getLockWindowPosition(...)`, `setLockWindowPosition(...)`, `getWindowCompactMode(...)`, `getAutoStart(...)`, and `setAutoStart(...)` still claimed trusted `Promise<boolean>` values even though preload only forwards IPC runtime data.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring those boolean-return APIs to expose `Promise<unknown>` at the ambient preload boundary and rejecting the old trusted boolean contracts.
- [x] Updated `src/vite-env.d.ts` so the selected window/system boolean getter/setter returns are `Promise<unknown>` while keeping existing runtime `unknown` inputs for setters.
- [x] Updated `src/components/settings/SettingsControls.tsx` so AutoStart state parses `getAutoStart(...)` and `setAutoStart(...)` returns with `value === true` before writing React state.
- [x] Preserved TitleBar window-mode fallback parsing for `toggleAlwaysOnTop(...)` and existing compact-mode `value === true` UI-state hydration.
- [x] Verified with focused window IPC checks, adjacent settings/UI/window checks, TypeScript, and a production build.
- **Status:** complete

## Window/System Boolean Return Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before ambient fix | failed as RED because `getAlwaysOnTop(...)` still claimed `Promise<boolean>` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:settings-panel-modules` | passed |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run verify:app-shell-effects-module` | passed |
| `npm.cmd run verify:window-mode` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 264: AI Review Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed AI Review daily/backfill/weekly/monthly task inputs were trusted `Task[]` even though preload forwards those values as runtime `unknown`.
- [x] Updated `scripts/verify-ai-regenerate-force.ts` to require `unknown` AI Review task inputs and to check the current split IPC modules instead of stale inline `aiReviewIpc.ts` handler shape.
- [x] Updated `src/vite-env.d.ts` so `runForDate(...)`, `backfill(...)`, `generateWeekly(...)`, and `generateMonthly(...)` task inputs use `unknown`.
- [x] Preserved daily regeneration force wiring, AI Review IPC registration boundaries, and existing report/backfill call paths.
- [x] Verified the change with focused AI regeneration checks, adjacent daily run/inspect IPC checks, and TypeScript.
- **Status:** complete

## AI Review Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:ai-regenerate-force` | failed because no package script exists; used direct tsx verifier |
| `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` before fix | failed as RED because AI Review ambient task inputs still advertised trusted `Task[]` |
| `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 263 |

### Phase 265: Settings Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed `setAppSettings(...)` and `setObsidianTemplateSettings(...)` accepted trusted settings objects even though preload and Electron settings IPC treat those values as runtime `unknown`.
- [x] Added focused RED coverage in `scripts/verify-electron-settings-ipc-module.ts` requiring both settings setter ambient inputs to expose `unknown` and checking preload still forwards unknown runtime data.
- [x] Updated `src/vite-env.d.ts` so app settings and Obsidian template settings setter inputs use `unknown`, while typed store wrappers keep their internal renderer call sites typed.
- [x] Preserved settings IPC registration, app-state normalization, Obsidian template reset behavior, and task-change broadcasting.
- [x] Verified the change with focused settings IPC checks, adjacent app-state accessor checks, and TypeScript.
- **Status:** complete

## Settings Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-settings-ipc-module` before fix | failed as RED because app settings ambient setter input still advertised trusted `AppBehaviorSettings` |
| `npm.cmd run verify:electron-settings-ipc-module` | passed |
| `npm.cmd run verify:electron-app-state-accessors-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 263 |

### Phase 266: AI Review Settings Preload Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed `aiReview.setSettings(...)` and `aiReview.setSections(...)` accepted trusted settings/section objects even though preload and Electron settings/sections IPC treat those values as runtime `unknown`.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-settings-sections-ipc-module.ts` requiring both AI Review setter ambient inputs to expose `unknown` and checking preload still forwards unknown runtime data.
- [x] Updated `src/vite-env.d.ts` so `aiReview.setSettings(...)` and `aiReview.setSections(...)` inputs use `unknown`, while normalized return values remain strongly typed.
- [x] Preserved AI Review settings/sections IPC registration, settings normalization, timer rescheduling, and section config normalization.
- [x] Verified the change with focused AI Review settings/sections IPC checks, adjacent AI settings/section-config checks, and TypeScript.
- **Status:** complete

## AI Review Settings Preload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module` before fix | failed as RED because `aiReview.setSettings(...)` still advertised trusted `AiReviewSettings` input |
| `npm.cmd run verify:electron-ai-review-settings-sections-ipc-module` | passed |
| `npm.cmd run verify:ai-settings` | passed |
| `npm.cmd run verify:section-config` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 263 |

### Phase 267: Companion Settings Setter Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `src/vite-env.d.ts`, `electron/companionIpc.ts`, and `electron/appStateAccessors.ts` still claimed `setCompanionSettings(...)` accepted trusted `CompanionSettings` even though preload forwards runtime `unknown`.
- [x] Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring the Companion settings setter ambient/preload/IPC/app-state inputs to expose `unknown`.
- [x] Updated `src/vite-env.d.ts`, `electron/companionIpc.ts`, and `electron/appStateAccessors.ts` so Companion settings setter inputs use `unknown`, while normalized getter returns remain strongly typed.
- [x] Preserved Companion settings normalization, IPC registration, sync preview/write coverage, and app-state persistence behavior.
- [x] Verified the change with focused Companion IPC checks, adjacent app-state accessor checks, and TypeScript.
- **Status:** complete

## Companion Settings Setter Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-companion-ipc-module` before fix | failed as RED because `setCompanionSettings(...)` still advertised trusted `CompanionSettings` input |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:electron-app-state-accessors-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 263 |

### Phase 268: Task Context Menu Open Type Contract Narrowing
- [x] Reproduced a preload type-contract gap: `src/vite-env.d.ts` still claimed `openTaskContextMenu(...)` accepted a trusted structured task-menu payload even though preload forwards `unknown` and Electron IPC validates runtime shape.
- [x] Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring `openTaskContextMenu` to expose an `unknown` payload at the ambient preload boundary.
- [x] Updated `src/vite-env.d.ts` so `openTaskContextMenu(payload: unknown)` matches `electron/preload.ts` and the existing `taskContextMenu:open` runtime guard.
- [x] Preserved task context menu popup creation, action forwarding, renderer payload building, and context-menu behavior.
- [x] Verified the change with focused task-context-menu IPC checks, adjacent context-menu checks, TypeScript, and production build.
- **Status:** complete

## Task Context Menu Open Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-task-context-menu-ipc-module` before fix | failed as RED because `openTaskContextMenu(...)` still advertised a trusted structured payload |
| `npm.cmd run verify:electron-task-context-menu-ipc-module` | passed |
| `npm.cmd run verify:context-menu` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 269: Task Context Menu Resize Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `resizeTaskContextMenu(...)` still claimed trusted numeric height inputs in preload, ambient types, and the Electron IPC handler even though runtime code narrows and clamps the value.
- [x] Added focused RED coverage in `scripts/verify-electron-task-context-menu-ipc-module.ts` requiring resize heights to expose `unknown` through preload, ambient types, and the IPC handler before finite-number narrowing.
- [x] Updated `electron/preload.ts`, `electron/taskContextMenuIpc.ts`, and `src/vite-env.d.ts` so `resizeTaskContextMenu` / `taskContextMenu:resize` inputs use `unknown`.
- [x] Preserved resize fallback, `80..600` clamp, popup bounds behavior, and context-menu behavior.
- [x] Verified the change with focused task-context-menu IPC checks, adjacent context-menu checks, and TypeScript.
- **Status:** complete

## Task Context Menu Resize Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-task-context-menu-ipc-module` before fix | failed as RED because the resize IPC handler still typed `height` as `number` |
| `npm.cmd run verify:electron-task-context-menu-ipc-module` | passed |
| `npm.cmd run verify:context-menu` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 268 |

### Phase 270: Window Mode Setter Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `setWindowMode(...)` still claimed trusted `WindowMode` / `string` inputs even though Electron IPC narrows runtime values with `isWindowMode(...)`.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setWindowMode` to expose `unknown` through preload, ambient types, and the IPC handler before runtime narrowing.
- [x] Updated `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `setWindowMode(...)` inputs use `unknown`.
- [x] Preserved invalid-mode fallback behavior, valid mode switching, always-on-top toggle semantics, and window mode controller behavior.
- [x] Verified the change with focused window IPC checks, adjacent window mode controller checks, and TypeScript.
- **Status:** complete

## Window Mode Setter Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because the window-mode IPC handler still typed `mode` as `WindowMode` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-mode-controller-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 268 |

### Phase 271: Window Settings Mode Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `setSettingsMode(...)` still claimed trusted `boolean` inputs even though Electron IPC narrows runtime values with `open === true`.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setSettingsMode` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- [x] Updated `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `setSettingsMode(...)` inputs use `unknown`.
- [x] Preserved settings-window sizing, restore-width behavior, close/fallback behavior, and bootstrap wiring.
- [x] Verified the change with focused window IPC checks, adjacent settings-mode/bootstrap checks, and TypeScript.
- **Status:** complete

## Window Settings Mode Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because the settings-mode IPC handler still typed `open` as `boolean` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:electron-settings-mode-state-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 268 |

### Phase 274: Window Auto Start Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `setAutoStart(...)` still claimed trusted `boolean` inputs even though Electron IPC narrows runtime values with `enabled === true`.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setAutoStart` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- [x] Updated `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `setAutoStart(...)` inputs use `unknown`.
- [x] Preserved autostart persistence, Electron login-item update behavior, and strict boolean store semantics.
- [x] Verified the change with focused window IPC checks, adjacent bootstrap checks, and TypeScript.
- **Status:** complete

## Window Auto Start Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because the autostart IPC handler still typed `enabled` as `boolean` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 273 |

### Phase 275: Companion Mobile Inbox Import Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `importMobileInbox(...)` still claimed trusted `string` path inputs even though the runtime importer rejects non-string values before filesystem checks.
- [x] Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring mobile inbox import paths to expose `unknown` through preload, ambient types, and the IPC handler.
- [x] Updated `electron/companionIpc.ts`, `electron/preload.ts`, `src/vite-env.d.ts`, and `electron/obsidianCompanion.ts` so `importMobileInbox(...)` inputs use `unknown`.
- [x] Preserved mobile inbox directory validation, non-string structured failure behavior, and existing Companion import behavior.
- [x] Verified the change with focused Companion IPC checks, adjacent Companion runtime checks, and TypeScript.
- **Status:** complete

## Companion Mobile Inbox Import Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-companion-ipc-module` before fix | failed as RED because the importMobileInbox IPC handler still typed `inboxPath` as `string` |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 273 |

### Phase 276: Obsidian Template Recognize Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `obsidianTemplate.recognize(...)` still claimed trusted `string` raw-template inputs even though the recognition validator accepts runtime `unknown`.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring Obsidian template recognition raw input to expose `unknown` through preload, ambient types, and the IPC handler.
- [x] Updated `electron/obsidianIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `obsidianTemplate.recognize(...)` inputs use `unknown`.
- [x] Preserved recognition validation before AI settings/API-key checks, LLM prompt wiring, and recognized draft parsing.
- [x] Verified the change with focused Obsidian IPC checks, adjacent Obsidian template recognition checks, TypeScript, and production build.
- **Status:** complete

## Obsidian Template Recognize Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-ipc-module` before fix | failed as RED because the `obsidianTemplate:recognize` IPC handler still typed `rawTemplate` as `string` |
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:obsidian-template-recognition` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 277: AI Review Template Recognition Type Contract Narrowing
- [x] Continued the preload/IPC type-contract narrowing pass for AI Review template recognition after Phase 276.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring `recognizeTemplate(...)` and `recognizeReportTemplate(...)` to expose runtime `unknown` inputs through IPC, preload, and ambient types.
- [x] Updated `electron/aiReviewTemplateToolsIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so review-template raw input plus report-template target/raw input use `unknown`.
- [x] Preserved existing raw-template validation order, report target fallback to `personalWeekly`, LLM prompt wiring, and parser behavior.
- [x] Verified the change with focused AI Review template/tools IPC checks, adjacent recognition checks, parent AI Review IPC checks, and TypeScript.
- **Status:** complete

## AI Review Template Recognition Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because `recognizeTemplate(...)` still typed `rawTemplate` as `string` |
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:recognize-template` | passed |
| `npm.cmd run verify:recognize-report` | passed |
| `npm.cmd run verify:electron-ai-review-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 276 |

### Phase 273: Window Compact Mode Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `setWindowCompactMode(...)` still claimed trusted `boolean` inputs even though Electron IPC narrows runtime values with `compactMode === true`.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setWindowCompactMode` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- [x] Updated `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `setWindowCompactMode(...)` inputs use `unknown`.
- [x] Preserved compact-mode persistence and strict boolean store semantics.
- [x] Verified the change with focused window IPC checks, adjacent bootstrap checks, TypeScript, and a production build checkpoint.
- **Status:** complete

## Window Compact Mode Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because the compact-mode IPC handler still typed `compactMode` as `boolean` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm run build` | passed |

### Phase 272: Window Lock Position Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `setLockWindowPosition(...)` still claimed trusted `boolean` inputs even though Electron IPC narrows runtime values with `locked === true`.
- [x] Added focused RED coverage in `scripts/verify-electron-window-ipc-module.ts` requiring `setLockWindowPosition` to expose `unknown` through preload, ambient types, and the IPC handler before strict boolean narrowing.
- [x] Updated `electron/windowIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `setLockWindowPosition(...)` inputs use `unknown`.
- [x] Preserved lock-position persistence, strict boolean behavior, and z-order reapplication.
- [x] Verified the change with focused window IPC checks, adjacent app-state/bootstrap checks, and TypeScript.
- **Status:** complete

## Window Lock Position Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because the lock-position IPC handler still typed `locked` as `boolean` |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run verify:electron-app-state-accessors-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 268 |

### Phase 278: Obsidian Daily Note Open Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `openDailyNote(...)` still claimed trusted `string` date inputs even though the Electron IPC handler already rejects non-string runtime values before daily-note path derivation.
- [x] Added focused RED coverage in `scripts/verify-electron-obsidian-ipc-module.ts` requiring `openDailyNote(...)` to expose runtime `unknown` input through IPC, preload, and ambient types.
- [x] Updated `electron/obsidianIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so `openDailyNote(...)` date inputs use `unknown`.
- [x] Preserved vault-status gating, non-string date rejection, date-key derivation after narrowing, daily-note file bootstrap, overview refresh, and shell open behavior.
- [x] Verified the change with focused Obsidian IPC checks, adjacent bootstrap checks, and TypeScript.
- **Status:** complete

## Obsidian Daily Note Open Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-ipc-module` before fix | failed as RED because `obsidian:openDailyNote` still typed `date` as `string` |
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | deferred under fast batch mode; last passed Phase 276 |

### Phase 279: AI Review Model List Config Type Contract Narrowing
- [x] Reproduced a preload/IPC type-contract gap: `aiReview.listModels(...)` still claimed a trusted config object even though the Electron IPC handler already narrows `baseUrl`, `apiKey`, and `provider` from runtime data before calling `listModels(...)`.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-template-tools-ipc-module.ts` requiring `listModels(...)` to expose runtime `unknown` config input through IPC, preload, and ambient types.
- [x] Updated `electron/aiReviewTemplateToolsIpc.ts`, `electron/preload.ts`, and `src/vite-env.d.ts` so model-list config input uses `unknown` and becomes trusted only after local field-level narrowing.
- [x] Preserved base URL/API key string guards, provider whitelist fallback to `auto`, model-list timeout, template tools IPC delegation, and parent AI Review IPC registration.
- [x] Verified the change with focused AI Review template/tools IPC checks, adjacent parent AI Review IPC checks, TypeScript, and a production build checkpoint.
- **Status:** complete

## AI Review Model List Config Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because `aiReview:listModels` still typed `cfg` as a structured config object |
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 282: Companion Sync Runtime Payload Type Contract Narrowing
- [x] Reproduced a Companion preload/IPC contract gap: `previewSync` and `writeSync` handlers still claimed trusted settings and capture-item inputs despite receiving renderer-controlled runtime data.
- [x] Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring Companion sync handlers and bootstrap injection to receive `unknown` runtime payloads.
- [x] Updated `electron/companionIpc.ts` and `electron/mainWindowBootstrap.ts` so Companion sync payloads and settings-setter injection remain `unknown` at the Electron boundary.
- [x] Updated `electron/obsidianCompanion.ts` so `buildSyncPlan(...)` accepts `unknown` and establishes its narrowed planning settings type only after its existing structural validation.
- [x] Preserved the structured malformed-items, missing arrays, malformed rules/templates, and missing-vault failure results.
- [x] Verified the change with focused Companion IPC and planning checks, adjacent bootstrap checks, TypeScript, and a production build.
- **Status:** complete

## Companion Sync Runtime Payload Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-companion-ipc-module` before fix | failed as RED because `companion:previewSync` still typed settings as `CompanionSettings` |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 283: AI Review Daily Runtime Task Payload Hardening
- [x] Reproduced an AI Review daily-run IPC boundary gap: date input was untrusted, but task payloads were typed as trusted `ElectronTask[]` and arbitrary truthy values could enable force regeneration.
- [x] Added focused RED coverage in `scripts/verify-electron-ai-review-daily-run-inspect-ipc-module.ts` requiring runtime task guards, malformed-task rejection, `unknown` task/force inputs, and strict force-flag narrowing.
- [x] Updated `electron/aiReviewDailyRunInspectIpc.ts` so the daily-run handler validates every task and recursive subtask before invoking the runner, returns the existing structured failure shape for malformed payloads, and passes `force === true` only.
- [x] Updated `electron/preload.ts` and `src/vite-env.d.ts` so `aiReview.runForDate(...)` exposes date, task, and force inputs as `unknown` at the renderer boundary.
- [x] Updated the parent AI Review IPC verifier to require the strict force contract rather than obsolete truthiness coercion.
- [x] Verified the change with focused and parent AI Review IPC checks, force-regeneration regression coverage, TypeScript, and the production build checkpoint run after the implementation change.
- **Status:** complete

## AI Review Daily Runtime Task Payload Hardening Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` before fix | failed as RED because the runtime task guard did not exist |
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-ipc-module` | passed |
| `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed after implementation change, before final verifier-only synchronization |

### Phase 284: AI Review Report And Backfill Task Payload Validation
- [x] Reproduced the remaining AI Review task-payload boundary gap: backfill, weekly report, and monthly report IPC handlers still typed renderer-controlled task payloads as trusted task arrays before statistics or backfill logic consumed them.
- [x] Added focused RED coverage across daily, backfill, weekly, and monthly IPC verifiers requiring a shared runtime task-payload guard, `unknown` task inputs, malformed-task rejection, and removal of direct stats casts after validation.
- [x] Added `electron/aiReviewTaskPayload.ts` as the shared recursive `ElectronTask[]` guard, including optional carry/completion review fields, and moved the daily-run validation onto it.
- [x] Updated `electron/aiReviewBackfillIpc.ts`, `electron/aiReviewWeeklyReportIpc.ts`, and `electron/aiReviewMonthlyReportIpc.ts` so malformed task payloads short-circuit before report preflight, source collection, stats, LLM calls, or backfill processing.
- [x] Preserved each channel's existing public result shape: daily returns skipped/filled markers, report generation returns `{ ok: false, error }`, and backfill returns processed/filled/errors arrays.
- [x] Verified the change with focused daily/backfill/weekly/monthly IPC checks, parent AI Review IPC checks, force-regeneration regression coverage, TypeScript, and a production build.
- **Status:** complete

## AI Review Report And Backfill Task Payload Validation Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` before fix | failed as RED because the shared task-payload guard module did not exist |
| `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module` before fix | failed as RED because the shared task-payload guard module did not exist |
| `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module` before fix | failed as RED because the shared task-payload guard module did not exist |
| `npm.cmd run verify:electron-ai-review-backfill-ipc-module` before fix | failed as RED because the shared task-payload guard module did not exist |
| `npm.cmd run verify:electron-ai-review-daily-run-inspect-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-weekly-report-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-monthly-report-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-backfill-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-ipc-module` | passed |
| `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 285: AI Review Report Kind Runtime Narrowing
- [x] Reproduced a report-kind IPC boundary gap: external report generation and source-material tests still trusted renderer-controlled `kind` values as `'weekly' | 'monthly'`.
- [x] Added focused RED coverage requiring both handlers, preload, and ambient API declarations to treat `kind` as `unknown` and reject malformed values before settings, vault, source collection, or report generation work.
- [x] Added `electron/aiReviewReportKind.ts` with a shared `weekly`/`monthly` runtime guard and stable malformed-kind error.
- [x] Updated `electron/aiReviewExternalReportIpc.ts` so invalid report kinds return `{ ok: false, error }` instead of falling into the monthly branch.
- [x] Updated `electron/aiReviewSourceMaterialsIpc.ts` so invalid report kinds return `{ ok: false, error, sources: [] }` before any vault/source work.
- [x] Updated `electron/preload.ts` and `src/vite-env.d.ts` so `generateExternal(...)` and `testSourceMaterials(...)` expose report kinds as runtime `unknown`.
- [x] Verified the change with focused external/source-material IPC checks, parent AI Review IPC checks, bootstrap checks, force-regeneration regression coverage, TypeScript, and a production build.
- **Status:** complete

## AI Review Report Kind Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-external-report-ipc-module` before fix | failed as RED because the shared report-kind guard module did not exist |
| `npm.cmd run verify:electron-ai-review-source-materials-ipc-module` before fix | failed as RED because the shared report-kind guard module did not exist |
| `npm.cmd run verify:electron-ai-review-external-report-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-source-materials-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd exec -- tsx scripts/verify-ai-regenerate-force.ts` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 286: Electron Store Key Runtime Narrowing
- [x] Reproduced a generic Electron Store IPC boundary gap: `store:get` and `store:set` still trusted renderer-controlled keys as `string`.
- [x] Added focused RED coverage in `scripts/verify-electron-settings-ipc-module.ts` requiring store keys to remain `unknown` through IPC, preload, and ambient types until the settings IPC handler narrows them.
- [x] Updated `electron/settingsIpc.ts` so malformed non-string store keys are ignored before Electron Store access, while valid string keys preserve existing get/set behavior.
- [x] Updated `electron/preload.ts` and `src/vite-env.d.ts` so `getStore(...)` and `setStore(...)` expose key inputs as runtime `unknown`.
- [x] Preserved task-change broadcasting for the valid `tasks` key and avoided changing the public result shape for normal renderer callers.
- [x] Verified the change with focused settings IPC checks, adjacent bootstrap checks, TypeScript, and a production build.
- **Status:** complete

## Electron Store Key Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-settings-ipc-module` before fix | failed as RED because `store:get` still typed `key` as `string` |
| `npm.cmd run verify:electron-settings-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 287: Companion Sync Items Type Contract Narrowing
- [x] Reproduced a Companion sync boundary gap: main-process planner already treated sync items as `unknown`, but preload and ambient still advertised `items: unknown[]`.
- [x] Added focused RED coverage in `scripts/verify-electron-companion-ipc-module.ts` requiring `previewCompanionSync` / `writeCompanionSync` item inputs to remain plain `unknown` through preload and ambient types.
- [x] Updated `electron/preload.ts` so Companion preview/write item payloads are forwarded as runtime `unknown`.
- [x] Updated `src/vite-env.d.ts` so ambient Companion sync APIs no longer claim items are already arrays before validation.
- [x] Left planner validation in `electron/obsidianCompanion.ts` as the authority that establishes array-ness and item structure.
- [x] Verified the change with focused Companion IPC checks, Companion regression coverage, TypeScript, and a production build.
- **Status:** complete

## Companion Sync Items Type Contract Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-companion-ipc-module` before ambient/preload fix | failed as RED because ambient still claimed `items: unknown[]` |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `npm.cmd run verify:companion` | passed |

### Phase 314: Template FileReader Result Runtime Narrowing
- [x] Reproduced a renderer trust gap: `TemplateRecognitionModal` cast `FileReader.result` to `string` before writing textarea state.
- [x] Added focused RED coverage in `scripts/verify-section-config.ts` requiring FileReader results to be narrowed before state writes.
- [x] Updated `src/components/TemplateRecognitionModal.tsx` to write file text only when `FileReader.result` is actually a string.
- [x] Verified with focused template config checks, adjacent recognition checks, TypeScript, and a production build.
- **Status:** complete

## Template FileReader Result Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:section-config` before fix | failed as RED because `FileReader.result` was still cast with `result as string` |
| `npm.cmd run verify:section-config` | passed |
| `npm.cmd run verify:recognize-template` | passed |
| `npm.cmd run verify:recognize-report` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |

### Phase 315: Batched Renderer And Shared Cast Runtime Narrowing
- [x] Switched to faster batch mode after user speed feedback.
- [x] Added focused checks for template reset kind narrowing, AI source-mode guards, Companion settings record narrowing, and task-source key filtering.
- [x] Removed low-risk trusted casts in `TemplateEditorModal`, `aiReviewSettings`, `obsidianCompanionDefaults`, and `taskOrdering`.
- [x] Verified with the four focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Batched Renderer And Shared Cast Runtime Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-template-editor-module` before fix | failed as RED because `TemplateEditorModal` did not narrow report template kinds before reset |
| `npm.cmd run verify:ai-settings` before fix | failed as RED because source-mode guards were not exported |
| `npm.cmd run verify:task-ordering-state` before fix | failed as RED because `isTaskSource` was not exported and keys were still cast |
| `npm.cmd run verify:companion` before fix | sandbox blocked at Windows Temp creation before reaching the new assertion |
| `npm.cmd run verify:app-template-editor-module` | passed |
| `npm.cmd run verify:ai-settings` | passed |
| `npm.cmd run verify:task-ordering-state` | passed |
| `npm.cmd run verify:companion` | passed with approved escalation for Windows Temp access |
| `npm.cmd run typecheck` | passed |

### Phase 316: Template And AI Review Cast Batch Narrowing
- [x] Batched remaining low-risk template/AI Review casts instead of splitting by seam.
- [x] Added focused RED checks for shared marker/render-type keys, recognized-template JSON parsing, fuzzy marker iteration, template renderer marker iteration, and render-label option iteration.
- [x] Exported canonical `REVIEW_MARKER_KEYS` and `RENDER_TYPES`; shared parsing/rendering code now iterates typed key lists instead of casting `Object.keys` / `Object.entries`.
- [x] Updated `sectionConfig` normalization to read records through guards, including fixed-block ids, daily block order, custom blocks, marker keys, and render types.
- [x] Updated `recognizeTemplate` JSON parsing to narrow parsed records, section entries, confidence, marker keys, and `SectionType` without trusted casts.
- [x] Updated `TemplateEditorModal` and `TemplateRecognitionModal` render-type option rendering to use `RENDER_TYPES.map(...)` instead of casted `Object.entries(...)`; removed the report-template custom-block cast.
- [x] Verified with focused scripts, adjacent template checks, and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Template And AI Review Cast Batch Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:section-config` before fix | failed as RED because `RENDER_TYPES` / marker-key guards were missing and casts remained |
| `npm.cmd run verify:recognize-template` before fix | failed as RED because parsed JSON was still cast to records/arrays |
| `npm.cmd run verify:fuzzy-match` before fix | failed as RED because fuzzy matching cast `Object.keys(SYNONYMS)` |
| `npm.cmd run verify:daily-template-markers` before fix | failed as RED because template rendering cast `Object.entries(BLOCK_KEYWORDS)` |
| `npm.cmd run verify:section-config` | passed |
| `npm.cmd run verify:recognize-template` | passed |
| `npm.cmd run verify:fuzzy-match` | passed |
| `npm.cmd run verify:daily-template-markers` | passed |
| `npm.cmd run verify:app-template-editor-module` | passed |
| `npm.cmd run verify:recognize-report` | passed |
| `npm.cmd run verify:obsidian-template-center` | passed |
| `npm.cmd run typecheck` | passed after adding `isFixedBlockId(...)` for daily block-order narrowing |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after the next broader shared/UI batch or on request)

### Phase 328: Obsidian Template/Sync Any-Cast Narrowing
- [x] Added a shared `ObsidianTemplateTask` shape so template rendering and sync preview no longer require full renderer `Task[]` inputs.
- [x] Removed Electron daily-note content `tasks as any` delegations.
- [x] Changed Obsidian sync task validation into a type predicate and replaced template/vault/preview `any` casts with guarded reads.
- [x] Verified with focused Obsidian template/sync scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Obsidian Template/Sync Any-Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-daily-note-content-module` before fix | failed as RED because daily-note content still delegated `tasks as any` |
| `npm.cmd run verify:electron-obsidian-sync-module` before fix | failed as RED because sync validation was not a type predicate and sync still used `as any` |
| `npm.cmd run verify:daily-template-markers` before fix | failed as RED because `ObsidianTemplateTask` was missing |
| `npm.cmd run verify:electron-obsidian-daily-note-content-module` | passed |
| `npm run verify:electron-obsidian-sync-module` | passed |
| `npm.cmd run verify:daily-template-markers` | passed |
| `npm run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 326: CSS Custom Property And Error-Code Cast Narrowing
- [x] Batched two CSS custom-property style casts and one Electron Companion error-code cast.
- [x] Added focused RED checks rejecting `as CSSProperties` style-object casts and the `error as { code?: unknown }` guard.
- [x] Replaced style-object casts with explicit custom-property intersection types and read EEXIST through the existing object guard.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## CSS Custom Property And Error-Code Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-item-stack-helper` before fix | failed as RED because `taskItemStack` still cast the custom-property style object with `as CSSProperties` |
| `npm.cmd run verify:settings-appearance-section` before fix | failed as RED because `AppearanceSettingsSection` still cast theme preset style objects with `as CSSProperties` |
| `npm.cmd run verify:electron-companion-ipc-module` before fix | failed as RED because `obsidianCompanion` still read `error.code` through `error as { code?: unknown }` |
| `npm.cmd run verify:task-item-stack-helper` | passed |
| `npm.cmd run verify:settings-appearance-section` | passed |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 327: TaskList DnD Activator Cast Narrowing
- [x] Removed the two TaskList drag-handle `ButtonHTMLAttributes` casts around dnd-kit activators.
- [x] Added focused RED checks rejecting the old casts and requiring dnd-kit activator types in `TaskDragHandleProps`.
- [x] Let `TaskDragHandleProps` expose `DraggableAttributes` and `DraggableSyntheticListeners` directly.
- [x] Verified with the focused DnD verifier and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## TaskList DnD Activator Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-list-dnd-module` before fix | failed as RED because `SortableTaskItem` still cast dnd-kit `attributes` / `listeners` to `ButtonHTMLAttributes<HTMLButtonElement>` |
| `npm.cmd run verify:task-list-dnd-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 325: Local Cast Bridge Narrowing
- [x] Batched four low-risk local cast bridges in Markdown editor caret measurement, scheduled-report diagnostics, and two AI Review settings sections.
- [x] Added focused RED checks rejecting `prop as any`, the scheduled-report double window cast, and tuple-array casts in the settings section option lists.
- [x] Replaced the Markdown style copy with typed CSS property indexing, exposed the scheduled-report diagnostic field through a local `Window` augmentation, and moved the settings tuples into explicitly typed readonly arrays.
- [x] Calibrated a stale scheduled-report verifier assertion from `result.error` to the current parsed-result boundary.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Local Cast Bridge Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:markdown-editor` before fix | failed as RED because `useMarkdownEditor` still copied mirror styles with `prop as any` casts |
| `npm.cmd run verify:app-scheduled-reports-module` before fix | failed as RED because scheduled-report diagnostics still double-cast `window` |
| `npm.cmd run verify:settings-ai-review-manual-generation-section` before fix | failed as RED because the manual-generation action list still used a tuple-array cast |
| `npm.cmd run verify:settings-ai-review-report-routing-section` before fix | failed as RED because the report-routing key list still used a tuple-array cast |
| `npm.cmd run verify:app-scheduled-reports-module` checkpoint | failed once on a stale verifier assertion that still expected `result.error`; updated it to `parsed.error` |
| `npm.cmd run verify:markdown-editor` | passed |
| `npm.cmd run verify:app-scheduled-reports-module` | passed |
| `npm.cmd run verify:settings-ai-review-manual-generation-section` | passed |
| `npm.cmd run verify:settings-ai-review-report-routing-section` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 323: Renderer Element Guard Cast Narrowing
- [x] Batched two remaining low-risk renderer DOM element casts in `PriorityPicker` and `useFloatingScrollbar`.
- [x] Added focused RED checks rejecting direct outside-click `event.target as Node` and `querySelector(...) as HTMLElement | null` casts.
- [x] Replaced both casts with `instanceof Node` / `HTMLElement` guards before containment or layout reads.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Renderer Element Guard Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-item-subtask-card-module` before fix | failed as RED because `PriorityPicker` still cast outside-click targets with `event.target as Node` |
| `npm.cmd run verify:app-main-content-module` before fix | failed as RED because `useFloatingScrollbar` still cast `querySelector(...)` results to `HTMLElement` |
| `npm.cmd run verify:task-item-subtask-card-module` | passed |
| `npm.cmd run verify:app-main-content-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 324: Shared Membership Guard Cast Narrowing
- [x] Batched two shared settings membership guards that cast literal arrays to broader string arrays before `includes(...)`.
- [x] Added focused RED checks rejecting `TEMPLATE_CUSTOM_TOKENS as readonly string[]` and `PROVIDERS as string[]`.
- [x] Replaced both casts with precomputed `Set<unknown>` membership guards.
- [x] Verified with template-source, AI settings, and TypeScript checkpoints; production build deferred for speed.
- **Status:** complete

## Shared Membership Guard Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:template-source-settings` before fix | failed as RED because `isTemplateCustomToken(...)` still cast `TEMPLATE_CUSTOM_TOKENS` to `readonly string[]` |
| `npm.cmd run verify:template-source-settings` | passed |
| `npm.cmd run verify:ai-settings` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 319: Shared Reader Record Guard Cast Narrowing
- [x] Batched two low-risk shared reader casts in model-list and AI Review progress parsing.
- [x] Added focused RED checks rejecting direct `value as Record<string, unknown>` casts in the shared readers.
- [x] Updated `readListModelsResult(...)` and `isAiReviewProgressEvent(...)` to narrow runtime objects through record guards before field reads.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Shared Reader Record Guard Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:openai-client` before fix | failed as RED because `readListModelsResult(...)` still cast `value as Record<string, unknown>` |
| `npm.cmd run verify:ai-run-diagnostics` before fix | failed as RED because `isAiReviewProgressEvent(...)` still cast `value as Record<string, unknown>` |
| `npm.cmd run verify:openai-client` | passed |
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 329: Personalization Appearance Override Cast Narrowing
- [x] Removed the remaining personalization `value as never` dynamic assignment cast.
- [x] Added focused RED coverage requiring typed key/value assignment through `setThemeAppearanceOverride(...)`.
- [x] Replaced the cast with a generic helper that preserves the relationship between each theme appearance key and its value type.
- [x] Verified with the focused personalization script and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Personalization Appearance Override Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-personalization-module` before fix | failed as RED because `extractThemeAppearanceOverride(...)` still used `value as never` |
| `npm.cmd run verify:app-personalization-module` | passed |
| `npm run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 330: Win32 Native Material Capability Cast Narrowing
- [x] Removed the final meaningful production BrowserWindow intersection cast in the Win32 native helper.
- [x] Added focused RED coverage requiring optional native material support to be narrowed through `hasNativeBackgroundMaterial(...)`.
- [x] Replaced the cast with a small capability type guard that probes `setBackgroundMaterial` via `Reflect.get(...)` before calling it.
- [x] Verified with the focused Win32/native script and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Win32 Native Material Capability Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-win32-native-module` before fix | failed as RED because the optional native material capability shape/guard was missing and `win as BrowserWindow & ...` remained |
| `npm.cmd run verify:electron-win32-native-module` | passed |
| `npm run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 320: Task Context Menu Record Guard Cast Narrowing
- [x] Batched the task context menu IPC/helper record casts around popup open/action payload guards.
- [x] Added focused RED checks rejecting direct `value as Record<string, unknown>` / `payload as Record<string, unknown>` casts.
- [x] Updated Electron and renderer task-menu guards to read runtime payload fields only after local record-guard narrowing.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Task Context Menu Record Guard Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-task-context-menu-ipc-module` before fix | failed as RED because task menu open/action payload guards still cast runtime values to `Record<string, unknown>` |
| `npm.cmd run verify:app-task-menu-actions-module` before fix | failed as RED because renderer task-menu action guard still cast runtime payloads to `Record<string, unknown>` |
| `npm.cmd run verify:electron-task-context-menu-ipc-module` | passed |
| `npm.cmd run verify:app-task-menu-actions-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 321: Task Menu Popup Action Cast Narrowing
- [x] Removed popup special-action double casts from edit/delete/add-subtask dispatch.
- [x] Added focused RED coverage in `verify:context-menu` rejecting `as unknown as Partial<Task>` in `TaskMenuPopup`.
- [x] Added a typed popup action update shape and let dispatch accept normal task updates or special action updates.
- [x] Verified with context-menu, task-menu action helper, and TypeScript checkpoints; production build deferred for speed.
- **Status:** complete

## Task Menu Popup Action Cast Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:context-menu` before fix | failed as RED because `TaskMenuPopup` still dispatched special actions via `as unknown as Partial<Task>` |
| `npm.cmd run verify:context-menu` | passed |
| `npm.cmd run verify:app-task-menu-actions-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 322: Renderer DOM Event Target Guard Narrowing
- [x] Batched three renderer event-target casts in keyboard shortcuts, date navigator outside-click handling, and titlebar more-menu outside-click handling.
- [x] Added focused RED checks rejecting direct `event.target as ...` casts in the touched modules.
- [x] Replaced casts with `instanceof HTMLElement` / `Node` / `Element` guards before reading DOM APIs.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Renderer DOM Event Target Guard Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-keyboard-shortcuts-module` before fix | failed as RED because shortcut typing detection cast `event.target as HTMLElement` |
| `npm.cmd run verify:date-navigator-module` before fix | failed as RED because calendar outside-click handling cast `event.target as Node` |
| `npm.cmd run verify:electron-window-ipc-module` before fix | failed as RED because TitleBar outside-click handling cast `event.target as HTMLElement` |
| `npm.cmd run verify:app-keyboard-shortcuts-module` | passed |
| `npm.cmd run verify:date-navigator-module` | passed |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/UI batch or on request)

### Phase 318: Obsidian Template/App Settings Cast Batch Narrowing
- [x] Finished the in-flight shared template/settings cast batch after switching to faster mode.
- [x] Added focused RED checks rejecting legacy Obsidian template module/object casts and daily-template compat `any` block scans.
- [x] Updated app settings/template-center normalization to read runtime fields through object/string guards.
- [x] Updated `shared/obsidianTemplates.ts` compat reads to preserve legacy fields through record/string/boolean helpers instead of broad `any` casts.
- [x] Verified with focused template checks, adjacent template-source settings, and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Obsidian Template/App Settings Cast Batch Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:obsidian-template-center` before fix | failed as RED because `normalizeTemplateModules(...)` still used `{} as ObsidianTemplateModules` |
| `npm.cmd run verify:daily-template-markers` before fix | failed as RED because `obsidianTemplates` compat still used `const a = t as any` |
| `npm.cmd run verify:obsidian-template-center` | passed |
| `npm.cmd run verify:daily-template-markers` | passed |
| `npm.cmd run verify:template-source-settings` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after the next broader shared/UI batch or on request)

### Phase 317: Electron AI Review Runtime Cast Batch Narrowing
- [x] Batched two low-risk Electron AI Review casts in template tools and daily runner code.
- [x] Added focused RED checks rejecting `cfg as ...` model-list config reads and `tasks as StatTask[]` daily-runner forwarding.
- [x] Updated model-list IPC to read runtime config through an object guard before field-level string/provider narrowing.
- [x] Updated daily runner to pass already validated `ElectronTask[]` directly to `runReviewForFile` instead of casting to stats tasks.
- [x] Verified with focused scripts and one TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Electron AI Review Runtime Cast Batch Narrowing Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` before fix | failed as RED because model-list config still used `cfg as { ... }` |
| `npm.cmd run verify:electron-ai-review-daily-runner-module` before fix | failed as RED because daily runner still used `tasks as StatTask[]` |
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-daily-runner-module` | passed with approved escalation for Windows Temp access |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after the next broader shared/UI batch or on request)

### Phase 331: Task List Order Parser Reuse
- [x] Moved stored task-list order parsing into `src/utils/taskOrdering.ts` as `parseTaskListOrderByDate(...)`.
- [x] Kept `parseStoredTaskListOrder(...)` as a persistence-layer compatibility wrapper.
- [x] Added focused RED coverage requiring the shared parser and rejecting duplicated persistence parsing logic.
- [x] Verified with task-ordering, task-persistence, and TypeScript checkpoints; production build deferred for speed.
- **Status:** complete

## Task List Order Parser Reuse Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-ordering-state` before fix | failed as RED because `src/utils/taskOrdering.ts` did not export `parseTaskListOrderByDate(...)` |
| `npm.cmd run verify:task-ordering-state` | passed |
| `npm.cmd run verify:task-persistence` | passed |
| `npm run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 342: LLM Model-List Response Validation
- [x] Added a failing contract regression for model-list network data and parser inputs.
- [x] Changed the model-list boundary to `unknown` and guarded response/model records before field reads.
- [x] Verified LLM client behavior, diagnostics integration, and TypeScript; production build deferred for speed.
- **Status:** complete

## LLM Model-List Response Validation Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:openai-client` before fix | failed as RED because model-list request/parser inputs still used `any` |
| `npm.cmd run verify:openai-client` | passed |
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 341: LLM Non-Streaming JSON Boundary Tightening
- [x] Added a failing structural regression against `any` at the non-streaming JSON response boundary.
- [x] Changed the parsed response value to `unknown` while preserving existing provider parsers.
- [x] Verified client behavior, diagnostics integration, and TypeScript; production build deferred for speed.
- **Status:** complete

## LLM Non-Streaming JSON Boundary Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:openai-client` before fix | failed as RED because non-streaming response JSON was declared as `any` |
| `npm.cmd run verify:openai-client` | passed |
| `npm.cmd run verify:ai-run-diagnostics` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 340: Mobile Inbox JSON Root Validation
- [x] Added a failing regression case for an array-root mobile JSON capture.
- [x] Required parsed JSON to pass the existing record guard before capture-field normalization.
- [x] Verified companion behavior, IPC structure, and TypeScript; production build deferred for speed.
- **Status:** complete

## Mobile Inbox JSON Root Validation Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:companion` before fix | failed as RED because array-root JSON did not report the required object shape |
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 339: LLM Diagnostic Aggregation Tightening
- [x] Traced all diagnostic-factory inputs and confirmed they use `LlmResult[]`.
- [x] Replaced the final report/bootstrap `llmResults?: any[]` declarations with `LlmResult[]`.
- [x] Verified diagnostics, daily runner, bootstrap, TypeScript, and the targeted no-`any` scan.
- **Status:** complete

## LLM Diagnostic Aggregation Tightening Verification

| Command | Result |
|---------|--------|
| report IPC and bootstrap verifiers before fix | failed as RED because diagnostic aggregation still used `any[]` |
| `npm.cmd run verify:electron-ai-review-report-ipc-types-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run verify:electron-ai-review-runtime-module` | passed |
| `npm.cmd run verify:electron-ai-review-daily-runner-module` | passed |
| `npm.cmd run typecheck` | passed |
| targeted `rg` scan | no remaining LLM `Promise<any>` / `llmResults?: any[]` matches |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 333: Task Completion-Review Validator Reuse
- [x] Centralized the existing task completion-review runtime predicate in task transforms.
- [x] Reused it for retained Obsidian review persistence parsing.
- [x] Added focused RED coverage rejecting duplicate persistence validation.
- [x] Verified with persistence, task-state, and TypeScript checkpoints; production build deferred for speed.
- **Status:** complete

### Phase 334: Shared Task-Date Resolver Reuse
- [x] Added a shared task-date resolver with an explicit caller-provided fallback.
- [x] Replaced repeated fallback chains in task transforms, date navigation, Obsidian templates, and Electron task helpers.
- [x] Added RED coverage for the missing shared export and behavior coverage for precedence/fallback preservation.
- [x] Verified focused consumers plus TypeScript; production build deferred for speed.
- **Status:** complete

## Shared Task-Date Resolver Reuse Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:date-key-reuse` before fix | failed as RED because the shared resolver did not exist |
| `npm.cmd run verify:date-key-reuse` | passed |
| `npm.cmd run verify:date-navigator-module` | passed |
| `npm.cmd run verify:electron-task-date-helpers-module` | passed |
| `npm.cmd run verify:daily-template-markers` | passed |
| `npm.cmd run verify:task-hook-state` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 335: AI Stats Task-Date Resolver Reuse
- [x] Replaced the AI stats-local task-date fallback chain with the shared resolver and its existing empty fallback.
- [x] Added RED coverage requiring shared resolver reuse.
- [x] Verified AI stats, date-key reuse, and TypeScript; production build deferred for speed.
- **Status:** complete

## AI Stats Task-Date Resolver Reuse Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:ai-stats` before fix | failed as RED because AI stats did not reuse the shared resolver |
| `npm.cmd run verify:ai-stats` | passed |
| `npm.cmd run verify:date-key-reuse` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 336: Companion Capture Task-Date Resolver Reuse
- [x] Replaced the Companion capture filter's local task-date chain with the shared resolver and empty fallback.
- [x] Added RED behavior coverage for legacy `createdAt` capture selection and source reuse.
- [x] Verified Companion capture, date-key reuse, and TypeScript; production build deferred for speed.
- **Status:** complete

## Companion Capture Task-Date Resolver Reuse Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-companion-capture-module` before fix | failed as RED because taskStore did not reuse the shared resolver |
| `npm.cmd run verify:app-companion-capture-module` | passed |
| `npm.cmd run verify:date-key-reuse` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 337: Shared Date-Key Local-Date Conversion
- [x] Added a shared local-calendar date-key conversion next to path template expansion.
- [x] Removed duplicate conversions from Obsidian template and AI Review source path handling.
- [x] Added RED coverage and verified both consumers plus TypeScript; production build deferred for speed.
- **Status:** complete

## Shared Date-Key Local-Date Conversion Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:source-materials` before fix | failed as RED because the shared conversion export did not exist |
| `npm.cmd run verify:source-materials` | passed |
| `npm.cmd run verify:daily-template-markers` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 338: LLM IPC Result-Contract Tightening
- [x] Replaced LLM IPC `Promise<any>` dependency declarations with the shared `Promise<LlmResult>` union.
- [x] Added focused RED assertions for each dependency boundary.
- [x] Verified all affected IPC modules, main-window bootstrap, and TypeScript; production build deferred for speed.
- **Status:** complete

### Phase 343: LLM SSE Event-Boundary Tightening
- [x] Changed SSE parser and aggregation request boundary from `any[]` to `unknown[]`.
- [x] Narrowed Anthropic, Gemini, and OpenAI stream event envelopes before field reads.
- [x] Added RED/GREEN structural coverage and ran diagnostics plus TypeScript verification.
- **Status:** complete

### Phase 344: OpenAI-Compatible Text Extraction Tightening
- [x] Replaced `any` helper inputs with `unknown` for content, choice, and top-level response extraction.
- [x] Added explicit record narrowing for compatibility response envelopes and segmented content entries.
- [x] Verified RED/GREEN plus diagnostics and TypeScript without changing fallback or whitespace behavior.
- **Status:** complete

### Phase 345: Provider Response Parser-Contract Tightening
- [x] Changed provider non-streaming parse/truncation contracts from `any` to `unknown`.
- [x] Narrowed Anthropic, Gemini, and OpenAI response envelopes and text parts without changing compatibility behavior.
- [x] Verified RED/GREEN, diagnostics, and TypeScript; isolated remaining `any` usage to usage diagnostics.
- **Status:** complete

### Phase 346: LLM Usage-Diagnostics Boundary Tightening
- [x] Replaced the final `any` usage-helper inputs with `unknown` and `unknown[]`.
- [x] Narrowed SSE event, response, and provider usage records before token-field access.
- [x] Verified token mappings and usage-only diagnostics; production scan confirms no `any` remains in `openaiClient.ts`.
- **Status:** complete

### Phase 347: Task-Menu Multi-Display Placement
- [x] Select the display nearest the popup trigger point before clamping its bounds.
- [x] Preserve primary-display fallback behavior for malformed coordinates.
- [x] Calibrate the context-menu verifier to the shared task visible-date helper.
- **Status:** complete

### Phase 348: Template Recognition Duplicate Heading Handling
- [x] Retain the first custom block for a duplicated Markdown H2 heading.
- [x] Lower recognition confidence when a duplicate heading is skipped.
- [x] Add a focused parser regression verifier and run related checks.
- **Status:** complete

## LLM IPC Result-Contract Tightening Verification

| Command | Result |
|---------|--------|
| focused IPC verifiers before fix | failed as RED because declarations still used `Promise<any>` |
| `npm.cmd run verify:electron-ai-review-ipc-registration-types-module` | passed |
| `npm.cmd run verify:electron-ai-review-report-ipc-types-module` | passed |
| `npm.cmd run verify:electron-ai-review-template-tools-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-backfill-ipc-module` | passed |
| `npm.cmd run verify:electron-ai-review-external-report-ipc-module` | passed |
| `npm.cmd run verify:electron-obsidian-ipc-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

## Task Completion-Review Validator Reuse Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-persistence` before fix | failed as RED because task transforms did not export the shared validator |
| `npm.cmd run verify:task-persistence` | passed |
| `npm.cmd run verify:task-hook-state` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 332: Companion Validator Reuse
- [x] Replaced Electron-local companion rule/template validators with the shared validation exports.
- [x] Added focused RED coverage rejecting duplicate Electron validators.
- [x] Verified with the companion verifier and TypeScript checkpoint; production build deferred for speed.
- **Status:** complete

## Companion Validator Reuse Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:companion` before fix | failed as RED because the Electron companion did not yet import the shared validators |
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run typecheck` | passed |

Deferred under speed mode:
- `npm.cmd run build` (last passed Phase 314; run after a broader shared/parser batch or on request)

### Phase 349: Obsidian Template Task-Line Module Extraction
- [x] Extracted task-line rendering and visible task/review statistics from `shared/obsidianTemplates.ts` into `shared/obsidianTemplateTaskLines.ts`.
- [x] Kept existing callers stable by re-exporting task-line types and `buildTaskLines` from `shared/obsidianTemplates.ts`.
- [x] Preserved sync-preview task/review counting behavior through the shared visible-task stats helper.
- [x] Reduced `shared/obsidianTemplates.ts` below the 300-line large-file threshold.
- **Status:** complete

## Obsidian Template Task-Line Module Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:daily-template-markers` before extraction | failed as RED because `shared/obsidianTemplateTaskLines.ts` did not exist |
| `npm.cmd run verify:daily-template-markers` | passed |
| `npm.cmd run verify:daily-markdown-template` | passed |
| `npm.cmd run verify:obsidian-template-center` | passed |
| `npm.cmd run typecheck` | passed |
| `npx.cmd tsx scripts/verify-subtask-obsidian-sync.ts` | passed |
| `npx.cmd tsx scripts/verify-review-empty-fields.ts` | passed |
| `npm.cmd run verify:task-obsidian-sync` | passed |
| `npm.cmd run verify:review-fields` | passed |
| `git diff --check -- shared/obsidianTemplates.ts shared/obsidianTemplateTaskLines.ts scripts/verify-daily-template-markers.ts` | passed with only LF-to-CRLF working-copy warnings |

Current large-file count after Phase 349:
- 14 production files remain at 300+ lines.
- 6 production files remain at 400+ lines.

### Phase 358: Loaded Task UI State Startup IPC Elimination
- [x] Identified redundant Store persistence after the initial UI state load.
- [x] Primed the renderer-side UI persistence baseline before enabling post-load effects.
- [x] Reused one complete UI state snapshot builder for persistence and baseline priming.
- [x] Added focused regression coverage and ran task-core verification.
- **Status:** complete

## Loaded Task UI State Startup IPC Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-persistence` before implementation | failed as RED because `primeTaskUiStatePersistence` was not exported |
| `npm.cmd run verify:task-persistence` | passed |
| `npm.cmd run verify:task-core` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts` | passed |

### Phase 359: TaskMenuPopup Pane Module Extraction
- [x] Added RED structural coverage requiring task-menu popup pane UI to live outside `src/components/TaskMenuPopup.tsx`.
- [x] Extracted menu/date/tag/subtask pane components and tag suggestion filtering to `src/components/taskMenuPopup/TaskMenuPopupPanes.tsx`.
- [x] Kept `TaskMenuPopup.tsx` focused on URL payload parsing, theme/window effects, pane selection, and IPC dispatch bridging.
- [x] Preserved the existing `getTagSuggestions` and `parseTaskMenuPopupPayload` exports for current verifier/import callers.
- [x] Reduced `src/components/TaskMenuPopup.tsx` below the 300-line large-file threshold.
- **Status:** complete

## TaskMenuPopup Pane Module Extraction Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:context-menu` before extraction | failed as RED because `src/components/taskMenuPopup/TaskMenuPopupPanes.tsx` did not exist |
| `npm.cmd run verify:context-menu` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- src/components/TaskMenuPopup.tsx scripts/verify-context-menu.ts` | passed with only LF-to-CRLF working-copy warnings |
| `git diff --no-index --check -- <empty-temp-file> src/components/taskMenuPopup/TaskMenuPopupPanes.tsx` | no whitespace errors; no-index returned 1 only because the compared files differ |

Current large-file count after Phase 359:
- 11 production files remain at 300+ lines.
- 5 production files remain at 400+ lines.

### Phase 360: Loaded Task And Carryover Startup IPC Elimination
- [x] Identified task-tree and carryover-ledger writes that repeated Store-loaded values at startup.
- [x] Added a task persistence baseline for an unchanged loaded task tree.
- [x] Retained initialization writeback when normalization or automatic carryover changes tasks or the ledger.
- [x] Added RED/GREEN regression coverage and ran task-core, typecheck, and production build.
- **Status:** complete

## Loaded Task And Carryover Startup IPC Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-persistence` before implementation | failed as RED because task persistence had no `prime` capability |
| `npm.cmd run verify:task-persistence` | passed |
| `npm.cmd run verify:task-carryover` | passed |
| `npm.cmd run verify:task-core` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts` | passed |

### Phase 361: Business-Date Rollover No-Op Update Elimination
- [x] Identified unconditional task and ledger updates during a rollover with no carryover result.
- [x] Preserved task-list identity and skipped ledger IPC when rollover produced no data change.
- [x] Reused carryover-ledger equality for startup and rollover decisions.
- [x] Added RED/GREEN coverage and ran task-core, typecheck, and production build.
- **Status:** complete

## Business-Date Rollover No-Op Update Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-persistence` before implementation | failed as RED because rollover unconditionally wrote the ledger |
| `npm.cmd run verify:task-persistence` | passed |
| `npm.cmd run verify:task-carryover` | passed |
| `npm.cmd run verify:task-core` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/hooks/taskPersistence.ts src/hooks/useTasks.ts scripts/verify-task-persistence.ts` | passed |

### Phase 362: Retained Review Empty-Write IPC Elimination
- [x] Identified the settings-save path that rewrote an already empty retained-review Store value.
- [x] Preserved the previous empty state reference and skipped Store IPC in the no-op case.
- [x] Kept existing behavior for non-empty retained reviews: clear local state and persist the empty value.
- [x] Added RED/GREEN regression coverage and ran task-core, typecheck, and production build.
- **Status:** complete


## Retained Review Empty-Write IPC Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-hook-state` before implementation | failed as RED because settings updates unconditionally cleared and persisted retained reviews |
| `npm.cmd run verify:task-hook-state` | passed |
| `npm.cmd run verify:task-core` | passed |
| `npm.cmd run typecheck` | passed before concurrent `ReviewView.tsx` edits; current full check is blocked by unrelated duplicate/local declaration conflicts and missing `getCompletionReviews` |
| `npm.cmd run build` | passed |
| `git diff --check -- src/hooks/useTasks.ts scripts/verify-task-hook-state.ts` | passed with only LF-to-CRLF working-copy warnings |

### Phase 363: Duplicate App-Settings Submission Elimination
- [x] Identified duplicate app-settings submissions that replaced state and crossed IPC despite no persisted behavior change.
- [x] Added an explicit renderer-side comparison for the complete `AppBehaviorSettings` scalar contract.
- [x] Preserved retained-review cleanup independently from the settings no-op guard.
- [x] Added RED/GREEN regression coverage and ran task-core, typecheck, and production build.
- **Status:** complete

## Duplicate App-Settings Submission Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-hook-state` before implementation | failed as RED because `areAppBehaviorSettingsEqual` was not available |
| `npm.cmd run verify:task-hook-state` | passed |
| `npm.cmd run verify:task-core` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/hooks/taskHookState.ts src/hooks/useTasks.ts scripts/verify-task-hook-state.ts` | passed with only LF-to-CRLF working-copy warnings |

### Phase 364: App UI State Startup Hydration Persistence Guard
- [x] Identified UI-state persistence that could write default renderer values before asynchronous Store hydration completed.
- [x] Added a hydration guard and loaded Store snapshot baseline for compact mode, panel state, filters, personalization, theme overrides, and dark mode.
- [x] Reused one snapshot-builder for baseline and normal persistence so equality uses identical payload shapes.
- [x] Added RED/GREEN focused verification and ran typecheck and production build.
- **Status:** complete

## App UI State Startup Hydration Persistence Guard Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-ui-state-persistence-module` before implementation | failed as RED because `primeAppUiStatePersistence` did not exist |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/app/appUiStatePersistence.ts scripts/verify-app-ui-state-persistence-module.ts` | passed |
| `npm.cmd run verify:cleanup-core` | unrelated failure: `verify-app-shell-composition-module` still expects an old `calendarTasks` expression while current parallel App refactor uses `createAppTaskView(...)` |

### Phase 365: Companion Settings Duplicate Submission Elimination
- [x] Identified equivalent Companion-settings submissions that still replaced renderer state and crossed the settings IPC boundary.
- [x] Added shared structural equality for the normalized Companion settings contract.
- [x] Preserved the existing UI-first ordering for actual Companion settings changes.
- [x] Added RED/GREEN regression coverage and ran focused checks, typecheck, and production build.
- **Status:** complete

## Companion Settings Duplicate Submission Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-companion-actions-module` before implementation | failed as RED because an equivalent deep-copied settings value still updated state |
| `npm.cmd run verify:app-companion-actions-module` | passed |
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run verify:electron-companion-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- shared/obsidianCompanionDefaults.ts src/app/appCompanionActions.ts src/App.tsx scripts/verify-app-companion-actions-module.ts` | passed with only LF-to-CRLF working-copy warnings |

### Phase 365: ReviewView Grouping Module Extraction
- [x] Added RED structural verification requiring `src/components/reviewView/reviewGrouping.ts` and keeping `ReviewView.tsx` under 300 lines.
- [x] Extracted date-key, date-label, timestamp formatting, and review date/task grouping helpers from `src/components/ReviewView.tsx`.
- [x] Preserved `ReviewView` rendering and edit/delete behavior while moving pure grouping responsibility to the helper module.
- [x] Ran focused review verification, TypeScript, whitespace checks, and a production large-file rescan.
- **Status:** complete

## ReviewView Grouping Module Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:review-fields` before implementation | failed as RED because `src/components/reviewView/reviewGrouping.ts` did not exist |
| `npm.cmd run verify:review-fields` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- src/components/ReviewView.tsx scripts/verify-review-empty-fields.ts` | passed with only LF-to-CRLF working-copy warnings |
| `git diff --no-index --check -- <empty-temp-file> src/components/reviewView/reviewGrouping.ts` | no whitespace errors; only LF-to-CRLF warning |

Current large-file count after Phase 365:
- 10 production files remain at 300+ lines.
- 5 production files remain at 400+ lines.

### Phase 366: Personalization No-Op Update Elimination
- [x] Identified equivalent personalization submissions that replaced renderer state and rebuilt theme overrides without a visible or persisted change.
- [x] Added complete structural equality for the `PersonalizationSettings` contract before the change action mutates state.
- [x] Preserved theme-override remembering for genuine personalization changes.
- [x] Added RED/GREEN regression coverage and ran focused persistence, TypeScript, and production-build verification.
- **Status:** complete

## Personalization No-Op Update Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-personalization-module` before implementation | failed as RED because an equivalent deep-copied personalization still updated renderer state |
| `npm.cmd run verify:app-personalization-module` | passed |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/app/appPersonalization.ts scripts/verify-app-personalization-module.ts` | passed |

### Phase 368: AI Review Profile Module Extraction
- [x] Added RED structural verification requiring `shared/aiReview/aiReviewProfiles.ts` and keeping `aiReviewSettings.ts` under 300 lines.
- [x] Extracted AI profile types, provider guards, profile normalization, default profile creation, active-profile resolution, and report-profile routing from `shared/aiReview/aiReviewSettings.ts`.
- [x] Preserved the existing `aiReviewSettings.ts` public import surface through re-exports so existing callers keep working unchanged.
- [x] Ran focused AI settings/profile routing/profile ops verification, TypeScript, whitespace checks, and a production large-file rescan.
- **Status:** complete

## AI Review Profile Module Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:ai-settings` before implementation | failed as RED because `shared/aiReview/aiReviewProfiles.ts` did not exist |
| `npm.cmd run verify:ai-settings` | passed |
| `npm.cmd run verify:report-profile-routing` | passed |
| `npm.cmd run verify:profile-ops` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- shared/aiReview/aiReviewSettings.ts scripts/verify-ai-settings.ts` | passed with only LF-to-CRLF working-copy warnings |
| `git diff --no-index --check -- <empty-temp-file> shared/aiReview/aiReviewProfiles.ts` | no whitespace errors; only LF-to-CRLF warning |

Current large-file count after Phase 368:
- 9 production files remain at 300+ lines.
- 5 production files remain at 400+ lines.

### Phase 367: Theme Preset And Reset No-Op Elimination
- [x] Identified unconditional state replacement when reapplying the current theme preset or resetting an already-default theme without an override.
- [x] Added structural comparison for theme opacity override records and reused complete personalization equality before state setters.
- [x] Preserved actual preset application and reset behavior when personalization or the override map differs.
- [x] Added RED/GREEN behavior coverage and ran focused persistence, TypeScript, and production-build verification.
- **Status:** complete

## Theme Preset And Reset No-Op Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-personalization-module` before implementation | failed as RED because reapplying the active preset still replaced personalization state |
| `npm.cmd run verify:app-personalization-module` | passed |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/app/appPersonalization.ts scripts/verify-app-personalization-module.ts` | passed |

### Phase 368: Hydrated Theme Override State Consolidation
- [x] Identified two consecutive theme-override setter updates during App UI-state hydration.
- [x] Combined loaded-personalization seeding and stored override merge into one structural, reference-preserving helper.
- [x] Preserved the persisted baseline payload and loaded override precedence.
- [x] Added RED/GREEN behavior coverage and ran focused UI-state, TypeScript, and production-build verification.
- **Status:** complete

## Hydrated Theme Override State Consolidation Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-personalization-module` before implementation | failed as RED because `mergeLoadedThemeOverrides` was not exported |
| `npm.cmd run verify:app-personalization-module` | passed |
| `npm.cmd run verify:app-ui-state-persistence-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/app/appPersonalization.ts src/app/appUiStatePersistence.ts scripts/verify-app-personalization-module.ts scripts/verify-app-ui-state-persistence-module.ts` | passed |

### Phase 369: TitleBar Pinned-State Refresh Deduplication
- [x] Identified repeated `setPinned(...)` calls from focus, visibility, window-mode broadcasts, and pin-toggle fallbacks even when the displayed boolean was unchanged.
- [x] Added a ref-backed state guard that only schedules a React pinned-state update when the value changes.
- [x] Preserved all existing window-mode parsing and pin-toggle fallback behavior.
- [x] Added RED/GREEN verification and ran focused Electron-window, TypeScript, and production-build checks.
- **Status:** complete

## TitleBar Pinned-State Refresh Deduplication Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before implementation | failed as RED because `setPinnedIfChanged(...)` did not exist |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- src/components/TitleBar.tsx scripts/verify-electron-window-ipc-module.ts` | passed with only LF-to-CRLF working-copy warning |

### Phase 370: Startup Settings Equivalent-State Elimination
- [x] Identified startup IPC responses that can be structurally equivalent to App's newly created default Companion and template settings while still replacing their state references.
- [x] Added reusable complete equality for Obsidian template settings and reused the existing Companion equality contract.
- [x] Updated startup success and fallback paths to preserve existing state references when the resolved settings are equivalent.
- [x] Added RED/GREEN behavior coverage and ran focused startup, TypeScript, and production-build checks.
- **Status:** complete

## Startup Settings Equivalent-State Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-startup-settings-module` before implementation | failed as RED because a deep-copied default Companion setting replaced the initial state reference |
| `npm.cmd run verify:app-startup-settings-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed |
| `git diff --check -- shared/appSettings.ts src/app/appStartupSettings.ts scripts/verify-app-startup-settings-module.ts` | passed with only LF-to-CRLF working-copy warning |

### Phase 371: Electron Main Obsidian Services Extraction
- [x] Added RED structural verification requiring `electron/mainObsidianServices.ts` and keeping `electron/main.ts` under 300 lines.
- [x] Extracted Obsidian daily-note and sync helper composition from `electron/main.ts` into `electron/mainObsidianServices.ts`.
- [x] Preserved date helper injection, AI review runner bridge injection, blog draft directory injection, and returned service API used by main-window startup wiring.
- [x] Ran focused Electron main/Obsidian verification, TypeScript, whitespace checks, and a production large-file rescan.
- **Status:** complete

## Electron Main Obsidian Services Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-main-modules` before implementation | failed as RED because `electron/mainObsidianServices.ts` did not exist |
| `npm.cmd run verify:electron-main-modules` | passed |
| `npm.cmd run verify:electron-obsidian-daily-note-content-module` | passed |
| `npm.cmd run verify:electron-obsidian-sync-module` | passed |
| `npm.cmd run verify:electron-main-window-bootstrap-module` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- electron/main.ts scripts/verify-electron-main-modules.ts scripts/verify-electron-obsidian-daily-note-content-module.ts scripts/verify-electron-obsidian-sync-module.ts` | passed with only LF-to-CRLF working-copy warnings |
| `git diff --no-index --check -- <empty-temp-file> electron/mainObsidianServices.ts` | no whitespace errors; only LF-to-CRLF warning |

Current large-file count after Phase 371:
- 8 production files remain at 300+ lines.
- 5 production files remain at 400+ lines.

### Phase 372: Electron Obsidian Sync Daily-Note Boundary Extraction
- [x] Added RED structural verification requiring `electron/obsidianSyncDailyNote.ts`, `electron/obsidianSyncValidation.ts`, and keeping `electron/obsidianSync.ts` under 300 lines.
- [x] Extracted unknown task payload validation from `electron/obsidianSync.ts` into `electron/obsidianSyncValidation.ts`.
- [x] Extracted daily-note path resolution, single-note write/update behavior, managed-block no-op write checks, and overview refresh triggering into `electron/obsidianSyncDailyNote.ts`.
- [x] Kept `electron/obsidianSync.ts` focused on vault validation, affected-date collection, sync orchestration, blog-draft output, AI review triggering, and preview aggregation.
- [x] Ran focused Obsidian sync/main verification, TypeScript, whitespace checks, and a production large-file rescan.
- **Status:** complete

## Electron Obsidian Sync Daily-Note Boundary Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-obsidian-sync-module` before implementation | failed as RED because `electron/obsidianSyncDailyNote.ts` did not exist |
| `npm.cmd run verify:electron-obsidian-sync-module` | passed |
| `npm.cmd run verify:electron-main-modules` | passed |
| `npm.cmd run verify:electron-obsidian-daily-note-content-module` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- electron/obsidianSync.ts scripts/verify-electron-obsidian-sync-module.ts` | passed |
| `git diff --no-index --check -- <empty-temp-file> electron/obsidianSyncDailyNote.ts` | no whitespace errors; only LF-to-CRLF warning |
| `git diff --no-index --check -- <empty-temp-file> electron/obsidianSyncValidation.ts` | no whitespace errors; only LF-to-CRLF warning |

Current large-file count after Phase 372:
- 7 production files remain at 300+ lines.
- 4 production files remain at 400+ lines.

### Phase 372: Auto-Start Renderer State Refresh Deduplication
- [x] Added a RED verification that requires auto-start reads and mutations to retain the current renderer state when Electron returns the same boolean.
- [x] Added a shared local auto-start state guard backed by a ref, used by both startup reads and mutation responses.
- [x] Preserved strict boolean narrowing at the preload boundary and the existing main-process no-op persistence behavior.
- [x] Ran focused verification, TypeScript, production build, and scoped whitespace checks.
- **Status:** complete

## Auto-Start Renderer State Refresh Deduplication Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:electron-window-ipc-module` before implementation | failed as RED because `setAutoStartIfChanged(...)` did not exist |
| `npm.cmd run verify:electron-window-ipc-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | passed; normal Vite chunk-size warning remains (`App` 673.06 kB) |
| `git diff --check -- src/components/settings/SettingsControls.tsx scripts/verify-electron-window-ipc-module.ts` | passed with only LF-to-CRLF working-copy warning |

### Phase 373: Priority Picker No-Op Change Elimination
- [x] Identified that selecting the currently active task or subtask priority still invoked the shared parent update callback.
- [x] Kept the menu-close behavior while skipping the no-op parent callback for an unchanged priority.
- [x] Added RED/GREEN focused verification and ran TypeScript validation.
- [ ] Re-run production build after the concurrent `electron/obsidianSync.ts` extraction resolves its duplicate helper declarations.
- **Status:** implementation complete; production-build verification externally blocked by concurrent worktree changes.

## Priority Picker No-Op Change Elimination Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:task-item-subtask-card-module` before implementation | failed as RED because selecting an option unconditionally called `onChange(priority)` |
| `npm.cmd run verify:task-item-subtask-card-module` | passed |
| `npm.cmd run typecheck` | passed |
| `npm.cmd run build` | blocked by pre-existing concurrent extraction overlap in `electron/obsidianSync.ts`: duplicate declarations of `getDailyFilePath`, `triggerOverviewUpdate`, `readDailyNoteFileIfPresent`, and `syncOneDailyNote` |
| `git diff --check -- src/components/PriorityPicker.tsx scripts/verify-task-item-subtask-card-module.ts` | passed with only LF-to-CRLF working-copy warning |

### Phase 374: App Shell Overlay Composition Extraction
- [x] Added/calibrated structural verification requiring App shell overlay prop assembly to live outside `appShellComposition.tsx`.
- [x] Extracted overlay composition into `src/app/appShellOverlayComposition.ts` and reused the exported options type from `AppShellCompositionOptions`.
- [x] Preserved settings, companion, completion, review, template-editor, onboarding, and overlay-stack prop wiring.
- [x] Ran focused App shell verifications, TypeScript, scoped whitespace checks, and a production large-file rescan.
- **Status:** complete

## App Shell Overlay Composition Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:app-shell-composition-module` before implementation | failed as RED because `appShellComposition.tsx` had not delegated overlay prop assembly to `appShellOverlayComposition` |
| `npm.cmd run verify:app-shell-composition-module` | passed |
| `npm.cmd run verify:date-navigator-module` | passed |
| `npm.cmd run verify:app-main-content-module` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- src/app/appShellComposition.tsx src/app/appShellOverlayComposition.ts scripts/verify-app-shell-composition-module.ts` | passed with no whitespace errors |

Current large-file count after Phase 374:
- 6 production files remained at 300+ lines.
- 4 production files remained at 400+ lines.

### Phase 375: SettingsPanel AI Review State Hook Extraction
- [x] Added RED structural verification requiring `src/components/settings/useAiReviewSettingsPanelState.ts` and keeping `SettingsPanel.tsx` under 300 lines.
- [x] Extracted AI Review settings loading, progress subscription, deferred settings persistence, diagnostic state, generation orchestration, and source/week option construction into the hook.
- [x] Kept `SettingsPanel.tsx` responsible for open/null rendering, section navigation, section metadata, and section composition.
- [x] Calibrated stale AI Review structure verifiers so side effects are checked in the hook while `AiReviewSettingsSection` remains presentational.
- [x] Ran focused SettingsPanel/AI Review verification, TypeScript, scoped whitespace checks, and a production large-file rescan.
- **Status:** complete

## SettingsPanel AI Review State Hook Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:settings-panel-modules` before implementation | failed as RED because `useAiReviewSettingsPanelState.ts` did not exist |
| `npm.cmd run verify:settings-panel-modules` | passed |
| `npm.cmd run verify:settings-ai-review-module` | passed |
| `npm.cmd run verify:settings-ai-review-section` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- src/components/SettingsPanel.tsx src/components/settings/useAiReviewSettingsPanelState.ts scripts/verify-settings-panel-modules.ts scripts/verify-settings-ai-review-module.ts scripts/verify-settings-ai-review-section.ts` | passed with only LF-to-CRLF working-copy warnings |
| `git diff --no-index --check -- <empty-temp-file> src/components/settings/useAiReviewSettingsPanelState.ts` | no whitespace errors; only LF-to-CRLF warning |

Current large-file count after Phase 375:
- 5 production files remain at 300+ lines.
- 4 production files remain at 400+ lines.

### Phase 376: Obsidian Companion Mobile Inbox Extraction
- [x] Added RED structural verification requiring `electron/obsidianCompanionMobileInbox.ts`, keeping `electron/obsidianCompanion.ts` under 300 lines, and preserving `importMobileInbox` through the existing entrypoint.
- [x] Extracted mobile inbox import validation, capture parsing, processed/failed directory setup, unique destination reservation, and file-moving helpers into `electron/obsidianCompanionMobileInbox.ts`.
- [x] Kept sync planning, rule matching, template rendering, and sync plan writing in `electron/obsidianCompanion.ts`.
- [x] Ran focused Companion verification, TypeScript, scoped whitespace checks, and a production large-file rescan.
- **Status:** complete

## Obsidian Companion Mobile Inbox Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:companion` before implementation | failed as RED because `electron/obsidianCompanionMobileInbox.ts` did not exist |
| `npm.cmd run verify:companion` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- electron/obsidianCompanion.ts electron/obsidianCompanionMobileInbox.ts electron/obsidianCompanion.verify.ts` | passed with only LF-to-CRLF working-copy warnings |

Current large-file count after Phase 376:
- 4 production files remain at 300+ lines.
- 4 production files remain at 400+ lines.

### Phase 377: i18n Shell Text Module Split
- [x] Added RED structural verification requiring static shell text to live outside the `src/i18n.ts` entrypoint.
- [x] Extracted Chinese and English shell/settings text into focused modules under `src/i18n/` while preserving `getShellText(...)` as the public entrypoint.
- [x] Calibrated stale verifiers so i18n text checks read the combined module sources instead of only the thin entrypoint.
- [x] Ran focused i18n/template/RC/UX verifications, TypeScript validation, scoped whitespace checks, and a production large-file rescan.
- **Status:** complete

## i18n Shell Text Module Split Verification

| Command | Result |
|---------|--------|
| `npm.cmd run verify:ux-polish` before verifier calibration | failed as RED because the verifier only read `src/i18n.ts` and could no longer see extracted inspiration strings |
| `npm.cmd run verify:ux-polish` | passed |
| `npm.cmd run verify:task-list-interactions` | passed |
| `npm.cmd run verify:i18n-shell-text-module` | passed |
| `npm.cmd run verify:legacy-task-export-path-cleanup` | passed |
| `npm.cmd run verify:template-source-i18n` | passed |
| `npm.cmd run verify:rc-strings` | passed |
| `npm.cmd run typecheck` | passed |
| `git diff --check -- ...` | passed with only LF-to-CRLF working-copy warnings |

Current large-file count after Phase 377:
- 1 production file remains at 300+ lines.
- 1 production file remains at 400+ lines.

### Phase 378: App Runtime And Composition Extraction
- [x] Added RED structural verification requiring `src/App.tsx` under 300 lines and App runtime/composition responsibilities outside the entrypoint.
- [x] Extracted local state, runtime side effects, and shell composition input wiring while preserving existing behavior.
- [x] Calibrated existing App-focused verifiers to follow the new hook boundaries instead of requiring direct calls in `App.tsx`.
- [x] Ran focused App verifications, the cleanup-core regression suite, TypeScript, production build, and a production large-file rescan.
- **Status:** complete

## Large-File Cleanup Completion

- The production-source scan excludes generated output, scripts, docs, and test files.
- All 270 scanned production files are below the 300-line large-file threshold; no production file remains at or above 300 lines.
- `npm.cmd run verify:cleanup-core` passed, including `npm.cmd run typecheck`.
- `npm.cmd run build` passed.

### Phase 379: AI Account Manager Presentation Split
- [x] Added RED structural checks for extracted AI account list and detail components.
- [x] Moved profile-list rendering into `AiAccountList.tsx` and account-field rendering into `AiAccountDetails.tsx`.
- [x] Kept model-list IPC, fetch state, modal shell, and current-profile resolution in `AiAccountManager.tsx`.
- [x] Updated AI Review structural verification to follow the provider validation into the detail component.
- [x] Ran focused verifiers, TypeScript validation, production build, whitespace check, and a fresh large-file scan.
- **Status:** complete

### Phase 380: Template Editor Block List Extraction
- [x] Added RED structural verification requiring `TemplateEditorBlockList.tsx` to own sortable template-list rendering.
- [x] Moved DnD context, daily/report row rendering, and block-control composition out of `TemplateEditorModal.tsx`.
- [x] Kept template state, mutation callbacks, recognition, save/reset, and modal shell in `TemplateEditorModal.tsx`.
- [x] Updated the section-config verifier to validate the extracted render-control boundary.
- [x] Ran focused verifiers, whitespace check, and a fresh large-file scan.
- [ ] Global typecheck/build are currently blocked by an unrelated syntax error in `ReviewView.tsx`.
- **Status:** complete with external verification blocker recorded

### Phase 381: LLM Provider Response Parsing Extraction
- [x] Added a red/green verifier requirement for a dedicated unknown-safe provider response parsing module.
- [x] Extracted SSE parsing, provider-specific response parsing, stream aggregation, token usage extraction, and model-list parsing to `shared/llm/llmProviderResponseParsing.ts`.
- [x] Kept `shared/llm/llmProviderProtocol.ts` focused on provider request URL, headers, payload construction, and stable re-exports.
- [x] Preserved the public `openaiClient.ts` API and all OpenAI-compatible, Anthropic, and Gemini client behavior.
- [x] Ran focused LLM verification, TypeScript typecheck, production build, and touched-file whitespace validation.
- **Status:** complete

### Phase 382: AI Review Diagnostic Validation Extraction
- [x] Added a red/green verifier requirement for a dedicated AI Review diagnostic validation module.
- [x] Extracted unknown-payload validation for progress events and run diagnostics to `shared/aiReview/aiReviewDiagnosticsValidation.ts`.
- [x] Kept `shared/aiReview/runDiagnostics.ts` as the shared type contract, diagnostic utility owner, and stable re-export entrypoint.
- [x] Preserved existing renderer and Electron imports without changing their public API.
- [x] Ran focused diagnostics verification, TypeScript typecheck, production build, and touched-file whitespace validation.
- **Status:** complete

### Phase 383: Electron Main Window Composition Extraction
- [x] Added `electron/mainWindowComposition.ts` as the owner of main-window persistence, mode-controller, shell-controller, startup, and bootstrap assembly.
- [x] Reduced `electron/main.ts` below the strict 250-line source scan threshold while retaining process initialization, state construction, service construction, and lifecycle registration.
- [x] Calibrated structural verifiers to inspect the composition boundary for moved dependencies without weakening module-level behavior checks.
- [x] Ran focused Electron/window/context-menu verifiers and a production build.
- [x] Ran `verify:cleanup-core` until an unrelated task-ordering verifier stopped on missing `src/utils/taskOrderPersistence.ts`.
- **Status:** complete with external aggregate-verification blocker recorded

### Phase 383: Task Order Persistence Parsing Extraction
- [x] Added RED structural verification requiring a dedicated persisted task-order parsing module while retaining `taskOrdering.ts` as the stable public entrypoint.
- [x] Extracted runtime `TaskSource` narrowing and unknown persisted order normalization into `src/utils/taskOrderPersistence.ts`.
- [x] Kept display sorting, drag-order mutations, deletion cleanup, and drag eligibility in `src/utils/taskOrdering.ts`.
- [x] Preserved existing imports of `isTaskSource`, `parseTaskListOrderByDate`, `TaskListDateOrder`, and `TaskListOrderByDate` through stable re-exports.
- [x] Ran focused task-ordering verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 384: Obsidian Companion Sync Planning Extraction
- [x] Added RED structural verification requiring a dedicated companion sync-planning module while retaining `electron/obsidianCompanion.ts` as the existing public entrypoint.
- [x] Moved capture template rendering, rule matching, persisted runtime validation, target resolution, and sync-plan construction into `electron/obsidianCompanionPlanning.ts`.
- [x] Kept vault-checked sync-plan file execution, section insertion, and managed-block replacement in `electron/obsidianCompanion.ts`.
- [x] Re-exported the existing planning API from the Electron entrypoint without changing IPC callers.
- [x] Ran focused Companion verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 385: AI Review Report Output Extraction
- [x] Added RED structural verification requiring a dedicated report-output module and stable facade re-exports.
- [x] Moved atomic report writing, content composition, vault-contained output path resolution, and report frontmatter formatting to `electron/aiReview/reportOutput.ts`.
- [x] Kept LLM orchestration, source redaction, template block generation, and public report generator APIs in `electron/aiReview/exportReports.ts`.
- [x] Preserved existing `composeReportContent` and `ReportResult` imports through facade re-exports.
- [x] Ran focused export-report verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 386: Markdown Editor Textarea DOM Extraction
- [x] Added RED structural verification requiring a dedicated textarea DOM helper module.
- [x] Moved caret mirror measurement, viewport scrolling, focus, and selection restoration to `src/hooks/markdownEditorTextarea.ts`.
- [x] Kept `useMarkdownEditor.ts` responsible for history, React lifecycle coordination, markdown command dispatch, and its existing public API.
- [x] Preserved behavior for controlled-textarea selection restore and soft-wrapped caret visibility through `restoreTextareaSelection(...)`.
- [x] Ran focused Markdown editor verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 387: Personalization Settings State Extraction
- [x] Added RED structural verification requiring a pure `personalizationSettings.ts` module.
- [x] Moved stored personalization normalization, override parsing/merging, equality checks, preset application, reset calculation, and override memory into the pure settings module.
- [x] Kept `appPersonalization.ts` responsible for React `Dispatch` action composition and compatibility re-exports.
- [x] Preserved existing app imports while exposing the pure settings API directly for focused verification.
- [x] Ran focused personalization verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 388: App Shell Main-Content Composition Extraction
- [x] Added RED structural verification requiring a dedicated main-content composition helper.
- [x] Moved Header, date navigator, tab bar, daily panels, review view, task list, and quick-add prop assembly into `appShellMainContentComposition.tsx`.
- [x] Kept `appShellComposition.tsx` responsible for title-bar assembly plus final main-content and overlay composition delegation.
- [x] Updated existing focused verifiers so migrated assertions inspect the helper that now owns the behavior.
- [x] Ran focused shell/main-content verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 389: Obsidian Sync Affected-Date Planning Extraction
- [x] Added RED structural verification requiring a dedicated pure sync-planning module.
- [x] Moved completion-record date checks and recursive affected-date traversal to `electron/obsidianSyncPlanning.ts`.
- [x] Kept `electron/obsidianSync.ts` responsible for input validation, daily-note writes, blog-draft output, preview assembly, and review triggering.
- [x] Preserved the existing task/review date resolution policy by injecting the current resolvers into the pure planner.
- [x] Ran focused verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 390: AI Review Generation Hook Extraction
- [x] Added RED structural verification requiring a dedicated generation hook.
- [x] Moved progress subscription, fallback timing, daily overwrite confirmation, report dispatch, diagnostics, and generation status to `useAiReviewGeneration.ts`.
- [x] Kept `useAiReviewSettingsPanelState.ts` responsible for settings loading, normalized state, option construction, and deferred persistence.
- [x] Preserved all five generation actions, daily confirmation behavior, status messages, progress completion, and diagnostics exposure.
- [x] Ran focused module and section verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 391: Desktop Window Owner Controller Extraction
- [x] Added RED structural verification requiring a dedicated desktop owner controller.
- [x] Moved Progman owner attachment, clearing, ownership state, and owner diagnostics to `electron/desktopWindowOwner.ts`.
- [x] Kept `electron/desktopWindowMode.ts` responsible for desktop state-machine decisions, polling, visibility, topmost, and bottom-sink behavior.
- [x] Calibrated the stale `windowMode.verify.ts` composition assertion to inspect `mainWindowComposition.ts`, where z-order injection now actually occurs.
- [x] Ran focused desktop-mode and window-mode verifications, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 392: Obsidian Sync Runtime Guard Reuse
- [x] Added a RED structural requirement for a shared Electron unknown-object guard.
- [x] Added `electron/unknownValueGuards.ts` with the shared `isObjectRecord(...)` narrowing predicate.
- [x] Replaced duplicate identical object guards in Obsidian sync validation and daily-note handling.
- [x] Kept the scope to the two directly related Obsidian sync modules; other local guards remain untouched pending ownership review.
- [x] Ran focused verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 393: LLM Response Guard Reuse
- [x] Added RED structural verification requiring response parsing to expose its object-record guard.
- [x] Reused the parser guard from `shared/llm/openaiClient.ts` and removed its duplicate local declaration.
- [x] Preserved the existing unknown-response narrowing in usage-only stream diagnostics and IPC model-list result parsing.
- [x] Ran focused LLM verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 394: Obsidian Companion Runtime Guard Reuse
- [x] Added RED structural verification requiring Companion planning and mobile inbox code to share the Electron object-record guard.
- [x] Reused `isObjectRecord(...)` in the Companion planner and mobile inbox importer.
- [x] Preserved runtime settings validation, malformed JSON rejection, file-collision recovery, and mobile inbox file movement behavior.
- [x] Ran Companion behavior verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 395: LLM Client Transport Extraction
- [x] Added a RED structural verification requiring a dedicated single-provider LLM transport module and facade delegation.
- [x] Moved HTTP request execution, timeout handling, SSE/JSON response branching, diagnostics assembly, and model-list transport to `shared/llm/llmClientTransport.ts`.
- [x] Kept `shared/llm/openaiClient.ts` responsible for public contracts, input validation, auto-provider retry policy, user-facing error formatting, and IPC result decoding.
- [x] Preserved all provider request construction and response parsing ownership in the existing protocol/parser modules; the transport imports only types from the facade to avoid a runtime cycle.
- [x] Ran focused LLM verification, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 396: OpenAI Client Transport Boundary Verification
- [x] Confirmed the public client facade delegates one-provider chat and model-list execution to `llmClientTransport.ts`.
- [x] Strengthened `verify-openai-client` to reject legacy `callChatCompletionOnceLegacy` and `listModelsOnceLegacy` implementations in the facade.
- [x] Verified focused OpenAI checks, TypeScript, aggregate cleanup checks, whitespace validation, and production build.
- **Status:** complete

### Phase 398: Shared Obsidian Unknown-Value Guard Reuse
- [x] Added RED structural verification requiring the two stable shared Obsidian consumers to import a common object-record predicate.
- [x] Added `shared/unknownValueGuards.ts` and migrated IPC result parsing plus template settings normalization away from duplicate local guards.
- [x] Preserved malformed IPC payload rejection, sync-preview narrowing, settings defaults, and legacy template migrations.
- [x] Ran focused settings verification, TypeScript typecheck, production build, aggregate cleanup checks, and scoped whitespace validation.
- **Status:** complete

### Phase 399: AI Review Unknown-Value Guard Reuse
- [x] Added RED structural verification for the stable AI Review settings, diagnostics, and IPC-result consumers.
- [x] Reused `shared/unknownValueGuards.ts` in all three modules and removed their duplicate local object-record predicates.
- [x] Kept settings migration, diagnostic validation, and IPC malformed-payload handling unchanged.
- [x] Calibrated one stale task-list ordering verifier to inspect the current initialization owner after the concurrent persistence extraction.
- [x] Ran focused checks, TypeScript typecheck, production build, aggregate cleanup checks, and scoped whitespace validation.
- **Status:** complete

### Phase 400: Electron AI Review Task Payload Guard Reuse
- [x] Added a RED structural verification requiring the shared AI Review task-payload validator to reuse the Electron object-record guard.
- [x] Replaced the duplicate local guard in `electron/aiReviewTaskPayload.ts` with `isObjectRecord(...)` from `electron/unknownValueGuards.ts`.
- [x] Preserved recursive task, completion-review, and malformed IPC payload validation behavior.
- [x] Ran four focused AI Review IPC verifications, TypeScript typecheck, production build, aggregate cleanup checks, and scoped whitespace validation.
- **Status:** complete

### Phase 401: Shared AI Review Object-Record Guard Reuse
- [x] Added RED structural verification requiring four stable shared AI Review modules to reuse the shared object-record guard.
- [x] Replaced duplicate local guards in template recognition, report-template recognition, source-material result reading, and section-template normalization.
- [x] Preserved malformed result rejection, JSON section parsing, source-reference validation, and template-default normalization.
- [x] Ran four focused verifications, TypeScript typecheck, production build, and scoped whitespace validation.
- [ ] Re-run aggregate cleanup gate after the unrelated task-persistence verifier is recalibrated to its extracted business-date-effects owner.
- **Status:** complete (aggregate gate externally blocked)

### Phase 402: Shared Obsidian Object-Record Guard Reuse
- [x] Added RED structural verification requiring stable shared Obsidian consumers to reuse the shared object-record guard.
- [x] Replaced duplicate local guards in template recognition, template-center normalization, and Companion result narrowing.
- [x] Preserved malformed template JSON fallback, template-module normalization, and Companion settings/rules/capture/sync result validation.
- [x] Ran three focused verifications, TypeScript typecheck, production build, task-persistence verification, aggregate cleanup checks, and scoped whitespace validation.
- **Status:** complete

### Phase 403: Shared App-Settings Object-Record Guard Reuse
- [x] Added RED verification requiring app-settings normalization to import the shared object-record predicate.
- [x] Replaced the duplicate local app-settings guard with `isObjectRecord(...)` from `shared/unknownValueGuards.ts`.
- [x] Calibrated the completion-review settings verifier to follow the current App shell-composition owner rather than the slim App entrypoint.
- [x] Preserved default settings, malformed persisted-value fallback, and completion-review setting flow.
- [x] Ran focused checks, TypeScript typecheck, production build, aggregate cleanup checks, and scoped whitespace validation.
- **Status:** complete

### Phase 404: Task-Payload Object-Record Guard Reuse
- [x] Added RED verification requiring task persistence validation to reuse the shared object-record predicate.
- [x] Replaced the duplicate task-transform guard with `isObjectRecord(...)` from `shared/unknownValueGuards.ts`.
- [x] Preserved recursive task/review validation, malformed-store filtering, and task normalization.
- [x] Ran focused task-state, persistence, carryover, TypeScript, production-build, and scoped whitespace checks.
- [ ] Re-run aggregate cleanup gate after the separate incomplete `useTaskInitializationEffects.ts` extraction is completed or its verifier is reconciled with the actual owner.
- **Status:** complete (aggregate gate externally blocked)

### Phase 405: Renderer Task-Menu Object-Record Guard Reuse
- [x] Added RED verification requiring popup task-menu payload parsing to reuse the shared object-record predicate.
- [x] Replaced the duplicate renderer-local guard with `isObjectRecord(...)` from `shared/unknownValueGuards.ts`.
- [x] Preserved malformed-payload no-op handling and popup action routing.
- [x] Ran focused task-menu/runtime-effects checks, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 406: Electron Task-Menu Object-Record Guard Reuse
- [x] Added RED verification requiring task-context-menu IPC input narrowing to reuse the Electron object-record predicate.
- [x] Replaced the duplicate local Electron guard with `isObjectRecord(...)` from `electron/unknownValueGuards.ts`.
- [x] Preserved malformed open/action rejection, finite resize validation, bounds clamping, and valid action forwarding.
- [x] Ran focused context-menu checks, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 403: Task Tree Persistence And Broadcast Effects Extraction
- [x] Added RED structural verification requiring task-tree persistence and broadcast reconciliation to live in a focused lifecycle hook.
- [x] Moved delayed task-tree writes, Store-loaded baseline priming, unmount flushing, cross-window task subscriptions, and stale-write suppression into `src/hooks/useTaskTreePersistenceEffects.ts`.
- [x] Kept `useTaskLifecycleEffects.ts` responsible for deciding when startup should prime the loaded task tree without a redundant Store write.
- [x] Ran focused task checks, TypeScript typecheck, aggregate cleanup checks, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 404: Task Startup Initialization Effects Extraction
- [x] Added RED structural verification requiring a focused startup initialization effects hook.
- [x] Moved the asynchronous startup load, state hydration, carryover-ledger writeback, and persistence baselining into `src/hooks/useTaskInitializationEffects.ts`.
- [x] Kept lifecycle composition and post-load UI-state persistence behavior unchanged.
- [x] Ran focused task checks, aggregate cleanup checks, TypeScript, build, and whitespace validation.
- **Status:** complete

### Phase 405: Obsidian Daily Note Rendering Extraction
- [x] Added RED structural verification requiring daily-note rendering to have its own focused module.
- [x] Moved managed-block construction, default daily-note assembly, custom-template rendering, token substitution, and missing-block fallback insertion into `shared/obsidianDailyNoteRendering.ts`.
- [x] Kept `shared/obsidianTemplates.ts` as the stable compatibility facade for task-line exports, path resolution, marked-block utilities, sync preview construction, and renderer re-exports.
- [x] Preserved default and custom daily-note template behavior, managed markers, task-line formatting, and Electron sync integration.
- [x] Ran daily-template and Obsidian sync checks, TypeScript, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 406: Large-File Rescan
- [x] Scanned Git-tracked production `.ts`, `.tsx`, `.js`, and `.jsx` files while excluding scripts and generated output.
- [x] Confirmed that no remaining production source file is at or above the established 300-line large-file threshold.
- [x] Reviewed the largest remaining modules and found their current submodule boundaries already focused enough for this cleanup objective.
- **Status:** complete

### Phase 407: TaskItem Editing Lifecycle Extraction
- [x] Added RED structural verification requiring TaskItem edit state and lifecycle handling to live in a focused hook.
- [x] Added `src/components/taskItem/useTaskItemEditing.ts` for edit-trigger activation, draft text state, submit normalization, keyboard actions, cancel reset, and edit start behavior.
- [x] Kept `TaskItem.tsx` responsible for task-card presentation and event propagation, while delegating edit lifecycle inputs and callbacks to the hook.
- [x] Ran focused TaskItem checks, TypeScript, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 408: LLM Response Metadata Boundary Extraction
- [x] Added RED verification requiring token usage and model-list parsing to have a dedicated response-metadata module.
- [x] Added `shared/llm/llmProviderResponseMetadata.ts` for provider usage extraction, usage-only stream detection, and model-list parsing.
- [x] Reduced `shared/llm/llmProviderResponseParsing.ts` to SSE and provider text-response parsing while retaining compatibility re-exports.
- [x] Preserved OpenAI-compatible, Anthropic, and Gemini chat parsing, streaming whitespace behavior, usage diagnostics, and model-list callers.
- [x] Ran focused OpenAI verification, task persistence, TypeScript, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 409: Persisted UI-State Boundary Narrowing
- [x] Added RED verification requiring persisted application UI state to reuse the shared object-record guard.
- [x] Replaced assertion-based Store value narrowing and equality access in `src/app/appUiStatePersistence.ts` with `isObjectRecord(...)` and own-property descriptor reads.
- [x] Preserved persisted UI-state fallback, structural equality, and write-suppression behavior.
- [x] Ran focused UI-state and personalization checks, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 410: Obsidian Template Settings Equality Narrowing
- [x] Added RED verification requiring template-settings equality to avoid assertion-based record access.
- [x] Replaced the `Record<string, unknown>` assertion in recursive equality with an own-property descriptor read.
- [x] Preserved own-property comparison semantics and template settings migration behavior.
- [x] Ran template source and template-center checks, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 411: Obsidian Companion Settings Boundary Narrowing
- [x] Added RED verification requiring Companion defaults to reuse the shared object-record guard and avoid assertion-based equality access.
- [x] Replaced the local `isRecord(...)` helper with `isObjectRecord(...)` and the equality assertion with an own-property descriptor read.
- [x] Preserved malformed settings fallback, default Companion settings, and recursive equality semantics.
- [x] Ran focused Companion action and startup-setting checks, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 412: AI Review Deferred Persistence Equality Narrowing
- [x] Added RED verification requiring deferred AI Review settings persistence equality to avoid assertion-based record access.
- [x] Replaced the recursive equality `Record<string, unknown>` assertion with an own-property descriptor read.
- [x] Preserved debounce replacement, explicit flush, and persisted-value write suppression.
- [x] Ran focused persistence and settings checks, TypeScript typecheck, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 413: Task And Electron Store Boundary Narrowing
- [x] Added RED verification requiring Electron batched Store IPC to reuse its object-record guard and task-tree equality to avoid record assertions.
- [x] Reused `isObjectRecord(...)` for untrusted Electron `store:setMany` entries and broadcast the already-narrowed task value.
- [x] Replaced task-tree record assertions with own enumerable-entry iteration and descriptor reads while preserving undefined-field omission.
- [x] Ran focused Electron settings IPC, task hook-state, task persistence, TypeScript, production build, and scoped whitespace checks.
- **Status:** complete

### Phase 414: Shared Template Compatibility Guard Reuse
- [x] Added RED verification requiring `shared/obsidianTemplateCompat.ts` to reuse the shared object-record guard.
- [x] Replaced its local runtime object guard with `isObjectRecord(...)` from `shared/unknownValueGuards.ts`.
- [x] Preserved template compatibility parsing and managed-marker behavior.
- [x] Ran focused daily-template, daily-review, Electron daily-note, TypeScript, and scoped whitespace checks.
- **Status:** complete

### Phase 415: Task Persistence Object Guard Consolidation
- [x] Added RED verification requiring task UI-state persistence and startup parsing to reuse the shared object-record guard.
- [x] Replaced duplicate local `isRecord(...)` helpers in task UI-state persistence and startup parsing with `isObjectRecord(...)`.
- [x] Replaced recursive UI-state right-side indexing with own-property descriptor reads while preserving equality and debounce behavior.
- [x] Ran focused task persistence, task list, task hook-state, TypeScript, production build, and scoped whitespace checks.
- **Status:** complete

### Phase 416: Optimization Baseline Revalidation
- [x] Re-ran the aggregate cleanup verification across task, renderer, Electron, AI Review, Obsidian, settings, and TypeScript modules.
- [x] Confirmed no production `.ts` or `.tsx` module exceeds 300 lines.
- [x] Confirmed no production `as Record<string, unknown>` or `any` / `as any` occurrences remain.
- [x] Identified four remaining local object-record guard candidates for subsequent boundary-specific review.
- **Status:** complete

### Phase 417: Remaining Object Guard Consolidation
- [x] Added RED verifier coverage requiring task ordering state, personalization settings, task-menu URL payload parsing, and AI Review template-tools IPC to reuse their shared object-record guards.
- [x] Replaced duplicate local `isRecord(...)` helpers in the three renderer modules with `shared/unknownValueGuards.ts` and in Electron IPC with `electron/unknownValueGuards.ts`.
- [x] Preserved malformed-value fallbacks; array-shaped AI Review model-list configuration now falls back to the default configuration instead of being treated as a named-field config object.
- [x] Ran the four focused verifiers, related task/OpenAI checks, TypeScript, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 418: AI Review Object Guard Reuse
- [x] Added RED verifier coverage requiring AI profile and section configuration normalization to reuse the shared object-record guard.
- [x] Replaced their identical local `isObject(...)` helpers with `isObjectRecord(...)` from `shared/unknownValueGuards.ts`.
- [x] Preserved malformed-profile and malformed-section fallback behavior, including array rejection at both parsing boundaries.
- [x] Ran focused AI settings, section-config, Electron settings-section IPC, TypeScript, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 419: Task List Conditional Source Grouping
- [x] Added RED verifier coverage requiring pure-personal task lists to omit source groups that neither static nor DnD rendering consumes.
- [x] Kept tag-history derivation in one pass while deferring source-group allocation until an external task actually appears.
- [x] Preserved personal-task order, external grouping, source ordering, tag ordering, and linear traversal of the task list.
- [x] Ran focused DnD, task-list interaction, ordering-state, TypeScript, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 418: PriorityPicker Popover Hook Extraction
- [x] Added RED/GREEN structural verification for the priority popover lifecycle hook.
- [x] Extracted popover state, viewport positioning, outside-click handling, resize/scroll listeners, animation-frame coalescing, and cleanup to `src/components/priorityPicker/usePriorityPickerPopover.ts`.
- [x] Kept `PriorityPicker.tsx` responsible for priority metadata, portal presentation, and change-only selection routing.
- [x] Recalibrated TaskItem's structural verification to inspect lifecycle details at the hook boundary.
- [x] Ran focused checks, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 419: DateNavigator Calendar Lifecycle Hook Extraction
- [x] Added RED/GREEN structural verification for DateNavigator calendar lifecycle ownership.
- [x] Extracted calendar open state, visible-month synchronization, outside-click handling, and close/toggle actions to `src/components/dateNavigator/useDateNavigatorCalendar.ts`.
- [x] Kept `DateNavigator.tsx` responsible for date navigation controls and deferred MonthCalendar presentation.
- [x] Ran focused checks, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 420: TaskMenuPopup Lifecycle Hook Extraction
- [x] Added RED/GREEN structural verification for TaskMenuPopup viewport and Escape-key lifecycle ownership.
- [x] Extracted pane state, content-height reporting, ResizeObserver/RAF cleanup, and Escape navigation to `src/components/taskMenuPopup/useTaskMenuPopupLifecycle.ts`.
- [x] Kept `TaskMenuPopup.tsx` responsible for URL payload parsing, theme CSS variables, action dispatch, and pane presentation.
- [x] Ran focused context-menu verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 421: TaskCompletionDialog Form Hook Extraction
- [x] Added RED/GREEN structural verification for completion review form ownership.
- [x] Extracted form reset, status-to-percent transitions, text state, and trimmed save payload construction to `src/components/taskCompletionDialog/useTaskCompletionDialogForm.ts`.
- [x] Kept `TaskCompletionDialog.tsx` responsible for modal layout and Markdown-enabled textarea presentation.
- [x] Ran focused dialog/UI verification, TypeScript checking, production build, and scoped whitespace validation.
- [x] Ran aggregate cleanup verification; it reached the existing `verify:task-list-interactions` selected-date-order assertion before the new dialog hook verifier, so the aggregate gate remains blocked by concurrent task-selector work.
- **Status:** complete

### Phase 422: Task View Source-Order Reuse
- [x] Added RED verifier coverage requiring a selected-date source order to be normalized once and reused by task display sorting and the returned task view state.
- [x] Added an optional normalized source-order parameter to display sorting while preserving its standalone normalization fallback for existing callers.
- [x] Preserved selected-date task ordering, source grouping, manual order behavior, and task view output.
- [x] Ran task-list interaction and ordering-state verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 423: Header Completion Celebration Hook Extraction
- [x] Added RED/GREEN structural verification for Header completion celebration lifecycle ownership.
- [x] Extracted previous-count tracking, new-completion detection, lazy `canvas-confetti` loading, and the existing celebration payload to `src/components/header/useCompletionCelebration.ts`.
- [x] Kept `Header.tsx` responsible for date formatting, summary derivation, sync controls, and progress presentation.
- [x] Recalibrated App top-content verification to inspect the celebration implementation at the hook boundary.
- [x] Ran focused verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 424: Task Carryover Candidate Reuse
- [x] Added RED/GREEN verification requiring direct candidate traversal after the target-date carryover index is complete.
- [x] Removed the transient inherited-task array from the cross-date carryover flow.
- [x] Preserved unordered persisted carryover de-duplication, carryover ordering, ledger ordering, and original-reference no-op returns.
- [x] Ran focused carryover, task hook-state, and persistence verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 425: Task Normalization Structural Sharing
- [x] Added RED/GREEN verification requiring already-canonical task trees to retain their root reference.
- [x] Reworked task normalization to retain unchanged scheduled-date arrays and subtask trees while preserving legacy-field normalization.
- [x] Preserved completion-review selection, business-date flags, recursive normalization, and canonical stored-task output.
- [x] Ran focused task state, carryover, persistence, and scheduled-date checks; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 426: TaskItem Parent Action Controls Extraction
- [x] Added RED/GREEN structural verification for parent task review, completion, and delete action-control ownership.
- [x] Extracted `ReviewActionButton`, `CompleteActionButton`, `DeleteActionButton`, and `TaskActionLayer` to `src/components/taskItem/taskItemActionControls.tsx`.
- [x] Kept `taskItemControls.tsx` focused on main task content, inline editing presentation, and drag-handle presentation; retained `TaskItem.tsx` as the composition owner.
- [x] Recalibrated dependent TaskItem structural checks to inspect the extracted action-control module.
- [x] Ran focused verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 426: Business-Date Task List Reuse
- [x] Added RED/GREEN verification requiring no-op business-date carryover to retain both task-list and ledger references.
- [x] Replaced unconditional top-level task-list mapping with a lazy-copy normalization traversal.
- [x] Preserved task normalization, carryover selection, carryover ordering, and existing no-op result semantics.
- [x] Ran focused carryover, task state, and persistence checks; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 427: TitleBar Primary Actions Presentation Extraction
- [x] Added RED/GREEN structural verification for TitleBar's pin, position-lock, and settings action presentation boundary.
- [x] Extracted the three primary action buttons, their icons, active-state style, and localized labels to `src/components/titleBar/TitleBarPrimaryActions.tsx`.
- [x] Kept `TitleBar.tsx` responsible for window-mode state, local visual synchronization, interaction callbacks, and outer titlebar/menu/window-control composition.
- [x] Ran focused TitleBar verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 427: Cross-Date Obsidian Review Filtering
- [x] Added RED/GREEN verification requiring cross-date review filtering before sorting.
- [x] Avoided sorting all reviews and allocating empty filtered arrays for historical tasks without matching review records.
- [x] Preserved chronological review output, single-review behavior, task visibility, and nested task rendering.
- [x] Ran daily-template, subtask-sync, and settings-sync verification; TypeScript checking; production build; and scoped whitespace validation.
- [x] Confirmed the unrelated current `verify:review-fields` failure remains in its TaskCompletionDialog shared-status-guard assertion.
- **Status:** complete

### Phase 428: Default Task Source-Order Reuse
- [x] Added RED/GREEN verification requiring the default source order to retain its shared reference when no saved source order exists.
- [x] Avoided filtering and merging source-order arrays for the ordinary no-custom-order path.
- [x] Preserved saved-order validation, default-source completion, task display ordering, and drag-order consumers.
- [x] Ran focused task ordering and interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 429: Persisted Default Source-Order Reuse
- [x] Added RED/GREEN verification requiring an explicitly saved default source order to retain the stable shared reference.
- [x] Reused the default order after validation when a saved source order normalizes to the default sequence.
- [x] Preserved custom source ordering, invalid-source filtering, default completion, task display ordering, and drag-order consumers.
- [x] Ran focused task ordering and interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 430: Obsidian Template Modules Section Extraction
- [x] Added RED/GREEN structural verification for the template-module configuration presentation boundary.
- [x] Extracted module derivation, fixed core-module rules, module toggles, and section-title inputs to `src/components/obsidianTemplateCenter/ObsidianTemplateModulesSection.tsx`.
- [x] Kept `ObsidianTemplateCenter.tsx` responsible for template-center state, preset selection, AI import/recognition, advanced configuration, and outer action wiring.
- [x] Recalibrated the Obsidian template UI verifier and ran focused verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 430: Obsidian Legacy Review Comparison Reuse
- [x] Added RED/GREEN verification preventing per-task wrapper-array allocation when comparing legacy singleton completion reviews during sync equivalence checks.
- [x] Split review comparison into a field-level single-review helper and an array-list helper.
- [x] Preserved every reviewed Markdown field, nested task equivalence, renderer-only state exclusion, and sync IPC skipping behavior.
- [x] Ran focused Obsidian sync, settings sync, and subtask sync verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 431: Obsidian Companion Rules Section Extraction
- [x] Added RED/GREEN structural verification for the Companion rules configuration presentation boundary.
- [x] Extracted immutable rule updates, rule iteration, write-mode validation, and rule control JSX to `src/components/obsidianCompanion/ObsidianCompanionRulesSection.tsx`.
- [x] Kept `ObsidianCompanionPanel.tsx` responsible for the drawer shell, vault and mobile inbox entry points, templates, preview, and sync status.
- [x] Recalibrated the existing Companion verification to inspect write-mode validation at the extracted section boundary.
- [x] Ran focused verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 431: Static Task-Row Render Isolation
- [x] Added RED/GREEN verification requiring an individual memo boundary for static task rows.
- [x] Moved task-id action binding from the static list renderer into a memoized static task-row component.
- [x] Preserved per-card content-visibility containment, grouped and ungrouped list rendering, edit requests, and all task actions.
- [x] Ran focused task-list DnD and interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 432: Task-Tree Recursive Allocation Reduction
- [x] Added RED/GREEN verification rejecting per-node recursive IIFE allocation in task-tree update and deletion paths.
- [x] Replaced recursive IIFEs with direct local branching in `mapTaskTree(...)` and `removeTaskFromTree(...)`.
- [x] Preserved full-tree traversal, all duplicate-ID update/deletion behavior, structural sharing, and untouched sibling references.
- [x] Ran task mutation, hook-state, and persistence verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 433: Obsidian Companion Templates Section Extraction
- [x] Added RED/GREEN structural verification for the Companion template editor presentation boundary.
- [x] Extracted template iteration and immutable template-body updates to `src/components/obsidianCompanion/ObsidianCompanionTemplatesSection.tsx`.
- [x] Kept `ObsidianCompanionPanel.tsx` responsible for drawer composition, vault and mobile-inbox actions, rules and template section composition, preview/sync commands, and status output.
- [x] Ran focused verification, TypeScript checking, aggregate cleanup verification, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 433: UI Persistence Equality Allocation Reduction
- [x] Added RED/GREEN verification rejecting `Object.entries(...)` allocation during UI persistence state equality checks.
- [x] Replaced entry-array comparison with own-key traversal and count comparison.
- [x] Preserved recursive value equality, right-side own-property reads, pending-write cancellation, and batched Store IPC behavior.
- [x] Ran persistence, hook-state, and task-ordering verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 434: Personal Task Display Sort Fast Path
- [x] Added RED/GREEN verification for the all-personal, no-manual-order display sorting path.
- [x] Bypassed source grouping structures when all visible tasks default to the personal source and no personal manual order applies.
- [x] Preserved default completion/priority ordering and retained the existing path for external sources and all manual source orders.
- [x] Ran task interaction, ordering-state, and task-list DnD verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 435: Task-Order Deletion Structural Sharing
- [x] Added RED/GREEN verification requiring task-order deletion to retain unaffected date-order references.
- [x] Avoided cloning every stored date and source-order array when a deleted task ID changes only selected dates.
- [x] Preserved stale-ID removal across sources, malformed persisted-order cleanup, empty-date removal, and unchanged-state reference reuse.
- [x] Ran focused ordering and interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 436: Task-Order Deletion No-Op Allocation Reduction
- [x] Added RED/GREEN verification rejecting filtered-array allocation for untouched source and date orders.
- [x] Split date-order cleanup into a direct change-detection pass and a rebuild-only-on-change pass.
- [x] Preserved stale-ID removal, malformed-order cleanup, empty-date removal, and reference stability for unchanged data.
- [x] Ran focused ordering and interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 437: Source-Order Read Allocation Reduction
- [x] Added RED/GREEN verification rejecting filtered and merged-array allocation when reading an already valid saved source order.
- [x] Reused valid complete saved orders directly, while preserving the shared default-order reference and allocating only when stored data needs normalization.
- [x] Preserved invalid-source filtering, missing-source completion, display grouping, and drag-order behavior.
- [x] Ran ordering, task-interaction, and DnD verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 438: Task Command Bucket Merge Reduction
- [x] Added RED/GREEN verification rejecting temporary array flattening after shared task-view traversal.
- [x] Appended the existing priority/completion command buckets directly in their established order.
- [x] Preserved selected-date command membership, completion-first grouping, priority ordering, and shared selector traversal.
- [x] Ran task interaction, hook-state, and DnD verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 439: App Root Presentation Memoization
- [x] Added RED/GREEN verification requiring memoized theme-state and viewport CSS-variable derivation at the App root.
- [x] Reused the derived theme state and 18-variable viewport style object until personalization changes.
- [x] Preserved theme preset fallback, invisible-theme opacity rules, runtime theme effects, and root presentation output.
- [x] Ran focused theme, viewport, and task interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 440: Review Grouping Direct Task Bucketing
- [x] Added a focused RED/GREEN verifier for review date, task, and timestamp ordering.
- [x] Grouped review records directly into nested date/task maps, avoiding the intermediate full-date record sort and second task-grouping pass.
- [x] Preserved newest-first date order, newest-first task group order, newest-first records within each task, and fallback completion records.
- [x] Ran focused grouping verification, TypeScript checking, production build, and scoped whitespace validation.
- [x] Confirmed the existing `verify:review-fields` failure remains the unrelated TaskCompletionDialog status-guard assertion.
- **Status:** complete

### Phase 441: Completion Dialog Status Boundary Guard
- [x] Reproduced the review-field verifier failure caused by the completion dialog accepting raw select strings at its DOM boundary.
- [x] Applied the existing shared completion-review status guard before dispatching a selected status to the form hook.
- [x] Kept the form hook guard as the second validation boundary and preserved all status-to-percent behavior.
- [x] Ran review field and grouping verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 436: App UI Persistence Equality Allocation Reduction
- [x] Added RED/GREEN verification rejecting `Object.entries(...)` allocation during UI persistence state equality checks.
- [x] Replaced entry-array comparison with own-key traversal and count comparison in the app UI-state persistence helper.
- [x] Preserved recursive value equality, right-side own-property reads, pending-write cancellation, and batched Store IPC behavior.
- [x] Ran focused persistence verification, task-ordering verification, TypeScript checking, production build, and scoped whitespace validation.
- [x] Recorded that the aggregate cleanup command exceeded the two-minute execution window while its initially failing ordering verifier passed when rerun independently.
- **Status:** complete

### Phase 437: Task-Menu Date and Tag Pane Extraction
- [x] Added RED/GREEN verification requiring separate focused modules for the date and tag editor panes.
- [x] Moved date selection, quick dates, chip removal, and date formatting into `TaskMenuPopupDatePane`.
- [x] Moved tag editing, tag suggestions, parsing, and merging into `TaskMenuPopupTagPane`, retaining the public `getTagSuggestions` re-export.
- [x] Kept main-menu and subtask presentation in a compact shared pane module and reused one pane-header component for back navigation.
- [x] Ran focused context-menu verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 440: App Shell Input Assembly Extraction
- [x] Added RED/GREEN structural verification requiring a dedicated pure shell-input factory and a reduced runtime shell hook.
- [x] Moved final `AppShellCompositionOptions` field mapping into `appShellCompositionInputs.ts` while retaining all hook state derivation and action memoization in `useAppShellComposition.ts`.
- [x] Recalibrated shell-related structural verifiers to assert data flow at the new pure input boundary instead of requiring a large inline return object.
- [x] Ran focused shell, runtime, completion, review, UI action, modal, template, task-view, personalization, and top-content verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete
### Phase 442: Obsidian Template Import Presentation Extraction
- [x] Added RED/GREEN structural verification requiring the template center to delegate AI import presentation.
- [x] Moved template-file selection controls, recognition progress, recognized-draft preview, unmapped content, and apply action into `ObsidianTemplateImportSection`.
- [x] Kept `ObsidianTemplateCenter` as the owner of template settings, import-state hook composition, presets, module configuration, advanced fields, preview, and reset commands.
- [x] Ran focused template UI, recognition, and module verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete
### Phase 443: Task Tree Mutation Utility Extraction
- [x] Added RED/GREEN verification requiring a focused task-tree utility module rather than recursive mutations in persisted-task transforms.
- [x] Moved recursive immutable update and deletion operations into `taskTree.ts`.
- [x] Kept `taskTransforms.ts` responsible for validation, normalization, date matching, and persisted-task parsing; switched `useTasks.ts` to the dedicated tree utilities.
- [x] Ran task mutation, task hook-state, and task-list interaction verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete
### Phase 444: Markdown Editor Indentation Utility Extraction
- [x] Added RED/GREEN verification requiring indentation commands to live in their own pure editor module.
- [x] Moved selection-line discovery and indent/outdent transforms into `markdownEditorIndentation.ts`.
- [x] Retained the existing `markdownEditor.ts` exports as a compatibility facade while keeping list continuation and inline wrapping there.
- [x] Ran focused markdown-editor verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete
### Phase 445: Obsidian Completion-Review Visibility Extraction
- [x] Added RED/GREEN verification requiring a dedicated completion-review visibility module.
- [x] Moved completion-review type adaptation, date filtering, ordered rendering selection, and streaming statistics selection into `obsidianTemplateCompletionReviewVisibility.ts`.
- [x] Kept task-tree visibility indexing, rendering, and aggregate statistics in `obsidianTemplateTaskLines.ts`.
- [x] Ran daily-template marker, Markdown-template, template-file verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 446: Obsidian Template Settings Equality Extraction
- [x] Added RED/GREEN verification requiring a dedicated recursive settings-equality module.
- [x] Moved generic recursive equality into `obsidianTemplateSettingsEquality.ts`.
- [x] Kept the public `areObsidianTemplateSettingsEqual` entry point in `obsidianTemplateSettings.ts`.
- [x] Ran focused template settings, daily Markdown, and template-marker verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 447: Obsidian Daily Template Migration Extraction
- [x] Added RED/GREEN verification requiring legacy daily Markdown migration in a focused module.
- [x] Moved legacy placeholder parsing and ordered block construction into `obsidianTemplateSettingsDailyMigration.ts`.
- [x] Kept defaults, path migration, report-template normalization, and the public settings API in `obsidianTemplateSettings.ts`.
- [x] Ran focused template settings, daily Markdown, template-marker, and template-file verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 448: Obsidian Template Settings Path Migration Extraction
- [x] Added RED/GREEN structural verification requiring a focused persisted-path migration module.
- [x] Moved stored-string reading, current/legacy path selection, and legacy report-directory conversion into `obsidianTemplateSettingsPathMigration.ts`.
- [x] Kept `obsidianTemplateSettings.ts` as the typed settings API and normalization orchestrator.
- [x] Ran focused template verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 449: Obsidian Template Recognition Result Reader Extraction
- [x] Added RED/GREEN structural verification requiring focused recognition and picker IPC result readers.
- [x] Moved runtime draft/result validation and picker result parsing into `obsidianTemplateRecognitionResultReaders.ts`.
- [x] Kept `obsidianTemplateRecognition.ts` as the public compatibility facade for existing imports.
- [x] Ran focused recognition, template UI, and template-file verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 450: Obsidian Template Task-Line Formatting Extraction
- [x] Added RED/GREEN structural verification requiring task-line formatting in a focused module.
- [x] Moved text escaping, tag/timestamp formatting, placeholder replacement, and review-template line compilation into `obsidianTemplateTaskLineFormatting.ts`.
- [x] Kept task-tree visibility indexing, sorting, recursive traversal, and output assembly in `obsidianTemplateTaskLines.ts`.
- [x] Ran focused daily-template, review-field, and task-to-Obsidian verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 451: Obsidian Template Module Settings Extraction
- [x] Added RED/GREEN structural verification requiring static template module settings to have a focused owner.
- [x] Moved module schema, labels, defaults, presets, and normalization into `obsidianTemplateModuleSettings.ts`.
- [x] Kept `obsidianTemplateCenter.ts` as the compatibility facade and owner of DailyTemplate mapping and settings mutations.
- [x] Ran focused template center, recognition, UI, and module-section verification; TypeScript checking; production build; and scoped whitespace validation.
- **Status:** complete

### Phase 452: Obsidian Companion Runtime Validation Extraction
- [x] Added RED/GREEN verification requiring Companion runtime validators and IPC-result readers to have a focused owner.
- [x] Moved capture/template/rule/sync-plan validation and IPC result readers into `obsidianCompanionValidation.ts`.
- [x] Kept `obsidianCompanion.ts` as the public type/contracts facade with compatibility re-exports.
- [x] Recalibrated the App Companion action verifier to inspect the pure shell-input mapping owner.
- [x] Ran focused validation and IPC checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:companion` remains blocked by concurrent template-renderer allocation assertions in `electron/obsidianCompanionPlanning.ts`.
- **Status:** complete (aggregate verifier blocked by unrelated concurrent work)

### Phase 453: LLM Model-List Result Reader Extraction
- [x] Add RED/GREEN verification for a focused model-list IPC-result reader.
- [x] Move runtime model-list result narrowing out of the LLM request facade.
- [x] Preserve the `openaiClient.ts` public API through a compatibility re-export.
- [x] Run focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 454: Floating Scrollbar Metrics Extraction
- [x] Added RED/GREEN verification for pure scrollbar measurement and drag mapping.
- [x] Moved scroll metrics and pointer-to-scroll conversion into `floatingScrollbarMetrics.ts`.
- [x] Kept DOM setup, visibility lifecycle, observer scheduling, and event cleanup in `useFloatingScrollbar.ts`.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 455: Theme Preset Matching Extraction
- [x] Added RED/GREEN verification requiring preset matching to have a focused pure module.
- [x] Moved preset matching rules into `themePresetMatching.ts`.
- [x] Kept `themePresets.ts` as the static catalog and compatibility owner of `matchThemePreset`.
- [x] Ran focused matching and app-theme consumers, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:theme-no-blue` and `verify:theme-visual-isolation` remain blocked by concurrent context-menu and personalization-script changes unrelated to this extraction.
- **Status:** complete (two aggregate theme verifiers blocked by concurrent work)

### Phase 456: AI Review Prompt Formatting Extraction
- [x] Added RED/GREEN verification requiring AI-review prompt formatting to have a focused pure module.
- [x] Moved daily-stat rendering, render-type instructions, and custom-block fallback prompt formatting into `promptFormatting.ts`.
- [x] Kept `promptBuilder.ts` as the message-construction owner, preserving its public builder API.
- [x] Ran focused prompt formatting and section-config verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 457: AI Review Default Prompt Catalog Extraction
- [x] Added RED/GREEN verification requiring weekly and monthly report prompt catalogs to have focused modules.
- [x] Moved personal and external weekly prompts into `defaultWeeklyPrompts.ts`.
- [x] Moved personal and external monthly prompts into `defaultMonthlyPrompts.ts`.
- [x] Kept `defaultPrompts.ts` as a compatibility facade for existing report imports.
- [x] Ran focused prompt-catalog and AI-runner verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 458: Report Output Formatting Extraction
- [x] Added RED/GREEN verification requiring output validation and downgrade behavior to have a focused pure module.
- [x] Moved list normalization and table, Callout, and Dataview validation into `reportOutputFormatting.ts`.
- [x] Kept `reportGenerator.ts` as the compatibility owner of the `validateBlockOutput` export and prompt construction.
- [x] Ran focused formatting and report-export verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 459: AI Onboarding Step Presentation Extraction
- [x] Added RED/GREEN verification requiring onboarding step presentation to have a dedicated component.
- [x] Moved introductory, API settings, and timer settings step presentation into `AiOnboardingSteps.tsx`.
- [x] Kept `AiOnboarding.tsx` as the owner of draft state, navigation, animation, and completion/skip policy.
- [x] Ran focused onboarding, overlay/modal integration, TypeScript, production-build, and scoped whitespace verification.
- **Status:** complete

### Phase 460: AI Review Report Message Composition Extraction
- [x] Added RED/GREEN verification requiring shared report message composition to have a focused module.
- [x] Moved deterministic statistics and source-section message assembly into `reportMessageComposition.ts`.
- [x] Kept weekly/monthly modules as the owners of their period keys, source selection, defaults, and cadence-specific labels.
- [x] Ran focused composition, weekly/monthly, export-report, TypeScript, production-build, and scoped whitespace verification.
- **Status:** complete

### Phase 461: Light Anonymization Ownership Extraction
- [x] Added RED/GREEN verification requiring light anonymization to have a semantically named focused module.
- [x] Moved contact, project, and name replacement policy into `lightAnonymization.ts`.
- [x] Kept `templateBlockDefaults.ts` as a compatibility facade for the existing `lightAnonymize` import path.
- [x] Ran focused anonymization, TypeScript, production-build, and scoped whitespace verification.
- [ ] `verify-template-hub-rewrite.ts` remains blocked after its anonymization checks by an unrelated stale assertion for the previously moved `buildDailyNoteFromTemplate` helper.
- **Status:** complete (aggregate verifier blocked by unrelated concurrent work)

### Phase 462: Daily Markdown Core-Section Rules Extraction
- [x] Added RED/GREEN verification requiring core-token detection and fallback-section assembly to have a focused module.
- [x] Moved daily core-token rules and missing-section composition into `dailyMarkdownCoreSections.ts`.
- [x] Kept `dailyMarkdownTemplate.ts` as the public renderer and compatibility export for `missingDailyCoreTokens`.
- [x] Ran focused core-section, daily Markdown, template-recognition, TypeScript, production-build, and scoped whitespace verification.
- **Status:** complete

### Phase 463: AI Review Template File Parsing Extraction
- [x] Added RED/GREEN verification requiring template content parsing to have a focused module.
- [x] Moved text/DOCX decoding and error normalization into `templateFileParsing.ts`.
- [x] Kept `templateFile.ts` as the public extension-policy owner and compatibility facade for parser exports and types.
- [x] Ran focused parsing, template-file, Electron template-tools IPC, TypeScript, production-build, and scoped whitespace verification.
- **Status:** complete

### Phase 464: AI Review Schedule-Time Parsing Extraction
- [x] Added RED/GREEN verification requiring schedule-time parsing to have a focused module.
- [x] Moved strict `HH:mm` parsing and fallback selection into `scheduleTimeParsing.ts`.
- [x] Kept `timer.ts` as the daily, weekly, and monthly delay-calculation owner.
- [x] Ran focused parsing and timer verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 465: Electron Shared Unknown-Value Guard Consolidation
- [x] Added RED/GREEN verification requiring Electron's object-record guard to delegate to the shared implementation.
- [x] Replaced the duplicate Electron implementation with a compatibility re-export.
- [x] Refreshed affected static verifiers to check the compatibility boundary rather than duplicated source text.
- [x] Ran focused Electron guard and Obsidian sync verification, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `electron/obsidianCompanion.verify.ts` reaches an unrelated existing capture-template allocation assertion after its guard assertion.
- **Status:** complete (aggregate Companion verifier blocked by unrelated concurrent work)

### Phase 466: Shared Schedule-Time Validation Consolidation
- [x] Added RED/GREEN verification requiring strict `HH:mm` validation to have one shared owner.
- [x] Exposed `isScheduleTime` from `scheduleTimeParsing.ts` and made parsing reuse it.
- [x] Replaced duplicated private validators in app settings and AI-review settings normalization.
- [x] Preserved all caller-owned default fallback values.
- [x] Ran focused settings/parser checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 467: Task Action Hook Extraction
- [x] Added RED/GREEN verification requiring task mutation and ordering callbacks to have a focused hook boundary.
- [x] Moved task creation, completion, review, subtask, ordering, note, settings, and clear-completed callbacks into `useTaskActions.ts`.
- [x] Kept `useTasks.ts` as the state, lifecycle, task-view, theme, and Obsidian action composition owner.
- [x] Preserved `useTasks` return names and callback signatures for App consumers.
- [x] Updated focused task state/list checks to verify their extracted behavior owner.
- [x] Ran focused task checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 468: Daily AI Content Inspection Extraction
- [x] Added RED/GREEN runtime verification for stable daily-note snapshot inspection.
- [x] Moved daily file read consistency checks, managed-AI marker detection, and snapshot construction into `electron/aiReviewDailyContentInspection.ts`.
- [x] Kept `aiReviewDailyRunner.ts` responsible for public inspection shaping, review orchestration, diagnostics, and passing the inspected snapshot into review execution.
- [x] Calibrated daily-review and regeneration structural checks to inspect their new behavior owner.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 469: App UI-State Persistence Snapshot Extraction
- [x] Added RED/GREEN runtime verification for persisted UI-state snapshot construction and structural equality.
- [x] Moved store-entry construction and allocation-conscious recursive comparison into `src/app/appUiStatePersistenceSnapshot.ts`.
- [x] Kept `appUiStatePersistence.ts` responsible for hydration ordering, compact-mode IPC, debounced persistence, and stale-write cancellation.
- [x] Calibrated the existing UI-state persistence verifier and added the snapshot verifier to cleanup-core.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 470: LLM Client Error-Message Policy Extraction
- [x] Added RED/GREEN verification requiring LLM transport diagnostics and error formatting to have a focused module.
- [x] Moved HTTP, stream, timeout, model-list, and automatic-candidate error-message policy into `shared/llm/llmClientErrorMessages.ts`.
- [x] Kept `openaiClient.ts` as the public request precondition and provider-candidate orchestration facade.
- [x] Updated the existing OpenAI verifier to assert the new policy boundary and added the focused verifier to cleanup-core.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 471: Obsidian Sync Preview Assembly Extraction
- [x] Added RED/GREEN verification requiring multi-date sync preview assembly to have a focused module.
- [x] Moved daily-note reads, shared preview construction, and single-pass preview aggregation into `electron/obsidianSyncPreview.ts`.
- [x] Kept `obsidianSync.ts` responsible for vault/input gating, affected-date planning, and the public preview/sync orchestration flows.
- [x] Updated the existing Obsidian sync verifier to inspect the extracted preview owner and added the focused verifier to cleanup-core.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 472: Obsidian Blog-Draft Assembly Extraction
- [x] Added RED/GREEN verification requiring blog-draft Markdown assembly to have a focused module.
- [x] Moved blog front matter, task-statistics calculation, and localized draft body assembly into `electron/obsidianBlogDraft.ts`.
- [x] Kept `obsidianDailyNoteContent.ts` as the owner of daily template bridging and managed-block migration, while composing the draft builder through its existing dependency inputs.
- [x] Updated the daily-note content verifier and added the focused verifier to cleanup-core.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 476: Obsidian Sync Blog-Draft Output Extraction
- [x] Added RED/GREEN verification requiring optional local blog-draft file output to have a focused module.
- [x] Moved directory/file guards, unchanged-write suppression, and optional-error isolation into `electron/obsidianSyncBlogDraftOutput.ts`.
- [x] Kept `obsidianSync.ts` responsible for primary daily-note sync, selected sync output, and follow-up overview/review orchestration.
- [x] Updated the existing Obsidian sync verifier and added the focused verifier to cleanup-core.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 477: Obsidian Companion Template/Rule Policy Extraction
- [x] Added RED/GREEN verification requiring Companion template rendering and rule matching to have a focused pure-policy module.
- [x] Moved date/time token formatting, case-insensitive template rendering, and rule matching into `electron/obsidianCompanionTemplateRules.ts`.
- [x] Kept `obsidianCompanionPlanning.ts` responsible for validated sync-plan construction, vault-bound path resolution, filesystem target inspection, and compatibility re-exports.
- [x] Updated stale Companion structural assertions to inspect the new policy owner while retaining planning delegation checks.
- [x] Ran focused checks, Companion runtime verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 478: AI Review Generation Presentation Extraction
- [x] Added RED/GREEN verification requiring generation display and progress policy to have a focused module.
- [x] Moved date helpers, result/progress display policy, progress component, diagnostics card, and initial/final progress construction into `AiReviewGenerationPresentation.tsx`.
- [x] Kept `AiReviewSettingsWidgets.tsx` focused on the stateful AI account-management entry point and preserved its public export path through compatibility re-exports.
- [x] Updated existing progress, diagnostics, and settings-module verifiers to inspect the new behavior owner.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 479: Task Completion Markdown Field Extraction
- [x] Added RED/GREEN verification requiring completion-dialog Markdown input behavior to have a focused component.
- [x] Moved textarea refs, Markdown editor wiring, task-switch history reset, selection restoration, and keyboard behavior into `TaskCompletionMarkdownField.tsx`.
- [x] Kept `TaskCompletionDialog.tsx` responsible for form composition, status guarding, dialog presentation, and completion actions.
- [x] Calibrated the existing form-hook verifier so it distinguishes the retained runtime status guard from removed state-transition rules.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 480: AI Review Block-Filling Extraction
- [x] Added RED/GREEN verification requiring individual review-block filling to have a focused implementation module.
- [x] Moved block discovery, freeze/skip policy, deterministic carryover construction, heading lookup, LLM cleanup, and block write-back into `reviewBlockFilling.ts`.
- [x] Kept `runner.ts` responsible for snapshot ownership, daily statistics, ordered execution, and final atomic file replacement.
- [x] Ran focused block-filling and runner verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 481: LLM Provider Text-Value Extraction
- [x] Added RED/GREEN verification requiring protocol-neutral LLM text-value normalization to have a focused module.
- [x] Moved segmented text extraction and normal/stream-safe first-value selection into `llmProviderTextValues.ts`.
- [x] Kept `llmProviderResponseParsing.ts` responsible for provider envelope paths, stream aggregation, and truncation semantics.
- [x] Updated the OpenAI client verifier to assert the new composition boundary.
- [x] Ran focused and existing LLM verification, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete

### Phase 482: Obsidian Template Task-Visibility Extraction
- [x] Added RED/GREEN verification requiring task-tree visibility indexing and sync-preview statistics to have a focused module.
- [x] Moved visible-task/review indexing and the single-pass visible statistics traversal into `shared/obsidianTemplateTaskVisibility.ts`.
- [x] Kept `obsidianTemplateTaskLines.ts` responsible for template-specific task-line rendering and retained its `collectVisibleTaskStats` export path for existing consumers.
- [x] Updated the daily-template structural verifier to inspect the new visibility owner.
- [x] Ran focused visibility and template behavior checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] Cleanup-core remains blocked by an unrelated stale `verify-context-menu` assertion that expects `useTasks` to directly expose `addSubtask`.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 483: Companion Capture Item Builder Extraction
- [x] Added RED/GREEN verification requiring desktop Companion `CaptureItem` construction to have a focused module.
- [x] Moved task/date filtering and daily work/inspiration item assembly into `src/store/companionCaptureItems.ts`.
- [x] Kept `taskStore.ts` as the Electron/store facade and preserved its established `buildCaptureItems` import path through a compatibility re-export.
- [x] Updated the existing Companion item and App composition verifiers to follow the focused builder boundary.
- [x] Ran focused Companion/task checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains expected to stop at the pre-existing `verify-context-menu` assertion that expects `useTasks` to expose `addSubtask` directly.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 484: App UI-State Load Snapshot Extraction
- [x] Added RED/GREEN runtime verification for malformed and valid Store values becoming the established UI-state load defaults.
- [x] Moved Store-record parsing, strict value validation, personalization normalization, and baseline theme-override construction into `src/app/appUiStateLoadSnapshot.ts`.
- [x] Kept `appUiStatePersistence.ts` responsible for IPC ordering, React state hydration, compact-mode coordination, and debounced persistence.
- [x] Updated persistence and personalization structural verifiers to inspect the focused load-snapshot owner.
- [x] Ran focused UI-state/personalization/window IPC checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the same unrelated `verify-context-menu` assertion that expects `useTasks` to expose `addSubtask` directly.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 485: Obsidian Overview-Refresh Extraction
- [x] Added RED/GREEN verification requiring the optional Python overview-refresh subprocess to have a focused module.
- [x] Moved the vault-local Python hook invocation, hidden-window settings, and silent-failure boundary into `electron/obsidianOverviewUpdate.ts`.
- [x] Kept `obsidianSyncDailyNote.ts` responsible for daily-note sync and preserved its existing `triggerOverviewUpdate` helper through a delegation wrapper.
- [x] Ran focused checks, Obsidian sync verification, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated `verify-context-menu` assertion that expects `useTasks` to expose `addSubtask` directly.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 486: Obsidian Vault Accessor Extraction
- [x] Added RED/GREEN verification requiring Vault path fallback and filesystem status checks to have a focused accessor factory.
- [x] Moved development default-path policy, malformed Store-value fallback, and Vault directory validation into `electron/obsidianVaultAccessors.ts`.
- [x] Kept `appStateAccessors.ts` as the settings/AI composition facade, preserving its three returned Vault accessor functions through composition.
- [x] Ran focused checks, existing app-state accessor verification, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated `verify-context-menu` assertion that expects `useTasks` to expose `addSubtask` directly.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 487: Personalization Load-Settings Extraction
- [x] Added RED/GREEN verification for Store-value parsing and personalization normalization ownership.
- [x] Moved unknown-value readers, opacity-override parsing, legacy theme matching, and removed-theme validation into `src/app/personalizationLoadSettings.ts`.
- [x] Kept `personalizationSettings.ts` focused on personalization actions/equality while preserving its existing public load-helper exports.
- [x] Updated the existing personalization verifier to inspect the dedicated load-settings owner.
- [x] Ran focused checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated `verify-context-menu` assertion that expects `useTasks` to expose `addSubtask` directly.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 488: Markdown Editor History Extraction
- [x] Added RED/GREEN runtime verification for coalesced typing, redo-branch truncation, repeated-value selection updates, and reset baselines.
- [x] Moved the pure undo/redo snapshot state machine into `src/hooks/markdownEditorHistory.ts`.
- [x] Kept `useMarkdownEditor.ts` responsible for React refs, DOM selection restoration, controlled-value callbacks, and Markdown keyboard commands.
- [x] Ran focused history/editor/field checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated `verify-context-menu` assertion that expects `useTasks` to expose `addSubtask` directly.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 489: Daily AI Review Progress Extraction
- [x] Added RED/GREEN runtime verification for daily AI-review progress labels, stage recording, request status, and final diagnostic status.
- [x] Moved fixed daily stage copy plus progress emission/recording policy into `electron/aiReviewDailyProgress.ts`.
- [x] Kept `aiReviewDailyRunner.ts` responsible for inspection, filesystem checks, template data, LLM execution, and final diagnostic assembly.
- [x] Updated the AI diagnostics structural verifier and registered the focused check in `verify:cleanup-core`.
- [x] Ran focused checks, AI runner regression, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated `verify-context-menu` assertion that expects `useTasks` to directly expose `addSubtask`.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 490: Task App-State Action Extraction
- [x] Added a RED/GREEN verification for settings persistence, retained-review cleanup, and selected-date note updates.
- [x] Moved application-setting updates plus daily work/inspiration record updates into `src/hooks/taskAppStateActions.ts`.
- [x] Kept `useTaskActions.ts` as the task-tree mutation and ordering callback owner; it composes memoized app-state handlers to preserve callback stability for unchanged dependencies.
- [x] Updated task-action and task-hook-state structure verifiers to inspect the new focused owner, and registered `verify:task-app-state-actions` in cleanup-core.
- [x] Ran focused checks, task-core regression, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated `verify-context-menu` assertion that expects `useTasks` to directly expose `addSubtask`.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 491: Task Completion Action Extraction
- [x] Added a RED/GREEN runtime verifier for completion-review creation, editing, confirmation, local deletion retention, and persistence.
- [x] Moved task/subtask completion-review lifecycle actions into `src/hooks/taskCompletionActions.ts` through injected task state, retention persistence, confirmation, ID, and timestamp dependencies.
- [x] Kept `useTaskActions.ts` responsible for React composition plus ordinary task-tree CRUD and ordering callbacks, while preserving its original public task-review action signatures.
- [x] Updated task-action/task-hook-state structure verifiers and registered `verify:task-completion-actions` in task-core and cleanup-core.
- [x] Ran focused checks, task-core regression, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated stale `verify-context-menu` assertion that expects `useTasks` to directly expose `addSubtask`.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 492: Task Tree Action Extraction
- [x] Added a RED/GREEN runtime verifier for ordinary task creation, trimmed subtask creation, toggle completion, task-field updates, collapse, priority, and selected-day clearing.
- [x] Moved ordinary task-tree CRUD actions into `src/hooks/taskTreeActions.ts` through injected state, ID, timestamp, and date dependencies.
- [x] Kept `useTaskActions.ts` responsible for React composition, completion-review/app-state handler composition, manual ordering callbacks, and coordinating order cleanup after base task deletion.
- [x] Updated task-action, task-hook-state, and task-list interaction structure verifiers to follow the extracted implementation owner.
- [x] Registered `verify:task-tree-actions` in task-core and cleanup-core; ran focused checks, task-core regression, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains blocked at the unrelated stale `verify-context-menu` assertion that expects `useTasks` to directly expose `addSubtask`.
- **Status:** complete (baseline cleanup-core blocker recorded)

### Phase 493: Tag Suggestion Lookup Memoization
- [x] Added RED/GREEN structural coverage requiring the tag pane to retain its selected-tag lookup set across input-only renders.
- [x] Kept the existing public `getTagSuggestions` API while routing the component through a focused `ReadonlySet` helper.
- [x] Repaired the context-menu verifier to validate `useTasks` composition with `useTaskActions` and the extracted public action contract, rather than requiring implementation names in the facade source.
- [x] Repaired two further stale aggregate checks to follow extracted App template-action wiring and shared Obsidian task-date resolution, then advanced cleanup-core into Electron shared-type coverage.
- [x] Repaired the Electron shared-type verifier to validate `obsidianVaultAccessors` as the `VaultStatus` owner and `appStateAccessors` as its forwarding facade.
- [x] Repaired the daily AI runner verifier to follow `progress.record` stage diagnostics after its progress helper extraction.
- [x] Ran the complete `verify:cleanup-core` suite, TypeScript checking, production build, and scoped whitespace validation.
- **Status:** complete (aggregate cleanup verification passed)

### Phase 494: Task Ordering Action Extraction
- [x] Added RED/GREEN runtime coverage for top-level deletion order cleanup, source-group reordering, and in-source manual ordering.
- [x] Moved manual-order state coordination from `useTaskActions.ts` into `src/hooks/taskOrderingActions.ts` with explicit tree-deletion, task-list, date, and setter dependencies.
- [x] Kept `useTaskActions.ts` as the React composition owner, preserving memoized callbacks and the existing public `TaskActions` contract.
- [x] Registered `verify:task-ordering-actions` in task-core and cleanup-core, then ran focused checks, task-core regression, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` now passes context-menu and stops at the unrelated stale `verify:date-key-reuse` assertion requiring `shared/obsidianTemplateTaskLines.ts` to directly import `taskRollover`.
- **Status:** complete (aggregate cleanup baseline blocker recorded)

### Phase 495: AI Review Diagnostics Extraction
- [x] Added a RED/GREEN runtime verifier for diagnostic identity, duration, profile sanitization, token aggregation, output accounting, truncation, and synthesized request stages.
- [x] Moved stage creation and final AI-run diagnostic assembly into `electron/aiReviewDiagnostics.ts`.
- [x] Kept `aiReviewRuntime.ts` responsible for account availability, provider invocation, progress IPC fanout, and DOCX extraction.
- [x] Updated the existing runtime verifier to assert the new composition boundary and registered the focused verifier in cleanup-core.
- [x] Ran focused diagnostics/runtime checks, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:cleanup-core` remains pending; this phase did not rerun the aggregate suite after its previously recorded baseline repairs.
- **Status:** complete

### Phase 496: Task Persistence Transforms Extraction
- [x] Added a RED/GREEN verifier for persisted task parsing, normalization, scheduled-date cleanup, review migration, and recursive subtask normalization.
- [x] Moved persisted-value guards and normalization into `src/hooks/taskPersistenceTransforms.ts`.
- [x] Kept `taskTransforms.ts` as the compatibility facade for persistence exports and date-query helpers.
- [x] Updated stale structural verifiers to inspect the persistence owner while retaining facade import/runtime coverage.
- [x] Ran scheduled-date, task hook-state, persistence, carryover, task-core, TypeScript, production-build, and scoped whitespace checks.
- **Status:** complete

### Phase 497: App Shell Composition Follow-Up
- [x] Identified the shell input interface as a compile-time-only responsibility distinct from runtime prop assembly.
- [x] Added a RED/GREEN verifier and extracted `AppShellCompositionOptions` into `src/app/appShellCompositionTypes.ts`.
- [x] Retained the established type export through `appShellComposition.tsx` for existing consumers.
- [x] Ran focused shell composition, main-content, overlay, TypeScript, production-build, and scoped whitespace checks.
- **Status:** complete

### Phase 498: Electron Main AI Review Services Composition
- [x] Identified AI runtime, delayed review bridge, Obsidian services, daily review runner, and timers as one dependency-cyclic composition responsibility.
- [x] Added and ran a focused RED/GREEN verifier for the composition boundary.
- [x] Extracted `electron/mainAiReviewServices.ts` while preserving the bridge-before-Obsidian-services and bind-runner-after-creation order.
- [x] Updated Electron structural verifiers to inspect the new composition owner and retain main-level delegation checks.
- [x] Ran focused regression, TypeScript, production build, and scoped whitespace checks.
- **Status:** complete

### Phase 499: Desktop Widget State Application Extraction
- [x] Re-scanned remaining high-line-count production modules and rejected a verification-only Companion split that would have only relocated a large fault-injection suite.
- [x] Added and observed a RED verifier for a focused desktop widget state application boundary.
- [x] Extracted desktop-visible, desktop-active, and app-background window/owner application into `electron/desktopWidgetStateApplier.ts`.
- [x] Kept `desktopWindowMode.ts` responsible for foreground-state resolution, guard lifetime, diagnostics, and mode orchestration.
- [x] Ran focused structural verification, TypeScript checking, production build, and scoped whitespace validation.
- [ ] `verify:window-mode` still fails at the pre-existing TitleBar `readWindowMode` structural assertion, unrelated to this extraction.
- **Status:** complete (unrelated baseline blocker recorded)

### Phase 500: Remaining Large-File Follow-Up
- [ ] Re-scan remaining high-line-count files and select the next behaviorally cohesive, testable extraction boundary.
- [ ] Keep existing public contracts and focused verifier ownership aligned with the actual composition layer.
- **Status:** pending
