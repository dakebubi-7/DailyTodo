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
- Global renderer styles enter through `app/src/styles/index.css`; React components should not import global CSS leaf files directly.
- Shared settings form controls live in `app/src/components/settings/SettingsControls.tsx`.
- Appearance-tab pure settings helpers live in `app/src/components/settings/appearanceSettings.ts`.
- AI review settings account/progress/diagnostic widgets live in `app/src/components/settings/AiReviewSettingsWidgets.tsx`.
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
- `npm run verify:style-entry`: single global CSS entry.
- `npm run verify:app-viewport-style-module`: App viewport style-token boundary.
- `npm run verify:app-task-tree-module`: App task-tree/date-helper boundary.
- `npm run verify:date-navigator-module`: Date navigator helper boundary.
- `npm run verify:settings-appearance-module`: Appearance helper boundary.
- `npm run verify:settings-ai-review-module`: AI review settings widget boundary.
- `npm run verify:settings-basic-sections`: Settings Templates/Schedule/General section boundaries.
- `npm run verify:rc`: broad release-candidate regression suite.
- `npm run build`: production Electron/Vite build.
