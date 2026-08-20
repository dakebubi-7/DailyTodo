# Daily Review Detail Interaction Fix

## Context

When the AI daily review/focus result is generated and opened, the detail panel can extend beyond the available window. Its content list is intended to scroll, but the grid parent does not allocate a shrinkable row, so the list can grow with its contents instead of becoming a scroll container. The panel also only exposes its visible close button; it does not respond to the requested `Escape` shortcut.

## Goals

- Keep the existing daily review generation, adoption, and persistence behavior unchanged.
- Allow the open detail panel to close with its existing close button and with `Escape`.
- Keep the detail panel within the viewport and make the result list scrollable when content exceeds the available height.
- Preserve keyboard accessibility and avoid adding click-outside dismissal.

## Design

### Interaction

`DailyReviewPanel` will install a `keydown` listener only while `isDetailOpen` is true. When the event key is `Escape`, it will call the existing `closeDetails` callback. The effect will clean up when the panel closes or unmounts. The close button remains the primary visible control and keeps its existing accessible label.

### Layout

The `.daily-review-detail` container will use an explicit two-row grid:

```css
grid-template-rows: auto minmax(0, 1fr);
```

The detail panel will retain its viewport-bounded `max-height`. The `.daily-review-items` list will remain the flexible row and will explicitly set `min-height: 0`, `overflow-y: auto`, and `overscroll-behavior: contain`, allowing the list to scroll without expanding the dialog. The existing card layout, colors, and action controls will not otherwise change.

### Verification

- Add a DOM regression test for the `Escape` close behavior.
- Keep the existing component tests for rendering and actions passing.
- Run the focused test suite, typecheck, and production build.

## Non-goals

- No click-on-backdrop dismissal.
- No changes to AI generation or daily review data handling.
- No new modal framework or global overlay refactor.
