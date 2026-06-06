# DailyTodo 桌面模式 WorkerW 壁纸层嵌入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make DailyTodo's `desktop` mode truly embed into the Windows wallpaper layer (WorkerW) so Win+D can't hide it and it never covers other apps — view-only by default, double-click to float for editing, auto-re-embed on blur.

**Architecture:** Keep the public `WindowMode = 'normal' | 'onTop' | 'desktop'` enum and `shared/windowMode.ts` unchanged. Add an internal `desktop` substate machine (`embedded` / `floating`) as a pure module with its own verify test. Add koffi bindings for `SendMessageTimeoutW` / `EnumWindows` / `FindWindowExW` / `SetParent`, locate the wallpaper-bearing WorkerW, and call `SetParent` exactly once per substate transition. Every native call is wrapped in `try/catch`; any failure logs to diag and falls back to the existing smart-topmost polling (`startDesktopGuard`) so the main process never crashes.

**Tech Stack:** Electron 34 (main process TypeScript), koffi 3 (FFI → user32.dll), React 18 renderer, tsx for verify scripts, electron-vite build.

---

## File Structure

| File | Responsibility | Create / Modify |
|---|---|---|
| `app/shared/desktopSubmode.ts` | Pure substate machine: `DesktopSubmode`, `DesktopSubmodeEvent`, `nextDesktopSubmode`, `DEFAULT_DESKTOP_SUBMODE` | Create |
| `app/electron/desktopSubmode.verify.ts` | Assertion test for the pure substate machine (mirrors `windowMode.verify.ts`) | Create |
| `app/package.json` | Add `verify:desktop-submode` script | Modify |
| `app/electron/main.ts` | koffi bindings, `Win32Api` type, WorkerW locate, embed/detach, substate integration into `applyWindowMode`, `window:desktopFloat` IPC, blur auto-re-embed, exit-desktop detach, fallback | Modify |
| `app/electron/preload.ts` | Expose `desktopFloat` IPC | Modify |
| `app/src/vite-env.d.ts` | Add `desktopFloat` to `electronAPI` type | Modify |
| `app/src/App.tsx` | Double-click-to-float listener at app-shell root | Modify |

---

## Task 1: Desktop substate machine (pure module)

**Files:**
- Create: `app/shared/desktopSubmode.ts`
- Test: `app/electron/desktopSubmode.verify.ts`
- Modify: `app/package.json:14-25` (verify scripts block)

- [ ] **Step 1: Write the failing test**

Create `app/electron/desktopSubmode.verify.ts` (mirrors the style of `app/electron/windowMode.verify.ts`):

```typescript
import {
  DEFAULT_DESKTOP_SUBMODE,
  isDesktopSubmode,
  nextDesktopSubmode,
} from '../shared/desktopSubmode';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// default
assert(DEFAULT_DESKTOP_SUBMODE === 'embedded', 'entering desktop defaults to embedded');

// type guard
assert(isDesktopSubmode('embedded') && isDesktopSubmode('floating'), 'valid submodes accepted');
assert(!isDesktopSubmode('normal') && !isDesktopSubmode(undefined) && !isDesktopSubmode(true), 'invalid submodes rejected');

// enterDesktop → always embedded
assert(nextDesktopSubmode('embedded', 'enterDesktop') === 'embedded', 'enterDesktop from embedded → embedded');
assert(nextDesktopSubmode('floating', 'enterDesktop') === 'embedded', 'enterDesktop from floating → embedded');

// doubleClick: only embedded → floating
assert(nextDesktopSubmode('embedded', 'doubleClick') === 'floating', 'doubleClick embedded → floating');
assert(nextDesktopSubmode('floating', 'doubleClick') === 'floating', 'doubleClick floating → floating (no-op)');

// blur: only floating → embedded
assert(nextDesktopSubmode('floating', 'blur') === 'embedded', 'blur floating → embedded');
assert(nextDesktopSubmode('embedded', 'blur') === 'embedded', 'blur embedded → embedded (no-op)');

console.log('desktopSubmode.verify: all assertions passed');
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd app && npx tsx electron/desktopSubmode.verify.ts`
Expected: FAIL — `Cannot find module '../shared/desktopSubmode'` (module not created yet).

