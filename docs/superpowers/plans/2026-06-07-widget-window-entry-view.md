# Widget Window Entry and View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the desktop widget window open from the tray and render a compact, useful widget view with date switching, progress, quick add, and direct completion.

**Architecture:** Keep one Vite/React bundle and route at runtime by `view` query: `main` renders the existing `App`, `widget` renders a new focused `WidgetApp`. Extend the Electron main process with a tray entry and independent widget bounds persistence, and keep widget data logic in small pure helpers so behavior is verifiable without launching Electron.

**Tech Stack:** Electron, React 18, TypeScript, electron-vite, tsx verification scripts, existing `useTasks` hook and `electronAPI` preload bridge

---

## File Map

- Modify: `app/electron/main.ts`
  - Add tray entry for `打开桌面组件`.
  - Add widget-specific bounds key/defaults.
  - Persist widget bounds separately from `WINDOW_STATE_KEY`.
  - Show/focus existing widget window instead of creating duplicates.
- Modify: `app/shared/rendererRoute.ts`
  - Add renderer-side view parsing helper that defaults invalid/missing views to `main`.
- Modify: `app/scripts/verify-renderer-route.ts`
  - Verify renderer view parsing.
- Modify: `app/scripts/verify-main-window-structure.ts`
  - Verify tray entry, widget bounds key, widget resizable behavior, and widget route structure.
- Create: `app/src/widgetModel.ts`
  - Pure helpers for widget date shifting, task filtering, progress, visible unfinished tasks, remaining count, and quick-add normalization.
- Create: `app/scripts/verify-widget-model.ts`
  - Fast assertions for widget model behavior.
- Modify: `app/src/hooks/useTasks.ts`
  - Allow `addTask` to accept an optional task date so widget-local date can add tasks without changing the main selected date.
- Create: `app/src/WidgetApp.tsx`
  - Compact widget UI shell.
- Modify: `app/src/main.tsx`
  - Route between `App` and `WidgetApp` based on `view` query.
- Modify: `app/src/styles/globals.css`
  - Add focused widget styles.
- Modify: `app/package.json`
  - Add `verify:widget-model` and include it in widget/RC verification.

## Task 1: Renderer Route Parsing

**Files:**
- Modify: `app/shared/rendererRoute.ts`
- Modify: `app/scripts/verify-renderer-route.ts`

- [ ] **Step 1: Add failing renderer view parsing assertions**

Append these assertions to `app/scripts/verify-renderer-route.ts` before the final `console.log`:

```ts
import {
  resolveRendererView,
} from '../shared/rendererRoute';

assert.equal(resolveRendererView(''), 'main');
assert.equal(resolveRendererView('?view=main'), 'main');
assert.equal(resolveRendererView('?view=widget'), 'widget');
assert.equal(resolveRendererView('?view=unknown'), 'main');
assert.equal(resolveRendererView('http://localhost:5173/?view=widget'), 'widget');
assert.equal(resolveRendererView('not a url'), 'main');
```

If import ordering becomes invalid because `resolveRendererView` is imported separately, combine it into the existing import block so the top of the file becomes:

```ts
import assert from 'node:assert/strict';
import {
  buildRendererQuery,
  buildDevRendererUrl,
  resolveRendererView,
  type RendererView,
} from '../shared/rendererRoute';
```

- [ ] **Step 2: Run the route verification and confirm it fails**

Run from `app/`:

```bash
npm run verify:renderer-route
```

Expected: FAIL with an error that `resolveRendererView` is not exported.

- [ ] **Step 3: Implement `resolveRendererView`**

Add this function to `app/shared/rendererRoute.ts` after `buildDevRendererUrl`:

```ts
export function resolveRendererView(value: string): RendererView {
  try {
    const params = value.startsWith('?')
      ? new URLSearchParams(value)
      : new URL(value).searchParams;
    const view = params.get('view') || 'main';
    return isRendererView(view) ? view : 'main';
  } catch {
    return 'main';
  }
}
```

- [ ] **Step 4: Run route verification and confirm it passes**

