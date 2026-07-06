# DailyTodo Collapsed Task Stack Segments Design

Date: 2026-07-03

## Goal

Replace the current collapsed child-task stack silhouette with a segmented stack base that reads as clear, equal-height layers instead of overlapping full-card rear layers.

The result should make collapsed parent tasks communicate child count more clearly while keeping the main task card visually stable.

## Scope

In scope:

- Collapsed parent-task stack visuals.
- Layer-count mapping from direct subtask count to visible stack segments.
- Stack-shell reserved height and spacing relative to the next task row.
- Removal of black outline treatment from stack layers.
- Verification script updates for the new segmented rules.

Out of scope:

- Expanded subtask layout.
- Task data shape, persistence, or collapse behavior.
- Drag behavior, completion behavior, or context menus.
- Global task-card styling outside the collapsed stack area.

## Chosen Direction

Use a segmented stack base instead of rendering full rear faux cards.

This means the main task remains the only full visible card. Beneath it, collapsed tasks render one to three equal-height exposed segments that act as a visual base. The segment count follows the number of direct subtasks, capped at three.

This direction was chosen because it is the most reliable way to satisfy the user requirements simultaneously:

- the main task card remains opaque,
- the visible stack reads as distinct equal-height layers,
- total exposed height shrinks to match the actual child count,
- lower tasks no longer visually swallow the stack,
- depth comes from shadow rather than dark borders.

## Design Details

### Structure

Collapsed stack rendering should no longer depend on full-height rear-card silhouettes. Instead, `TaskItem.tsx` should render a dedicated segmented stack container beneath the main task card.

The container should render:

- 1 visible segment for 1 direct subtask,
- 2 visible segments for 2 direct subtasks,
- 3 visible segments for 3 or more direct subtasks.

Each segment is decorative only and must be `aria-hidden`.

### Segment geometry

The exposed stack height is determined by segment count.

Rules:

- 1 child: total exposed height = 1 segment height.
- 2 children: total exposed height = 2 segment heights.
- 3 or more children: total exposed height = 3 segment heights.
- Each visible segment must be exactly the same height.
- Segments must appear as strict equal-height bands rather than loosely overlapped cards.

The stack shell must reserve exactly the amount of bottom space needed for the visible segment count so the next main task starts below the stack instead of covering it.

### Main card treatment

The main task card must remain visually opaque and must not inherit translucent rear-layer styling.

The collapsed parent main card should continue to use the normal task-card surface treatment already used elsewhere in the task list. The segmented base is the only decorative collapsed-stack treatment.

### Visual styling

Segments should not use black outline edges.

Instead:

- borders should be removed or reduced to a nearly invisible hairline,
- depth should come from soft shadow separation,
- each deeper segment may be slightly softer or dimmer than the one above it,
- width may step in slightly per segment to reinforce depth, but height must remain equal.

The target impression is layered paper or stacked panels, not multiple full cards.

### Spacing with following tasks

The next task row must begin after the segmented base ends. This is a layout requirement, not just a visual preference.

The previous implementation risked either:

- exposing too little height so the stack looked like one layer, or
- exposing too much height so the stack looked like several full cards.

The segmented base should solve both by tying shell spacing directly to segment count and fixed segment height.

### Motion

Collapsed stack segments may fade in and out, but they should not use transform animation that changes their height math or overrides the CSS geometry.

Opacity-only motion is preferred here because the geometry itself carries the meaning.

### Dark mode

Dark mode should preserve the same structure:

- opaque main card,
- equal-height exposed segments,
- no black border line,
- separation driven by soft shadow and subtle surface contrast.

The dark version should remain readable and should not flatten into a single dark slab.

## Testing and Verification

Update the existing stack verification so it asserts the segmented-base approach rather than full-height rear-card overlap.

The verifier should check at least:

- collapsed stacks render segment elements rather than preview rows,
- visible count is based on direct subtask count capped at three,
- segment height rules are equal across visible layers,
- shell reserved height matches segment-count-based exposure,
- motion does not override segment geometry,
- collapsed main card remains on the normal opaque task-card treatment,
- stack styling does not rely on a visible dark border line.

A real-app visual pass should confirm:

- 2 subtasks shows exactly 2 equal exposed bands,
- 3 subtasks shows exactly 3 equal exposed bands,
- the next task starts below the exposed bands,
- the main card is not translucent.

## Risks and Non-goals

The main risk is producing something that is mathematically equal but still visually muddy. To avoid that, the implementation must keep segment separation simple: equal heights, restrained shadows, and no competing border treatment.

Another risk is overfitting the effect to one theme. The segmented structure must remain legible in both light and dark modes without introducing theme-specific hacks.
