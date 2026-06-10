# Obsidian Template Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a user-friendly Obsidian Template Center with presets, module toggles/title editing, AI-assisted template recognition, preview/apply flow, and backward-compatible advanced raw settings.

**Architecture:** Keep existing `ObsidianTemplateSettings` compatible, then add a higher-level preset/module layer through shared pure functions. Rendering remains in `app/shared/obsidianTemplates.ts`, IPC remains in `app/electron/main.ts`, and the settings UI delegates Obsidian template UX to a focused renderer component instead of expanding `SettingsPanel.tsx` further.

**Tech Stack:** Electron 34, React 18, TypeScript 5, electron-store, existing OpenAI-compatible AI review LLM caller, `tsx` verification scripts.

---

## Scope Notes

The approved spec covers one feature area: Obsidian daily-note template configuration. It touches shared settings, shared markdown rendering, main/preload IPC, renderer settings UI, CSS, and verification scripts. The AI recognition work reuses the existing AI Review LLM infrastructure; do **not** introduce a new Anthropic SDK integration in this feature unless the user separately asks to switch providers.

Commit steps below are checkpoints. Because the harness says to commit only when the user asks, do not run commit commands unless commit authorization is present in the execution session.

---

## File Structure

### Create

- `app/shared/obsidianTemplateCenter.ts`
  - Owns module ids, preset ids, preset definitions, title syncing, normalization helpers, preset application, and draft application.
  - Pure TypeScript only; no Electron, filesystem, or React imports.

- `app/shared/obsidianTemplateRecognition.ts`
  - Owns AI recognition prompt construction and robust parsing of recognized Obsidian template drafts.
  - Pure TypeScript only; imports `ChatMessage` type and template-center helpers.

- `app/src/components/ObsidianTemplateCenter.tsx`
  - Focused React component for daily path, preset cards, module toggles/title fields, AI import draft/preview/apply, and advanced raw fields.
  - Receives current settings and callbacks from `SettingsPanel`.

- `app/scripts/verify-obsidian-template-center.ts`
  - Pure verification for presets, settings normalization, module-enabled rendering, sync preview, and draft application.

- `app/scripts/verify-obsidian-template-recognition.ts`
  - Pure verification for recognition prompt and parser behavior, including dirty fenced JSON and invalid output fallback.

- `app/scripts/verify-obsidian-template-ui.ts`
  - Static renderer/preload verification that the new component and IPC APIs are wired.

### Modify

- `app/shared/appSettings.ts`
  - Extend `ObsidianTemplateSettings` with `presetId` and `modules`.
  - Normalize old settings into the new shape.
  - Default settings use the simple preset.

- `app/shared/obsidianTemplates.ts`
  - Respect `modules.*.enabled` when building daily note content and sync preview.
  - Keep marker behavior for enabled managed blocks.

- `app/electron/main.ts`
  - Import recognition helpers.
  - Add `obsidianTemplate:recognize` and `obsidianTemplate:pickTemplateFile` handlers.
  - Preserve existing `settings:*`, `obsidian:*`, and `aiReview:*` behavior.

- `app/electron/preload.ts`
  - Expose `obsidianTemplate.recognize()` and `obsidianTemplate.pickTemplateFile()`.

- `app/src/vite-env.d.ts`
  - Add renderer types for `obsidianTemplate` APIs.

- `app/src/components/SettingsPanel.tsx`
  - Replace raw Obsidian template UI block with `ObsidianTemplateCenter`.
  - Keep vault/delete sync/preview sections in `SettingsPanel`.

- `app/src/styles/globals.css`
  - Add small card/grid/details styles for template center.

- `app/package.json`
  - Add verify scripts and include them in `verify:rc`.

---

## Task 1: Add preset/module settings model

**Files:**
- Create: `app/shared/obsidianTemplateCenter.ts`
- Modify: `app/shared/appSettings.ts`
- Test: `app/scripts/verify-obsidian-template-center.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Create the shared template-center helper file**

Create `app/shared/obsidianTemplateCenter.ts` with this content:

```ts
import type { ObsidianTemplateSettings } from './appSettings';

export type ObsidianTemplatePresetId = 'simple' | 'work-review' | 'knowledge' | 'custom';

export type ObsidianTemplateModuleId =
  | 'work'
  | 'inspiration'
  | 'tasks'
  | 'review'
  | 'tomorrow'
  | 'knowledge';

export interface ObsidianTemplateModuleSettings {
  enabled: boolean;
  title: string;
}

export type ObsidianTemplateModules = Record<ObsidianTemplateModuleId, ObsidianTemplateModuleSettings>;

export interface ObsidianTemplatePreset {
  id: Exclude<ObsidianTemplatePresetId, 'custom'>;
  labelZh: string;
  labelEn: string;
  descriptionZh: string;
  descriptionEn: string;
  modules: ObsidianTemplateModules;
  taskLineTemplate: string;
  completionReviewTemplate: string;
}

export const OBSIDIAN_TEMPLATE_MODULE_IDS: ObsidianTemplateModuleId[] = [
  'work',
  'inspiration',
  'tasks',
  'review',
  'tomorrow',
  'knowledge',
];

export const OBSIDIAN_TEMPLATE_MODULE_LABELS: Record<ObsidianTemplateModuleId, { zh: string; en: string }> = {
  work: { zh: '今日工作', en: 'Work' },
  inspiration: { zh: '灵感闪念', en: 'Inspiration' },
  tasks: { zh: '每日任务', en: 'Daily Tasks' },
  review: { zh: 'AI 复盘', en: 'AI Review' },
  tomorrow: { zh: '明日待办', en: 'Tomorrow' },
  knowledge: { zh: '可复用知识', en: 'Reusable Knowledge' },
};

export const DEFAULT_TASK_LINE_TEMPLATE = '- [{{checked}}] {{text}} #{{priority}}{{dateNote}}';

export const DEFAULT_COMPLETION_REVIEW_TEMPLATE = [
  '  - 阶段记录 {{index}}：{{status}}，完成度 {{percent}}%，记录时间 {{reviewedAt}}',
  '    - 今天情况：{{summary}}',
  '    - 还没懂/卡点：{{unknowns}}',
  '    - 下一步：{{nextStep}}',
].join('\n');

export function createDefaultModules(): ObsidianTemplateModules {
  return {
    work: { enabled: true, title: '今日工作' },
    inspiration: { enabled: false, title: '灵感闪念' },
    tasks: { enabled: true, title: '每日任务' },
    review: { enabled: true, title: '复盘' },
    tomorrow: { enabled: false, title: '明日待办' },
    knowledge: { enabled: false, title: '可复用知识' },
  };
}

function cloneModules(modules: ObsidianTemplateModules): ObsidianTemplateModules {
  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce((next, id) => {
    next[id] = { ...modules[id] };
    return next;
  }, {} as ObsidianTemplateModules);
}

