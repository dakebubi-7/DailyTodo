# DailyTodo Task Area Visual Refinement Design

Date: 2026-06-29

## Goal

Refine the current DailyTodo task area without creating a new theme. The change should keep the existing cool gray-blue, frosted-glass direction while making the task list feel lighter, more unified, and less visually hard.

## Scope

In scope:

- Task toolbar/search/filter visual weight.
- Daily tab visual weight where it affects the task area hierarchy.
- Task card surface, border, shadow, and hover states.
- Collapsed child-task stack rear-card styling.
- Light and dark mode parity for the same elements.
- Existing verification script updates if visual constants change.

Out of scope:

- Adding a new theme preset.
- Changing layout structure or task behavior.
- Changing task data, persistence, drag behavior, context menus, or completion flow.
- Reworking typography or global app shell styling beyond local task-area harmony.

## Chosen Direction

Use the "misty main content" direction:

- Supporting controls become softer and flatter.
- Main task cards remain the clearest content surface.
- Collapsed stack cards remain visible but lose the current dark/hard outline.
- Shadows should be soft ambient elevation, not strong outlines.

## Design Details

### Toolbar and filters

The task toolbar should read as a light container rather than a heavy card. Its border should be lower contrast, background slightly more translucent, and any shadow should be subtle or removed. Inner controls should avoid nested heavy shadows and use consistent radius with the toolbar.

Active filter/search states should remain clear through accent color and contrast, not through heavy elevation.

### Tabs

The selected daily tab should still be obvious, but the tab row should not compete with task cards. Use a lighter selected background, a subtle bottom indicator or surface contrast, and reduced shadow.

### Task cards

Main task cards should be slightly more opaque than supporting controls, with a soft hairline border and low ambient shadow. Hover may lift by 1px, but the visual change should remain restrained.

The task cards should continue to satisfy touch and readability requirements: no smaller controls, no reduced contrast for task text, and no layout shifts.

### Collapsed stack cards

Rear stack layers should remain full-card silhouettes, but their borders should use a light hairline. Their opacity and shadow should create depth without producing a black line at the bottom. Offsets and scale can remain close to the existing 8px / 16px cascade unless needed for visual balance.

### Dark mode

Dark mode should get equivalent softening: borders should be visible but not harsh, surfaces should remain readable, and hover/active states should stay distinguishable.

## Testing and Verification

- Run the existing task-cluster stack verification script.
- If CSS assertions are intentionally changed, update the script to assert the new softer visual rules.
- Prefer a quick real-app visual check if time allows.

## Non-goals and Risks

The main risk is making everything too flat, causing the task cards to lose hierarchy. To avoid that, supporting controls should be softened more than task cards, and task cards should keep a slightly clearer surface.
