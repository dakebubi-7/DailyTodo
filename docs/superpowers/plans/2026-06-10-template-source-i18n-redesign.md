# Template Source I18n Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified, bilingual template and source-material system for daily notes, personal weekly/monthly reports, and external weekly/monthly reports.

**Architecture:** Extend existing Electron/React settings instead of replacing them. Keep three boundaries separate: editable templates live in settings, source discovery lives in shared source utilities plus main-process IPC, and AI recognition produces editable drafts that update settings but never writes reports directly.

**Tech Stack:** Electron main process, React 18 renderer, TypeScript, Electron Store, tsx verification scripts, existing OpenAI-compatible LLM client.

---

## File Structure

- Modify `app/shared/appSettings.ts`
  - Add `dailyMarkdownTemplate` and `dailySourceRules` to `ObsidianTemplateSettings`.
  - Normalize legacy settings so existing `dailyNotePath` remains valid.
- Create `app/shared/dailyMarkdownTemplate.ts`
  - Own default daily Markdown template and render helpers.
  - Ensure `{{work}}`, `{{inspiration}}`, and `{{tasks}}` core blocks are always present in rendered output.
- Modify `app/shared/aiReview/aiReviewSettings.ts`
  - Add source-mode settings for personal/external weekly/monthly report generation.
  - Keep existing prompt fields as editable generation templates.
- Create `app/shared/aiReview/sourceMaterials.ts`
  - Own date-range helpers, vault-relative path resolution for source rules, weekly/monthly source collection, and no-source result handling.
- Modify `app/shared/aiReview/recognizeReportTemplate.ts`
  - Expand report template recognition target from `weekly | monthly` to personal/external weekly/monthly.
  - Preserve external-report constraints in recognized prompts.
- Create `app/shared/templateRecognition.ts`
  - Define a unified recognition result type for daily and report templates.
- Modify `app/shared/obsidianTemplateRecognition.ts`
  - Return daily Markdown template drafts and missing core fields.
- Modify `app/electron/main.ts`
  - Use source-material utilities before weekly/monthly/external generation.
  - Stop before LLM calls when sources are empty.
  - Add IPC for testing source material resolution.
  - Add target-aware report template recognition IPC.
- Modify `app/electron/preload.ts`
  - Expose source testing and target-aware recognition methods.
- Modify `app/src/vite-env.d.ts`
  - Update renderer bridge types.
- Modify `app/src/i18n.ts`
  - Add bilingual strings for all new settings UI, errors, source testing, template recognition, and advanced labels.
- Modify `app/src/components/ObsidianTemplateCenter.tsx`
  - Replace English advanced labels with i18n text.
  - Surface daily note path, daily Markdown template editor, source testing, and daily recognition.
- Modify `app/src/components/SettingsPanel.tsx`
  - Reorganize report settings into Template & Sources panels.
  - Add editable prompts for personal/external weekly/monthly templates with import/recognize/apply/reset.
  - Add source test controls.
- Modify `app/src/App.tsx`
  - Ensure automatic weekly/monthly ticks handle no-source errors as status, not silent AI generation.
- Create `app/scripts/verify-template-source-settings.ts`
  - Verify settings normalization, default templates, and source mode defaults.
- Create `app/scripts/verify-source-materials.ts`
  - Verify source collection, vault boundary protection, and empty-source behavior.
- Create `app/scripts/verify-unified-template-recognition.ts`
  - Verify daily/report recognition parsers and external constraints.
- Create `app/scripts/verify-template-source-i18n.ts`
  - Verify Chinese settings strings do not expose internal English field names and English strings do not contain Chinese labels.
- Modify `app/package.json`
  - Add scripts for the new verification files and include them in `verify:rc`.

---

### Task 1: Settings Data Model

**Files:**
- Modify: `app/shared/appSettings.ts`
- Modify: `app/shared/aiReview/aiReviewSettings.ts`
- Create: `app/scripts/verify-template-source-settings.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-template-source-settings.ts`:

```ts
import { strict as assert } from 'node:assert';
import {
  createDefaultObsidianTemplateSettings,
  normalizeObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  createDefaultAiReviewSettings,
  normalizeAiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';

const obsidianDefaults = createDefaultObsidianTemplateSettings();
assert.equal(obsidianDefaults.dailyNotePath, 'logs/daily/DailyTodo/{{date}}.md');
assert.ok(obsidianDefaults.dailyMarkdownTemplate.includes('{{work}}'));
assert.ok(obsidianDefaults.dailyMarkdownTemplate.includes('{{inspiration}}'));
assert.ok(obsidianDefaults.dailyMarkdownTemplate.includes('{{tasks}}'));
assert.deepEqual(obsidianDefaults.dailySourceRules, [
  { id: 'daily-note-path', label: '每日记录文件位置', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true },
]);

const normalizedObsidian = normalizeObsidianTemplateSettings({ dailyNotePath: 'journal/{{date}}.md' });
assert.equal(normalizedObsidian.dailyNotePath, 'journal/{{date}}.md');
assert.equal(normalizedObsidian.dailySourceRules[0].path, 'journal/{{date}}.md');
assert.ok(normalizedObsidian.dailyMarkdownTemplate.includes('{{tasks}}'));

const aiDefaults = createDefaultAiReviewSettings();
assert.equal(aiDefaults.weeklySourceMode, 'daily-notes');
assert.equal(aiDefaults.monthlySourceMode, 'weekly-then-daily');
assert.equal(aiDefaults.externalWeeklySourceMode, 'daily-notes');
assert.equal(aiDefaults.externalMonthlySourceMode, 'weekly-then-daily');

const normalizedAi = normalizeAiReviewSettings({ weeklySourceMode: 'bad', monthlySourceMode: 'daily-notes' });
assert.equal(normalizedAi.weeklySourceMode, 'daily-notes');
assert.equal(normalizedAi.monthlySourceMode, 'daily-notes');

console.log('verify-template-source-settings ok');
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npx tsx scripts/verify-template-source-settings.ts`

Expected: FAIL with TypeScript errors that `dailyMarkdownTemplate`, `dailySourceRules`, `weeklySourceMode`, `monthlySourceMode`, `externalWeeklySourceMode`, or `externalMonthlySourceMode` do not exist.

- [ ] **Step 3: Add daily template settings**

In `app/shared/appSettings.ts`, add types and defaults:

```ts
export interface DailySourceRule {
  id: string;
  label: string;
  path: string;
  enabled: boolean;
}

export interface ObsidianTemplateSettings {
  dailyNotePath: string;
  taskExportPath: string;
  dailyMarkdownTemplate: string;
  dailySourceRules: DailySourceRule[];
  presetId: ObsidianTemplatePresetId;
  modules: ObsidianTemplateModules;
  workSectionTitle: string;
  inspirationSectionTitle: string;
  taskSectionTitle: string;
  reviewSectionTitle: string;
  tomorrowTaskSectionTitle: string;
  reusableKnowledgeSectionTitle: string;
  taskLineTemplate: string;
  completionReviewTemplate: string;
}
```

Add default helpers near `createDefaultObsidianTemplateSettings()`:

```ts
export const DEFAULT_DAILY_MARKDOWN_TEMPLATE = `---
类型: 日报
日期: {{date}}
标签:
  - 日报
---

# DailyTodo · {{date}}

## 今日工作
{{work}}

## 灵感随笔
{{inspiration}}

## 每日任务
{{tasks}}

## 复盘
{{review}}

## 明日待办
{{tomorrow}}

## 可复用知识
{{knowledge}}
`;

export function createDefaultDailySourceRules(dailyNotePath = 'logs/daily/DailyTodo/{{date}}.md'): DailySourceRule[] {
  return [{ id: 'daily-note-path', label: '每日记录文件位置', path: dailyNotePath, enabled: true }];
}
```

Update `createDefaultObsidianTemplateSettings()`:

