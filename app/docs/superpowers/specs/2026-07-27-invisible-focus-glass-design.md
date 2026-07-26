# Invisible Focus Glass Design

## Goal

Reduce the solid white-card effect of the invisible theme's return-to-today
control and Today Focus execution zone while keeping the latter legible and
clearly above ordinary task rows.

## Scope

Only `src/styles/globals.css` changes. No component markup, task state,
keyboard behavior, focus-state updates, or other theme styles change.

## Visual Treatment

- The invisible-theme return-to-today control uses a neutral white surface at
  roughly 9% opacity with a 12% white border.
- The Today Focus execution zone uses a 20% neutral white surface with a 13%
  white border and only an inset highlight. It has no exterior card shadow.
- The execution-zone controls use a 12% neutral white surface and 12% border.
- These values apply to the existing dark invisible-theme rendering shown in
  the approved preview. The light invisible variant uses equivalent low-opacity
  black surfaces so its hierarchy remains equally quiet.
- Existing text colors, keyboard focus outlines, hover feedback, and state
  labels remain unchanged to preserve readability and accessibility.

## Implementation

Append scoped overrides for `.app-shell[data-theme='invisible']` after the
base Today Focus rules. Use the existing selectors:

- `.date-today-button`
- `.today-focus-execution-zone`
- `.today-focus-adjust`
- `.today-focus-state-select`
- `.today-focus-blocker-input`

The dark overrides must follow the generic invisible-theme declarations so
they win against the existing `.dark .today-focus-*` rules.

## Verification

Run the focused UI regression verifier, type check, and lint. Confirm the
scoped rules leave the execution zone's layout and responsive behavior
unchanged.
