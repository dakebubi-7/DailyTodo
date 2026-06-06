# DailyTodo Windows RC Design

## Goal

Prepare DailyTodo as a Windows release-candidate desktop app: clean visible UI issues, make Obsidian sync predictable, remove mojibake from app-owned text, document developer/template workflows in Chinese and English, and produce a Windows installer.

The release target is a usable Windows installation package, with a `win-unpacked` directory kept as a test artifact.

## Current Context

DailyTodo is an Electron + React + TypeScript desktop app in `app/`.

- App shell: `app/src/App.tsx`
- Main task state: `app/src/hooks/useTasks.ts`
- Window controls: `app/src/components/TitleBar.tsx`
- Daily work editor and slash menu: `app/src/components/DailyWorkPanel.tsx`
- Settings UI: `app/src/components/SettingsPanel.tsx`
- App strings: `app/src/i18n.ts`
- App settings and Obsidian template defaults: `app/shared/appSettings.ts`
- Obsidian daily-note renderer: `app/shared/obsidianTemplates.ts`
- Electron Obsidian writing and packaging entry: `app/electron/main.ts`
- Existing docs: `docs/DailyTodo-Developer-Code-Guide.md`, `docs/DailyTodo-Obsidian-Companion-User-Guide.md`

The current build passes with `npm run build`, but app-owned Chinese text in several source and data files is mojibake. The installed-quality blocker is polish and correctness, not basic compilation.

## Decisions Already Approved

1. Use the full release-candidate route, not a minimal hotfix.
2. Obsidian should keep one DailyTodo daily note per date.
3. DailyTodo should stop creating the separate `logs/daily/DailyTodo/tasks/{{date}}.md` task export by default.
4. The release artifact should be a Windows installer.

## Product Shape

DailyTodo remains a focused desktop daily-task tool, not a full project manager. The release should feel reliable and calm:

- compact floating window
- predictable titlebar controls
- readable settings panel even in narrow windows
- one clear Obsidian daily-note output
- practical documentation for the owner/developer

No new AI summarization, cloud sync, or bidirectional Obsidian parsing belongs in this RC.

## UI and Interaction Design

### Right-Side Display and Narrow Window

The app must support the saved narrow window state currently present in `data/config.json` (`width: 240`). At that width:

- titlebar action buttons must remain reachable
- settings panel must not leave blank right-side space or render outside the shell
- popovers and menus must clamp to the viewport
- text must truncate or wrap intentionally, not overflow into controls

The settings panel should behave like an inset sheet inside the app shell. It should use full available width with safe inset spacing, `max-width` for larger windows, and internal vertical scrolling.

### Today Task Editor Buttons

The Daily Work and Inspiration editor buttons should all be functional:

- close
- cancel
- save
- expand/collapse or keep-expanded control
- slash command menu commands

The expand control must not disappear or become hard to click after text is entered. It should stay pinned in a stable editor corner with enough hit area.

If the current expand button is only decorative, the RC should either make it actually expand the editor or rename/remove it. A visible button that does nothing is not acceptable.

### Always-On-Top and Lock Position

Keep these controls distinct:

- Always on top: toggles Electron `alwaysOnTop`
- Lock position: disables dragging without disabling buttons
- Reset to top right: remains in the more menu

The pin button visual state must always reflect `win.isAlwaysOnTop()`. After toggling off, the active style must clear immediately. Startup state must read the persisted Electron state.

The lock button visual state must reflect `appSettings.lockWindowPosition`, and locked mode must still allow all titlebar buttons to be clicked.

### Slash Command Menu

Typing `/` in Daily Work or Inspiration opens a lightweight command menu. Commands insert markdown at the cursor.

Commands should use tasks for the selected DailyTodo date only:

- Insert selected date task list
- Insert open tasks for selected date
- Insert completed tasks for selected date
- Insert task review summary for selected date

The label can say "today" when the selected date is the business date, but behavior must follow `selectedDate`.

## Obsidian Sync Design

### One Daily File