```ts
export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  const dailyNotePath = 'logs/daily/DailyTodo/{{date}}.md';
  return syncTemplateTitlesFromModules({
    dailyNotePath,
    taskExportPath: 'logs/daily/DailyTodo/tasks/{{date}}.md',
    dailyMarkdownTemplate: DEFAULT_DAILY_MARKDOWN_TEMPLATE,
    dailySourceRules: createDefaultDailySourceRules(dailyNotePath),
    presetId: 'simple',
    modules: createDefaultModules(),
    workSectionTitle: '今日工作',
    inspirationSectionTitle: '灵感闪念',
    taskSectionTitle: '每日任务',
    reviewSectionTitle: '复盘',
    tomorrowTaskSectionTitle: '明日待办',
    reusableKnowledgeSectionTitle: '可复用知识',
    taskLineTemplate: DEFAULT_TASK_LINE_TEMPLATE,
    completionReviewTemplate: DEFAULT_COMPLETION_REVIEW_TEMPLATE,
  });
}
```

Add normalizer helpers:

```ts
function normalizeDailySourceRules(value: unknown, dailyNotePath: string): DailySourceRule[] {
  if (!Array.isArray(value)) return createDefaultDailySourceRules(dailyNotePath);
  const rules = value
    .filter(isObject)
    .map((rule, index) => ({
      id: text(rule.id, `daily-source-${index + 1}`),
      label: text(rule.label, `素材规则 ${index + 1}`),
      path: text(rule.path, dailyNotePath),
      enabled: typeof rule.enabled === 'boolean' ? rule.enabled : true,
    }))
    .filter((rule) => rule.path.trim());
  return rules.length ? rules : createDefaultDailySourceRules(dailyNotePath);
}
```

Update `normalizeObsidianTemplateSettings()` object:

```ts
const dailyNotePath = text(value.dailyNotePath, defaults.dailyNotePath);
const dailyMarkdownTemplate = text(value.dailyMarkdownTemplate, defaults.dailyMarkdownTemplate);

return syncTemplateTitlesFromModules({
  dailyNotePath,
  taskExportPath: text(value.taskExportPath, defaults.taskExportPath),
  dailyMarkdownTemplate,
  dailySourceRules: normalizeDailySourceRules(value.dailySourceRules, dailyNotePath),
  presetId: normalizeTemplatePresetId(value.presetId),
  modules,
  workSectionTitle: modules.work.title,
  inspirationSectionTitle: modules.inspiration.title,
  taskSectionTitle: modules.tasks.title,
  reviewSectionTitle: modules.review.title,
  tomorrowTaskSectionTitle: modules.tomorrow.title,
  reusableKnowledgeSectionTitle: modules.knowledge.title,
  taskLineTemplate: text(value.taskLineTemplate, defaults.taskLineTemplate),
  completionReviewTemplate: text(value.completionReviewTemplate, defaults.completionReviewTemplate),
});
```

- [ ] **Step 4: Add report source mode settings**

In `app/shared/aiReview/aiReviewSettings.ts`, add types near `AiReviewSettings`:

```ts
export type WeeklySourceMode = 'daily-notes' | 'manual-files';
export type MonthlySourceMode = 'weekly-then-daily' | 'weekly-reports' | 'daily-notes' | 'manual-files';
```

Add fields to `AiReviewSettings`:

```ts
weeklySourceMode: WeeklySourceMode;
monthlySourceMode: MonthlySourceMode;
externalWeeklySourceMode: WeeklySourceMode;
externalMonthlySourceMode: MonthlySourceMode;
```

Add defaults in `createDefaultAiReviewSettings()`:

```ts
weeklySourceMode: 'daily-notes',
monthlySourceMode: 'weekly-then-daily',
externalWeeklySourceMode: 'daily-notes',
externalMonthlySourceMode: 'weekly-then-daily',
```

Add normalizers:

```ts
function normalizeWeeklySourceMode(value: unknown, fallback: WeeklySourceMode): WeeklySourceMode {
  return value === 'manual-files' || value === 'daily-notes' ? value : fallback;
}

function normalizeMonthlySourceMode(value: unknown, fallback: MonthlySourceMode): MonthlySourceMode {
  return value === 'weekly-then-daily' || value === 'weekly-reports' || value === 'daily-notes' || value === 'manual-files'
    ? value
    : fallback;
}
```

Add to `normalizeAiReviewSettings()` return object:

```ts
weeklySourceMode: normalizeWeeklySourceMode(value.weeklySourceMode, d.weeklySourceMode),
monthlySourceMode: normalizeMonthlySourceMode(value.monthlySourceMode, d.monthlySourceMode),
externalWeeklySourceMode: normalizeWeeklySourceMode(value.externalWeeklySourceMode, d.externalWeeklySourceMode),
externalMonthlySourceMode: normalizeMonthlySourceMode(value.externalMonthlySourceMode, d.externalMonthlySourceMode),
```

- [ ] **Step 5: Add package script**

In `app/package.json`, add:

```json
"verify:template-source-settings": "tsx scripts/verify-template-source-settings.ts"
```

Append `&& npm run verify:template-source-settings` to `verify:rc`.

- [ ] **Step 6: Run verification**

Run: `cd app && npm run verify:template-source-settings`

Expected: PASS and prints `verify-template-source-settings ok`.

- [ ] **Step 7: Commit**

```bash
git add app/shared/appSettings.ts app/shared/aiReview/aiReviewSettings.ts app/scripts/verify-template-source-settings.ts app/package.json
git commit -m "feat(settings): add template source configuration"
```

---

### Task 2: Daily Markdown Rendering

**Files:**
- Create: `app/shared/dailyMarkdownTemplate.ts`
- Modify: `app/electron/main.ts`
- Create: `app/scripts/verify-daily-markdown-template.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-daily-markdown-template.ts`:

```ts
import { strict as assert } from 'node:assert';
import { renderDailyMarkdownTemplate, missingDailyCoreTokens } from '../shared/dailyMarkdownTemplate';

const content = renderDailyMarkdownTemplate({
  template: '# {{date}}\n{{work}}\n{{inspiration}}\n{{tasks}}',
  date: '2026-06-10',
  work: '完成项目设计',
  inspiration: '一个新想法',
  tasks: '- [x] 写计划',
  review: '',
  tomorrow: '',
  knowledge: '',
});
assert.ok(content.includes('2026-06-10'));
assert.ok(content.includes('完成项目设计'));
assert.ok(content.includes('一个新想法'));
assert.ok(content.includes('- [x] 写计划'));

assert.deepEqual(missingDailyCoreTokens('{{work}}\n{{tasks}}'), ['inspiration']);

const fallback = renderDailyMarkdownTemplate({
  template: '# Custom only',
  date: '2026-06-10',
  work: '工作',
  inspiration: '灵感',
  tasks: '任务',
  review: '',
  tomorrow: '',
  knowledge: '',
});
assert.ok(fallback.includes('# Custom only'));
assert.ok(fallback.includes('## 今日工作\n工作'));
assert.ok(fallback.includes('## 灵感随笔\n灵感'));
assert.ok(fallback.includes('## 每日任务\n任务'));

console.log('verify-daily-markdown-template ok');
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npx tsx scripts/verify-daily-markdown-template.ts`

Expected: FAIL because `app/shared/dailyMarkdownTemplate.ts` does not exist.

- [ ] **Step 3: Implement renderer helper**

Create `app/shared/dailyMarkdownTemplate.ts`:

