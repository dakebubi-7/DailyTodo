# Invisible Focus Glass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the invisible theme's return-to-today control and Today Focus execution zone use the approved, extremely light glass treatment.

**Architecture:** Append only theme-scoped CSS overrides after the existing Today Focus rules in `globals.css`, so base layouts and other theme styling stay unchanged. Add one static verifier that asserts the exact low-opacity values and selectors, then include it in the existing UI-feedback verification command.

**Tech Stack:** React, CSS, TypeScript (`tsx`) verification scripts, npm.

---

### Task 1: Lock The Theme Contract With A Failing Verifier

**Files:**
- Modify: `scripts/verify-ui-feedback-regressions.ts`
- Test: `npm run verify:ui-feedback-regressions`

- [x] **Step 1: Add a failing assertion for the approved invisible-theme focus surfaces**

```ts
expectIncludes(globals, ".app-shell[data-theme='invisible'] .date-today-button {\n  border-color: rgba(0, 0, 0, 0.12) !important;\n  background: rgba(0, 0, 0, 0.09) !important;", 'Invisible light return-to-today should use the approved quiet glass surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] .today-focus-execution-zone {\n  border-color: rgba(255, 255, 255, 0.13);\n  background: rgba(255, 255, 255, 0.20);\n  box-shadow: inset 0 1px rgba(255, 255, 255, 0.10);", 'Invisible dark Today Focus should use the approved extremely light glass surface.');
expectIncludes(globals, ".dark .app-shell[data-theme='invisible'] :is(.today-focus-adjust, .today-focus-state-select, .today-focus-blocker-input) {\n  border-color: rgba(255, 255, 255, 0.12);\n  background: rgba(255, 255, 255, 0.12);", 'Invisible dark Today Focus controls should use the approved quiet glass surface.');
```

- [x] **Step 2: Run the verifier to confirm it fails for the missing theme treatment**

Run: `npm run verify:ui-feedback-regressions`

Expected: FAIL identifying the missing invisible-theme Today Focus surface declaration.

### Task 2: Apply The Approved Invisible-Theme Surfaces

**Files:**
- Modify: `src/styles/globals.css` after line 13172
- Test: `npm run verify:ui-feedback-regressions`

- [x] **Step 1: Add the light and dark scoped surface overrides**

```css
.app-shell[data-theme='invisible'] .date-today-button {
  border-color: rgba(0, 0, 0, 0.12) !important;
  background: rgba(0, 0, 0, 0.09) !important;
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.10) !important;
}

.dark .app-shell[data-theme='invisible'] .today-focus-execution-zone {
  border-color: rgba(255, 255, 255, 0.13);
  background: rgba(255, 255, 255, 0.20);
  box-shadow: inset 0 1px rgba(255, 255, 255, 0.10);
}

.app-shell[data-theme='invisible'] :is(.today-focus-adjust, .today-focus-state-select, .today-focus-blocker-input) {
  border-color: rgba(0, 0, 0, 0.12);
  background: rgba(0, 0, 0, 0.12);
}

.dark .app-shell[data-theme='invisible'] :is(.today-focus-adjust, .today-focus-state-select, .today-focus-blocker-input) {
  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.12);
}
```

Keep the existing text and focus-outline rules unchanged.

- [x] **Step 2: Run the focused verifier to confirm it passes**

Run: `npm run verify:ui-feedback-regressions`

Expected: PASS with `verify-ui-feedback-regressions passed`.

### Task 3: Validate The Project Integration

**Files:**
- Modify: `src/styles/globals.css`
- Modify: `scripts/verify-ui-feedback-regressions.ts`

- [x] **Step 1: Run type checking**

Run: `npm run typecheck`

Expected: PASS with TypeScript completing without diagnostics.

- [x] **Step 2: Run linting**

Run: `npm run lint`

Expected: PASS with no ESLint errors.

- [x] **Step 3: Inspect the final CSS diff**

Run: `git diff --check && git diff -- src/styles/globals.css scripts/verify-ui-feedback-regressions.ts`

Expected: no whitespace errors and only invisible-theme focus-glass styling plus its verifier.

- [ ] **Step 4: Commit the implementation**

```bash
git add src/styles/globals.css scripts/verify-ui-feedback-regressions.ts docs/superpowers/plans/2026-07-27-invisible-focus-glass-implementation.md
git commit -m "style: lighten invisible focus glass"
```
