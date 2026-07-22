# Compact Window Controls Design

## Goal

Make the DailyTodo compact window remain readable and usable at its minimum width by scaling every toolbar control together, correcting theme colors, and giving the compact date strip enough vertical space.

## Scope

This work changes only the compact workspace presentation:

- Header actions, search, filters, view controls, and daily action buttons use a shared small-window scale.
- The daily progress summary is shorter and theme-correct in both light and dark modes.
- The return-to-today control becomes an icon-only calendar/location control at very narrow widths while keeping its accessible name and tooltip.
- Weekday labels in the date strip stay fully visible instead of being clipped.
- Existing normal-width behavior and task/date selection behavior remain unchanged.

## Responsive Behavior

At widths above 320px, the existing labeled controls remain available with their normal compact workspace sizing.

At widths of 320px or less:

- All utility controls in the header and task toolbar shrink together: icon buttons, search launcher, filter launcher, view launcher, and daily action buttons.
- Each control uses smaller fixed heights, reduced horizontal padding, smaller icon dimensions, and narrower gaps. Controls must not overlap or force a horizontal overflow.
- Text controls keep a stable height and truncate or hide secondary text only where the current component already supports it. Core icon affordances and accessible labels remain present.
- The return-to-today button shows a single calendar/location icon. Its `title` and `aria-label` remain the localized return-to-today string.
- Date-strip weekday labels use a stable line box and compact text treatment so their top edge is not clipped.

## Theme Rules

The progress summary is a 28px compact control rather than the current 34px row.

- In light mode, the track is a pale neutral surface with dark ratio text and a darker neutral fill for completed progress.
- In dark mode, the track is a dark neutral surface with light ratio text and a lighter neutral fill for completed progress.
- Borders, fill, and ratio text retain clear contrast in each theme. The colors are defined through component-scoped CSS custom properties rather than hard-coded inline React styles.
- Active header icons use CSS theme variables instead of the existing inline white-background/black-foreground style so selected state has proper contrast in both themes.

## Components And Boundaries

- `src/components/CompactDayStrip.tsx` owns the semantic return-to-today control and date cells. It will provide a dedicated compact calendar/location SVG that CSS can display at narrow widths.
- `src/components/compactDayStrip/compactDayStripUtils.ts` owns width-to-day-count selection. It will gain the minimum-width day-count behavior required to prevent date cells from becoming too narrow.
- `src/components/titleBar/TitleBarPrimaryActions.tsx` will stop applying theme-agnostic inline selected colors. Existing `data-selected` attributes remain the state hook for CSS.
- `src/styles/globals.css` owns the layout, responsive sizing tokens, visual theme variables, and visual states for the above controls.

## Verification

- Add focused tests for the compact-day count thresholds and return-to-today semantic markup.
- Extend the existing UI regression verification script with assertions for the compact control selectors and theme variables.
- Run type checking, linting, focused tests, and the UI regression script.
- Start the local desktop development build and inspect at normal compact width and at 320px or smaller in both light and dark themes. Confirm all controls fit, weekday labels are visible, and selected controls preserve contrast.

## Non-Goals

- No changes to task data, task filtering behavior, date selection semantics, localization strings, or window persistence.
- No broad title bar redesign outside compact sizing and selected-state theming.
