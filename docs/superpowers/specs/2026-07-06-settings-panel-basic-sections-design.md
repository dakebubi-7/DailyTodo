# SettingsPanel Basic Sections Split Design

Date: 2026-07-06

## Goal

Continue the DailyTodo codebase cleanup by reducing `src/components/SettingsPanel.tsx` without changing runtime behavior or visible UI.

## Scope

This pass extracts only low-coupling Settings tabs from the large panel:

- Templates section
- Schedule section
- General section

This pass does not change copy, styles, AI review behavior, Obsidian sync behavior, or Appearance controls.

## Current State

`src/components/SettingsPanel.tsx` owns the full settings shell and still renders six tab bodies inline: `appearance`, `sync`, `templates`, `schedule`, `aiReview`, and `general`.

Existing extracted settings modules already cover shared form controls, Appearance helper functions, and AI Review widgets. The remaining lowest-risk extraction targets are the tabs that mostly forward props and render existing controls.

## Approach

Create three focused React components under `src/components/settings/`:

1. `TemplatesSettingsSection.tsx`
   - Renders the five template edit entry rows.
   - Accepts `zh` and optional `onEditTemplate`.

2. `ScheduleSettingsSection.tsx`
   - Renders rollover, auto carry-forward, and clear-completed controls.
   - Accepts localized `text`, app settings, current date/completion count, and app-setting/clear callbacks.

3. `GeneralSettingsSection.tsx`
   - Renders language, completion-record toggles, startup, tray, and always-on-top controls.
   - Accepts localized `text`, personalization settings, app settings, and update callbacks.

`SettingsPanel.tsx` remains responsible for:

- Open/close animation and settings navigation.
- AI Review state and generation actions.
- Appearance and sync sections until later dedicated passes.
- Wiring shared props into section components.

## Verification

Add `scripts/verify-settings-basic-sections.ts` and `verify:settings-basic-sections` to `package.json`.

The script checks that:

- All three new files exist.
- Each file exports the expected component.
- Each file contains a representative behavior marker from the old inline block.
- `SettingsPanel.tsx` imports and renders the three components.
- `SettingsPanel.tsx` no longer contains the representative inline section titles for these tabs.

Then run focused and broader verification:

- `npm run verify:settings-basic-sections`
- `npm run verify:settings-panel-modules`
- `npm run verify:cleanup-core`

## Non-Goals

- No UI redesign.
- No copy/encoding cleanup.
- No AI Review section extraction.
- No Obsidian sync section extraction.
- No changes to persisted settings keys or IPC contracts.

## Risks And Mitigations

| Risk | Mitigation |
|------|------------|
| Prop wiring changes behavior | Keep components presentational and pass existing callbacks through unchanged. |
| Type drift in app settings updates | Use generic update callback signatures matching the existing `updateApp` helper. |
| Accidental copy edits | Move existing JSX text as-is, including current mojibake where present. |
| Verification misses extraction | Add module-boundary checks and keep existing cleanup/typecheck suite. |
