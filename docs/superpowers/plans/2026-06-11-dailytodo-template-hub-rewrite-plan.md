# DailyTodo 模板中心重构 v2 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于已存在的 87eb43f (Obsidian Template Center v1) 增量重构,实现统一的 5 套模板(日/个人周/个人月/对外周/对外月)、共用模板编辑器弹窗、设置页面瘦身(去掉 AI 复盘独立 nav,合并到"设置"区)、双份生成 bug 修复、对外轻量脱敏、周月报切片 token 优化、设置面板 sticky 工具栏和 i18n 全量本地化。

**Architecture:**
- 数据模型从 `SectionConfig[]` (3 段固定) 重构为 `CustomBlock[]` (N 段,每个带 `renderType`)
- 模板层(`templateRenderer.ts`,新增)只渲染模板骨架,只写空 marker;AI 填充层(`runner.ts`,扩展)只调 LLM 写 marker 内容 — 严格分离
- 模板编辑器 1 个共用弹窗组件 `TemplateEditorModal`,5 个实例(kind 参数化)
- 设置面板改两栏布局 + 顶部 sticky 工具栏,nav 7→6(AI 复盘入口删除)
- 复用 87eb43f 已有的 `recognizeTemplate.ts` / `redaction.ts` / `sourceMaterials.ts` / `timer.ts` / `weekly.ts` / `monthly.ts`

**Tech Stack:** Electron 34, React 18, TypeScript 5, electron-store, existing OpenAI-compatible LLM caller, HTML5 native drag-and-drop (no DnD library), `tsx` verification scripts.

**Spec:** [docs/superpowers/specs/2026-06-11-dailytodo-template-hub-rewrite-design.md](../specs/2026-06-11-dailytodo-template-hub-rewrite-design.md)

**Pre-existing 87eb43f (do NOT redo, only extend):**
- `ObsidianTemplateCenter.tsx` (UI 雏形,将被 `TemplateEditorModal` 取代)
- `obsidianTemplateCenter.ts` shared helpers
- `obsidianTemplateRecognition.ts` shared helpers
- `recognizeTemplate.ts` (扩展支持 N 块 + renderType)
- `redaction.ts` (直接复用,本轮把它接入对外报告生成)
- `weekly.ts` / `monthly.ts` (扩展支持 N 块级 prompt)

---

## File Structure

### Create

- `app/shared/templateRenderer.ts`
  - 纯 TS,负责"5 套模板之一 → Obsidian 文件"的骨架渲染(只写空 marker,只写固定块,只写非 AI 块)。
  - 不调 LLM,不写 AI 内容。

- `app/shared/templateBlockDefaults.ts`
  - 5 套模板的默认值(固定块、默认自定义块、默认块级 prompt)。
  - `lightAnonymize(markdown)` 轻量脱敏函数(姓名/手机号/邮箱/项目代号)。

- `app/shared/pathTemplate.ts`
  - `expandPathTemplate(template: string, date: Date): string` 替换 `{{date}} / {{year}} / {{month}} / {{week}}` 变量。

- `app/shared/recognizeTemplateBlocks.ts`
  - 扩展 87eb43f 的 `recognizeTemplate.ts` 输出结构,支持 N 块 + 5 种 renderType 推断。
  - `parseRecognizedBlocks(raw: string, fallback: CustomBlock[]): { blocks: CustomBlock[]; confidence }`

- `app/src/components/TemplateEditorModal.tsx`
  - 共用模板编辑器弹窗,`kind: 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'`。
  - 内部:固定块组(仅 daily)/自定义块组,拖拽排序、改名、aiGenerate toggle、renderType 下拉、删除、添加、上传 AI 识别、恢复默认、保存。
  - HTML5 native drag-and-drop。

- `app/src/components/TemplateRecognitionModal.tsx`
  - AI 识别二级模态:上传文件/粘贴文本 → LLM 识别 → 预览(可二次编辑)→ 替换/追加/取消。
  - 重名冲突检测(与固定块重名时弹确认)。

- `app/scripts/verify-template-hub-rewrite.ts`
  - 端到端验证脚本,覆盖 spec 第 8 节 15 条验证项。

### Modify

- `app/shared/obsidianTemplates.ts`
  - **修双份 bug**:`buildDailyNoteFromTemplate` 只写空 marker,不写 AI 内容。
  - 删除 `dailyMarkdownTemplate` 文本模板解析(改用结构化 `dailyTemplate`)。
  - 删除 `taskLineTemplate` / `completionReviewTemplate` / 6 个 `sectionTitles` 字段(交给块级 prompt)。
  - 删除 `taskExportPath` 字段(任务导出能力本轮删除)。
  - 保留 `buildWorkBlock` / `buildInspirationBlock` / `buildTaskBlock` / `buildTaskLines` 底层工具(被新 `templateRenderer` 复用)。

- `app/shared/appSettings.ts`
  - 重写 `ObsidianTemplateSettings`:`dailyPath / weeklyPath / monthlyPath / externalWeeklyPath / externalMonthlyPath` (5 路径) + `dailyTemplate / weeklyTemplate / monthlyTemplate / externalWeeklyTemplate / externalMonthlyTemplate` (5 模板)。
  - 重写 `normalizeObsidianTemplateSettings`:从老 `dailyMarkdownTemplate` / `weeklyDir / externalWeeklyDir` 等老字段迁移到新结构。
  - 删除 `taskExportPath` / `taskLineTemplate` / `completionReviewTemplate` / `sectionTitles` / `dailyMarkdownTemplate`。
  - **保留** `syncDeletedReviewsToObsidian` / `confirmBeforeDeletingReview`。

- `app/shared/aiReview/aiReviewSettings.ts`
  - 删除 `weeklyDir / monthlyDir / externalWeeklyDir / externalMonthlyDir`(迁到 ObsidianTemplateSettings)。
  - 删除 `weeklyPrompt / monthlyPrompt / externalWeeklyPrompt / externalMonthlyPrompt`(改用块级 prompt)。
  - 删除 `weeklySourceMode / monthlySourceMode / externalWeeklySourceMode / externalMonthlySourceMode`(只保留"按日报聚合")。
  - 删除 `backfillDays`(默认 7,无配置)。
  - **扩展**:`externalWeeklyTimerEnabled / externalWeeklyTimerTime / externalWeeklyTimerWeekday` + `externalMonthlyTimer*`。
  - **扩展**:`anonymizeExternalReports: boolean` (默认 true)。

- `app/shared/aiReview/sectionConfig.ts`
  - **重写** `SectionConfig` 为新结构(见 spec 1.1):
    ```typescript
    export type RenderType = 'text' | 'list' | 'table' | 'callout' | 'dataview';
    export interface CustomBlock {
      id: string;
      name: string;
      aiGenerate: boolean;
      renderType: RenderType;
      prompt: string;
    }
    export interface FixedBlock {
      id: 'work' | 'inspire' | 'tasks';
      displayName: string;
    }
    export interface DailyTemplate { fixedBlocks: FixedBlock[]; customBlocks: CustomBlock[]; }
    export interface ReportTemplate { customBlocks: CustomBlock[]; }
    ```
  - 保留旧 `SectionConfig` 名字但内容改为 `CustomBlock`(兼容性)。

- `app/shared/aiReview/sectionOverrides.ts`
  - 适配新 `CustomBlock` 结构(若不兼容则重写)。

- `app/shared/aiReview/promptBuilder.ts`
  - `buildReviewMessages` 适配新 `CustomBlock` 字段(原 `SectionConfig.title` → `CustomBlock.name`,原 `SectionConfig.prompt` → `CustomBlock.prompt`,新增 `renderType` 附加指令)。
  - 加 `renderType` 校验:LLM 返回后按 `renderType` 包裹/降级(见 spec 3.4)。

- `app/shared/aiReview/recognizeTemplate.ts`
  - **扩展**为支持 N 块 + 5 种 renderType 推断(把现有输出从 `RecognizedSection` 适配为 `CustomBlock`)。
  - 调用方:被 `recognizeTemplateBlocks.ts` 和 `TemplateRecognitionModal` 使用。

- `app/shared/aiReview/weekly.ts`
  - `WeeklyParams.sections` 改为 `CustomBlock[]`。
  - 切片逻辑:把"工作总结"块(按块名匹配 "工作"/"总结"/"summary")走切片 B(收工作详情),其他走切片 A。
  - 改 `buildWeeklyMessages` 接受块列表 + 块级 prompt。

- `app/shared/aiReview/monthly.ts`
  - 同上,适配 N 块 + 切片。

- `app/shared/aiReview/sourceMaterials.ts`
  - `collectDailySourcesForDates` 扩展支持切片:返回 `{ sliceA: DailySourceMaterial[]; sliceB: DailySourceMaterial[] }`(A 不含 work,B 含 work)。

- `app/shared/aiReview/redaction.ts`
  - **保留** `redactForExport(markdown)` 现有签名,在 `weekly.ts` / `monthly.ts` 对外报告生成完毕后调用。

- `app/shared/aiReview/timer.ts`
  - **保留** `getNextTimerDelay` / `getNextWeeklyDelay` / `getNextMonthlyDelay`,扩展为支持 4 套定时器(personal/external × weekly/monthly)。
  - 加 `getNextExternalWeeklyDelay` / `getNextExternalMonthlyDelay`(或参数化)。

- `app/electron/aiReview/runner.ts`
  - `RunParams.sections` 改为 `CustomBlock[]`。
  - 严格执行"模板层只铺 marker,填充层只填 AI 内容"边界:不再做 `buildDailyNoteFromTemplate` 内的 AI 内容嵌入。
  - 加 `anonymize` 参数:对外报告生成完毕后跑 `lightAnonymize`。
  - 加 `force` 参数支持"立即重新生成今日日报"按钮的强制覆盖语义。

- `app/electron/aiReview/timer-scheduler.ts`(或类似文件,实际名字以仓库为准)
  - 4 套定时器注册(personal weekly/monthly + external weekly/monthly)。
  - "立即生成" 4 个按钮接入 + 1 个"立即重新生成今日日报"按钮接入。

- `app/electron/main.ts`
  - 接入新 IPC 路径:5 个模板编辑、4 套定时器、5 个"立即生成"按钮(其中 1 个是"立即重生日报")。
  - 删除老的 4 套 weeklyPrompt / externalWeeklyPrompt IPC(被块级 prompt 取代)。

- `app/electron/preload.ts`
  - 暴露新 IPC 给 renderer(模板编辑、定时器、立即生成)。

- `app/src/components/SettingsPanel.tsx`
  - **删除** AI 复盘入口(7 → 6 nav)。
  - **重写** "设置"区:Obsidian 同步(5 路径) + 模板设置(5 个 [编辑 →]) + AI 设置(模型 + API Key) + 周/月报自动生成(4 套 toggle + 5 个立即生成按钮)。
  - **删除** "高级日报设置"折叠区(本轮整个去掉)。
  - **i18n 化** 7 个 nav 标题(用 i18n key,不再硬编码英文)。
  - **i18n 化** 4 个 section heading(用 i18n key)。
  - **重构** 布局:两栏(left nav + right content)+ 顶部 sticky 工具栏(返回 / ✕ 关闭永远可见)。
  - **删除** `ObsidianTemplateCenter` 引用(被 `TemplateEditorModal` 取代)。

- `app/src/components/ObsidianTemplateCenter.tsx`
  - **删除整个文件**(被 `TemplateEditorModal` 取代;保留 87eb43f commit 引用待清理)。

- `app/src/i18n.ts`
  - 新增 50+ i18n key(见 spec 第 6 节),中英双语对称添加。

- `app/src/styles/globals.css`
  - 添加 sticky 顶部工具栏样式、两栏布局样式、模板编辑器弹窗样式、drag handle 样式、callout 提示样式。

- `app/package.json`
  - 添加 `verify:template-hub-rewrite` 脚本。

---

## Task 1: 扩展数据模型 — `CustomBlock` + 5 套模板

**Files:**
- Modify: `app/shared/aiReview/sectionConfig.ts`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T1 段)

- [ ] **Step 1: 写失败测试**

在 `app/scripts/verify-template-hub-rewrite.ts` 顶部加:

```typescript
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const cwd = process.cwd();
const root = existsSync(join(cwd, 'app')) ? cwd : join(cwd, 'app');
const sectionConfig = readFileSync(join(root, 'shared/aiReview/sectionConfig.ts'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

// T1: CustomBlock 数据结构存在
assert(sectionConfig.includes("export type RenderType"), 'RenderType 类型未定义');
assert(/export type RenderType\s*=\s*['"]text['"]\s*\|\s*['"]list['"]\s*\|\s*['"]table['"]\s*\|\s*['"]callout['"]\s*\|\s*['"]dataview['"]/.test(sectionConfig), 'RenderType 联合类型不完整');
assert(sectionConfig.includes('export interface CustomBlock'), 'CustomBlock 接口未定义');
assert(/id:\s*string/.test(sectionConfig), 'CustomBlock.id 缺失');
assert(/name:\s*string/.test(sectionConfig), 'CustomBlock.name 缺失');
assert(/aiGenerate:\s*boolean/.test(sectionConfig), 'CustomBlock.aiGenerate 缺失');
assert(/renderType:\s*RenderType/.test(sectionConfig), 'CustomBlock.renderType 缺失');
assert(/prompt:\s*string/.test(sectionConfig), 'CustomBlock.prompt 缺失');
assert(sectionConfig.includes('export interface FixedBlock'), 'FixedBlock 接口未定义');
assert(sectionConfig.includes("id: 'work' | 'inspire' | 'tasks'"), 'FixedBlock.id 联合类型错误');
assert(sectionConfig.includes('export interface DailyTemplate'), 'DailyTemplate 接口未定义');
assert(sectionConfig.includes('export interface ReportTemplate'), 'ReportTemplate 接口未定义');

console.log('T1: CustomBlock 数据结构 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `RenderType 类型未定义`(因为还没写)

- [ ] **Step 3: 实现数据模型**

修改 `app/shared/aiReview/sectionConfig.ts`,**完全替换**文件内容(只保留 import):

```typescript
// app/shared/aiReview/sectionConfig.ts

export type RenderType = 'text' | 'list' | 'table' | 'callout' | 'dataview';

export interface CustomBlock {
  id: string;          // uuid
  name: string;        // 用户可见名
  aiGenerate: boolean; // true=AI 生成,false=手动
  renderType: RenderType;
  prompt: string;      // 块级 prompt
}

export interface FixedBlock {
  id: 'work' | 'inspire' | 'tasks';
  displayName: string;
}

export interface DailyTemplate {
  fixedBlocks: FixedBlock[];   // 始终 3 个
  customBlocks: CustomBlock[]; // N 个
}

export interface ReportTemplate {
  customBlocks: CustomBlock[]; // N 个
}

// === 默认值工厂 ===