Run from `app/`:

```bash
npm run verify:renderer-route
```

Expected: PASS with `renderer-route verification passed`.

- [ ] **Step 5: Commit route parsing**

```bash
git add app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts
git commit -m "feat: resolve renderer view from route"
```

## Task 2: Widget Model Helpers

**Files:**
- Create: `app/src/widgetModel.ts`
- Create: `app/scripts/verify-widget-model.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write failing widget model verification**

Create `app/scripts/verify-widget-model.ts`:

```ts
import assert from 'node:assert/strict';
import {
  buildWidgetSummary,
  getTodayDateKey,
  normalizeQuickAddText,
  shiftWidgetDate,
} from '../src/widgetModel';
import { Task } from '../src/types/task';

const tasks: Task[] = [
  { id: '1', text: 'Write report', completed: false, priority: 'high', createdAt: '2026-06-07T08:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '2', text: 'Review widget design', completed: false, priority: 'medium', createdAt: '2026-06-07T09:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '3', text: 'Plan tomorrow', completed: false, priority: 'low', createdAt: '2026-06-07T10:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '4', text: 'Read notes', completed: false, priority: 'medium', createdAt: '2026-06-07T11:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '5', text: 'Done task', completed: true, priority: 'medium', createdAt: '2026-06-07T12:00:00.000Z', taskDate: '2026-06-07', isToday: true },
  { id: '6', text: 'Yesterday task', completed: false, priority: 'medium', createdAt: '2026-06-06T12:00:00.000Z', taskDate: '2026-06-06', isToday: false },
  { id: '7', text: 'Cleared task', completed: false, priority: 'medium', createdAt: '2026-06-07T13:00:00.000Z', taskDate: '2026-06-07', isToday: true, cleared: true },
];

const summary = buildWidgetSummary(tasks, '2026-06-07');
assert.equal(summary.totalCount, 5);
assert.equal(summary.completedCount, 1);
assert.equal(summary.percent, 20);
assert.deepEqual(summary.visibleTasks.map((task) => task.id), ['1', '2', '3']);
assert.equal(summary.remainingUnfinishedCount, 1);

const emptySummary = buildWidgetSummary(tasks, '2026-06-08');
assert.equal(emptySummary.totalCount, 0);
assert.equal(emptySummary.completedCount, 0);
assert.equal(emptySummary.percent, 0);
assert.equal(emptySummary.visibleTasks.length, 0);
assert.equal(emptySummary.remainingUnfinishedCount, 0);

assert.equal(shiftWidgetDate('2026-06-07', -1), '2026-06-06');
assert.equal(shiftWidgetDate('2026-06-07', 1), '2026-06-08');
assert.equal(normalizeQuickAddText('  ship widget  '), 'ship widget');
assert.equal(normalizeQuickAddText('   '), '');
assert.match(getTodayDateKey(), /^\d{4}-\d{2}-\d{2}$/);

console.log('widget-model verification passed');
```

- [ ] **Step 2: Register verification script**

In `app/package.json`, add:

```json
"verify:widget-model": "tsx scripts/verify-widget-model.ts",
```

Place it near `verify:renderer-route` and update `verify:widget-structure` to:

```json
"verify:widget-structure": "npm run verify:renderer-route && npm run verify:widget-model && npm run verify:main-window-structure",
```

Also add `npm run verify:widget-model` to `verify:rc` before `verify:main-window-structure`.

- [ ] **Step 3: Run model verification and confirm it fails**

Run from `app/`:

```bash
npm run verify:widget-model
```

Expected: FAIL with module-not-found for `../src/widgetModel`.

- [ ] **Step 4: Implement widget model helpers**

Create `app/src/widgetModel.ts`:

```ts
import { Task } from './types/task';

export const WIDGET_VISIBLE_TASK_LIMIT = 3;

function getTaskDate(task: Task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || getTodayDateKey();
}

export function getTodayDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function shiftWidgetDate(date: string, days: number) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return getTodayDateKey(next);
}

