# Invisible Theme Unified Transparency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the remaining black block surfaces from the Invisible theme while keeping daily task edit inputs and completion-review inputs black-gray for readability.

**Architecture:** Add one final, theme-scoped CSS override block at the end of `app/src/styles/globals.css` so it wins over the existing layered Invisible theme rules. Update the existing static verifier to lock the user-visible contract: main Invisible-theme surfaces are transparent/unified, while daily task edit controls and completion dialog fields remain black-gray. No React behavior or data flow changes are needed.

**Tech Stack:** Electron + React + TypeScript + CSS, with static `tsx` verification scripts run through npm.

---

## File Structure

- Modify: `app/scripts/verify-task-layout-unified-glass.ts`
  - Responsibility: static regression test for task layout and glass styling. Add assertions for the new Invisible-theme final override contract.
- Modify: `app/src/styles/globals.css`
  - Responsibility: global app styling and theme overrides. Append a final `.theme-invisible` scoped block that removes black blocks from main surfaces and restores black-gray styling only for task edit inputs and completion-review controls.

No new files are needed.

---

### Task 1: Add Static Regression Assertions

**Files:**
- Modify: `app/scripts/verify-task-layout-unified-glass.ts:105-111`

- [ ] **Step 1: Add failing assertions for the Invisible theme contract**

In `app/scripts/verify-task-layout-unified-glass.ts`, insert the following block immediately after the existing assertion that starts with:

```ts
assert.ok(
  globals.includes('.add-task-input,\n.dark .add-task-input,\n.theme-neumorphism .add-task-input,\n.theme-invisible .add-task-input'),
  'Add-task input should be included in the frosted-glass cleanup, including the invisible theme.',
);
```

Insert this exact code:

```ts
assert.ok(
  globals.includes('/* Invisible theme final unified transparency override: remove main-surface black blocks while keeping editing surfaces black-gray. */'),
  'Invisible theme should have a final override documenting unified transparency and black-gray edit exceptions.',
);
assert.ok(
  globals.includes('.theme-invisible .date-card,\n.theme-invisible .date-stepper,\n.theme-invisible .daily-panel-switch,\n.theme-invisible .tabbar,\n.theme-invisible .task-toolbar,\n.theme-invisible .task-card,\n.theme-invisible .daily-work-preview,\n.theme-invisible .add-task'),
  'Invisible theme final override should target the main surfaces that were drawing separate black blocks.',
);
assert.ok(
  globals.includes('background-color: transparent !important;\n  background-image: none !important;'),
  'Invisible theme main surfaces should be forced transparent so they share one unified glass layer.',
);
assert.ok(
  globals.includes('.theme-invisible .task-card:hover,\n.theme-invisible .date-stepper button:hover,\n.theme-invisible .date-calendar-button:hover,\n.theme-invisible .daily-panel-tab:hover,\n.theme-invisible .tabbar button:hover,\n.theme-invisible .daily-work-preview:hover'),
  'Invisible theme hover feedback should stay subtle without reintroducing black blocks.',
);
assert.ok(
  globals.includes('background: rgba(255, 255, 255, calc(var(--control-opacity) * 0.16)) !important;'),
  'Invisible theme hover feedback should use a light translucent layer instead of black fills.',
);
assert.ok(
  globals.includes('.theme-invisible .add-task-input,\n.theme-invisible .task-edit-input'),
  'Invisible theme should explicitly keep daily task add/edit inputs as readable black-gray exceptions.',
);
assert.ok(
  globals.includes('background: rgba(18, 20, 24, calc(0.42 + var(--input-opacity) * 0.28)) !important;'),
  'Invisible theme daily task inputs should use a black-gray background tied to the input opacity variable.',
);
assert.ok(
  globals.includes('.theme-invisible .completion-dialog,\n.theme-invisible .completion-field,\n.theme-invisible .completion-field select,\n.theme-invisible .completion-field textarea'),
  'Invisible theme should explicitly keep completion-review dialog and fields black-gray.',
);
assert.ok(
  globals.includes('background: rgba(18, 20, 24, calc(0.5 + var(--dialog-opacity) * 0.26)) !important;'),
  'Invisible theme completion dialog should use a black-gray background tied to the dialog opacity variable.',
);
assert.ok(
  globals.includes('background: rgba(24, 27, 32, calc(0.5 + var(--input-opacity) * 0.22)) !important;'),
  'Invisible theme completion fields should use readable black-gray input surfaces.',
);
```

