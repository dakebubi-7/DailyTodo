# DailyTodo Obsidian Companion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn DailyTodo into a standalone, configurable Obsidian companion with rules, templates, sync preview, and mobile inbox import, without depending on Codex or any external AI app.

**Architecture:** Keep Electron main responsible for filesystem access and Obsidian writes. Keep React responsible for capture, settings, rule/template editing, and sync preview. Add a small local rule/template engine with deterministic behavior, then connect it to the existing task and daily inspiration flow.

**Tech Stack:** Electron 34, React 18, TypeScript, electron-store, Node `fs`/`path`, Obsidian-compatible Markdown.

---

## File Map

- Create: `app/shared/obsidianCompanion.ts`
  - Shared main/renderer types for capture items, rules, templates, presets, sync plans, and settings.
- Create: `app/shared/obsidianCompanionDefaults.ts`
  - Built-in presets, default rules, default templates, and default settings used by both Electron main and React.
- Create: `app/electron/obsidianCompanion.ts`
  - Main-process rule matching, template rendering, sync planning, Markdown writing, and mobile inbox import helpers.
- Modify: `app/tsconfig.json`
  - Include shared companion types and defaults in renderer type checking.
- Modify: `app/tsconfig.node.json`
  - Include shared companion types and defaults in Electron main/preload type checking.
- Modify: `app/electron/main.ts`
  - Remove packaged-build dependency on personal paths, register new IPC handlers, and call companion helpers.
- Modify: `app/electron/preload.ts`
  - Expose new companion IPC methods to the renderer.
- Modify: `app/src/vite-env.d.ts`
  - Type new `window.electronAPI` methods.
- Modify: `app/src/store/taskStore.ts`
  - Add renderer wrappers for companion settings, preview, sync, and mobile inbox import.
- Create: `app/src/components/ObsidianCompanionPanel.tsx`
  - Settings UI for vault path, presets, rules, templates, mobile inbox, preview, and quick sync.
- Modify: `app/src/components/SettingsPanel.tsx`
  - Add entry point to open companion settings without replacing existing personalization controls.
- Modify: `app/src/App.tsx`
  - Wire companion panel state and pass current tasks, daily work, and daily inspiration into preview/sync actions.
- Modify: `app/src/styles/globals.css`
  - Add styles for companion settings, rule rows, template editor, preview, and status messages.
- Modify: `app/src/types/task.ts`
  - Reuse existing task fields; no breaking schema migration should be required.

## Implementation Notes

- The workspace currently is not a Git repository, so plan steps do not require commits. If this project is later moved into Git, commit after each task.
- Existing user data must be preserved. Do not rewrite `data/config.json` manually.
- Keep current Obsidian daily sync working while introducing the new companion engine.
- Do not replace the current `obsidian:syncTasks` flow in this plan. The existing daily sync remains the default daily-note writer; the new companion flow is an additional previewable/publishable engine.
- All companion write targets must resolve inside the selected vault path. Treat any path traversal or absolute path target as a sync-plan error.
- Use ASCII in new source files unless existing files require localized UI strings.

---

### Task 1: Add Shared Companion Types

**Files:**
- Create: `app/shared/obsidianCompanion.ts`
- Modify: `app/tsconfig.json`
- Modify: `app/tsconfig.node.json`

- [ ] **Step 1: Create shared type definitions**

Add:

```ts
export type CaptureType = 'task' | 'inspiration' | 'work' | 'note';
export type CaptureSource = 'desktop' | 'mobile-inbox' | 'clipboard';
export type CaptureStatus = 'new' | 'synced' | 'archived' | 'error';
export type RuleStopMode = 'continue' | 'stop';
export type WriteMode = 'append' | 'managed-block';

export interface CaptureItem {
  id: string;
  type: CaptureType;
  content: string;
  tags: string[];
  priority?: 'high' | 'medium' | 'low';
  source: CaptureSource;
  status: CaptureStatus;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
  metadata?: Record<string, string>;
}

export interface CompanionRuleCondition {
  type?: CaptureType;
  tagsAny?: string[];
  tagsAll?: string[];
  containsAny?: string[];
  priority?: 'high' | 'medium' | 'low';
  source?: CaptureSource;
}

export interface CompanionRuleWriteTarget {
  target: string;
  section?: string;
  templateId: string;
  mode: WriteMode;
}

export interface CompanionRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  when: CompanionRuleCondition;
  write: CompanionRuleWriteTarget;
  afterMatch: RuleStopMode;
}

export interface CompanionTemplate {
  id: string;
  name: string;
  body: string;
}

export interface CompanionPreset {
  id: string;
  name: string;
  description: string;
  rules: CompanionRule[];
  templates: CompanionTemplate[];
}

export interface CompanionSettings {
  vaultPath: string;
  mobileInboxPath: string;
  presetId: string;
  syncMode: 'manual' | 'on-change' | 'interval';
  previewBeforeWrite: boolean;
  rules: CompanionRule[];
  templates: CompanionTemplate[];
}

export interface SyncPlanChange {
  filePath: string;
  action: 'create-file' | 'update-file';
  section?: string;
  mode: WriteMode;
  content: string;
  itemIds: string[];
  ruleId: string;
}

export interface SyncPlan {
  ok: boolean;
  changes: SyncPlanChange[];
  unmatchedItems: CaptureItem[];
  errors: string[];
}
```

