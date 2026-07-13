# Windows Productization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn DailyTodo from a working Electron desktop app into a product-grade Windows application with stable window behavior, diagnostics, installer/update flow, data safety, and Windows-native integration.

**Architecture:** Keep the existing Electron + React + TypeScript foundation. Add productization through focused Electron main-process services, typed preload APIs, targeted settings UI additions, and verification scripts that match the existing `scripts/verify-*.ts` pattern.

**Tech Stack:** Electron 34, electron-vite, React 18, TypeScript 5.7, electron-builder NSIS, electron-store, existing Koffi Win32 bridge, planned `electron-log` and `electron-updater`.

---

## Scope

This plan intentionally keeps the current framework. It does not migrate to Tauri, WinUI, WPF, SQLite, or a cloud backend. The product-grade target is Windows-first, with later macOS/Linux support left as a separate project.

## Current Baseline

- `package.json` already has Electron, electron-vite, electron-builder, NSIS config, many verification scripts, and `electron:build`.
- `electron/main.ts` already handles the main window, tray, single instance, Win32 desktop behavior, Obsidian sync, AI review IPC, diagnostics startup, and app lifecycle.
- `electron/windowState.ts` already centralizes basic window dimensions.
- `electron/windowIpc.ts` already handles minimize/close, window mode, reset position, settings width, compact mode, and auto start.
- `electron/safeStore.ts` already protects against corrupt `electron-store` config.
- `electron/diagnostics.ts` exists and is already imported by `electron/main.ts`.
- `electron/preload.ts` already exposes a broad `window.electronAPI` bridge.

## Target File Structure

- Modify: `package.json` - add productization dependencies and scripts.
- Modify: `electron/main.ts` - delegate product services to smaller modules and wire update/log/diagnostic/menu behavior.
- Modify: `electron/preload.ts` - expose typed product APIs for diagnostics, version, update, and data backup.
- Modify: `electron/windowState.ts` - add monitor-safe bounds validation and DPI-safe defaults.
- Modify: `electron/windowIpc.ts` - add explicit close behavior, show/hide behavior, and window diagnostics APIs.
- Modify: `electron/settingsIpc.ts` - add app info, data directory, backup/restore, diagnostics, and update IPC handlers.
- Modify: `src/components/settings/GeneralSettingsSection.tsx` - add product settings controls.
- Modify: `src/types` or `src/vite-env.d.ts` - type new preload APIs.
- Create: `electron/productPaths.ts` - centralize `userData`, logs, backups, exports, and diagnostics paths.
- Create: `electron/appLogger.ts` - wrap `electron-log` and existing diagnostics consistently.
- Create: `electron/updateService.ts` - wrap `electron-updater` checks, events, and renderer notifications.
- Create: `electron/backupService.ts` - export/import user settings and key app data safely.
- Create: `electron/appMenu.ts` - build Windows app/tray menu actions consistently.
- Create: `shared/productInfo.ts` - share app version/channel/platform facts.
- Create: `scripts/verify-product-paths.ts` - validate path behavior without launching Electron UI.
- Create: `scripts/verify-window-bounds.ts` - validate saved bounds normalization.
- Create: `scripts/verify-product-ipc.ts` - validate preload/main IPC names remain aligned.
- Create: `.github/workflows/windows-release.yml` - build Windows artifacts for tagged releases.
- Create or modify: `docs/release-checklist.md` - manual release checklist.

---

## Milestone 1: Window And Windows Shell Behavior

### Task 1: Normalize Restored Window Bounds

**Files:**
- Modify: `electron/windowState.ts`
- Test: `scripts/verify-window-bounds.ts`
- Modify: `package.json`

- [ ] **Step 1: Add failing verification script**

Create `scripts/verify-window-bounds.ts` with cases for off-screen windows, settings-width reset, minimum size, and valid in-screen bounds.

Expected assertions:

```ts
import assert from 'node:assert/strict';
import {
  DEFAULT_WINDOW_HEIGHT,
  DEFAULT_WINDOW_WIDTH,
  MIN_WINDOW_WIDTH,
  normalizeRestoredWindowState,
} from '../electron/windowState';

const display = { workArea: { x: 0, y: 0, width: 1920, height: 1080 } };

assert.deepEqual(
  normalizeRestoredWindowState({ x: 200, y: 100, width: 260, height: 520 }, display),
  { x: 200, y: 100, width: 260, height: 520 },
);

assert.deepEqual(
  normalizeRestoredWindowState({ x: 2500, y: 100, width: 260, height: 520 }, display),
  { width: DEFAULT_WINDOW_WIDTH, height: DEFAULT_WINDOW_HEIGHT },
);

assert.equal(
  normalizeRestoredWindowState({ x: 20, y: 20, width: 100, height: 200 }, display)?.width,
  MIN_WINDOW_WIDTH,
);

assert.equal(
  normalizeRestoredWindowState({ x: 20, y: 20, width: 720, height: 520 }, display)?.width,
  DEFAULT_WINDOW_WIDTH,
);

console.log('verify-window-bounds ok');
```

- [ ] **Step 2: Run verification and confirm failure**

Run: `npx tsx scripts/verify-window-bounds.ts`

Expected: FAIL because `normalizeRestoredWindowState` currently accepts one argument.

- [ ] **Step 3: Implement bounds normalization**

Update `electron/windowState.ts` so `normalizeRestoredWindowState(saved, displayLike?)` clamps width/height and discards off-screen bounds. Keep the current one-argument call compatible.

- [ ] **Step 4: Wire display-aware normalization in main window creation**

In `electron/main.ts`, where restored window state is read, pass the matching or primary display into `normalizeRestoredWindowState`.

- [ ] **Step 5: Add npm script**

Add to `package.json` scripts:

```json
"verify:window-bounds": "tsx scripts/verify-window-bounds.ts"
```

- [ ] **Step 6: Verify**

Run: `npm run verify:window-bounds && npm run verify:window-mode && npm run typecheck`

Expected: all pass.

- [ ] **Step 7: Commit**

Commit message: `fix: normalize restored window bounds`

### Task 2: Make Close/Minimize Behavior Explicit

**Files:**
- Modify: `shared/appSettings.ts`
- Modify: `electron/windowIpc.ts`
- Modify: `electron/main.ts`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Test: `scripts/verify-settings-basic-sections.ts`, new assertions if practical

- [ ] **Step 1: Add settings fields**

Add app behavior fields:

```ts
closeBehavior: 'hide-to-tray' | 'quit';
minimizeBehavior: 'hide-to-tray' | 'minimize';
showTrayIcon: boolean;
```

Defaults:

```ts
closeBehavior: 'hide-to-tray',
minimizeBehavior: 'hide-to-tray',
showTrayIcon: true,
```

- [ ] **Step 2: Update IPC behavior**

In `electron/windowIpc.ts`, make `window:minimize` inspect `minimizeBehavior` and make `window:close` inspect `closeBehavior`.

- [ ] **Step 3: Update main close event**

In `electron/main.ts`, ensure direct window close respects `closeBehavior` unless `isQuitting` is true.

- [ ] **Step 4: Add settings UI controls**

In `src/components/settings/GeneralSettingsSection.tsx`, add two select controls or segmented controls for close and minimize behavior. Use existing settings section style.

- [ ] **Step 5: Verify**

Run: `npm run verify:settings-basic-sections && npm run verify:electron-window-ipc-module && npm run typecheck`

Expected: all pass.

- [ ] **Step 6: Commit**

Commit message: `feat: add explicit window close behavior settings`

### Task 3: Centralize Windows Tray And App Menu

**Files:**
- Create: `electron/appMenu.ts`
- Modify: `electron/main.ts`
- Test: `scripts/verify-electron-main-modules.ts`

- [ ] **Step 1: Extract menu builder**

Create `electron/appMenu.ts` exporting:

