# DT Settings, Sync, and Daily Workflow Design

## Goal

Make DailyTodo easier to configure and safer to sync with Obsidian while keeping the main task workflow light. The design adds a two-level settings structure, configurable daily rollover time, clearer carryover rules, Obsidian deletion behavior, template editing, language switching, titlebar position locking, and a lightweight slash command menu for daily work notes.

## Current Code Context

DailyTodo is an Electron + React + TypeScript app.

- Frontend app shell: `app/src/App.tsx`
- Task state and Obsidian autosync trigger: `app/src/hooks/useTasks.ts`
- Renderer store wrappers and capture item builder: `app/src/store/taskStore.ts`
- Main process window and Obsidian writing logic: `app/electron/main.ts`
- Existing Companion rules and templates: `app/shared/obsidianCompanionDefaults.ts`
- Existing Companion sync engine: `app/electron/obsidianCompanion.ts`
- Settings panel: `app/src/components/SettingsPanel.tsx`
- Titlebar controls: `app/src/components/TitleBar.tsx`
- Daily work dialog: `app/src/components/DailyWorkPanel.tsx`

The current Obsidian daily-note sync writes managed blocks using markers:

- `<!-- DAILYTODO:WORK:START -->` / `<!-- DAILYTODO:WORK:END -->`
- `<!-- DAILYTODO:INSPIRATION:START -->` / `<!-- DAILYTODO:INSPIRATION:END -->`
- `<!-- DAILYTODO:TASKS:START -->` / `<!-- DAILYTODO:TASKS:END -->`

Content outside those markers is user-owned Obsidian content and must not be overwritten by DailyTodo.

## Design Decisions

### 1. Settings Structure

Settings should become a two-level panel.

First-level settings entries:

- Personalization
- Obsidian Sync
- Daily Rollover
- General
- Developer

The first level is a navigation surface. Each second-level view owns one coherent group of controls and has a back action.

### 2. General and Language

Language switching belongs inside settings because it is a low-frequency preference.

Location:

- Settings > General > Language

Supported values:

- Chinese
- English

The language setting changes the application shell only:

- buttons
- titles
- settings text
- dialogs
- status messages
- slash command menu labels

It must not translate or rewrite:

- task text
- daily work text
- inspiration text
- existing Obsidian notes

Implementation should use a small i18n dictionary layer instead of scattering user-facing strings through components.

### 3. Obsidian Sync

Settings > Obsidian Sync should include normal, non-developer controls:

- Obsidian vault path
- Daily note target path, default `logs/daily/DailyTodo/{{date}}.md`
- Task export path, default `logs/daily/DailyTodo/tasks/{{date}}.md`
- Delete-sync behavior
- Daily note template center
- Sync preview
- Restore default templates

Delete-sync behavior:

- `syncDeletedReviewsToObsidian`: default `true`
- `confirmBeforeDeletingReview`: default `false`

When `syncDeletedReviewsToObsidian` is enabled, DailyTodo is the source of truth for the `DAILYTODO:TASKS` managed block. Deleting a completion record in DT removes that record from the next Obsidian sync output for the affected date.

When `confirmBeforeDeletingReview` is enabled, deleting a completion record prompts the user before deletion. The prompt explains that the local completion record will be deleted and, if delete-sync is enabled, the managed Obsidian block will be updated on sync.

User-owned Obsidian content outside DailyTodo markers remains untouched.

### 4. Obsidian Template Center

Template editing should be available in Settings > Obsidian Sync, not only in Developer mode.

Normal template editor:

- Daily note path
- Work section title
- Inspiration section title
- Task section title
- Review section title
- Tomorrow task section title
- Reusable knowledge section title
- Task line template
- Completion review template
- Knowledge card template
- Live preview for selected date
- Restore defaults

Advanced template editing belongs under Developer:

- raw JSON rule editor
- raw template editor
- marker names
- full Companion rules
- validation diagnostics

Advanced editing must include a risk note because broken markers or paths can duplicate content or prevent managed-block replacement.

### 5. Sync Preview

Add a sync preview before writing when requested.

Preview should show:

- files that will be created or updated
- managed blocks that will be replaced
- number of tasks and completion records included
- whether a deleted review will disappear from the generated block