- [ ] **Step 2: Include shared files in TypeScript configs**

In `app/tsconfig.json`, change:

```json
"include": ["src"]
```

to:

```json
"include": ["src", "shared"]
```

In `app/tsconfig.node.json`, change:

```json
"include": ["vite.config.ts", "electron/**/*.ts"]
```

to:

```json
"include": ["vite.config.ts", "electron/**/*.ts", "shared/**/*.ts"]
```

- [ ] **Step 3: Run TypeScript build**

Run: `npm run build`

Expected: build may still fail from unrelated existing encoding issues, but this new file must not introduce type errors.

---

### Task 2: Add Default Presets, Rules, And Templates

**Files:**
- Create: `app/shared/obsidianCompanionDefaults.ts`

- [ ] **Step 1: Create default templates and rules**

Add:

```ts
import {
  CompanionPreset,
  CompanionSettings,
  CompanionTemplate,
  CompanionRule,
} from './obsidianCompanion';

export const DEFAULT_COMPANION_TEMPLATES: CompanionTemplate[] = [
  {
    id: 'daily-task-line',
    name: 'Daily task line',
    body: '- [ ] {{content}} {{tags}}',
  },
  {
    id: 'daily-inspiration-line',
    name: 'Daily inspiration line',
    body: '- {{time}} {{content}} {{tags}}',
  },
  {
    id: 'daily-work-block',
    name: 'Daily work block',
    body: '{{content}}',
  },
];

export const DEFAULT_COMPANION_RULES: CompanionRule[] = [
  {
    id: 'tasks-to-daily-note',
    name: 'Tasks to daily note',
    enabled: true,
    priority: 100,
    when: { type: 'task' },
    write: {
      target: 'logs/daily/DailyTodo/{{date}}.md',
      section: '## Daily Tasks',
      templateId: 'daily-task-line',
      mode: 'append',
    },
    afterMatch: 'continue',
  },
  {
    id: 'inspiration-to-daily-note',
    name: 'Inspiration to daily note',
    enabled: true,
    priority: 90,
    when: { type: 'inspiration' },
    write: {
      target: 'logs/daily/DailyTodo/{{date}}.md',
      section: '## Inspiration',
      templateId: 'daily-inspiration-line',
      mode: 'append',
    },
    afterMatch: 'continue',
  },
];

export const DEFAULT_COMPANION_PRESETS: CompanionPreset[] = [
  {
    id: 'minimal-daily-notes',
    name: 'Minimal Daily Notes',
    description: 'Append tasks and inspiration to one DailyTodo note per day.',
    rules: DEFAULT_COMPANION_RULES,
    templates: DEFAULT_COMPANION_TEMPLATES,
  },
  {
    id: 'inbox-first',
    name: 'Inbox First',
    description: 'Send mobile and uncategorized notes to an Obsidian inbox.',
    templates: DEFAULT_COMPANION_TEMPLATES,
    rules: [
      {
        id: 'mobile-notes-to-inbox',
        name: 'Mobile notes to inbox',
        enabled: true,
        priority: 100,
        when: { source: 'mobile-inbox' },
        write: {
          target: 'Inbox/DailyTodo.md',
          section: '## Mobile Inbox',
          templateId: 'daily-inspiration-line',
          mode: 'append',
        },
        afterMatch: 'stop',
      },
    ],
  },
];

export function createDefaultCompanionSettings(vaultPath = ''): CompanionSettings {
  return {
    vaultPath,
    mobileInboxPath: '',
    presetId: 'minimal-daily-notes',
    syncMode: 'manual',
    previewBeforeWrite: true,
    rules: DEFAULT_COMPANION_RULES,
    templates: DEFAULT_COMPANION_TEMPLATES,
  };
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: new exports compile.

---

### Task 3: Build Main-Process Companion Engine

**Files:**
- Create: `app/electron/obsidianCompanion.ts`

- [ ] **Step 1: Implement template rendering and date helpers**

Add functions:

```ts
import fs from 'fs';
import path from 'path';

type CaptureItem = import('../shared/obsidianCompanion').CaptureItem;
type CompanionRule = import('../shared/obsidianCompanion').CompanionRule;
type CompanionTemplate = import('../shared/obsidianCompanion').CompanionTemplate;
type CompanionSettings = import('../shared/obsidianCompanion').CompanionSettings;
type SyncPlan = import('../shared/obsidianCompanion').SyncPlan;
type SyncPlanChange = import('../shared/obsidianCompanion').SyncPlanChange;

export function getDateKey(value = new Date().toISOString()) {
  return value.slice(0, 10);
}

