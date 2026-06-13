# Frosted Glass Opacity Controls Design

## Goals

- Make the app's transparency feel like frosted glass: blurred wallpaper behind the surface, clear foreground text and icons, subtle borders, and soft surface shadows.
- Ensure opacity controls work across all visible themes and all supported surface areas instead of being overridden by fixed CSS values.
- Replace the separate opacity recommendation list with recommended ranges shown directly on each opacity slider.
- Let global font scale and corner radius reset by double-clicking, using the current theme defaults.

## Scope

This design covers the Appearance settings page and the CSS variables that drive app surface opacity. It does not redesign the full settings page, add a live preview panel, or introduce a new glass-strength setting beyond the existing blur/opacity model.

## Current behavior to fix

The current implementation already has per-area opacity settings in `PersonalizationSettings` and theme defaults in `THEME_PRESETS`. However, some CSS rules still use fixed `rgba(..., 0.xx) !important` values for task cards, toolbars, dark-mode surfaces, dialogs, and other components. Those rules can make a slider appear to exist while the visible surface barely changes.

The Appearance page also shows opacity recommendations as a separate read-only list above the detailed controls. This makes the user compare two different sections instead of seeing the recommended range while adjusting the slider.

Finally, global font scale and corner radius are normal sliders with no double-click reset behavior.

## Design

### Frosted glass rendering

All glass-like surfaces should keep foreground content fully opaque. The opacity value controls the surface background tint only, not the text, icons, or child controls.

The main glass recipe is:

- Semi-transparent background color using the relevant CSS opacity variable.
- `backdrop-filter` and `-webkit-backdrop-filter` using the existing blur strength and saturation variables.
- Subtle border/highlight so the surface edge remains readable over busy wallpaper.
- Soft shadow only where it helps separate floating surfaces from the background.

The implementation should audit appearance-related CSS and replace hard-coded surface opacity values with the matching variable where appropriate:

- App/window background: `--window-opacity`.
- Top/header surfaces and title/header controls: `--top-opacity` or `--control-opacity` depending on the element role.
- Task cards and task toolbar surfaces: `--card-opacity` or a readable derived value only when text contrast requires it.
- Inputs and editors: `--input-opacity`.
- Dialogs: `--dialog-opacity`.
- Menus/popovers/context menus: `--menu-opacity`.
- Settings panel: `--settings-panel-opacity`.

Any derived readability helper should still respond to the selected opacity value. It must not silently pin a surface to an opaque fixed value that makes the slider ineffective.

### Theme-specific recommended ranges

Recommended opacity ranges are theme-specific and area-specific. Each theme keeps its default opacity values as the reset target. The UI derives a small recommended range around each theme default for display on the slider track.

The recommended range should be displayed directly on the slider, for example as a highlighted segment behind the thumb. The existing separate opacity recommendation section should be removed from Appearance.

For each opacity area row:

- The label remains the area name, such as Home background, Task card, Input, Top-bar buttons, Dialogs, Menus, and Settings panel.
- The current value remains visible as a percentage.
- The slider track contains the current theme's recommended range.
- The reset action returns that area to the current theme default value.
- If a theme does not define an area-specific value, fall back through the existing compatibility chain, then to the global default.

The recommended range calculation can be simple and deterministic, for example theme default ±8 percentage points clamped to the slider min/max. If visual tuning requires it, individual themes can later expose explicit ranges, but that is not required for this pass.

### Slider interaction and reset behavior

`RangeControl` should support optional reset behavior without changing callers that do not need it.

For global font scale:

- Double-clicking the control or slider resets to the current theme default font scale.
- If the current theme does not specify font scale, reset to `100`.
- The hint/title should mention double-click reset.

For corner radius:

- Double-clicking the control or slider resets to the current theme default radius.
- The hint/title should mention double-click reset.

For opacity rows:

- Existing reset-to-theme-default behavior remains.
- Double-click reset may be supported for consistency if it is straightforward, but the required behavior is the visible reset action and recommended range display.

All resets should call the existing `onChange`/personalization update path so persistence and per-theme opacity memory continue to work.

### Data flow

Theme presets remain the source of truth for theme defaults. The settings panel reads the current theme recommendation through the existing `getThemeRecommendation(settings)` helper.

Opacity changes continue to flow through `handlePersonalizationChange` in `App.tsx`, which persists personalization and updates per-theme opacity overrides. Applying a theme still uses that theme's defaults plus remembered opacity overrides. Reset actions explicitly write the theme default value back into personalization.

No migration is required. Older saved personalization values continue to merge with `DEFAULT_PERSONALIZATION` as today.

## Error handling and edge cases

- Clamp all slider values to the existing min/max ranges.
- If `themeId` is missing or unknown, use the minimal/default preset recommendation.
- If a preset omits `fontScale`, use `100` for font reset.
- If a preset omits an opacity field, use the existing opacity fallback chain.
- CSS changes should preserve dark-mode readability and should not make text or icons transparent.

## Testing and verification

Automated or manual verification should cover:

1. Open Appearance and confirm the separate opacity recommendation list is gone.
2. Expand area fine tuning and confirm each opacity slider shows a recommended range on the track.
3. Switch between available themes and confirm the recommended slider ranges change with the theme.
4. Adjust each opacity area and confirm the corresponding visible app surface changes.
5. Confirm transparent surfaces look blurred/frosted instead of simply fading content.
6. Double-click global font scale and confirm it resets to the current theme default or 100 if absent.
7. Double-click corner radius and confirm it resets to the current theme default radius.
8. Confirm reset actions still persist after closing/reopening settings or restarting the app.
9. Confirm dark mode surfaces remain readable and still respond to opacity controls.

## Out of scope

- Full Appearance page redesign.
- Live visual preview cards inside settings.
- New glass-strength or wallpaper blur presets.
- Changing task data, Obsidian sync, AI review, or template behavior.
