# Desktop Widget Dual-Window Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Electron main-process window structure explicitly dual-window-ready, unify renderer loading across dev/prod with structured view parameters, and remove the current review findings without shipping the full widget feature.

**Architecture:** Extract renderer-view/query construction into a small pure helper module, then refactor `main.ts` to use that helper for both main-window and future widget-window loading. Keep the widget window as a real lifecycle slot with a clear creation path, but limit this round to main-process structure and verification.

**Tech Stack:** Electron, TypeScript, electron-vite, tsx verification scripts, existing custom assertion-style verify scripts

---

## File Map

- Modify: `app/electron/main.ts`
  - Keep ownership of Electron app lifecycle, window creation, tray integration, and desktop-mode behavior.
  - Replace raw-string renderer loading with structured view-based loading.
  - Consolidate duplicate `minimize` handlers.
  - Introduce an intentional widget-window creation path and lifecycle cleanup.
- Create: `app/shared/rendererRoute.ts`
  - Pure, testable view/query helpers shared by main-process code and any future renderer consumers.
  - Define the allowed renderer views and deterministic query building.
- Create: `app/scripts/verify-renderer-route.ts`
  - Fast assertion script for the new pure routing helper.
- Modify: `app/package.json`
  - Register the new verification script.

## Task 1: Add a pure renderer-route helper with failing verification first

**Files:**
- Create: `app/shared/rendererRoute.ts`
- Create: `app/scripts/verify-renderer-route.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-renderer-route.ts` with this content:

```ts
import assert from 'node:assert/strict';
import {
  buildRendererQuery,
  buildDevRendererUrl,
  type RendererView,
} from '../shared/rendererRoute';

const mainQuery = buildRendererQuery({ view: 'main' });
assert.deepEqual(mainQuery, { view: 'main' });

const widgetQuery = buildRendererQuery({
  view: 'widget',
  params: {
    mode: 'compact',
    source: 'tray',
  },
});
assert.deepEqual(widgetQuery, {
  view: 'widget',
  mode: 'compact',
  source: 'tray',
});

const devMainUrl = buildDevRendererUrl('http://127.0.0.1:5173', { view: 'main' });
assert.equal(devMainUrl, 'http://127.0.0.1:5173/?view=main');

const devWidgetUrl = buildDevRendererUrl('http://127.0.0.1:5173', {
  view: 'widget',
  params: {
    mode: 'compact',
  },
});
assert.equal(devWidgetUrl, 'http://127.0.0.1:5173/?view=widget&mode=compact');

const devUrlWithExistingSearch = buildDevRendererUrl('http://127.0.0.1:5173/?dev=1', {
  view: 'widget',
  params: {
    mode: 'compact',
  },
});
assert.equal(devUrlWithExistingSearch, 'http://127.0.0.1:5173/?dev=1&view=widget&mode=compact');

assert.throws(
  () => buildRendererQuery({ view: 'invalid' as RendererView }),
  /Unsupported renderer view: invalid/
);

console.log('renderer-route verification passed');
```

- [ ] **Step 2: Register the verification command**

Add this script entry in `app/package.json` under `scripts` near the other `verify:*` commands:

```json
"verify:renderer-route": "tsx scripts/verify-renderer-route.ts",
```

Expected placement:

```json
"verify:window-mode": "tsx electron/windowMode.verify.ts",
"verify:renderer-route": "tsx scripts/verify-renderer-route.ts",
"verify:settings-sync": "tsx scripts/verify-settings-sync.ts",
```

- [ ] **Step 3: Run the new verification to confirm it fails**

Run:

```bash
npm run verify:renderer-route
```

Expected: fail with a module-not-found error for `../shared/rendererRoute`.

- [ ] **Step 4: Implement the pure helper minimally**

Create `app/shared/rendererRoute.ts` with this content:

```ts
export type RendererView = 'main' | 'widget';

export type RendererRoute = {
  view: RendererView;
  params?: Record<string, string>;
};

function isRendererView(value: string): value is RendererView {
  return value === 'main' || value === 'widget';
}

export function buildRendererQuery(route: RendererRoute): Record<string, string> {
  if (!isRendererView(route.view)) {
    throw new Error(`Unsupported renderer view: ${String(route.view)}`);
  }

  return {
    view: route.view,
    ...(route.params || {}),
  };
}

export function buildDevRendererUrl(baseUrl: string, route: RendererRoute): string {
  const url = new URL(baseUrl);
  const query = buildRendererQuery(route);

  Object.entries(query).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return url.toString();
}
```

- [ ] **Step 5: Run the verification to confirm it passes**