```ts
export type DailyCoreToken = 'work' | 'inspiration' | 'tasks';

export interface DailyMarkdownRenderParams {
  template: string;
  date: string;
  work: string;
  inspiration: string;
  tasks: string;
  review: string;
  tomorrow: string;
  knowledge: string;
}

const CORE_TOKENS: DailyCoreToken[] = ['work', 'inspiration', 'tasks'];

const TOKEN_LABELS: Record<DailyCoreToken, string> = {
  work: '今日工作',
  inspiration: '灵感随笔',
  tasks: '每日任务',
};

function tokenPattern(token: string): RegExp {
  return new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, 'g');
}

export function missingDailyCoreTokens(template: string): DailyCoreToken[] {
  return CORE_TOKENS.filter((token) => !tokenPattern(token).test(template));
}

export function renderDailyMarkdownTemplate(params: DailyMarkdownRenderParams): string {
  const values: Record<string, string> = {
    date: params.date,
    work: params.work.trim() || '〔未填写〕',
    inspiration: params.inspiration.trim() || '〔未填写〕',
    tasks: params.tasks.trim() || '〔未填写〕',
    review: params.review.trim(),
    tomorrow: params.tomorrow.trim(),
    knowledge: params.knowledge.trim(),
  };

  let rendered = Object.entries(values).reduce(
    (text, [token, value]) => text.replace(tokenPattern(token), value),
    params.template.trim() || '# DailyTodo · {{date}}\n\n{{work}}\n\n{{inspiration}}\n\n{{tasks}}',
  );

  const missing = missingDailyCoreTokens(params.template);
  if (missing.length) {
    const fallbackSections = missing
      .map((token) => `## ${TOKEN_LABELS[token]}\n${values[token]}`)
      .join('\n\n');
    rendered = `${rendered.trim()}\n\n${fallbackSections}`;
  }

  return `${rendered.trim()}\n`;
}
```

- [ ] **Step 4: Wire daily sync to use markdown template**

In `app/electron/main.ts`, find the daily Obsidian sync path that currently builds daily content from module settings. Import:

```ts
import { renderDailyMarkdownTemplate } from '../shared/dailyMarkdownTemplate';
```

When writing the daily note, render `getObsidianTemplateSettings().dailyMarkdownTemplate` with:

```ts
const renderedDaily = renderDailyMarkdownTemplate({
  template: settings.dailyMarkdownTemplate,
  date: dateKey,
  work: dailyWork ?? '',
  inspiration: dailyInspiration ?? '',
  tasks: taskMarkdown,
  review: reviewMarkdown,
  tomorrow: tomorrowMarkdown,
  knowledge: knowledgeMarkdown,
});
```

Keep existing managed-block logic if it is required for incremental task updates, but ensure newly created daily files use `renderedDaily` as the base document.

- [ ] **Step 5: Add package script**

In `app/package.json`, add:

```json
"verify:daily-markdown-template": "tsx scripts/verify-daily-markdown-template.ts"
```

Append `&& npm run verify:daily-markdown-template` to `verify:rc`.

- [ ] **Step 6: Run verification**

Run: `cd app && npm run verify:daily-markdown-template`

Expected: PASS and prints `verify-daily-markdown-template ok`.

- [ ] **Step 7: Run existing RC sync verification**

Run: `cd app && npm run verify:rc-sync && npm run verify:obsidian-template-center`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/shared/dailyMarkdownTemplate.ts app/electron/main.ts app/scripts/verify-daily-markdown-template.ts app/package.json
git commit -m "feat(obsidian): render editable daily markdown template"
```

---

### Task 3: Source Material Collection

**Files:**
- Create: `app/shared/aiReview/sourceMaterials.ts`
- Modify: `app/electron/main.ts`
- Create: `app/scripts/verify-source-materials.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-source-materials.ts`:

```ts
import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  collectDailySourcesForDates,
  collectMonthlySources,
  hasSourceMaterials,
  NO_SOURCE_MATERIALS_ERROR,
} from '../shared/aiReview/sourceMaterials';

const vault = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-sources-'));
fs.mkdirSync(path.join(vault, 'logs/daily/DailyTodo'), { recursive: true });
fs.mkdirSync(path.join(vault, 'logs/weekly-review'), { recursive: true });
fs.writeFileSync(path.join(vault, 'logs/daily/DailyTodo/2026-06-08.md'), 'daily 08');
fs.writeFileSync(path.join(vault, 'logs/weekly-review/2026-W24.md'), 'weekly 24');

const daily = collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08', '2026-06-09'],
  rules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
});
assert.deepEqual(daily.map((source) => source.date), ['2026-06-08']);
assert.ok(daily[0].filePath.endsWith('2026-06-08.md'));
assert.equal(daily[0].content, 'daily 08');
assert.equal(hasSourceMaterials(daily), true);
assert.equal(hasSourceMaterials([]), false);
assert.equal(NO_SOURCE_MATERIALS_ERROR.zh, '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。');

assert.throws(() => collectDailySourcesForDates({
  vaultPath: vault,
  dates: ['2026-06-08'],
  rules: [{ id: 'escape', label: 'Escape', path: '../outside/{{date}}.md', enabled: true }],
}), /escapes|outside/i);

const monthlyFromWeekly = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'logs/weekly-review',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'weekly-then-daily',
});
assert.deepEqual(monthlyFromWeekly.map((source) => source.label), ['2026-W24 周报']);

const monthlyFromDaily = collectMonthlySources({
  vaultPath: vault,
  month: '2026-06',
  weeklyDir: 'missing-weekly',
  dailyRules: [{ id: 'daily-note-path', label: 'Daily', path: 'logs/daily/DailyTodo/{{date}}.md', enabled: true }],
  mode: 'weekly-then-daily',
});
assert.ok(monthlyFromDaily.some((source) => source.label === '2026-06-08 日报'));

console.log('verify-source-materials ok');
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npx tsx scripts/verify-source-materials.ts`

Expected: FAIL because `sourceMaterials.ts` does not exist.

- [ ] **Step 3: Implement source material utilities**

Create `app/shared/aiReview/sourceMaterials.ts`:

```ts
import fs from 'node:fs';
import path from 'node:path';
import type { DailySourceRule } from '../appSettings';
import type { MonthlySourceMode } from './aiReviewSettings';
import { monthRange } from './monthly';
import { isoWeekKey } from './weekly';

export const NO_SOURCE_MATERIALS_ERROR = {
  zh: '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。',
  en: 'No source notes found for this period. Check source settings or choose files manually.',
} as const;

export interface DailySourceMaterial {
  date: string;
  label: string;
  filePath: string;
  content: string;
}

export interface PeriodSourceMaterial {
  label: string;
  filePath: string;
  content: string;
}

function renderRulePath(templatePath: string, date: string): string {
  return templatePath.replace(/\{\{date\}\}/g, date);
}

export function resolveVaultRelativePath(vaultPath: string, templatePath: string, date: string): string {
  const rendered = renderRulePath(templatePath, date).replace(/[<>:"|?*]/g, '-');
  if (path.isAbsolute(rendered)) throw new Error(`Source path must be relative to the vault: ${rendered}`);
  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Source path escapes the selected vault: ${rendered}`);
  }
  return resolved;
}

export function collectDailySourcesForDates(params: {
  vaultPath: string;
  dates: string[];
  rules: DailySourceRule[];
}): DailySourceMaterial[] {
  const seen = new Set<string>();
  const sources: DailySourceMaterial[] = [];
  for (const date of params.dates) {
    for (const rule of params.rules.filter((r) => r.enabled)) {
      const filePath = resolveVaultRelativePath(params.vaultPath, rule.path, date);
      if (!fs.existsSync(filePath) || seen.has(filePath)) continue;
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!content.trim()) continue;
      seen.add(filePath);
      sources.push({ date, label: `${date} 日报`, filePath, content });
    }
  }
  return sources;
}

