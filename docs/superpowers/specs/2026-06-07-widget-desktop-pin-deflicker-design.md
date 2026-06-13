# 2026-06-07 Desktop Widget Pin De-flicker Design

## Goal

Make the desktop widget a simple "pin to desktop, covered by apps" companion window that no longer flickers, and remove the abandoned SetParent-into-wallpaper experiment.

This change is scoped to the **desktop widget window only**. The main application window and its own desktop-mode guard are explicitly out of scope and must not be touched.

## Background

The desktop widget (opened from the tray "打开桌面组件") currently uses a three-state desktop guard mirrored from the main window:

- `desktop-visible` — when the desktop shell (`WorkerW` / `Progman`) is foreground, raise the widget to topmost.
- `app-background` — when a real app is foreground, send the widget to the bottom.
- `dt-active` — when the widget itself is foreground, keep it as a normal window.

A 64ms polling timer (`widgetDesktopGuardTimer` → `applyWidgetDesktopTopmost`) reads the foreground window class every tick and drives these transitions.

### Root cause of the flicker

The state machine only acts on state *transitions* (`if (!force && state === nextState) return`), so the poll itself is not redundantly repainting. The flicker comes from genuine oscillation of the foreground window class: when the foreground rapidly alternates between `WorkerW` (desktop) and an app window, `nextState` flips between `desktop-visible` (topmost) and `app-background` (bottom), and each flip runs a real `setTopmost` / `sendToBottom` z-order change.

Switching the poll to an event hook (e.g. `SetWinEventHook(EVENT_SYSTEM_FOREGROUND)`) would fire on the same transitions and flicker just as much. The flicker is inherent to the `desktop-visible` "float up when desktop is foreground" behavior, not to polling.

### Abandoned experiment (to be removed)

An experimental `SetParent`-into-`Progman` path (`embedIntoWallpaper` / `detachFromWallpaper`, `toggleWidgetWallpaperEmbed`, a tray toggle, and an `opaque` param on `createDesktopWidgetWindow`) was added (uncommitted) to try to pin the widget into the wallpaper layer. It is a dead end: in the SetParent-embed approach, "immune to Win+D" (the WorkerW layer behind the desktop icons) and "clickable" (above the icons) are mutually exclusive, so `Win+D` still hid the widget. The correct Win+D-immunity mechanism — `owner=Progman` (`GWLP_HWNDPARENT`) — already exists in the committed code and keeps the window clickable.

## Chosen Behavior Model

The widget becomes a Rainmeter-style "On Desktop" widget: it permanently sits at the bottom of the z-order, pinned to the desktop, covered by other apps. It is visible (and clickable) when no app covers its area, and reappears when apps are minimized or `Win+D` is pressed.

This collapses the three states to **two**, and removes all foreground tracking:

| State | Trigger | Action |
|-------|---------|--------|
| **idle** (default) | Entering widget desktop mode; widget loses focus (`blur`) | `owner=Progman` (set once on enter) + `sendToBottom` |
| **active** | Widget window gains focus (`widget-focus`, i.e. the user clicked it) | Raise to a normal top position so the user can type / tap tasks |

The driver changes from a 64ms foreground poll to the widget window's own `focus` / `blur` events. These are discrete user-driven events that do not oscillate, so the z-order no longer thrashes and the flicker is eliminated at the source.

`Win+D` "Show Desktop" exemption continues to rely on `owner=Progman`, applied once when the widget enters desktop mode. That mechanism is unchanged.

## Scope

### In scope (desktop widget only)

- Remove the SetParent experiment in full:
  - `embedIntoWallpaper` and `detachFromWallpaper` native bindings.
  - `toggleWidgetWallpaperEmbed` and its `widgetEmbeddedInWallpaper` state.
  - The tray "实验：把组件嵌入壁纸层 / 从壁纸层取出组件" entry.
  - The `opaque` parameter on `createDesktopWidgetWindow` (revert to the transparent widget).
- Replace the widget's three-state polling guard with the two-state, event-driven model:
  - Remove `widgetDesktopGuardTimer`, the 64ms interval, and the foreground-tracking logic in `applyWidgetDesktopTopmost` (`getForegroundClass`, `shellForeground`, grace, settle, `desktop-visible`).
  - Keep `applyWidgetDesktopOwner` / `clearWidgetDesktopOwner` (owner=Progman) — used once on enter/exit.
  - Wire `sendToBottom` on enter and on widget `blur`; raise on widget `focus`.