- [ ] **Step 3: Write minimal implementation**

Create `app/shared/desktopSubmode.ts`:

```typescript
/**
 * desktop 模式的内部子状态（实现细节，不污染对外的 WindowMode 枚举）。
 * - embedded：已 SetParent 到 WorkerW，固定在壁纸层，只看不点。进入 desktop 的默认态。
 * - floating：SetParent(NULL) 脱离桌面，普通顶层可交互窗口，用于勾选/加任务/拖拽。
 */
export type DesktopSubmode = 'embedded' | 'floating';

/**
 * 触发子状态切换的事件：
 * - enterDesktop：进入 desktop 模式 → 总是 embedded。
 * - doubleClick：双击挂件空白区 → embedded 时浮起为 floating。
 * - blur：窗口失焦 → floating 时自动嵌回 embedded。
 */
export type DesktopSubmodeEvent = 'enterDesktop' | 'doubleClick' | 'blur';

export const DEFAULT_DESKTOP_SUBMODE: DesktopSubmode = 'embedded';

export function isDesktopSubmode(value: unknown): value is DesktopSubmode {
  return value === 'embedded' || value === 'floating';
}

/** 当前子态 + 事件 → 目标子态。纯函数，无副作用，可单测。 */
export function nextDesktopSubmode(current: DesktopSubmode, event: DesktopSubmodeEvent): DesktopSubmode {
  switch (event) {
    case 'enterDesktop':
      return 'embedded';
    case 'doubleClick':
      return current === 'embedded' ? 'floating' : current;
    case 'blur':
      return current === 'floating' ? 'embedded' : current;
    default:
      return current;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd app && npx tsx electron/desktopSubmode.verify.ts`
Expected: PASS — prints `desktopSubmode.verify: all assertions passed`.

- [ ] **Step 5: Register the verify script**

In `app/package.json`, add this line directly after line 15 (`"verify:window-mode": ...`):

```json
    "verify:desktop-submode": "tsx electron/desktopSubmode.verify.ts",
```

- [ ] **Step 6: Confirm the existing pure-function test still passes (regression guard)**

Run: `cd app && npm run verify:window-mode`
Expected: PASS — prints `windowMode.verify: all assertions passed` (proves `shared/windowMode.ts` is untouched).

- [ ] **Step 7: Commit**

```bash
git add app/shared/desktopSubmode.ts app/electron/desktopSubmode.verify.ts app/package.json
git commit -m "feat(desktop): add pure desktop submode state machine"
```

---

## Task 2: koffi native bindings for SetParent + WorkerW location

**Files:**
- Modify: `app/electron/main.ts:211-218` (`Win32Api` type), `app/electron/main.ts:226-273` (koffi binding block)

This task only adds the raw native function bindings to the `win32` object plus matching constants. No behavior changes yet — `applyWindowMode` still uses polling. Native FFI cannot be unit-tested without a real Windows desktop; verification is `npm run typecheck` plus a diag line confirming the bindings loaded.

- [ ] **Step 1: Extend the `Win32Api` type**

In `app/electron/main.ts`, replace the `Win32Api` type (currently lines 211-218):

```typescript
type Win32Api = {
  ptr: (handle: Buffer) => unknown;
  getExStyle: (hwnd: unknown) => number;
  setExStyle: (hwnd: unknown, style: number) => void;
  getForegroundClass: () => string;
  setTopmost: (handle: Buffer) => void;
  sendToBottom: (handle: Buffer) => void;
};
```

with:

```typescript
type Win32Api = {
  ptr: (handle: Buffer) => unknown;
  getExStyle: (hwnd: unknown) => number;
  setExStyle: (hwnd: unknown, style: number) => void;
  getForegroundClass: () => string;
  setTopmost: (handle: Buffer) => void;
  sendToBottom: (handle: Buffer) => void;
  /** 发 0x052C 给 Progman 强制创建承载壁纸的 WorkerW；带超时，找不到返回 false。 */
  ensureWorkerW: () => boolean;
  /** 定位真正承载壁纸的 WorkerW 句柄（含 SHELLDLL_DefView 的窗口的兄弟）；找不到返回 null。 */
  findWallpaperWorkerW: () => unknown | null;
  /** SetParent(ourHwnd, parent)。parent 传 null 表示脱离回顶层窗口。 */
  setParent: (handle: Buffer, parent: unknown | null) => void;
  /** SetWindowPos 显式摆位（屏幕/相对父窗口坐标），用于嵌入/浮起后对齐位置。 */
  moveWindow: (handle: Buffer, x: number, y: number, w: number, h: number) => void;
};
```