function datesInRange(first: string, last: string): string[] {
  const dates: string[] = [];
  const current = new Date(`${first}T00:00:00`);
  const end = new Date(`${last}T00:00:00`);
  while (current <= end) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

function collectWeeklyReports(vaultPath: string, month: string, weeklyDir: string): PeriodSourceMaterial[] {
  const { first, last } = monthRange(month);
  const weeks = Array.from(new Set(datesInRange(first, last).map(isoWeekKey)));
  return weeks
    .map((week) => {
      const filePath = path.join(vaultPath, weeklyDir, `${week}.md`);
      if (!fs.existsSync(filePath)) return null;
      const content = fs.readFileSync(filePath, 'utf-8');
      return content.trim() ? { label: `${week} 周报`, filePath, content } : null;
    })
    .filter((source): source is PeriodSourceMaterial => source !== null);
}

export function collectMonthlySources(params: {
  vaultPath: string;
  month: string;
  weeklyDir: string;
  dailyRules: DailySourceRule[];
  mode: MonthlySourceMode;
}): PeriodSourceMaterial[] {
  if (params.mode === 'weekly-reports' || params.mode === 'weekly-then-daily') {
    const weekly = collectWeeklyReports(params.vaultPath, params.month, params.weeklyDir);
    if (weekly.length || params.mode === 'weekly-reports') return weekly;
  }
  if (params.mode === 'manual-files') return [];
  const { first, last } = monthRange(params.month);
  return collectDailySourcesForDates({
    vaultPath: params.vaultPath,
    dates: datesInRange(first, last),
    rules: params.dailyRules,
  }).map((source) => ({ label: source.label, filePath: source.filePath, content: source.content }));
}

export function hasSourceMaterials(sources: Array<{ content: string }>): boolean {
  return sources.some((source) => source.content.trim());
}
```

- [ ] **Step 4: Update weekly/monthly generation**

In `app/electron/main.ts`, import:

```ts
import {
  NO_SOURCE_MATERIALS_ERROR,
  collectDailySourcesForDates,
  collectMonthlySources,
  hasSourceMaterials,
} from '../shared/aiReview/sourceMaterials';
```

In `aiReview:generateWeekly`, replace direct `getDailyFilePath()` mapping with:

```ts
const dailyContents = collectDailySourcesForDates({
  vaultPath: vaultStatus.vaultPath,
  dates: weekDates,
  rules: getObsidianTemplateSettings().dailySourceRules,
}).map((source) => ({ date: source.date, content: source.content }));
if (!hasSourceMaterials(dailyContents)) return { ok: false, error: NO_SOURCE_MATERIALS_ERROR.zh };
```

In `aiReview:generateMonthly`, replace manual weekly/daily collection with:

```ts
const sources = collectMonthlySources({
  vaultPath: vaultStatus.vaultPath,
  month,
  weeklyDir: sanitizeRelDir(settings.weeklyDir, DEFAULT_REPORT_DIRS.weekly),
  dailyRules: getObsidianTemplateSettings().dailySourceRules,
  mode: settings.monthlySourceMode,
});
if (!hasSourceMaterials(sources)) return { ok: false, error: NO_SOURCE_MATERIALS_ERROR.zh };
```

In `aiReview:generateExternal`, use `collectDailySourcesForDates()` for weekly external reports and `collectMonthlySources()` for monthly external reports before redaction. Return `NO_SOURCE_MATERIALS_ERROR.zh` before any LLM call when empty.

- [ ] **Step 5: Add source test IPC**

In `app/electron/main.ts`, add:

```ts
ipcMain.handle('aiReview:testSourceMaterials', async (_e, kind: 'weekly' | 'monthly', date: string) => {
  const vaultStatus = getVaultStatus();
  if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, error: vaultStatus.reason, sources: [] };
  const settings = getAiReviewSettings();
  const templateSettings = getObsidianTemplateSettings();
  const selected = getDateKey(date);
  if (kind === 'weekly') {
    const d = new Date(`${selected}T00:00:00`);
    const dayNr = (d.getDay() + 6) % 7;
    const monday = shiftDateKey(selected, -dayNr);
    const weekDates = Array.from({ length: 7 }, (_, i) => shiftDateKey(monday, i));
    const sources = collectDailySourcesForDates({ vaultPath: vaultStatus.vaultPath, dates: weekDates, rules: templateSettings.dailySourceRules });
    return { ok: true, sources: sources.map((source) => ({ label: source.label, filePath: source.filePath })) };
  }
  const month = monthKey(selected);
  const sources = collectMonthlySources({
    vaultPath: vaultStatus.vaultPath,
    month,
    weeklyDir: sanitizeRelDir(settings.weeklyDir, DEFAULT_REPORT_DIRS.weekly),
    dailyRules: templateSettings.dailySourceRules,
    mode: settings.monthlySourceMode,
  });
  return { ok: true, sources: sources.map((source) => ({ label: source.label, filePath: source.filePath })) };
});
```

- [ ] **Step 6: Add package script**

In `app/package.json`, add:

```json
"verify:source-materials": "tsx scripts/verify-source-materials.ts"
```

Append `&& npm run verify:source-materials` to `verify:rc`.

- [ ] **Step 7: Run verification**

Run: `cd app && npm run verify:source-materials && npm run verify:weekly && npm run verify:monthly && npm run verify:export-reports`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/shared/aiReview/sourceMaterials.ts app/electron/main.ts app/scripts/verify-source-materials.ts app/package.json
git commit -m "fix(ai-review): require source materials before reports"
```

---

### Task 4: Unified Template Recognition

**Files:**
- Create: `app/shared/templateRecognition.ts`
- Modify: `app/shared/obsidianTemplateRecognition.ts`
- Modify: `app/shared/aiReview/recognizeReportTemplate.ts`
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Create: `app/scripts/verify-unified-template-recognition.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-unified-template-recognition.ts`:

```ts
import { strict as assert } from 'node:assert';
import { missingDailyCoreTokens } from '../shared/dailyMarkdownTemplate';
import {
  buildRecognizeReportMessages,
  parseRecognizedReportPrompt,
} from '../shared/aiReview/recognizeReportTemplate';
import type { TemplateRecognitionTarget } from '../shared/templateRecognition';

const targets: TemplateRecognitionTarget[] = ['daily', 'personalWeekly', 'personalMonthly', 'externalWeekly', 'externalMonthly'];
assert.equal(targets.length, 5);
assert.deepEqual(missingDailyCoreTokens('{{work}}\n{{inspiration}}'), ['tasks']);

const externalMessages = buildRecognizeReportMessages('## Summary', 'externalWeekly');
assert.ok(externalMessages[0].content.includes('脱敏'));
assert.ok(externalMessages[0].content.includes('绝不编造'));

const personalMessages = buildRecognizeReportMessages('## Summary', 'personalMonthly');
assert.ok(personalMessages[0].content.includes('月报'));
assert.ok(!personalMessages[0].content.includes('脱敏后的对外'));

assert.equal(parseRecognizedReportPrompt('```md\nhello\n```'), 'hello');

console.log('verify-unified-template-recognition ok');
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npx tsx scripts/verify-unified-template-recognition.ts`

Expected: FAIL because `templateRecognition.ts` and the expanded `buildRecognizeReportMessages()` signature do not exist.

- [ ] **Step 3: Add unified recognition types**

Create `app/shared/templateRecognition.ts`:

```ts
export type TemplateRecognitionTarget = 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';
export type TemplateRecognitionConfidence = 'high' | 'medium' | 'low';

export interface UnifiedTemplateRecognitionResult {
  target: TemplateRecognitionTarget;
  templateDraft: string;
  missingCoreFields: string[];
  unmappedSections: Array<{ title: string; reason: string; excerpt?: string }>;
  notes: string[];
  confidence: TemplateRecognitionConfidence;
}

export function isReportRecognitionTarget(target: TemplateRecognitionTarget): target is Exclude<TemplateRecognitionTarget, 'daily'> {
  return target !== 'daily';
}
```

- [ ] **Step 4: Expand report recognition**

In `app/shared/aiReview/recognizeReportTemplate.ts`, replace `ReportKind` with:

```ts
import type { TemplateRecognitionTarget } from '../templateRecognition';

export type ReportTemplateTarget = Exclude<TemplateRecognitionTarget, 'daily'>;

function reportLabel(target: ReportTemplateTarget): string {
  return target === 'personalMonthly' || target === 'externalMonthly' ? '月报' : '周报';
}

function audienceRule(target: ReportTemplateTarget): string {
  if (target === 'externalWeekly' || target === 'externalMonthly') {
    return '这是对外报告模板。生成指令必须保留专业汇报语气、脱敏约束、事实来自原始记录、绝不编造。';
  }
  return '这是个人复盘报告模板。生成指令应保留私人复盘语气、事实来自原始记录、绝不编造。';
}
```

Update `buildRecognizeReportMessages()` signature:

