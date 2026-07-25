# Edge Auto-Hide Glass Pull Design

## Goal

Replace the current narrow, pill-shaped activation strips on every supported
edge with the selected A2 balanced glass pull. A retracted DailyTodo window
should read as a deliberate desktop affordance rather than a clipped
scrollbar, while remaining just as quick to restore.

## Scope

- Change the visual and hit geometry for the existing left, right, and top
  activation strips.
- Keep the existing independent, transparent, always-on-top Electron window
  that restores the main window on pointer entry.
- Preserve the main window's fully-offscreen retracted bounds and the existing
  hide, restore, timer, pointer, and z-order state machine.
- Use one A2 visual language across all three directions: a vertical pull for
  left and right, and a horizontal pull for the top, with each variant pointing
  back toward the concealed window.

## Non-Goals

- Do not add click, drag, keyboard, settings, persistence, or renderer state.
- Do not delay restoration for an animation.
- Do not change the desktop-edge hide-intent threshold, auto-hide timer, snap
  behavior, display selection, or bottom-edge support policy.
- Do not redesign the main window, task UI, or other compact controls.

## Geometry

When a side-docked window is retracted, the activation `BrowserWindow` is a
transparent `28 x 96 px` rectangle inside the matching left or right display
edge. When a top-docked window is retracted, it is a transparent `96 x 28 px`
rectangle inside the top edge. These are the actual pointer hit regions.

Inside a left or right hit region, the visible A2 pull is:

- `15 x 72 px` at rest;
- vertically centered in the hit region;
- flush to the matching screen edge;
- rounded on the screen-interior side and open/flush on the screen-edge side;
- expanded only visually to `19 px` wide while the activation page is hovered.

The top variant is the corresponding horizontal pull:

- `72 x 15 px` at rest;
- horizontally centered in the top hit region;
- flush to the screen's top edge and rounded along its lower, interior edge;
- expanded only visually to `19 px` tall while the activation page is hovered.

The 28-pixel hit thickness intentionally exceeds the 15-pixel visible handle.
A user can therefore move naturally to any supported desktop edge without
having to target the narrow visual affordance. The main application window
remains entirely offscreen in every retracted state.

The geometry module will replace the current shared 8-pixel reveal thickness
with a 28-pixel activation-hit thickness. The helper that returns activation
bounds remains the sole source of truth for Electron window placement and
pointer-containment tests.

## Visual Design

The activation page renders a single `.glass-pull` inside its otherwise
transparent hit region. Before each show, the activation-strip owner sets an
edge data attribute on that page, allowing its CSS to select the correct
orientation, edge attachment, rounded interior corners, and arrow direction.

- Background: a restrained translucent white/blue-gray gradient over a soft
  glass fill; it must remain legible on both dark and light desktop content.
- Border: a subtle light border with a faint inset highlight. The border on
  the attached screen edge is omitted so the pull appears joined to that edge.
- Depth: a small, low-opacity external shadow and `backdrop-filter` blur with
  a matching `-webkit-backdrop-filter` declaration.
- Direction: a centered, low-contrast CSS chevron that points right for the
  left edge, left for the right edge, and down for the top edge. It communicates
  that the concealed window returns from that edge without displaying text.
- Motion: CSS transitions of `150ms ease` animate the axis that expands toward
  the desktop interior, plus fill and shadow. Entry still notifies the main
  process immediately, so the transition is a non-blocking transient response
  rather than a required animation users must wait through.

If backdrop filtering is unavailable, the opaque portion of the translucent
fill, border, chevron, and shadow still provide a clear handle. No browser API
feature detection or alternate window is needed.

## Runtime Flow

1. The controller retracts a left-, right-, or top-attached main window
   exactly as it does today, moving the main window fully outside the display
   work area.
2. The activation-strip owner requests bounds from the geometry helper. It
   receives a `28 x 96 px` side hit region or a `96 x 28 px` top hit region,
   sets the page edge data attribute, and shows the existing transparent,
   non-focusable, always-on-top activation window there.
3. Entering, moving, pressing, or clicking inside that window uses the
   existing notification path to invoke `activate()`.
4. `activate()` restores the saved expanded main-window bounds and hides the
   activation window. Hover styling must never defer this path.
5. All existing hard-hide, pending-load, disposal, and stale-event protections
   continue to disable mouse events before the strip is hidden. The larger
   transparent hit region must not remain interactive after restoration.

## Component Boundaries

- `electron/edgeAutoHideGeometry.ts` owns pure dimensions and placement. It
  gains one shared activation-hit thickness and returns wider bounds for left,
  right, and top.
- `electron/edgeAutoHideActivationStrip.ts` continues to own the companion
  `BrowserWindow`, readiness, visibility, and event forwarding. Its data-URL
  HTML owns the A2 pull's markup and edge-specific CSS; before showing, it
  applies the edge data attribute. It must not take ownership of edge auto-hide
  state or window restoration logic.
- `electron/edgeAutoHideController.ts` is unchanged unless a small type or
  call-site adjustment is required by the geometry helper. Its state machine
  remains the behavior authority.

## Tests And Verification

Focused Vitest coverage will be updated to assert:

- left and right activation bounds use `28 x 96 px`, and top activation bounds
  use `96 x 28 px`, each centered on the expanded window;
- activation containment accepts points throughout each wider transparent hit
  region and rejects points immediately outside it;
- negative-coordinate display work areas place left and right hit regions
  wholly inside the matching work area;
- generated activation-page HTML contains the glass pull, all three directional
  chevrons, `backdrop-filter` fallback-compatible styling, `150ms` transitions,
  and the existing pointer-entry notification bindings;
- activation-strip controller behavior still hides and ignores mouse events
  after restoration.

Run the focused edge-auto-hide tests, the project's type check and lint
commands, then launch the Electron development build for manual checks of the
left, right, and top edges. The checks confirm each handle is centered, flush
with its correct edge, visually distinct from a scrollbar, reliably restorable
from anywhere in its transparent hit zone, and non-interactive after the main
window returns.

## Acceptance Criteria

- A retracted left or right DailyTodo window shows a `15 x 72 px` A2 balanced
  glass pull, and a retracted top window shows a `72 x 15 px` horizontal A2
  pull, rather than an `8 x 96 px` or `96 x 8 px` full-window pill.
- Each pull has the correct inward-pointing chevron, subtle glass
  border/highlight, and no text or click-only control.
- Moving into a `28 x 96 px` side or `96 x 28 px` top activation region
  restores the main window without an animation-induced delay.
- The restored main window is not obscured or intercepted by a stale strip.
- Existing left, right, and top auto-hide state-machine behavior remains
  unchanged.
- Geometry and activation-page tests describe all three new hit regions and
  retain coverage for existing pointer activation behavior.