export function normalizeQuickAddText(value: string) {
  return value.trim();
}

export function buildWidgetSummary(tasks: Task[], selectedDate: string) {
  const dateTasks = tasks.filter((task) => getTaskDate(task) === selectedDate && !task.cleared);
  const unfinishedTasks = dateTasks.filter((task) => !task.completed);
  const visibleTasks = unfinishedTasks.slice(0, WIDGET_VISIBLE_TASK_LIMIT);
  const completedCount = dateTasks.filter((task) => task.completed).length;
  const totalCount = dateTasks.length;
  const percent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  return {
    selectedDate,
    totalCount,
    completedCount,
    percent,
    visibleTasks,
    remainingUnfinishedCount: Math.max(0, unfinishedTasks.length - visibleTasks.length),
  };
}
```

- [ ] **Step 5: Run widget model verification and confirm it passes**

Run from `app/`:

```bash
npm run verify:widget-model
```

Expected: PASS with `widget-model verification passed`.

- [ ] **Step 6: Commit widget model helpers**

```bash
git add app/src/widgetModel.ts app/scripts/verify-widget-model.ts app/package.json
git commit -m "feat: add widget task summary model"
```

## Task 3: Main-Process Widget Entry and Bounds

**Files:**
- Modify: `app/electron/main.ts`
- Modify: `app/scripts/verify-main-window-structure.ts`

- [ ] **Step 1: Add failing main-window structure assertions**

Append these assertions to `app/scripts/verify-main-window-structure.ts` before the final `console.log`:

```ts
assert.equal(source.includes("const DESKTOP_WIDGET_WINDOW_STATE_KEY = 'desktopWidgetWindowState'"), true, 'widget should use a separate bounds key');
assert.equal(source.includes("label: zh('打开桌面组件')"), true, 'tray should include a widget entry');
assert.equal(source.includes('showDesktopWidgetWindow'), true, 'tray entry should use showDesktopWidgetWindow helper');
assert.equal(/function getInitialDesktopWidgetBounds\(\)/.test(source), true, 'widget should have dedicated initial bounds helper');
assert.equal(/function persistDesktopWidgetWindowState\(win: BrowserWindow\)/.test(source), true, 'widget should persist its own bounds');
assert.equal(/resizable:\s*true/.test(source), true, 'widget window should be resizable');
```

- [ ] **Step 2: Run structure verification and confirm it fails**

Run from `app/`:

```bash
npm run verify:main-window-structure
```

Expected: FAIL on the missing widget bounds key or tray entry assertion.

- [ ] **Step 3: Add widget bounds constants and helper functions**

In `app/electron/main.ts`, near the existing window state constants, add:

```ts
const DESKTOP_WIDGET_WINDOW_STATE_KEY = 'desktopWidgetWindowState';
const DEFAULT_WIDGET_WINDOW_WIDTH = 300;
const DEFAULT_WIDGET_WINDOW_HEIGHT = 420;
const MIN_WIDGET_WINDOW_WIDTH = 260;
const MIN_WIDGET_WINDOW_HEIGHT = 320;
let widgetPersistTimer: NodeJS.Timeout | null = null;
```

After `getInitialBounds()`, add:

```ts
function getInitialDesktopWidgetBounds() {
  const saved = store.get(DESKTOP_WIDGET_WINDOW_STATE_KEY) as WindowState | undefined;
  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.max(MIN_WIDGET_WINDOW_WIDTH, saved?.width || DEFAULT_WIDGET_WINDOW_WIDTH);
  const height = Math.max(MIN_WIDGET_WINDOW_HEIGHT, saved?.height || DEFAULT_WIDGET_WINDOW_HEIGHT);
  const x = saved?.x ?? workArea.x + workArea.width - width - 30;
  const y = saved?.y ?? workArea.y + 96;
  return { width, height, x, y };
}