```ts
export function buildRecognizeReportMessages(rawTemplate: string, target: ReportTemplateTarget): ChatMessage[] {
  const label = reportLabel(target);
  return [
    {
      role: 'system',
      content:
        `用户给出一份现成的${label}格式/范例。请把它转写成一段“生成指令”，` +
        `用于以后让 AI 按这个结构和语气生成${label}。指令要说明应包含哪些小节、顺序、语气风格。` +
        `${audienceRule(target)}` +
        '只输出这段指令本身的纯文本，不要解释，不要加代码块围栏，不要编造统计数字（数字以运行时给定为准）。',
    },
    { role: 'user', content: rawTemplate.trim() || '（空模板）' },
  ];
}
```

- [ ] **Step 5: Expand daily recognition result**

In `app/shared/obsidianTemplateRecognition.ts`, import `missingDailyCoreTokens` and include a `dailyMarkdownTemplate?: string` and `missingCoreFields: string[]` on `RecognizedObsidianTemplateDraft`.

When parsing succeeds, set:

```ts
dailyMarkdownTemplate: optionalText(parsed.dailyMarkdownTemplate),
missingCoreFields: missingDailyCoreTokens(optionalText(parsed.dailyMarkdownTemplate) ?? ''),
```

Update the system prompt JSON shape to include `dailyMarkdownTemplate` and tell the model to preserve user structure while adding `{{work}}`, `{{inspiration}}`, and `{{tasks}}` placeholders where possible.

- [ ] **Step 6: Update main IPC recognition**

In `app/electron/main.ts`, change `aiReview:recognizeReportTemplate` handler to accept `target: ReportTemplateTarget` instead of `kind: 'weekly' | 'monthly'`.

Use:

```ts
const safeTarget: ReportTemplateTarget =
  target === 'personalMonthly' || target === 'externalWeekly' || target === 'externalMonthly' ? target : 'personalWeekly';
const messages = buildRecognizeReportMessages(rawTemplate, safeTarget);
```

Return `{ ok: true, target: safeTarget, prompt }`.

- [ ] **Step 7: Update preload and renderer types**

In `app/electron/preload.ts`, update:

```ts
recognizeReportTemplate: (target: string, rawTemplate: string) => ipcRenderer.invoke('aiReview:recognizeReportTemplate', target, rawTemplate),
```

In `app/src/vite-env.d.ts`, update:

```ts
recognizeReportTemplate: (
  target: import('../shared/templateRecognition').TemplateRecognitionTarget,
  rawTemplate: string
) => Promise<{ ok: boolean; error?: string; target?: import('../shared/templateRecognition').TemplateRecognitionTarget; prompt: string }>;
```

- [ ] **Step 8: Add package script**

In `app/package.json`, add:

```json
"verify:unified-template-recognition": "tsx scripts/verify-unified-template-recognition.ts"
```

Append `&& npm run verify:unified-template-recognition` to `verify:rc`.

- [ ] **Step 9: Run verification**

Run: `cd app && npm run verify:unified-template-recognition && npm run verify:recognize-report && npm run verify:obsidian-template-recognition`

Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add app/shared/templateRecognition.ts app/shared/obsidianTemplateRecognition.ts app/shared/aiReview/recognizeReportTemplate.ts app/electron/main.ts app/electron/preload.ts app/src/vite-env.d.ts app/scripts/verify-unified-template-recognition.ts app/package.json
git commit -m "feat(ai-review): unify template recognition targets"
```

---

### Task 5: Settings I18n Coverage

**Files:**
- Modify: `app/src/i18n.ts`
- Create: `app/scripts/verify-template-source-i18n.ts`
- Modify: `app/package.json`

- [ ] **Step 1: Write the failing verification script**

Create `app/scripts/verify-template-source-i18n.ts`:

```ts
import { strict as assert } from 'node:assert';
import { COPY } from '../src/i18n';

const zh = COPY['zh-CN'];
const en = COPY['en-US'];

assert.equal(zh.settings.templateSources.title, '模板与素材');
assert.equal(zh.settings.templateSources.dailyNotePath, '每日记录文件位置');
assert.equal(zh.settings.templateSources.personalWeeklyTemplate, '个人周报生成模板');
assert.equal(zh.settings.templateSources.externalMonthlyDir, '对外月报输出目录');
assert.equal(zh.settings.templateSources.testSources, '测试素材来源');
assert.equal(zh.settings.templateSources.noSourceFound, '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。');

const zhJson = JSON.stringify(zh.settings.templateSources);
for (const forbidden of ['dailyNotePath', 'weeklyPrompt', 'externalMonthlyDir', 'presetId', 'Legacy task export path']) {
  assert.equal(zhJson.includes(forbidden), false, `Chinese settings leaked ${forbidden}`);
}

assert.equal(en.settings.templateSources.title, 'Templates & Sources');
assert.equal(en.settings.templateSources.dailyNotePath, 'Daily note file path');
assert.equal(en.settings.templateSources.noSourceFound, 'No source notes found for this period. Check source settings or choose files manually.');

