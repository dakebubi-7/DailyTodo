# DailyTodo Developer Code Guide

This guide maps the main DailyTodo settings, task, and Obsidian sync code paths.

For a broader current map of the app architecture, see `docs/DailyTodo-Codebase-Map.md`.

## Storage

- Electron Store is created in `app/electron/main.ts`.
- Task data is stored under the `tasks` key.
- Daily work notes use `dailyWorkNotes`.
- Inspiration notes use `dailyInspirationNotes`.
- App behavior settings use `appBehaviorSettings`.
- Obsidian template settings use `obsidianTemplateSettings`.

## Renderer State

- Task loading, saving, carryover, business-date rollover, and Obsidian autosync live in `app/src/hooks/useTasks.ts`.
- Pure task view and mutation helpers are split across `app/src/hooks/taskSelectors.ts`, `app/src/hooks/taskTransforms.ts`, `app/src/hooks/taskMutations.ts`, `app/src/hooks/taskReviewMutations.ts`, `app/src/hooks/taskOrderingState.ts`, `app/src/hooks/taskCarryover.ts`, `app/src/hooks/taskPersistence.ts`, and `app/src/hooks/taskObsidianSync.ts`.
- Recursive task lookup and subtask checks live in `app/src/utils/taskTree.ts`.
- Renderer IPC wrappers live in `app/src/store/taskStore.ts`.
- App viewport theme CSS variables live in `app/src/app/appViewportStyle.ts`.
- App personalization persistence, font-scale clamp, theme override memory, preset application, and reset helpers live in `app/src/app/appPersonalization.ts`.
- App UI-state Store loading/persistence lives in `app/src/app/appUiStatePersistence.ts`; App startup UI-state plus Companion/template settings orchestration lives in `app/src/app/appStartupSettings.ts`; App UI toggle actions for daily panels and task-list filters live in `app/src/app/appUiActions.ts`; `App.tsx` still owns hook placement, state initialization, and prop-bag assembly for the extracted shell components.
- App shell side-effect helpers live in `app/src/app/appShellEffects.ts`; `App.tsx` still owns the `useEffect` dependency arrays.
- App completion/review routing decisions live in `app/src/app/appCompletionFlow.ts`; App completion/review action workflows live in `app/src/app/appCompletionActions.ts`; `App.tsx` still owns task data sources, mutation dependency wiring, and dialog prop-bag assembly.
- App completion/review dialog derived task state lives in `app/src/app/appReviewDialogState.ts`; `App.tsx` still owns dialog handlers and task/review mutations.
- App template-editor kind mapping and default-template fallback selection live in `app/src/app/appTemplateEditor.ts`; `App.tsx` still owns modal state.
- App Obsidian template/settings sync action workflows live in `app/src/app/appObsidianTemplateActions.ts`; `App.tsx` supplies current task/note inputs, state setters, and store wrappers.
- App keyboard shortcut decision mapping, action application, and DOM listener registration live in `app/src/app/appKeyboardShortcuts.ts`; `App.tsx` still owns the React effect placement and dependency array.
- Obsidian Companion status message mapping lives in `app/src/app/appCompanionStatus.ts`; Companion action workflows consume it instead of inlining status copy.
- Obsidian Companion capture item composition and lazy current-item getter creation live in `app/src/app/appCompanionCapture.ts`; `App.tsx` still owns the current task/date/note/mobile inputs.
- Obsidian Companion mobile inbox item merging lives in `app/src/app/appCompanionMobile.ts`; Companion action workflows consume it while `App.tsx` still owns mobile inbox state.
- Obsidian Companion settings update composition and action workflows live in `app/src/app/appCompanionActions.ts`; `App.tsx` supplies settings, IPC/store functions, lazy capture lookup, and React state setters.
- Scheduled AI report date-key calculation and error diagnostics live in `app/src/app/appScheduledReports.ts`; AI review startup backfill, scheduled tick registration, and onboarding request wiring live in `app/src/app/appAiReviewLifecycle.ts`; `App.tsx` still owns React effect placement, task refs, and onboarding state.
- Popup task-menu action parsing, parsed-action routing, and edit-request nonce creation live in `app/src/app/taskMenuActions.ts`; `App.tsx` still owns the Electron listener and task mutation callbacks.
- App task-view filtering and drag-disabled derivation live in `app/src/app/appTaskView.ts`.
- Daily Work / Inspiration tab content detection, className composition, and title helpers live in `app/src/app/appDailyPanelPresentation.ts`; fixed top-area JSX now lives in `app/src/components/AppTopContent.tsx`, while `App.tsx` owns the prop bags and panel state.
- Outer frame viewport class selection, shell theme fallback, shell className composition, and low-opacity flag derivation live in `app/src/app/appShellPresentation.ts`; `App.tsx` still owns viewport styling inputs, layout, and the shell component tree.
- Fixed App shell composition is now split across `app/src/components/AppTopContent.tsx`, `app/src/components/AppMainContent.tsx`, and `app/src/components/AppOverlayStack.tsx`; `App.tsx` still owns state, helper/action factories, and explicit prop-bag derivation for each boundary.
- TaskItem popup context-menu theme and payload construction live in `app/src/components/taskItem/taskItemContextMenu.ts`; `TaskItem.tsx` still owns DOM lookup, React events, and IPC invocation.
- TaskItem subtask virtualization lives in `app/src/components/taskItem/useVirtualSubtasks.ts`; subtask row rendering/actions live in `app/src/components/taskItem/SubtaskCard.tsx`; shared TaskItem icons, priority titles, parent cluster/card class composition, parent text tooltip formatting, parent metadata preview helpers, completion action class/label helpers, and review action label helpers live in `app/src/components/taskItem/taskItemPresentation.tsx`; stack presentation constants and CSS custom-property style helper live in `app/src/components/taskItem/taskItemStack.ts`; nested event propagation and parent-cluster keyboard toggle helpers live in `app/src/components/taskItem/taskItemInteractions.ts`;  edit-submit and edit-key decision helpers live in `app/src/components/taskItem/taskItemEditing.ts`.
- Global renderer styles enter through `app/src/styles/index.css`; React components should not import global CSS leaf files directly.
- Shared settings form controls live in `app/src/components/settings/SettingsControls.tsx`.
- Appearance-tab pure settings helpers live in `app/src/components/settings/appearanceSettings.ts`.
- Appearance tab UI lives in `app/src/components/settings/AppearanceSettingsSection.tsx`; `SettingsPanel.tsx` passes theme/app settings and apply/reset callbacks into it.
- AI review settings account/progress/diagnostic widgets live in `app/src/components/settings/AiReviewSettingsWidgets.tsx`.
- AI Review timer settings UI lives in `app/src/components/settings/AiReviewTimerSettingsSection.tsx`; `SettingsPanel.tsx` still owns settings persistence and generation/progress side effects.
- Template edit-entry settings live in `app/src/components/settings/TemplatesSettingsSection.tsx`.
- Rollover, auto carry-forward, and clear-completed settings live in `app/src/components/settings/ScheduleSettingsSection.tsx`.
- Language, completion-record, startup, tray, and always-on-top settings live in `app/src/components/settings/GeneralSettingsSection.tsx`.
- Date navigator calendar/date helpers live in `app/src/components/dateNavigator/dateNavigatorUtils.ts`.
- Shared settings defaults and validation live in `app/shared/appSettings.ts`.
- Business-date and carryover helpers live in `app/shared/taskRollover.ts`.

