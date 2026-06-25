# Titlebar Active Contrast Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the `置顶 / 锁定 / 设置` buttons in the minimal dark theme clearly read as selected when active, without changing layout, size, or other themes.

**Architecture:** Keep the change theme-scoped and CSS-only. First tighten the existing regression verifier so it fails until a dedicated `minimal + dark` active-state override exists, then add one focused override in `app/src/styles/globals.css` that strengthens border contrast, icon contrast, and very subtle highlight depth only for `.titlebar-actions-primary .titlebar-icon-active`.

**Tech Stack:** Electron, React, TypeScript, CSS, `tsx` verifier scripts.

---

## File Map

- Modify: `app/scripts/verify-ui-feedback-regressions.ts`
  - Extend the existing UI regression verifier so it checks for a dedicated minimal-dark titlebar active-state rule and confirms it stays scoped to the three primary titlebar action buttons.
- Modify: `app/src/styles/globals.css`
  - Add a final theme-scoped override for `.dark .app-shell[data-theme='minimal'] .titlebar-actions-primary .titlebar-icon-active`.
- Reference: `app/src/components/TitleBar.tsx`
  - Confirms the target buttons already use `titlebar-icon-active` and are grouped under `.titlebar-actions-primary`; no code change expected here.

## Task 1: Tighten the UI regression verifier first

**Files:**
- Modify: `app/scripts/verify-ui-feedback-regressions.ts`
- Reference: `app/src/components/TitleBar.tsx`
- Test: `app/scripts/verify-ui-feedback-regressions.ts`

- [ ] **Step 1: Write the failing test expectation**

Add these assertions near the existing minimal/invisible/neumorphism theme assertions:

```ts
expectIncludes(globals, ".dark .app-shell[data-theme='minimal'] .titlebar-actions-primary .titlebar-icon-active {", 'Minimal dark theme should have a dedicated titlebar active-state override for the three primary titlebar buttons.');
expectIncludes(globals, 'border-color: rgba(255, 255, 255, 0.42) !important;', 'Minimal dark titlebar active buttons should use a stronger selected border than the generic hover state.');
expectIncludes(globals, 'background: rgba(255, 255, 255, 0.12) !important;', 'Minimal dark titlebar active buttons should keep a restrained dark-theme fill instead of a heavy pill.');
expectIncludes(globals, 'color: #ffffff !important;', 'Minimal dark titlebar active buttons should brighten the icon to pure white.');
expectIncludes(globals, 'box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.06) !important;', 'Minimal dark titlebar active buttons should use subtle inner and outer highlights for clearer selected-state contrast.');
```

- [ ] **Step 2: Run the verifier to confirm it fails for the expected reason**

Run:

```bash
cd /g/Personal-AI/DailyTodo/.claude/worktrees/theme-ai-feedback/app && npm run verify:ui-feedback-regressions
```

Expected: `FAIL` with an assertion mentioning `dedicated titlebar active-state override` or one of the new minimal-dark active-state expectations.

- [ ] **Step 3: Keep the selector narrowly scoped**

Do **not** broaden the test to `.titlebar-icon-active` globally. The selector must stay limited to:

```ts
".dark .app-shell[data-theme='minimal'] .titlebar-actions-primary .titlebar-icon-active {"
```

That scope ensures the override affects only the three primary buttons (`置顶 / 锁定 / 设置`) and not the `more` menu toggle, minimize button, or close button.

## Task 2: Add the minimal-dark active-state override

**Files:**
- Modify: `app/src/styles/globals.css`
- Test: `app/scripts/verify-ui-feedback-regressions.ts`

- [ ] **Step 1: Add the final CSS override**

Append this block after the existing minimal/invisible/neumorphism dark titlebar button rules so it wins in the cascade while staying theme-scoped:

```css
.dark .app-shell[data-theme='minimal'] .titlebar-actions-primary .titlebar-icon-active {
  border-color: rgba(255, 255, 255, 0.42) !important;
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.16), 0 0 0 1px rgba(255, 255, 255, 0.06) !important;
}
```

- [ ] **Step 2: Do not change the inactive or hover baselines**

Leave these existing generic rules untouched unless the verifier proves otherwise:

```css
.dark .app-shell[data-theme='minimal'] :is(.titlebar-icon-button, .header-actions button, .settings-reset-button, .settings-nav-item, .settings-switch-row) {
  border-color: rgba(255, 255, 255, 0.12) !important;
  background: rgba(255, 255, 255, 0.07) !important;
  color: #e5e7eb !important;
}

.dark .app-shell[data-theme='minimal'] :is(.titlebar-icon-button, .header-actions button, .settings-reset-button, .settings-nav-item, .settings-switch-row):hover {
  border-color: rgba(229, 231, 235, 0.28) !important;
  background: rgba(255, 255, 255, 0.11) !important;
  color: #ffffff !important;
}
```

The goal is a clearer selected state, not a redesign of the whole titlebar control system.

- [ ] **Step 3: Keep the change out of other themes**

Do not add matching overrides for:

```css
[data-theme='invisible']
[data-theme='neumorphism']
[data-theme='watercolor']
```

This plan is intentionally scoped to the minimal dark theme only.

## Task 3: Verify the targeted polish

**Files:**
- Test: `app/scripts/verify-ui-feedback-regressions.ts`

- [ ] **Step 1: Run the updated regression verifier**

Run:

```bash
cd /g/Personal-AI/DailyTodo/.claude/worktrees/theme-ai-feedback/app && npm run verify:ui-feedback-regressions
```

Expected: `verify-ui-feedback-regressions passed`

- [ ] **Step 2: Re-run the nearby alignment verifier as a safety check**

Run:

```bash
cd /g/Personal-AI/DailyTodo/.claude/worktrees/theme-ai-feedback/app && npm run verify:task-action-alignment
```

Expected: `verify-task-action-alignment passed`

- [ ] **Step 3: Do not commit unless explicitly requested**

Per session instructions, stop after code + verification. If the user later asks for a commit, stage only:

```bash
git add app/src/styles/globals.css app/scripts/verify-ui-feedback-regressions.ts
```

## Self-Review

- Spec coverage: the plan covers the approved design exactly — stronger selected-state contrast for the three primary titlebar buttons, only in minimal dark theme.
- Placeholder scan: no `TODO`, `TBD`, or generic “adjust styling” instructions remain.
- Type consistency: selectors match the existing structure in `app/src/components/TitleBar.tsx` (`.titlebar-actions-primary` + `.titlebar-icon-active`).
