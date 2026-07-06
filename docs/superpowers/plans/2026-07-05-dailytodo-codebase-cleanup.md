# DailyTodo Codebase Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the DailyTodo codebase easier to understand and safer to refactor without changing product behavior.

**Architecture:** Start with documentation and verification because the current app has several cross-cutting flows: task state, Obsidian sync, AI review, and Windows desktop-window behavior. Defer large code extraction until the code map and high-risk boundaries are explicit.

**Tech Stack:** Electron 34, React 18, TypeScript, electron-vite, electron-store, Framer Motion, dnd-kit, Obsidian Markdown files, focused `tsx` verification scripts.

---

### File Structure

**Files:**
- Create: `docs/DailyTodo-Codebase-Map.md`
- Modify: `docs/DailyTodo-Developer-Code-Guide.md`
- Modify later: `README.md`
- Do not modify in this pass: `src/App.tsx`, `src/hooks/useTasks.ts`, `electron/main.ts`, `src/components/SettingsPanel.tsx`

The first cleanup pass documents the system and leaves runtime behavior untouched. Later cleanup passes should split large files only after adding verification around the behavior being moved.

### Task 1: Codebase Map

**Files:**
- Create: `docs/DailyTodo-Codebase-Map.md`

- [ ] **Step 1: Add the codebase map**

Create `docs/DailyTodo-Codebase-Map.md` with sections for product shape, runtime architecture, directory responsibilities, task data model, storage keys, Obsidian sync, AI review, window behavior, high-risk files, cleanup order, and safe change rules.

- [ ] **Step 2: Verify the map references real files**

Run: `Test-Path ..\docs\DailyTodo-Codebase-Map.md; Test-Path src\hooks\useTasks.ts; Test-Path electron\main.ts; Test-Path shared\obsidianTemplates.ts`

Expected: four `True` lines.

### Task 2: Developer Guide Index

**Files:**
- Modify: `docs/DailyTodo-Developer-Code-Guide.md`

- [ ] **Step 1: Link the codebase map from the existing guide**

Add a short note near the top of `docs/DailyTodo-Developer-Code-Guide.md`:

```markdown
For a broader current map of the app architecture, see `docs/DailyTodo-Codebase-Map.md`.
```

- [ ] **Step 2: Add the current cleanup cautions**

Add a section named `Current Cleanup Cautions` with these bullets:

```markdown
- Keep Electron Store key names stable unless a migration is included.
- Keep DAILYTODO managed marker strings stable unless recovery behavior is included.
- Treat `electron/main.ts`, `src/components/SettingsPanel.tsx`, `src/App.tsx`, and `src/hooks/useTasks.ts` as high-risk files because they span multiple subsystems.
- Clean `src/i18n.ts` encoding in a dedicated pass before editing large amounts of UI copy.
```

- [ ] **Step 3: Verify the guide contains the new sections**

Run: `Select-String -Path ..\docs\DailyTodo-Developer-Code-Guide.md -Pattern 'Codebase-Map|Current Cleanup Cautions'`

Expected: matches for both strings.

### Task 3: README Maintenance Note

**Files:**
- Modify later: `README.md`

- [ ] **Step 1: Inspect README encoding before editing**

Run: `Get-Content -Raw README.md`

Expected: confirm whether the file displays readable Chinese or mojibake in the current shell.

- [ ] **Step 2: If README is still mojibake, do not patch it blindly**

Record this as a separate encoding cleanup task. Do not rewrite README from guessed text unless a readable source exists.

### Task 4: Verification

**Files:**
- No source edits.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`

Expected: TypeScript completes without errors.

- [ ] **Step 2: Run focused docs-adjacent verification**

Run: `npm run verify:renderer-route`

Expected: script exits with code 0.

- [ ] **Step 3: Check git diff**

Run: `git diff -- ..\docs\DailyTodo-Codebase-Map.md ..\docs\DailyTodo-Developer-Code-Guide.md`

Expected: only documentation changes.

### Self-Review

- Spec coverage: this plan covers documentation, safe cleanup boundaries, and verification.
- Placeholder scan: no implementation placeholders are required for this documentation-only pass.
- Type consistency: no runtime types are changed.