export const OBSIDIAN_TEMPLATE_PRESETS: ObsidianTemplatePreset[] = [
  {
    id: 'simple',
    labelZh: '简洁日记',
    labelEn: 'Simple Daily Note',
    descriptionZh: '只保留工作、任务和复盘，适合不想折腾模板的用户。',
    descriptionEn: 'Keep work, tasks, and review only.',
    modules: createDefaultModules(),
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  },
  {
    id: 'work-review',
    labelZh: '工作复盘',
    labelEn: 'Work Review',
    descriptionZh: '突出今日推进、任务完成记录和明日待办。',
    descriptionEn: 'Focus on work progress, task records, and tomorrow actions.',
    modules: {
      work: { enabled: true, title: '今日推进' },
      inspiration: { enabled: false, title: '灵感闪念' },
      tasks: { enabled: true, title: '任务与完成记录' },
      review: { enabled: true, title: '复盘' },
      tomorrow: { enabled: true, title: '明日待办' },
      knowledge: { enabled: false, title: '可复用知识' },
    },
    taskLineTemplate: '- [{{checked}}] {{text}} #{{priority}}{{dateNote}}',
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  },
  {
    id: 'knowledge',
    labelZh: '知识沉淀',
    labelEn: 'Knowledge Capture',
    descriptionZh: '突出灵感、复盘和可复用知识，适合把日报变成知识库。',
    descriptionEn: 'Emphasize inspiration, review, and reusable knowledge.',
    modules: {
      work: { enabled: false, title: '今日工作' },
      inspiration: { enabled: true, title: '灵感闪念' },
      tasks: { enabled: true, title: '每日任务' },
      review: { enabled: true, title: '复盘' },
      tomorrow: { enabled: false, title: '明日待办' },
      knowledge: { enabled: true, title: '可复用知识' },
    },
    taskLineTemplate: '- [{{checked}}] {{text}} #{{priority}}{{dateNote}}',
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  },
];

export function getObsidianTemplatePreset(id: ObsidianTemplatePresetId) {
  return OBSIDIAN_TEMPLATE_PRESETS.find((preset) => preset.id === id) ?? OBSIDIAN_TEMPLATE_PRESETS[0];
}

export function moduleTitleKey(moduleId: ObsidianTemplateModuleId): keyof Pick<
  ObsidianTemplateSettings,
  | 'workSectionTitle'
  | 'inspirationSectionTitle'
  | 'taskSectionTitle'
  | 'reviewSectionTitle'
  | 'tomorrowTaskSectionTitle'
  | 'reusableKnowledgeSectionTitle'
> {
  return {
    work: 'workSectionTitle',
    inspiration: 'inspirationSectionTitle',
    tasks: 'taskSectionTitle',
    review: 'reviewSectionTitle',
    tomorrow: 'tomorrowTaskSectionTitle',
    knowledge: 'reusableKnowledgeSectionTitle',
  }[moduleId];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function readText(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function readEnabled(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

export function normalizeTemplatePresetId(value: unknown): ObsidianTemplatePresetId {
  return value === 'simple' || value === 'work-review' || value === 'knowledge' || value === 'custom'
    ? value
    : 'simple';
}

export function normalizeTemplateModules(value: unknown, legacyTitles: Partial<Record<ObsidianTemplateModuleId, string>> = {}) {
  const defaults = createDefaultModules();
  if (!isObject(value)) {
    return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce((modules, id) => {
      modules[id] = {
        enabled: defaults[id].enabled,
        title: readText(legacyTitles[id], defaults[id].title),
      };
      return modules;
    }, {} as ObsidianTemplateModules);
  }

  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce((modules, id) => {
    const rawModule = value[id];
    const fallback = defaults[id];
    if (!isObject(rawModule)) {
      modules[id] = {
        enabled: fallback.enabled,
        title: readText(legacyTitles[id], fallback.title),
      };
      return modules;
    }

    modules[id] = {
      enabled: readEnabled(rawModule.enabled, fallback.enabled),
      title: readText(rawModule.title, readText(legacyTitles[id], fallback.title)),
    };
    return modules;
  }, {} as ObsidianTemplateModules);
}

export function syncTemplateTitlesFromModules<T extends ObsidianTemplateSettings>(settings: T): T {
  return {
    ...settings,
    workSectionTitle: settings.modules.work.title,
    inspirationSectionTitle: settings.modules.inspiration.title,
    taskSectionTitle: settings.modules.tasks.title,
    reviewSectionTitle: settings.modules.review.title,
    tomorrowTaskSectionTitle: settings.modules.tomorrow.title,
    reusableKnowledgeSectionTitle: settings.modules.knowledge.title,
  };
}

export function applyObsidianTemplatePreset(
  settings: ObsidianTemplateSettings,
  presetId: Exclude<ObsidianTemplatePresetId, 'custom'>,
): ObsidianTemplateSettings {
  const preset = getObsidianTemplatePreset(presetId);
  return syncTemplateTitlesFromModules({
    ...settings,
    presetId,
    modules: cloneModules(preset.modules),
    taskLineTemplate: preset.taskLineTemplate,
    completionReviewTemplate: preset.completionReviewTemplate,
  });
}

export function updateTemplateModule(
  settings: ObsidianTemplateSettings,
  moduleId: ObsidianTemplateModuleId,
  patch: Partial<ObsidianTemplateModuleSettings>,
): ObsidianTemplateSettings {
  const next: ObsidianTemplateSettings = {
    ...settings,
    presetId: 'custom',
    modules: {
      ...settings.modules,
      [moduleId]: {
        ...settings.modules[moduleId],
        ...patch,
      },
    },
  };
  return syncTemplateTitlesFromModules(next);
}

export function updateAdvancedTemplateField<K extends keyof ObsidianTemplateSettings>(
  settings: ObsidianTemplateSettings,
  key: K,
  value: ObsidianTemplateSettings[K],
): ObsidianTemplateSettings {
  const next = { ...settings, [key]: value, presetId: 'custom' };
  if (
    key === 'workSectionTitle' ||
    key === 'inspirationSectionTitle' ||
    key === 'taskSectionTitle' ||
    key === 'reviewSectionTitle' ||
    key === 'tomorrowTaskSectionTitle' ||
    key === 'reusableKnowledgeSectionTitle'
  ) {
    const moduleId = OBSIDIAN_TEMPLATE_MODULE_IDS.find((id) => moduleTitleKey(id) === key);
    if (moduleId && typeof value === 'string') {
      next.modules = {
        ...settings.modules,
        [moduleId]: { ...settings.modules[moduleId], title: value },
      };
    }
  }
  return syncTemplateTitlesFromModules(next as ObsidianTemplateSettings);
}
```

- [ ] **Step 2: Extend `ObsidianTemplateSettings` and defaults**

In `app/shared/appSettings.ts`, add this import at the top after the language type line:

```ts
import {
  DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  DEFAULT_TASK_LINE_TEMPLATE,
  createDefaultModules,
  normalizeTemplateModules,
  normalizeTemplatePresetId,
  syncTemplateTitlesFromModules,
  type ObsidianTemplateModuleId,
  type ObsidianTemplateModuleSettings,
  type ObsidianTemplatePresetId,
} from './obsidianTemplateCenter';
```

Replace the current `ObsidianTemplateSettings` interface with:

```ts
export type { ObsidianTemplateModuleId, ObsidianTemplateModuleSettings, ObsidianTemplatePresetId };

export interface ObsidianTemplateSettings {
  dailyNotePath: string;
  taskExportPath: string;
  workSectionTitle: string;
  inspirationSectionTitle: string;
  taskSectionTitle: string;
  reviewSectionTitle: string;
  tomorrowTaskSectionTitle: string;
  reusableKnowledgeSectionTitle: string;
  taskLineTemplate: string;
  completionReviewTemplate: string;
  presetId: ObsidianTemplatePresetId;
  modules: Record<ObsidianTemplateModuleId, ObsidianTemplateModuleSettings>;
}
```

Replace `createDefaultObsidianTemplateSettings()` with:

```ts
export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  return syncTemplateTitlesFromModules({
    dailyNotePath: 'logs/daily/DailyTodo/{{date}}.md',
    taskExportPath: 'logs/daily/DailyTodo/tasks/{{date}}.md',
    workSectionTitle: '今日工作',
    inspirationSectionTitle: '灵感闪念',
    taskSectionTitle: '每日任务',
    reviewSectionTitle: '复盘',
    tomorrowTaskSectionTitle: '明日待办',
    reusableKnowledgeSectionTitle: '可复用知识',
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
    presetId: 'simple',
    modules: createDefaultModules(),
  });
}
```

Replace `normalizeObsidianTemplateSettings()` with:

```ts
export function normalizeObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!isObject(value)) return defaults;

  const legacyTitles: Partial<Record<ObsidianTemplateModuleId, string>> = {
    work: text(value.workSectionTitle, defaults.workSectionTitle),
    inspiration: text(value.inspirationSectionTitle, defaults.inspirationSectionTitle),
    tasks: text(value.taskSectionTitle, defaults.taskSectionTitle),
    review: text(value.reviewSectionTitle, defaults.reviewSectionTitle),
    tomorrow: text(value.tomorrowTaskSectionTitle, defaults.tomorrowTaskSectionTitle),
    knowledge: text(value.reusableKnowledgeSectionTitle, defaults.reusableKnowledgeSectionTitle),
  };

  return syncTemplateTitlesFromModules({
    dailyNotePath: text(value.dailyNotePath, defaults.dailyNotePath),
    taskExportPath: text(value.taskExportPath, defaults.taskExportPath),
    workSectionTitle: legacyTitles.work ?? defaults.workSectionTitle,
    inspirationSectionTitle: legacyTitles.inspiration ?? defaults.inspirationSectionTitle,
    taskSectionTitle: legacyTitles.tasks ?? defaults.taskSectionTitle,
    reviewSectionTitle: legacyTitles.review ?? defaults.reviewSectionTitle,
    tomorrowTaskSectionTitle: legacyTitles.tomorrow ?? defaults.tomorrowTaskSectionTitle,
    reusableKnowledgeSectionTitle: legacyTitles.knowledge ?? defaults.reusableKnowledgeSectionTitle,
    taskLineTemplate: text(value.taskLineTemplate, defaults.taskLineTemplate),
    completionReviewTemplate: text(value.completionReviewTemplate, defaults.completionReviewTemplate),
    presetId: normalizeTemplatePresetId(value.presetId),
    modules: normalizeTemplateModules(value.modules, legacyTitles),
  });
}
```

- [ ] **Step 3: Add the first verification script**

Create `app/scripts/verify-obsidian-template-center.ts` with this content:

```ts
import { strict as assert } from 'node:assert';
import {
  applyObsidianTemplatePreset,
  createDefaultModules,
  updateAdvancedTemplateField,
  updateTemplateModule,
} from '../shared/obsidianTemplateCenter';
import {
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
} from '../shared/appSettings';

