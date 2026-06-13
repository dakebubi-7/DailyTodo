# Widget Desktop Pin De-flicker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop widget pin to the desktop without z-order flicker by replacing its 64ms foreground-polling three-state guard with a two-state, focus/blur-driven model, and remove the abandoned SetParent-into-wallpaper experiment.

**Architecture:** The widget keeps `owner=Progman` for Win+D exemption (set once on enter). Its z-order is driven only by the widget window's own `focus`/`blur` events: focused → temporarily topmost (so the user can type/tap), blurred → sent to the bottom (pinned to desktop). The transition logic is a pure reducer in `app/shared/widgetDesktopState.ts`, verifiable without Electron. Only the desktop widget is touched; the main window and its own desktop guard are untouched.

**Tech Stack:** Electron, TypeScript, koffi (Win32 via FFI), electron-vite, tsx verification scripts.

---

## File Map

- Modify: `app/electron/main.ts`
  - Drop the uncommitted SetParent experiment (via stash) to return to the committed three-state widget guard.
  - Replace the widget's three-state polling guard (`applyWidgetDesktopWidgetState`, `applyWidgetDesktopTopmost`, `startWidgetDesktopGuard`, `stopWidgetDesktopGuard`) with two-state event-driven functions (`applyWidgetPin`, `startWidgetDesktopPin`, `stopWidgetDesktopPin`).
  - Wire `focus`/`blur` listeners on the widget window; remove the `setInterval` poll.
  - Keep `applyWidgetDesktopOwner` / `clearWidgetDesktopOwner` (owner=Progman) and the `DesktopWidgetState` type (still used by the main-window guard).
- Create: `app/shared/widgetDesktopState.ts`
  - Pure reducer `nextWidgetDesktopState(current, event)` + `WidgetPinState` / `WidgetPinEvent` types.
- Create: `app/scripts/verify-widget-desktop-state.ts`
  - Assert the reducer transitions.
- Modify: `app/scripts/verify-main-window-structure.ts`
  - Assert the poll is gone, focus/blur are wired, and the experiment is absent.
- Modify: `app/package.json`
  - Register `verify:widget-desktop-state` and add it to `verify:widget-structure` and `verify:rc`.

## Out of Scope (do not touch)

- The main application window: UI, task data, all feature logic.
- The main window's desktop guard: `applyDesktopTopmost`, `startDesktopGuard`, `stopDesktopGuard`, and the `desktopWidgetState` variable / `DESKTOP_GUARD_INTERVAL_MS` constant near `main.ts:1067`. These are the main window's own pinning state and are independent from the widget.
- Widget rendering/UI, bounds persistence, cross-window task sync, and all tray entries except the experiment toggle being removed.

---

## Task 1: Drop the SetParent Experiment

**Files:**
- Modify: `app/electron/main.ts` (discard uncommitted experiment)

- [ ] **Step 1: Confirm the only uncommitted change is the experiment**

Run from repo root:

```bash
git diff --stat app/electron/main.ts
```

Expected: only `app/electron/main.ts` is modified. The diff contains `embedIntoWallpaper`, `detachFromWallpaper`, `toggleWidgetWallpaperEmbed`, the `opaque` param, and the tray "嵌入壁纸层" entry — and nothing else.

- [ ] **Step 2: Stash the experiment (recoverable, not deleted)**

Run from repo root:

```bash
git stash push -m "abandoned widget wallpaper SetParent experiment" -- app/electron/main.ts
```

This returns `app/electron/main.ts` to the committed three-state widget guard while keeping the experiment recoverable via `git stash list` / `git stash show -p`. It can be dropped later with `git stash drop` once the new approach is confirmed.

- [ ] **Step 3: Confirm the working tree is clean for main.ts**

Run from repo root:

```bash
git status --short app/electron/main.ts
```

Expected: no output (main.ts matches HEAD).

- [ ] **Step 4: Confirm the experiment code is gone**

Run from repo root:

```bash
grep -c "embedIntoWallpaper\|toggleWidgetWallpaperEmbed" app/electron/main.ts || echo "0 matches (good)"
```

Expected: `0 matches (good)`.

## Task 2: Pure Reducer + Verification (TDD)

**Files:**
- Create: `app/shared/widgetDesktopState.ts`
- Create: `app/scripts/verify-widget-desktop-state.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-widget-desktop-state.ts`:

```ts
import assert from 'node:assert/strict';
import { nextWidgetDesktopState } from '../shared/widgetDesktopState';

// enter / blur always settle to idle (pinned to desktop, sent to bottom)
assert.equal(nextWidgetDesktopState('idle', 'enter'), 'idle');
assert.equal(nextWidgetDesktopState('active', 'enter'), 'idle');
assert.equal(nextWidgetDesktopState('idle', 'widget-blur'), 'idle');
assert.equal(nextWidgetDesktopState('active', 'widget-blur'), 'idle');

// focusing the widget raises it so the user can type / tap tasks
assert.equal(nextWidgetDesktopState('idle', 'widget-focus'), 'active');
assert.equal(nextWidgetDesktopState('active', 'widget-focus'), 'active');

console.log('widget-desktop-state verification passed');
```

- [ ] **Step 2: Register the verification script in package.json**

In `app/package.json` `scripts`, add this line immediately after the `"verify:widget-model"` line:

```json
    "verify:widget-desktop-state": "tsx scripts/verify-widget-desktop-state.ts",
```

- [ ] **Step 3: Run it and confirm it fails**

Run from `app/`:

```bash
npm run verify:widget-desktop-state
```

Expected: FAIL with a module-not-found error for `../shared/widgetDesktopState`.

- [ ] **Step 4: Implement the reducer**

Create `app/shared/widgetDesktopState.ts`:

```ts
// 桌面组件「钉在桌面」两态模型（不跟踪前台，故不闪烁）：
// - idle：默认。owner=Progman 豁免 Win+D + 沉到最底，贴在桌面上、被 app 盖住。
// - active：用户点了组件自己。临时浮到最上，方便打字 / 点任务；失焦即回 idle。
// 纯函数，便于不启动 Electron 直接断言。
export type WidgetPinState = 'idle' | 'active';
export type WidgetPinEvent = 'enter' | 'widget-focus' | 'widget-blur';

export function nextWidgetDesktopState(
  current: WidgetPinState,
  event: WidgetPinEvent,
): WidgetPinState {
  switch (event) {
    case 'widget-focus':
      return 'active';
    case 'enter':
    case 'widget-blur':
      return 'idle';
    default:
      return current;
  }
}
```

- [ ] **Step 5: Run it and confirm it passes**

Run from `app/`:

```bash
npm run verify:widget-desktop-state
```

Expected: PASS with `widget-desktop-state verification passed`.

- [ ] **Step 6: Commit**

```bash
git add app/shared/widgetDesktopState.ts app/scripts/verify-widget-desktop-state.ts app/package.json
git commit -m "feat: add two-state widget desktop pin reducer"
```

## Task 3: Wire the Two-State Event-Driven Guard into main.ts

**Files:**
- Modify: `app/electron/main.ts`

- [ ] **Step 1: Import the reducer**

In `app/electron/main.ts`, the file already imports from `../shared/*` (e.g. `../shared/rendererRoute`). Add this import line directly below the existing `} from '../shared/rendererRoute';` import:

```ts
import { nextWidgetDesktopState, type WidgetPinState } from '../shared/widgetDesktopState';
```

- [ ] **Step 2: Replace the widget guard state variables**

