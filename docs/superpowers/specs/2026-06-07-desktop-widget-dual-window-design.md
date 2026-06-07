# 2026-06-07 Desktop Widget Dual-Window Design

## Goal

Reshape the Electron main-process window-loading and window-lifecycle structure so it is ready for a future desktop-widget second window without over-implementing the feature in this round.

This design is driven by three review findings in `app/electron/main.ts`:

1. The renderer-loading helper currently accepts a raw query string and resolves it differently in development and production.
2. The `minimize` event is registered twice in `createWindow`, splitting behavior and diagnostics.
3. A new `desktopWidgetWindow` global was introduced as dead state, which suggests a dual-window lifecycle exists when it does not.

## Scope

This round will establish a dual-window-ready main-process structure while keeping the renderer architecture lightweight.

In scope:

- Promote window state from an accidental single-window structure plus dead placeholder into an explicit dual-window model.
- Replace the raw-string renderer-loading API with a structured view-based API.
- Merge duplicate `minimize` handlers into one coherent handler.
- Make the main window explicitly load the `main` view.
- Reserve a clear creation path for a future desktop widget window in the main process.

Out of scope:

- Shipping a complete desktop widget product experience.
- Splitting the renderer into separate entry points.
- Broad refactors unrelated to window lifecycle and renderer loading.
- Expanding tray, IPC, and synchronization logic into a fully completed two-window system unless required by the new structure.

## Recommended Approach

Use an explicit dual-window skeleton with a shared renderer entry point.

Why this approach:

- It is more complete than a narrow cleanup because it gives the second window a real architectural slot.
- It is lower risk than shipping a full second window because it limits this round to main-process structure.
- It preserves flexibility: both windows can initially share one renderer entry point, and the renderer can be split later if the widget diverges enough.

Alternatives considered:

1. Minimal cleanup only.
   - Lower cost now, but the next second-window step would still have to restructure the main process.
2. Full dual-window implementation now.
   - More complete in theory, but too likely to expand this task into UI, IPC, and behavior work beyond the review-driven scope.

## Design

### Window Model

The main process should treat windows as separate lifecycle slots with clear intent.

Required slots:

- `mainWindow`: the primary application window.
- `desktopWidgetWindow`: the future desktop-widget window slot.

The key change is semantic clarity:

- `desktopWidgetWindow` must not remain an inert global that implies functionality without lifecycle ownership.
- If the slot exists in code after this round, it should exist as part of an intentional window model and a corresponding creation path.

This design does not require the widget window to become a feature-complete user-facing window in this round. It does require the code to stop pretending the slot already exists while doing nothing with it.

### Renderer Loading API

The renderer-loading helper should stop accepting a raw query string.

Instead, it should accept structured input:

- target `BrowserWindow`
- required view identifier
- optional parameter object

Initial required view identifiers:

- `main`
- `widget`

The helper is responsible for producing equivalent semantics in both environments:

- Development: build a full URL against the dev server.
- Production: call `loadFile(..., { query })` using the same parameter object.

Constraints:

- Callers should describe intent, not URL syntax.
- No caller should hand-build `?foo=bar` strings.
- The helper should own environment-specific URL construction.

This removes the current ambiguity where development concatenates a raw string while production parses and re-encodes it differently.

### Main Window Creation

`createWindow` should continue to create the main application window, but it should now do so through the structured renderer-loading path.

Expected behavior:

- The created window is still the current main application window.
- The renderer load call explicitly identifies it as the `main` view.
- Existing startup behavior should remain unchanged from a user perspective unless a bug fix requires a local adjustment.

### Desktop Widget Creation Path

A dedicated main-process creation path should be introduced or made explicit for the future widget window.

Examples of acceptable shapes:

- `createDesktopWidgetWindow()`
- a shared `createAppWindow({ kind: ... })` abstraction with a `widget` branch

Recommendation:

- Prefer a dedicated helper such as `createDesktopWidgetWindow()` if that keeps the current file easier to reason about.

This path only needs to establish a real structural home for the widget window. It does not need to connect all final tray behavior, UI routes, or full interaction semantics in this round.

### Minimize Handling

The duplicate `minimize` registrations inside `createWindow` should be merged into one handler.

The unified handler should own both:

- diagnostic logging for minimize events
- desktop-mode recovery behavior

This keeps behavior and diagnostics together and avoids future edits changing only one half.

## Error Handling

The new renderer-loading helper should preserve the current fault profile:

- If renderer loading fails, existing Electron failure signals such as `did-fail-load` should remain the source of diagnostics.
- The refactor should not silently swallow load errors.

The design does not add new retry behavior in this round.

## Testing Strategy

Minimum verification targets:

1. Main window startup still works.
2. The structured renderer-loading path produces equivalent intent in development and production.
3. The main window explicitly loads the `main` view.
4. Only one `minimize` handler remains for minimize logging and desktop-guard recovery.
5. The code no longer contains an unused or misleading second-window lifecycle slot.

Testing can be a mix of targeted static checks and local app verification, but the final change should confirm that startup and minimize behavior did not regress.

## Risks and Mitigations

### Risk: scope expansion into full widget implementation

Mitigation:

- Keep this round focused on main-process structure.
- Do not expand into full renderer divergence, full IPC separation, or complete widget UX unless the refactor cannot remain coherent without it.

### Risk: the new widget slot still ends up half-real

Mitigation:

- Ensure the slot is backed by an intentional creation path and clear ownership semantics.
- If that cannot be done cleanly in this round, it is better to omit the slot than keep a misleading dead variable.

### Risk: dev/prod URL semantics still drift

Mitigation:

- Centralize all environment-specific URL construction in one helper.
- Keep the API structured and object-based from the call site inward.

## Implementation Boundary Summary

This round is successful if:

- the dead placeholder becomes either a real, intentional window slot or is removed in favor of a cleaner immediate structure,
- renderer loading is structured around explicit views instead of raw query strings,
- minimize behavior is unified,
- and the code is clearly ready for a future second window without already claiming that the feature is fully implemented.