const defaults = createDefaultObsidianTemplateSettings();

assert.equal(defaults.presetId, 'simple');
assert.equal(defaults.modules.work.enabled, true);
assert.equal(defaults.modules.inspiration.enabled, false);
assert.equal(defaults.workSectionTitle, defaults.modules.work.title);

const legacy = normalizeObsidianTemplateSettings({
  dailyNotePath: 'daily/{{date}}.md',
  taskExportPath: 'tasks/{{date}}.md',
  workSectionTitle: '推进事项',
  inspirationSectionTitle: '想法',
  taskSectionTitle: '任务',
  reviewSectionTitle: '复盘',
  tomorrowTaskSectionTitle: '下一步',
  reusableKnowledgeSectionTitle: '知识',
  taskLineTemplate: '- [{{checked}}] {{text}}',
  completionReviewTemplate: '- {{summary}}',
});

assert.equal(legacy.presetId, 'simple');
assert.equal(legacy.modules.work.title, '推进事项');
assert.equal(legacy.workSectionTitle, '推进事项');
assert.equal(legacy.modules.knowledge.title, '知识');

const workReview = applyObsidianTemplatePreset(defaults, 'work-review');
assert.equal(workReview.presetId, 'work-review');
assert.equal(workReview.modules.tomorrow.enabled, true);
assert.equal(workReview.taskSectionTitle, '任务与完成记录');

const custom = updateTemplateModule(workReview, 'inspiration', { enabled: true, title: '闪念' });
assert.equal(custom.presetId, 'custom');
assert.equal(custom.modules.inspiration.enabled, true);
assert.equal(custom.inspirationSectionTitle, '闪念');

const advanced = updateAdvancedTemplateField(custom, 'reviewSectionTitle', '阶段复盘');
assert.equal(advanced.presetId, 'custom');
assert.equal(advanced.modules.review.title, '阶段复盘');
assert.equal(advanced.reviewSectionTitle, '阶段复盘');

const rawModules = createDefaultModules();
rawModules.tasks.enabled = false;
const normalized = normalizeObsidianTemplateSettings({ ...defaults, modules: rawModules });
assert.equal(normalized.modules.tasks.enabled, false);

console.log('Obsidian template center verification passed');
```

- [ ] **Step 4: Add package script**

In `app/package.json`, add this script entry after `verify:recognize-report`:

```json
"verify:obsidian-template-center": "tsx scripts/verify-obsidian-template-center.ts"
```

Because `verify:recognize-report` is currently the last script, add a comma to the previous line.

- [ ] **Step 5: Run the failing verification before implementation if not already implemented**

Run:

```bash
cd app && npm run verify:obsidian-template-center
```

Expected before all Task 1 code is complete: TypeScript import or assertion failure.

Expected after Step 1-4 are complete:

```text
Obsidian template center verification passed
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: `tsc` exits successfully with no TypeScript errors.

- [ ] **Step 7: Checkpoint**

If commits are authorized in the execution session:

```bash
git add app/shared/obsidianTemplateCenter.ts app/shared/appSettings.ts app/scripts/verify-obsidian-template-center.ts app/package.json
git commit -m "feat(obsidian): add template center settings model"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Task 2: Make daily-note rendering respect module toggles

**Files:**
- Modify: `app/shared/obsidianTemplates.ts`
- Modify: `app/scripts/verify-obsidian-template-center.ts`

- [ ] **Step 1: Extend the verification script with rendering assertions**

Append this block to `app/scripts/verify-obsidian-template-center.ts` before the final `console.log()`:

```ts
import { buildDailyNoteContent, buildSyncPreview } from '../shared/obsidianTemplates';

const noWork = updateTemplateModule(defaults, 'work', { enabled: false });
const noWorkContent = buildDailyNoteContent({
  date: '2026-06-10',
  tasks: [],
  dailyWork: 'should not render',
  dailyInspiration: '',
  templates: noWork,
});
assert.equal(noWorkContent.includes('DAILYTODO:WORK:START'), false);
assert.equal(noWorkContent.includes('should not render'), false);
assert.equal(noWorkContent.includes('DAILYTODO:TASKS:START'), true);
assert.equal(noWorkContent.includes('DAILYTODO:REVIEW:START'), true);

