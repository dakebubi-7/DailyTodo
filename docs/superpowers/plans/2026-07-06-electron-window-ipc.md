# Electron Window IPC Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract low-risk `window:*` IPC handler registration out of `electron/main.ts` into a focused Electron main-process module without changing runtime behavior.

**Architecture:** `electron/windowIpc.ts` will export one registration function that receives all mutable dependencies from `electron/main.ts` via callbacks. `electron/main.ts` will keep owning window-mode application, tray refresh, app settings, store creation, and window-state persistence; it will delegate only IPC handler wiring.

**Tech Stack:** Electron main process, TypeScript, Node structural verification scripts (`tsx`).

---

### Task 1: Red structural verifier

**Files:**
- Create: `scripts/verify-electron-window-ipc-module.ts`
- Modify: `package.json`

- [x] Write verifier expecting `electron/windowIpc.ts`, `registerWindowIpcHandlers`, all existing window IPC channels, and no inline `ipcMain.handle('window:*')` calls in `electron/main.ts`.
- [x] Run `npm run verify:electron-window-ipc-module` and confirm it fails before extraction.

### Task 2: Extract handler module

**Files:**
- Create: `electron/windowIpc.ts`
- Modify: `electron/main.ts`

- [x] Move only the `window:*` IPC handler registration block to `registerWindowIpcHandlers(options)`.
- [x] Pass dependencies explicitly: `win`, `store`, settings-mode state accessors, `hideMainWindow`, `getWindowMode`, `setWindowMode`, `persistWindowState`, app settings helpers, and `reapplyWindowZOrder`.
- [x] Keep all channel names and returned payloads unchanged.

### Task 3: Verify and document

**Files:**
- Modify: `task_plan.md`
- Modify: `progress.md`
- Modify: `../docs/DailyTodo-Codebase-Map.md`
- Modify: `../docs/DailyTodo-Developer-Code-Guide.md`

- [x] Run `npm run verify:electron-window-ipc-module`.
- [x] Run `npm run verify:cleanup-core`.
- [x] Run `npm run build`.
- [x] Update planning/docs with the new module boundary and verification command.
