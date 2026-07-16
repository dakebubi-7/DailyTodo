# Edge Auto-Hide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to implement task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Add QQ-style edge auto-hide for left, right, and top display edges after 800 ms outside the window, leaving an 8 px restore strip.

**Architecture:** Create a dependency-free geometry module plus a main-process controller. The controller polls a native Win32 pointer provider, owns timers, and only calls `BrowserWindow.setBounds`; it never changes z-order.

**Tech Stack:** Electron, TypeScript, `koffi` Win32 `GetCursorPos`, Vitest fake timers.

---

## File Structure

- Create `electron/edgeAutoHideGeometry.ts` for rectangle, edge, and pointer decisions.
- Create `electron/edgeAutoHideController.ts` for polling, timers, and controller state.
- Create `tests/edgeAutoHideGeometry.test.ts` and `tests/edgeAutoHideController.test.ts`.
- Modify `electron/win32Native.ts`, settings model/UI files, and bootstrap/event/IPC composition files.

### Task 1: Geometry

**Files:** Create `electron/edgeAutoHideGeometry.ts`; create `tests/edgeAutoHideGeometry.test.ts`.

- [ ] **Step 1: Write failing tests.** Define a work area `{ x: -1920, y: 0, width: 1920, height: 1040 }` and assert `getEdgeAttachment` returns `left`, `right`, `top`, and `null` for a bottom-aligned window. Assert `getRetractedBounds('left', { x: -1920, y: 120, width: 240, height: 480 }, workArea).x === -2152`, and assert `isPointInActivationStrip({ x: -1916, y: 180 }, 'left', retracted, workArea) === true`.
- [ ] **Step 2: Verify red.** Run `npx vitest run tests/edgeAutoHideGeometry.test.ts`; expect a module-not-found failure.
- [ ] **Step 3: Implement minimal code.** Export `Rect`, `Point`, `EdgeAutoHideEdge = 'left' | 'right' | 'top'`, `EDGE_AUTO_HIDE_SNAP_PX = 12`, `EDGE_AUTO_HIDE_REVEAL_PX = 8`, `getEdgeAttachment`, `getExpandedBounds`, `getRetractedBounds`, `isPointInRect`, and `isPointInActivationStrip`. Bottom must never attach. Retraction uses the matched display work area and preserves the non-hidden axis.
- [ ] **Step 4: Add tests for right/top retraction, re-entry outside the strip, and negative display origins.** Run `npx vitest run tests/edgeAutoHideGeometry.test.ts`; expect PASS.
- [ ] **Step 5: Commit.** Run `git add electron/edgeAutoHideGeometry.ts tests/edgeAutoHideGeometry.test.ts` then `git commit -m "feat: add edge auto-hide geometry"`.

### Task 2: Native Cursor Provider

**Files:** Modify `electron/win32Native.ts`; modify `tests/win32Native.test.ts`.

- [ ] **Step 1: Write a failing fallback test.** Export `getWin32CursorPosition(diag, read)` and assert that `read` throwing `new Error('user32 unavailable')` returns `null` and calls `diag` with `Win32 getCursorPosition failed: Error: user32 unavailable`.
- [ ] **Step 2: Verify red.** Run `npx vitest run tests/win32Native.test.ts`; expect missing export failure.
- [ ] **Step 3: Implement minimal code.** Extend `Win32Api` and `Win32NativeHelpers` with `getCursorPosition(): { x: number; y: number } | null`. In `createWin32Api`, bind `POINT` and `bool __stdcall GetCursorPos(POINT* lpPoint)` through `koffi`; use `runWin32Operation`, return `null` for false/native failure, and return finite integer coordinates otherwise. Non-Windows or unavailable native bridges return `null`.
- [ ] **Step 4: Verify green and commit.** Run `npx vitest run tests/win32Native.test.ts`; expect PASS. Then run `git add electron/win32Native.ts tests/win32Native.test.ts` and `git commit -m "feat: expose native cursor position"`.

### Task 3: Controller

**Files:** Create `electron/edgeAutoHideController.ts`; create `tests/edgeAutoHideController.test.ts`.

- [ ] **Step 1: Write a failing fake-timer test.** Mock a live window whose bounds are `{ x: 0, y: 120, width: 240, height: 480 }`, matching work area is `{ x: 0, y: 0, width: 1920, height: 1040 }`, cursor is `{ x: 500, y: 700 }`, setting is enabled, and `setBounds` is a spy. Call `noteMoveSettled()`, advance 799 ms and expect no call, then advance 1 ms and expect `{ x: -232, y: 120, width: 240, height: 480 }`.
- [ ] **Step 2: Verify red.** Run `npx vitest run tests/edgeAutoHideController.test.ts`; expect missing controller failure.
- [ ] **Step 3: Implement minimal controller.** Export `createEdgeAutoHideController` with methods `noteMoveStarted`, `noteMoveSettled`, `noteResizeOrReset`, `noteSettingsMode(open)`, `noteWindowModeChanged`, `reconcileSettings`, and `dispose`. Poll every 64 ms and use an 800 ms leave timer. Attach only after a settled user move. Restore immediately on pointer entry into the activation strip. Clear timers and reveal cached expanded bounds for drag, resize/reset, settings open, window-mode change, disable, hidden/minimized/destroyed window, and null cursor data. Never call `show`, `hide`, `focus`, `setAlwaysOnTop`, `setSkipTaskbar`, or desktop-owner APIs.
- [ ] **Step 4: Add cases for timer cancellation on re-entry, bottom/non-edge no-op, disabling while hidden restoration, disposal cleanup, null pointer no-op, and negative-coordinate matching display.**
- [ ] **Step 5: Verify green and commit.** Run `npx vitest run tests/edgeAutoHideGeometry.test.ts tests/edgeAutoHideController.test.ts`; expect PASS. Then run `git add electron/edgeAutoHideController.ts tests/edgeAutoHideController.test.ts` and `git commit -m "feat: control edge auto-hide window state"`.