console.log('verify-template-source-i18n ok');
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npx tsx scripts/verify-template-source-i18n.ts`

Expected: FAIL because `settings.templateSources` does not exist.

- [ ] **Step 3: Add i18n section**

In `app/src/i18n.ts`, add this object under both language settings objects.

Chinese:

```ts
templateSources: {
  title: '模板与素材',
  hint: '管理日报、周报、月报模板，以及 AI 生成前读取哪些原始记录。',
  dailyTemplateTitle: '日报模板',
  dailyNotePath: '每日记录文件位置',
  dailyNotePathHint: '{{date}} 会替换为日期，例如 2026-06-10。',
  dailyMarkdownTemplate: '日报 Markdown 模板',
  dailyMarkdownTemplateHint: '必须保留今日工作、灵感随笔、每日任务三个核心内容，可自由调整其它结构。',
  taskExportPath: '任务导出文件位置',
  workSectionTitle: '今日工作标题',
  inspirationSectionTitle: '灵感随笔标题',
  taskSectionTitle: '每日任务标题',
  reviewSectionTitle: '复盘标题',
  tomorrowSectionTitle: '明日待办标题',
  knowledgeSectionTitle: '可复用知识标题',
  taskLineTemplate: '任务行模板',
  completionReviewTemplate: '完成复盘模板',
  personalReportsTitle: '个人报告模板',
  personalWeeklyDir: '个人周报输出目录',
  personalMonthlyDir: '个人月报输出目录',
  personalWeeklyTemplate: '个人周报生成模板',
  personalMonthlyTemplate: '个人月报生成模板',
  externalReportsTitle: '对外报告模板',
  externalWeeklyDir: '对外周报输出目录',
  externalMonthlyDir: '对外月报输出目录',
  externalWeeklyTemplate: '对外周报生成模板',
  externalMonthlyTemplate: '对外月报生成模板',
  sourceTitle: '素材来源',
  sourceHint: '报告生成前会先读取这些素材；找不到素材时不会调用 AI。',
  weeklySourceMode: '周报素材策略',
  monthlySourceMode: '月报素材策略',
  sourceDailyNotes: '聚合日报',
  sourceWeeklyThenDaily: '优先周报，没有则日报',
  sourceWeeklyReports: '只使用周报',
  sourceManualFiles: '手动选择文件',
  testSources: '测试素材来源',
  sourceFound: '找到 {count} 个素材文件',
  sourceNotFound: '没有找到素材文件',
  noSourceFound: '没有找到本周期原始记录，请检查素材来源或手动选择素材文件。',
  recognitionTitle: 'AI 模板识别',
  importMarkdown: '导入 .md 文件',
  recognizeTemplate: 'AI 识别模板',
  applyDraft: '应用草稿',
  restoreDefault: '恢复默认模板',
  recognizedHigh: '识别成功，可应用。',
  recognizedMedium: '部分识别成功，建议检查后应用。',
  recognizedLow: '未能可靠识别，已生成可编辑草稿。',
  missingCore: '缺少核心内容：{fields}',
  advancedDaily: '高级日报设置',
}
```

English:

```ts
templateSources: {
  title: 'Templates & Sources',
  hint: 'Manage daily, weekly, and monthly templates plus the source notes AI reads before generating reports.',
  dailyTemplateTitle: 'Daily Template',
  dailyNotePath: 'Daily note file path',
  dailyNotePathHint: '{{date}} is replaced with the date, for example 2026-06-10.',
  dailyMarkdownTemplate: 'Daily Markdown template',
  dailyMarkdownTemplateHint: 'Keep work notes, inspirations, and tasks available; other structure is fully editable.',
  taskExportPath: 'Task export file path',
  workSectionTitle: 'Work section title',
  inspirationSectionTitle: 'Inspiration section title',
  taskSectionTitle: 'Task section title',
  reviewSectionTitle: 'Review section title',
  tomorrowSectionTitle: 'Tomorrow section title',
  knowledgeSectionTitle: 'Reusable knowledge section title',
  taskLineTemplate: 'Task line template',
  completionReviewTemplate: 'Completion review template',
  personalReportsTitle: 'Personal Report Templates',
  personalWeeklyDir: 'Personal weekly report directory',
  personalMonthlyDir: 'Personal monthly report directory',
  personalWeeklyTemplate: 'Personal weekly generation template',
  personalMonthlyTemplate: 'Personal monthly generation template',
  externalReportsTitle: 'External Report Templates',
  externalWeeklyDir: 'External weekly report directory',
  externalMonthlyDir: 'External monthly report directory',
  externalWeeklyTemplate: 'External weekly generation template',
  externalMonthlyTemplate: 'External monthly generation template',
  sourceTitle: 'Source Materials',
  sourceHint: 'Reports read these notes first; if no source notes are found, AI generation does not run.',
  weeklySourceMode: 'Weekly source strategy',
  monthlySourceMode: 'Monthly source strategy',
  sourceDailyNotes: 'Aggregate daily notes',
  sourceWeeklyThenDaily: 'Weekly reports first, daily notes fallback',
  sourceWeeklyReports: 'Weekly reports only',
  sourceManualFiles: 'Choose files manually',
  testSources: 'Test source materials',
  sourceFound: 'Found {count} source files',
  sourceNotFound: 'No source files found',
  noSourceFound: 'No source notes found for this period. Check source settings or choose files manually.',
  recognitionTitle: 'AI Template Recognition',
  importMarkdown: 'Import .md file',
  recognizeTemplate: 'Recognize template',
  applyDraft: 'Apply draft',
  restoreDefault: 'Restore default template',
  recognizedHigh: 'Recognized. You can apply it.',
  recognizedMedium: 'Partially recognized. Review before applying.',
  recognizedLow: 'Could not recognize reliably. An editable draft was created.',
  missingCore: 'Missing core content: {fields}',
  advancedDaily: 'Advanced Daily Settings',
}
```

- [ ] **Step 4: Add package script**

In `app/package.json`, add:

```json
"verify:template-source-i18n": "tsx scripts/verify-template-source-i18n.ts"
```

Append `&& npm run verify:template-source-i18n` to `verify:rc`.

- [ ] **Step 5: Run verification**

Run: `cd app && npm run verify:template-source-i18n && npm run verify:rc-strings`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/i18n.ts app/scripts/verify-template-source-i18n.ts app/package.json
git commit -m "feat(settings): add bilingual template source copy"
```

---

### Task 6: Daily Template Settings UI

**Files:**
- Modify: `app/src/components/ObsidianTemplateCenter.tsx`
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Modify: `app/electron/main.ts`
- Modify: `app/scripts/verify-obsidian-template-ui.ts`

- [ ] **Step 1: Update verification script first**

In `app/scripts/verify-obsidian-template-ui.ts`, add assertions that read `app/src/components/ObsidianTemplateCenter.tsx` and confirm:

```ts
assert.ok(source.includes('dailyMarkdownTemplate'));
assert.ok(source.includes('templateSources.dailyNotePath'));
assert.ok(source.includes('templateSources.dailyMarkdownTemplate'));
assert.equal(source.includes('Legacy task export path'), false);
assert.equal(source.includes('Work section title'), false);
assert.equal(source.includes('Inspiration section title'), false);
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npm run verify:obsidian-template-ui`

Expected: FAIL because the UI still contains English advanced labels and does not expose `dailyMarkdownTemplate`.

- [ ] **Step 3: Pass i18n copy into ObsidianTemplateCenter**

In `app/src/components/ObsidianTemplateCenter.tsx`, import the relevant copy type or accept a `text` prop from `SettingsPanel.tsx`:

```ts
type TemplateSourceText = ReturnType<typeof import('../i18n').getCopy>['settings']['templateSources'];
```

Update props:

```ts
interface ObsidianTemplateCenterProps {
  language: Language;
  text: TemplateSourceText;
  templates: ObsidianTemplateSettings;
  onChange: (settings: ObsidianTemplateSettings) => void;
  onPreviewSync: () => void;
  onResetTemplates: () => void;
}
```

- [ ] **Step 4: Add daily Markdown template field**

Inside the first settings section, render:

```tsx
<Field
  label={text.dailyNotePath}
  hint={text.dailyNotePathHint}
  value={templates.dailyNotePath}
  onChange={(value) => {
    const nextRules = templates.dailySourceRules.map((rule) =>
      rule.id === 'daily-note-path' ? { ...rule, path: value } : rule,
    );
    onChange({ ...templates, dailyNotePath: value, dailySourceRules: nextRules });
  }}
/>
<Field
  label={text.dailyMarkdownTemplate}
  hint={text.dailyMarkdownTemplateHint}
  value={templates.dailyMarkdownTemplate}
  onChange={(value) => setAdvanced('dailyMarkdownTemplate', value)}
  multiline
/>
```

- [ ] **Step 5: Replace advanced labels**

Replace hard-coded English labels with i18n:

```tsx
<Field label={text.taskExportPath} value={templates.taskExportPath} onChange={(value) => setAdvanced('taskExportPath', value)} />
<Field label={text.workSectionTitle} value={templates.workSectionTitle} onChange={(value) => setAdvanced('workSectionTitle', value)} />
<Field label={text.inspirationSectionTitle} value={templates.inspirationSectionTitle} onChange={(value) => setAdvanced('inspirationSectionTitle', value)} />
<Field label={text.taskSectionTitle} value={templates.taskSectionTitle} onChange={(value) => setAdvanced('taskSectionTitle', value)} />
<Field label={text.reviewSectionTitle} value={templates.reviewSectionTitle} onChange={(value) => setAdvanced('reviewSectionTitle', value)} />
<Field label={text.tomorrowSectionTitle} value={templates.tomorrowTaskSectionTitle} onChange={(value) => setAdvanced('tomorrowTaskSectionTitle', value)} />
<Field label={text.knowledgeSectionTitle} value={templates.reusableKnowledgeSectionTitle} onChange={(value) => setAdvanced('reusableKnowledgeSectionTitle', value)} />
<Field label={text.taskLineTemplate} value={templates.taskLineTemplate} onChange={(value) => setAdvanced('taskLineTemplate', value)} />
<Field label={text.completionReviewTemplate} value={templates.completionReviewTemplate} onChange={(value) => setAdvanced('completionReviewTemplate', value)} multiline />
```

- [ ] **Step 6: Apply daily recognition draft to markdown template**

In `draftToSettings()`, add:

```ts
dailyMarkdownTemplate: draft.dailyMarkdownTemplate || current.dailyMarkdownTemplate,
```

Show missing core fields in preview:

```tsx
{recognizedDraft.missingCoreFields.length > 0 && (
  <p className="settings-status-text">
    {text.missingCore.replace('{fields}', recognizedDraft.missingCoreFields.join('、'))}
  </p>
)}
```

- [ ] **Step 7: Update SettingsPanel call site**

In `app/src/components/SettingsPanel.tsx`, pass:

```tsx
<ObsidianTemplateCenter
  language={language}
  text={copy.settings.templateSources}
  templates={obsidianTemplates}
  onChange={setObsidianTemplates}
  onPreviewSync={previewSync}
  onResetTemplates={resetTemplates}
/>
```

Use the actual local variable names in `SettingsPanel.tsx` if they differ.

- [ ] **Step 8: Run verification**

Run: `cd app && npm run verify:obsidian-template-ui && npm run typecheck`

Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add app/src/components/ObsidianTemplateCenter.tsx app/src/components/SettingsPanel.tsx app/electron/preload.ts app/src/vite-env.d.ts app/electron/main.ts app/scripts/verify-obsidian-template-ui.ts
git commit -m "feat(settings): expose editable daily template"
```

---

### Task 7: Report Template Settings UI

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/scripts/verify-ai-settings.ts`
- Modify: `app/scripts/verify-recognize-report.ts`

- [ ] **Step 1: Update failing UI verification**

In `app/scripts/verify-ai-settings.ts`, add checks that `SettingsPanel.tsx` contains:

```ts
assert.ok(source.includes('templateSources.personalReportsTitle'));
assert.ok(source.includes('templateSources.externalReportsTitle'));
assert.ok(source.includes('templateSources.personalWeeklyTemplate'));
assert.ok(source.includes('templateSources.externalMonthlyTemplate'));
assert.ok(source.includes("recognizeReportTemplate('personalWeekly'"));
assert.ok(source.includes("recognizeReportTemplate('externalMonthly'"));
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npm run verify:ai-settings`

Expected: FAIL because the UI has not been reorganized yet.

- [ ] **Step 3: Add report template editor component inside SettingsPanel**

In `app/src/components/SettingsPanel.tsx`, add a local helper component near existing field helpers:

```tsx
function ReportTemplateEditor({
  title,
  dirLabel,
  dirValue,
  dirPlaceholder,
  templateLabel,
  templateValue,
  onDirChange,
  onTemplateChange,
  onRecognize,
  onReset,
  text,
  busy,
}: {
  title: string;
  dirLabel: string;
  dirValue: string;
  dirPlaceholder: string;
  templateLabel: string;
  templateValue: string;
  onDirChange: (value: string) => void;
  onTemplateChange: (value: string) => void;
  onRecognize: () => void;
  onReset: () => void;
  text: ReturnType<typeof getCopy>['settings']['templateSources'];
  busy: boolean;
}) {
  return (
    <section className="settings-section">
      <h4>{title}</h4>
      <Field label={dirLabel} value={dirValue} placeholder={dirPlaceholder} onChange={onDirChange} />
      <label className="settings-field">
        <span><strong>{templateLabel}</strong></span>
        <textarea rows={8} value={templateValue} onChange={(event) => onTemplateChange(event.target.value)} />
      </label>
      <div className="settings-action-row">
        <button type="button" className="settings-reset-button" disabled={busy} onClick={onRecognize}>{text.recognizeTemplate}</button>
        <button type="button" className="settings-reset-button" onClick={onReset}>{text.restoreDefault}</button>
      </div>
    </section>
  );
}
```

Use the actual existing `Field` signature and copy accessor in `SettingsPanel.tsx`.

- [ ] **Step 4: Add target-aware recognize handlers**

In `SettingsPanel.tsx`, add state:

```tsx
const [reportTemplateDraft, setReportTemplateDraft] = useState('');
const [reportRecognizeTarget, setReportRecognizeTarget] = useState<TemplateRecognitionTarget>('personalWeekly');
const [reportRecognizeBusy, setReportRecognizeBusy] = useState(false);
const [reportRecognizeStatus, setReportRecognizeStatus] = useState('');
```

Add handler:

```tsx
const recognizeReportTemplate = async (target: TemplateRecognitionTarget) => {
  if (!reportTemplateDraft.trim()) return;
  setReportRecognizeTarget(target);
  setReportRecognizeBusy(true);
  try {
    const result = await window.electronAPI?.aiReview.recognizeReportTemplate(target, reportTemplateDraft);
    if (!result?.ok || !result.prompt) {
      setReportRecognizeStatus(result?.error ?? text.templateSources.recognizedLow);
      return;
    }
    if (target === 'personalWeekly') updateSettings('weeklyPrompt', result.prompt);
    if (target === 'personalMonthly') updateSettings('monthlyPrompt', result.prompt);
    if (target === 'externalWeekly') updateSettings('externalWeeklyPrompt', result.prompt);
    if (target === 'externalMonthly') updateSettings('externalMonthlyPrompt', result.prompt);
    setReportRecognizeStatus(text.templateSources.recognizedHigh);
  } finally {
    setReportRecognizeBusy(false);
  }
};
```

- [ ] **Step 5: Render four report editors**

In the report config section, render editors for:

```tsx
<ReportTemplateEditor
  title={text.templateSources.personalReportsTitle}
  dirLabel={text.templateSources.personalWeeklyDir}
  dirValue={settings.weeklyDir}
  dirPlaceholder="logs/weekly-review"
  templateLabel={text.templateSources.personalWeeklyTemplate}
  templateValue={settings.weeklyPrompt}
  onDirChange={(value) => updateSettings('weeklyDir', value)}
  onTemplateChange={(value) => updateSettings('weeklyPrompt', value)}
  onRecognize={() => recognizeReportTemplate('personalWeekly')}
  onReset={() => updateSettings('weeklyPrompt', '')}
  text={text.templateSources}
  busy={reportRecognizeBusy && reportRecognizeTarget === 'personalWeekly'}
/>
```

Repeat with exact target/field mapping:

- `personalMonthly` → `monthlyDir`, `monthlyPrompt`, placeholder `logs/monthly-review`
- `externalWeekly` → `externalWeeklyDir`, `externalWeeklyPrompt`, placeholder `exports/weekly-reports`
- `externalMonthly` → `externalMonthlyDir`, `externalMonthlyPrompt`, placeholder `exports/monthly-reports`

- [ ] **Step 6: Add import/paste textarea**

Render one shared textarea before the four editors:

```tsx
<textarea
  rows={6}
  value={reportTemplateDraft}
  onChange={(event) => setReportTemplateDraft(event.target.value)}
  placeholder={text.templateSources.recognitionTitle}
/>
<button type="button" className="settings-reset-button" onClick={async () => {
  const result = await window.electronAPI?.aiReview.pickTemplateFile();
  if (result?.ok) setReportTemplateDraft(result.text ?? '');
}}>{text.templateSources.importMarkdown}</button>
{reportRecognizeStatus && <p className="settings-status-text">{reportRecognizeStatus}</p>}
```

- [ ] **Step 7: Run verification**

Run: `cd app && npm run verify:ai-settings && npm run verify:recognize-report && npm run typecheck`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add app/src/components/SettingsPanel.tsx app/scripts/verify-ai-settings.ts app/scripts/verify-recognize-report.ts
git commit -m "feat(settings): edit all report templates"
```

---

### Task 8: Source Material Settings UI

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`
- Modify: `app/electron/preload.ts`
- Modify: `app/src/vite-env.d.ts`
- Modify: `app/scripts/verify-ai-settings.ts`

- [ ] **Step 1: Update failing verification**

In `app/scripts/verify-ai-settings.ts`, add checks:

```ts
assert.ok(source.includes('templateSources.sourceTitle'));
assert.ok(source.includes('weeklySourceMode'));
assert.ok(source.includes('monthlySourceMode'));
assert.ok(source.includes('testSourceMaterials'));
assert.ok(source.includes('sourceFound'));
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npm run verify:ai-settings`

Expected: FAIL until source controls are implemented.

- [ ] **Step 3: Update preload and types for source test**

In `app/electron/preload.ts`, expose:

```ts
testSourceMaterials: (kind: 'weekly' | 'monthly', date: string) => ipcRenderer.invoke('aiReview:testSourceMaterials', kind, date),
```

In `app/src/vite-env.d.ts`, add:

```ts
testSourceMaterials: (
  kind: 'weekly' | 'monthly',
  date: string
) => Promise<{ ok: boolean; error?: string; sources: Array<{ label: string; filePath: string }> }>;
```