## Electron Shell

- App lifecycle, IPC, window modes, tray behavior, Obsidian sync, and AI report wiring still live in `app/electron/main.ts`.
- App/tray icon path resolution and fallback native-image creation live in `app/electron/appIcons.ts`.
- Window bounds, settings-mode sizing, and restored-state normalization live in `app/electron/windowState.ts`.
- Safe Electron Store creation and corrupt-config recovery live in `app/electron/safeStore.ts`.
- Crash diagnostics and diagnostic logging live in `app/electron/diagnostics.ts`.
- Window-control IPC registration lives in `app/electron/windowIpc.ts`. It receives `main.ts` state and functions through explicit dependencies and should not create stores or own window-mode state.
- Store and app/template settings IPC registration lives in `app/electron/settingsIpc.ts`. It preserves task-change broadcasts from `store:set` and Obsidian template reset behavior.
- Task context menu IPC registration lives in `app/electron/taskContextMenuIpc.ts`. Popup creation and mutable popup state stay in `main.ts`; resize/action forwarding behavior is registered through injected window accessors.

## Obsidian Sync

- Legacy DailyTodo daily-note sync lives in `app/electron/main.ts`.
- Template rendering and managed-block helpers live in `app/shared/obsidianTemplates.ts`.
- Companion rule-based sync lives in `app/electron/obsidianCompanion.ts`.
- Companion defaults live in `app/shared/obsidianCompanionDefaults.ts`.
- The Windows RC writes one normal DailyTodo daily note by default: `logs/daily/DailyTodo/{{date}}.md`.
- `logs/daily/DailyTodo/tasks/{{date}}.md` is a legacy task export path. The RC does not write it by default and does not delete existing files automatically.