- [ ] **Step 2: Run the new assertions and verify they fail**

Run from the repository root:

```bash
cd app && npm run verify:task-layout-unified-glass
```

Expected result: FAIL. The failure message should mention the missing final override documentation, for example:

```text
Invisible theme should have a final override documenting unified transparency and black-gray edit exceptions.
```

If the command passes before CSS changes, stop and inspect whether the CSS override already exists; do not continue with duplicate CSS.

- [ ] **Step 3: Commit the failing verifier**

Only commit if the user has explicitly authorized commits for this task. If commits are not authorized, skip this step and continue with the implementation.

```bash
git add app/scripts/verify-task-layout-unified-glass.ts
git commit -m "test: cover invisible theme transparency exceptions"
```

---

### Task 2: Add the Invisible Theme Final Override

**Files:**
- Modify: `app/src/styles/globals.css` at end of file

- [ ] **Step 1: Append the final CSS override**

Append this exact block to the end of `app/src/styles/globals.css`, after all existing CSS:

```css
/* Invisible theme final unified transparency override: remove main-surface black blocks while keeping editing surfaces black-gray. */
.theme-invisible .date-card,
.theme-invisible .date-stepper,
.theme-invisible .daily-panel-switch,
.theme-invisible .tabbar,
.theme-invisible .task-toolbar,
.theme-invisible .task-card,
.theme-invisible .daily-work-preview,
.theme-invisible .add-task,
.dark .theme-invisible .date-card,
.dark .theme-invisible .date-stepper,
.dark .theme-invisible .daily-panel-switch,
.dark .theme-invisible .tabbar,
.dark .theme-invisible .task-toolbar,
.dark .theme-invisible .task-card,
.dark .theme-invisible .daily-work-preview,
.dark .theme-invisible .add-task {
  background-color: transparent !important;
  background-image: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.theme-invisible .date-card,
.theme-invisible .task-toolbar,
.theme-invisible .daily-panel-switch,
.theme-invisible .daily-work-preview,
.dark .theme-invisible .date-card,
.dark .theme-invisible .task-toolbar,
.dark .theme-invisible .daily-panel-switch,
.dark .theme-invisible .daily-work-preview {
  border-color: rgba(255, 255, 255, calc(var(--control-opacity) * 0.18)) !important;
}

.theme-invisible .date-stepper,
.dark .theme-invisible .date-stepper {
  border-color: rgba(255, 255, 255, calc(var(--control-opacity) * 0.16)) !important;
}

.theme-invisible .date-today-button,
.dark .theme-invisible .date-today-button {
  border-color: rgba(255, 255, 255, calc(var(--control-opacity) * 0.14)) !important;
}

.theme-invisible .task-card,
.dark .theme-invisible .task-card {
  border: none !important;
}

.theme-invisible .task-card:hover,
.theme-invisible .date-stepper button:hover,
.theme-invisible .date-calendar-button:hover,
.theme-invisible .daily-panel-tab:hover,
.theme-invisible .tabbar button:hover,
.theme-invisible .daily-work-preview:hover,
.dark .theme-invisible .task-card:hover,
.dark .theme-invisible .date-stepper button:hover,
.dark .theme-invisible .date-calendar-button:hover,
.dark .theme-invisible .daily-panel-tab:hover,
.dark .theme-invisible .tabbar button:hover,
.dark .theme-invisible .daily-work-preview:hover {
  background: rgba(255, 255, 255, calc(var(--control-opacity) * 0.16)) !important;
  box-shadow: none !important;
  transform: none !important;
}

.theme-invisible .daily-panel-tab-active,
.theme-invisible .tabbar button.font-semibold,
.theme-invisible .tabbar button[class*="font-semibold"],
.theme-invisible .task-tool-active,
.theme-invisible .task-filter-active,
.dark .theme-invisible .daily-panel-tab-active,
.dark .theme-invisible .tabbar button.font-semibold,
.dark .theme-invisible .tabbar button[class*="font-semibold"],
.dark .theme-invisible .task-tool-active,
.dark .theme-invisible .task-filter-active {
  background: rgba(255, 255, 255, calc(var(--control-opacity) * 0.22)) !important;
  border-color: rgba(255, 255, 255, calc(var(--control-opacity) * 0.24)) !important;
  color: rgba(255, 255, 255, 0.95) !important;
}

.theme-invisible .task-toolbar input,
.theme-invisible .task-toolbar button,
.theme-invisible .task-toolbar select,
.theme-invisible .task-tool-icon,
.theme-invisible .task-filter-button,
.theme-invisible .task-filter-select,
.theme-invisible .task-clear-filter,
.theme-invisible .task-search-input,
.dark .theme-invisible .task-toolbar input,
.dark .theme-invisible .task-toolbar button,
.dark .theme-invisible .task-toolbar select,
.dark .theme-invisible .task-tool-icon,
.dark .theme-invisible .task-filter-button,
.dark .theme-invisible .task-filter-select,
.dark .theme-invisible .task-clear-filter,
.dark .theme-invisible .task-search-input {
  background: rgba(255, 255, 255, calc(var(--control-opacity) * 0.14)) !important;
  border-color: rgba(255, 255, 255, calc(var(--control-opacity) * 0.18)) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.theme-invisible .task-toolbar input::placeholder,
.theme-invisible .task-search-input::placeholder,
.dark .theme-invisible .task-toolbar input::placeholder,
.dark .theme-invisible .task-search-input::placeholder {
  color: rgba(255, 255, 255, 0.52) !important;
}

.theme-invisible .add-task-input,
.theme-invisible .task-edit-input,
.dark .theme-invisible .add-task-input,
.dark .theme-invisible .task-edit-input {
  background: rgba(18, 20, 24, calc(0.42 + var(--input-opacity) * 0.28)) !important;
  border-color: rgba(255, 255, 255, 0.16) !important;
  color: rgba(255, 255, 255, 0.94) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
  backdrop-filter: blur(calc(var(--blur-strength) * 0.65)) saturate(var(--glass-saturation)) !important;
  -webkit-backdrop-filter: blur(calc(var(--blur-strength) * 0.65)) saturate(var(--glass-saturation)) !important;
}

.theme-invisible .add-task-input::placeholder,
.dark .theme-invisible .add-task-input::placeholder {
  color: rgba(255, 255, 255, 0.46) !important;
}

.theme-invisible .add-task-input:focus,
.theme-invisible .task-edit-input:focus,
.dark .theme-invisible .add-task-input:focus,
.dark .theme-invisible .task-edit-input:focus {
  background: rgba(18, 20, 24, calc(0.5 + var(--input-opacity) * 0.3)) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 0 2px rgba(255, 255, 255, 0.08) !important;
}

.theme-invisible .source-toggle-button,
.theme-invisible .priority-dot-button,
.theme-invisible .add-task-button,
.dark .theme-invisible .source-toggle-button,
.dark .theme-invisible .priority-dot-button,
.dark .theme-invisible .add-task-button {
  background: rgba(255, 255, 255, calc(var(--control-opacity) * 0.14)) !important;
  border-color: rgba(255, 255, 255, calc(var(--control-opacity) * 0.18)) !important;
  color: rgba(255, 255, 255, 0.9) !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

.theme-invisible .source-toggle-button:hover,
.theme-invisible .priority-dot-button:hover,
.theme-invisible .add-task-button:hover,
.dark .theme-invisible .source-toggle-button:hover,
.dark .theme-invisible .priority-dot-button:hover,
.dark .theme-invisible .add-task-button:hover {
  background: rgba(255, 255, 255, calc(var(--control-opacity) * 0.24)) !important;
}

.theme-invisible .completion-dialog,
.dark .theme-invisible .completion-dialog {
  background: rgba(18, 20, 24, calc(0.5 + var(--dialog-opacity) * 0.26)) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: rgba(255, 255, 255, 0.94) !important;
  box-shadow: 0 18px 52px rgba(0, 0, 0, 0.32) !important;
  backdrop-filter: blur(24px) saturate(var(--glass-saturation)) !important;
  -webkit-backdrop-filter: blur(24px) saturate(var(--glass-saturation)) !important;
}

.theme-invisible .completion-field,
.theme-invisible .completion-field select,
.theme-invisible .completion-field textarea,
.dark .theme-invisible .completion-field,
.dark .theme-invisible .completion-field select,
.dark .theme-invisible .completion-field textarea {
  background: rgba(24, 27, 32, calc(0.5 + var(--input-opacity) * 0.22)) !important;
  border-color: rgba(255, 255, 255, 0.14) !important;
  color: rgba(255, 255, 255, 0.94) !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
}

.theme-invisible .completion-field textarea::placeholder,
.dark .theme-invisible .completion-field textarea::placeholder {
  color: rgba(255, 255, 255, 0.44) !important;
}

.theme-invisible .completion-field select option,
.dark .theme-invisible .completion-field select option {
  background: #181b20 !important;
  color: #fff !important;
}
```