- [ ] **Step 4: Add source strategy controls**

In `SettingsPanel.tsx`, add selects:

```tsx
<section className="settings-section">
  <h3>{text.templateSources.sourceTitle}</h3>
  <p>{text.templateSources.sourceHint}</p>
  <label className="settings-field">
    <span><strong>{text.templateSources.weeklySourceMode}</strong></span>
    <select value={settings.weeklySourceMode} onChange={(event) => updateSettings('weeklySourceMode', event.target.value as AiReviewSettings['weeklySourceMode'])}>
      <option value="daily-notes">{text.templateSources.sourceDailyNotes}</option>
      <option value="manual-files">{text.templateSources.sourceManualFiles}</option>
    </select>
  </label>
  <label className="settings-field">
    <span><strong>{text.templateSources.monthlySourceMode}</strong></span>
    <select value={settings.monthlySourceMode} onChange={(event) => updateSettings('monthlySourceMode', event.target.value as AiReviewSettings['monthlySourceMode'])}>
      <option value="weekly-then-daily">{text.templateSources.sourceWeeklyThenDaily}</option>
      <option value="weekly-reports">{text.templateSources.sourceWeeklyReports}</option>
      <option value="daily-notes">{text.templateSources.sourceDailyNotes}</option>
      <option value="manual-files">{text.templateSources.sourceManualFiles}</option>
    </select>
  </label>
</section>
```

Repeat equivalent controls for `externalWeeklySourceMode` and `externalMonthlySourceMode`.

- [ ] **Step 5: Add source test button**

In `SettingsPanel.tsx`, add state:

```tsx
const [sourceTestStatus, setSourceTestStatus] = useState('');
const [sourceTestFiles, setSourceTestFiles] = useState<Array<{ label: string; filePath: string }>>([]);
```

Add handler:

```tsx
const testSources = async (kind: 'weekly' | 'monthly') => {
  const result = await window.electronAPI?.aiReview.testSourceMaterials(kind, kind === 'weekly' ? weekDate : monthDate);
  if (!result?.ok) {
    setSourceTestStatus(result?.error ?? text.templateSources.sourceNotFound);
    setSourceTestFiles([]);
    return;
  }
  setSourceTestFiles(result.sources);
  setSourceTestStatus(
    result.sources.length
      ? text.templateSources.sourceFound.replace('{count}', String(result.sources.length))
      : text.templateSources.sourceNotFound,
  );
};
```

Render:

```tsx
<div className="settings-action-row">
  <button type="button" className="settings-reset-button" onClick={() => testSources('weekly')}>{text.templateSources.testSources}</button>
  <button type="button" className="settings-reset-button" onClick={() => testSources('monthly')}>{text.templateSources.testSources}</button>
</div>
{sourceTestStatus && <p className="settings-status-text">{sourceTestStatus}</p>}
{sourceTestFiles.length > 0 && (
  <ul className="settings-preview-list">
    {sourceTestFiles.map((source) => <li key={source.filePath}>{source.label}：{source.filePath}</li>)}
  </ul>
)}
```

- [ ] **Step 6: Run verification**

Run: `cd app && npm run verify:ai-settings && npm run typecheck`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add app/src/components/SettingsPanel.tsx app/electron/preload.ts app/src/vite-env.d.ts app/scripts/verify-ai-settings.ts
git commit -m "feat(settings): add report source controls"
```

---

### Task 9: Automatic Report No-Source Status

**Files:**
- Modify: `app/src/App.tsx`
- Modify: `app/scripts/verify-ai-timer.ts`

- [ ] **Step 1: Update failing verification**

In `app/scripts/verify-ai-timer.ts`, add checks that `App.tsx` does not ignore scheduled generation results:

```ts
assert.ok(source.includes('handleScheduledReportResult'));
assert.ok(source.includes('generateWeekly(ymd(lastWeek), allTasksRef.current).then(handleScheduledReportResult)'));
assert.ok(source.includes('generateMonthly(ymd(lastMonth), allTasksRef.current).then(handleScheduledReportResult)'));
```

- [ ] **Step 2: Run verification to confirm it fails**

Run: `cd app && npm run verify:ai-timer`

Expected: FAIL because scheduled report results are currently ignored.

- [ ] **Step 3: Add scheduled result handler**

In `app/src/App.tsx`, add near AI review handlers:

```ts
const handleScheduledReportResult = useCallback((result?: { ok: boolean; error?: string }) => {
  if (!result || result.ok) return;
  setAiReviewStatus(result.error || copy.settings.templateSources.noSourceFound);
}, [copy.settings.templateSources.noSourceFound]);
```

Use the actual status setter in `App.tsx`; if the existing setter has a different name, use that existing status path.

- [ ] **Step 4: Wire scheduled callbacks**

Replace weekly timer callback body with:

```ts
void window.electronAPI?.aiReview?.generateWeekly(ymd(lastWeek), allTasksRef.current).then(handleScheduledReportResult);
```

Replace monthly timer callback body with:

```ts
void window.electronAPI?.aiReview?.generateMonthly(ymd(lastMonth), allTasksRef.current).then(handleScheduledReportResult);
```

- [ ] **Step 5: Run verification**

Run: `cd app && npm run verify:ai-timer && npm run typecheck`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/src/App.tsx app/scripts/verify-ai-timer.ts
git commit -m "fix(ai-review): surface scheduled report source errors"
```

---

### Task 10: Final Verification and UI Smoke Test

**Files:**
- Modify only if verification identifies issues in files from earlier tasks.

- [ ] **Step 1: Run focused verification suite**

Run:

```bash
cd app && npm run verify:template-source-settings && npm run verify:daily-markdown-template && npm run verify:source-materials && npm run verify:unified-template-recognition && npm run verify:template-source-i18n && npm run verify:obsidian-template-ui && npm run verify:ai-settings && npm run verify:weekly && npm run verify:monthly && npm run verify:export-reports
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `cd app && npm run typecheck`

Expected: PASS.

- [ ] **Step 3: Run broader RC verification**

Run: `cd app && npm run verify:rc`

Expected: PASS. If unrelated pre-existing failures appear, record the exact failing script and error in the final handoff without changing unrelated code.

- [ ] **Step 4: Launch app for UI smoke test**

Run: `cd app && npm run dev`

Manual checks:

1. Open settings in Chinese mode.
2. Confirm “模板与素材” is visible.
3. Confirm “每日记录文件位置” is visible.
4. Confirm advanced daily settings do not show `Legacy task export path`, `Work section title`, `dailyNotePath`, `weeklyPrompt`, `externalMonthlyDir`, or `presetId`.
5. Confirm all five editable templates are visible: 日报、个人周报、个人月报、对外周报、对外月报。
6. Paste a small report template and run recognition for personal weekly.
7. Use “测试素材来源” and confirm it shows either found file paths or the no-source message.
8. Switch language to English and confirm settings labels switch to English.

- [ ] **Step 5: Commit final fixes if any**

If the smoke test required fixes:

```bash
git add app/src app/electron app/shared app/scripts app/package.json
git commit -m "fix(settings): polish template source workflow"
```

If no fixes were required, do not create an empty commit.

---

## Plan Self-Review

- Spec coverage:
  - Editable daily template: Task 1, Task 2, Task 6.
  - Editable personal weekly/monthly templates: Task 1, Task 5, Task 7.
  - Editable external weekly/monthly templates: Task 1, Task 5, Task 7.
  - AI recognition/import for daily and reports: Task 4, Task 6, Task 7.
  - Source material configuration and testing: Task 3, Task 8.
  - No-source stop before LLM: Task 3, Task 9.
  - Full bilingual settings cleanup: Task 5, Task 6, Task 7, Task 8.
  - Legacy settings compatibility: Task 1.
  - UI smoke testing: Task 10.
- Placeholder scan: No `TBD`, `TODO`, or “similar to” steps remain.
- Type consistency: Source mode fields, recognition targets, and IPC method names are defined before use and reused consistently.
