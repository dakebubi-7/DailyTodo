# Desktop Widget Dual Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unstable single-window desktop mode with a dual-window pseudo desktop widget: a normal interactive main window plus a desktop-owned display window that remains visible after Win+D without blocking other apps.

**Architecture:** Keep `mainWindow` as the interactive application window and add `desktopWidgetWindow` as a secondary BrowserWindow used only in desktop mode. The widget window owns desktop-layer visibility and forwards clicks to the main window; the main window never uses `Progman` owner in desktop mode. This separates display-on-desktop from interaction, avoiding the native Z-order conflict we observed with a single transparent window.

**Tech Stack:** Electron 34, electron-vite, React renderer, Win32 APIs through `koffi`, existing `windowMode` shared module.

---

## File Structure

**Modify:** `app/electron/main.ts`
- Add `desktopWidgetWindow` lifecycle helpers.
- Reuse the existing renderer URL/file entry for both windows.
- Keep existing Win32 `setDesktopOwner` / `clearDesktopOwner` helpers for the widget window only.
- Simplify desktop mode so `mainWindow` is a normal interactive window while `desktopWidgetWindow` is the desktop display layer.
- Remove the unstable state-machine desktop guard from the main window.

**Test/Verify:** manual Windows behavior plus existing TypeScript command.
- `npm run typecheck`
- `npm run dev`
- Manual Win+D and app-switch scenarios.

---

### Task 1: Introduce desktop widget window state and renderer loading helper

**Files:**
- Modify: `app/electron/main.ts`

- [ ] **Step 1: Add module-level widget state near existing window globals**

In `app/electron/main.ts`, near existing globals:

```ts
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let persistTimer: NodeJS.Timeout | null = null;
let isQuitting = false;
```

Change to:

```ts
let mainWindow: BrowserWindow | null = null;
let desktopWidgetWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let persistTimer: NodeJS.Timeout | null = null;
let isQuitting = false;
```

- [ ] **Step 2: Add renderer loading helper after `getInitialBounds()`**

Add this function after `getInitialBounds()`:

```ts
function loadRenderer(win: BrowserWindow, query = '') {
  const devServerUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    const url = query ? `${devServerUrl}${query}` : devServerUrl;
    diag(`loadURL ${url}`);
    win.loadURL(url);
    return;
  }

  diag('loadFile dist/index.html');
  win.loadFile(path.join(__dirname, '../dist/index.html'), query ? { query: Object.fromEntries(new URLSearchParams(query.replace(/^\?/, ''))) } : undefined);
}
```

- [ ] **Step 3: Replace main window renderer loading code**

Find this existing code in `createWindow()`:

```ts
const devServerUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
if (devServerUrl) {
  diag(`loadURL ${devServerUrl}`);
  win.loadURL(devServerUrl);
} else {
  diag('loadFile dist/index.html');
  win.loadFile(path.join(__dirname, '../dist/index.html'));
}
```

Replace it with:

```ts
loadRenderer(win);
```

- [ ] **Step 4: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: `tsc --noEmit -p tsconfig.json` exits with no TypeScript errors.

---

### Task 2: Add desktop widget BrowserWindow lifecycle

**Files:**
- Modify: `app/electron/main.ts`

- [ ] **Step 1: Add widget bounds helper after `getInitialBounds()`**

Add:

```ts
function getDesktopWidgetBounds() {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow.getBounds() : getInitialBounds();
}
```

- [ ] **Step 2: Add `showMainWindowFromWidget()` near `showMainWindow()`**

Add before `showMainWindow()`:

```ts
function showMainWindowFromWidget() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  userHidden = false;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}
```

- [ ] **Step 3: Add `createDesktopWidgetWindow()` before `applyWindowMode()`**

Add:

```ts
function createDesktopWidgetWindow() {
  if (desktopWidgetWindow && !desktopWidgetWindow.isDestroyed()) return desktopWidgetWindow;

  const widget = new BrowserWindow({
    ...getDesktopWidgetBounds(),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: 480,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    show: false,
    alwaysOnTop: false,
    icon: createAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  desktopWidgetWindow = widget;
  diag('desktop widget created');

  loadRenderer(widget, '?desktopWidget=1');

  widget.once('ready-to-show', () => {
    if (windowMode !== 'desktop' || widget.isDestroyed()) return;
    widget.showInactive();
    applyDesktopOwner(widget);
  });

  widget.on('closed', () => {
    diag('desktop widget closed');
    desktopWidgetWindow = null;
  });

  widget.on('focus', showMainWindowFromWidget);
  widget.webContents.on('before-input-event', () => showMainWindowFromWidget());

  return widget;
}
```

- [ ] **Step 4: Add `showDesktopWidgetWindow()` before `applyWindowMode()`**

Add:

```ts
function showDesktopWidgetWindow() {
  const widget = createDesktopWidgetWindow();
  if (widget.isDestroyed()) return;
  try {
    widget.setBounds(getDesktopWidgetBounds());
    widget.showInactive();
    applyDesktopOwner(widget);
  } catch (error) {
    diag(`showDesktopWidgetWindow failed: ${String(error)}`);
  }
}
```

- [ ] **Step 5: Add `hideDesktopWidgetWindow()` before `applyWindowMode()`**

Add:

```ts
function hideDesktopWidgetWindow() {
  if (!desktopWidgetWindow || desktopWidgetWindow.isDestroyed()) return;
  try {
    clearDesktopOwner(desktopWidgetWindow);
    desktopWidgetWindow.hide();
  } catch (error) {
    diag(`hideDesktopWidgetWindow failed: ${String(error)}`);
  }
}
```

