# DailyTodo Knowledge Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement compact daily capture, automatic knowledge card export, and yesterday-to-today task carryover.

**Architecture:** Keep the React hook as the task orchestration layer and Electron main as the filesystem export layer. Add small helper functions for carryover and Markdown card generation rather than introducing new storage systems.

**Tech Stack:** Electron 34, React 18, TypeScript, electron-store, Obsidian-compatible Markdown.

---

### Task 1: Add Carryover Metadata

**Files:**
- Modify: `app/src/types/task.ts`
- Modify: `app/electron/main.ts`

- [ ] Add optional `carriedFromDate` and `carriedFromTaskId` fields to the renderer `Task` interface.
- [ ] Add the same optional fields to the Electron main-process `Task` type.
- [ ] Ensure existing tasks remain valid because both fields are optional.

### Task 2: Implement Yesterday Carryover

**Files:**
- Modify: `app/src/hooks/useTasks.ts`

- [ ] Add date helpers for subtracting one day from a date key.
- [ ] Add a helper that checks whether a task needs carryover:
  - incomplete tasks always carry over.
  - completed tasks carry over if their latest completion review percent is below 100.
- [ ] Add a ledger store key `taskCarryoverLedger`.
- [ ] During initialization, when today's date is active, create today's copy for eligible yesterday tasks.
- [ ] Mark new copies with source metadata and text suffix `（继承自 YYYY-MM-DD）`.
- [ ] Save the ledger so repeated launches do not duplicate the same inherited task.

### Task 3: Compact Daily Work And Inspiration Inputs

**Files:**
- Modify: `app/src/components/DailyWorkPanel.tsx`
- Modify: `app/src/App.tsx`

- [ ] Replace the always-visible panel body with a preview row.
- [ ] Show title, first-line preview, and chevron in the collapsed state.
- [ ] Expand to the textarea on click.
- [ ] Keep the existing app-level persisted open state.

### Task 4: Top Button Adjustment

**Files:**
- Modify: `app/src/components/Header.tsx`
- Modify: `app/src/components/TitleBar.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] Keep titlebar controls as window controls.
- [ ] Make header action buttons smaller and icon-led.
- [ ] Ensure labels do not overflow in the small window.

### Task 5: Knowledge Card Export

**Files:**
- Modify: `app/electron/main.ts`

- [ ] Add card filename sanitization.
- [ ] Write inspiration cards when inspiration text is non-empty.
- [ ] Write completion review cards for meaningful summaries or next steps.
- [ ] Store cards under `01 每日记录/DailyTodo/knowledge/`.
- [ ] Keep daily note sync working even if individual card generation is skipped for empty content.

### Task 6: Verify

**Files:**
- No source changes expected.

- [ ] Run `npm run build` from `app`.
- [ ] If build passes, launch or preview the app if practical.
- [ ] Inspect generated TypeScript output errors if any and fix them.
