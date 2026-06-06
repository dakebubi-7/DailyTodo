# DailyTodo Windows RC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce a DailyTodo Windows release candidate with clean UI behavior, one-file Obsidian sync, readable app-owned text, bilingual manuals, and a Windows installer.

**Architecture:** Add lightweight verification scripts around risky behavior, then make narrowly scoped changes in shared sync helpers, Electron write logic, renderer UI components, app strings, docs, and package config. Avoid migrating user-authored data or deleting legacy Obsidian files.

**Tech Stack:** Electron 34, React 18, TypeScript, electron-vite, electron-builder, TSX verification scripts.

---

### Task 1: Add RC Verification Scripts

**Files:**
- Create: `app/scripts/verify-rc-sync.ts`
- Create: `app/scripts/verify-rc-strings.ts`
- Modify: `app/package.json`

- [ ] Add `verify-rc-sync.ts` to assert the RC sync contract: the preview has one daily file, no task export file, and generated content keeps managed task markers.
- [ ] Add `verify-rc-strings.ts` to scan app-owned source/docs for common mojibake tokens.
- [ ] Add package scripts `verify:rc-sync`, `verify:rc-strings`, and `verify:rc`.
- [ ] Run `npm run verify:rc-sync` and confirm it fails before the sync change because the current preview returns a task export file.

### Task 2: Stop Writing Obsidian Task Export Files

**Files:**
- Modify: `app/shared/appSettings.ts`
- Modify: `app/shared/obsidianTemplates.ts`
- Modify: `app/electron/main.ts`
- Modify: `app/src/components/SettingsPanel.tsx`

- [ ] Remove task export from default normal sync behavior.
- [ ] Keep the template field only as legacy/developer-facing information if needed, but normal sync must not write `logs/daily/DailyTodo/tasks/{{date}}.md`.
- [ ] Update sync preview to report only the daily note file.
- [ ] Update settings copy to explain legacy task export files are not deleted automatically.
- [ ] Run `npm run verify:rc-sync` and confirm it passes.

### Task 3: Fix App-Owned Mojibake Text

**Files:**
- Modify: `app/src/i18n.ts`
- Modify: `app/shared/appSettings.ts`
- Modify: `app/shared/obsidianTemplates.ts`
- Modify: `app/src/components/Header.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/electron/main.ts`

- [ ] Replace app-owned Chinese UI, settings, tray, dialog, and Obsidian template strings with readable UTF-8 Chinese.
- [ ] Keep English strings readable and consistent.
- [ ] Do not rewrite user data in `data/config.json`.
- [ ] Run `npm run verify:rc-strings` and confirm it passes for app-owned source and docs.

### Task 4: Repair Narrow-Window UI and Buttons

**Files:**
- Modify: `app/src/components/TitleBar.tsx`
- Modify: `app/src/components/DailyWorkPanel.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] Make the pin button state refresh from Electron after toggles and when the window regains focus.
- [ ] Make the Daily Work expand button functional with compact and expanded dialog states.
- [ ] Keep expand/close/save/cancel reachable after typing.
- [ ] Clamp titlebar, settings panel, menus, and dialogs at the saved 240px window width.
- [ ] Keep `/` menu behavior based on selected-date tasks; adjust labels to say selected date rather than all tasks.

### Task 5: Update Bilingual Manuals

**Files:**
- Modify: `docs/DailyTodo-Developer-Code-Guide.md`
- Create: `docs/DailyTodo-Developer-Manual-and-Cases.zh-en.md`
- Create: `docs/DailyTodo-Template-Adjustment-Manual-and-Cases.zh-en.md`
- Modify: `app/README.md`

- [ ] Write a bilingual developer manual covering architecture, storage keys, task lifecycle, Obsidian markers, verification, build, packaging, and common cases.
- [ ] Write a bilingual template manual covering fields, paths, markers, examples, preview, and legacy task exports.
- [ ] Update README to point to the RC installer and manuals.
- [ ] Include the unsigned installer note for Windows SmartScreen.

### Task 6: Package Windows Installer and Verify

**Files:**
- Modify: `app/package.json`

- [ ] Configure `electron-builder` to produce NSIS installer and `win-unpacked`.
- [ ] Run `npm run build`.
- [ ] Run `npm run verify:rc`.
- [ ] Run `npm run electron:build`.
- [ ] Confirm `app/release/DailyTodo.exe` installer and `app/release/win-unpacked/DailyTodo.exe` exist.
- [ ] Report exact verification output and artifact paths.