```ts
export type AppMenuActions = {
  showMainWindow(): void;
  hideMainWindow(): void;
  openSettings(): void;
  resetWindowPosition(): void;
  checkForUpdates(): void;
  openLogsFolder(): void;
  quitApp(): void;
};

export function buildTrayMenu(actions: AppMenuActions): Electron.Menu;
export function buildApplicationMenu(actions: AppMenuActions): Electron.Menu;
```

Tray menu items should include: Show DailyTodo, Settings, Check for Updates, Open Logs Folder, Reset Window Position, Quit.

- [ ] **Step 2: Replace inline tray menu code**

In `electron/main.ts`, import `buildTrayMenu` and `buildApplicationMenu`; keep existing tray icon creation.

- [ ] **Step 3: Verify menu module inclusion**

Extend `scripts/verify-electron-main-modules.ts` to assert `electron/main.ts` imports `./appMenu`.

- [ ] **Step 4: Verify**

Run: `npm run verify:electron-main-modules && npm run typecheck`

Expected: all pass.

- [ ] **Step 5: Commit**

Commit message: `refactor: centralize windows app menus`

---

## Milestone 2: Diagnostics, Logs, And Supportability

### Task 4: Add Product Paths Service

**Files:**
- Create: `electron/productPaths.ts`
- Test: `scripts/verify-product-paths.ts`
- Modify: `package.json`

- [ ] **Step 1: Add failing verification script**

Create `scripts/verify-product-paths.ts` to assert path names are stable and nested under a fake userData root.

Expected checks:

```ts
import assert from 'node:assert/strict';
import { resolveProductPaths } from '../electron/productPaths';

const paths = resolveProductPaths('C:/Users/example/AppData/Roaming/DailyTodo');
assert.equal(paths.userData.endsWith('/DailyTodo') || paths.userData.endsWith('\\DailyTodo'), true);
assert.equal(paths.logs.includes('logs'), true);
assert.equal(paths.backups.includes('backups'), true);
assert.equal(paths.diagnostics.includes('diagnostics'), true);
assert.equal(paths.exports.includes('exports'), true);
console.log('verify-product-paths ok');
```

- [ ] **Step 2: Implement service**

Create `electron/productPaths.ts` with:

```ts
import path from 'path';

export type ProductPaths = {
  userData: string;
  logs: string;
  backups: string;
  diagnostics: string;
  exports: string;
};

export function resolveProductPaths(userData: string): ProductPaths {
  return {
    userData,
    logs: path.join(userData, 'logs'),
    backups: path.join(userData, 'backups'),
    diagnostics: path.join(userData, 'diagnostics'),
    exports: path.join(userData, 'exports'),
  };
}
```

- [ ] **Step 3: Add npm script**

Add:

```json
"verify:product-paths": "tsx scripts/verify-product-paths.ts"
```

- [ ] **Step 4: Verify**

Run: `npm run verify:product-paths && npm run typecheck`

Expected: all pass.

- [ ] **Step 5: Commit**

Commit message: `feat: add product paths service`

### Task 5: Add electron-log Wrapper

**Files:**
- Modify: `package.json`
- Create: `electron/appLogger.ts`
- Modify: `electron/diagnostics.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: Install dependency**

Run: `npm install electron-log`

Expected: `package.json` and `package-lock.json` updated.

- [ ] **Step 2: Create logger wrapper**

Create `electron/appLogger.ts` exporting:

```ts
export type AppLogger = {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  getLogFilePath(): string;
};
```

Implementation should configure file logging under `resolveProductPaths(app.getPath('userData')).logs`.

- [ ] **Step 3: Bridge existing diagnostics**

Update `electron/diagnostics.ts` so existing `createDiagLogger` can write through `AppLogger` or continue writing its current local diagnostic file. Preserve crash diagnostics behavior.

- [ ] **Step 4: Log app lifecycle**

In `electron/main.ts`, replace or mirror key `diag(...)` calls into `appLogger.info(...)`: app start, ready, createWindow, second instance, before-quit, child-process-gone.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run verify:electron-foundation-modules`

Expected: all pass.

- [ ] **Step 6: Commit**