- [ ] **Step 2: Add native function declarations inside the koffi block**

In `app/electron/main.ts`, inside the `if (process.platform === 'win32')` block, directly after the `SetWindowPos` declaration (currently line 241), add:

```typescript
    const SendMessageTimeoutW = user32.func(
      'intptr_t __stdcall SendMessageTimeoutW(void* hWnd, uint32_t Msg, uintptr_t wParam, uintptr_t lParam, uint32_t fuFlags, uint32_t uTimeout, void* lpdwResult)'
    );
    const FindWindowW = user32.func('void* __stdcall FindWindowW(const char16_t* lpClassName, const char16_t* lpWindowName)');
    const FindWindowExW = user32.func(
      'void* __stdcall FindWindowExW(void* hWndParent, void* hWndChildAfter, const char16_t* lpszClass, const char16_t* lpszWindow)'
    );
    const SetParentFn = user32.func('void* __stdcall SetParent(void* hWndChild, void* hWndNewParent)');
    const EnumWindows = user32.func('bool __stdcall EnumWindows(void* lpEnumFunc, intptr_t lParam)');
    const EnumWindowsProc = koffi.proto('bool __stdcall EnumWindowsProc(void* hWnd, intptr_t lParam)');
```

- [ ] **Step 3: Add the constant for the wallpaper-spawn message**

In `app/electron/main.ts`, directly after the existing `SWP_NOACTIVATE` constant (line 224), add:

```typescript
const SPAWN_WORKERW_MSG = 0x052c;
const SMTO_NORMAL = 0x0000;
const WORKERW_TIMEOUT_MS = 1000;
```

- [ ] **Step 4: Add the new methods to the `win32` object literal**

In `app/electron/main.ts`, inside the `win32 = { ... }` object literal, add these methods directly after the existing `sendToBottom` method (line 266), before the closing `};`:

```typescript
      ensureWorkerW: () => {
        // 给 Progman 发 0x052C，强制系统创建承载壁纸的 WorkerW。带超时，绝不阻塞主进程。
        const progman = FindWindowW('Progman', null);
        if (!progman) return false;
        SendMessageTimeoutW(progman, SPAWN_WORKERW_MSG, 0, 0, SMTO_NORMAL, WORKERW_TIMEOUT_MS, null);
        return true;
      },
      findWallpaperWorkerW: () => {
        // 枚举顶层窗口：含 SHELLDLL_DefView 子窗口的那个窗口，它的兄弟 WorkerW 才承载壁纸。
        let wallpaperWorkerW: unknown | null = null;
        const cb = koffi.register((hWnd: unknown) => {
          const defView = FindWindowExW(hWnd, null, 'SHELLDLL_DefView', null);
          if (defView) {
            const sibling = FindWindowExW(null, hWnd, 'WorkerW', null);
            if (sibling) wallpaperWorkerW = sibling;
          }
          return true;
        }, koffi.pointer(EnumWindowsProc));
        try {
          EnumWindows(cb, 0);
        } finally {
          koffi.unregister(cb);
        }
        return wallpaperWorkerW;
      },
      setParent: (handle: Buffer, parent: unknown | null) => {
        const hwnd = koffi.as(handle, 'void*');
        SetParentFn(hwnd, parent ?? null);
      },
      moveWindow: (handle: Buffer, x: number, y: number, w: number, h: number) => {
        const hwnd = koffi.as(handle, 'void*');
        SetWindowPos(hwnd, null, x, y, w, h, SWP_NOACTIVATE);
      },
```

