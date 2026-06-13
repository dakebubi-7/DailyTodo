# Personalization Glass Opacity and Radius Design

## Goals

- Fix the app home view corners so the minimum radius setting does not leave a straight-edged transparent shadow at the four corners.
- Make subtask completion-review buttons follow the same rule as main tasks: show only when completion review records exist.
- Rework Personalization so global corner radius lives with font size, and opacity controls are understandable while still allowing fine-grained per-area tuning.
- Use frosted glass treatment for transparent regions instead of simple opacity fading.

## Personalization settings structure

Personalization will be reorganized into three sections.

### Global appearance

This section contains settings that apply across themes:

- Font size.
- Corner radius.

Corner radius is no longer presented as a per-theme visual option. The value drives the outer app shell, home content layer, background clipping layer, major panels, cards, inputs, menus, and dialogs through shared CSS variables. At the minimum value, all outer clipping and shadow layers must use the same radius so no square transparent corner remains visible.

### Opacity recommendations

Each theme shows its suggested opacity combination in a compact read-only summary, for example:

- Home background: 82%.
- Task card: 76%.
- Input: 72%.
- Floating surfaces: 88%.

The exact numbers may vary by theme. This section explains the intended look without exposing every control at once.

### Area fine tuning

This section is collapsed by default. When expanded, it exposes seven adjustable areas:

1. Home background.
2. Task card.
3. Input.
4. Top-bar buttons.
5. Dialogs.
6. Menus.
7. Settings panel.

Each row has a slider and a reset-to-theme-recommendation action. These values are global overrides layered on top of the selected theme, not separate theme definitions.

## Frosted glass behavior

When an area opacity is below 100%, that area should use a glass surface rather than raw opacity:

- Semi-transparent background color.
- `backdrop-filter: blur(...) saturate(...)` where supported.
- A subtle border/highlight to preserve edges.
- Enough surface tint to keep text readable.

Lower opacity should slightly increase blur/tint strength so transparent areas stay legible over busy wallpapers. Fully opaque areas can skip the glass filter.

## Subtask completion-review button

Subtasks and main tasks use the same visibility rule for completion-review buttons:

- If the task has one or more completion review records, show the completion-review button.
- If the task has no completion review records, hide the button.

Newly added subtasks have no completion review records, so the button is hidden by default. After a subtask is completed with a review, the button appears and opens the same review viewer/editor used by main tasks. No separate subtask-only review UI is introduced.

## Corner and shadow fix

The app should avoid layered radius mismatch at the window corners.

Implementation should ensure:

- The outer app shell uses the global radius variable.
- The home/background clipping layer uses the same radius.
- Any fixed full-window overlay, drag region, pseudo-element, or shadow layer does not draw square corners beyond the clipped shell.
- Minimum radius removes both the visible corner curve and any square transparent shadow artifact.
- Larger radius values keep the window edge, background image, glass surfaces, and shadow visually aligned.

## Testing and verification

Manual verification should cover:

- Set corner radius to minimum and confirm all four app-home corners have no square transparent shadow edge.
- Increase corner radius and confirm the outer shell and inner background remain aligned.
- Add a subtask and confirm no completion-review button appears before a review exists.
- Complete a subtask with a review and confirm the button appears and opens the same review UI as main tasks.
- In Personalization, confirm font size and corner radius are grouped together.
- Confirm opacity recommendations are visible for the selected theme.
- Expand area fine tuning and adjust each of the seven areas.
- Confirm transparent areas look frosted/blurred, not simply faded.
