# SettingsPanel Basic Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the low-coupling Templates, Schedule, and General sections out of `src/components/SettingsPanel.tsx` while preserving behavior.

**Architecture:** Keep `SettingsPanel.tsx` as the settings shell and state owner. Move three presentational section bodies into focused files under `src/components/settings/`, passing the same values and callbacks that the inline JSX already used. Protect the refactor with a structural verification script added to the cleanup suite.

**Tech Stack:** React 18, TypeScript, Electron renderer, existing `tsx` verification scripts, npm scripts.

---

### File Structure

**Files:**
- Create: `app/src/components/settings/TemplatesSettingsSection.tsx` — template edit-entry UI.
- Create: `app/src/components/settings/ScheduleSettingsSection.tsx` — rollover, auto carry-forward, and clear-completed UI.
- Create: `app/src/components/settings/GeneralSettingsSection.tsx` — language, completion-review, startup, tray, and always-on-top UI.
- Create: `app/scripts/verify-settings-basic-sections.ts` — module-boundary verification for the new section files.
- Modify: `app/src/components/SettingsPanel.tsx` — import and render the three new section components.
- Modify: `app/package.json` — add `verify:settings-basic-sections` and include it in `verify:cleanup-core`.
- Modify: `app/task_plan.md` and `app/progress.md` — record this continuation pass.
- Modify: `docs/DailyTodo-Codebase-Map.md` and `docs/DailyTodo-Developer-Code-Guide.md` — document the new settings section modules.

### Task 1: Add Red Verification For Basic Settings Sections

**Files:**
- Create: `app/scripts/verify-settings-basic-sections.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-settings-basic-sections.ts` with this content:

```ts
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const sectionsDir = join(root, 'src/components/settings');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');

const sectionChecks = [
  {
    file: 'TemplatesSettingsSection.tsx',
    exportName: 'TemplatesSettingsSection',
    importPath: './settings/TemplatesSettingsSection',
    renderName: '<TemplatesSettingsSection',
    moduleMarker: 'TemplateEditKind',
    removedInlineMarker: "zh ? '日报模板' : 'Daily template'",
  },
  {
    file: 'ScheduleSettingsSection.tsx',
    exportName: 'ScheduleSettingsSection',
    importPath: './settings/ScheduleSettingsSection',
    renderName: '<ScheduleSettingsSection',
    moduleMarker: 'Clear completed on',
    removedInlineMarker: "zh ? '清理已完成' : 'Clear Completed'",
  },
  {
    file: 'GeneralSettingsSection.tsx',
    exportName: 'GeneralSettingsSection',
    importPath: './settings/GeneralSettingsSection',
    renderName: '<GeneralSettingsSection',
    moduleMarker: 'AutoStartToggle',
    removedInlineMarker: "zh ? '窗口行为' : 'Window Behavior'",
  },
] as const;

for (const check of sectionChecks) {
  const sectionPath = join(sectionsDir, check.file);
  assert.ok(existsSync(sectionPath), `${check.file} should exist.`);
  const source = readFileSync(sectionPath, 'utf8');
  assert.match(source, new RegExp(`export function ${check.exportName}\\b`), `${check.file} should export ${check.exportName}.`);
  assert.match(source, new RegExp(check.moduleMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${check.file} should contain ${check.moduleMarker}.`);
  assert.match(settingsPanel, new RegExp(`from '${check.importPath}'`), `SettingsPanel should import ${check.exportName}.`);
  assert.match(settingsPanel, new RegExp(check.renderName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `SettingsPanel should render ${check.exportName}.`);
  assert.doesNotMatch(settingsPanel, new RegExp(check.removedInlineMarker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `SettingsPanel should not keep ${check.exportName} inline markup.`);
}

console.log('settings basic sections verification passed');
```

- [ ] **Step 2: Add the npm script**

Add this script to `app/package.json`:

```json
"verify:settings-basic-sections": "tsx scripts/verify-settings-basic-sections.ts"
```

Also insert `npm run verify:settings-basic-sections` into `verify:cleanup-core` after `npm run verify:settings-ai-review-module`.

- [ ] **Step 3: Run red verification**

Run: `npm run verify:settings-basic-sections`

Expected: fails with `TemplatesSettingsSection.tsx should exist.` because production files have not been created yet.

### Task 2: Extract Templates Section

**Files:**
- Create: `app/src/components/settings/TemplatesSettingsSection.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`

- [ ] **Step 1: Create Templates section component**

Create `app/src/components/settings/TemplatesSettingsSection.tsx` with a presentational component that defines `TemplateEditKind`, renders the five template edit rows, and calls `onEditTemplate?.(kind)` unchanged.

- [ ] **Step 2: Replace inline templates JSX**

Import `TemplatesSettingsSection` in `SettingsPanel.tsx` and replace the `section === 'templates'` inline block with:

```tsx
{section === 'templates' && (
  <TemplatesSettingsSection zh={zh} text={text} onEditTemplate={onEditTemplate} />
)}
```

- [ ] **Step 3: Run focused verification**

Run: `npm run verify:settings-basic-sections`

Expected: still fails, now on `ScheduleSettingsSection.tsx should exist.`

### Task 3: Extract Schedule Section

**Files:**
- Create: `app/src/components/settings/ScheduleSettingsSection.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`

- [ ] **Step 1: Create Schedule section component**

Create `app/src/components/settings/ScheduleSettingsSection.tsx` with props for `text`, `appSettings`, `selectedDate`, `completedCount`, `onClearCompleted`, and `onAppSettingsChange`. Define a local generic `updateApp` helper and move the existing rollover/clear-completed JSX unchanged.

- [ ] **Step 2: Replace inline schedule JSX**

Import `ScheduleSettingsSection` in `SettingsPanel.tsx` and replace the `section === 'schedule'` inline block with:

```tsx
{section === 'schedule' && (
  <ScheduleSettingsSection
    text={text}
    appSettings={appSettings}
    selectedDate={selectedDate}
    completedCount={completedCount}
    onClearCompleted={onClearCompleted}
    onAppSettingsChange={onAppSettingsChange}
  />
)}
```

- [ ] **Step 3: Run focused verification**

Run: `npm run verify:settings-basic-sections`

Expected: still fails, now on `GeneralSettingsSection.tsx should exist.`

### Task 4: Extract General Section

**Files:**
- Create: `app/src/components/settings/GeneralSettingsSection.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`

- [ ] **Step 1: Create General section component**

Create `app/src/components/settings/GeneralSettingsSection.tsx` with props for `text`, `settings`, `appSettings`, `onChange`, and `onAppSettingsChange`. Define a local generic `updateApp` helper and move the existing language/completion/window behavior JSX unchanged.

- [ ] **Step 2: Replace inline general JSX**

Import `GeneralSettingsSection` in `SettingsPanel.tsx` and replace the `section === 'general'` inline block with:

```tsx
{section === 'general' && (
  <GeneralSettingsSection
    text={text}
    settings={settings}
    appSettings={appSettings}
    onChange={onChange}
    onAppSettingsChange={onAppSettingsChange}
  />
)}
```

- [ ] **Step 3: Run focused verification**

Run: `npm run verify:settings-basic-sections`

Expected: passes and prints `settings basic sections verification passed`.

### Task 5: Cleanup, Documentation, And Regression

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `docs/DailyTodo-Codebase-Map.md`
- Modify: `docs/DailyTodo-Developer-Code-Guide.md`
- Modify: `app/task_plan.md`
- Modify: `app/progress.md`

- [ ] **Step 1: Remove now-unused imports and types**

Remove imports from `SettingsPanel.tsx` that are only needed by extracted sections, such as `AppLanguage` and `AutoStartToggle`, if TypeScript reports them unused.

- [ ] **Step 2: Document the new modules**

Add bullets for these files to `docs/DailyTodo-Codebase-Map.md` and `docs/DailyTodo-Developer-Code-Guide.md`:

```markdown
- `src/components/settings/TemplatesSettingsSection.tsx`: template edit-entry settings tab.
- `src/components/settings/ScheduleSettingsSection.tsx`: rollover, auto carry-forward, and clear-completed settings tab.
- `src/components/settings/GeneralSettingsSection.tsx`: language, completion-record, startup, tray, and always-on-top settings tab.
```

- [ ] **Step 3: Update planning files**

Record the SettingsPanel basic section split in `app/progress.md` and mark the continuation phase in `app/task_plan.md` complete when verification passes.

- [ ] **Step 4: Run focused regression**

Run: `npm run verify:settings-basic-sections && npm run verify:settings-panel-modules && npm run verify:cleanup-core`

Expected: all commands pass.

- [ ] **Step 5: Run build if focused regression passes**

Run: `npm run build`

Expected: Electron/Vite production build completes successfully.

### Self-Review

- Spec coverage: the plan creates all three requested low-coupling section modules, wires them into `SettingsPanel.tsx`, updates docs, and verifies the boundary.
- Placeholder scan: no placeholder tasks remain; each task names files, commands, and expected outcomes.
- Type consistency: component names, script names, and npm script names match across tasks.