This is especially useful when editing templates.

### 6. Daily Rollover

Settings > Daily Rollover should include:

- `rolloverTime`, default `05:00`
- `autoCarryForward`, default `true`
- carryover rule explanation

DailyTodo should calculate the app's business date from `rolloverTime`, not from natural midnight.

Example with `05:00`:

- `2026-05-27 04:30` belongs to business date `2026-05-26`
- `2026-05-27 05:01` belongs to business date `2026-05-27`

Carryover rule:

- incomplete tasks carry forward
- completed tasks with latest completion percent below 100 carry forward
- completed tasks with latest completion percent equal to 100 do not carry forward
- tasks completed using "complete without review" do not carry forward
- review summary text does not decide carryover by itself

The rollover check should run on startup and while the app remains open, so crossing the configured rollover time triggers the same carryover logic as app startup.

### 7. Daily Work Slash Commands

Inside the Daily Work editor, typing `/` opens a lightweight command menu.

Commands:

- Insert today's task list
- Insert open tasks
- Insert completed tasks
- Insert task review summary

The selected command inserts markdown at the cursor position. This should not turn the editor into a full markdown editor.

The expand or resize action must remain easy to reach after text has been entered. The expand/collapse button should be pinned to a stable corner of the editor and should not disappear based on whether the text area has content.

### 8. Titlebar Window Controls

Keep these controls separate:

- Always on top: window stays above other windows
- Lock position: window cannot be dragged
- Reset to top right: low-frequency rescue action

`Reset to top right` should remain in the more menu or a low-frequency window/position section. It should not become a permanent prominent titlebar button.

Lock position should disable the titlebar drag region while keeping buttons clickable. The user must always have a clear way to unlock movement.

### 9. Developer Mode

Developer mode should be more complete but clearly separated from normal settings.

Developer tools should include:

- open app data folder
- open `data/config.json`
- open source folder
- open Obsidian output folder
- show code structure guide
- export settings backup
- import settings backup with validation
- reload settings
- show debug state summary
- advanced raw Obsidian template/rule editor
- reset Obsidian templates to defaults

Developer mode should include a built-in code guide explaining:

- where tasks are stored
- where task state is managed
- where Obsidian sync is implemented
- where settings live
- how managed Obsidian markers protect user content
- how to safely test template changes

This guide should also be saved as a markdown document in the repo.

## Suggested Data Model Additions

Add a settings object for app behavior:

```ts
interface AppBehaviorSettings {
  language: 'zh-CN' | 'en-US';
  rolloverTime: string;
  autoCarryForward: boolean;
  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
  lockWindowPosition: boolean;
}
```

Add Obsidian template settings:

```ts
interface ObsidianTemplateSettings {
  dailyNotePath: string;
  taskExportPath: string;
  workSectionTitle: string;
  inspirationSectionTitle: string;
  taskSectionTitle: string;
  reviewSectionTitle: string;
  tomorrowTaskSectionTitle: string;
  reusableKnowledgeSectionTitle: string;
  taskLineTemplate: string;
  completionReviewTemplate: string;
  knowledgeCardTemplate: string;
}
```

Defaults must preserve current output structure as closely as possible, except where existing mojibake strings need to be normalized to readable Chinese.

## Testing Strategy

Test the risky behavior first:

- business date calculation around rollover time
- carryover runs on startup and while app is open
- deleting a completion review changes the next generated Obsidian task block
- user-owned content outside markers is preserved
- template reset restores defaults
- language switch changes shell labels but not user data
- lock position disables drag while preserving button clicks

Manual verification should include:

- create a task, complete it with 50%, cross rollover, confirm carryover
- complete a task with 100%, cross rollover, confirm no carryover
- delete one completion review, sync, confirm Obsidian managed block updates
- edit a template, preview sync, restore defaults
- switch language, restart app, confirm setting persists

## Out of Scope for This Pass

- AI summarization inside DT
- bidirectional parsing of Obsidian task edits back into DT
- full markdown editor
- multi-vault sync
- cloud sync
- changing historical Obsidian notes when language changes

## Open Follow-Up

Bidirectional Obsidian sync is valuable but should be a separate design. It needs conflict rules for what happens when the same task is changed in DT and Obsidian.
