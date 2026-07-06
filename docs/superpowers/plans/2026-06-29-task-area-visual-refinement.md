# Task Area Visual Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the current DailyTodo task area softer, more misty, and visually unified without adding a new theme.

**Architecture:** Keep the existing React component structure unchanged. Implement the refinement through focused CSS token/value adjustments in `app/src/styles/globals.css`, and update the existing static verification script so the intended softer task-stack rules are checked automatically.

**Tech Stack:** Electron app, React, TypeScript, CSS, existing `tsx` verification script.

---

## File Structure

- Modify `app/scripts/verify-task-cluster-stack.ts`: update static assertions for the softer rear-card stack border/background/shadow rules.
- Modify `app/src/styles/globals.css`: tune toolbar, tab switch, task card, main cluster card, and faux stack-layer CSS.

## Task 1: Update visual assertions first

**Files:**
- Modify: `app/scripts/verify-task-cluster-stack.ts`

- [ ] **Step 1: Replace the rear-card stack assertions**

Change the existing assertions for `.task-stack-layer.task-cluster-faux-card`, `.dark .task-stack-layer.task-cluster-faux-card`, `.task-stack-layer-2`, and `.task-stack-layer-3` so they expect:

```ts
assert(getCssBlock(globals, '.task-stack-layer.task-cluster-faux-card').includes('background: rgba(255, 255, 255, 0.58) !important;'), 'Rear faux cards should use a misty translucent surface.');
assert(getCssBlock(globals, '.task-stack-layer.task-cluster-faux-card').includes('border: 1px solid rgba(76, 91, 112, 0.09) !important;'), 'Rear faux cards should use a soft low-contrast hairline.');
assert(getCssBlock(globals, '.task-stack-layer.task-cluster-faux-card').includes('box-shadow: 0 8px 22px rgba(54, 68, 88, 0.045) !important;'), 'Rear faux cards should use soft ambient depth instead of hard outlines.');
assert(getCssBlock(globals, '.dark .task-stack-layer.task-cluster-faux-card').includes('background: rgba(255, 255, 255, 0.075) !important;'), 'Dark rear faux cards should stay visible but subdued.');
assert(getCssBlock(globals, '.dark .task-stack-layer.task-cluster-faux-card').includes('border-color: rgba(148, 163, 184, 0.11) !important;'), 'Dark rear faux cards should use a subdued hairline.');
assert(getCssBlock(globals, '.dark .task-stack-layer.task-cluster-faux-card').includes('box-shadow: 0 10px 24px rgba(0, 0, 0, 0.16) !important;'), 'Dark rear faux cards should use soft ambient depth.');
assert(globals.includes('.task-stack-layer-2') && globals.includes('opacity: 0.78;'), 'Layer 2 should remain visible without producing a dark edge.');
assert(globals.includes('.task-stack-layer-3') && globals.includes('opacity: 0.58;'), 'Layer 3 should recede softly as the deeper rear card.');
```

- [ ] **Step 2: Run the verification script and confirm it fails**

Run: `cd app && npm run verify:task-cluster-stack`

Expected: FAIL because CSS still has the old rear-card visual rules.

## Task 2: Apply the misty task-area CSS refinement

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Soften the daily tab switch**

Set `.daily-panel-switch`, `.daily-panel-tab-active`, and dark equivalents to lower-contrast surfaces and borders:

```css
.daily-panel-switch {
  border: 1px solid rgba(76, 91, 112, 0.08);
  background: rgba(255, 255, 255, 0.58);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.58);
}

.daily-panel-tab-active {
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 4px 12px rgba(54, 68, 88, 0.055);
}

.dark .daily-panel-switch {
  border-color: rgba(148, 163, 184, 0.12);
  background: rgba(15, 23, 42, 0.42);
}

.dark .daily-panel-tab-active {
  background: rgba(255, 255, 255, 0.09);
  color: #e5e7eb;
  box-shadow: none;
}
```

- [ ] **Step 2: Soften toolbar and controls**

Set `.task-toolbar`, `.task-filter-button`, `.task-filter-select`, `.task-clear-filter`, `.task-clear-completed`, `.task-search-input`, and dark equivalents to lower-contrast misty surfaces. Keep active filter states high-contrast via accent fill.

- [ ] **Step 3: Make main task cards clearer than supporting controls**

Set `.task-card`, `.task-card:hover`, `.dark .task-card`, `.dark .task-card:hover`, `.task-cluster-main-card.task-card`, and `.dark .task-cluster-main-card.task-card` to use slightly clearer surfaces than the toolbar, soft hairline borders, and low ambient shadows.

- [ ] **Step 4: Soften collapsed stack rear cards**

Set `.task-stack-layer.task-cluster-faux-card`, `.dark .task-stack-layer.task-cluster-faux-card`, `.task-stack-layer-2`, and `.task-stack-layer-3` to the exact values asserted in Task 1.

- [ ] **Step 5: Run verification script and confirm it passes**

Run: `cd app && npm run verify:task-cluster-stack`

Expected: PASS with `Task cluster stack verification passed`.

## Task 3: Final check

**Files:**
- Read-only check: `app/src/styles/globals.css`

- [ ] **Step 1: Inspect the changed CSS blocks**

Confirm no task behavior selectors, layout grid, ARIA, drag, completion, edit, or context-menu logic changed.

- [ ] **Step 2: Report result**

Tell the user exactly what changed and whether the verification script passed.
