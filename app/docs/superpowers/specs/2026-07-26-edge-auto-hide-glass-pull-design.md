# Edge Auto-Hide Glass Pull Design

## Goal

Replace the current narrow, pill-shaped right-edge activation strip with the
selected A2 balanced glass pull. The retracted DailyTodo window should read as
a deliberate desktop affordance rather than a clipped scrollbar, while
remaining just as quick to restore.

## Scope

- Change the visual and hit geometry for the existing **right-edge**
  activation strip only.
- Keep the existing independent, transparent, always-on-top Electron window
  that restores the main window on pointer entry.
- Preserve the main window's fully-offscreen retracted bounds and the existing
  hide, restore, timer, pointer, and z-order state machine.
- Retain current left-edge and top-edge activation-strip geometry and visual
  treatment. They are out of scope for this focused polish pass.

## Non-Goals

- Do not add click, drag, keyboard, settings, persistence, or renderer state.
- Do not delay restoration for an animation.
- Do not change the desktop-edge hide-intent threshold, auto-hide timer, snap
  behavior, display selection, or bottom-edge support policy.
- Do not redesign the main window, task UI, or other compact controls.

## Geometry

When a right-docked window is retracted, the activation `BrowserWindow` is a
transparent `28 x 96 px` rectangle inside the right edge of the matching
display work area. This is the actual pointer hit region.

Inside that region, the visible A2 pull is:

- `15 x 72 px` at rest;
- vertically centered in the hit region;
- flush to the screen's right edge;
- rounded on its left side and open/flush on the screen-edge side;
- expanded only visually to `19 px` wide while the activation page is hovered.

The 28-pixel hit width intentionally exceeds the 15-pixel visible handle. A
user can therefore move naturally to the desktop edge without having to target
the narrow visual affordance. The main application window remains entirely
offscreen in every retracted state.

The geometry module will split the right-side activation hit dimensions from
the current shared reveal thickness so that the unchanged left and top strips
continue to use their current `8 x 96 px` and `96 x 8 px` bounds. The helper
that returns right-side activation bounds remains the sole source of truth for
the Electron window placement and pointer-containment tests.

## Visual Design

The right-side activation page renders a single `.glass-pull` inside its
otherwise transparent hit region.

- Background: a restrained translucent white/blue-gray gradient over a soft
  glass fill; it must remain legible on both dark and light desktop content.
- Border: a subtle light border with a faint inset top highlight. The right
  border is omitted so the pull appears attached to the display edge.
- Depth: a small, low-opacity external shadow and `backdrop-filter` blur with
  a matching `-webkit-backdrop-filter` declaration.
- Direction: a centered, low-contrast left-pointing chevron, made from CSS
  borders rather than an asset. It communicates that the concealed window
  returns from the right edge without displaying text.
- Motion: CSS transitions of `150ms ease` animate width, fill, and shadow for
  the `:hover` state. Entry still notifies the main process immediately, so
  the transition is a non-blocking transient response rather than a required
  animation users must wait through.

If backdrop filtering is unavailable, the opaque portion of the translucent
fill, border, chevron, and shadow still provide a clear handle. No browser API
feature detection or alternate window is needed.

## Runtime Flow

1. The controller retracts a right-attached main window exactly as it does
   today, moving the main window fully outside the display work area.
2. The activation-strip owner requests bounds from the geometry helper. For a
   right edge, it receives the `28 x 96 px` hit region and shows the existing
   transparent, non-focusable, always-on-top activation window there.
3. Entering, moving, pressing, or clicking inside that window uses the
   existing notification path to invoke `activate()`.
4. `activate()` restores the saved expanded main-window bounds and hides the
   activation window. Hover styling must never defer this path.
5. All existing hard-hide, pending-load, disposal, and stale-event protections
   continue to disable mouse events before the strip is hidden. The larger
   transparent hit region must not remain interactive after restoration.

## Component Boundaries

- `electron/edgeAutoHideGeometry.ts` owns pure dimensions and placement. It
  gains right-side activation hit dimensions and returns the wider bounds only
  for `right`.
- `electron/edgeAutoHideActivationStrip.ts` continues to own the companion
  `BrowserWindow`, readiness, visibility, and event forwarding. Its data-URL
  HTML owns the A2 pull's markup and CSS. It must not take ownership of edge
  auto-hide state or window restoration logic.
- `electron/edgeAutoHideController.ts` is unchanged unless a small type or
  call-site adjustment is required by the geometry helper. Its state machine
  remains the behavior authority.

## Tests And Verification

Focused Vitest coverage will be updated to assert:

- right-edge activation bounds use `28 x 96 px` and remain vertically centered
  within the expanded window;
- left and top activation bounds remain `8 x 96 px` and `96 x 8 px`;
- right-edge activation containment accepts points in the wider transparent
  hit region and rejects points immediately outside it;
- negative-coordinate display work areas place the right hit region wholly
  inside the matching work area;
- generated activation-page HTML contains the glass pull, left chevron,
  `backdrop-filter` fallback-compatible styling, `150ms` transition, and the
  existing pointer-entry notification bindings;
- activation-strip controller behavior still hides and ignores mouse events
  after restoration.

Run the focused edge-auto-hide tests, the project's type check and lint
commands, then launch the Electron development build for a manual right-edge
check. The manual check confirms the handle is centered, flush with the right
edge, visually distinct from a scrollbar, reliably restorable from anywhere in
the transparent hit zone, and non-interactive after the main window returns.

## Acceptance Criteria

- A retracted right-edge DailyTodo window shows a `15 x 72 px` A2 balanced
  glass pull rather than an `8 x 96 px` full-window pill.
- The pull has a left-facing chevron, subtle glass border/highlight, and does
  not show text or a click-only control.
- Moving into the `28 x 96 px` right-edge activation region restores the main
  window without an animation-induced delay.
- The restored main window is not obscured or intercepted by a stale strip.
- Existing left and top auto-hide behavior remains unchanged.
- Geometry and activation-page tests describe the new right-edge dimensions
  and retain coverage for existing pointer activation behavior.
