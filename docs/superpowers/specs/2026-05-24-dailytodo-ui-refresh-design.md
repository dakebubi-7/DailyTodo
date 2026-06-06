# DailyTodo UI Refresh Design

## Goal

Redesign the DailyTodo interface into a calm, professional desktop workspace with higher visual clarity, lighter decoration, and a more disciplined layout.

## Chosen Direction

Use an **extreme minimal professional** style with a restrained color system:

- Keep **forest green** as the main brand accent.
- Keep **gold** as a secondary highlight only.
- Push most surfaces, separators, and text hierarchy into grayscale.
- Keep the interface balanced in density: efficient, but not cramped.

## Visual Principles

- One screen, one job.
- Controls should read as tools, not ornaments.
- Depth should come from spacing, contrast, and hierarchy more than blur or shadow.
- The app should feel quiet, precise, and dependable.

## Color System

### Core Tokens

- Background: warm off-white / soft gray-white
- Surface: white or near-white
- Border: light neutral gray
- Primary text: charcoal
- Secondary text: muted gray
- Accent: forest green
- Secondary accent: muted gold

### Usage Rules

- Forest green is used for active states, primary actions, selected views, and progress accents.
- Gold is used sparingly for emphasis, completion moments, and secondary highlights.
- Large areas should never be dominated by gold.
- Avoid heavy mixed-hue gradients.
- Dark mode should mirror the same discipline, with neutral surfaces and a single accent path.

## Typography

- Keep `DM Sans` for body and controls.
- Keep `Playfair Display` only for the brand title if it still fits the new tone.
- Reduce decorative tension in headings.
- Use tighter, cleaner heading sizes in panels and toolbars.
- Body copy should remain readable at small window sizes.

## Layout

### Window Structure

- Top title bar: slim, functional, and mostly neutral.
- Header: compact brand block on the left, action buttons on the right.
- Daily capture area: collapsible and secondary, not louder than the task list.
- Main task list: the visual and functional center of the app.

### Density Rules

- Keep moderate density, not a sparse editorial layout.
- Preserve efficient scanning for tasks, filters, and progress.
- Avoid oversized whitespace between controls.
- Reserve extra breathing room only around major section boundaries.

## Components

### TitleBar

- Minimal height.
- Window controls should look like native utility controls.
- Mode and settings actions should remain compact and visually subordinate.

### Header

- Brand block should be simple and quiet.
- Action buttons should use a consistent icon style and compact sizing.
- Obsidian / note actions should not overpower the task workflow.

### Daily Panels

- Work and inspiration inputs should stay collapsed by default when content is not being edited.
- The collapsed row should read as a tool strip, not a card stack.
- Expand only when the user clicks.

### Task Toolbar

- Search, open-only, and priority controls should feel like one coherent utility row.
- Filters should be easy to scan and easy to clear.
- Avoid visual noise from too many separate button treatments.

### Task Items

- Tasks should feel like work entries, not decorative cards.
- Priority indicator should be small and controlled.
- Completion, review, edit, and delete actions should remain clear but visually restrained.
- Hover reveal is allowed, but the default resting state should stay calm.

## Surface And Depth

- Use flatter surfaces than the current version.
- Reduce blur intensity and heavy glass effects.
- Keep borders thin and consistent.
- Use shadow only to separate layers that truly need separation.

## Motion

- Use short, functional transitions only.
- Prioritize clarity over flourish.
- Keep expand/collapse, selection, and task changes smooth but not bouncy.
- Avoid motion that makes the UI feel playful or ornamental.

## Responsive Behavior

- Preserve small-window usability first.
- Compact layouts should collapse nonessential labels before shrinking targets too far.
- Buttons must remain tappable and readable at narrow widths.
- Long labels should truncate cleanly without breaking row rhythm.

## Accessibility

- Maintain good text contrast in light and dark modes.
- Keep focus states visible.
- Preserve accessible labels for icon-only controls.
- Do not rely on color alone for meaning.

## Implementation Scope

This refresh should change the visual system without changing core app behavior.

In scope:

- color palette
- spacing and density
- borders and shadows
- button and toolbar styling
- panel hierarchy
- task item polish
- dark mode alignment

Out of scope:

- storage logic
- task inheritance behavior
- Obsidian sync behavior
- new features or workflow changes

## Validation

The refreshed UI should satisfy these checks:

- The app looks more minimal and professional at a glance.
- The brand still feels like DailyTodo.
- The task list remains the primary focus.
- Top controls no longer feel crowded.
- The work/inspiration inputs feel secondary but easy to use.
- The app remains usable at small window sizes.
- Light and dark modes stay visually consistent.