const noTasks = updateTemplateModule(defaults, 'tasks', { enabled: false });
const noTasksPreview = buildSyncPreview({
  date: '2026-06-10',
  tasksAfterDelete: [],
  dailyWork: '',
  dailyInspiration: '',
  templates: noTasks,
  vaultPath: process.cwd(),
  existingDailyNote: '',
});
assert.equal(noTasksPreview.managedBlocks.some((block) => block.marker === 'DAILYTODO:TASKS'), false);
```

Also move the existing final line so the file still ends with:

```ts
console.log('Obsidian template center verification passed');
```

- [ ] **Step 2: Update `buildDailyNoteContent()`**

In `app/shared/obsidianTemplates.ts`, replace `buildDailyNoteContent()` with:

```ts
export function buildDailyNoteContent(params: {
  date: string;
  tasks: Task[];
  dailyWork: string;
  dailyInspiration: string;
  templates: ObsidianTemplateSettings;
}) {
  const { date, tasks, dailyWork, dailyInspiration, templates } = params;
  const content = [
    '---',
    `title: "DailyTodo ${date}"`,
    `date: "${date}"`,
    'tags: [daily-todo, daily-review, knowledge-base]',
    '---',
    '',
    `# ${date} 每日记录`,
    '',
  ];

  if (templates.modules.work.enabled) {
    content.push(buildWorkBlock(dailyWork, templates), '');
  }

  if (templates.modules.inspiration.enabled) {
    content.push(buildInspirationBlock(dailyInspiration, templates), '');
  }

  if (templates.modules.tasks.enabled) {
    content.push(buildTaskBlock(date, tasks, templates), '');
  }

  // 标题在 marker 块外，块内只放 AI 托管内容并默认留空，
  // 这样补偿扫描会把空块判为 Unprocessed 并填充，标题始终可见。
  if (templates.modules.review.enabled) {
    content.push(`## ${templates.reviewSectionTitle}`, REVIEW_MARKERS.REVIEW.start, REVIEW_MARKERS.REVIEW.end, '');
  }

  if (templates.modules.tomorrow.enabled) {
    content.push(`## ${templates.tomorrowTaskSectionTitle}`, REVIEW_MARKERS.TOMORROW.start, REVIEW_MARKERS.TOMORROW.end, '');
  }

  if (templates.modules.knowledge.enabled) {
    content.push(`## ${templates.reusableKnowledgeSectionTitle}`, REVIEW_MARKERS.KNOWLEDGE.start, REVIEW_MARKERS.KNOWLEDGE.end, '');
  }

  return content.join('\n');
}
```

- [ ] **Step 3: Update `buildSyncPreview()` managed blocks**

In `app/shared/obsidianTemplates.ts`, replace the `managedBlocks` array inside `buildSyncPreview()` with:

```ts
    managedBlocks: [
      params.templates.modules.work.enabled
        ? { marker: 'DAILYTODO:WORK' as const, action: existingDailyNote.includes(WORK_START_MARKER) ? 'replace' as const : 'insert' as const }
        : null,
      params.templates.modules.inspiration.enabled
        ? { marker: 'DAILYTODO:INSPIRATION' as const, action: existingDailyNote.includes(INSPIRATION_START_MARKER) ? 'replace' as const : 'insert' as const }
        : null,
      params.templates.modules.tasks.enabled
        ? { marker: 'DAILYTODO:TASKS' as const, action: existingDailyNote.includes(TASK_START_MARKER) ? 'replace' as const : 'insert' as const }
        : null,
    ].filter((block): block is SyncPreviewBlock => block !== null),
```

- [ ] **Step 4: Prevent disabled blocks from being upserted during sync**

In `app/electron/main.ts`, replace this block inside `syncOneDailyNote()`:

```ts
  const withWork = upsertMarkedBlock(migratedInspiration, WORK_START_MARKER, WORK_END_MARKER, buildWorkBlock(nextWork, templates));
  const withInspiration = upsertMarkedBlock(withWork, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER, buildInspirationBlock(nextInspiration, templates));
  const nextContent = upsertMarkedBlock(withInspiration, TASK_START_MARKER, TASK_END_MARKER, buildTaskBlock(selected, tasks, templates));
```

with:

```ts
  const withWork = templates.modules.work.enabled
    ? upsertMarkedBlock(migratedInspiration, WORK_START_MARKER, WORK_END_MARKER, buildWorkBlock(nextWork, templates))
    : migratedInspiration;
  const withInspiration = templates.modules.inspiration.enabled
    ? upsertMarkedBlock(withWork, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER, buildInspirationBlock(nextInspiration, templates))
    : withWork;
  const nextContent = templates.modules.tasks.enabled
    ? upsertMarkedBlock(withInspiration, TASK_START_MARKER, TASK_END_MARKER, buildTaskBlock(selected, tasks, templates))
    : withInspiration;
```

This preserves existing disabled blocks in old notes instead of deleting them.

- [ ] **Step 5: Run verification**

Run:

```bash
cd app && npm run verify:obsidian-template-center
```

Expected:

```text
Obsidian template center verification passed
```

- [ ] **Step 6: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 7: Checkpoint**

If commits are authorized:

```bash
git add app/shared/obsidianTemplates.ts app/electron/main.ts app/scripts/verify-obsidian-template-center.ts
git commit -m "feat(obsidian): render daily notes from enabled modules"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Task 3: Add Obsidian template AI recognition parser

**Files:**
- Create: `app/shared/obsidianTemplateRecognition.ts`
- Create: `app/scripts/verify-obsidian-template-recognition.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Create the recognition helper**

Create `app/shared/obsidianTemplateRecognition.ts` with this content:

```ts
import type { ChatMessage } from './llm/openaiClient';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  createDefaultModules,
  normalizeTemplateModules,
  normalizeTemplatePresetId,
  type ObsidianTemplateModules,
  type ObsidianTemplatePresetId,
} from './obsidianTemplateCenter';

export const MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS = 20_000;

export interface RecognizedUnmappedSection {
  title: string;
  reason: string;
  excerpt: string;
}