DailyTodo's default Obsidian output becomes:

- `logs/daily/DailyTodo/{{date}}.md`

The separate task export path is deprecated for the RC:

- `logs/daily/DailyTodo/tasks/{{date}}.md`

The app should stop writing that file by default. Existing files are user data and should not be deleted automatically.

### Managed Blocks

DailyTodo continues to own only content inside these markers:

- `<!-- DAILYTODO:WORK:START -->` / `<!-- DAILYTODO:WORK:END -->`
- `<!-- DAILYTODO:INSPIRATION:START -->` / `<!-- DAILYTODO:INSPIRATION:END -->`
- `<!-- DAILYTODO:TASKS:START -->` / `<!-- DAILYTODO:TASKS:END -->`

Content outside those markers remains user-owned.

### Companion Boundary

The rule-based Companion should not append duplicate sections into the same file by default. For RC, default Companion behavior should either:

- be clearly marked as advanced/manual, or
- target a separate inbox-style destination that cannot duplicate the main managed daily note.

Normal DailyTodo sync is the primary source of truth for the daily note.

### Historical Task Files

Existing `logs/daily/DailyTodo/tasks/*.md` files should be handled conservatively:

- do not delete them during app startup or sync
- document that they are legacy task exports
- optionally provide a manual archive procedure in the template manual

## Text and Encoding Design

App-owned strings must be normalized to readable UTF-8. This includes:

- `app/src/i18n.ts`
- `app/shared/appSettings.ts`
- `app/shared/obsidianTemplates.ts`
- visible settings strings in `SettingsPanel.tsx`
- docs created for this RC

User-authored task text and notes in `data/config.json` should not be automatically rewritten in this RC. They may already contain mojibake from previous builds; changing user data needs a separate backup-and-migration design.

The RC may include a diagnostic note explaining how to recover old mojibake data manually later.

## Documentation Design

Create or update bilingual Chinese/English documents:

1. Developer Manual and Cases
   - app architecture
   - storage keys
   - task lifecycle
   - Obsidian managed blocks
   - how to run, verify, build, and package
   - common modification cases

2. Template Adjustment Manual and Cases
   - daily note template fields
   - safe path rules
   - marker rules
   - examples for Chinese and English headings
   - how to preview sync
   - how to handle legacy task export files

Docs should be practical, not marketing copy.

## Packaging Design

Package as a Windows installer with Electron Builder.

Required outputs:

- installer artifact under `app/release/`
- `win-unpacked` test directory
- clear release notes or README explaining which artifact to run

Package config should support NSIS installer generation. If code signing is not available, the RC should document that the installer is unsigned and may show Windows SmartScreen warnings.

## Testing and Verification

Automated or scripted checks:

- `npm run build`
- Obsidian template rendering does not write task export by default
- slash command commands use selected-date tasks
- app strings do not contain obvious mojibake patterns in app-owned source
- settings/template defaults are readable UTF-8

Manual verification:

- open the app at narrow saved width around 240px
- open settings and check right-side display
- toggle always-on-top on and off and verify active style changes
- toggle lock position and verify buttons still work
- open Daily Work, type text, verify expand/save/cancel/close
- type `/`, insert selected-date tasks, confirm it does not include other dates
- sync to Obsidian, confirm one daily note is written and no new `tasks/{{date}}.md` appears
- build Windows installer and launch the installed app

## Out of Scope

- deleting or migrating existing user-authored `data/config.json` content
- automatically deleting legacy Obsidian task export files
- cloud sync
- bidirectional Obsidian task parsing
- AI summarization
- store submission metadata beyond a clean Windows installer

## Acceptance Criteria

The RC is acceptable when:

- the app builds successfully
- Windows installer is generated
- visible app-owned Chinese and English UI text is readable
- narrow-window UI is usable
- today/daily editor buttons work
- pin and lock button states are reliable
- `/` commands insert selected-date task content
- Obsidian sync writes one managed daily note by default
- bilingual developer and template manuals exist
