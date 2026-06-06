# DailyTodo Developer Code Guide

This guide maps the main DailyTodo settings, task, and Obsidian sync code paths.

## Storage

- Electron Store is created in `app/electron/main.ts`.
- Task data is stored under the `tasks` key.
- Daily work notes use `dailyWorkNotes`.
- Inspiration notes use `dailyInspirationNotes`.
- App behavior settings use `appBehaviorSettings`.
- Obsidian template settings use `obsidianTemplateSettings`.

## Renderer State

- Task loading, saving, carryover, business-date rollover, and Obsidian autosync live in `app/src/hooks/useTasks.ts`.
- Renderer IPC wrappers live in `app/src/store/taskStore.ts`.
- Shared settings defaults and validation live in `app/shared/appSettings.ts`.
- Business-date and carryover helpers live in `app/shared/taskRollover.ts`.

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