export interface RecognizedObsidianTemplateDraft {
  presetId: ObsidianTemplatePresetId;
  dailyNotePath?: string;
  modules: ObsidianTemplateModules;
  taskLineTemplate?: string;
  completionReviewTemplate?: string;
  unmappedSections: RecognizedUnmappedSection[];
  notes: string[];
  unmatched: boolean;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function cleanJson(raw: string) {
  return raw
    .replace(/^```(?:json|markdown|md)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
}

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function optionalText(value: unknown) {
  const trimmed = text(value);
  return trimmed || undefined;
}

function textArray(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => text(item)).filter(Boolean)
    : [];
}

function unmappedSections(value: unknown): RecognizedUnmappedSection[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!isObject(item)) return null;
      const title = text(item.title) || '未命名片段';
      const reason = text(item.reason) || '无法可靠映射到 DailyTodo 模块';
      const excerpt = text(item.excerpt).slice(0, 500);
      return { title, reason, excerpt };
    })
    .filter((item): item is RecognizedUnmappedSection => item !== null);
}

function fallbackDraft(unmatched = true): RecognizedObsidianTemplateDraft {
  return {
    presetId: 'simple',
    modules: createDefaultModules(),
    unmappedSections: [],
    notes: unmatched ? ['未能识别出可靠模板结构，已回落到简洁日记。'] : [],
    unmatched,
  };
}

export function buildRecognizeObsidianTemplateMessages(rawTemplate: string): ChatMessage[] {
  const clipped = rawTemplate.slice(0, MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS);
  return [
    {
      role: 'system',
      content:
        '用户会给出一段 Obsidian 每日记录模板。请识别它适合映射到 DailyTodo 的哪些模块，并只输出 JSON。' +
        'JSON 格式必须是：{"presetId":"simple"|"work-review"|"knowledge"|"custom","dailyNotePath":"可选路径","modules":{"work":{"enabled":boolean,"title":"标题"},"inspiration":{"enabled":boolean,"title":"标题"},"tasks":{"enabled":boolean,"title":"标题"},"review":{"enabled":boolean,"title":"标题"},"tomorrow":{"enabled":boolean,"title":"标题"},"knowledge":{"enabled":boolean,"title":"标题"}},"taskLineTemplate":"可选","completionReviewTemplate":"可选","unmappedSections":[{"title":"标题","reason":"原因","excerpt":"片段"}],"notes":["给用户看的简短说明"]}。' +
        '不要输出代码块围栏，不要解释。无法确定的内容放入 unmappedSections，不要硬塞进模块。DailyTodo 支持的模块只有：今日工作、灵感闪念、每日任务、AI 复盘、明日待办、可复用知识。',
    },
    { role: 'user', content: clipped.trim() || '（空模板）' },
  ];
}

export function parseRecognizedObsidianTemplateDraft(raw: string): RecognizedObsidianTemplateDraft {
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleanJson(raw));
  } catch {
    return fallbackDraft(true);
  }

  if (!isObject(parsed)) return fallbackDraft(true);

  const modules = normalizeTemplateModules(parsed.modules);
  const hasEnabledModule = OBSIDIAN_TEMPLATE_MODULE_IDS.some((id) => modules[id].enabled);
  if (!hasEnabledModule) return fallbackDraft(true);

  return {
    presetId: normalizeTemplatePresetId(parsed.presetId),
    dailyNotePath: optionalText(parsed.dailyNotePath),
    modules,
    taskLineTemplate: optionalText(parsed.taskLineTemplate),
    completionReviewTemplate: optionalText(parsed.completionReviewTemplate),
    unmappedSections: unmappedSections(parsed.unmappedSections),
    notes: textArray(parsed.notes),
    unmatched: false,
  };
}

export function validateObsidianTemplateRecognitionInput(rawTemplate: unknown) {
  if (typeof rawTemplate !== 'string' || !rawTemplate.trim()) {
    return { ok: false as const, error: '请粘贴你的 Obsidian 模板内容' };
  }
  if (rawTemplate.length > MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS) {
    return {
      ok: false as const,
      error: `模板太长，请控制在 ${MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS} 个字符以内再识别`,
    };
  }
  return { ok: true as const, rawTemplate };
}
```

- [ ] **Step 2: Create recognition verification script**

Create `app/scripts/verify-obsidian-template-recognition.ts` with this content:

```ts
import { strict as assert } from 'node:assert';
import {
  MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS,
  buildRecognizeObsidianTemplateMessages,
  parseRecognizedObsidianTemplateDraft,
  validateObsidianTemplateRecognitionInput,
} from '../shared/obsidianTemplateRecognition';

const messages = buildRecognizeObsidianTemplateMessages('# Daily\n## 今日推进\n## 明日计划');
assert.equal(messages.length, 2);
assert.ok(messages[0].content.includes('DailyTodo'));
assert.ok(messages[1].content.includes('今日推进'));

const parsed = parseRecognizedObsidianTemplateDraft(JSON.stringify({
  presetId: 'custom',
  dailyNotePath: 'Journal/{{date}}.md',
  modules: {
    work: { enabled: true, title: '今日推进' },
    inspiration: { enabled: false, title: '灵感' },
    tasks: { enabled: true, title: '任务' },
    review: { enabled: true, title: '复盘' },
    tomorrow: { enabled: true, title: '明日计划' },
    knowledge: { enabled: false, title: '知识' },
  },
  taskLineTemplate: '- [{{checked}}] {{text}}',
  completionReviewTemplate: '- {{summary}}',
  unmappedSections: [{ title: '天气', reason: '不是 DailyTodo 模块', excerpt: '晴' }],
  notes: ['已识别 4 个模块'],
}));
assert.equal(parsed.unmatched, false);
assert.equal(parsed.dailyNotePath, 'Journal/{{date}}.md');
assert.equal(parsed.modules.work.title, '今日推进');
assert.equal(parsed.modules.tomorrow.enabled, true);
assert.equal(parsed.unmappedSections[0].title, '天气');

const dirty = parseRecognizedObsidianTemplateDraft('```json\n{"presetId":"knowledge","modules":{"knowledge":{"enabled":true,"title":"知识"}}}\n```');
assert.equal(dirty.unmatched, false);
assert.equal(dirty.presetId, 'knowledge');
assert.equal(dirty.modules.knowledge.enabled, true);

const fallback = parseRecognizedObsidianTemplateDraft('not json');
assert.equal(fallback.unmatched, true);
assert.equal(fallback.presetId, 'simple');
assert.equal(fallback.modules.work.enabled, true);

const empty = validateObsidianTemplateRecognitionInput('');
assert.equal(empty.ok, false);

const tooLong = validateObsidianTemplateRecognitionInput('x'.repeat(MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS + 1));
assert.equal(tooLong.ok, false);

console.log('Obsidian template recognition verification passed');
```

- [ ] **Step 3: Add package script**

In `app/package.json`, add:

```json
"verify:obsidian-template-recognition": "tsx scripts/verify-obsidian-template-recognition.ts"
```

- [ ] **Step 4: Run recognition verification**

Run:

```bash
cd app && npm run verify:obsidian-template-recognition
```

Expected:

```text
Obsidian template recognition verification passed
```

- [ ] **Step 5: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 6: Checkpoint**

If commits are authorized:

```bash
git add app/shared/obsidianTemplateRecognition.ts app/scripts/verify-obsidian-template-recognition.ts app/package.json
git commit -m "feat(obsidian): parse recognized template drafts"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Task 4: Wire recognition through Electron IPC and preload

**Files:**
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Create: `app/scripts/verify-obsidian-template-ui.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Import recognition helpers in main process**

In `app/electron/main.ts`, add these imports near the existing AI review recognition imports:

```ts
import {
  buildRecognizeObsidianTemplateMessages,
  parseRecognizedObsidianTemplateDraft,
  validateObsidianTemplateRecognitionInput,
} from '../shared/obsidianTemplateRecognition';
```

- [ ] **Step 2: Add the recognition IPC handler**

In `app/electron/main.ts`, add this handler after `aiReview:pickTemplateFile` and before `obsidian:getPath`:

```ts
  ipcMain.handle('obsidianTemplate:recognize', async (_e, rawTemplate: string) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { ok: false, error: 'AI 复盘未启用或缺少 Key', draft: null };
    }

    const input = validateObsidianTemplateRecognitionInput(rawTemplate);
    if (!input.ok) return { ok: false, error: input.error, draft: null };

    const llm = await getLlmCaller()(buildRecognizeObsidianTemplateMessages(input.rawTemplate));
    if (!llm.ok) return { ok: false, error: llm.error, draft: null };

    const draft = parseRecognizedObsidianTemplateDraft(llm.content);
    return { ok: true, draft };
  });
```

- [ ] **Step 3: Add the template file picker IPC handler**

In `app/electron/main.ts`, add this handler immediately after `obsidianTemplate:recognize`:

```ts
  ipcMain.handle('obsidianTemplate:pickTemplateFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: zh('选择 Obsidian 模板文件（.md）'),
      defaultPath: getVaultPath() || app.getPath('documents'),
      properties: ['openFile'],
      filters: [{ name: zh('Markdown 模板'), extensions: ['md'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };

    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    try {
      const text = fs.readFileSync(filePath, 'utf-8').trim();
      if (!text) return { ok: false, error: '文件内容为空' };
      return { ok: true, text, fileName };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
```

- [ ] **Step 4: Expose preload APIs**

In `app/electron/preload.ts`, add this object after the `aiReview` object or before it inside `electronAPI`:

```ts
  obsidianTemplate: {
    recognize: (rawTemplate: string) => ipcRenderer.invoke('obsidianTemplate:recognize', rawTemplate),
    pickTemplateFile: () => ipcRenderer.invoke('obsidianTemplate:pickTemplateFile'),
  },
```

- [ ] **Step 5: Add renderer global types**

In `app/src/vite-env.d.ts`, add this block before `aiReview: {` inside `electronAPI`:

```ts
    obsidianTemplate: {
      recognize: (rawTemplate: string) => Promise<
        | { ok: true; draft: import('../shared/obsidianTemplateRecognition').RecognizedObsidianTemplateDraft }
        | { ok: false; error: string; draft: null }
      >;
      pickTemplateFile: () => Promise<{ ok: boolean; text?: string; fileName?: string; error?: string; canceled?: boolean }>;
    };
```

- [ ] **Step 6: Add static wiring verification**

Create `app/scripts/verify-obsidian-template-ui.ts` with this content:

```ts
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const main = fs.readFileSync(path.join(root, 'electron/main.ts'), 'utf-8');
const preload = fs.readFileSync(path.join(root, 'electron/preload.ts'), 'utf-8');
const viteEnv = fs.readFileSync(path.join(root, 'src/vite-env.d.ts'), 'utf-8');

assert.ok(main.includes("ipcMain.handle('obsidianTemplate:recognize'"), 'main exposes obsidianTemplate:recognize');
assert.ok(main.includes("ipcMain.handle('obsidianTemplate:pickTemplateFile'"), 'main exposes obsidianTemplate:pickTemplateFile');
assert.ok(preload.includes('obsidianTemplate: {'), 'preload exposes obsidianTemplate namespace');
assert.ok(preload.includes("ipcRenderer.invoke('obsidianTemplate:recognize'"), 'preload wires recognize');
assert.ok(viteEnv.includes('obsidianTemplate: {'), 'vite-env types obsidianTemplate namespace');
assert.ok(viteEnv.includes('RecognizedObsidianTemplateDraft'), 'vite-env references recognition draft type');

console.log('Obsidian template UI wiring verification passed');
```

- [ ] **Step 7: Add package script**

In `app/package.json`, add:

```json
"verify:obsidian-template-ui": "tsx scripts/verify-obsidian-template-ui.ts"
```

- [ ] **Step 8: Run wiring verification**

Run:

```bash
cd app && npm run verify:obsidian-template-ui
```

Expected:

```text
Obsidian template UI wiring verification passed
```

- [ ] **Step 9: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 10: Checkpoint**

If commits are authorized:

```bash
git add app/electron/main.ts app/electron/preload.ts app/src/vite-env.d.ts app/scripts/verify-obsidian-template-ui.ts app/package.json
git commit -m "feat(obsidian): expose template recognition ipc"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Task 5: Build the renderer Template Center component

**Files:**
- Create: `app/src/components/ObsidianTemplateCenter.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/scripts/verify-obsidian-template-ui.ts`

- [ ] **Step 1: Create the focused renderer component**

Create `app/src/components/ObsidianTemplateCenter.tsx` with this content:

```tsx
import { useState } from 'react';
import type { ObsidianTemplateSettings } from '../../shared/appSettings';
import {
  OBSIDIAN_TEMPLATE_MODULE_IDS,
  OBSIDIAN_TEMPLATE_MODULE_LABELS,
  OBSIDIAN_TEMPLATE_PRESETS,
  applyObsidianTemplatePreset,
  updateAdvancedTemplateField,
  updateTemplateModule,
  type ObsidianTemplateModuleId,
} from '../../shared/obsidianTemplateCenter';
import type { RecognizedObsidianTemplateDraft } from '../../shared/obsidianTemplateRecognition';

type Language = 'zh-CN' | 'en-US';

interface ObsidianTemplateCenterProps {
  language: Language;
  templates: ObsidianTemplateSettings;
  onChange: (settings: ObsidianTemplateSettings) => void;
  onPreviewSync: () => void;
  onResetTemplates: () => void;
}

function Field({
  label,
  hint,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="settings-field">
      <span>
        <strong>{label}</strong>
        {hint && <small>{hint}</small>}
      </span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function draftToSettings(current: ObsidianTemplateSettings, draft: RecognizedObsidianTemplateDraft): ObsidianTemplateSettings {
  const next: ObsidianTemplateSettings = {
    ...current,
    presetId: draft.presetId,
    dailyNotePath: draft.dailyNotePath || current.dailyNotePath,
    modules: draft.modules,
    taskLineTemplate: draft.taskLineTemplate || current.taskLineTemplate,
    completionReviewTemplate: draft.completionReviewTemplate || current.completionReviewTemplate,
  };

  return OBSIDIAN_TEMPLATE_MODULE_IDS.reduce(
    (settings, moduleId) => updateTemplateModule(settings, moduleId, settings.modules[moduleId]),
    next,
  );
}

export function ObsidianTemplateCenter({
  language,
  templates,
  onChange,
  onPreviewSync,
  onResetTemplates,
}: ObsidianTemplateCenterProps) {
  const zh = language === 'zh-CN';
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [draftText, setDraftText] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [status, setStatus] = useState('');
  const [recognizedDraft, setRecognizedDraft] = useState<RecognizedObsidianTemplateDraft | null>(null);

  const chooseFile = async () => {
    try {
      const result = await window.electronAPI?.obsidianTemplate.pickTemplateFile();
      if (!result || result.canceled) return;
      if (!result.ok) {
        setStatus(`${zh ? '读取模板失败：' : 'Failed to read template: '}${result.error ?? ''}`);
        return;
      }
      setDraftText(result.text ?? '');
      setStatus(result.fileName ? `${zh ? '已读取：' : 'Loaded: '}${result.fileName}` : '');
    } catch (error) {
      setStatus(`${zh ? '读取模板失败：' : 'Failed to read template: '}${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const recognize = async () => {
    if (!draftText.trim()) return;
    setRecognizing(true);
    setRecognizedDraft(null);
    setStatus(zh ? '正在识别模板……' : 'Recognizing template...');
    try {
      const result = await window.electronAPI?.obsidianTemplate.recognize(draftText);
      if (!result || !result.ok) {
        setStatus(`${zh ? '识别失败：' : 'Recognition failed: '}${result?.error ?? ''}`);
        return;
      }
      setRecognizedDraft(result.draft);
      setStatus(result.draft.unmatched ? (zh ? '识别不够确定，已生成保守草稿。' : 'Low confidence; conservative draft created.') : (zh ? '已生成模板草稿。' : 'Template draft ready.'));
    } catch (error) {
      setStatus(`${zh ? '识别失败：' : 'Recognition failed: '}${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setRecognizing(false);
    }
  };

  const applyDraft = () => {
    if (!recognizedDraft) return;
    onChange(draftToSettings(templates, recognizedDraft));
    setRecognizedDraft(null);
    setDraftText('');
    setStatus(zh ? '已应用到设置。' : 'Applied to settings.');
  };

  const setAdvanced = <K extends keyof ObsidianTemplateSettings>(key: K, value: ObsidianTemplateSettings[K]) => {
    onChange(updateAdvancedTemplateField(templates, key, value));
  };

  return (
    <div className="obsidian-template-center">
      <section className="settings-section">
        <h3>{zh ? '模板中心' : 'Template Center'}</h3>
        <Field
          label={zh ? '每日记录位置' : 'Daily note target path'}
          hint={zh ? '{{date}} 会替换成当天日期。' : '{{date}} is replaced with the date.'}
          value={templates.dailyNotePath}
          onChange={(value) => setAdvanced('dailyNotePath', value)}
        />
      </section>

      <section className="settings-section">
        <h3>{zh ? '模板风格' : 'Template Style'}</h3>
        <div className="template-preset-grid">
          {OBSIDIAN_TEMPLATE_PRESETS.map((preset) => {
            const active = templates.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                className={`template-preset-card ${active ? 'template-preset-card-active' : ''}`}
                onClick={() => onChange(applyObsidianTemplatePreset(templates, preset.id))}
                aria-pressed={active}
              >
                <strong>{zh ? preset.labelZh : preset.labelEn}</strong>
                <small>{zh ? preset.descriptionZh : preset.descriptionEn}</small>
              </button>
            );
          })}
          {templates.presetId === 'custom' && (
            <div className="template-preset-card template-preset-card-active" aria-live="polite">
              <strong>{zh ? '自定义' : 'Custom'}</strong>
              <small>{zh ? '你已手动调整模板。' : 'You have manually adjusted this template.'}</small>
            </div>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3>{zh ? '记录模块' : 'Sections'}</h3>
        <div className="template-module-list">
          {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId: ObsidianTemplateModuleId) => {
            const module = templates.modules[moduleId];
            const label = OBSIDIAN_TEMPLATE_MODULE_LABELS[moduleId];
            return (
              <div key={moduleId} className="template-module-row">
                <label className="toggle-row compact-toggle-row">
                  <input
                    type="checkbox"
                    checked={module.enabled}
                    onChange={(event) => onChange(updateTemplateModule(templates, moduleId, { enabled: event.target.checked }))}
                  />
                  <span>{zh ? label.zh : label.en}</span>
                </label>
                <input
                  value={module.title}
                  onChange={(event) => onChange(updateTemplateModule(templates, moduleId, { title: event.target.value }))}
                  aria-label={`${zh ? label.zh : label.en} title`}
                />
              </div>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <h3>{zh ? 'AI 识别模板' : 'AI Template Import'}</h3>
        <div className="settings-preview-list">
          <p>{zh ? '粘贴你的 Obsidian 模板，或选择 .md 文件，AI 会整理成 DailyTodo 可维护的模块。' : 'Paste an Obsidian template or choose a .md file. AI will map it to DailyTodo sections.'}</p>
        </div>
        <textarea
          className="template-import-textarea"
          rows={6}
          value={draftText}
          onChange={(event) => setDraftText(event.target.value)}
          placeholder={zh ? '在这里粘贴 Obsidian Markdown 模板……' : 'Paste Obsidian Markdown template here...'}
        />
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={chooseFile}>
            {zh ? '选择 .md 文件' : 'Choose .md File'}
          </button>
          <button type="button" className="settings-reset-button" onClick={recognize} disabled={recognizing || !draftText.trim()}>
            {recognizing ? (zh ? '识别中……' : 'Recognizing...') : (zh ? 'AI 识别' : 'Recognize')}
          </button>
        </div>
        {status && <p className="settings-status-text">{status}</p>}
        {recognizedDraft && (
          <div className="template-recognition-preview">
            <h4>{zh ? '识别草稿' : 'Recognized Draft'}</h4>
            <ul>
              {OBSIDIAN_TEMPLATE_MODULE_IDS.map((moduleId) => (
                <li key={moduleId}>
                  {recognizedDraft.modules[moduleId].enabled ? '✅' : '—'} {recognizedDraft.modules[moduleId].title}
                </li>
              ))}
            </ul>
            {recognizedDraft.dailyNotePath && <p>{zh ? '推荐路径：' : 'Suggested path: '}{recognizedDraft.dailyNotePath}</p>}
            {recognizedDraft.unmappedSections.length > 0 && (
              <div>
                <strong>{zh ? '未识别内容' : 'Unmapped content'}</strong>
                <ul>
                  {recognizedDraft.unmappedSections.map((section, index) => (
                    <li key={`${section.title}-${index}`}>{section.title}：{section.reason}</li>
                  ))}
                </ul>
              </div>
            )}
            {recognizedDraft.notes.map((note, index) => <p key={index}>{note}</p>)}
            <button type="button" className="settings-reset-button" onClick={applyDraft}>
              {zh ? '应用到设置' : 'Apply to Settings'}
            </button>
          </div>
        )}
      </section>

      <section className="settings-section">
        <button type="button" className="settings-reset-button" onClick={() => setAdvancedOpen((open) => !open)}>
          {advancedOpen ? (zh ? '收起高级模板设置' : 'Hide Advanced Template Settings') : (zh ? '高级模板设置' : 'Advanced Template Settings')}
        </button>
        {advancedOpen && (
          <div className="template-advanced-fields">
            <Field label="Legacy task export path" hint="RC sync no longer writes this file by default. Existing task export files are left untouched." value={templates.taskExportPath} onChange={(value) => setAdvanced('taskExportPath', value)} />
            <Field label="Work section title" value={templates.workSectionTitle} onChange={(value) => setAdvanced('workSectionTitle', value)} />
            <Field label="Inspiration section title" value={templates.inspirationSectionTitle} onChange={(value) => setAdvanced('inspirationSectionTitle', value)} />
            <Field label="Task section title" value={templates.taskSectionTitle} onChange={(value) => setAdvanced('taskSectionTitle', value)} />
            <Field label="Review section title" value={templates.reviewSectionTitle} onChange={(value) => setAdvanced('reviewSectionTitle', value)} />
            <Field label="Tomorrow task section title" value={templates.tomorrowTaskSectionTitle} onChange={(value) => setAdvanced('tomorrowTaskSectionTitle', value)} />
            <Field label="Reusable knowledge section title" value={templates.reusableKnowledgeSectionTitle} onChange={(value) => setAdvanced('reusableKnowledgeSectionTitle', value)} />
            <Field label="Task line template" value={templates.taskLineTemplate} onChange={(value) => setAdvanced('taskLineTemplate', value)} />
            <Field label="Completion review template" value={templates.completionReviewTemplate} onChange={(value) => setAdvanced('completionReviewTemplate', value)} multiline />
          </div>
        )}
        <div className="settings-action-row">
          <button type="button" className="settings-reset-button" onClick={onPreviewSync}>{zh ? '预览同步' : 'Preview Sync'}</button>
          <button type="button" className="settings-reset-button" onClick={onResetTemplates}>{zh ? '重置模板' : 'Reset Templates'}</button>
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Import the component in `SettingsPanel.tsx`**

In `app/src/components/SettingsPanel.tsx`, add:

```ts
import { ObsidianTemplateCenter } from './ObsidianTemplateCenter';
```

- [ ] **Step 3: Remove unused default-template code if it becomes unused**

If `defaultTemplates` is only used by the developer reset button, keep it. If TypeScript reports it is unused after replacing the UI, remove this line:

```ts
const defaultTemplates = useMemo(() => createDefaultObsidianTemplateSettings(), []);
```

and remove `createDefaultObsidianTemplateSettings` / `useMemo` imports only if they become unused. Keep whichever imports are still needed by surrounding code.

- [ ] **Step 4: Replace the raw template-center section in `SettingsPanel.tsx`**

Inside the `section === 'obsidian'` branch, replace the current `<section className="settings-section">` whose heading is `{text.templateCenter}` through its closing `</section>` with:

```tsx
          <ObsidianTemplateCenter
            language={appSettings.language}
            templates={obsidianTemplates}
            onChange={onObsidianTemplatesChange}
            onPreviewSync={onPreviewSync}
            onResetTemplates={onResetTemplates}
          />
```

Also remove these two fields from the Obsidian paths section, because the new component owns daily path and advanced legacy path:

```tsx
            <Field label="Daily note target path" value={obsidianTemplates.dailyNotePath} onChange={(value) => updateTemplate('dailyNotePath', value)} />
            <Field
              label="Legacy task export path"
              hint="RC sync no longer writes this file by default. Existing task export files are left untouched."
              value={obsidianTemplates.taskExportPath}
              onChange={(value) => updateTemplate('taskExportPath', value)}
            />
```

- [ ] **Step 5: Remove `updateTemplate` if unused**

After Step 4, if TypeScript reports `updateTemplate` is unused, delete this function from `SettingsPanel.tsx`:

```ts
  const updateTemplate = <K extends keyof ObsidianTemplateSettings>(key: K, value: ObsidianTemplateSettings[K]) => {
    onObsidianTemplatesChange({ ...obsidianTemplates, [key]: value });
  };
```

Do not remove `ObsidianTemplateSettings` from imports if `SettingsPanelProps` still needs it.

- [ ] **Step 6: Extend static UI verification**

Append these checks to `app/scripts/verify-obsidian-template-ui.ts` before the final `console.log()`:

```ts
const component = fs.readFileSync(path.join(root, 'src/components/ObsidianTemplateCenter.tsx'), 'utf-8');
const settingsPanel = fs.readFileSync(path.join(root, 'src/components/SettingsPanel.tsx'), 'utf-8');

assert.ok(component.includes('AI 识别模板'), 'component renders AI import section');
assert.ok(component.includes('applyObsidianTemplatePreset'), 'component applies presets');
assert.ok(component.includes('updateTemplateModule'), 'component updates modules');
assert.ok(component.includes('recognizedDraft'), 'component previews recognized draft');
assert.ok(settingsPanel.includes('ObsidianTemplateCenter'), 'SettingsPanel uses ObsidianTemplateCenter');
```

- [ ] **Step 7: Run UI wiring verification**

Run:

```bash
cd app && npm run verify:obsidian-template-ui
```

Expected:

```text
Obsidian template UI wiring verification passed
```

- [ ] **Step 8: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: no TypeScript errors. If TypeScript flags unused imports from `SettingsPanel.tsx`, remove only the unused imports.

- [ ] **Step 9: Checkpoint**

If commits are authorized:

```bash
git add app/src/components/ObsidianTemplateCenter.tsx app/src/components/SettingsPanel.tsx app/scripts/verify-obsidian-template-ui.ts
git commit -m "feat(obsidian): add template center settings ui"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Task 6: Add styles for the Template Center

**Files:**
- Modify: `app/src/styles/globals.css`
- Modify: `app/scripts/verify-obsidian-template-ui.ts`

- [ ] **Step 1: Append CSS styles**

Append this CSS to `app/src/styles/globals.css`:

```css
.obsidian-template-center {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.template-preset-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.template-preset-card {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 14px;
  padding: 12px;
  text-align: left;
  background: rgba(255, 255, 255, 0.08);
  color: inherit;
  cursor: pointer;
}

.template-preset-card strong,
.template-preset-card small {
  display: block;
}

.template-preset-card small {
  margin-top: 6px;
  opacity: 0.72;
  line-height: 1.45;
}

.template-preset-card-active {
  border-color: color-mix(in srgb, var(--accent-color, #7c9cff) 70%, transparent);
  background: color-mix(in srgb, var(--accent-color, #7c9cff) 18%, transparent);
}

.template-module-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-module-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(150px, 1.2fr);
  align-items: center;
  gap: 10px;
}

.compact-toggle-row {
  min-height: auto;
  padding: 0;
}

.template-import-textarea {
  width: 100%;
  resize: vertical;
}

.settings-status-text {
  margin: 8px 0 0;
  opacity: 0.8;
  font-size: 0.9rem;
}

.template-recognition-preview,
.template-advanced-fields {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.template-recognition-preview {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 14px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.06);
}

.template-recognition-preview h4,
.template-recognition-preview p,
.template-recognition-preview ul {
  margin: 0;
}

.template-recognition-preview ul {
  padding-left: 18px;
}
```

- [ ] **Step 2: Extend static verification for CSS**

Append this check to `app/scripts/verify-obsidian-template-ui.ts` before the final `console.log()`:

```ts
const css = fs.readFileSync(path.join(root, 'src/styles/globals.css'), 'utf-8');
assert.ok(css.includes('.obsidian-template-center'), 'template center css exists');
assert.ok(css.includes('.template-preset-grid'), 'preset grid css exists');
assert.ok(css.includes('.template-module-row'), 'module row css exists');
```

- [ ] **Step 3: Run UI verification**

Run:

```bash
cd app && npm run verify:obsidian-template-ui
```

Expected:

```text
Obsidian template UI wiring verification passed
```

- [ ] **Step 4: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 5: Checkpoint**

If commits are authorized:

```bash
git add app/src/styles/globals.css app/scripts/verify-obsidian-template-ui.ts
git commit -m "style(obsidian): polish template center controls"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Task 7: Add all verifications to the release-check script and run final checks

**Files:**
- Modify: `app/package.json`

- [ ] **Step 1: Include new verifications in `verify:rc`**

In `app/package.json`, update the `verify:rc` script by appending these commands near the other AI/template checks:

```text
&& npm run verify:obsidian-template-center && npm run verify:obsidian-template-recognition && npm run verify:obsidian-template-ui
```

The resulting script should still be one JSON string and valid JSON.

- [ ] **Step 2: Run targeted feature checks**

Run:

```bash
cd app && npm run verify:obsidian-template-center && npm run verify:obsidian-template-recognition && npm run verify:obsidian-template-ui
```

Expected:

```text
Obsidian template center verification passed
Obsidian template recognition verification passed
Obsidian template UI wiring verification passed
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
cd app && npm run typecheck
```

Expected: no TypeScript errors.

- [ ] **Step 4: Run build**

Run:

```bash
cd app && npm run build
```

Expected: Electron Vite build completes successfully.

- [ ] **Step 5: Optional full RC verification**

Run this only if time is available because the existing RC chain is long:

```bash
cd app && npm run verify:rc
```

Expected: all existing and new verification scripts pass. If unrelated pre-existing scripts fail, capture the exact failing command and output.

- [ ] **Step 6: Manual smoke test**

Run:

```bash
cd app && npm run dev
```

Expected manual checks:

1. Open Settings → Obsidian Sync.
2. Confirm vault path and delete-sync controls are still visible.
3. Confirm Template Center shows daily-note path, three preset cards, module toggles/title inputs, AI import area, and advanced template settings button.
4. Select `工作复盘`; confirm 明日待办 becomes enabled and title changes to `明日待办` / task title changes to `任务与完成记录`.
5. Turn off `今日工作`; preview sync; confirm WORK block is absent from managed blocks.
6. Paste a small Markdown template, click AI 识别 with AI settings configured, confirm draft preview appears.
7. Click 应用到设置; confirm module titles update.
8. Reset templates; confirm defaults return.

Stop the dev server with Ctrl+C after testing.

- [ ] **Step 7: Final checkpoint**

If commits are authorized:

```bash
git add app/package.json
git commit -m "test(obsidian): add template center verification scripts"
```

If commits are not authorized, skip the commit and report the modified files.

---

## Self-Review

### Spec coverage

- Presets: Task 1 and Task 5.
- Module toggles/title editing: Task 1, Task 2, and Task 5.
- AI paste/file recognition: Task 3, Task 4, and Task 5.
- Draft preview/apply: Task 5.
- Advanced raw settings hidden by default: Task 5.
- Backward-compatible old settings: Task 1 verification covers legacy normalization.
- Rendering from enabled modules: Task 2.
- Sync preview module filtering: Task 2.
- Verification scripts: Tasks 1, 3, 4, 6, and 7.

### Placeholder scan

No placeholder tokens remain. Steps include exact file paths, code blocks, commands, and expected results.

### Type consistency

The plan uses these names consistently:

- `ObsidianTemplatePresetId`
- `ObsidianTemplateModuleId`
- `ObsidianTemplateModuleSettings`
- `ObsidianTemplateModules`
- `RecognizedObsidianTemplateDraft`
- `buildRecognizeObsidianTemplateMessages`
- `parseRecognizedObsidianTemplateDraft`
- `validateObsidianTemplateRecognitionInput`
- `ObsidianTemplateCenter`
- `obsidianTemplate.recognize`
- `obsidianTemplate.pickTemplateFile`
