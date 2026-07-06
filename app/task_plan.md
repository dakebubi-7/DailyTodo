# DailyTodo Code Cleanup Plan

## Goal
Make the DailyTodo codebase easier to maintain by clarifying module boundaries, preserving existing behavior, and keeping focused verification commands available for future changes.

## Current Phase
Complete

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
| `npm run verify:settings-basic-sections`; `npm run verify:settings-panel-modules`; `npm run verify:cleanup-core` | passed |
| `npm run build` | passed |