## Managed Markers

DailyTodo only replaces content inside these managed markers:

- `<!-- DAILYTODO:WORK:START -->` / `<!-- DAILYTODO:WORK:END -->`
- `<!-- DAILYTODO:INSPIRATION:START -->` / `<!-- DAILYTODO:INSPIRATION:END -->`
- `<!-- DAILYTODO:TASKS:START -->` / `<!-- DAILYTODO:TASKS:END -->`

Content outside those markers is user-owned Obsidian content and should not be overwritten.

## Safe Template Testing

1. Use Settings > Obsidian Sync > Preview sync before writing.
2. Keep marker names stable unless deliberately testing recovery behavior.
3. Use a test vault or a copied daily note when changing path templates.
4. Verify that user-owned content outside DailyTodo markers remains unchanged.
5. Restore default templates if a generated note duplicates sections or stops replacing managed blocks.

## Current Cleanup Cautions

- Keep Electron Store key names stable unless a migration is included.
- Keep DAILYTODO managed marker strings stable unless recovery behavior is included.
- Treat `electron/main.ts`, `src/components/SettingsPanel.tsx`, `src/App.tsx`, and `src/hooks/useTasks.ts` as high-risk files because they span multiple subsystems.
- Clean `src/i18n.ts` encoding in a dedicated pass before editing large amounts of UI copy.

## Useful Verification Commands

