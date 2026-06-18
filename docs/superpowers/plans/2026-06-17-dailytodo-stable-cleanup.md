# DailyTodo Stable Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Conservatively clean the DailyTodo repository while preserving all existing app features and moving obvious clutter to a sibling backup directory outside the repo.

**Architecture:** Keep the existing Electron/React/shared/scripts layout. Remove only process artifacts and local generated state from the tracked tree, improve ignore rules so the clutter does not return, and verify with TypeScript/build plus focused verifier scripts.

**Tech Stack:** Electron 34, React 18, TypeScript, electron-vite, npm scripts, git worktree isolation.

---

## File Structure

- Modify `.gitignore`: add rules for Superpowers process artifacts, nested accidental repo copies, and common local generated directories.
- Remove tracked `.superpowers/brainstorm/**`: browser brainstorming artifacts are process state, not source.
- Keep `app/src/**`, `app/electron/**`, `app/shared/**`, `app/scripts/**`, `app/build/**`, and `app/vendor/**` in place to preserve all features.
- Move external clutter from the original checkout into `G:/Personal-AI/DailyTodo-backup-cleanup-20260617/` with a `manifest.md` explaining original paths and reasons.
- Do not delete or archive verifier scripts unless an exact replacement and no package reference is proven.

## Tasks

### Task 1: Remove tracked process artifacts

**Files:**
- Delete: `.superpowers/brainstorm/441-1780669575/**`

- [ ] Confirm `.superpowers/brainstorm/441-1780669575/` contains browser mockup/session artifacts only.
- [ ] Remove tracked files under `.superpowers/brainstorm/441-1780669575/`.
- [ ] Verify `git status --short` shows only deleted `.superpowers/brainstorm/**` files plus planned ignore changes.

### Task 2: Harden ignore rules

**Files:**
- Modify: `.gitignore`

- [ ] Add `.superpowers/` to ignore local skill/session artifacts.
- [ ] Add `DailyTodo/` to ignore accidental nested project copies.
- [ ] Keep existing ignores for `data/`, `node_modules/`, build output, logs, and `.claude/worktrees/`.
- [ ] Verify `git check-ignore .superpowers/brainstorm/example DailyTodo/example data/_archive/example app/node_modules/example` succeeds.

### Task 3: Back up external clutter outside the repo

**External backup root:** `G:/Personal-AI/DailyTodo-backup-cleanup-20260617/`

- [ ] Move original checkout `G:/Personal-AI/DailyTodo/DailyTodo/` to backup when it contains only `.gitattributes` and `README.md`.
- [ ] Move original checkout `G:/Personal-AI/DailyTodo/data/_archive/` to backup because it is local runtime/archive data already covered by `.gitignore`.
- [ ] Move original checkout `G:/Personal-AI/DailyTodo/app/node_modules/` to backup because dependencies are reinstallable and already covered by `.gitignore`.
- [ ] Write `manifest.md` with each original path, backup path, and reason.

### Task 4: Verify app still builds

**Commands:**
- `cd app && npm install` if dependencies are absent.
- `cd app && npm run typecheck`
- `cd app && npm run build`
- Focused checks if build passes:
  - `cd app && npm run verify:task-list-interactions`
  - `cd app && npm run verify:settings-sync`
  - `cd app && npm run verify:ai-settings`
  - `cd app && npm run verify:obsidian-template-center`

### Task 5: Report manual verification

- [ ] Tell the user the backup path.
- [ ] Tell the user exactly which commands to run.
- [ ] Tell the user how to start the app with `cd app && npm run dev`.
- [ ] Report any failed validation output honestly.

## Self-Review

- Spec coverage: preserves all features, moves obvious clutter outside the repo, and provides manual verification steps.
- Placeholder scan: no TBD/TODO placeholders remain.
- Type consistency: no new runtime APIs or TypeScript types are introduced.
