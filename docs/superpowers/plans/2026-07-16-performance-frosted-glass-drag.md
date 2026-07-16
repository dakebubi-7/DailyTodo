# Performance Frosted Glass Drag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Suspend real-time Windows Acrylic only while an Invisible-theme window is moving, retaining a single renderer frosted surface and restoring Acrylic 150 ms after movement stops.

**Architecture:** A new main-process controller stores the latest normalized Invisible-glass settings and owns the movement debounce timer. Existing window events call the controller; existing glass IPC updates its configured state. A narrow renderer event toggles a data attribute on the app shell, and scoped CSS increases the existing shell opacity during movement without creating another blur or overlay layer.

**Tech Stack:** Electron BrowserWindow and IPC, Win32 Acrylic fallback via koffi, React, TypeScript, Vitest.

---

### Task 1: Model Native Movement-Frost State

**Files:**
- Create: `electron/performanceFrostController.ts`
- Test: `tests/performanceFrostController.test.ts`

- [ ] **Step 1: Write failing controller tests**

```ts
it('disables native acrylic while moving and restores the latest settings after 150 ms', () => {
  vi.useFakeTimers();
  const setGlass = vi.fn();
  const emit = vi.fn();
  const controller = createPerformanceFrostController({ setGlass, emit });

  controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
  controller.beginMove();
  controller.noteMove();
  expect(setGlass).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }));
  expect(emit).toHaveBeenLastCalledWith(true);

  vi.advanceTimersByTime(150);
  expect(setGlass).toHaveBeenLastCalledWith({ enabled: true, opacity: 58, blurStrength: 14 });
  expect(emit).toHaveBeenLastCalledWith(false);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/performanceFrostController.test.ts`

Expected: FAIL because `electron/performanceFrostController` does not exist.

- [ ] **Step 3: Implement the minimal controller**

```ts
export const PERFORMANCE_FROST_RESTORE_DELAY_MS = 150;

export function createPerformanceFrostController({ setGlass, emit }: PerformanceFrostControllerOptions) {
  let configured = createDisabledInvisibleGlassSettings();
  let active = false;
  let restoreTimer: ReturnType<typeof setTimeout> | null = null;

  const clearRestore = () => {
    if (restoreTimer) clearTimeout(restoreTimer);
    restoreTimer = null;
  };

  const restore = () => {
    clearRestore();
    if (!active) return;
    active = false;
    setGlass(configured);
    emit(false);
  };

  return {
    setConfiguredGlass(next: InvisibleGlassSettings) { /* normalize, clear disabled state, otherwise apply if idle */ },
    beginMove() { /* disable native blur once only when blur is active */ },
    noteMove() { /* reset the 150 ms restore timer */ },
    dispose() { /* clear timer and leave no stale temporary state */ },
  };
}
```

- [ ] **Step 4: Run the focused controller tests**

Run: `npx vitest run tests/performanceFrostController.test.ts`

Expected: PASS.

### Task 2: Wire Window Events and Existing Glass IPC

**Files:**
- Modify: `electron/mainWindowEvents.ts`
- Modify: `electron/mainWindowBootstrapTypes.ts`
- Modify: `electron/mainWindowBootstrap.ts`
- Modify: `electron/windowIpc.ts`
- Modify: `electron/mainWindowIpcRegistration.ts`
- Test: `tests/mainWindowEvents.test.ts`

- [ ] **Step 1: Write failing event wiring tests**

```ts
it('begins performance frost before movement and debounces restoration on move', () => {
  const beginMove = vi.fn();
  const noteMove = vi.fn();
  registerMainWindowEventHandlers({ ...options, performanceFrost: { beginMove, noteMove } });

  emitWindowEvent('will-move');
  emitWindowEvent('move');

  expect(beginMove).toHaveBeenCalledOnce();
  expect(noteMove).toHaveBeenCalledOnce();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/mainWindowEvents.test.ts`

Expected: FAIL because event handler options do not expose `performanceFrost`.

- [ ] **Step 3: Connect the controller**

```ts
win.on('will-move', () => performanceFrost.beginMove());
win.on('move', () => {
  performanceFrost.noteMove();
  persistWindowState(win, { persistSize: !settingsMode.isOpen() });
});

ipcMain.handle('window:setInvisibleGlass', (_event, payload) => {
  performanceFrost.setConfiguredGlass(normalizeInvisibleGlassPayload(payload));
  return true;
});
```

Create one controller during main-window bootstrap. Its `setGlass` callback calls the existing native material helper, and its renderer callback sends `window:performanceFrostChanged` to the live `webContents`.

- [ ] **Step 4: Run focused main-process tests**

Run: `npx vitest run tests/performanceFrostController.test.ts tests/mainWindowEvents.test.ts tests/win32Native.test.ts`

Expected: PASS.

### Task 3: Render a Single Temporary Frost Surface

**Files:**
- Modify: `electron/preload.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/app/appShellEffects.ts`
- Modify: `src/app/useAppRuntimeEffects.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles/globals.css`
- Test: `tests/appShellEffects.test.ts`

- [ ] **Step 1: Write failing renderer-state tests**

```ts
it('sets performance frost only while the main process reports a move', () => {
  const shell = document.createElement('div');
  syncPerformanceFrostShell(shell, true);
  expect(shell.dataset.performanceFrost).toBe('true');
  syncPerformanceFrostShell(shell, false);
  expect(shell.dataset.performanceFrost).toBeUndefined();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/appShellEffects.test.ts`

Expected: FAIL because `syncPerformanceFrostShell` does not exist.

- [ ] **Step 3: Implement the renderer bridge and CSS**

```ts
// preload
onPerformanceFrostChanged: (callback) => {
  const listener = (_event, active) => callback(active === true);
  ipcRenderer.on('window:performanceFrostChanged', listener);
  return () => ipcRenderer.removeListener('window:performanceFrostChanged', listener);
}

// CSS
.app-shell[data-theme='invisible'][data-performance-frost='true'] {
  background-color: rgba(250, 250, 252, max(0.82, var(--invisible-surface-alpha))) !important;
}
```

Keep the renderer state in `useAppRuntimeEffects`, pass it into `App`, and attach `data-performance-frost="true"` only to the existing app shell. Include the dark equivalent with its existing dark surface color.

- [ ] **Step 4: Run focused renderer tests**

Run: `npx vitest run tests/appShellEffects.test.ts`

Expected: PASS.

### Task 4: Full Verification and Physical Check

**Files:**
- Modify only files from Tasks 1-3 as required by verification fixes.

- [ ] **Step 1: Run type and focused tests**

Run: `npm run typecheck && npx vitest run tests/performanceFrostController.test.ts tests/mainWindowEvents.test.ts tests/appShellEffects.test.ts tests/win32Native.test.ts`

Expected: PASS.

- [ ] **Step 2: Build the packaged application**

Run: `npm run dist`

Expected: build succeeds and refreshes `release/win-unpacked/DailyTodo.exe`.

- [ ] **Step 3: Start the packaged app and assess physical dragging**

Run: `Start-Process -FilePath 'G:\Personal-AI\DailyTodo\app\release\win-unpacked\DailyTodo.exe' -WindowStyle Hidden`

Expected: During title-bar dragging, the app remains a unified frosted surface and becomes visibly more responsive; within about 150 ms after stopping, background Acrylic is restored. Confirm physically with the user because automated drag injection cannot reliably target this transparent Electron window.