Run:

```bash
npm run verify:renderer-route
```

Expected: PASS with `renderer-route verification passed`.

- [ ] **Step 6: Commit the helper foundation**

Run:

```bash
git add app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts app/package.json
git commit -m "refactor: add structured renderer route helper"
```

## Task 2: Refactor `main.ts` to use structured renderer routes and an intentional widget-window slot

**Files:**
- Modify: `app/electron/main.ts`
- Reference: `app/shared/rendererRoute.ts`
- Test: `app/scripts/verify-renderer-route.ts`

- [ ] **Step 1: Add a failing assertion for existing main-window load intent**

Extend `app/scripts/verify-renderer-route.ts` by appending this assertion block before the final `console.log`:

```ts
const explicitMainQuery = buildRendererQuery({
  view: 'main',
  params: {
    restored: '1',
  },
});
assert.deepEqual(explicitMainQuery, {
  view: 'main',
  restored: '1',
});
```

This gives the refactor one more concrete contract: callers pass structured params instead of raw query strings.

- [ ] **Step 2: Run the verification to confirm the new assertion still passes before refactoring**

Run:

```bash
npm run verify:renderer-route
```

Expected: PASS. This guards the pure helper before changing `main.ts`.

- [ ] **Step 3: Refactor imports and renderer loading in `app/electron/main.ts`**

Apply these code changes.

1. Add the helper import near the other shared imports:

```ts
import {
  buildDevRendererUrl,
  buildRendererQuery,
  type RendererRoute,
} from '../shared/rendererRoute';
```

2. Replace the existing dead-slot declaration area with an intentional dual-window slot comment:

```ts
let mainWindow: BrowserWindow | null = null;
let desktopWidgetWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
```

3. Replace the old `loadRenderer` helper with this structured version:

```ts
function loadRenderer(win: BrowserWindow, route: RendererRoute) {
  const devServerUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    const url = buildDevRendererUrl(devServerUrl, route);
    diag(`loadURL ${url}`);
    win.loadURL(url);
    return;
  }

  const query = buildRendererQuery(route);
  diag(`loadFile dist/index.html ${JSON.stringify(query)}`);
  win.loadFile(path.join(__dirname, '../dist/index.html'), { query });
}
```

4. Add an explicit widget-window creation path near `createWindow`:

```ts
function createDesktopWidgetWindow() {
  if (desktopWidgetWindow && !desktopWidgetWindow.isDestroyed()) {
    return desktopWidgetWindow;
  }

  const widgetWindow = new BrowserWindow({
    ...getInitialBounds(),
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: 480,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    skipTaskbar: true,
    resizable: true,
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

  desktopWidgetWindow = widgetWindow;
  loadRenderer(widgetWindow, { view: 'widget' });
  widgetWindow.on('closed', () => {
    desktopWidgetWindow = null;
  });

  return widgetWindow;
}
```

5. Update the main-window load call inside `createWindow`:

```ts
loadRenderer(win, { view: 'main' });
```

6. Make the widget slot participate in quit cleanup near the existing main-window cleanup logic:

```ts
app.on('before-quit', () => {
  diag('before-quit');
  isQuitting = true;
  if (mainWindow && !mainWindow.isDestroyed() && windowMode === 'desktop') {
    clearDesktopOwner(mainWindow);
  }
  if (desktopWidgetWindow && !desktopWidgetWindow.isDestroyed()) {
    desktopWidgetWindow.removeAllListeners();
  }
});
```

And inside `window-all-closed`:

```ts
mainWindow = null;
desktopWidgetWindow = null;
```

- [ ] **Step 4: Run the route verification after the refactor**

Run:

```bash
npm run verify:renderer-route
```

Expected: PASS. The shared route semantics must remain stable after `main.ts` switches to the helper.

- [ ] **Step 5: Run a focused build/type check for the main-process refactor**

Run:

```bash
npm run build
```

Expected: PASS. If the full build is too slow or noisy in this environment, use:

```bash
npx tsc --noEmit -p tsconfig.node.json
```

Expected: PASS with no TypeScript errors in `app/electron/main.ts` or `app/shared/rendererRoute.ts`.

- [ ] **Step 6: Commit the dual-window-ready main-process refactor**

Run:

```bash
git add app/electron/main.ts app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts app/package.json
git commit -m "refactor: prepare main process for widget window"
```

## Task 3: Merge duplicate minimize handlers into one tested behavior point

**Files:**
- Modify: `app/electron/main.ts`
- Test: `app/package.json`
- Test: `app/scripts/verify-renderer-route.ts`

