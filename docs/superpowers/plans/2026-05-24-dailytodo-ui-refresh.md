# DailyTodo UI Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the DailyTodo UI into a minimal professional desktop workspace while preserving existing app behavior.

**Architecture:** Keep React component structure unchanged and implement the redesign through shared CSS tokens, component classes, and small className refinements. Avoid data-flow changes and keep Obsidian/task behavior untouched.

**Tech Stack:** Electron, React, TypeScript, Tailwind utility classes, custom CSS variables in `src/styles/globals.css`.

---

### Task 1: Visual Tokens And Shell

**Files:**
- Modify: `app/src/styles/globals.css`

- [ ] Replace the warm paper-heavy tokens with a calmer neutral surface system.
- [ ] Reduce blur and shadow intensity.
- [ ] Keep forest green as primary accent and gold as secondary accent.
- [ ] Make the app shell flatter and more professional.
- [ ] Keep dark mode equivalent tokens.

### Task 2: Title Bar And Header

**Files:**
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/components/Header.tsx` if a class hook is needed.
- Modify: `app/src/components/TitleBar.tsx` if a class hook is needed.

- [ ] Make the titlebar slimmer and quieter.
- [ ] Normalize icon button shape, size, focus, and hover states.
- [ ] Make header actions compact and visually subordinate.
- [ ] Ensure narrow-window labels truncate or collapse cleanly.

### Task 3: Daily Capture Panels

**Files:**
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/components/DailyWorkPanel.tsx` only if markup needs a semantic hook.

- [ ] Style work/inspiration tabs as a restrained segmented control.
- [ ] Style collapsed preview rows as a utility strip, not a decorative card.
- [ ] Keep expanded textarea readable, compact, and consistent with the new surface style.

### Task 4: Task Toolbar

**Files:**
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/components/TaskList.tsx` if class hooks are needed.

- [ ] Make toolbar flatter and more unified.
- [ ] Align search, open-only, and priority filter into one professional utility row.
- [ ] Keep active filter states clear through accent color and text contrast.

### Task 5: Task Items

**Files:**
- Modify: `app/src/styles/globals.css`
- Modify: `app/src/components/TaskItem.tsx` if class hooks are needed.
- Modify: `app/src/components/PriorityPicker.tsx` if priority menu styling needs hooks.

- [ ] Make task cards look more like compact work entries.
- [ ] Reduce shadow and ornamental glass.
- [ ] Keep priority dots and completion controls clear.
- [ ] Preserve hover actions and review/delete affordances.

### Task 6: Verification

**Files:**
- No source changes expected.

- [ ] Run `npm run build` from `app`.
- [ ] Inspect the running or built app visually if practical.
- [ ] Confirm no TypeScript errors and no obvious layout overflow from changed classes.