### Task 4: Setting And Toggle

**Files:** Modify `shared/appSettings.ts`, `src/hooks/taskHookState.ts`, `src/components/settings/GeneralSettingsSection.tsx`, `src/i18n/shellTextZhSettings.ts`, and `src/i18n/shellTextEnSettings.ts`; create `tests/appSettings.test.ts` if absent.

- [ ] **Step 1: Write failing normalization tests.** Assert `createDefaultAppSettings().edgeAutoHide === true`, `normalizeAppSettings({ edgeAutoHide: false }).edgeAutoHide === false`, and `normalizeAppSettings({ edgeAutoHide: 'false' }).edgeAutoHide === true`.
- [ ] **Step 2: Verify red.** Run `npx vitest run tests/appSettings.test.ts`; expect missing property failure.
- [ ] **Step 3: Implement minimal setting UI.** Add `edgeAutoHide: boolean` to `AppBehaviorSettings`, default it to `true`, normalize only booleans, and include it in `areAppBehaviorSettingsEqual`. Add localized `edgeAutoHide` and `edgeAutoHideHint` settings text. Add a `ToggleRow` after close-to-tray that calls `updateApp('edgeAutoHide', value)`.
- [ ] **Step 4: Verify green and commit.** Run `npx vitest run tests/appSettings.test.ts && npm run typecheck`; expect PASS. Then stage precisely these files and run `git commit -m "feat: add edge auto-hide setting"`.

### Task 5: Bootstrap, Events, And IPC

**Files:** Modify `electron/mainWindowBootstrap.ts`, `electron/mainWindowBootstrapTypes.ts`, `electron/mainWindowComposition.ts`, `electron/mainWindowCompositionTypes.ts`, `electron/mainWindowEvents.ts`, `electron/settingsIpc.ts`, `electron/mainWindowIpcRegistration.ts`, `electron/mainWindowIpcRegistrationTypes.ts`, and `electron/windowIpc.ts`.

- [ ] **Step 1: Write failing integration tests with a controller double.** Assert `will-move` calls `noteMoveStarted`, `move` calls `noteMoveSettled`, resize/reset call `noteResizeOrReset`, hide/minimize/closed call `dispose`, and app-setting writes call `reconcileSettings`.
- [ ] **Step 2: Verify red.** Run `npx vitest run tests/edgeAutoHideController.test.ts`; expect wiring failure.
- [ ] **Step 3: Compose once at bootstrap.** Call `createEdgeAutoHideController` with `screen.getDisplayMatching`, `options.getCursorPosition`, `() => options.getAppSettings().edgeAutoHide`, and `diag`. Thread narrow controller methods through existing bootstrap/composition types. Supply `win32Helpers.getCursorPosition` from the main composition entry point. Do not expose this service to preload or renderer IPC.
- [ ] **Step 4: Connect lifecycle boundaries.** In `mainWindowEvents`, notify the controller alongside existing frost/persistence handlers. In `windowIpc`, cancel/reveal before reset or settings size changes, call `noteSettingsMode`, and call `noteWindowModeChanged` after a mode change. In `settingsIpc`, call `reconcileSettings()` immediately after `setAppSettings` so disabling restores a hidden window.
- [ ] **Step 5: Verify green and commit.** Run `npm run typecheck` and `npx vitest run tests/win32Native.test.ts tests/windowState.test.ts tests/edgeAutoHideGeometry.test.ts tests/edgeAutoHideController.test.ts tests/appSettings.test.ts`; expect PASS. Stage only files in this task, then run `git commit -m "feat: wire edge auto-hide into main window"`.

### Task 6: Build And Verify On Windows

**Files:** Modify only if a focused verification failure is first captured by a regression test.

- [ ] **Step 1: Build.** Run `npm run build:win32-hit-test && npm run build`; expect exit code 0 and the rebuilt native DLL.
- [ ] **Step 2: Run all tests.** Run `npx vitest run`; expect PASS.
- [ ] **Step 3: Manually validate.** Run `npm run dev`; verify left/right/top retract after roughly 800 ms and restore from the 8 px strip; verify bottom/non-edge do not retract; disabling while hidden restores immediately; verify settings, reset, tray hiding, and normal/on-top/desktop mode transitions never strand the window or alter z-order; test a negative-coordinate secondary display where available.
- [ ] **Step 4: Fix only a reproducible failure.** Add a failing regression test, make the smallest fix, rerun its test plus typecheck, and commit as `fix: stabilize edge auto-hide verification`.

## Final Verification

- [ ] `npm run typecheck`
- [ ] `npx vitest run`
- [ ] `npm run build:win32-hit-test && npm run build`
- [ ] Manual Windows verification passes.
- [ ] Review `git status --short` without reverting unrelated pre-existing worktree changes.