Commit message: `feat: add product logging service`

### Task 6: Add Diagnostics IPC And Settings Entry Points

**Files:**
- Modify: `electron/settingsIpc.ts`
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Test: `scripts/verify-product-ipc.ts`

- [ ] **Step 1: Add IPC handlers**

Add handlers:

```ts
app:getInfo -> { version, platform, arch, electron, chrome, node, userData }
app:openUserDataFolder -> { ok: true } | { ok: false, error }
app:openLogsFolder -> { ok: true } | { ok: false, error }
app:getDiagnosticsSummary -> { logFilePath, userData, platform, arch }
```

- [ ] **Step 2: Expose preload APIs**

Expose under `window.electronAPI.app`:

```ts
getInfo();
openUserDataFolder();
openLogsFolder();
getDiagnosticsSummary();
```

- [ ] **Step 3: Add frontend types**

Update the global `electronAPI` type so TypeScript recognizes `electronAPI.app`.

- [ ] **Step 4: Add settings UI buttons**

In General settings, add buttons: Open Data Folder, Open Logs Folder, Copy Diagnostics Summary. Use existing button styling.

- [ ] **Step 5: Add IPC verification script**

Create `scripts/verify-product-ipc.ts` that reads `electron/preload.ts` and `electron/settingsIpc.ts`, asserting all four channel names exist in both files.

- [ ] **Step 6: Verify**

Run: `npx tsx scripts/verify-product-ipc.ts && npm run typecheck`

Expected: all pass.

- [ ] **Step 7: Commit**

Commit message: `feat: expose diagnostics and app info`

---

## Milestone 3: Data Safety And Upgrade Compatibility

### Task 7: Add Settings Schema Version Migration

**Files:**
- Modify: `shared/appSettings.ts`
- Test: `scripts/verify-settings-sync.ts`
- Test: `scripts/verify-settings-basic-sections.ts`

- [ ] **Step 1: Add schema version**

Add:

```ts
settingsVersion: 1;
```

to normalized app settings.

- [ ] **Step 2: Make normalizer migrate old values**

Ensure `normalizeAppSettings(undefined)` returns version 1. Ensure objects without `settingsVersion` are treated as version 0 and upgraded without dropping known fields.

- [ ] **Step 3: Add regression assertions**

Extend existing settings verification so old settings retain known values while gaining new defaults.

- [ ] **Step 4: Verify**

Run: `npm run verify:settings-sync && npm run verify:settings-basic-sections && npm run typecheck`

Expected: all pass.

- [ ] **Step 5: Commit**

Commit message: `feat: version app settings schema`

### Task 8: Add Backup And Restore Service

**Files:**
- Create: `electron/backupService.ts`
- Modify: `electron/settingsIpc.ts`
- Modify: `electron/preload.ts`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Test: `scripts/verify-product-ipc.ts`

- [ ] **Step 1: Implement backup service**

Create service functions:

```ts
export type BackupResult = { ok: true; filePath: string } | { ok: false; error: string };
export function createSettingsBackup(userData: string, configPath: string): BackupResult;
export function restoreSettingsBackup(configPath: string, backupPath: string): BackupResult;
```

Backup should copy `config.json` to `backups/config-YYYY-MM-DD-HH-mm-ss.json`.

- [ ] **Step 2: Add IPC handlers**

Add:

```ts
app:createSettingsBackup
app:restoreSettingsBackup
```

Restore should use `dialog.showOpenDialog` filtered to `.json`, copy current config to a timestamped pre-restore backup, then replace config.

- [ ] **Step 3: Expose preload APIs**

Add `createSettingsBackup()` and `restoreSettingsBackup()` under `window.electronAPI.app`.

- [ ] **Step 4: Add settings UI**

Add Backup Settings and Restore Settings buttons. After restore, tell the user restart is required.

- [ ] **Step 5: Verify**

Run: `npm run verify:product-ipc && npm run typecheck`

Expected: all pass.

- [ ] **Step 6: Commit**

Commit message: `feat: add settings backup and restore`

---