In `app/electron/main.ts`, find this block (the widget guard's module-level state, just above `function applyWidgetDesktopOwner`):

```ts
let widgetDesktopGuardTimer: NodeJS.Timeout | null = null;
let widgetDesktopState: DesktopWidgetState = 'app-background';
let widgetDesktopOwnerApplied = false;
let widgetDesktopShellSeenAt = 0;
let widgetAppBackgroundSettleUntil = 0;
let widgetLastAppForegroundClass = '';
let widgetLastGuardSnapshot = '';
```

Replace it with:

```ts
let widgetPinState: WidgetPinState = 'idle';
let widgetDesktopOwnerApplied = false;
```

- [ ] **Step 3: Replace the three guard functions with the two-state functions**

In `app/electron/main.ts`, find the contiguous block of four functions — from `function applyWidgetDesktopWidgetState(` through the closing brace of `function stopWidgetDesktopGuard()`. It is exactly this text:

```ts
function applyWidgetDesktopWidgetState(win: BrowserWindow, nextState: DesktopWidgetState, force = false) {
  if (win.isDestroyed() || !win32) return;
  if (!force && widgetDesktopState === nextState) return;

  const handle = win.getNativeWindowHandle();
  if (!handle) return;

  widgetDesktopState = nextState;

  if (nextState === 'desktop-visible') {
    applyWidgetDesktopOwner(win);
    try {
      if (!win.isVisible()) win.showInactive();
      win.setAlwaysOnTop(true, 'screen-saver');
      win32.setTopmost(handle);
    } catch (error) {
      diag(`widget state desktop-visible failed: ${String(error)}`);
    }
    return;
  }

  if (nextState === 'dt-active') {
    clearWidgetDesktopOwner(win);
    try {
      win.setAlwaysOnTop(false, 'normal');
      win32.clearTopmost(handle);
      if (!win.isVisible()) win.show();
    } catch (error) {
      diag(`widget state dt-active failed: ${String(error)}`);
    }
    return;
  }

  clearWidgetDesktopOwner(win);
  try {
    win.setAlwaysOnTop(false, 'normal');
    win32.clearTopmost(handle);
    win32.sendToBottom(handle);
  } catch (error) {
    diag(`widget state app-background failed: ${String(error)}`);
  }
}

function applyWidgetDesktopTopmost(win: BrowserWindow) {
  if (win.isDestroyed() || !win32) return;
  const handle = win.getNativeWindowHandle();
  if (!handle) return;

  const fgClass = win32.getForegroundClass();
  const ownForeground = win32.isForegroundWindow(handle);
  const shellForeground = DESKTOP_FG_CLASSES.has(fgClass);
  const now = Date.now();

  if (shellForeground) {
    widgetDesktopShellSeenAt = now;
  } else if (fgClass && !ownForeground) {
    widgetDesktopShellSeenAt = 0;
  }
  const withinDesktopGrace = fgClass === '' && widgetDesktopShellSeenAt > 0 && now - widgetDesktopShellSeenAt < 700;

  const nextState: DesktopWidgetState = ownForeground
    ? 'dt-active'
    : (shellForeground || withinDesktopGrace)
      ? 'desktop-visible'
      : 'app-background';

  if (nextState === 'app-background' && fgClass && !ownForeground && fgClass !== widgetLastAppForegroundClass) {
    widgetLastAppForegroundClass = fgClass;
    widgetAppBackgroundSettleUntil = now + 900;
  }
  if (nextState !== 'app-background') {
    widgetLastAppForegroundClass = '';
    widgetAppBackgroundSettleUntil = 0;
  }
  const shouldForceAppBackground = nextState === 'app-background' && now < widgetAppBackgroundSettleUntil;

  const snapshot = `fg=${fgClass || '(none)'} own=${ownForeground} shell=${shellForeground} state=${widgetDesktopState}->${nextState}`;
  if (snapshot !== widgetLastGuardSnapshot) {
    widgetLastGuardSnapshot = snapshot;
    diag(`widget guard snapshot: ${snapshot}`);
  }

  applyWidgetDesktopWidgetState(win, nextState, shouldForceAppBackground);
}

function startWidgetDesktopGuard(win: BrowserWindow) {
  stopWidgetDesktopGuard();
  widgetDesktopState = 'app-background';
  applyWidgetDesktopTopmost(win);
  widgetDesktopGuardTimer = setInterval(() => applyWidgetDesktopTopmost(win), DESKTOP_GUARD_INTERVAL_MS);
}

function stopWidgetDesktopGuard() {
  if (widgetDesktopGuardTimer) {
    clearInterval(widgetDesktopGuardTimer);
    widgetDesktopGuardTimer = null;
  }
  widgetDesktopState = 'app-background';
}
```

Replace that entire block with:

```ts
// 桌面组件钉桌面：两态、事件驱动（focus/blur），不轮询前台 → 无 z-order 抖动 → 不闪。
// idle：沉到最底，贴桌面、被 app 盖住。active：用户点了组件，临时浮到最上方便打字/点任务。
function applyWidgetPin(win: BrowserWindow, state: WidgetPinState) {
  if (win.isDestroyed() || !win32) return;
  const handle = win.getNativeWindowHandle();
  if (!handle) return;

  widgetPinState = state;
  try {
    if (state === 'active') {
      // 用户点了组件：临时浮到最上，方便打字 / 点任务。
      if (!win.isVisible()) win.showInactive();
      win32.setTopmost(handle);
    } else {
      // idle：贴桌面、沉到最底。sendToBottom 会先摘掉 topmost 再沉底，一次原子操作。
      win32.sendToBottom(handle);
    }
  } catch (error) {
    diag(`widget pin ${state} failed: ${String(error)}`);
  }
}

// 进入桌面组件模式：owner=Progman 豁免 Win+D（仅设一次），随后沉底进入 idle。
function startWidgetDesktopPin(win: BrowserWindow) {
  applyWidgetDesktopOwner(win);
  applyWidgetPin(win, nextWidgetDesktopState(widgetPinState, 'enter'));
}

// 退出（窗口关闭）：清掉 owner，回到普通窗口语义。
function stopWidgetDesktopPin(win: BrowserWindow) {
  clearWidgetDesktopOwner(win);
  widgetPinState = 'idle';
}
```

- [ ] **Step 4: Switch the ready-to-show hook to the new pin start, and add focus/blur listeners**

In `createDesktopWidgetWindow`, find:

```ts
  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show();
    widgetWindow.focus();
    // 窗口就绪后再启动桌面守护：此时原生句柄已可用，挂 Progman owner 才有效。
    startWidgetDesktopGuard(widgetWindow);
  });
  widgetWindow.on('move', () => persistDesktopWidgetWindowState(widgetWindow));
  widgetWindow.on('resize', () => persistDesktopWidgetWindowState(widgetWindow));
```

Replace it with:

```ts
  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show();
    widgetWindow.focus();
    // 窗口就绪后再进入桌面组件模式：此时原生句柄已可用，挂 Progman owner 才有效。
    startWidgetDesktopPin(widgetWindow);
  });
  // 事件驱动 z-order：点组件 → 浮上来；点别处（组件 blur）→ 沉回桌面。无轮询、无闪烁。
  widgetWindow.on('focus', () =>
    applyWidgetPin(widgetWindow, nextWidgetDesktopState(widgetPinState, 'widget-focus')),
  );
  widgetWindow.on('blur', () =>
    applyWidgetPin(widgetWindow, nextWidgetDesktopState(widgetPinState, 'widget-blur')),
  );
  widgetWindow.on('move', () => persistDesktopWidgetWindowState(widgetWindow));
  widgetWindow.on('resize', () => persistDesktopWidgetWindowState(widgetWindow));
```

- [ ] **Step 5: Update the close handler to use the new stop helper**

In `createDesktopWidgetWindow`'s `close` handler, find:

```ts
    stopWidgetDesktopGuard();
    clearWidgetDesktopOwner(widgetWindow);
```

Replace it with:

```ts
    stopWidgetDesktopPin(widgetWindow);
```

- [ ] **Step 6: Type-check / build to confirm no dangling references**

Run from `app/`:

```bash
npx tsc --noEmit -p tsconfig.json
```

Expected: PASS with no errors. In particular, no "unused variable" or "cannot find name" errors for the removed `widgetDesktopGuardTimer`, `applyWidgetDesktopTopmost`, `widgetDesktopState`, `widgetDesktopShellSeenAt`, `widgetAppBackgroundSettleUntil`, `widgetLastAppForegroundClass`, or `widgetLastGuardSnapshot`. If tsc reports any of these names still referenced, that reference was missed — remove it before continuing.

- [ ] **Step 7: Commit**

```bash
git add app/electron/main.ts
git commit -m "feat: drive widget desktop pin by focus/blur, drop polling"
```

## Task 4: Structure Verification

**Files:**
- Modify: `app/scripts/verify-main-window-structure.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Add structure assertions**

In `app/scripts/verify-main-window-structure.ts`, insert these assertions immediately before the final `console.log(...)` line:

```ts
// Widget desktop pin must be event-driven (focus/blur), not a foreground poll.
assert.equal(/widgetWindow\.on\('focus'/.test(source), true, 'widget should react to its own focus event');
assert.equal(/widgetWindow\.on\('blur'/.test(source), true, 'widget should react to its own blur event');
assert.equal(source.includes('startWidgetDesktopPin'), true, 'widget should use the event-driven pin start');
assert.equal(source.includes('widgetDesktopGuardTimer'), false, 'widget must not run a setInterval poll');
assert.equal(source.includes('applyWidgetDesktopTopmost'), false, 'widget foreground-polling guard must be removed');

// The abandoned SetParent-into-wallpaper experiment must stay removed.
assert.equal(source.includes('embedIntoWallpaper'), false, 'wallpaper SetParent experiment must be removed');
assert.equal(source.includes('toggleWidgetWallpaperEmbed'), false, 'wallpaper embed tray toggle must be removed');
```

- [ ] **Step 2: Run structure verification and confirm it passes**

Run from `app/`:

```bash
npm run verify:main-window-structure
```

Expected: PASS with `main-window structure verification passed`.

- [ ] **Step 3: Wire the new script into the verification chains**

In `app/package.json`, update `verify:widget-structure` to include the new script:

```json
    "verify:widget-structure": "npm run verify:renderer-route && npm run verify:widget-model && npm run verify:widget-desktop-state && npm run verify:main-window-structure",
```

And in `verify:rc`, insert `npm run verify:widget-desktop-state &&` immediately before `npm run verify:main-window-structure` so that segment reads:

```json
... && npm run verify:widget-model && npm run verify:widget-desktop-state && npm run verify:main-window-structure && npm run verify:rc-ui"
```

- [ ] **Step 4: Run the full widget verification chain**

Run from `app/`:

```bash
npm run verify:widget-structure
```

Expected: PASS with all four lines:

```text
renderer-route verification passed
widget-model verification passed
widget-desktop-state verification passed
main-window structure verification passed
```

- [ ] **Step 5: Commit**

```bash
git add app/scripts/verify-main-window-structure.ts app/package.json
git commit -m "test: verify event-driven widget pin and experiment removal"
```

## Task 5: Final Verification and Manual Check

**Files:**
- Verify: `app/electron/main.ts`, `app/shared/widgetDesktopState.ts`, `app/package.json`

- [ ] **Step 1: Run the existing window-mode verification (guards against main-window regressions)**

Run from `app/`:

```bash
npm run verify:window-mode
```

Expected: PASS (no change — confirms the main-window guard was not affected).

- [ ] **Step 2: Production build**

Run from `app/`:

```bash
npm run build
```

Expected: PASS. The pre-existing Vite browser-compatibility warning about `path` in `shared/obsidianTemplates.ts` may appear; it is not a blocker if the build exits successfully.

- [ ] **Step 3: Manual behavior check (user runs this)**

Run from `app/`:

```bash
npm run dev
```

Then, from the tray, open 打开桌面组件 and confirm:

1. No flicker when alternating focus between the desktop and other apps (the widget no longer pops up/down on its own).
2. `Win+D` (Show Desktop) does NOT hide the widget.
3. Clicking the widget raises it and lets you type in the quick-add field and tap a task to complete it.
4. Clicking back to another app sinks the widget to the desktop (covered by that app).
5. The main DailyTodo window still opens and behaves exactly as before.

**Known risk to watch:** when the widget is at the bottom with `owner=Progman`, clicking it must reliably raise it and give the input keyboard focus. The `focus` handler calls `win32.setTopmost`, which uses `HWND_TOPMOST` and should float it above other windows even with `owner=Progman`. If it does NOT raise/focus during this check, that is the one spot to adjust (e.g. add `widgetWindow.moveTop()` in the focus handler before `setTopmost`); re-run this step after adjusting.

- [ ] **Step 4: Drop the stashed experiment (optional, after confirming the new approach)**

Once the manual check passes and you are confident the experiment is no longer needed:

```bash
git stash list   # find the "abandoned widget wallpaper SetParent experiment" entry
git stash drop stash@{0}   # use the matching index
```

If you would rather keep it recoverable, skip this step — the stash is harmless.

## Self-Review Notes

- **Spec coverage:** experiment removal (Task 1 + Task 4 assertions), two-state model + focus/blur driver (Task 3), `owner=Progman` Win+D exemption preserved (Task 3 `startWidgetDesktopPin`), pure reducer + verification (Task 2), structure verification (Task 4), main window untouched (Out of Scope + Task 5 Step 1), manual flicker/Win+D/clickability check (Task 5 Step 3). All spec success criteria map to a task.
- **Placeholder scan:** no TBD/TODO; every code step shows full code; every command lists expected output.
- **Type consistency:** `WidgetPinState` / `WidgetPinEvent` / `nextWidgetDesktopState` are defined in Task 2 and used identically in Task 3. The removed `DesktopWidgetState` type is intentionally kept (used by the main-window guard). Function names `applyWidgetPin`, `startWidgetDesktopPin`, `stopWidgetDesktopPin` are used consistently across Task 3 and asserted in Task 4.