- [ ] **Step 6: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: no TypeScript errors.

---

### Task 3: Remove unstable main-window desktop guard behavior

**Files:**
- Modify: `app/electron/main.ts`

- [ ] **Step 1: Replace `startDesktopGuard()` with widget sync only**

Find:

```ts
function startDesktopGuard(win: BrowserWindow) {
  stopDesktopGuard();
  desktopWidgetState = 'app-background';
  applyDesktopTopmost(win);
  desktopGuardTimer = setInterval(() => applyDesktopTopmost(win), DESKTOP_GUARD_INTERVAL_MS);
}
```

Replace with:

```ts
function startDesktopGuard(win: BrowserWindow) {
  stopDesktopGuard();
  showDesktopWidgetWindow();
  desktopGuardTimer = setInterval(() => {
    if (windowMode !== 'desktop') return;
    if (desktopWidgetWindow && !desktopWidgetWindow.isDestroyed() && !win.isDestroyed()) {
      desktopWidgetWindow.setBounds(win.getBounds());
    }
  }, DESKTOP_GUARD_INTERVAL_MS);
}
```

- [ ] **Step 2: Replace `stopDesktopGuard()` to hide widget**

Find:

```ts
function stopDesktopGuard() {
  if (desktopGuardTimer) {
    clearInterval(desktopGuardTimer);
    desktopGuardTimer = null;
  }
  desktopWidgetState = 'app-background';
}
```

Replace with:

```ts
function stopDesktopGuard() {
  if (desktopGuardTimer) {
    clearInterval(desktopGuardTimer);
    desktopGuardTimer = null;
  }
  hideDesktopWidgetWindow();
}
```

- [ ] **Step 3: Stop applying owner to main window in desktop mode**

Ensure `applyWindowMode()` desktop branch is:

```ts
if (mode === 'desktop') {
  win.setAlwaysOnTop(false, 'normal');
  startDesktopGuard(win);
} else {
  stopDesktopGuard();
  clearDesktopOwner(win);
  win.setAlwaysOnTop(isAlwaysOnTop(mode));
}
```

- [ ] **Step 4: Simplify main minimize handler**

Find the `win.on('minimize', ...)` handler. Replace desktop guard recovery block with no desktop-specific recovery for the main window:

```ts
win.on('minimize', () => {
  diag('evt: minimize');
});
```

This avoids the main window fighting Win+D; the widget window owns desktop visibility.

- [ ] **Step 5: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: no TypeScript errors.

---

### Task 4: Synchronize widget lifecycle with main window close/quit

**Files:**
- Modify: `app/electron/main.ts`

- [ ] **Step 1: Update main window `closed` handler**

Find:

```ts
win.on('closed', () => {
  diag('evt: closed');
  stopDesktopGuard();
});
```

Replace with:

```ts
win.on('closed', () => {
  diag('evt: closed');
  stopDesktopGuard();
  if (desktopWidgetWindow && !desktopWidgetWindow.isDestroyed()) {
    desktopWidgetWindow.close();
  }
});
```

- [ ] **Step 2: Update `before-quit` cleanup**

Find:

```ts
if (mainWindow && !mainWindow.isDestroyed() && windowMode === 'desktop') {
  clearDesktopOwner(mainWindow);
}
```

Replace with:

```ts
if (mainWindow && !mainWindow.isDestroyed()) {
  clearDesktopOwner(mainWindow);
}
if (desktopWidgetWindow && !desktopWidgetWindow.isDestroyed()) {
  clearDesktopOwner(desktopWidgetWindow);
}
```

- [ ] **Step 3: Run typecheck**

Run from `app/`:

```bash
npm run typecheck
```

Expected: no TypeScript errors.

---

### Task 5: Manual verification

**Files:**
- No code changes unless verification fails.

- [ ] **Step 1: Start the app**

Run from `app/`:

```bash
npm run dev
```

Expected: app opens normally.

- [ ] **Step 2: Verify desktop mode entry**

Use tray menu: enable `钉在桌面（组件模式）`.

Expected:
- Main window remains usable.
- Desktop widget window appears in the same location.
- No crash in `data/diag.log`.

- [ ] **Step 3: Verify Win+D from desktop**

With no other app in front, press `Win+D` twice.

Expected:
- Desktop widget remains visible on desktop.
- Main window may hide or lose foreground normally.
- No flickering loop.

- [ ] **Step 4: Verify Win+D with another app**

Open Notepad or File Explorer. Press `Win+D`.

Expected:
- Other app disappears.
- Desktop widget remains visible.

Press `Win+D` again.

Expected:
- Other app returns.
- Main interactive window does not force itself above the app.
- Desktop widget does not cover the returned app.

- [ ] **Step 5: Verify widget click opens interaction**

Click the desktop widget.

Expected:
- Main window opens/focuses for interaction.
- Switching back to another app causes main window to behave like a normal window.

- [ ] **Step 6: Verify exit desktop mode**

Disable `钉在桌面（组件模式）`.

Expected:
- Desktop widget hides.
- Main window returns to normal mode.
- Win+D no longer relies on widget behavior.

---

## Self-Review

**Spec coverage:** This plan implements the approved dual-window pseudo desktop component: a separate desktop-owned display window plus a normal interactive main window.

**Placeholder scan:** No TBD/TODO placeholders remain. Each task includes exact file paths and code snippets.

**Type consistency:** The plan uses existing Electron types and existing helpers (`applyDesktopOwner`, `clearDesktopOwner`, `loadRenderer`, `showMainWindow`) consistently.