## Milestone 4: Product Release And Auto Update

### Task 9: Prepare Release Metadata

**Files:**
- Modify: `package.json`
- Create: `shared/productInfo.ts`
- Modify: `electron/settingsIpc.ts`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`

- [ ] **Step 1: Add product metadata**

Create `shared/productInfo.ts`:

```ts
export const PRODUCT_NAME = 'DailyTodo';
export const RELEASE_CHANNEL = process.env.DAILTODO_RELEASE_CHANNEL || 'stable';
```

- [ ] **Step 2: Add build publish config**

In `package.json` `build`, add GitHub publish config when repository is ready:

```json
"publish": [{ "provider": "github", "releaseType": "release" }]
```

- [ ] **Step 3: Show version in settings**

Use `app:getInfo` from Task 6 to show app version, platform, arch, and channel.

- [ ] **Step 4: Verify**

Run: `npm run typecheck && npm run electron:build`

Expected: build succeeds and release artifacts are produced under `release/`.

- [ ] **Step 5: Commit**

Commit message: `feat: add release metadata`

### Task 10: Add Auto Update Service

**Files:**
- Modify: `package.json`
- Create: `electron/updateService.ts`
- Modify: `electron/main.ts`
- Modify: `electron/preload.ts`
- Modify: `src/components/settings/GeneralSettingsSection.tsx`
- Test: `scripts/verify-product-ipc.ts`

- [ ] **Step 1: Install dependency**

Run: `npm install electron-updater`

- [ ] **Step 2: Create update service**

Create `electron/updateService.ts` exporting:

```ts
export type UpdateStatus =
  | { state: 'idle' }
  | { state: 'checking' }
  | { state: 'available'; version: string }
  | { state: 'not-available' }
  | { state: 'downloading'; percent: number }
  | { state: 'downloaded'; version: string }
  | { state: 'error'; error: string };

export function registerUpdateService(options: {
  sendStatus(status: UpdateStatus): void;
  logger: { info(message: string): void; warn(message: string): void; error(message: string): void };
}): {
  checkForUpdates(): Promise<UpdateStatus>;
  quitAndInstall(): void;
};
```

- [ ] **Step 3: Wire IPC**

Add handlers:

```ts
update:check
update:quitAndInstall
```

Add event:

```ts
update:status
```

- [ ] **Step 4: Expose preload APIs**

Expose:

```ts
window.electronAPI.update.check();
window.electronAPI.update.quitAndInstall();
window.electronAPI.update.onStatus(callback);
```

- [ ] **Step 5: Add UI controls**

In General settings, add Check for Updates button and status text. Show Install and Restart only when update is downloaded.

- [ ] **Step 6: Verify unpackaged behavior**

Run: `npm run dev`

Expected: checking updates in dev returns a friendly unavailable/error status and logs the reason without crashing.

- [ ] **Step 7: Verify packaged build**

Run: `npm run electron:build`

Expected: installer and unpacked app build successfully.

- [ ] **Step 8: Commit**

Commit message: `feat: add windows auto update service`

---

## Milestone 5: CI, Installer, And Release Process

### Task 11: Add Windows Release Workflow

**Files:**
- Create: `.github/workflows/windows-release.yml`
- Create: `docs/release-checklist.md`

- [ ] **Step 1: Create workflow**

Workflow triggers:

```yaml
on:
  push:
    tags:
      - 'v*.*.*'
  workflow_dispatch:
```

Steps:

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
- run: npm ci
- run: npm run verify:cleanup-core
- run: npm run electron:build
- uses: actions/upload-artifact@v4
  with:
    name: DailyTodo-Windows
    path: release/*
```

- [ ] **Step 2: Add release checklist**

`docs/release-checklist.md` should include: update version, run core verifies, run build, smoke test installer, create tag, publish release, test update from previous version.

- [ ] **Step 3: Verify workflow syntax locally where possible**

Run: `npm run typecheck`

Expected: TypeScript passes. YAML syntax can be reviewed manually unless a YAML checker is available.

- [ ] **Step 4: Commit**

