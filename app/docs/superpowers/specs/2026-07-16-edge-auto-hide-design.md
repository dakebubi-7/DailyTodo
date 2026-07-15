# Edge Auto-Hide Design

## Goal

Add QQ-style edge auto-hide for the DailyTodo desktop window. When a user places
the window at the left, right, or top edge of a display and moves the pointer
away, the window retracts while leaving a small visible strip. Moving the
pointer onto that strip restores the full window.

## Scope

- Support the left, right, and top edges of every display work area.
- Do not support the bottom edge, so the behavior cannot conflict with the
  Windows taskbar.
- Delay retraction until the pointer has remained outside the window for
  800 ms.
- Leave an 8 px visible activation strip after retraction.
- Enable the feature by default and expose a persisted settings toggle.

## Architecture

The behavior belongs to the Electron main process because the renderer cannot
observe the pointer after most of its window is outside the visible desktop.

A focused edge-auto-hide controller owns the state machine and receives:

- the main `BrowserWindow`;
- the Electron `screen` API for display work areas;
- a small extension to the existing Win32 native bridge to read the global
  pointer position;
- window event notifications for movement, resize, focus, hide, and close;
- the persisted auto-hide setting and the existing settings-mode/window-mode
  state.

The controller has no renderer dependency. It changes only native window
bounds and emits no user-visible renderer state unless the settings UI needs
to reflect its persisted enabled value.

## State And Flow

The controller tracks `expanded`, `pending-hide`, and `hidden-at-edge` states,
plus the edge that owns the current attachment.

1. After a user-initiated move completes, compare the expanded bounds with the
   work area of the display containing the window. If the window lies within a
   small snap threshold of the left, right, or top edge, snap it flush to that
   edge and remember the edge. A window at any other location is expanded and
   unattached.
2. While an attached, expanded window is active, poll the global pointer at a
   modest interval (roughly 50-80 ms). When the pointer leaves the window,
   begin an 800 ms timer. Re-entering the full window before the timer fires
   cancels the timer.
3. When the timer expires, re-read the pointer position and window state. Hide
   only if the pointer is still outside, the window remains attached, and the
   feature is enabled. Preserve its width, height, and the non-hidden axis;
   move its hidden axis so exactly 8 px remains inside the display work area.
4. While hidden, continue polling. The pointer entering the visible activation
   strip restores the saved expanded bounds immediately. The restored bounds
   remain snapped to the same edge and stay expanded while the pointer is
   inside them.

Pointer containment uses physical display coordinates and the matching
display's work area, not primary-display coordinates. This keeps behavior
correct when a secondary monitor is positioned above or to the left of the
primary monitor.

## Interaction Boundaries

- Explicit window hiding, minimizing, closing, destruction, or application
  shutdown cancels timers and stops polling; auto-hide never calls
  `BrowserWindow.hide()`.
- Starting a drag restores a hidden window before moving it, cancels pending
  hiding, and suppresses automatic retraction until the move settles.
- Resizing, opening settings mode, resetting position, or disabling the setting
  restores the full window and clears the edge attachment.
- The existing `normal`, `onTop`, and `desktop` modes keep their ownership of
  z-order. Auto-hide moves bounds only and must not call `setAlwaysOnTop`,
  change taskbar visibility, or alter the desktop-owner state.
- If native pointer lookup is unavailable or fails, the controller remains
  expanded and reports a diagnostic rather than moving the window based on
  unreliable data.

## Persistence

Add an `edgeAutoHide` boolean to the app behavior settings, defaulting to
`true`. Persist only the user preference. Do not persist a transient hidden
state or edge attachment: startup restores the normal saved window bounds and
the controller determines a new attachment only after a user move.

## Testing

Unit tests will cover the pure geometry and state decisions independently from
Electron and Win32:

- attachment detection for left, right, top, and unsupported bottom edges;
- expanded and retracted bounds, including work areas with nonzero origins;
- pointer containment in expanded bounds and activation strips;
- timer decisions for leave, re-entry, and expiry;
- cancellation for disabled, hidden, moved, resized, settings, and destroyed
  windows.

Native bridge tests will cover pointer-position decoding and failure fallback.
Controller tests will use fake timers and mocked window/screen/native services
to verify that retraction and restoration use the expected bounds without
altering z-order behavior.

## Acceptance Criteria

- A window parked on the left, right, or top display edge retracts only after
  the pointer has been outside for about 800 ms.
- A window away from those edges never retracts automatically.
- A retracted window leaves an 8 px visible strip and restores immediately
  when the pointer reaches it.
- Bottom-edge placement never activates the behavior.
- Feature behavior works against each display's work area, including a display
  with negative coordinates.
- Switching existing window modes, opening settings, or explicitly hiding the
  application does not leave the window stranded offscreen or change z-order.
- Disabling the setting restores a currently retracted window and prevents
  future automatic retraction.