- Extract the state decision into a pure helper `nextWidgetDesktopState(current, event)` for testability.

### Out of scope (must not change)

- The main application window: its UI, task data, and all feature logic.
- The main window's desktop-mode guard (`applyDesktopTopmost`, `startDesktopGuard`, the `desktopWidgetState` three-state machine at `main.ts:1077`). This is the main window's own pinning state and is intentionally independent from the widget's.
- Any cross-window task sync, widget rendering/UI, bounds persistence, or tray entries other than the experiment toggle being removed.

## Components

### `nextWidgetDesktopState(current, event)` — pure reducer

- Input: `current` state (`'idle' | 'active'`) and `event` (`'enter' | 'widget-focus' | 'widget-blur'`).
- Output: next state.
- Rules:
  - `enter` → `idle`
  - `widget-focus` → `active`
  - `widget-blur` → `idle`
- No foreground class, no timers, no `desktop-visible`. This makes the transition logic verifiable without Electron.

### Widget window wiring (`createDesktopWidgetWindow`)

- Reverts to the committed transparent widget (no `opaque` param).
- On ready / enter desktop mode: apply `owner=Progman` once, set state `idle`, `sendToBottom`.
- `win.on('focus', ...)`: state → `active`, raise to normal top.
- `win.on('blur', ...)`: state → `idle`, `sendToBottom`.
- No `setInterval`.

## Data Flow

1. User opens the widget from the tray.
2. On window ready, the widget enters desktop mode: `owner=Progman` is set once, state is `idle`, widget is sent to the bottom.
3. The widget stays pinned at the bottom; opening apps cover it; `Win+D` reveals it (owner=Progman exemption).
4. User clicks the widget → `focus` fires → state `active` → widget raises so they can quick-add or complete a task.
5. User clicks back to another window → `blur` fires → state `idle` → widget sinks to the bottom.

## Error Handling

- All native calls stay wrapped in the existing `try/catch` + `diag` pattern; failure logs and continues (no crash).
- If `win32` is unavailable (no koffi binding), the widget degrades to a normal window with no desktop pinning, same as today.
- Removing the poll also removes its safety-net behavior: if some edge state ever leaves the widget mis-stacked, there is no periodic re-assertion to recover it. This is an accepted trade-off for zero flicker; `focus`/`blur` re-assert z-order on the next interaction.

## Testing / Verification

- New `app/scripts/verify-widget-desktop-state.ts`: asserts the `nextWidgetDesktopState` transitions (`enter`/`focus`/`blur`) and that no `desktop-visible` state exists.
- Update `app/scripts/verify-main-window-structure.ts`: assert the widget no longer uses a `setInterval` guard, that it wires `focus`/`blur` listeners, and that the experiment functions (`embedIntoWallpaper`, `toggleWidgetWallpaperEmbed`) are gone.
- Register the new script in `package.json` (`verify:widget-desktop-state`) and include it in the widget/RC verification chain.
- Manual `npm run dev` check by the user: flicker gone; `Win+D` does not hide the widget; clicking the widget lets you type; clicking back to an app sinks the widget to the desktop.

## Known Risk (manual-verify item)

When the widget is at `HWND_BOTTOM` with `owner=Progman`, clicking it must reliably raise it and give the input field keyboard focus. A normal top-level window activates on click, but `owner=Progman` can occasionally interfere. If the widget does not raise on click during the dev check, the `focus` handler will additionally call `moveTop` / `clearTopmost` to force the raise. This is the one behavior that needs real-machine confirmation.

## Success Criteria

- The SetParent experiment code and its tray entry are fully removed.
- The widget no longer runs a 64ms poll; its z-order is driven only by `focus`/`blur`.
- No visible flicker when alternating focus between the desktop and apps.
- `Win+D` does not hide the widget.
- The widget is clickable: quick-add and task completion work.
- The main application window and its guard are unchanged.
- `verify:widget-desktop-state`, the updated structure verification, and `npm run build` pass.