- [ ] **Step 5: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS — no TypeScript errors. (If koffi's `proto` / `register` / `pointer` signatures mismatch, fix the call expressions; do not change the `Win32Api` type.)

- [ ] **Step 6: Commit**

```bash
git add app/electron/main.ts
git commit -m "feat(desktop): add koffi bindings for SetParent + WorkerW location"
```

---

## Task 3: Embed / detach helpers with diag + fallback

**Files:**
- Modify: `app/electron/main.ts` — add helper functions directly after `stopDesktopGuard` (after line 711)

These functions perform the actual `SetParent`. Per the native-crash constraint, they are called **only on substate transitions** (Task 4 wires them in), never in high-frequency events. Each wraps all native work in `try/catch` and reports success/failure so the caller can fall back to polling.

- [ ] **Step 1: Add the module-level submode state and embed/detach helpers**

In `app/electron/main.ts`, directly after `stopDesktopGuard` closes (line 711), add:

```typescript
// ===== 桌面壁纸层嵌入（SetParent → WorkerW） =====
// 仅在子状态切换时调用 SetParent，绝不在 blur/focus/minimize 等高频事件里调用（原生崩溃约束）。
import { DesktopSubmode, DEFAULT_DESKTOP_SUBMODE } from '../shared/desktopSubmode';

let desktopSubmode: DesktopSubmode = DEFAULT_DESKTOP_SUBMODE;
let desktopEmbedFellBack = false;

/** 把窗口 SetParent 进 WorkerW。成功返回 true；任一步失败返回 false（调用方据此回退到轮询）。 */
function embedIntoWorkerW(win: BrowserWindow): boolean {
  if (win.isDestroyed()) return false;
  const handle = win.getNativeWindowHandle();
  if (!win32 || !handle) {
    diag('embed: no win32 / no handle → fallback');
    return false;
  }
  try {
    if (!win32.ensureWorkerW()) {
      diag('embed: ensureWorkerW false → fallback');
      return false;
    }
    const workerW = win32.findWallpaperWorkerW();
    if (!workerW) {
      diag('embed: WorkerW not found → fallback');
      return false;
    }
    const bounds = win.getBounds();
    win32.setParent(handle, workerW);
    // SetParent 后坐标系变为相对父窗口；WorkerW 覆盖整个虚拟桌面且原点与屏幕一致，
    // 故直接用屏幕绝对坐标摆位即可对齐（多显示器/DPI 下若偏移再在验收阶段校正）。
    win32.moveWindow(handle, bounds.x, bounds.y, bounds.width, bounds.height);
    diag(`embed: ok at (${bounds.x},${bounds.y},${bounds.width},${bounds.height})`);
    return true;
  } catch (error) {
    diag(`embed: threw → fallback: ${String(error)}`);
    return false;
  }
}

/** 把窗口 SetParent(NULL) 脱离 WorkerW 变回顶层窗口，并用记录坐标摆回。成功返回 true。 */
function detachFromWorkerW(win: BrowserWindow): boolean {
  if (win.isDestroyed()) return false;
  const handle = win.getNativeWindowHandle();
  if (!win32 || !handle) return false;
  try {
    const bounds = win.getBounds();
    win32.setParent(handle, null);
    win32.moveWindow(handle, bounds.x, bounds.y, bounds.width, bounds.height);
    diag('detach: ok');
    return true;
  } catch (error) {
    diag(`detach: threw: ${String(error)}`);
    return false;
  }
}
```

Note: TypeScript allows the `import` here, but project style keeps imports at top. Move this `import { DesktopSubmode, DEFAULT_DESKTOP_SUBMODE } from '../shared/desktopSubmode';` line up to join the existing `shared/windowMode` import block (lines 33-42) instead of leaving it mid-file. Keep the `let desktopSubmode` / `let desktopEmbedFellBack` declarations where shown.

- [ ] **Step 2: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/electron/main.ts
git commit -m "feat(desktop): add embed/detach helpers with diag + fallback"
```

---

## Task 4: Wire substate machine into desktop mode entry

**Files:**
- Modify: `app/electron/main.ts:724-738` (`applyWindowMode`)

Entering `desktop` now tries to embed (→ `embedded`). On embed failure, fall back to the existing `startDesktopGuard` polling. Leaving `desktop` detaches first.

- [ ] **Step 1: Add a desktop-submode transition driver**

In `app/electron/main.ts`, directly above `applyWindowMode` (before line 724), add:

```typescript
/**
 * 应用 desktop 子状态：embedded → 嵌入壁纸层并停轮询；floating → 脱离回顶层。
 * 嵌入失败时记 desktopEmbedFellBack 并启用智能置顶轮询（降级，不崩溃）。
 * 只应在子状态切换处调用（不在高频窗口事件里调用 SetParent）。
 */
function applyDesktopSubmode(win: BrowserWindow, submode: DesktopSubmode) {
  desktopSubmode = submode;
  if (submode === 'embedded') {
    const ok = embedIntoWorkerW(win);
    if (ok) {
      desktopEmbedFellBack = false;
      stopDesktopGuard();
    } else {
      desktopEmbedFellBack = true;
      startDesktopGuard(win); // 降级：回到当前的智能置顶轮询行为
    }
  } else {
    // floating：若之前是降级轮询态，先停轮询；脱离回普通顶层窗口。
    stopDesktopGuard();
    if (!desktopEmbedFellBack) detachFromWorkerW(win);
    win.focus();
  }
}
```

- [ ] **Step 2: Update `applyWindowMode` to route desktop through the submode driver**

In `app/electron/main.ts`, replace the body of `applyWindowMode` (lines 724-738):

```typescript
function applyWindowMode(win: BrowserWindow, mode: WindowMode) {
  windowMode = mode;
  try {
    win.setSkipTaskbar(mode !== 'normal');
    if (mode === 'desktop') {
      desktopSubmode = 'embedded';
      applyDesktopSubmode(win, 'embedded');
    } else {
      stopDesktopGuard();
      if (desktopEmbedFellBack === false) detachFromWorkerW(win); // 退出 desktop 时确保脱离嵌入
      desktopEmbedFellBack = false;
      win.setAlwaysOnTop(isAlwaysOnTop(mode));
    }
    diag(`applyWindowMode mode=${mode} alwaysOnTop=${isAlwaysOnTop(mode)} skipTaskbar=${mode !== 'normal'}`);
  } catch (error) {
    diag(`applyWindowMode failed: ${String(error)}`);
  }
}
```

Note: `detachFromWorkerW` is safe to call even when not embedded (`SetParent(hwnd, null)` on an already-top-level window is a no-op that returns the existing parent); the `try/catch` inside it guarantees no crash.

- [ ] **Step 3: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual smoke (Windows, dev)**

Run: `cd app && npm run dev`
Then via tray check **钉在桌面（组件模式）**.
Expected (check `userData/diag.log`): a line `embed: ok ...` (success) OR `embed: ... → fallback` followed by `desktop guard: poll started` (graceful degrade). Either way the process stays alive — no silent disappearance.

- [ ] **Step 5: Commit**

```bash
git add app/electron/main.ts
git commit -m "feat(desktop): embed on desktop entry, fall back to polling on failure"
```

---

## Task 5: `window:desktopFloat` IPC + preload + renderer types

**Files:**
- Modify: `app/electron/main.ts` (IPC handler, near line 901), `app/electron/preload.ts:8` area, `app/src/vite-env.d.ts:11` area

- [ ] **Step 1: Add the IPC handler in main**

In `app/electron/main.ts`, directly after the `window:setWindowMode` handler (after line 904), add:

```typescript
  // 渲染层双击挂件空白区 → 从 embedded 浮起为 floating（仅 desktop 模式生效）。
  ipcMain.handle('window:desktopFloat', () => {
    if (windowMode !== 'desktop' || desktopSubmode !== 'embedded') return desktopSubmode;
    applyDesktopSubmode(win, 'floating');
    return desktopSubmode;
  });
```

- [ ] **Step 2: Expose it in preload**

In `app/electron/preload.ts`, add directly after the `setWindowMode` line (line 9):

```typescript
  desktopFloat: () => ipcRenderer.invoke('window:desktopFloat'),
```

- [ ] **Step 3: Add the renderer type**

In `app/src/vite-env.d.ts`, add directly after the `setWindowMode` line (line 10):

```typescript
    desktopFloat: () => Promise<import('../shared/desktopSubmode').DesktopSubmode>;
```

- [ ] **Step 4: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/electron/main.ts app/electron/preload.ts app/src/vite-env.d.ts
git commit -m "feat(desktop): add window:desktopFloat IPC channel"
```

---

## Task 6: Renderer double-click to float

**Files:**
- Modify: `app/src/App.tsx:384` (the `app-shell` root `<div>`)

Double-clicking the widget anywhere (when embedded) asks main to float. Because the embedded window is non-interactive at the OS level (it's parented under WorkerW), the double-click that actually reaches the renderer happens once the user has clicked — this handler is the renderer's request to become interactive; main ignores it unless `desktop` + `embedded`, so it's safe to always attach.

- [ ] **Step 1: Add the double-click handler to the app-shell div**

In `app/src/App.tsx`, on the `app-shell` `<div>` (line 384), add an `onDoubleClick` prop:

```tsx
      <div
        onDoubleClick={() => window.electronAPI?.desktopFloat()}
        className={`app-shell ${activeThemeClass} density-${personalization.layoutDensity} ${personalization.texture ? 'texture-on' : 'texture-off'} ${personalization.animations ? 'motion-on' : 'motion-off'} ${compactMode ? 'task-priority-mode' : ''} relative flex h-full flex-col overflow-hidden border border-white/45 text-zinc-900 backdrop-blur-2xl dark:border-white/10 dark:text-zinc-100`}>
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/src/App.tsx
git commit -m "feat(desktop): double-click widget to float for editing"
```

---

## Task 7: Auto-re-embed on blur (floating → embedded)

**Files:**
- Modify: `app/electron/main.ts:874` (the existing `win.on('blur', ...)` handler)

The current blur handler only logs. Per the native-crash constraint, `SetParent` historically crashed when called *in the blur of "clicking the desktop"*. We mitigate by: (a) only acting when `desktop` + `floating`, (b) deferring the `SetParent` out of the blur stack with `setImmediate`, and (c) re-checking state inside the deferred callback. This keeps `SetParent` off the synchronous blur path.

- [ ] **Step 1: Replace the blur handler**

In `app/electron/main.ts`, replace the existing blur line (line 874):

```typescript
  win.on('blur', () => diag('evt: blur'));
```

with:

```typescript
  win.on('blur', () => {
    diag('evt: blur');
    // 仅 desktop + floating 时自动嵌回。SetParent 不在 blur 同步栈里调用——
    // 用 setImmediate 推迟出栈，规避「点击桌面失焦瞬间重设原生标志」的历史原生崩溃。
    if (windowMode !== 'desktop' || desktopSubmode !== 'floating' || isQuitting) return;
    setImmediate(() => {
      if (win.isDestroyed() || windowMode !== 'desktop' || desktopSubmode !== 'floating') return;
      applyDesktopSubmode(win, 'embedded');
    });
  });
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Manual smoke (Windows, dev)**

Run: `cd app && npm run dev`, enter desktop mode, double-click to float, then click another window.
Expected (`diag.log`): `evt: blur` → `detach`/`embed: ok` lines; the widget sinks back to the wallpaper layer; process stays alive.

- [ ] **Step 4: Commit**

```bash
git add app/electron/main.ts
git commit -m "feat(desktop): auto re-embed on blur via deferred SetParent"
```

---

## Task 8: Detach on close + full verify sweep

**Files:**
- Modify: `app/electron/main.ts:856-859` (`win.on('closed', ...)`)

- [ ] **Step 1: Detach on window close**

In `app/electron/main.ts`, replace the `closed` handler (lines 856-859):

```typescript
  win.on('closed', () => {
    diag('evt: closed');
    stopDesktopGuard();
  });
```

with:

```typescript
  win.on('closed', () => {
    diag('evt: closed');
    stopDesktopGuard();
  });
```

(no change needed here — `closed` fires after the native window is gone, so `SetParent` is neither possible nor required). Instead ensure detach happens on app quit *before* the window is destroyed. Add to the existing `app.on('before-quit'...)` if present, or add this handler near tray quit. Locate the quit path:

Run: `cd app && npx tsx -e "0"` is not needed — instead grep:

Grep `app/electron/main.ts` for `before-quit` and `isQuitting = true`. If a `before-quit` handler exists, add inside it:

```typescript
    if (mainWindow && !mainWindow.isDestroyed() && windowMode === 'desktop' && !desktopEmbedFellBack) {
      detachFromWorkerW(mainWindow);
    }
```

If no `before-quit` handler exists, add one directly after `createTray()` is defined in `createWindow` (after line 834):

```typescript
  app.on('before-quit', () => {
    if (mainWindow && !mainWindow.isDestroyed() && windowMode === 'desktop' && !desktopEmbedFellBack) {
      detachFromWorkerW(mainWindow);
    }
  });
```

- [ ] **Step 2: Run all pure-function verifies**

Run: `cd app && npm run verify:window-mode && npm run verify:desktop-submode`
Expected: both print `... all assertions passed`.

- [ ] **Step 3: Typecheck**

Run: `cd app && npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/electron/main.ts
git commit -m "feat(desktop): detach from WorkerW before app quit"
```

---

## Task 9: Manual acceptance (Windows desktop required)

**Files:** none — verification only.

- [ ] **Step 1: Build and run**

Run: `cd app && npm run dev`

- [ ] **Step 2: Walk the acceptance checklist** (from the spec). Watch `userData/diag.log` throughout; the process must never silently disappear.

1. Tray → check **钉在桌面（组件模式）** → widget sits on the desktop.
2. Press **Win+D** → widget does NOT vanish / is not swept away.
3. Open a fullscreen app → widget is NOT covered, and does NOT float above the app.
4. **Double-click** the widget → it floats; you can check tasks and add tasks.
5. Click another window (blur) → it auto-re-embeds into the desktop.
6. Float, drag to a new position, let it re-embed → position is correct; restart app → position restored.
7. Simulate WorkerW-not-found (e.g. on a non-standard shell) → `diag.log` shows `→ fallback` + `desktop guard: poll started`; process does NOT crash.

- [ ] **Step 3: If any native offset/DPI issue appears in step 6 (multi-monitor)**, adjust the coordinate translation in `embedIntoWorkerW` (Task 3) by subtracting the WorkerW screen origin before `moveWindow`. Re-run steps 1-6. Commit any fix:

```bash
git add app/electron/main.ts
git commit -m "fix(desktop): correct embedded coordinate translation for multi-monitor"
```

---

## Self-Review Notes

- **Spec coverage:** desktop substate machine (Task 1) ✓; koffi bindings `SendMessageTimeoutW`/`EnumWindows`/`FindWindowExW`/`SetParent` (Task 2) ✓; WorkerW location via 0x052C + EnumWindows + SHELLDLL_DefView sibling (Task 2-3) ✓; embed/detach with try/catch + fallback to `startDesktopGuard` (Task 3-4) ✓; SetParent only on transitions, deferred out of blur (Task 7) ✓; `window:desktopFloat` IPC + preload + renderer (Task 5-6) ✓; blur auto-re-embed (Task 7) ✓; exit/quit detach (Task 4, 8) ✓; coordinates persisted via existing `WINDOW_STATE_KEY` `persistWindowState` on move/resize (already wired, used by embed/detach `getBounds`) ✓; `shared/windowMode.ts` + its verify unchanged (Task 1 step 6) ✓.
- **Non-goals respected:** no change to "click desktop floats above apps"; embedded is non-draggable (float first); `normal`/`onTop` untouched.
- **Type consistency:** `DesktopSubmode` / `nextDesktopSubmode` / `DEFAULT_DESKTOP_SUBMODE` / `isDesktopSubmode` used identically across `shared/desktopSubmode.ts`, its verify, and main.ts. `Win32Api` method names (`ensureWorkerW`, `findWallpaperWorkerW`, `setParent`, `moveWindow`) match between type and object literal and call sites.
- **Native-crash constraint honored:** `SetParent` is reachable only from `applyDesktopSubmode`, which is called from mode entry, the `desktopFloat` IPC, the deferred `setImmediate` in blur, and quit — never synchronously inside blur/focus/minimize.
