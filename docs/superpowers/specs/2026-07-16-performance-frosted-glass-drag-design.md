# Performance Frosted Glass Drag Design

## Goal

Keep the Invisible theme visibly frosted while making native window movement more responsive on Windows 10.

## Confirmed Experience

- When the Invisible theme has blur enabled and the user starts dragging the window, suspend real-time Win32 Acrylic.
- During movement, retain one unified opaque-enough frosted shell surface. Do not add CSS `backdrop-filter`, card-level blur, or extra overlay layers.
- Restore the configured native Acrylic material 150 ms after the last window movement event.
- Preserve position lock, title-bar controls, task context menus, adding tasks, and window mode behavior.
- Other themes and Invisible blur strength `0` retain their current behavior.

## Architecture

Introduce a focused main-process controller that owns the active Invisible-glass settings, whether movement is active, and the single restore timer. It receives renderer settings updates and is called by the existing BrowserWindow movement event registration. The controller applies either the configured Acrylic settings or a temporary disabled-native-material state.

The renderer receives one main-process event indicating whether performance frost is active. The app shell adds a data attribute while active; scoped Invisible-theme CSS slightly raises the existing single shell-surface alpha. It does not create a new visual layer, invoke web blur, or change task content structure.

## Data Flow

1. Renderer synchronizes configured Invisible glass settings through the existing `window:setInvisibleGlass` IPC.
2. Main process stores the normalized settings in the controller and applies configured Acrylic if not moving.
3. `will-move` begins performance frost: cancel any pending restore, disable Acrylic, and notify the renderer once.
4. Each `move` event resets a 150 ms restore timer.
5. The timer restores Acrylic from the latest stored settings and tells the renderer to clear performance frost.
6. Theme changes, blur set to zero, hidden/destroyed windows, and disabled glass cancel timers and clear the temporary state.

## Error Handling

- Native material application remains best-effort through the existing Win32 fallback.
- Repeated movement events are idempotent and never create multiple timers.
- A stale timer cannot restore Acrylic after the theme or blur has been disabled.
- Renderer notification is optional; if the renderer is unavailable, native material behavior still completes.

## Testing

- Unit-test controller transitions: begin move, movement debounce, restore after 150 ms, disabled-glass no-op, and settings replacement during a move.
- Unit-test event registration wiring for `will-move` and `move` without disturbing persistence behavior.
- Unit-test renderer shell presentation produces a stable data flag/class for the temporary frosted state.
- Run focused Vitest tests, TypeScript checking, and the production packaging build. Physical smoothness remains a user confirmation because the transparent framed app cannot be drag-injected reliably by the current automation.