- `npm run verify:cleanup-core`: focused cleanup regression plus TypeScript.
- `npm run verify:settings-panel-modules`: settings shared-control boundary.
- `npm run verify:electron-main-modules`: Electron icon-helper boundary.
- `npm run verify:electron-window-state-module`: Electron window-state helper boundary.
- `npm run verify:electron-foundation-modules`: Electron safe-store and diagnostics boundary.
- `npm run verify:electron-window-ipc-module`: Electron window IPC registration boundary.
- `npm run verify:electron-settings-ipc-module`: Electron store/settings IPC registration boundary.
- `npm run verify:electron-task-context-menu-ipc-module`: Electron task context menu IPC registration boundary.
- `npm run verify:style-entry`: single global CSS entry.
- `npm run verify:app-viewport-style-module`: App viewport style-token boundary.
- `npm run verify:app-task-tree-module`: App task-tree/date-helper boundary.
- `npm run verify:app-task-menu-actions-module`: App popup task-menu action parsing/routing/listener registrar helper boundary.
- `npm run verify:app-task-view-module`: App task-view helper boundary.
- `npm run verify:app-personalization-module`: App personalization normalization, theme override, and personalization action helper boundary.
- `npm run verify:app-theme-state-module`: App theme-state helper boundary.
- `npm run verify:app-review-dialog-state-module`: App review-dialog-state helper boundary.
- `npm run verify:app-ui-state-persistence-module`: App UI-state persistence helper boundary.
- `npm run verify:app-startup-settings-module`: App startup settings helper boundary.
- `npm run verify:app-ui-actions-module`: App UI action helper boundary plus `taskListProps` / `addTaskInputProps` wiring.
- `npm run verify:app-top-content-module`: App top-area composition boundary between `App.tsx` prop bags and `AppTopContent.tsx`.
- `npm run verify:app-main-content-module`: App main-body composition boundary between `App.tsx` prop bags and `AppMainContent.tsx`.
- `npm run verify:app-overlay-stack-module`: App overlay composition boundary between `App.tsx` prop bags and `AppOverlayStack.tsx`.
- `npm run verify:app-modal-actions-module`: App modal/shell action helper boundary, including template editing and completion/review dialog state callbacks.
- `npm run verify:app-shell-effects-module`: App shell-effects helper boundary.
- `npm run verify:app-companion-capture-module`: App companion-capture composition and lazy getter helper boundary.
- `npm run verify:app-companion-mobile-module`: App companion-mobile helper boundary.
- `npm run verify:app-companion-actions-module`: App companion settings updater and action workflow helper boundary.
- `npm run verify:app-completion-flow-module`: App completion-flow helper boundary.
- `npm run verify:app-completion-actions-module`: App completion action workflow helper boundary.
- `npm run verify:app-template-editor-module`: App template-editor helper boundary.
- `npm run verify:app-obsidian-template-actions-module`: App Obsidian template action workflow helper boundary.
- `npm run verify:app-ai-review-lifecycle-module`: App AI review startup/tick/onboarding lifecycle helper boundary.
- `npm run verify:task-item-context-menu-helper`: TaskItem context-menu theme/payload helper boundary.
- `npm run verify:task-item-virtual-subtasks-hook`: TaskItem virtual-subtasks hook boundary.
- `npm run verify:task-item-subtask-card-module`: TaskItem SubtaskCard/presentation helper boundary, including parent task tooltip, metadata previews, completion/review action presentation, and cluster/card class formatting.
- `npm run verify:task-item-stack-helper`: TaskItem stack presentation constants/count/style helper boundary.
- `npm run verify:task-item-interactions-helper`: TaskItem nested event propagation and cluster keyboard toggle helper boundary.
- `npm run verify:task-item-editing-helper`: TaskItem edit-submit text and edit-key action helper boundary.
- `npm run verify:date-navigator-module`: Date navigator helper boundary.
- `npm run verify:settings-appearance-module`: Appearance helper boundary.
- `npm run verify:settings-appearance-section`: Settings Appearance section boundary.
- `npm run verify:settings-ai-review-module`: AI review settings widget boundary.
- `npm run verify:settings-ai-review-section`: AI Review root settings section composition boundary.
- `npm run verify:settings-ai-review-report-routing-section`: AI Review report account routing section boundary.
- `npm run verify:settings-ai-review-source-section`: AI Review report source/base settings section boundary.
- `npm run verify:settings-ai-review-manual-generation-section`: AI Review manual generation UI section boundary.
- `npm run verify:settings-ai-review-timer-section`: AI Review timer settings section boundary.
- `npm run verify:settings-basic-sections`: Settings Templates/Schedule/General section boundaries.
- `npm run verify:rc`: broad release-candidate regression suite.
- `npm run build`: production Electron/Vite build.

- When editing AI Review settings UI, keep persistence/generation side effects in `SettingsPanel.tsx`; `AiReviewSettingsSection` and child settings sections should remain presentational composition boundaries.
