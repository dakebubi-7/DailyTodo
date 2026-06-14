# Native Frosted Glass and Surface Denoise Design

## Goals

- Make DailyTodo's transparent themes feel like real frosted glass: the desktop/app background is softly diffused while task text, checkboxes, and controls remain sharp.
- Reduce the current "large blurred card" look where task rows become obvious green/white translucent blocks.
- Keep the existing Appearance controls and opacity variables; this is a visual tuning pass, not a settings-page redesign.
- Use native Windows/Electron background material when available, with safe fallback when unsupported.

## Current Problem

The current CSS-only approach relies heavily on `backdrop-filter` on many individual app surfaces. This can make the UI look like the app content itself is blurred or like each task card is a separate frosted rectangle. The user's target reference is closer to a single misted glass pane over the background, with crisp foreground text and only subtle local surface feedback.

The implementation should shift the blur responsibility toward the window/background layer and make local surfaces quieter.

## Design

### Native background material layer

After creating the main `BrowserWindow` in `app/electron/main.ts`, the app should attempt to enable an OS/Electron-native background material for supported Windows environments.

Implementation priorities:

1. Prefer Electron's native API if available at runtime, such as `win.setBackgroundMaterial(...)`.
2. Choose a material that visually matches frosted glass. Acrylic is the preferred target because it is closer to a blurred/translucent material than Mica's subtle wallpaper tint.
3. If the API or material is unavailable, catch the error and continue with the existing transparent window behavior.
4. Log a short diagnostic message through the existing diagnostics pattern so unsupported environments are understandable but not noisy.

The native material attempt must not be required for app startup. It is progressive enhancement only.

### CSS denoise layer

The CSS should reduce per-component blur intensity and large opaque tint blocks, especially for transparent themes.

Rules:

- The app shell remains the main frosted pane and continues to use `--window-opacity`, `--blur-strength`, and `--glass-saturation`.
- Task cards should use `--card-opacity`, but their default visual weight should be subtle. They should not become large saturated green/white blocks.
- Task card hover/active feedback should use a light tint/border change, not a heavy opaque fill.
- Text, checkbox strokes, task hierarchy controls, and source badges remain fully opaque and readable.
- Inputs/editors may remain slightly more visible than task cards because editability needs a clear affordance.
- Settings panels, menus, popovers, and dialogs remain more readable than task cards, using their existing area opacity variables.
- Transparent/invisible-style themes should favor a single-pane glass feeling: local panels are quieter, while foreground content remains crisp.

### Theme behavior

The first tuning target is the transparent/low-distraction visual family:

- `theme-invisible`
- watercolor/light transparent surfaces where the current look becomes too blocky
- generic task card and hover rules that affect all themes

Other themes should continue to respect the opacity variables but do not need a full visual redesign in this pass.

### Data flow

No new user settings are required. Existing values continue to drive CSS variables from `App.tsx`:

- `--window-opacity`
- `--card-opacity`
- `--input-opacity`
- `--dialog-opacity`
- `--menu-opacity`
- `--settings-panel-opacity`
- `--blur-strength`
- `--glass-saturation`

Native background material is not persisted as a user option in this iteration. It is automatically attempted on startup.

## Error Handling

- If native material is unsupported, fail silently except for a diagnostic log.
- If setting one material fails, optionally try a less aggressive supported material before falling back.
- Do not throw from window creation.
- Do not change task data, settings persistence, or theme preset storage.

## Testing and Verification

Automated/static verification should cover:

1. Main window creation attempts to enable native background material after `BrowserWindow` creation.
2. The native material path is guarded by feature detection or try/catch.
3. The fallback path preserves `transparent: true` and `backgroundColor: '#00000000'`.
4. Task card and hover CSS continue to use `--card-opacity` instead of fixed high alpha values.
5. Invisible/settings/menu/dialog surfaces continue to use the appropriate opacity variables.

Manual verification should cover:

1. Launch the app with `npm run dev`.
2. Open a transparent theme, especially `无感`.
3. Confirm the background looks misted/frosted while task text and checkboxes remain sharp.
4. Confirm ordinary task rows are not large green/white blocks by default.
5. Hover/select a task and confirm the feedback is subtle.
6. Open settings/menu/dialogs and confirm readability remains acceptable.
7. If native material is unsupported on the current Windows/Electron combination, confirm the app still starts and falls back gracefully.

## Out of Scope

- Adding new Appearance controls for material type or glass strength.
- Reworking the entire theme preset system.
- Changing task list behavior, drag behavior, Obsidian sync, templates, or AI review.
- Guaranteeing identical Acrylic/Mica rendering across all Windows versions.
