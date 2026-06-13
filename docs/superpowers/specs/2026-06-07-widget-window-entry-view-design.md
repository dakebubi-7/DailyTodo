# 2026-06-07 Widget Window Entry and View Design

## Goal

Build the first usable desktop widget window on top of the existing dual-window main-process skeleton.

The widget should be a lightweight DailyTodo companion window that can be opened from the tray, shows a compact daily task summary, supports quick task entry, and lets the user complete tasks without opening the full main window.

## Scope

In scope:

- Add a tray-menu entry to open the desktop widget window.
- Make the existing `createDesktopWidgetWindow()` path reachable.
- Persist the widget window's own size and position separately from the main window.
- Render a dedicated `widget` React view when the renderer route is `view=widget`.
- Keep the main app view unchanged when the route is `view=main` or missing.
- Implement a compact widget UI with:
  - current date progress
  - date switching
  - up to three unfinished tasks for the selected date
  - remaining unfinished-task count
  - quick add
  - direct task completion
- Add focused verification for route/view selection, widget data behavior, tray/window structure, and build safety.

Out of scope:

- Full task editing in the widget.
- Task deletion in the widget.
- Priority changes in the widget.
- Main-window button for opening the widget.
- Auto-opening the widget on app startup.
- Splitting the renderer into separate Vite entry points.
- Complex cross-window synchronization of selected dates.

## User Decisions

- Widget content: combination view with progress, top unfinished tasks, and quick add.
- Widget task operations: quick add and direct completion only.
- Widget entry point: tray menu only.
- Widget sizing: resizable, with size and position restored on next open.
- Widget close behavior: closing destroys the window after persisting bounds.
- Widget date behavior: default to today, with date switching inside the widget.
- Visual direction: compact card layout.

## Recommended Approach

Use a dedicated renderer shell for the widget while keeping the same Vite/React bundle.

The renderer root should inspect the route query:

- `view=main` or no route: render the current main `App`.
- `view=widget`: render a new `WidgetApp`.

This keeps the main app and widget UI separate while allowing both to reuse the existing task data layer and Electron preload API.

Alternatives considered:

1. Put widget conditional rendering inside `App.tsx`.
   - This is the smallest change but would make an already large component harder to maintain.
2. Ship only a tray entry and placeholder widget shell.
   - This is low risk but does not deliver a useful first widget.
3. Split into separate renderer entry points immediately.
   - This gives a strong boundary but is more infrastructure than the first widget needs.

## Main-Process Design

### Tray Entry

The tray menu should include a new item:

- `打开桌面组件`

Clicking it should call a helper such as `showDesktopWidgetWindow()`.

Expected behavior:

- If `desktopWidgetWindow` exists and is not destroyed:
  - restore it if minimized
  - show it
  - focus it
- If it does not exist:
  - create it through `createDesktopWidgetWindow()`
  - show it when ready

The existing main-window tray entries should remain unchanged.

### Widget Bounds

The widget must not reuse `WINDOW_STATE_KEY`, because that belongs to the main window.

Add a separate key, for example:

- `desktopWidgetWindowState`

The widget window should use default bounds when no saved bounds exist:

- width: `300`
- height: `420`
- positioned near the right side of the primary work area

When the widget moves or resizes, persist its bounds with a small debounce or the same simple persistence pattern used by the main window. Closing the widget should also ensure the latest non-minimized bounds are saved.

Bounds validation should be conservative:

- width should not fall below the widget minimum width
- height should not fall below the widget minimum height
- missing or invalid saved values should fall back to defaults

### Widget Window Lifecycle

`createDesktopWidgetWindow()` should create a real resizable widget window:

- `show: false`
- `resizable: true`
- transparent, frameless, using the existing preload
- route: `{ view: 'widget' }`

The widget should close for real, not hide. On `closed`, set `desktopWidgetWindow = null`.

This round should not auto-open the widget on app startup.

## Renderer Design

### Route Selection

Add a small renderer-side route helper that reads the current browser URL and returns the active view.

Rules:

- `view=widget` returns `widget`.
- `view=main` returns `main`.
- missing, unknown, or malformed values return `main`.

This helper should be pure enough to verify without rendering the full app.

### Root Rendering

`app/src/main.tsx` should choose the root component based on the renderer view:

- `main`: current `App`
- `widget`: new `WidgetApp`

The existing main app should remain the default to avoid breaking current startup behavior.

### Widget Component

Create a dedicated widget component, for example:

- `app/src/WidgetApp.tsx`
- optional focused children under `app/src/components/Widget*`

The first widget UI should use a compact card structure:

```text
┌────────────────────────────┐
│  DailyTodo        6/10 60% │
│  今天  2026-06-07   ‹  ›   │
├────────────────────────────┤
│  ○ 写日报                  │
│  ○ 复盘 widget 设计        │
│  ○ 整理明日任务            │
│  + 还有 2 项未完成         │
├────────────────────────────┤
│  + 添加一个任务...      ↵  │
└────────────────────────────┘
```

Behavior:

- Default selected date is today.
- Previous/next controls change the widget's local selected date.
- The widget shows progress for the selected date.
- The task list shows unfinished tasks for the selected date.
- Show at most three unfinished tasks.
- If more unfinished tasks exist, show `+ 还有 N 项未完成`.
- Clicking a task circle completes that task.
- The add input creates a task on the widget's selected date.
- Empty or whitespace-only input is ignored.
- If there are no unfinished tasks, show a friendly empty state such as `今天清空了，继续保持。`.

### Data Flow

The widget should reuse existing task data behavior rather than creating a separate store.

Expected flow:

1. `WidgetApp` calls the existing task hook or a small extracted shared task hook API.
2. It tracks its own local `selectedDate`, initialized to today.
3. It filters tasks to that date.
4. It computes completed count, total count, percentage, and unfinished tasks.
5. Quick add calls the existing add-task behavior with the widget selected date.
6. Complete calls the existing task-completion behavior appropriate for a lightweight widget.

If the current completion flow requires a review dialog in the main app, the widget should use the simplest existing direct-completion path available. The widget must not open the full completion review flow in this first version.

## Styling Design

The widget should reuse the app's existing visual language:

- transparent background
- rounded card feel
- existing light/dark support where practical
- compact spacing
- no tabs, settings panel, review view, or Obsidian controls

The widget should be readable at its default size and remain usable when resized larger.

## Error Handling

- If task data is still loading, show a lightweight loading state.
- If quick-add input is blank, do nothing.
- If saved widget bounds are missing or invalid, use default bounds.
- If the renderer load fails, keep using existing Electron diagnostics such as `did-fail-load` and `preload-error`.
- If the widget window already exists, opening from tray should not create a duplicate.

## Verification Strategy

Add focused verification rather than relying only on manual checks.

Recommended verification units:

1. Renderer route helper:
   - missing route defaults to `main`
   - `view=main` returns `main`
   - `view=widget` returns `widget`
   - unknown values return `main`

2. Widget data/model helper:
   - filters tasks by selected date
   - computes completed count and total count
   - returns up to three unfinished tasks
   - computes remaining unfinished count
   - ignores blank quick-add text before calling add behavior

3. Main-process structure verification:
   - tray menu includes `打开桌面组件`
   - widget route load remains `{ view: 'widget' }`
   - widget bounds key is separate from `WINDOW_STATE_KEY`
   - widget window is resizable
   - widget close path clears `desktopWidgetWindow`

4. Final verification:
   - widget-specific verification scripts
   - existing `verify:window-mode`
   - production build

## Success Criteria

The implementation is complete when:

- The tray has an `打开桌面组件` entry.
- The tray entry opens the widget window.
- Re-clicking the tray entry focuses the existing widget instead of opening duplicates.
- The widget restores its previous size and position after being closed and reopened.
- The widget displays the compact card layout for the selected date.
- The widget can switch dates locally.
- The widget can add tasks for its selected date.
- The widget can complete visible tasks.
- The main window still opens and behaves as before.
- Verification scripts and build pass.