Commit message: `ci: add windows release workflow`

### Task 12: Harden Installer Configuration

**Files:**
- Modify: `package.json`
- Modify: `build/` assets only if needed
- Modify: `docs/release-checklist.md`

- [ ] **Step 1: Review electron-builder effective config**

Run: `npm run electron:build`

Inspect: `release/builder-effective-config.yaml`

- [ ] **Step 2: Ensure NSIS options are intentional**

Confirm or set:

```json
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "DailyTodo"
}
```

- [ ] **Step 3: Document signing path**

In `docs/release-checklist.md`, add a section for future Windows code signing: certificate provider, CI secrets, timestamp server, and SmartScreen expectations.

- [ ] **Step 4: Verify**

Run: `npm run electron:build`

Expected: installer still builds.

- [ ] **Step 5: Commit**

Commit message: `build: harden windows installer settings`

---

## Milestone 6: Final Product QA

### Task 13: Add Product Smoke Test Checklist

**Files:**
- Create: `docs/windows-product-qa.md`

- [ ] **Step 1: Document manual smoke tests**

Include these checks:

- Launch installed app from Start Menu.
- Launch installed app from desktop shortcut.
- Confirm single-instance behavior.
- Confirm close-to-tray and quit behavior.
- Confirm minimize behavior.
- Confirm window reset.
- Confirm app survives monitor unplug or resolution change.
- Confirm 100%, 125%, 150%, and 200% scaling do not break layout.
- Confirm Open Logs Folder works.
- Confirm backup creates a file.
- Confirm restore warns about restart.
- Confirm auto update check fails gracefully when no release feed is available.
- Confirm NSIS uninstall leaves user data unless explicitly changed later.

- [ ] **Step 2: Verify docs exist**

Run: `Get-Content docs/windows-product-qa.md`

Expected: checklist is readable.

- [ ] **Step 3: Commit**

Commit message: `docs: add windows product qa checklist`

### Task 14: Run Final Verification Set

**Files:**
- No code changes expected unless failures are found.

- [ ] **Step 1: Run focused verification**

Run:

```powershell
npm run verify:window-bounds
npm run verify:product-paths
npm run verify:product-ipc
npm run verify:settings-basic-sections
npm run verify:electron-main-modules
npm run verify:electron-foundation-modules
npm run typecheck
```

Expected: all pass.

- [ ] **Step 2: Run full product build**

Run:

```powershell
npm run electron:build
```

Expected: installer and unpacked build are created under `release/`.

- [ ] **Step 3: Manual installed-app smoke test**

Install the generated NSIS artifact and walk through `docs/windows-product-qa.md`.

- [ ] **Step 4: Fix failures as separate commits**

If a failure is found, create a targeted fix commit named `fix: address windows product qa issue` with the specific issue in the body.

---

## Recommended Execution Order

1. Milestone 1: Window And Windows Shell Behavior
2. Milestone 2: Diagnostics, Logs, And Supportability
3. Milestone 3: Data Safety And Upgrade Compatibility
4. Milestone 4: Product Release And Auto Update
5. Milestone 5: CI, Installer, And Release Process
6. Milestone 6: Final Product QA

## Risk Notes

- `electron/main.ts` is large and already carries complex Win32 behavior. Prefer extracting services around it rather than broad rewrites.
- Auto update requires correct GitHub release metadata and packaged-app testing. Dev mode should never crash if update metadata is missing.
- Code signing is intentionally documented but not required in the first implementation pass because it depends on external certificate procurement.
- Existing encoding issues in README/comments should not be mixed into this productization work unless they block touched files.

## Self-Review

- Spec coverage: The plan covers Windows adaptation through window behavior, tray/menu, diagnostics/logs, data safety, updates, installer, CI, and QA.
- Placeholder scan: No `TBD` or unresolved implementation placeholders are used; deferred code signing is explicitly scoped as external.
- Type consistency: New APIs are grouped under `electronAPI.app` and `electronAPI.update`; IPC channel names are repeated in verification tasks to avoid drift.