- [ ] **Step 2: Run the targeted verifier and confirm it passes**

Run:

```bash
cd app && npm run verify:task-layout-unified-glass
```

Expected result: PASS with:

```text
verify-task-layout-unified-glass passed
```

- [ ] **Step 3: Commit the CSS implementation**

Only commit if the user has explicitly authorized commits for this task. If commits are not authorized, skip this step and continue verification.

```bash
git add app/src/styles/globals.css
git commit -m "fix: unify invisible theme transparency"
```

---

### Task 3: Run Full Relevant Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run opacity verifier**

Run:

```bash
cd app && npm run verify:frosted-glass-opacity
```

Expected result: PASS. The script should complete without assertion errors.

- [ ] **Step 2: Run task layout verifier**

Run:

```bash
cd app && npm run verify:task-layout-unified-glass
```

Expected result:

```text
verify-task-layout-unified-glass passed
```

- [ ] **Step 3: Run task interaction verifier**

Run:

```bash
cd app && npm run verify:task-list-interactions
```

Expected result:

```text
Task list interactions verification passed
```

- [ ] **Step 4: Run TypeScript typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected result: PASS with no TypeScript errors.

- [ ] **Step 5: Optional visual smoke check**

If an interactive app run is available, launch the app and switch to the Invisible theme. Confirm visually:

- Date card, tab bar, daily panel switch, search/filter toolbar, task cards, daily work preview, and bottom add-task bar do not draw separate black blocks.
- Bottom daily task input is black-gray and readable.
- Double-click a task title to edit; the inline task edit input is black-gray and readable.
- Complete a task or open completion review; the completion dialog and its fields are black-gray and readable.

Run:

```bash
cd app && npm run dev
```

Expected result: Electron opens without build errors and the Invisible theme matches the visual checks above.

---

## Self-Review

- Spec coverage: Task 1 locks the behavior in tests. Task 2 implements unified transparent main surfaces and preserves black-gray task edit/completion inputs. Task 3 verifies opacity controls, task layout, interactions, and TypeScript.
- Placeholder scan: no TBD/TODO/implement-later instructions. Optional visual smoke check is explicit and non-blocking because it depends on interactive app availability.
- Type consistency: only CSS and existing verifier strings are touched; no new TypeScript types or runtime functions are introduced.