- [ ] **Step 1: Add a failing static check for duplicate minimize registrations**

Create `app/scripts/verify-main-window-structure.ts` with this content:

```ts
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const mainPath = path.join(process.cwd(), 'electron', 'main.ts');
const source = fs.readFileSync(mainPath, 'utf-8');
const minimizeRegistrations = source.match(/win\.on\('minimize'/g) || [];
const structuredMainLoad = source.includes("loadRenderer(win, { view: 'main' })");
const widgetLoad = source.includes("loadRenderer(widgetWindow, { view: 'widget' })");

assert.equal(minimizeRegistrations.length, 1, 'main window should register minimize exactly once');
assert.equal(structuredMainLoad, true, 'main window should load the structured main view');
assert.equal(widgetLoad, true, 'widget window creation path should load the structured widget view');

console.log('main-window structure verification passed');
```

- [ ] **Step 2: Register the new verification command**

Add this script entry in `app/package.json`:

```json
"verify:main-window-structure": "tsx scripts/verify-main-window-structure.ts",
```

Expected placement:

```json
"verify:renderer-route": "tsx scripts/verify-renderer-route.ts",
"verify:main-window-structure": "tsx scripts/verify-main-window-structure.ts",
"verify:settings-sync": "tsx scripts/verify-settings-sync.ts",
```

- [ ] **Step 3: Run the verification to confirm it fails before merging handlers**

Run:

```bash
npm run verify:main-window-structure
```

Expected: FAIL with `main window should register minimize exactly once`.

- [ ] **Step 4: Merge the two minimize handlers in `app/electron/main.ts`**

Replace the two separate `win.on('minimize', ...)` blocks with one block:

```ts
  win.on('minimize', () => {
    diag('evt: minimize');
    diag(`  userHidden=${userHidden} windowMode=${windowMode} isVisible=${win.isVisible()}`);

    if (!needsDesktopGuard(windowMode) || isQuitting || win.isDestroyed() || userHidden) return;
    try {
      win.showInactive();
      diag('desktop guard: showInactive after minimize');
    } catch (error) {
      diag(`desktop guard failed: ${String(error)}`);
    }
  });
```

- [ ] **Step 5: Run the structure verification to confirm it passes**

Run:

```bash
npm run verify:main-window-structure
```

Expected: PASS with `main-window structure verification passed`.

- [ ] **Step 6: Re-run the route verification to make sure nothing regressed**

Run:

```bash
npm run verify:renderer-route
```

Expected: PASS.

- [ ] **Step 7: Commit the event-handler cleanup**

Run:

```bash
git add app/electron/main.ts app/scripts/verify-main-window-structure.ts app/package.json
git commit -m "refactor: unify main window minimize handling"
```

## Task 4: Run final verification and document the outcome in git history

**Files:**
- Modify: `app/package.json` (only if you choose to add an aggregate script)
- Verify: `app/scripts/verify-renderer-route.ts`
- Verify: `app/scripts/verify-main-window-structure.ts`
- Verify: `app/electron/main.ts`

- [ ] **Step 1: Add an aggregate verification script**

Add this script entry in `app/package.json`:

```json
"verify:widget-structure": "npm run verify:renderer-route && npm run verify:main-window-structure",
```

Place it with the other verification scripts.

- [ ] **Step 2: Run the aggregate verification**

Run:

```bash
npm run verify:widget-structure
```

Expected: PASS, ending with both verification success messages.

- [ ] **Step 3: Run the existing window-mode verification as a regression check**

Run:

```bash
npm run verify:window-mode
```

Expected: PASS with `windowMode.verify: all assertions passed`.

- [ ] **Step 4: Run the final build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Review the final diff before commit**

Run:

```bash
git diff -- app/electron/main.ts app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts app/scripts/verify-main-window-structure.ts app/package.json
```

Expected: the diff shows only structured renderer routing, an intentional widget-window creation path, a single minimize handler, and verification-script additions.

- [ ] **Step 6: Commit the verification pass**

Run:

```bash
git add app/electron/main.ts app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts app/scripts/verify-main-window-structure.ts app/package.json
git commit -m "test: verify widget window structure refactor"
```

## Self-Review Notes

- Spec coverage: the plan covers explicit dual-window structure, structured renderer loading, explicit `main`/`widget` views, duplicate minimize-handler cleanup, and verification.
- Placeholder scan: no `TODO`/`TBD` placeholders remain in task steps.
- Type consistency: `RendererView`, `RendererRoute`, `buildRendererQuery`, and `buildDevRendererUrl` are introduced once and reused consistently across tasks.