export function createDefaultDailyTemplate(): DailyTemplate {
  return {
    fixedBlocks: [
      { id: 'work', displayName: '今日工作' },
      { id: 'inspire', displayName: '灵感随笔' },
      { id: 'tasks', displayName: '每日任务' },
    ],
    customBlocks: [
      { id: crypto.randomUUID(), name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
      { id: crypto.randomUUID(), name: '明日待办', aiGenerate: true, renderType: 'list', prompt: '' },
      { id: crypto.randomUUID(), name: '可复用知识', aiGenerate: true, renderType: 'text', prompt: '' },
    ],
  };
}

export function createDefaultReportTemplate(kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'): ReportTemplate {
  if (kind === 'personalWeekly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本周工作总结', aiGenerate: true, renderType: 'text', prompt: '请用口语化、亲切的语气总结本周工作。' },
        { id: crypto.randomUUID(), name: '本周完成任务', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '本周灵感汇总', aiGenerate: true, renderType: 'callout', prompt: '请用 Obsidian Callout 突出显示。' },
        { id: crypto.randomUUID(), name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  if (kind === 'personalMonthly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本月工作总结', aiGenerate: true, renderType: 'text', prompt: '请用口语化总结。' },
        { id: crypto.randomUUID(), name: '本月完成任务', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '本月灵感汇总', aiGenerate: true, renderType: 'callout', prompt: '' },
        { id: crypto.randomUUID(), name: '本月复盘', aiGenerate: true, renderType: 'text', prompt: '' },
        { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  if (kind === 'externalWeekly') {
    return {
      customBlocks: [
        { id: crypto.randomUUID(), name: '本周工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语,不要包含个人情绪。' },
        { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
        { id: crypto.randomUUID(), name: '下周计划', aiGenerate: true, renderType: 'list', prompt: '' },
      ],
    };
  }
  // externalMonthly
  return {
    customBlocks: [
      { id: crypto.randomUUID(), name: '本月工作概览', aiGenerate: true, renderType: 'text', prompt: '请用正式书面语。' },
      { id: crypto.randomUUID(), name: '关键交付', aiGenerate: true, renderType: 'table', prompt: '' },
      { id: crypto.randomUUID(), name: '下月计划', aiGenerate: true, renderType: 'list', prompt: '' },
    ],
  };
}

// === 标准化(从任意输入还原) ===

export function normalizeDailyTemplate(value: unknown): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  if (!value || typeof value !== 'object') return defaults;
  const v = value as Partial<DailyTemplate>;
  return {
    fixedBlocks: Array.isArray(v.fixedBlocks) && v.fixedBlocks.length === 3
      ? v.fixedBlocks.map((b, i) => ({
          id: defaults.fixedBlocks[i].id,
          displayName: typeof b?.displayName === 'string' ? b.displayName : defaults.fixedBlocks[i].displayName,
        }))
      : defaults.fixedBlocks,
    customBlocks: Array.isArray(v.customBlocks) && v.customBlocks.length > 0
      ? v.customBlocks.map((b) => normalizeCustomBlock(b, defaults))
      : defaults.customBlocks,
  };
}

export function normalizeReportTemplate(value: unknown, kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly'): ReportTemplate {
  const defaults = createDefaultReportTemplate(kind);
  if (!value || typeof value !== 'object') return defaults;
  const v = value as Partial<ReportTemplate>;
  return {
    customBlocks: Array.isArray(v.customBlocks) && v.customBlocks.length > 0
      ? v.customBlocks.map((b) => normalizeCustomBlock(b, defaults))
      : defaults.customBlocks,
  };
}

function normalizeCustomBlock(b: any, defaults: { customBlocks: CustomBlock[] }): CustomBlock {
  const fallback = defaults.customBlocks[0];
  if (!b || typeof b !== 'object') return fallback;
  return {
    id: typeof b.id === 'string' ? b.id : crypto.randomUUID(),
    name: typeof b.name === 'string' ? b.name : fallback.name,
    aiGenerate: typeof b.aiGenerate === 'boolean' ? b.aiGenerate : true,
    renderType: ['text', 'list', 'table', 'callout', 'dataview'].includes(b.renderType) ? b.renderType : 'text',
    prompt: typeof b.prompt === 'string' ? b.prompt : '',
  };
}

// === 旧 SectionConfig 兼容(供现有代码平滑过渡) ===

/** @deprecated 用 CustomBlock 替代,保留类型别名供迁移期使用 */
export type SectionConfig = CustomBlock;
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T1: CustomBlock 数据结构 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/aiReview/sectionConfig.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(template-model): add CustomBlock / FixedBlock / DailyTemplate / ReportTemplate types"
```

---

## Task 2: 路径变量替换 — `expandPathTemplate`

**Files:**
- Create: `app/shared/pathTemplate.ts`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T2 段)

- [ ] **Step 1: 写失败测试**

在 verify 脚本追加:

```typescript
// T2: 路径模板变量替换
const pathTemplate = readFileSync(join(root, 'shared/pathTemplate.ts'), 'utf8');
assert(pathTemplate.includes('export function expandPathTemplate'), 'expandPathTemplate 函数未导出');
assert(/expandPathTemplate\([^,]+,\s*Date/.test(pathTemplate), 'expandPathTemplate 签名错误');
// 调用
const pt = await import(join(root, 'shared/pathTemplate.ts'));
const d = new Date('2026-06-15T10:00:00Z');
const out = pt.expandPathTemplate('logs/daily/{{date}}.md', d);
assert(out === 'logs/daily/2026-06-15.md', `date 变量替换错误,得到 ${out}`);
const out2 = pt.expandPathTemplate('logs/weekly/{{year}}-W{{week}}.md', d);
assert(/^logs\/weekly\/2026-W\d{2}\.md$/.test(out2), `year/week 变量替换错误,得到 ${out2}`);
const out3 = pt.expandPathTemplate('logs/monthly/{{year}}-{{month}}.md', d);
assert(out3 === 'logs/monthly/2026-06.md', `year/month 变量替换错误,得到 ${out3}`);

console.log('T2: 路径模板变量替换 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `expandPathTemplate 函数未导出`

- [ ] **Step 3: 实现**

创建 `app/shared/pathTemplate.ts`:

```typescript
// app/shared/pathTemplate.ts

/**
 * 把路径模板中的 {{date}} / {{year}} / {{month}} / {{week}} 替换为实际值。
 *  - {{date}}   → YYYY-MM-DD
 *  - {{year}}   → YYYY
 *  - {{month}}  → MM
 *  - {{week}}   → ISO 周数(补零到 2 位,如 23)
 *
 * 未知变量保留原样。
 */
export function expandPathTemplate(template: string, date: Date): string {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const isoWeek = isoWeekNumber(date);
  return template
    .replace(/\{\{\s*date\s*\}\}/g, `${yyyy}-${mm}-${dd}`)
    .replace(/\{\{\s*year\s*\}\}/g, yyyy)
    .replace(/\{\{\s*month\s*\}\}/g, mm)
    .replace(/\{\{\s*week\s*\}\}/g, String(isoWeek).padStart(2, '0'));
}

function isoWeekNumber(d: Date): number {
  // 拷贝到 UTC 避免时区影响
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // 周四在当前周
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNum = Math.ceil(((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return weekNum;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T2: 路径模板变量替换 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/pathTemplate.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(path-template): add expandPathTemplate for {{date}}/{{year}}/{{month}}/{{week}}"
```

---

## Task 3: 轻量脱敏 — `lightAnonymize`

**Files:**
- Create: `app/shared/templateBlockDefaults.ts`(包含 `lightAnonymize`)
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T3 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T3: 轻量脱敏
const blockDefaults = readFileSync(join(root, 'shared/templateBlockDefaults.ts'), 'utf8');
assert(blockDefaults.includes('export function lightAnonymize'), 'lightAnonymize 未导出');
const bd = await import(join(root, 'shared/templateBlockDefaults.ts'));
const sample = '联系张三 13800138000,邮箱 zhang@example.com,项目代号 Apollo-X';
const redacted = bd.lightAnonymize(sample);
assert(redacted.includes('[人员]'), '姓名未脱敏');
assert(redacted.includes('[联系方式]'), '手机/邮箱未脱敏');
assert(redacted.includes('[项目A]') || redacted.includes('[项目B]'), '项目代号未脱敏');
assert(!redacted.includes('张三'), '姓名未替换');
assert(!redacted.includes('13800138000'), '手机号未替换');
assert(!redacted.includes('zhang@example.com'), '邮箱未替换');

console.log('T3: 轻量脱敏 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `lightAnonymize 未导出`

- [ ] **Step 3: 实现**

创建 `app/shared/templateBlockDefaults.ts`:

```typescript
// app/shared/templateBlockDefaults.ts
//
// 本文件包含:
//  1. 5 套模板的默认块级 prompt 片段(供默认模板工厂使用,详见 sectionConfig.ts)
//  2. lightAnonymize() 轻量脱敏函数(对外报告生成后调用)
//
// 注意:本文件不导出任何模板/数据模型,那些在 sectionConfig.ts。

/**
 * 轻量脱敏:替换明显敏感词。
 *  - 2-3 字中文姓名 → [人员]
 *  - 11 位手机号(1[3-9]xxxxxxxxx) → [联系方式]
 *  - 邮箱 → [联系方式]
 *  - 项目代号(项目N / 客户X / Apollo-X 等) → [项目A] [项目B] ...
 *
 * 不做语义级脱敏,只做明显敏感词替换。
 */
export function lightAnonymize(markdown: string): string {
  let result = markdown;
  // 手机号
  result = result.replace(/\b1[3-9]\d{9}\b/g, '[联系方式]');
  // 邮箱
  result = result.replace(/\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g, '[联系方式]');
  // 项目/客户代号(中文"项目N" / "客户X" / 英文 "Apollo-X" / "Project-N")
  let projectCounter = 0;
  const projectMap = new Map<string, string>();
  result = result.replace(
    /(项目\s*\d+|客户\s*[一-龥A-Za-z]{1,8}|Project[\s_-]*[A-Za-z0-9]{1,8}|[A-Z][a-zA-Z]+-[A-Z0-9]{1,5})/g,
    (match) => {
      if (projectMap.has(match)) return projectMap.get(match)!;
      projectCounter += 1;
      const tag = `[项目${'ABCD'[projectCounter - 1] || projectCounter}]`;
      projectMap.set(match, tag);
      return tag;
    }
  );
  // 2-3 字中文姓名(粗略):仅在最常见的 100 个姓氏后跟 1-2 字处理
  const commonSurnames = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯昝管卢莫经房裘缪干解应宗丁宣贲邓郁单杭洪包诸左石崔吉钮龚程嵇邢滑裴陆荣翁';
  result = result.replace(new RegExp(`[${commonSurnames}][\\u4e00-\\u9fa5]{1,2}`, 'g'), (match) => {
    // 跳过已经是 [项目X] 的部分
    if (match.startsWith('[')) return match;
    return '[人员]';
  });
  return result;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T3: 轻量脱敏 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/templateBlockDefaults.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(anonymize): add lightAnonymize for external report generation"
```

---

## Task 4: 修复双份生成 bug — `templateRenderer` 拆职责

**Files:**
- Create: `app/shared/templateRenderer.ts`
- Modify: `app/shared/obsidianTemplates.ts`(只删不改 buildDailyNoteFromTemplate 的 AI 内容嵌入部分)
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T4 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T4: 双份生成 bug 修复
const templateRenderer = readFileSync(join(root, 'shared/templateRenderer.ts'), 'utf8');
assert(templateRenderer.includes('export function renderDailyTemplate'), 'renderDailyTemplate 未导出');
assert(templateRenderer.includes('export function renderReportTemplate'), 'renderReportTemplate 未导出');

// 静态检查:旧 buildDailyNoteFromTemplate 不再写 AI 内容
const obsTpl = readFileSync(join(root, 'shared/obsidianTemplates.ts'), 'utf8');
const fnMatch = obsTpl.match(/export function buildDailyNoteFromTemplate[\s\S]*?\n\}/);
assert(fnMatch, 'buildDailyNoteFromTemplate 函数未找到');
assert(!/AI 草稿/.test(fnMatch[0]), 'buildDailyNoteFromTemplate 仍包含 AI 草稿文字');
assert(!/🤖/.test(fnMatch[0]), 'buildDailyNoteFromTemplate 仍包含 🤖 emoji');

// 动态检查:跑渲染,marker 体内不应有 AI 草稿
const tr = await import(join(root, 'shared/templateRenderer.ts'));
const dailyTpl = {
  fixedBlocks: [
    { id: 'work', displayName: '今日工作' },
    { id: 'inspire', displayName: '灵感随笔' },
    { id: 'tasks', displayName: '每日任务' },
  ],
  customBlocks: [
    { id: 'b1', name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
  ],
};
const rendered = tr.renderDailyTemplate({
  template: dailyTpl,
  work: '今天写了点东西',
  inspiration: '想到一个 idea',
  tasks: '- [x] 任务A',
  date: '2026-06-11',
});
assert(rendered.includes('<!-- DAILYTODO:REVIEW:START -->'), '复盘 marker 缺失');
assert(rendered.includes('<!-- DAILYTODO:REVIEW:END -->'), '复盘 marker END 缺失');
// marker 体不应有 AI 内容(只有空白)
const markerBody = rendered.match(/<!-- DAILYTODO:REVIEW:START -->([\s\S]*?)<!-- DAILYTODO:REVIEW:END -->/);
assert(markerBody, 'marker 不完整');
assert(!markerBody[1].includes('🤖'), 'marker 内有 AI 草稿,bug 未修复');
assert(!markerBody[1].match(/\S/), 'marker 体应为空');

console.log('T4: 双份生成 bug 修复 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `renderDailyTemplate 未导出`

- [ ] **Step 3: 实现 `templateRenderer.ts`**

```typescript
// app/shared/templateRenderer.ts
//
// 模板渲染层:把 5 套模板之一渲染为 Obsidian 文件骨架。
//
// 严格职责:
//  - 写固定块(产品数据直接写)
//  - 写 aiGenerate=false 块(取自 productsData 或用户编辑)
//  - 写 aiGenerate=true 块对应的空 marker(DAILYTODO:REVIEW:START/END 等)
//  - **不**写任何 AI 内容(由 runner.ts 负责)

import {
  REVIEW_MARKERS,
  TOMORROW_MARKERS,
  KNOWLEDGE_MARKERS,
} from './aiReview/markers';
import type { DailyTemplate, ReportTemplate, CustomBlock } from './aiReview/sectionConfig';

export interface RenderDailyParams {
  template: DailyTemplate;
  work: string;
  inspiration: string;
  tasks: string;
  date: string; // YYYY-MM-DD
}

export interface RenderReportParams {
  template: ReportTemplate;
  content: string; // 已生成的 AI 内容(每个块一段)
}

const BLOCK_MARKER_KEYS = ['REVIEW', 'TOMORROW', 'KNOWLEDGE'] as const;
type BlockMarkerKey = typeof BLOCK_MARKER_KEYS[number];

function getMarker(key: BlockMarkerKey) {
  if (key === 'REVIEW') return REVIEW_MARKERS.REVIEW;
  if (key === 'TOMORROW') return REVIEW_MARKERS.TOMORROW;
  return REVIEW_MARKERS.KNOWLEDGE;
}

/**
 * 渲染日报模板为 Obsidian 文件内容。
 * 输出格式:
 *   # 2026-06-11
 *
 *   ## 今日工作
 *   (工作内容)
 *
 *   ## 灵感随笔
 *   (灵感内容)
 *
 *   ## 每日任务
 *   - [x] 任务A
 *
 *   ## 复盘
 *   <!-- DAILYTODO:REVIEW:START -->
 *   <!-- DAILYTODO:REVIEW:END -->
 *
 *   ## 明日待办
 *   <!-- DAILYTODO:TOMORROW:START -->
 *   <!-- DAILYTODO:TOMORROW:END -->
 *
 *   ## 可复用知识
 *   <!-- DAILYTODO:KNOWLEDGE:START -->
 *   <!-- DAILYTODO:KNOWLEDGE:END -->
 */
export function renderDailyTemplate(params: RenderDailyParams): string {
  const { template, work, inspiration, tasks, date } = params;
  const lines: string[] = [`# ${date}`, ''];

  for (const fixed of template.fixedBlocks) {
    if (fixed.id === 'work') {
      lines.push(`## ${fixed.displayName}`, work || '', '');
    } else if (fixed.id === 'inspire') {
      lines.push(`## ${fixed.displayName}`, inspiration || '', '');
    } else if (fixed.id === 'tasks') {
      lines.push(`## ${fixed.displayName}`, tasks || '', '');
    }
  }

  for (const block of template.customBlocks) {
    lines.push(`## ${block.name}`);
    if (block.aiGenerate) {
      // 写空 marker(用块 id 派生成 KEY;若名字命中关键词则匹配预定义 KEY,否则用通用)
      const key = inferBlockMarkerKey(block);
      const marker = getMarker(key);
      lines.push(marker.start);
      lines.push(marker.end);
    } else {
      // 手动块:暂时写空(后续可扩展为接受 productsData)
      lines.push('');
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * 渲染周/月报模板为 Obsidian 文件内容。
 * 周/月报的所有自定义块都是 aiGenerate=true(本轮设计)。
 *
 * @param content 各 AI 块已经生成的内容(按 template.customBlocks 顺序对齐)
 */
export function renderReportTemplate(params: RenderReportParams): string {
  const { template, content } = params;
  const lines: string[] = [];

  template.customBlocks.forEach((block, idx) => {
    lines.push(`## ${block.name}`);
    if (block.aiGenerate) {
      const key = inferBlockMarkerKey(block);
      const marker = getMarker(key);
      const body = content.split('<!--NEXT_BLOCK-->')[idx] ?? '';
      lines.push(marker.start);
      lines.push(body);
      lines.push(marker.end);
    } else {
      lines.push('');
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * 根据块名推断对应的 marker key。
 * "复盘" / "review" / "summary" → REVIEW
 * "明日待办" / "tomorrow" → TOMORROW
 * "知识" / "knowledge" → KNOWLEDGE
 * 其他 → REVIEW(默认)
 */
function inferBlockMarkerKey(block: CustomBlock): BlockMarkerKey {
  const name = block.name.toLowerCase();
  if (name.includes('复盘') || name.includes('review') || name.includes('总结') || name.includes('summary')) return 'REVIEW';
  if (name.includes('明日') || name.includes('tomorrow') || name.includes('下周') || name.includes('下月') || name.includes('next')) return 'TOMORROW';
  if (name.includes('知识') || name.includes('knowledge') || name.includes('灵感') || name.includes('inspiration')) return 'KNOWLEDGE';
  return 'REVIEW';
}
```

- [ ] **Step 4: 修改 `obsidianTemplates.ts` 的 `buildDailyNoteFromTemplate`**

**找到** `app/shared/obsidianTemplates.ts:237-287` 的 `buildDailyNoteFromTemplate` 函数。

**修改**:把函数内**所有写 AI 内容到 marker 的部分删除**,只写空 marker。具体:
- 找到 `entry.marker.start` 出现的位置
- 把 `lines.push(\`${entry.marker.start}\\n${entry.marker.end}\`)` 改为
  ```typescript
  lines.push(entry.marker.start);
  lines.push(entry.marker.end);
  ```
- 删除任何 `lines.push(\`🤖 AI 草稿\\n...\`)` 之类的代码

**提示**:把函数体末尾的 `## 复盘\\n<!-- ... -->\\n` 这种"既有标题也有 AI 内容"的形式,改为"只有标题 + 空 marker"。

- [ ] **Step 5: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T4: 双份生成 bug 修复 ✓`

- [ ] **Step 6: Commit**

```bash
git add app/shared/templateRenderer.ts app/shared/obsidianTemplates.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "fix(double-gen): split template render (skeleton only) from AI fill (marker content)"
```

---

## Task 5: 设置数据模型扩展 — 5 路径 + 5 模板

**Files:**
- Modify: `app/shared/appSettings.ts`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T5 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T5: ObsidianTemplateSettings 5 路径 + 5 模板
const appSettings = readFileSync(join(root, 'shared/appSettings.ts'), 'utf8');
assert(appSettings.includes('dailyPath:'), 'dailyPath 字段缺失');
assert(appSettings.includes('weeklyPath:'), 'weeklyPath 字段缺失');
assert(appSettings.includes('monthlyPath:'), 'monthlyPath 字段缺失');
assert(appSettings.includes('externalWeeklyPath:'), 'externalWeeklyPath 字段缺失');
assert(appSettings.includes('externalMonthlyPath:'), 'externalMonthlyPath 字段缺失');
assert(appSettings.includes('dailyTemplate:'), 'dailyTemplate 字段缺失');
assert(appSettings.includes('weeklyTemplate:'), 'weeklyTemplate 字段缺失');
assert(appSettings.includes('monthlyTemplate:'), 'monthlyTemplate 字段缺失');
assert(appSettings.includes('externalWeeklyTemplate:'), 'externalWeeklyTemplate 字段缺失');
assert(appSettings.includes('externalMonthlyTemplate:'), 'externalMonthlyTemplate 字段缺失');
// 旧字段必须删除
assert(!appSettings.includes('taskExportPath:'), 'taskExportPath 仍存在(应删除)');
assert(!appSettings.includes('dailyMarkdownTemplate:'), 'dailyMarkdownTemplate 仍存在(应删除)');
assert(!appSettings.includes('taskLineTemplate:'), 'taskLineTemplate 仍存在(应删除)');
assert(!appSettings.includes('completionReviewTemplate:'), 'completionReviewTemplate 仍存在(应删除)');

console.log('T5: 5 路径 + 5 模板数据模型 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `dailyPath 字段缺失`

- [ ] **Step 3: 重写 `ObsidianTemplateSettings`**

修改 `app/shared/appSettings.ts`:

1. 找到 `ObsidianTemplateSettings` interface,**完整替换**为:

```typescript
export interface ObsidianTemplateSettings {
  obsidianPath: string;
  dailyPath: string;            // 默认 logs/daily/{{date}}.md
  weeklyPath: string;           // 默认 logs/weekly/personal/{{year}}-W{{week}}.md
  monthlyPath: string;          // 默认 logs/monthly/personal/{{year}}-{{month}}.md
  externalWeeklyPath: string;   // 默认 logs/weekly/external/{{year}}-W{{week}}.md
  externalMonthlyPath: string;  // 默认 logs/monthly/external/{{year}}-{{month}}.md

  dailyTemplate: DailyTemplate;
  weeklyTemplate: ReportTemplate;
  monthlyTemplate: ReportTemplate;
  externalWeeklyTemplate: ReportTemplate;
  externalMonthlyTemplate: ReportTemplate;

  syncDeletedReviewsToObsidian: boolean;
  confirmBeforeDeletingReview: boolean;
}
```

2. 在顶部 import 区域加:
```typescript
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
  normalizeDailyTemplate,
  normalizeReportTemplate,
} from './aiReview/sectionConfig';
import type { DailyTemplate, ReportTemplate } from './aiReview/sectionConfig';
```

3. **重写** `createDefaultObsidianTemplateSettings`:

```typescript
export function createDefaultObsidianTemplateSettings(): ObsidianTemplateSettings {
  return {
    obsidianPath: '',
    dailyPath: 'logs/daily/{{date}}.md',
    weeklyPath: 'logs/weekly/personal/{{year}}-W{{week}}.md',
    monthlyPath: 'logs/monthly/personal/{{year}}-{{month}}.md',
    externalWeeklyPath: 'logs/weekly/external/{{year}}-W{{week}}.md',
    externalMonthlyPath: 'logs/monthly/external/{{year}}-W{{month}}.md', // 注意:对外月报无 week
    dailyTemplate: createDefaultDailyTemplate(),
    weeklyTemplate: createDefaultReportTemplate('personalWeekly'),
    monthlyTemplate: createDefaultReportTemplate('personalMonthly'),
    externalWeeklyTemplate: createDefaultReportTemplate('externalWeekly'),
    externalMonthlyTemplate: createDefaultReportTemplate('externalMonthly'),
    syncDeletedReviewsToObsidian: true,
    confirmBeforeDeletingReview: true,
  };
}
```

> **修一处**:把 `externalMonthlyPath` 默认值从 `{{year}}-{{month}}.md` 改为 `{{year}}-{{month}}.md`(无 `W`)。

4. **重写** `normalizeObsidianTemplateSettings`,**支持从老字段迁移**:

```typescript
export function normalizeObsidianTemplateSettings(value: unknown): ObsidianTemplateSettings {
  const defaults = createDefaultObsidianTemplateSettings();
  if (!value || typeof value !== 'object') return defaults;
  const v = value as any;

  // 路径迁移:老 dailyNotePath → dailyPath;老 weeklyDir/monthlyDir/externalWeeklyDir/externalMonthlyDir → 新路径
  const dailyPath = typeof v.dailyPath === 'string' ? v.dailyPath
    : typeof v.dailyNotePath === 'string' ? migrateDailyPath(v.dailyNotePath)
    : defaults.dailyPath;
  const weeklyPath = typeof v.weeklyPath === 'string' ? v.weeklyPath
    : migrateReportDir(v.weeklyDir, 'weekly', 'personal');
  const monthlyPath = typeof v.monthlyPath === 'string' ? v.monthlyPath
    : migrateReportDir(v.monthlyDir, 'monthly', 'personal');
  const externalWeeklyPath = typeof v.externalWeeklyPath === 'string' ? v.externalWeeklyPath
    : migrateReportDir(v.externalWeeklyDir, 'weekly', 'external');
  const externalMonthlyPath = typeof v.externalMonthlyPath === 'string' ? v.externalMonthlyPath
    : migrateReportDir(v.externalMonthlyDir, 'monthly', 'external');

  // 模板迁移:老 dailyMarkdownTemplate (文本) → 解析 token 还原
  const dailyTemplate = v.dailyTemplate
    ? normalizeDailyTemplate(v.dailyTemplate)
    : v.dailyMarkdownTemplate
    ? migrateDailyMarkdownTemplate(v.dailyMarkdownTemplate)
    : defaults.dailyTemplate;
  const weeklyTemplate = v.weeklyTemplate
    ? normalizeReportTemplate(v.weeklyTemplate, 'personalWeekly')
    : defaults.weeklyTemplate;
  const monthlyTemplate = v.monthlyTemplate
    ? normalizeReportTemplate(v.monthlyTemplate, 'personalMonthly')
    : defaults.monthlyTemplate;
  const externalWeeklyTemplate = v.externalWeeklyTemplate
    ? normalizeReportTemplate(v.externalWeeklyTemplate, 'externalWeekly')
    : defaults.externalWeeklyTemplate;
  const externalMonthlyTemplate = v.externalMonthlyTemplate
    ? normalizeReportTemplate(v.externalMonthlyTemplate, 'externalMonthly')
    : defaults.externalMonthlyTemplate;

  return {
    obsidianPath: typeof v.obsidianPath === 'string' ? v.obsidianPath : '',
    dailyPath,
    weeklyPath,
    monthlyPath,
    externalWeeklyPath,
    externalMonthlyPath,
    dailyTemplate,
    weeklyTemplate,
    monthlyTemplate,
    externalWeeklyTemplate,
    externalMonthlyTemplate,
    syncDeletedReviewsToObsidian: typeof v.syncDeletedReviewsToObsidian === 'boolean' ? v.syncDeletedReviewsToObsidian : true,
    confirmBeforeDeletingReview: typeof v.confirmBeforeDeletingReview === 'boolean' ? v.confirmBeforeDeletingReview : true,
  };
}

function migrateDailyPath(old: string): string {
  // 老的"logs/daily/DailyTodo/{{date}}.md"或类似
  return old.replace(/\{\{date\}\}/g, '{{date}}');
}

function migrateReportDir(old: unknown, kind: 'weekly' | 'monthly', audience: 'personal' | 'external'): string {
  if (typeof old !== 'string' || !old) {
    return kind === 'weekly'
      ? `logs/weekly/${audience}/{{year}}-W{{week}}.md`
      : `logs/monthly/${audience}/{{year}}-{{month}}.md`;
  }
  // 老路径可能是目录(末尾无 .md)或完整文件
  const hasMd = old.endsWith('.md');
  const tmpl = kind === 'weekly' ? '{{year}}-W{{week}}.md' : '{{year}}-{{month}}.md';
  if (hasMd) {
    // 已有 .md,变量替换一下
    return old.replace(/\{\{year\}\}/g, '{{year}}').replace(/\{\{week\}\}/g, '{{week}}').replace(/\{\{month\}\}/g, '{{month}}');
  }
  // 目录,补全文件名
  return `${old.replace(/\/$/, '')}/${tmpl}`;
}

function migrateDailyMarkdownTemplate(old: string): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  if (!old || !old.includes('{{')) {
    return defaults;
  }
  // 解析 token 出现顺序
  const tokens = ['{{work}}', '{{inspire}}', '{{tasks}}'];
  const order: Array<'work' | 'inspire' | 'tasks'> = [];
  for (const tok of tokens) {
    if (old.includes(tok)) {
      const id = tok.replace(/[{}]/g, '').replace('inspire', 'inspire').replace('work', 'work').replace('tasks', 'tasks');
      order.push(id as any);
    }
  }
  // 补全缺失
  for (const t of tokens) {
    const id = t.replace(/[{}]/g, '').replace('inspire', 'inspire').replace('work', 'work').replace('tasks', 'tasks');
    if (!order.includes(id as any)) order.push(id as any);
  }
  // 重排固定块
  const fixedBlocks = order.map((id) => defaults.fixedBlocks.find((f) => f.id === id)!);

  // 解析自定义块({{review}} {{tomorrow}} {{knowledge}})
  const customOrder: Array<'REVIEW' | 'TOMORROW' | 'KNOWLEDGE'> = [];
  const reviewMatch = old.includes('{{review}}');
  const tomorrowMatch = old.includes('{{tomorrow}}');
  const knowledgeMatch = old.includes('{{knowledge}}');
  if (reviewMatch) customOrder.push('REVIEW');
  if (tomorrowMatch) customOrder.push('TOMORROW');
  if (knowledgeMatch) customOrder.push('KNOWLEDGE');

  const customDefaults: Record<string, { name: string; renderType: any; prompt: string }> = {
    REVIEW: { name: '复盘', renderType: 'text', prompt: '' },
    TOMORROW: { name: '明日待办', renderType: 'list', prompt: '' },
    KNOWLEDGE: { name: '可复用知识', renderType: 'text', prompt: '' },
  };

  const customBlocks = customOrder.length > 0
    ? customOrder.map((key) => ({
        id: crypto.randomUUID(),
        name: customDefaults[key].name,
        aiGenerate: true,
        renderType: customDefaults[key].renderType,
        prompt: customDefaults[key].prompt,
      }))
    : defaults.customBlocks;

  return { fixedBlocks, customBlocks };
}
```

5. **删除** `DEFAULT_DAILY_MARKDOWN_TEMPLATE` 常量(已被结构化默认值取代)。
6. **删除** `DailySourceRule` / `dailySourceRules` / `presetId` / `modules` / `sectionTitles` 字段(本轮不再用)。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T5: 5 路径 + 5 模板数据模型 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/appSettings.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(settings): rewrite ObsidianTemplateSettings to 5 paths + 5 templates"
```

---

## Task 6: AI 复盘设置扩展 — 4 套定时器 + 脱敏开关

**Files:**
- Modify: `app/shared/aiReview/aiReviewSettings.ts`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T6 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T6: AiReviewSettings 4 套定时器 + 脱敏
const aiSettings = readFileSync(join(root, 'shared/aiReview/aiReviewSettings.ts'), 'utf8');
assert(aiSettings.includes('weeklyTimerEnabled:'), 'weeklyTimerEnabled 缺失');
assert(aiSettings.includes('monthlyTimerEnabled:'), 'monthlyTimerEnabled 缺失');
assert(aiSettings.includes('externalWeeklyTimerEnabled:'), 'externalWeeklyTimerEnabled 缺失(应新增)');
assert(aiSettings.includes('externalMonthlyTimerEnabled:'), 'externalMonthlyTimerEnabled 缺失(应新增)');
assert(aiSettings.includes('anonymizeExternalReports:'), 'anonymizeExternalReports 缺失(应新增)');
// 旧字段必须删除
assert(!aiSettings.includes('weeklyDir:'), 'weeklyDir 仍存在(应删除)');
assert(!aiSettings.includes('monthlyDir:'), 'monthlyDir 仍存在(应删除)');
assert(!aiSettings.includes('externalWeeklyDir:'), 'externalWeeklyDir 仍存在(应删除)');
assert(!aiSettings.includes('externalMonthlyDir:'), 'externalMonthlyDir 仍存在(应删除)');
assert(!aiSettings.includes('weeklyPrompt:'), 'weeklyPrompt 仍存在(应删除)');
assert(!aiSettings.includes('weeklySourceMode:'), 'weeklySourceMode 仍存在(应删除)');
assert(!aiSettings.includes('backfillDays:'), 'backfillDays 仍存在(应删除)');

console.log('T6: AiReviewSettings 4 套定时器 + 脱敏 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `externalWeeklyTimerEnabled 缺失`

- [ ] **Step 3: 重写 `AiReviewSettings`**

修改 `app/shared/aiReview/aiReviewSettings.ts`:

1. 找到 `AiReviewSettings` interface,**完整替换**为:

```typescript
export interface AiReviewSettings {
  enabled: boolean;
  account: AiAccount;  // 现有,不展开

  // 个人周报定时
  weeklyTimerEnabled: boolean;
  weeklyTimerTime: string;       // HH:mm
  weeklyTimerWeekday: number;    // 0-6

  // 个人月报定时
  monthlyTimerEnabled: boolean;
  monthlyTimerTime: string;
  monthlyTimerDay: number;       // 1-31

  // 对外周报定时(本轮新增)
  externalWeeklyTimerEnabled: boolean;
  externalWeeklyTimerTime: string;
  externalWeeklyTimerWeekday: number;

  // 对外月报定时(本轮新增)
  externalMonthlyTimerEnabled: boolean;
  externalMonthlyTimerTime: string;
  externalMonthlyTimerDay: number;

  // 对外轻量脱敏(本轮新增,默认开)
  anonymizeExternalReports: boolean;
}
```

2. 重写 `createDefaultAiReviewSettings`(类似)和新加 4 套字段的 default 值。
3. 重写 `normalizeAiReviewSettings` 支持老字段映射(老 `weeklyPrompt / externalWeeklyPrompt` 等提示词字段保留为 deprecated 但不再使用)。
4. **删除** `weeklyDir / monthlyDir / externalWeeklyDir / externalMonthlyDir`。
5. **删除** `weeklyPrompt / monthlyPrompt / externalWeeklyPrompt / externalMonthlyPrompt`。
6. **删除** `weeklySourceMode / monthlySourceMode / externalWeeklySourceMode / externalMonthlySourceMode`。
7. **删除** `backfillDays`。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T6: AiReviewSettings 4 套定时器 + 脱敏 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/aiReview/aiReviewSettings.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(ai-settings): add 4 timers + anonymize flag, remove dir/prompt/sourceMode fields"
```

---

## Task 7: AI 识别扩展 — 支持 N 块 + 5 种 renderType

**Files:**
- Create: `app/shared/recognizeTemplateBlocks.ts`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T7 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T7: AI 识别 N 块 + renderType
const recog = readFileSync(join(root, 'shared/recognizeTemplateBlocks.ts'), 'utf8');
assert(recog.includes('export function buildRecognizeBlocksMessages'), 'buildRecognizeBlocksMessages 未导出');
assert(recog.includes('export function parseRecognizedBlocks'), 'parseRecognizedBlocks 未导出');
const r = await import(join(root, 'shared/recognizeTemplateBlocks.ts'));
const sampleMd = `# Daily
## 今日总结
- 完成 A
- 完成 B
## 下周计划
1. 计划 X
## 灵感
> [!note] 想法
> 想法内容`;
const result = r.parseRecognizedBlocks(sampleMd, [
  { id: 'b1', name: '默认1', aiGenerate: true, renderType: 'text', prompt: '' },
]);
assert(result.blocks.length === 3, `应识别 3 块,实际 ${result.blocks.length}`);
assert(result.blocks[0].name === '今日总结', `第 1 块名错误:${result.blocks[0].name}`);
assert(result.blocks[0].renderType === 'list', `第 1 块应为 list,实际 ${result.blocks[0].renderType}`);
assert(result.blocks[1].name === '下周计划', `第 2 块名错误`);
assert(result.blocks[1].renderType === 'list', `第 2 块应为 list`);
assert(result.blocks[2].renderType === 'callout', `第 3 块应为 callout,实际 ${result.blocks[2].renderType}`);

console.log('T7: AI 识别 N 块 + renderType ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `buildRecognizeBlocksMessages 未导出`

- [ ] **Step 3: 实现**

```typescript
// app/shared/recognizeTemplateBlocks.ts
//
// 把用户上传/粘贴的 Markdown 模板识别为 N 个 CustomBlock。
// 复用 87eb43f 的 LLM 调用模式(parseRecognizedSections 的处理经验),
// 扩展为支持 5 种 renderType 推断。

import type { ChatMessage } from './llm/types';
import type { CustomBlock, RenderType } from './aiReview/sectionConfig';

const SYSTEM_PROMPT = `你是 Markdown 模板解析器。把用户上传的模板文档中的「自定义区块」(二级标题 ##)解析为 JSON 数组。

返回格式(纯 JSON,不要任何说明):
[{"name": "区块名", "aiGenerate": true, "renderType": "text|list|table|callout|dataview", "prompt": ""}]

注意:
- 忽略"今日工作""灵感随笔""每日任务"这三项,系统已固定提供
- 忽略一级标题 # 和无标题的纯文本
- renderType 推断规则:
  - 二级标题下全是 "- item" 无序列表 → list
  - 二级标题下首行是 "|...|" 表格 → table
  - 二级标题下首行是 "> [!xxx]" → callout
  - 二级标题下首行是 "\`\`\`dataview" 代码块 → dataview
  - 其他 → text(默认)
- aiGenerate 一律返回 true
- prompt 字段留空字符串`;

export function buildRecognizeBlocksMessages(rawTemplate: string): ChatMessage[] {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: rawTemplate },
  ];
}

export function parseRecognizedBlocks(
  raw: string,
  fallback: CustomBlock[],
): { blocks: CustomBlock[]; confidence: 'high' | 'medium' | 'low' } {
  // 1. 尝试从 LLM 输出中提取 JSON
  const cleaned = stripFences(raw);
  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return { blocks: fallback, confidence: 'low' };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    return { blocks: fallback, confidence: 'low' };
  }

  // 2. 验证 + 转换
  const validTypes: RenderType[] = ['text', 'list', 'table', 'callout', 'dataview'];
  const fixedNames = ['今日工作', '灵感随笔', '每日任务'];
  const blocks: CustomBlock[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== 'object') continue;
    const name = typeof item.name === 'string' ? item.name.trim() : '';
    if (!name) continue;
    if (fixedNames.includes(name)) continue; // 跳过与固定块重名的
    const renderType = validTypes.includes(item.renderType) ? item.renderType : 'text';
    const aiGenerate = typeof item.aiGenerate === 'boolean' ? item.aiGenerate : true;
    const prompt = typeof item.prompt === 'string' ? item.prompt : '';
    blocks.push({
      id: crypto.randomUUID(),
      name,
      aiGenerate,
      renderType,
      prompt,
    });
  }

  if (blocks.length === 0) {
    return { blocks: fallback, confidence: 'low' };
  }
  const confidence: 'high' | 'medium' | 'low' = blocks.length === parsed.length ? 'high' : 'medium';
  return { blocks, confidence };
}

function stripFences(raw: string): string {
  let s = raw.trim();
  // ```json ... ``` or ``` ... ```
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fence) s = fence[1].trim();
  return s;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T7: AI 识别 N 块 + renderType ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/recognizeTemplateBlocks.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(recognition): N-block + 5-renderType template recognition"
```

---

## Task 8: 周/月报生成扩展 — N 块 + 切片 + 脱敏

**Files:**
- Modify: `app/shared/aiReview/weekly.ts`
- Modify: `app/shared/aiReview/monthly.ts`
- Modify: `app/shared/aiReview/sourceMaterials.ts`(加 sliceA/sliceB)
- Modify: `app/shared/aiReview/promptBuilder.ts`(适配 CustomBlock + renderType 校验)
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T8 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T8: 周/月报切片 + 脱敏
const weeklyTs = readFileSync(join(root, 'shared/aiReview/weekly.ts'), 'utf8');
const monthlyTs = readFileSync(join(root, 'shared/aiReview/monthly.ts'), 'utf8');
const sourceMats = readFileSync(join(root, 'shared/aiReview/sourceMaterials.ts'), 'utf8');
const promptBuilder = readFileSync(join(root, 'shared/aiReview/promptBuilder.ts'), 'utf8');
const redaction = readFileSync(join(root, 'shared/aiReview/redaction.ts'), 'utf8');

// weekly/monthly 接受 CustomBlock[]
assert(weeklyTs.includes('CustomBlock[]') || weeklyTs.includes('blocks: CustomBlock'), 'weekly 未接受 CustomBlock[]');
assert(monthlyTs.includes('CustomBlock[]') || monthlyTs.includes('blocks: CustomBlock'), 'monthly 未接受 CustomBlock[]');

// 切片函数
assert(sourceMats.includes('sliceA') && sourceMats.includes('sliceB'), 'sourceMaterials 未提供 sliceA/sliceB');

// promptBuilder 接受 renderType
assert(promptBuilder.includes('renderType'), 'promptBuilder 未引用 renderType');

// 周/月报对对外版本调用脱敏
assert(weeklyTs.includes('lightAnonymize') || weeklyTs.includes('anonymize'), 'weekly 未接脱敏');
assert(monthlyTs.includes('lightAnonymize') || monthlyTs.includes('anonymize'), 'monthly 未接脱敏');

// 静态检查:renderType 校验
assert(promptBuilder.includes('降级') || promptBuilder.includes('downgrade') || promptBuilder.includes('降级为'), 'renderType 降级逻辑缺失');

console.log('T8: 周/月报切片 + 脱敏 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `weekly 未接受 CustomBlock[]`

- [ ] **Step 3: 实现修改**

**修改 `app/shared/aiReview/weekly.ts`:**

1. 找到 `WeeklyParams` interface,扩展为:

```typescript
import type { CustomBlock } from './sectionConfig';
import { lightAnonymize } from '../templateBlockDefaults';

export interface WeeklyParams {
  weekKey: string;
  dailyContents: DailySourceMaterial[];
  blocks: CustomBlock[];   // 替换原 sections
  systemPrompt?: string;
  audience: 'personal' | 'external';  // 本轮新增:决定是否脱敏
  stats?: any;
}
```

2. `buildWeeklyMessages` 函数:把入参 `sections` 改为 `blocks`,按 `blocks` 顺序生成 N 个 section 的 messages。
3. **切片逻辑**:在 `buildWeeklyMessages` 内部,把"工作总结"类(块名匹配 `/工作|总结|summary/i`)单独发一次 LLM(prompt 含"今日工作"详情);其他块合一次 LLM。
4. **脱敏**:在 messages 构造完毕后,如果 `audience === 'external'` 且 `anonymizeExternalReports === true`,对最终内容调 `lightAnonymize`。

> **具体实现参考**:87eb43f 的 `buildWeeklyMessages` 现版本,把所有 `SectionConfig[]` 替换为 `CustomBlock[]`,并加切片分支。完整代码实现约 50-80 行,**不要在此 plan 重复 87eb43f 的实现,只指明改动点**。

**修改 `app/shared/aiReview/monthly.ts`:** 同上(weekly → monthly,MonthlyParams 扩展 `audience: 'personal' | 'external'`)。

**修改 `app/shared/aiReview/sourceMaterials.ts`:**

`collectDailySourcesForDates` 改返回:

```typescript
export interface DailySourcesSplit {
  sliceA: DailySourceMaterial[]; // 不含"今日工作"详情(任务/复盘/灵感)
  sliceB: DailySourceMaterial[]; // 含"今日工作"详情
}
export function collectDailySourcesForDates(params: ...): DailySourcesSplit {
  const sources = /* 老的实现,读取所有 */;
  return {
    sliceA: sources.map(s => ({ ...s, content: stripWorkBlock(s.content) })),
    sliceB: sources,
  };
}
function stripWorkBlock(content: string): string {
  // 移除 "## 今日工作" 块
  return content.replace(/## 今日工作[\s\S]*?(?=## |\n$)/g, '');
}
```

**修改 `app/shared/aiReview/promptBuilder.ts`:**

`buildReviewMessages` 接受新的 `CustomBlock` 结构(代替 `SectionConfig`),并在 prompt 末尾附加 `renderType` 指令(参见 spec 1.2 渲染类型映射表)。

加 `validateAndWrapByRenderType(rawContent: string, renderType: RenderType): { content: string; downgraded: boolean }`:

- `text` → 直接返回
- `list` → 检查每行 `- ` 前缀,缺失则补
- `table` → 检查首尾 `|`,缺失则降级为 `text` 并附 `⚠️ 表格格式识别失败,降级为文本`
- `callout` → 必须 `> [!xxx]`,缺失则降级为 `text`
- `dataview` → 必须 ``` ```dataview ```,缺失则降级为 `text`

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T8: 周/月报切片 + 脱敏 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/shared/aiReview/weekly.ts app/shared/aiReview/monthly.ts app/shared/aiReview/sourceMaterials.ts app/shared/aiReview/promptBuilder.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(weekly-monthly): N blocks + work-slice optimization + lightAnonymize"
```

---

## Task 9: 模板编辑器弹窗组件

**Files:**
- Create: `app/src/components/TemplateEditorModal.tsx`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T9 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T9: 模板编辑器弹窗组件
const editorModal = readFileSync(join(root, 'src/components/TemplateEditorModal.tsx'), 'utf8');
assert(editorModal.includes('export function TemplateEditorModal'), 'TemplateEditorModal 未导出');
assert(/kind:\s*['"]daily['"]\s*\|\s*['"]personalWeekly['"]\s*\|\s*['"]personalMonthly['"]\s*\|\s*['"]externalWeekly['"]\s*\|\s*['"]externalMonthly['"]/.test(editorModal), 'kind 类型联合不完整');
assert(editorModal.includes('fixedBlocks') || editorModal.includes('固定区块'), '弹窗未处理 fixedBlocks');
assert(editorModal.includes('customBlocks') || editorModal.includes('自定义区块'), '弹窗未处理 customBlocks');
assert(editorModal.includes('draggable') || editorModal.includes('onDragStart') || editorModal.includes('onDragOver'), '弹窗未实现拖拽');
assert(editorModal.includes('恢复默认') || editorModal.includes('reset'), '弹窗未实现恢复默认');

console.log('T9: 模板编辑器弹窗 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `TemplateEditorModal 未导出`

- [ ] **Step 3: 实现**

创建 `app/src/components/TemplateEditorModal.tsx`(约 250-350 行)。要点:

```typescript
import { useState, useRef } from 'react';
import type { DailyTemplate, ReportTemplate, CustomBlock, RenderType } from '../../shared/aiReview/sectionConfig';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from '../../shared/aiReview/sectionConfig';

export type TemplateEditorKind =
  | 'daily' | 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';

interface BaseProps {
  kind: TemplateEditorKind;
  onSave: (template: DailyTemplate | ReportTemplate) => void;
  onCancel: () => void;
  language: 'zh-CN' | 'en-US';
}

interface DailyProps extends BaseProps {
  kind: 'daily';
  initial: DailyTemplate;
}
interface ReportProps extends BaseProps {
  kind: 'personalWeekly' | 'personalMonthly' | 'externalWeekly' | 'externalMonthly';
  initial: ReportTemplate;
}
type Props = DailyProps | ReportProps;

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '纯文本', list: '列表', table: '表格', callout: 'Callout', dataview: 'Dataview(实验性)',
};

export function TemplateEditorModal(props: Props) {
  const [template, setTemplate] = useState(() => cloneTemplate(props.initial, props.kind));
  const [draggingIdx, setDraggingIdx] = useState<{ group: 'fixed' | 'custom'; idx: number } | null>(null);

  const hasFixed = props.kind === 'daily';
  const fixedBlocks = hasFixed ? (template as DailyTemplate).fixedBlocks : [];
  const customBlocks = (template as any).customBlocks;

  function setCustomBlocks(next: CustomBlock[]) {
    setTemplate((prev) => ({ ...(prev as any), customBlocks: next }) as any);
  }
  function setFixedBlocks(next: DailyTemplate['fixedBlocks']) {
    setTemplate((prev) => ({ ...(prev as any), fixedBlocks: next }) as any);
  }

  function handleDragStart(group: 'fixed' | 'custom', idx: number) {
    setDraggingIdx({ group, idx });
  }
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }
  function handleDrop(targetGroup: 'fixed' | 'custom', targetIdx: number) {
    if (!draggingIdx) return;
    if (draggingIdx.group !== targetGroup) {
      // 跨组拒绝
      setDraggingIdx(null);
      return;
    }
    if (draggingIdx.idx === targetIdx) {
      setDraggingIdx(null);
      return;
    }
    if (targetGroup === 'fixed') {
      const arr = [...fixedBlocks];
      const [moved] = arr.splice(draggingIdx.idx, 1);
      arr.splice(targetIdx, 0, moved);
      setFixedBlocks(arr);
    } else {
      const arr = [...customBlocks];
      const [moved] = arr.splice(draggingIdx.idx, 1);
      arr.splice(targetIdx, 0, moved);
      setCustomBlocks(arr);
    }
    setDraggingIdx(null);
  }

  function renameCustomBlock(idx: number, name: string) {
    const arr = [...customBlocks];
    arr[idx] = { ...arr[idx], name };
    setCustomBlocks(arr);
  }
  function toggleAiGenerate(idx: number) {
    const arr = [...customBlocks];
    arr[idx] = { ...arr[idx], aiGenerate: !arr[idx].aiGenerate };
    setCustomBlocks(arr);
  }
  function changeRenderType(idx: number, renderType: RenderType) {
    if (renderType === 'dataview') {
      if (!window.confirm('导出 PDF/Word 时该块会降级为说明文字,继续?')) return;
    }
    const arr = [...customBlocks];
    arr[idx] = { ...arr[idx], renderType };
    setCustomBlocks(arr);
  }
  function deleteCustomBlock(idx: number) {
    if (!window.confirm('删除后该块及其内容将被移除,确定?')) return;
    const arr = [...customBlocks];
    arr.splice(idx, 1);
    setCustomBlocks(arr);
  }
  function addCustomBlock() {
    const name = window.prompt('新区块名:');
    if (!name) return;
    setCustomBlocks([
      ...customBlocks,
      { id: crypto.randomUUID(), name, aiGenerate: true, renderType: 'text', prompt: '' },
    ]);
  }
  function resetToDefault() {
    if (!window.confirm('将重置为默认模板,自定义内容丢失,确定?')) return;
    if (props.kind === 'daily') {
      setTemplate(createDefaultDailyTemplate());
    } else {
      setTemplate(createDefaultReportTemplate(props.kind));
    }
  }
  function handleSave() {
    props.onSave(template);
  }
  function handleCancel() {
    if (window.confirm('有未保存的修改,确定离开?')) {
      props.onCancel();
    }
  }

  // ... render UI
  // (完整 JSX 略,见 spec 第 2 节布局示意)
  return (
    <div className="template-editor-modal" role="dialog">
      <h2>{EDITOR_TITLES[props.kind]}</h2>
      {hasFixed && (
        <section>
          <h3>固定区块(不可删除)</h3>
          {fixedBlocks.map((b, idx) => (
            <div key={b.id} draggable onDragStart={() => handleDragStart('fixed', idx)} onDragOver={handleDragOver} onDrop={() => handleDrop('fixed', idx)}>
              <span>≡</span>
              <input value={b.displayName} onChange={(e) => {
                const arr = [...fixedBlocks];
                arr[idx] = { ...arr[idx], displayName: e.target.value };
                setFixedBlocks(arr);
              }} />
            </div>
          ))}
        </section>
      )}
      <section>
        <h3>自定义区块</h3>
        {customBlocks.map((b, idx) => (
          <div key={b.id} draggable onDragStart={() => handleDragStart('custom', idx)} onDragOver={handleDragOver} onDrop={() => handleDrop('custom', idx)}>
            <span>≡</span>
            <input value={b.name} onChange={(e) => renameCustomBlock(idx, e.target.value)} />
            <label><input type="checkbox" checked={b.aiGenerate} onChange={() => toggleAiGenerate(idx)} /> AI ✓</label>
            <select value={b.renderType} onChange={(e) => changeRenderType(idx, e.target.value as RenderType)}>
              {Object.entries(RENDER_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <button onClick={() => deleteCustomBlock(idx)}>删除</button>
          </div>
        ))}
        <button onClick={addCustomBlock}>+ 添加区块</button>
        <button onClick={onUploadClick}>📎 上传 .md/.txt 让 AI 识别</button>
      </section>
      <footer>
        <button onClick={resetToDefault}>恢复默认</button>
        <button onClick={handleCancel}>取消</button>
        <button onClick={handleSave}>保存</button>
      </footer>
    </div>
  );
}

const EDITOR_TITLES: Record<TemplateEditorKind, string> = {
  daily: '日报模板编辑器',
  personalWeekly: '个人周报模板编辑器',
  personalMonthly: '个人月报模板编辑器',
  externalWeekly: '对外周报模板编辑器',
  externalMonthly: '对外月报模板编辑器',
};

function cloneTemplate(t: DailyTemplate | ReportTemplate, kind: TemplateEditorKind): DailyTemplate | ReportTemplate {
  if (kind === 'daily') {
    const d = t as DailyTemplate;
    return {
      fixedBlocks: d.fixedBlocks.map((b) => ({ ...b })),
      customBlocks: d.customBlocks.map((b) => ({ ...b })),
    };
  }
  return { customBlocks: (t as ReportTemplate).customBlocks.map((b) => ({ ...b })) };
}
```

> **完整实现**应包含:
> - 改名行内编辑(回车保存,Esc 撤销 — 通过 `onKeyDown` 实现)
> - aiGenerate 关闭后,渲染类型下拉变灰(加 `disabled={!b.aiGenerate}`)
> - "上传 .md/.txt 让 AI 识别" 按钮触发 `TemplateRecognitionModal`
> - 样式用 `globals.css` 中的新 class
> - 拖拽视觉反馈(拖动时背景变蓝,跨组变红)
>
> 由于代码较长,plan 给出**骨架**,实际实现时按 spec 2.4 节交互规则补全。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T9: 模板编辑器弹窗 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/src/components/TemplateEditorModal.tsx app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(ui): add TemplateEditorModal (shared by 5 template kinds)"
```

---

## Task 10: AI 识别二级模态

**Files:**
- Create: `app/src/components/TemplateRecognitionModal.tsx`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T10 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T10: AI 识别二级模态
const recogModal = readFileSync(join(root, 'src/components/TemplateRecognitionModal.tsx'), 'utf8');
assert(recogModal.includes('export function TemplateRecognitionModal'), 'TemplateRecognitionModal 未导出');
assert(recogModal.includes('parseRecognizedBlocks'), '未引用 parseRecognizedBlocks');

console.log('T10: AI 识别二级模态 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `TemplateRecognitionModal 未导出`

- [ ] **Step 3: 实现**

创建 `app/src/components/TemplateRecognitionModal.tsx`:

```typescript
import { useState } from 'react';
import { parseRecognizedBlocks } from '../../shared/recognizeTemplateBlocks';
import type { CustomBlock } from '../../shared/aiReview/sectionConfig';

interface Props {
  onApply: (blocks: CustomBlock[], mode: 'replace' | 'append') => void;
  onCancel: () => void;
  language: 'zh-CN' | 'en-US';
  existingFixedNames?: string[]; // 用于重名冲突检测
}

export function TemplateRecognitionModal({ onApply, onCancel, language, existingFixedNames = [] }: Props) {
  const [text, setText] = useState('');
  const [recognized, setRecognized] = useState<{ blocks: CustomBlock[]; confidence: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRecognize() {
    setError(null);
    try {
      // 调用 LLM(通过 window.electronAPI.aiReview.recognizeTemplate(text))
      const rawResult = await (window as any).electronAPI.aiReview.recognizeTemplate(text);
      const result = parseRecognizedBlocks(rawResult, []);
      if (result.confidence === 'low') {
        setError('识别失败,请手动添加区块');
        return;
      }
      // 重名冲突检测
      const conflictNames = result.blocks.filter((b) => existingFixedNames.includes(b.name)).map((b) => b.name);
      if (conflictNames.length > 0) {
        if (!window.confirm(`识别到与固定区块重名的区块,已自动忽略: ${conflictNames.join(', ')}。继续?`)) {
          return;
        }
        result.blocks = result.blocks.filter((b) => !existingFixedNames.includes(b.name));
      }
      setRecognized({ blocks: result.blocks, confidence: result.confidence });
    } catch (e: any) {
      setError('识别失败,请手动添加区块');
    }
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setText(text);
  }

  return (
    <div className="template-recognition-modal" role="dialog">
      <h2>AI 识别模板</h2>
      <input type="file" accept=".md,.txt" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="或粘贴 Markdown 文本..." rows={12} />
      {error && <p className="error">{error}</p>}
      {recognized && (
        <div>
          <h3>识别结果({recognized.confidence})</h3>
          {recognized.blocks.map((b, idx) => (
            <div key={b.id}>
              <input value={b.name} onChange={(e) => {
                const arr = [...recognized.blocks];
                arr[idx] = { ...b, name: e.target.value };
                setRecognized({ ...recognized, blocks: arr });
              }} />
              <select value={b.renderType} onChange={(e) => {
                const arr = [...recognized.blocks];
                arr[idx] = { ...b, renderType: e.target.value as any };
                setRecognized({ ...recognized, blocks: arr });
              }}>
                <option value="text">纯文本</option>
                <option value="list">列表</option>
                <option value="table">表格</option>
                <option value="callout">Callout</option>
                <option value="dataview">Dataview</option>
              </select>
            </div>
          ))}
          <button onClick={() => onApply(recognized.blocks, 'replace')}>替换自定义区块</button>
          <button onClick={() => onApply(recognized.blocks, 'append')}>追加到自定义区块</button>
        </div>
      )}
      <footer>
        <button onClick={onCancel}>取消</button>
        {!recognized && <button onClick={handleRecognize} disabled={!text}>开始识别</button>}
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T10: AI 识别二级模态 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/src/components/TemplateRecognitionModal.tsx app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(ui): add TemplateRecognitionModal (upload/paste + preview + apply)"
```

---

## Task 11: 设置面板改造 — 4 区 + 两栏 + sticky 工具栏

**Files:**
- Modify: `app/src/components/SettingsPanel.tsx`
- Delete: `app/src/components/ObsidianTemplateCenter.tsx`(被 TemplateEditorModal 取代)
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T11 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T11: 设置面板结构
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
// 1. nav 6 个(无 AI Review)
assert(!settingsPanel.includes("title: 'AI Review'"), 'AI Review nav 仍存在(应删除)');
// 2. i18n 化 nav
assert(!/title:\s*['"]Personalization['"]/.test(settingsPanel), 'Personalization 仍是硬编码英文(应改 i18n)');
assert(!/title:\s*['"]Window['"]/.test(settingsPanel), 'Window 仍是硬编码英文');
assert(!/title:\s*['"]Obsidian Sync['"]/.test(settingsPanel), 'Obsidian Sync 仍是硬编码英文');
assert(!/title:\s*['"]Daily Rollover['"]/.test(settingsPanel), 'Daily Rollover 仍是硬编码英文');
assert(!/title:\s*['"]General['"]/.test(settingsPanel), 'General 仍是硬编码英文');
assert(!/title:\s*['"]Developer['"]/.test(settingsPanel), 'Developer 仍是硬编码英文');
// 3. 5 路径
assert(settingsPanel.includes('dailyPath'), '设置面板未显示 dailyPath');
assert(settingsPanel.includes('weeklyPath'), '设置面板未显示 weeklyPath');
assert(settingsPanel.includes('monthlyPath'), '设置面板未显示 monthlyPath');
assert(settingsPanel.includes('externalWeeklyPath'), '设置面板未显示 externalWeeklyPath');
assert(settingsPanel.includes('externalMonthlyPath'), '设置面板未显示 externalMonthlyPath');
// 4. 5 编辑模板入口
for (const kind of ['daily', 'personalWeekly', 'personalMonthly', 'externalWeekly', 'externalMonthly']) {
  assert(settingsPanel.includes(kind) || settingsPanel.includes(kind.charAt(0).toUpperCase() + kind.slice(1) + 'Template'), `设置面板未引用 ${kind} 模板`);
}
// 5. 4 套定时器
assert(settingsPanel.includes('externalWeeklyTimerEnabled'), '设置面板未显示对外周报定时');
assert(settingsPanel.includes('externalMonthlyTimerEnabled'), '设置面板未显示对外月报定时');
// 6. 5 个立即生成按钮
for (const btn of ['立即生成本人周报', '立即生成本人月报', '立即生成对外周报', '立即生成对外月报', '立即重新生成今日日报']) {
  assert(settingsPanel.includes(btn), `设置面板缺少按钮: ${btn}`);
}
// 7. 立即重生日报的二次确认
assert(/立即重新生成今日日报[\s\S]{0,500}confirm/i.test(settingsPanel), '立即重生日报未加二次确认');
// 8. sticky 工具栏
assert(settingsPanel.includes('sticky') || settingsPanel.includes('position: sticky'), '设置面板未实现 sticky 工具栏');
// 9. 高级日报设置已删除
assert(!settingsPanel.includes('高级日报设置'), '高级日报设置仍存在(应删除)');
// 10. ObsidianTemplateCenter 不再被引用
assert(!settingsPanel.includes('ObsidianTemplateCenter'), 'ObsidianTemplateCenter 仍被引用');

const obsCenter = existsSync(join(root, 'src/components/ObsidianTemplateCenter.tsx'));
assert(!obsCenter, 'ObsidianTemplateCenter.tsx 仍存在(应删除)');

console.log('T11: 设置面板改造 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `设置面板未显示 dailyPath`(因为还在用 dailyNotePath)

- [ ] **Step 3: 实施改造**

**改造 `app/src/components/SettingsPanel.tsx`** —— 这是本轮最大单点改动。**分多个子步骤**:

**子步骤 A:nav 改 i18n + 合并入口**

找到 `sectionEntries` 数组(原 7 项),改为:

```typescript
const sectionEntries = [
  { key: 'personalization', primary: true },
  { key: 'window', primary: true },
  { key: 'settings', primary: true },  // 新顶级入口(原 Obsidian Sync + AI 复盘)
  { key: 'rollover', primary: true },
  { key: 'general' },
  { key: 'developer' },
] as const;
```

title 和 description 从 `text.settings.sections[key]` 取(由 i18n 翻译)。

**子步骤 B:新增"设置"区 section(原 section === 'obsidian' 改造)**

把原 `section === 'obsidian'` 的整段重写为 4 个折叠子区:

```typescript
function SettingsSection({ language, text }: ...) {
  return (
    <>
      <ObsidianSyncArea language={language} text={text} ... />
      <TemplateArea language={language} text={text} ... />
      <AiConfigArea language={language} text={text} ... />
      <TimersArea language={language} text={text} ... />
    </>
  );
}
```

每个 Area 内部用 `<details>` 折叠(默认展开第一个),见 spec 4.2 布局。

**ObsidianSyncArea**:5 个路径输入框 + 2 个 toggle(同步删除/确认删除)。

**TemplateArea**:5 个 `<button>` 编辑模板入口(每个 click 打开 `<TemplateEditorModal kind={...}>`)。

**AiConfigArea**:2 行(模型下拉 + API Key 输入)。

**TimersArea**:4 个 toggle,每个展开后是时间/星期/几号输入。末尾 5 个立即生成按钮("立即重新生成今日日报"弹 `confirm("将覆盖今日 AI 块已有内容,确定?")`)。

**子步骤 C:删除 AI 复盘相关代码**

- 删除 `<AiReviewSection>` 整段(原 546-1219 行)及其所有引用
- 删除"高级日报设置"折叠区(原 ObsidianTemplateCenter 内部)
- 删除 `obsidian:recognize` / `obsidian:pickTemplateFile` 相关引用(改用新 IPC)

**子步骤 D:布局改两栏 + 顶部 sticky**

把 panel 根容器改为:

```tsx
<aside className="settings-panel">
  <header className="settings-toolbar">
    <button onClick={onBack}>← 返回上一级</button>
    <button onClick={onClose}>✕ 关闭</button>
  </header>
  <div className="settings-body">
    <nav className="settings-nav">
      {sectionEntries.map(...)}
    </nav>
    <main className="settings-content">
      {renderSection()}
    </main>
  </div>
</aside>
```

CSS:
```css
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
.settings-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
}
.settings-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.settings-nav {
  width: 200px;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}
.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}
```

**子步骤 E:删除 ObsidianTemplateCenter.tsx**

```bash
rm app/src/components/ObsidianTemplateCenter.tsx
```

确认 87eb43f commit 中没被其他地方引用后再删(若被引用,改为引用 `TemplateEditorModal`)。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T11: 设置面板改造 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/src/components/SettingsPanel.tsx app/src/components/ObsidianTemplateCenter.tsx app/src/styles/globals.css app/scripts/verify-template-hub-rewrite.ts
git commit -m "refactor(settings): merge obsidian+ai-review into settings, 2-col layout, sticky toolbar"
```

---

## Task 12: i18n 全量本地化

**Files:**
- Modify: `app/src/i18n.ts`
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T12 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T12: i18n 全量本地化
const i18n = readFileSync(join(root, 'src/i18n.ts'), 'utf8');
// 7 个 nav key 全部存在(中英)
for (const k of ['appearance', 'window', 'settings', 'rollover', 'general', 'developer']) {
  const re = new RegExp(`${k}:\\s*['"]`);
  assert(re.test(i18n), `i18n 缺少 ${k}`);
}
// 4 个 section heading
for (const k of ['obsidian', 'templates', 'ai', 'timers']) {
  const re = new RegExp(`section\\.${k}|\\.${k}:\\s*['"]`);
  assert(re.test(i18n), `i18n 缺少 settings.section.${k}`);
}
// 30+ 模板相关 key
for (const k of ['rename', 'delete', 'add', 'upload', 'reset', 'save', 'cancel', 'aiToggle']) {
  assert(i18n.includes(k), `i18n 缺少模板相关 key: ${k}`);
}
// 5 种 renderType label
for (const k of ['text', 'list', 'table', 'callout', 'dataview']) {
  assert(i18n.includes(`renderType.${k}`) || i18n.includes(`'${k}'`), `i18n 缺少 renderType.${k}`);
}
// 中英对称(检查 en 中关键 key 存在)
const enMatch = i18n.match(/const en: typeof zh = \{([\s\S]+?)\n\s*\};/);
assert(enMatch, 'en 对象未定义');
assert(enMatch[1].includes("'Appearance'") || enMatch[1].includes('Appearance'), 'en 缺少 Appearance');
assert(enMatch[1].includes("'Window'") || enMatch[1].includes('Window'), 'en 缺少 Window');
assert(enMatch[1].includes("'Settings'") || enMatch[1].includes('Settings'), 'en 缺少 Settings');

console.log('T12: i18n 全量本地化 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错 `i18n 缺少 settings`(因新 key 未加)

- [ ] **Step 3: 加 i18n key**

修改 `app/src/i18n.ts`,在 `zh.settings.sections` 加新 key,在 `zh` 对象加新 namespace,在 `en` 对象镜像添加。

按 spec 第 6 节 i18n 改造清单(约 50 个 key)**全部添加**。**完整 key 列表见 spec 第 6 节**,plan 不重复。

**重点新增**:
```typescript
// zh
settings: {
  sections: {
    personalization: ['外观', '外观、透明度、密度和动效。'],
    window: ['窗口', '窗口行为、置顶、自启动。'],
    settings: ['设置', 'Obsidian 同步、模板、AI 配置和自动生成。'],  // 新
    rollover: ['每日结转', '业务日期和任务结转规则。'],
    general: ['通用', '语言等低频偏好。'],
    developer: ['开发者', '高级模板、调试入口和代码结构说明。'],
  },
  // ...
  path: {
    daily: '日报路径',
    personalWeekly: '个人周报路径',
    personalMonthly: '个人月报路径',
    externalWeekly: '对外周报路径',
    externalMonthly: '对外月报路径',
  },
  template: {
    kind: {
      daily: '日报模板',
      personalWeekly: '个人周报模板',
      personalMonthly: '个人月报模板',
      externalWeekly: '对外周报模板',
      externalMonthly: '对外月报模板',
    },
    editor: {
      title: {
        daily: '日报模板编辑器',
        personalWeekly: '个人周报模板编辑器',
        // ...
      },
      fixedSection: '固定区块(不可删除)',
      customSection: '自定义区块',
      action: {
        rename: '改名', delete: '删除', add: '添加区块',
        upload: '上传 .md/.txt 让 AI 识别',
        reset: '恢复默认', save: '保存', cancel: '取消',
      },
      aiToggle: 'AI 生成',
      renderType: {
        text: '纯文本', list: '列表', table: '表格',
        callout: 'Callout 高亮块', dataview: 'Dataview 查询(实验性)',
      },
      confirm: {
        delete: '删除后该块及其内容将被移除,确定?',
        reset: '将重置为默认模板,自定义内容丢失,确定?',
        dirty: '有未保存的修改,确定离开?',
        dataview: '导出 PDF/Word 时该块会降级为说明文字,继续?',
      },
      recognition: {
        failed: '识别失败,请手动添加区块',
        unsupported: '仅支持 .md / .txt 格式',
      },
    },
  },
  timer: {
    personalWeekly: { enable: '开启个人周报' },
    personalMonthly: { enable: '开启个人月报' },
    externalWeekly: { enable: '开启对外周报' },
    externalMonthly: { enable: '开启对外月报' },
    weekday: '触发星期',
    dayOfMonth: '触发几号',
    time: '触发时间',
    anonymizeExternal: '对外脱敏',
    generateNow: {
      personalWeekly: '立即生成本人周报',
      personalMonthly: '立即生成本人月报',
      externalWeekly: '立即生成对外周报',
      externalMonthly: '立即生成对外月报',
      regenToday: '立即重新生成今日日报',
    },
  },
}
```

`en` 对象镜像添加。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T12: i18n 全量本地化 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/src/i18n.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(i18n): add 50+ keys for nav, settings sections, template editor, timers"
```

---

## Task 13: 主进程 IPC + 4 套定时器

**Files:**
- Modify: `app/electron/main.ts`
- Modify: `app/electron/preload.ts`
- Modify: `app/electron/aiReview/runner.ts`
- Modify: `app/electron/aiReview/timer.ts`(或 timer-scheduler)
- Test: `app/scripts/verify-template-hub-rewrite.ts` (T13 段)

- [ ] **Step 1: 写失败测试**

```typescript
// T13: IPC + 4 套定时器
const main = readFileSync(join(root, 'electron/main.ts'), 'utf8');
const preload = readFileSync(join(root, 'electron/preload.ts'), 'utf8');
const runner = readFileSync(join(root, 'electron/aiReview/runner.ts'), 'utf8');
const timer = readFileSync(join(root, 'electron/aiReview/timer.ts'), 'utf8');

// 4 套立即生成 IPC
for (const t of ['generatePersonalWeekly', 'generatePersonalMonthly', 'generateExternalWeekly', 'generateExternalMonthly', 'regenerateToday']) {
  assert(main.includes(t) || preload.includes(t), `未找到 IPC: ${t}`);
}
// 4 套定时器调度
for (const t of ['personalWeekly', 'personalMonthly', 'externalWeekly', 'externalMonthly']) {
  assert(timer.includes(t) || main.includes(t), `未找到定时器: ${t}`);
}
// runner 接受新 blocks 参数 + audience
assert(runner.includes('blocks:') || runner.includes('sections:') || runner.includes('CustomBlock'), 'runner 未接受块参数');
assert(runner.includes('audience'), 'runner 未接 audience');
// 立即重生日报的 force 参数
assert(runner.includes('force:') || /RunParams[\s\S]{0,500}force/.test(runner), 'runner 未支持 force');

console.log('T13: IPC + 4 套定时器 ✓');
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 报错

- [ ] **Step 3: 实施**

**修改 `app/electron/aiReview/runner.ts`**:

- `RunParams` 改为:

```typescript
export interface RunParams {
  filePath: string;
  date: string;
  tasks: StatTask[];
  blocks: CustomBlock[];        // 替换 sections
  callLlm: (...) => Promise<...>;
  force?: boolean;              // 立即重生时为 true,强制覆盖
  audience?: 'personal' | 'external';  // 本轮新增,决定是否脱敏
  anonymize?: boolean;          // 来自 settings.anonymizeExternalReports
}
```

- 主循环改为按 `blocks` 遍历,每个 `aiGenerate=true` 块调一次 LLM。
- 末尾,如果 `audience === 'external' && anonymize`,对生成的内容调 `lightAnonymize`。
- `force=true` 时,所有 `aiGenerate=true` 块都强制 `BlockAction.Overwrite`,即使 marker 内已有内容。

**修改 `app/electron/aiReview/timer.ts`(或 timer-scheduler.ts)**:

- 加 `getNextExternalWeeklyDelay(now, weekday, time)` 和 `getNextExternalMonthlyDelay(now, day, time)`(可参数化为 `getNextWeeklyDelay(now, weekday, time, audience)`)。
- 在 timer 调度循环中,注册 4 套(原来是 2 套):personalWeekly / personalMonthly / externalWeekly / externalMonthly。

**修改 `app/electron/main.ts`**:

- 添加 IPC handler:
  - `aiReview:generatePersonalWeekly(weekKey)`
  - `aiReview:generatePersonalMonthly(monthKey)`
  - `aiReview:generateExternalWeekly(weekKey)`(生成后跑 `lightAnonymize`)
  - `aiReview:generateExternalMonthly(monthKey)`(同上)
  - `aiReview:regenerateToday(date)`(用 `force=true` 重跑当日 runner)

- 删除老的 IPC(若有):`aiReview:generateWeekly` / `aiReview:generateMonthly` / `aiReview:generateExternalWeekly`(老版)等等。

**修改 `app/electron/preload.ts`**:

暴露新 IPC 给 renderer(在 `electronAPI.aiReview` 下加 5 个方法)。

- [ ] **Step 4: 跑测试确认通过**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: `T13: IPC + 4 套定时器 ✓`

- [ ] **Step 5: Commit**

```bash
git add app/electron/main.ts app/electron/preload.ts app/electron/aiReview/runner.ts app/electron/aiReview/timer.ts app/scripts/verify-template-hub-rewrite.ts
git commit -m "feat(electron): 4 timers + 5 IPCs (personal/external weekly/monthly + regen today)"
```

---

## Task 14: 端到端 smoke test

**Files:**
- Modify: `app/scripts/verify-template-hub-rewrite.ts` (T14 段,所有验证项汇总)
- Modify: `app/package.json`(添加 verify 脚本)

- [ ] **Step 1: 写失败测试**

```typescript
// T14: smoke test - 端到端流程
import { renderDailyTemplate } from '../shared/templateRenderer';
import { lightAnonymize } from '../shared/templateBlockDefaults';
import { collectDailySourcesForDates } from '../shared/aiReview/sourceMaterials';
import { parseRecognizedBlocks } from '../shared/recognizeTemplateBlocks';

// 1. 模板渲染
const dailyTpl = {
  fixedBlocks: [
    { id: 'work', displayName: '今日工作' },
    { id: 'inspire', displayName: '灵感随笔' },
    { id: 'tasks', displayName: '每日任务' },
  ],
  customBlocks: [
    { id: 'b1', name: '复盘', aiGenerate: true, renderType: 'text', prompt: '' },
    { id: 'b2', name: '明日待办', aiGenerate: true, renderType: 'list', prompt: '' },
  ],
};
const rendered = renderDailyTemplate({
  template: dailyTpl, work: '今日工作了 5h', inspiration: '想到 X', tasks: '- [x] A', date: '2026-06-11',
});
assert(rendered.includes('## 今日工作'), 'fixed block 未渲染');
assert(rendered.includes('## 复盘') && rendered.includes('DAILYTODO:REVIEW:START'), '复盘 block 未铺 marker');
assert(!rendered.includes('🤖'), '双份 bug 仍存在');

// 2. 切片
const sources = collectDailySourcesForDates({ dates: ['2026-06-10', '2026-06-11'], vaultPath: '/tmp', rules: [] });
assert(sources.sliceA.length > 0, 'sliceA 为空');
assert(sources.sliceB.length > 0, 'sliceB 为空');
assert(!sources.sliceA[0].content.includes('今日工作'), 'sliceA 不应含今日工作');

// 3. 脱敏
const sample = '张三 13800138000 zhang@example.com Apollo-X';
const redacted = lightAnonymize(sample);
assert(!redacted.includes('张三'), '姓名未脱敏');
assert(!redacted.includes('13800138000'), '手机未脱敏');

// 4. AI 识别
const md = `## 总结
- 完成 A
- 完成 B
## 计划
- [ ] 计划 X`;
const recog = parseRecognizedBlocks(md, []);
assert(recog.blocks.length === 2, `应识别 2 块,实际 ${recog.blocks.length}`);
assert(recog.blocks[0].renderType === 'list', `首块应为 list`);
assert(recog.blocks[1].renderType === 'list', `次块应为 list`);

// 5. 路径变量
const pt = await import('../shared/pathTemplate');
const d = new Date('2026-06-15T00:00:00Z');
assert(pt.expandPathTemplate('logs/daily/{{date}}.md', d) === 'logs/daily/2026-06-15.md', 'date 替换错误');
assert(/^logs\/weekly\/2026-W\d{2}\.md$/.test(pt.expandPathTemplate('logs/weekly/{{year}}-W{{week}}.md', d)), 'year/week 替换错误');

console.log('T14: smoke test ✓');
```

- [ ] **Step 2: 跑测试确认失败(新文件末尾追加 T14)**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: 跑完 T1-T13 后 T14 可能因为之前的改动有问题而失败

- [ ] **Step 3: 修复任何失败(若需要)**

根据实际输出修复。

- [ ] **Step 4: 加 package.json 脚本**

修改 `app/package.json`,在 `scripts` 加:

```json
"verify:template-hub-rewrite": "tsx scripts/verify-template-hub-rewrite.ts"
```

并加入 `verify:rc`(若存在的话)。

- [ ] **Step 5: 跑全部 verify**

Run: `npx tsx app/scripts/verify-template-hub-rewrite.ts`
Expected: T1-T14 全部 ✓

- [ ] **Step 6: 跑回归 verify**

Run: `npm run verify:rc`(或仓库中现有的 verify 入口)
Expected: 其他 verify 脚本全部通过(若有失败,可能是共享代码改动导致,需修)

- [ ] **Step 7: Commit**

```bash
git add app/scripts/verify-template-hub-rewrite.ts app/package.json
git commit -m "test(smoke): add e2e verify for template hub rewrite + package.json script"
```

---

## Self-Review

✅ **Spec coverage check:**
- T1 → §1.1 数据模型
- T2 → §1.4 路径变量
- T3 → §3.5 对外脱敏
- T4 → §3.1-3.2 双份 bug 修复 + 模板渲染层
- T5 → §1.1, §5 字段迁移
- T6 → §1.1 AiReviewSettings
- T7 → §2.4, §2.5 AI 识别
- T8 → §3.3-3.5 周月报生成 + 切片 + 脱敏
- T9 → §2 模板编辑器
- T10 → §2.4 item 7 AI 识别二级模态
- T11 → §4 设置页改造 + 两栏 + sticky
- T12 → §6 i18n
- T13 → §3.1, §4.2 IPC + 定时器
- T14 → §8 端到端验证

✅ **Placeholder scan:** T8-T11 的"完整实现"标注了"完整代码不重复 87eb43f"或"完整 JSX 略,见 spec",这些是 plan 级别的合理省略,工程师应参考 spec 实现。但避免了对 TDD 核心步骤的省略(每步都有 failing test + 实际代码 + 验证命令)。

✅ **Type consistency:**
- `CustomBlock` 在 T1 定义,T5/T6/T8/T9/T13 都用,字段名一致(id/name/aiGenerate/renderType/prompt)
- `RenderType` 在 T1 定义,T1/T7/T8/T9 都用,联合一致
- `TemplateEditorKind` 在 T9 定义,T9/T11 都用
- `DailyTemplate` / `ReportTemplate` 在 T1 定义,T1/T5/T9 都用
- `anonymizeExternalReports` 在 T6 定义,T8/T13 都引用

⚠️ **一处需提醒**:
T8 中"`buildWeeklyMessages` 内部"指明"完整代码实现约 50-80 行,**不要在此 plan 重复 87eb43f 的实现,只指明改动点**"。这是 plan 写法的妥协 — 工程师需要读 87eb43f 的现有实现,按指明的改动点修改。如果实现时发现改动超出预期(比如 `SectionConfig` 引用比预想多),需自行评估。

✅ **5 处无 spec 覆盖的风险已处理**:
- AI toggle 关闭后内容冻结(T8 promptBuilder 注释)
- 重名冲突(T10)
- 0 aiGenerate=true 块跳过 runner(T13 force + 跳过逻辑)
- 空 marker 格式精确(T4 注释)
- 切片归属关键词(T8 注释)

✅ **2 个未决项在 spec 已说**:
- backfillDays 简化方案(spec §10)
- 4 套 sourceMode 合并(spec §5)
