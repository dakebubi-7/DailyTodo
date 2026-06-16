# Restore Task Layout With Unified Glass Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the older main task row layout while exposing only one total opacity slider and one blur strength slider.

**Architecture:** Treat SettingsPanel's existing unified glass opacity control as the source of truth. Remove task-row source badge rendering and source-badge-specific CSS so the main task row returns to the compact visual structure: drag handle, collapse button, completion circle, priority dot, title, review action.

**Tech Stack:** Electron, React, TypeScript, CSS, tsx verification scripts.

---

## File Map

- Modify: `app/scripts/verify-task-list-interactions.ts` — add source-badge regression assertions for the main task row.
- Modify: `app/scripts/verify-frosted-glass-opacity-controls.ts` — keep assertions that SettingsPanel renders only unified glass opacity and blur strength, no per-area opacity controls.
- Modify: `app/src/components/TaskItem.tsx` — remove main-task source badge rendering from the text row/action cluster while preserving drag, collapse, completion, priority, editing, tags, scheduled dates, review, delete, context menu, and subtask behavior.
- Modify: `app/src/styles/globals.css` — remove task-source-badge styling that affects task cards and ensure task-card right-side safe space is only for review/delete actions, not source badges.

## Tasks

### Task 1: Add failing source-badge layout verifier

**Files:**
- Modify: `app/scripts/verify-task-list-interactions.ts`

- [ ] Add assertions after the existing `taskItem`/`globals` checks:

```ts
assert(!taskItem.includes('className="task-source-badge"'), 'Main task rows should not render a source badge; the desktop-shortcut layout is drag/collapse/check/priority/title/review only.');
assert(!taskItem.includes('sourceLabels'), 'TaskItem should not keep source-label copy for a removed main-row source badge.');
assert(!globals.includes('.task-source-badge'), 'Task card CSS should not include source-badge styling after removing the main-row badge.');
```

- [ ] Run: `cd app && npm run verify:task-list-interactions`

Expected: FAIL with a message about `task-source-badge` still existing.

### Task 2: Remove main-task source badge rendering

**Files:**
- Modify: `app/src/components/TaskItem.tsx`

- [ ] Remove `sourceTitles` and any `sourceLabels` constants used only by the source badge.
- [ ] Remove the source badge JSX from the main task text/action row.
- [ ] Keep the task title tooltip as `${task.text} · ${priorityTitles[task.priority]}`.
- [ ] Keep drag handle, collapse toggle, completion circle, priority picker, editing input, tags, scheduled dates, review button, delete hot zone, and subtasks unchanged.

- [ ] Run: `cd app && npm run verify:task-list-interactions`

Expected: next failure should be CSS source-badge references or pass for TaskItem-specific checks.

### Task 3: Remove task-source-badge CSS

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] Delete `.task-source-badge` dark-mode styling blocks.
- [ ] Delete any source-badge styling blocks if present elsewhere.
- [ ] Keep `.task-action-layer`, `.task-review-zone`, `.task-delete-zone`, and `--task-action-safe-space` styles that support review/delete actions.

- [ ] Run: `cd app && npm run verify:task-list-interactions`

Expected: PASS.

### Task 4: Verify unified opacity controls remain simplified

**Files:**
- Verify only: `app/scripts/verify-frosted-glass-opacity-controls.ts`

- [ ] Run: `cd app && npm run verify:frosted-glass-opacity`

Expected: PASS, confirming SettingsPanel still exposes one glass opacity slider and one blur strength slider, and does not render old per-area opacity controls.

### Task 5: Typecheck focused code

**Files:**
- Verify only: TypeScript project

- [ ] Run: `cd app && npm run typecheck`

Expected: PASS.

## Self-Review

- Spec coverage: The plan restores the main-task row by removing source badges and preserves the current unified opacity/blur settings.
- Placeholder scan: No placeholders remain.
- Type consistency: All referenced files and scripts exist in the current project.