function persistDesktopWidgetWindowState(win: BrowserWindow) {
  if (widgetPersistTimer) clearTimeout(widgetPersistTimer);
  widgetPersistTimer = setTimeout(() => {
    if (win.isDestroyed() || win.isMinimized()) return;
    store.set(DESKTOP_WIDGET_WINDOW_STATE_KEY, win.getBounds());
  }, 250);
}
```

- [ ] **Step 4: Update widget window creation and show helper**

Change `createDesktopWidgetWindow()` so its BrowserWindow options use widget bounds/mins:

```ts
  const widgetWindow = new BrowserWindow({
    ...getInitialDesktopWidgetBounds(),
    minWidth: MIN_WIDGET_WINDOW_WIDTH,
    minHeight: MIN_WIDGET_WINDOW_HEIGHT,
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
```

After `loadRenderer(widgetWindow, { view: 'widget' });`, add:

```ts
  widgetWindow.once('ready-to-show', () => {
    widgetWindow.show();
  });
  widgetWindow.on('move', () => persistDesktopWidgetWindowState(widgetWindow));
  widgetWindow.on('resize', () => persistDesktopWidgetWindowState(widgetWindow));
  widgetWindow.on('close', () => persistDesktopWidgetWindowState(widgetWindow));
```

Add this helper above `refreshTrayMenu()`:

```ts
function showDesktopWidgetWindow() {
  const widgetWindow = createDesktopWidgetWindow();
  if (widgetWindow.isMinimized()) widgetWindow.restore();
  widgetWindow.show();
  widgetWindow.focus();
}
```

- [ ] **Step 5: Add tray menu entry**

In `refreshTrayMenu()`, add this item after `打开 DailyTodo`:

```ts
      { label: zh('打开桌面组件'), click: showDesktopWidgetWindow },
```

- [ ] **Step 6: Run structure verification and confirm it passes**

Run from `app/`:

```bash
npm run verify:main-window-structure
```

Expected: PASS with `main-window structure verification passed`.

- [ ] **Step 7: Commit main-process widget entry**

```bash
git add app/electron/main.ts app/scripts/verify-main-window-structure.ts
git commit -m "feat: add tray entry for desktop widget"
```

## Task 4: Widget Rendering Shell

**Files:**
- Modify: `app/src/main.tsx`
- Create: `app/src/WidgetApp.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Create initial `WidgetApp` component**

Create `app/src/WidgetApp.tsx`:

```tsx
import { FormEvent, useState } from 'react';
import { useTasks } from './hooks/useTasks';
import {
  buildWidgetSummary,
  getTodayDateKey,
  normalizeQuickAddText,
  shiftWidgetDate,
} from './widgetModel';

export function WidgetApp() {
  const {
    allTasks,
    addTask,
    toggleTask,
    isLoaded,
  } = useTasks();
  const [selectedDate, setSelectedDate] = useState(getTodayDateKey());
  const [draft, setDraft] = useState('');
  const summary = buildWidgetSummary(allTasks, selectedDate);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const text = normalizeQuickAddText(draft);
    if (!text) return;
    addTask(text, 'medium', selectedDate);
    setDraft('');
  };

  return (
    <div className="widget-viewport">
      <section className="widget-card">
        <header className="widget-header titlebar-drag">
          <div>
            <p className="widget-kicker">DailyTodo</p>
            <h1>桌面组件</h1>
          </div>
          <div className="widget-progress" aria-label={`完成 ${summary.completedCount}/${summary.totalCount}`}>
            <strong>{summary.completedCount}/{summary.totalCount}</strong>
            <span>{summary.percent}%</span>
          </div>
        </header>

        <div className="widget-date-row titlebar-no-drag">
          <button type="button" onClick={() => setSelectedDate((date) => shiftWidgetDate(date, -1))} aria-label="前一天">‹</button>
          <span>{selectedDate === getTodayDateKey() ? '今天' : selectedDate}</span>
          <button type="button" onClick={() => setSelectedDate((date) => shiftWidgetDate(date, 1))} aria-label="后一天">›</button>
        </div>

        <div className="widget-progress-bar" aria-hidden="true">
          <span style={{ width: `${summary.percent}%` }} />
        </div>

        <main className="widget-task-list titlebar-no-drag">
          {!isLoaded ? (
            <p className="widget-empty">正在加载任务...</p>
          ) : summary.visibleTasks.length ? (
            <>
              {summary.visibleTasks.map((task) => (
                <button key={task.id} type="button" className="widget-task" onClick={() => toggleTask(task.id)}>
                  <span className="widget-task-circle" />
                  <span>{task.text}</span>
                </button>
              ))}
              {summary.remainingUnfinishedCount > 0 && (
                <p className="widget-more">+ 还有 {summary.remainingUnfinishedCount} 项未完成</p>
              )}
            </>
          ) : (
            <p className="widget-empty">今天清空了，继续保持。</p>
          )}
        </main>

        <form className="widget-add titlebar-no-drag" onSubmit={handleSubmit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="+ 添加一个任务..."
            aria-label="添加任务"
          />
          <button type="submit">↵</button>
        </form>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Update `useTasks.addTask` signature for widget date**

In `app/src/hooks/useTasks.ts`, replace the `addTask` callback with:

```ts
  const addTask = useCallback((text: string, priority: Task['priority'] = 'medium', taskDate = selectedDate) => {
    const newTask: Task = {
      id: uuidv4(),
      text,
      completed: false,
      priority,
      createdAt: new Date().toISOString(),
      taskDate,
      isToday: taskDate === currentDate,
    };
    setAllTasks((prev) => [newTask, ...prev]);
  }, [currentDate, selectedDate]);
```

Existing callers with two arguments continue to work.

- [ ] **Step 3: Route root rendering in `main.tsx`**

Replace `app/src/main.tsx` with:

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WidgetApp } from './WidgetApp';
import { resolveRendererView } from '../shared/rendererRoute';
import './styles/globals.css';

const view = resolveRendererView(window.location.href);
const Root = view === 'widget' ? WidgetApp : App;

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
```

- [ ] **Step 4: Add widget styles**

Append to `app/src/styles/globals.css`:

```css
.widget-viewport {
  width: 100vw;
  height: 100vh;
  padding: 10px;
  overflow: hidden;
  background: transparent;
}

.widget-card {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(39, 39, 42, 0.1);
  border-radius: var(--shell-radius);
  background: rgba(255, 255, 255, var(--window-opacity));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.82), 0 10px 26px rgba(31, 41, 55, 0.12);
  color: #27272a;
  backdrop-filter: blur(var(--blur-strength));
  -webkit-backdrop-filter: blur(var(--blur-strength));
}

.dark .widget-card {
  border-color: rgba(148, 163, 184, 0.2);
  background: rgba(15, 23, 42, var(--window-opacity));
  color: #e5e7eb;
}

.widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 14px 14px 8px;
}

.widget-kicker {
  color: var(--personal-accent);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.widget-header h1 {
  margin-top: 2px;
  font-family: 'Playfair Display', serif;
  font-size: 1.15rem;
  font-weight: 700;
}

.widget-progress {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  font-size: 0.72rem;
  color: rgba(39, 39, 42, 0.62);
}

.widget-progress strong {
  color: var(--personal-accent);
  font-size: 0.95rem;
}

.widget-date-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 0 14px 10px;
  color: rgba(39, 39, 42, 0.72);
  font-size: 0.82rem;
  font-weight: 600;
}

.widget-date-row button {
  width: 26px;
  height: 24px;
  border: 1px solid rgba(39, 39, 42, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.5);
  color: inherit;
}

.widget-progress-bar {
  height: 4px;
  margin: 0 14px 8px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(45, 74, 62, 0.12);
}

.widget-progress-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--personal-accent);
}

.widget-task-list {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
  padding: 8px 12px;
}

.widget-task {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  border: 0;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.42);
  padding: 9px 10px;
  color: inherit;
  text-align: left;
  font-size: 0.86rem;
}

.widget-task-circle {
  width: 15px;
  height: 15px;
  flex: 0 0 auto;
  border: 1.8px solid var(--personal-accent);
  border-radius: 999px;
}

.widget-more,
.widget-empty {
  padding: 8px 4px;
  color: rgba(39, 39, 42, 0.56);
  font-size: 0.8rem;
  text-align: center;
}

.widget-add {
  display: flex;
  gap: 8px;
  border-top: 1px solid rgba(39, 39, 42, 0.08);
  padding: 10px 12px 12px;
}

.widget-add input {
  min-width: 0;
  flex: 1;
  border: 1px solid rgba(39, 39, 42, 0.1);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.52);
  padding: 8px 11px;
  color: inherit;
  outline: none;
}

.widget-add button {
  width: 34px;
  border: 0;
  border-radius: 999px;
  background: var(--personal-accent);
  color: white;
  font-weight: 700;
}

.dark .widget-progress,
.dark .widget-date-row,
.dark .widget-more,
.dark .widget-empty {
  color: rgba(226, 232, 240, 0.68);
}

.dark .widget-task,
.dark .widget-add input,
.dark .widget-date-row button {
  border-color: rgba(148, 163, 184, 0.16);
  background: rgba(15, 23, 42, 0.44);
}
```

- [ ] **Step 5: Run renderer/model verification**

Run from `app/`:

```bash
npm run verify:renderer-route
npm run verify:widget-model
```

Expected: both PASS.

- [ ] **Step 6: Commit widget rendering shell**

```bash
git add app/src/main.tsx app/src/WidgetApp.tsx app/src/hooks/useTasks.ts app/src/styles/globals.css
git commit -m "feat: render compact widget view"
```

## Task 5: Final Verification and Review

**Files:**
- Verify: `app/electron/main.ts`
- Verify: `app/src/WidgetApp.tsx`
- Verify: `app/src/widgetModel.ts`
- Verify: `app/shared/rendererRoute.ts`
- Verify: `app/package.json`

- [ ] **Step 1: Run widget verification**

Run from `app/`:

```bash
npm run verify:widget-structure
```

Expected: PASS with:

```text
renderer-route verification passed
widget-model verification passed
main-window structure verification passed
```

- [ ] **Step 2: Run existing window-mode verification**

Run from `app/`:

```bash
npm run verify:window-mode
```

Expected: PASS with `windowMode.verify: all assertions passed`.

- [ ] **Step 3: Run production build**

Run from `app/`:

```bash
npm run build
```

Expected: PASS. The existing Vite browser-compatibility warning about `path` in `shared/obsidianTemplates.ts` may appear; it is not a blocker if the build exits successfully.

- [ ] **Step 4: Review final diff**

Run:

```bash
git diff -- app/electron/main.ts app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts app/scripts/verify-main-window-structure.ts app/scripts/verify-widget-model.ts app/src/widgetModel.ts app/src/main.tsx app/src/WidgetApp.tsx app/src/hooks/useTasks.ts app/src/styles/globals.css app/package.json
```

Expected: diff shows only tray/widget entry, widget route selection, widget model/UI, verification scripts, and package scripts.

- [ ] **Step 5: Commit verification completion**

```bash
git add app/electron/main.ts app/shared/rendererRoute.ts app/scripts/verify-renderer-route.ts app/scripts/verify-main-window-structure.ts app/scripts/verify-widget-model.ts app/src/widgetModel.ts app/src/main.tsx app/src/WidgetApp.tsx app/src/hooks/useTasks.ts app/src/styles/globals.css app/package.json
git commit -m "test: verify desktop widget window view"
```

## Self-Review Notes

- Spec coverage: this plan covers tray entry, reachable widget window path, independent bounds persistence, widget route rendering, compact card UI, date switching, top unfinished tasks, quick add, direct completion, and focused verification.
- Placeholder scan: no placeholder steps remain; each code change has concrete code and each verification has exact commands and expected outcomes.
- Type consistency: `RendererView`, `resolveRendererView`, `WidgetApp`, `buildWidgetSummary`, `shiftWidgetDate`, and `addTask(text, priority, taskDate)` are named consistently across tasks.