export function getTimeKey(value = new Date().toISOString()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function renderTemplate(template: string, item: CaptureItem) {
  const replacements: Record<string, string> = {
    date: getDateKey(item.createdAt),
    time: getTimeKey(item.createdAt),
    content: item.content,
    tags: item.tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' '),
    priority: item.priority || '',
    source: item.source,
    status: item.status,
    createdAt: item.createdAt,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? '');
}
```

- [ ] **Step 2: Implement rule matching**

Add:

```ts
export function matchesRule(item: CaptureItem, rule: CompanionRule) {
  if (!rule.enabled) return false;
  const condition = rule.when;

  if (condition.type && item.type !== condition.type) return false;
  if (condition.priority && item.priority !== condition.priority) return false;
  if (condition.source && item.source !== condition.source) return false;

  if (condition.tagsAny?.length) {
    const tags = new Set(item.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()));
    if (!condition.tagsAny.some((tag) => tags.has(tag.replace(/^#/, '').toLowerCase()))) return false;
  }

  if (condition.tagsAll?.length) {
    const tags = new Set(item.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()));
    if (!condition.tagsAll.every((tag) => tags.has(tag.replace(/^#/, '').toLowerCase()))) return false;
  }

  if (condition.containsAny?.length) {
    const content = item.content.toLowerCase();
    if (!condition.containsAny.some((keyword) => content.includes(keyword.toLowerCase()))) return false;
  }

  return true;
}
```

- [ ] **Step 3: Implement sync plan builder**

Add:

```ts
function resolveTargetPath(vaultPath: string, target: string, item: CaptureItem) {
  const rendered = renderTemplate(target, item).replace(/[<>:"|?*]/g, '-');
  if (path.isAbsolute(rendered)) {
    throw new Error(`Target path must be relative to the vault: ${rendered}`);
  }

  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Target path escapes the selected vault: ${rendered}`);
  }

  return resolved;
}

export function buildSyncPlan(settings: CompanionSettings, items: CaptureItem[]): SyncPlan {
  const errors: string[] = [];
  const changes: SyncPlanChange[] = [];
  const unmatchedItems: CaptureItem[] = [];
  const templates = new Map(settings.templates.map((template) => [template.id, template]));
  const rules = [...settings.rules].sort((a, b) => b.priority - a.priority);

  if (!settings.vaultPath) {
    return { ok: false, changes: [], unmatchedItems: items, errors: ['Obsidian vault path is missing.'] };
  }

  for (const item of items) {
    let matched = false;

    for (const rule of rules) {
      if (!matchesRule(item, rule)) continue;
      matched = true;

      const template = templates.get(rule.write.templateId);
      if (!template) {
        errors.push(`Rule "${rule.name}" references missing template "${rule.write.templateId}".`);
        continue;
      }

      try {
        const filePath = resolveTargetPath(settings.vaultPath, rule.write.target, item);
        changes.push({
          filePath,
          action: fs.existsSync(filePath) ? 'update-file' : 'create-file',
          section: rule.write.section,
          mode: rule.write.mode,
          content: renderTemplate(template.body, item),
          itemIds: [item.id],
          ruleId: rule.id,
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      if (rule.afterMatch === 'stop') break;
    }

    if (!matched) unmatchedItems.push(item);
  }

  return { ok: errors.length === 0, changes, unmatchedItems, errors };
}
```

- [ ] **Step 4: Implement file writing**

Add:

```ts
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertIntoSection(existing: string, section: string | undefined, content: string) {
  if (!section) return existing.trimEnd() + '\n' + content + '\n';

  const headingMatch = section.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    return existing.trimEnd() + '\n\n' + section + '\n' + content + '\n';
  }

  const headingLevel = headingMatch[1].length;
  const headingPattern = new RegExp(`^${escapeRegExp(section)}\\s*$`, 'm');
  const match = headingPattern.exec(existing);

  if (!match) {
    return existing.trimEnd() + '\n\n' + section + '\n' + content + '\n';
  }

  const afterHeading = match.index + match[0].length;
  const rest = existing.slice(afterHeading);
  const nextHeadingPattern = new RegExp(`\\n#{1,${headingLevel}}\\s+`, 'm');
  const nextHeadingMatch = nextHeadingPattern.exec(rest);
  const insertAt = nextHeadingMatch ? afterHeading + nextHeadingMatch.index : existing.length;
  const before = existing.slice(0, insertAt).trimEnd();
  const after = existing.slice(insertAt);

  return before + '\n' + content + (after.startsWith('\n') ? after : '\n' + after);
}

function replaceManagedBlock(existing: string, ruleId: string, content: string) {
  const start = `<!-- DAILYTODO:START ${ruleId} -->`;
  const end = `<!-- DAILYTODO:END ${ruleId} -->`;
  const block = `${start}\n${content}\n${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return pattern.test(existing) ? existing.replace(pattern, block) : existing.trimEnd() + '\n\n' + block + '\n';
}

export function writeSyncPlan(plan: SyncPlan) {
  if (!plan.ok) return { ok: false, errors: plan.errors };

  const errors: string[] = [];
  for (const change of plan.changes) {
    try {
      fs.mkdirSync(path.dirname(change.filePath), { recursive: true });
      const existing = fs.existsSync(change.filePath) ? fs.readFileSync(change.filePath, 'utf-8') : '';
      const next =
        change.mode === 'managed-block'
          ? replaceManagedBlock(existing, change.ruleId, change.content)
          : insertIntoSection(existing, change.section, change.content);
      fs.writeFileSync(change.filePath, next, 'utf-8');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: companion engine compiles. The Electron code imports shared types from `app/shared`, not renderer-only `app/src`.

---

### Task 3.5: Add Companion Engine Verification Script

**Files:**
- Create: `app/electron/obsidianCompanion.verify.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Add a lightweight verification script**

Create `app/electron/obsidianCompanion.verify.ts`:

```ts
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
  buildSyncPlan,
  matchesRule,
  renderTemplate,
  writeSyncPlan,
} from './obsidianCompanion';
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
import { CaptureItem } from '../shared/obsidianCompanion';

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

const item: CaptureItem = {
  id: 'task-1',
  type: 'task',
  content: 'Review inbox',
  tags: ['work', '#focus'],
  priority: 'high',
  source: 'desktop',
  status: 'new',
  createdAt: '2026-05-26T08:30:00.000Z',
};

const rendered = renderTemplate('{{date}} {{content}} {{tags}} {{priority}}', item);
assert(rendered.includes('2026-05-26'), 'template should render date');
assert(rendered.includes('Review inbox'), 'template should render content');
assert(rendered.includes('#work #focus'), 'template should normalize tags');
assert(rendered.includes('high'), 'template should render priority');

assert(
  matchesRule(item, {
    id: 'rule-1',
    name: 'High focus tasks',
    enabled: true,
    priority: 1,
    when: { type: 'task', tagsAll: ['focus'], containsAny: ['inbox'] },
    write: { target: 'Daily.md', templateId: 'daily-task-line', mode: 'append' },
    afterMatch: 'continue',
  }),
  'rule should match type, tags, and content'
);

const vaultPath = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-companion-'));
const settings = createDefaultCompanionSettings(vaultPath);
const plan = buildSyncPlan(settings, [item]);
assert(plan.ok, plan.errors.join(' '));
assert(plan.changes.length === 1, 'plan should contain one task write');
assert(plan.changes[0].filePath.startsWith(vaultPath), 'target should stay inside vault');

const writeResult = writeSyncPlan(plan);
assert(writeResult.ok, writeResult.errors.join(' '));
assert(fs.existsSync(plan.changes[0].filePath), 'sync should create target file');
const written = fs.readFileSync(plan.changes[0].filePath, 'utf-8');
assert(written.includes('## Daily Tasks'), 'sync should create target section');
assert(written.includes('Review inbox'), 'sync should write rendered content');

const traversalPlan = buildSyncPlan(
  {
    ...settings,
    rules: [
      {
        ...settings.rules[0],
        write: { ...settings.rules[0].write, target: '../outside.md' },
      },
    ],
  },
  [item]
);
assert(!traversalPlan.ok, 'path traversal should be rejected');
assert(traversalPlan.errors.some((error) => error.includes('escapes')), 'path traversal error should be explicit');

console.log('obsidian companion verification passed');
```

- [ ] **Step 2: Add npm script**

In `app/package.json`, add:

```json
"verify:companion": "tsx electron/obsidianCompanion.verify.ts"
```

Also add the dev dependency:

```json
"tsx": "^4.19.2"
```

- [ ] **Step 3: Run companion verification**

Run: `npm run verify:companion`

Expected: `obsidian companion verification passed`

- [ ] **Step 4: Run build**

Run: `npm run build`

Expected: build still passes after adding the verification script and dev dependency.

---

### Task 4: Add Companion Settings Persistence And IPC

**Files:**
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Modify: `app/src/store/taskStore.ts`

- [ ] **Step 1: Add store key and settings helpers in `main.ts`**

Add near existing store constants:

```ts
const COMPANION_SETTINGS_KEY = 'obsidianCompanionSettings';
```

Import default settings:

```ts
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
```

Add helpers:

```ts
function getCompanionSettings() {
  const existing = store.get(COMPANION_SETTINGS_KEY);
  if (existing) return existing;
  return createDefaultCompanionSettings(getVaultPath());
}

function setCompanionSettings(value: unknown) {
  store.set(COMPANION_SETTINGS_KEY, value);
}
```

- [ ] **Step 2: Register IPC handlers in `main.ts`**

Import companion helpers:

```ts
import { buildSyncPlan, writeSyncPlan } from './obsidianCompanion';
```

Add IPC handlers after existing Obsidian handlers:

```ts
ipcMain.handle('companion:getSettings', () => getCompanionSettings());
ipcMain.handle('companion:setSettings', (_event, settings) => {
  setCompanionSettings(settings);
  return { ok: true };
});
ipcMain.handle('companion:previewSync', (_event, settings, items) => {
  return buildSyncPlan(settings, items);
});
ipcMain.handle('companion:writeSync', (_event, settings, items) => {
  const plan = buildSyncPlan(settings, items);
  return writeSyncPlan(plan);
});
```

- [ ] **Step 3: Expose preload methods**

Add to `contextBridge.exposeInMainWorld`:

```ts
getCompanionSettings: () => ipcRenderer.invoke('companion:getSettings'),
setCompanionSettings: (settings: unknown) => ipcRenderer.invoke('companion:setSettings', settings),
previewCompanionSync: (settings: unknown, items: unknown[]) => ipcRenderer.invoke('companion:previewSync', settings, items),
writeCompanionSync: (settings: unknown, items: unknown[]) => ipcRenderer.invoke('companion:writeSync', settings, items),
```

- [ ] **Step 4: Type renderer API**

Add to `Window.electronAPI` in `app/src/vite-env.d.ts`:

```ts
getCompanionSettings: () => Promise<import('../shared/obsidianCompanion').CompanionSettings>;
setCompanionSettings: (settings: import('../shared/obsidianCompanion').CompanionSettings) => Promise<{ ok: boolean }>;
previewCompanionSync: (
  settings: import('../shared/obsidianCompanion').CompanionSettings,
  items: import('../shared/obsidianCompanion').CaptureItem[]
) => Promise<import('../shared/obsidianCompanion').SyncPlan>;
writeCompanionSync: (
  settings: import('../shared/obsidianCompanion').CompanionSettings,
  items: import('../shared/obsidianCompanion').CaptureItem[]
) => Promise<{ ok: boolean; errors: string[] }>;
```

- [ ] **Step 5: Add renderer wrappers**

Add to `app/src/store/taskStore.ts`:

```ts
import { CaptureItem, CompanionSettings } from '../../shared/obsidianCompanion';

export const getCompanionSettings = async () => window.electronAPI.getCompanionSettings();
export const setCompanionSettings = async (settings: CompanionSettings) => window.electronAPI.setCompanionSettings(settings);
export const previewCompanionSync = async (settings: CompanionSettings, items: CaptureItem[]) => window.electronAPI.previewCompanionSync(settings, items);
export const writeCompanionSync = async (settings: CompanionSettings, items: CaptureItem[]) => window.electronAPI.writeCompanionSync(settings, items);
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: IPC types compile.

---

### Task 5: Convert Existing Daily Data Into Capture Items

**Files:**
- Modify: `app/src/store/taskStore.ts`
- Modify: `app/src/App.tsx`

- [ ] **Step 1: Add conversion helper**

Add to `taskStore.ts`:

```ts
import { Task } from '../types/task';
import { CaptureItem } from '../../shared/obsidianCompanion';

export function buildCaptureItems(
  tasks: Task[],
  selectedDate: string,
  dailyWork = '',
  dailyInspiration = ''
): CaptureItem[] {
  const taskItems = tasks
    .filter((task) => (task.taskDate || task.createdAt.slice(0, 10)) === selectedDate)
    .map<CaptureItem>((task) => ({
      id: `task-${task.id}`,
      type: 'task',
      content: task.text,
      tags: [],
      priority: task.priority,
      source: 'desktop',
      status: task.completed ? 'synced' : 'new',
      createdAt: task.createdAt,
      metadata: { taskId: task.id },
    }));

  const noteItems: CaptureItem[] = [];

  if (dailyWork.trim()) {
    noteItems.push({
      id: `work-${selectedDate}`,
      type: 'work',
      content: dailyWork.trim(),
      tags: [],
      source: 'desktop',
      status: 'new',
      createdAt: `${selectedDate}T00:00:00.000Z`,
    });
  }

  if (dailyInspiration.trim()) {
    noteItems.push({
      id: `inspiration-${selectedDate}`,
      type: 'inspiration',
      content: dailyInspiration.trim(),
      tags: [],
      source: 'desktop',
      status: 'new',
      createdAt: `${selectedDate}T00:00:00.000Z`,
    });
  }

  return [...taskItems, ...noteItems];
}
```

- [ ] **Step 2: Wire helper where preview/sync actions will use it**

In `App.tsx`, import:

```ts
import { buildCaptureItems } from './store/taskStore';
```

Create a local helper near existing sync handlers:

```ts
const getCurrentCaptureItems = () =>
  buildCaptureItems(
    tasks,
    selectedDate,
    dailyWorkNotes[selectedDate] || '',
    dailyInspirationNotes[selectedDate] || ''
  );
```

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: helper compiles and does not change current UI behavior.

---

### Task 6: Build Companion Settings Panel UI

**Files:**
- Create: `app/src/components/ObsidianCompanionPanel.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/src/App.tsx`
- Modify: `app/src/styles/globals.css`

- [ ] **Step 1: Create panel component**

Create `ObsidianCompanionPanel.tsx` with props:

```ts
import { CompanionSettings, SyncPlan } from '../../shared/obsidianCompanion';

interface ObsidianCompanionPanelProps {
  isOpen: boolean;
  settings: CompanionSettings;
  syncPlan: SyncPlan | null;
  status: string;
  onChange: (settings: CompanionSettings) => void;
  onClose: () => void;
  onChooseVault: () => void;
  onPreview: () => void;
  onSync: () => void;
}
```

Render sections:

```tsx
export function ObsidianCompanionPanel({
  isOpen,
  settings,
  syncPlan,
  status,
  onChange,
  onClose,
  onChooseVault,
  onPreview,
  onSync,
}: ObsidianCompanionPanelProps) {
  if (!isOpen) return null;

  return (
    <aside className="companion-panel" style={{ WebkitAppRegion: 'no-drag' }}>
      <header className="companion-panel-header">
        <div>
          <h2>Obsidian Companion</h2>
          <p>Rules, templates, preview, and vault publishing.</p>
        </div>
        <button onClick={onClose} className="settings-icon-button" aria-label="Close companion settings">X</button>
      </header>

      <section className="companion-section">
        <h3>Vault</h3>
        <p className="companion-muted">{settings.vaultPath || 'No vault selected'}</p>
        <button onClick={onChooseVault}>Choose Obsidian vault</button>
      </section>

      <section className="companion-section">
        <h3>Rules</h3>
        {settings.rules.map((rule) => (
          <div key={rule.id} className="companion-rule-row">
            <input
              type="checkbox"
              checked={rule.enabled}
              onChange={(event) =>
                onChange({
                  ...settings,
                  rules: settings.rules.map((candidate) =>
                    candidate.id === rule.id ? { ...candidate, enabled: event.target.checked } : candidate
                  ),
                })
              }
            />
            <span>{rule.name}</span>
            <small>{rule.write.target}</small>
            <label>
              Target
              <input
                value={rule.write.target}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    rules: settings.rules.map((candidate) =>
                      candidate.id === rule.id
                        ? { ...candidate, write: { ...candidate.write, target: event.target.value } }
                        : candidate
                    ),
                  })
                }
              />
            </label>
            <label>
              Section
              <input
                value={rule.write.section || ''}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    rules: settings.rules.map((candidate) =>
                      candidate.id === rule.id
                        ? { ...candidate, write: { ...candidate.write, section: event.target.value || undefined } }
                        : candidate
                    ),
                  })
                }
              />
            </label>
            <label>
              Mode
              <select
                value={rule.write.mode}
                onChange={(event) =>
                  onChange({
                    ...settings,
                    rules: settings.rules.map((candidate) =>
                      candidate.id === rule.id
                        ? { ...candidate, write: { ...candidate.write, mode: event.target.value as typeof candidate.write.mode } }
                        : candidate
                    ),
                  })
                }
              >
                <option value="append">append</option>
                <option value="managed-block">managed-block</option>
              </select>
            </label>
          </div>
        ))}
      </section>

      <section className="companion-section">
        <h3>Templates</h3>
        {settings.templates.map((template) => (
          <label key={template.id} className="companion-template-editor">
            <span>{template.name}</span>
            <textarea
              value={template.body}
              onChange={(event) =>
                onChange({
                  ...settings,
                  templates: settings.templates.map((candidate) =>
                    candidate.id === template.id ? { ...candidate, body: event.target.value } : candidate
                  ),
                })
              }
            />
          </label>
        ))}
      </section>

      <section className="companion-section">
        <h3>Preview</h3>
        <button onClick={onPreview}>Preview sync</button>
        <button onClick={onSync}>Sync now</button>
        {status && <p className="companion-status">{status}</p>}
        {syncPlan && (
          <ul className="companion-preview-list">
            {syncPlan.changes.map((change, index) => (
              <li key={`${change.filePath}-${index}`}>
                <strong>{change.action}</strong>
                <span>{change.filePath}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
```

- [ ] **Step 2: Add entry point in existing settings**

Add a prop to `SettingsPanelProps`:

```ts
onOpenCompanionSettings: () => void;
```

Add a button near the top:

```tsx
<button onClick={onOpenCompanionSettings} className="settings-reset-button">
  Obsidian Companion
</button>
```

- [ ] **Step 3: Wire state in `App.tsx`**

Add state:

```ts
const [companionOpen, setCompanionOpen] = useState(false);
const [companionSettings, setCompanionSettingsState] = useState(createDefaultCompanionSettings());
const [companionPlan, setCompanionPlan] = useState<SyncPlan | null>(null);
const [companionStatus, setCompanionStatus] = useState('');
```

On app startup, load settings:

```ts
useEffect(() => {
  getCompanionSettings()
    .then((settings) => setCompanionSettingsState(settings))
    .catch(() => setCompanionSettingsState(createDefaultCompanionSettings()));
}, []);
```

Add handlers:

```ts
const updateCompanionSettings = async (next: CompanionSettings) => {
  setCompanionSettingsState(next);
  await setCompanionSettings(next);
};

const previewCompanion = async () => {
  const plan = await previewCompanionSync(companionSettings, getCurrentCaptureItems());
  setCompanionPlan(plan);
  setCompanionStatus(plan.ok ? 'Preview ready.' : plan.errors.join(' '));
};

const syncCompanion = async () => {
  const result = await writeCompanionSync(companionSettings, getCurrentCaptureItems());
  setCompanionStatus(result.ok ? 'Synced to Obsidian.' : result.errors.join(' '));
};
```

Add a vault chooser that updates both the existing Obsidian path and the companion settings:

```ts
const chooseCompanionVault = async () => {
  const vaultPath = await chooseObsidianFolder();
  if (!vaultPath) return;
  await updateCompanionSettings({ ...companionSettings, vaultPath });
};
```

Pass `chooseCompanionVault` to `ObsidianCompanionPanel` as `onChooseVault`.

- [ ] **Step 4: Add CSS**

Add compact panel styles to `globals.css`:

```css
.companion-panel {
  position: fixed;
  inset: 12px;
  z-index: 50;
  overflow: auto;
  padding: 16px;
  border: 1px solid rgba(31, 41, 55, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  color: #1f2937;
}

.companion-panel-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.companion-section {
  margin-top: 16px;
  display: grid;
  gap: 8px;
}

.companion-rule-row,
.companion-preview-list li {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 10px;
  align-items: center;
  padding: 8px;
  border: 1px solid rgba(31, 41, 55, 0.12);
  border-radius: 6px;
}

.companion-rule-row small,
.companion-preview-list span,
.companion-muted,
.companion-status {
  color: #6b7280;
  font-size: 12px;
}

.companion-template-editor {
  display: grid;
  gap: 6px;
}

.companion-template-editor textarea {
  min-height: 74px;
  resize: vertical;
}
```

- [ ] **Step 5: Run build**

Run: `npm run build`

Expected: panel compiles and can open from settings.

---

### Task 7: Add Mobile Inbox Import

**Files:**
- Modify: `app/electron/obsidianCompanion.ts`
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Modify: `app/src/store/taskStore.ts`
- Modify: `app/src/components/ObsidianCompanionPanel.tsx`

- [ ] **Step 1: Add importer helper**

Add to `obsidianCompanion.ts`:

```ts
function getUniqueDestination(directory: string, fileName: string) {
  const parsed = path.parse(fileName);
  let candidate = path.join(directory, fileName);
  let index = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name}-${Date.now()}-${index}${parsed.ext}`);
    index += 1;
  }

  return candidate;
}

export function importMobileInbox(inboxPath: string): { ok: boolean; items: CaptureItem[]; errors: string[] } {
  if (!inboxPath || !fs.existsSync(inboxPath)) {
    return { ok: false, items: [], errors: ['Mobile inbox path does not exist.'] };
  }

  const processed = path.join(inboxPath, '_processed');
  const failed = path.join(inboxPath, '_failed');
  fs.mkdirSync(processed, { recursive: true });
  fs.mkdirSync(failed, { recursive: true });

  const items: CaptureItem[] = [];
  const errors: string[] = [];
  const files = fs
    .readdirSync(inboxPath)
    .filter((name) => ['.md', '.txt', '.json'].includes(path.extname(name).toLowerCase()));

  for (const file of files) {
    const filePath = path.join(inboxPath, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(file).toLowerCase();
      const parsed =
        ext === '.json'
          ? JSON.parse(raw)
          : { content: raw, type: 'inspiration', tags: [] };

      items.push({
        id: `mobile-${Date.now()}-${items.length}`,
        type: parsed.type || 'inspiration',
        content: String(parsed.content || raw).trim(),
        tags: Array.isArray(parsed.tags) ? parsed.tags : [],
        priority: parsed.priority,
        source: 'mobile-inbox',
        status: 'new',
        createdAt: parsed.createdAt || new Date().toISOString(),
      });

      fs.renameSync(filePath, getUniqueDestination(processed, file));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      fs.renameSync(filePath, getUniqueDestination(failed, file));
    }
  }

  return { ok: errors.length === 0, items, errors };
}
```

- [ ] **Step 2: Add IPC handler**

In `main.ts`, import `importMobileInbox` and add:

```ts
ipcMain.handle('companion:importMobileInbox', (_event, inboxPath: string) => {
  return importMobileInbox(inboxPath);
});
```

- [ ] **Step 3: Expose preload and types**

Add preload method:

```ts
importMobileInbox: (inboxPath: string) => ipcRenderer.invoke('companion:importMobileInbox', inboxPath),
```

Add `vite-env.d.ts` method:

```ts
importMobileInbox: (inboxPath: string) => Promise<{ ok: boolean; items: import('../shared/obsidianCompanion').CaptureItem[]; errors: string[] }>;
```

Add store wrapper:

```ts
export const importMobileInbox = async (inboxPath: string) => window.electronAPI.importMobileInbox(inboxPath);
```

- [ ] **Step 4: Keep imported mobile items available for preview and sync**

In `App.tsx`, add state:

```ts
const [mobileCaptureItems, setMobileCaptureItems] = useState<CaptureItem[]>([]);
```

Update `getCurrentCaptureItems` so imported mobile inbox items participate in preview/sync:

```ts
const getCurrentCaptureItems = () => [
  ...buildCaptureItems(
    tasks,
    selectedDate,
    dailyWorkNotes[selectedDate] || '',
    dailyInspirationNotes[selectedDate] || ''
  ),
  ...mobileCaptureItems,
];
```

Add the import handler:

```ts
const importCompanionMobileInbox = async () => {
  const result = await importMobileInbox(companionSettings.mobileInboxPath);
  if (result.items.length) {
    setMobileCaptureItems((existing) => [...existing, ...result.items]);
  }
  setCompanionStatus(
    result.ok
      ? `Imported ${result.items.length} mobile item(s).`
      : result.errors.join(' ')
  );
};
```

- [ ] **Step 5: Add UI button**

In `ObsidianCompanionPanel.tsx`, add props:

```ts
onImportMobileInbox: () => void;
```

Render:

```tsx
<section className="companion-section">
  <h3>Mobile Inbox</h3>
  <p className="companion-muted">{settings.mobileInboxPath || 'No mobile inbox selected'}</p>
  <button onClick={onImportMobileInbox}>Import mobile inbox</button>
</section>
```

- [ ] **Step 6: Run build**

Run: `npm run build`

Expected: importer compiles. Manual verification can be done later by placing `.txt`, `.md`, and `.json` files in a test inbox.

---

### Task 8: Remove Packaged-Build Dependency On Personal Paths

**Files:**
- Modify: `app/electron/main.ts`

- [ ] **Step 1: Gate development-only defaults**

Replace unconditional personal path defaults with development-only helpers:

```ts
const DEV_APPDATA_ROOT = 'G:\\Personal-AI\\DailyTodo\\data';
const DEV_OBSIDIAN_PATH = 'G:\\Personal-AI\\Personal-KB';

function isDevelopmentBuild() {
  return !app.isPackaged;
}
```

Change app data override:

```ts
try {
  if (isDevelopmentBuild() && fs.existsSync(DEV_APPDATA_ROOT)) {
    app.setPath('userData', DEV_APPDATA_ROOT);
  }
} catch {}
```

Change default vault:

```ts
function getDefaultVaultPath() {
  return isDevelopmentBuild() && fs.existsSync(DEV_OBSIDIAN_PATH) ? DEV_OBSIDIAN_PATH : '';
}
```

- [ ] **Step 2: Ensure packaged app requires user-selected vault**

Verify `getVaultStatus()` still returns the existing choose-folder message when no packaged vault path is configured.

- [ ] **Step 3: Run build**

Run: `npm run build`

Expected: packaged code no longer assumes `G:\Personal-AI`.

---

### Task 9: Add Manual Verification Checklist

**Files:**
- Create: `docs/superpowers/plans/2026-05-25-dailytodo-obsidian-companion-verification.md`

- [ ] **Step 1: Create verification checklist**

Add:

```md
# DailyTodo Obsidian Companion Verification

- [ ] Launch app with no existing companion settings.
- [ ] Choose an Obsidian vault.
- [ ] Open Obsidian Companion settings.
- [ ] Confirm default rules and templates are visible.
- [ ] Edit one template and reopen settings; confirm it persists.
- [ ] Edit one rule target/section/mode and confirm preview reflects the change.
- [ ] Preview sync for today's tasks and inspiration.
- [ ] Confirm preview lists target files and actions.
- [ ] Try a rule target containing `../outside.md` and confirm preview rejects it without writing outside the vault.
- [ ] Run sync.
- [ ] Confirm Markdown appears in the selected Obsidian vault.
- [ ] Confirm the existing DailyTodo Obsidian sync button still works independently from Companion sync.
- [ ] Create a temporary mobile inbox with `.txt`, `.md`, and `.json` files.
- [ ] Put an already-existing same-name file in `_processed`, import mobile inbox, and confirm the imported file is moved with a unique name.
- [ ] Import mobile inbox.
- [ ] Confirm imported mobile items appear in Companion preview before sync.
- [ ] Confirm imported files move to `_processed`.
- [ ] Confirm invalid files move to `_failed`.
- [ ] Run `npm run verify:companion`.
- [ ] Run `npm run build`.
- [ ] Run `npm run dist` if packaging is needed.
- [ ] Launch packaged app and confirm it does not depend on development paths.
```

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: source still builds after verification docs are added.

---

### Task 10: Final Review

**Files:**
- Review all modified files.

- [ ] **Step 1: Run build**

Run companion engine verification first:

`npm run verify:companion`

Expected: `obsidian companion verification passed`

Run: `npm run build`

Expected: build passes, or any pre-existing unrelated failure is documented with exact error output.

- [ ] **Step 2: Run package build if practical**

Run: `npm run dist`

Expected: Windows unpacked build completes under `app/release`.

- [ ] **Step 3: Manual smoke test**

Start the app using the existing local launch workflow. Verify:

- Existing tasks still load.
- Existing Obsidian daily sync still works.
- Companion settings open.
- Preview shows changes.
- Sync writes Markdown to the selected vault.
- Packaged mode does not require personal development paths.

- [ ] **Step 4: Document residual risks**

If no automated test runner is added, record manual verification results in the final implementation summary.
