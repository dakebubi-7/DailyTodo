# 周报/月报：可配置路径 + 可编辑模板 + 认我的模板

**Goal:** 让用户在「设置 → AI 复盘」里：(1) 单独配置 4 个报告（个人周/月、对外周/月）的输出目录；(2) 编辑周报/月报的生成提示词（模板）；(3) 粘贴自己现成的周/月报格式让 AI 识别套用。全部留空 = 用现默认，行为不变。

**测试约定：** `app/scripts/verify-<name>.ts` + `node:assert`，注册进 `verify:rc`。纯函数 TDD（红→绿）。

---

## 现状（已确认）

- 4 个路径**写死**在 `app/electron/aiReview/exportReports.ts`：`logs/weekly-review`、`logs/monthly-review`、`exports/weekly-reports`、`exports/monthly-reports`。
- 周/月报 prompt **写死**在 `app/shared/aiReview/weekly.ts:26` 与 `monthly.ts:25`（各一句 system）。
- `buildWeeklyMessages`/`buildMonthlyMessages` 不接受外部 prompt。
- 日复盘段落已有「可编辑 prompt + 认我的模板」（`recognizeTemplate.ts`），周/月报没有。
- 设置存储：`aiReviewSettings`（key）；段落存 `aiReviewSections`。`normalizeAiReviewSettings` 是兜底入口。

---

## 设计总览

全部走**可选字段 + 留空回落默认**，保证向后兼容、不破坏既有测试。

### 数据：扩展 `AiReviewSettings`（app/shared/aiReview/aiReviewSettings.ts）

新增 6 个可选字段（默认空串 = 用内置默认）：

```ts
// 路径（相对 vault 根；空 = 默认）
weeklyDir: string;        // 默认 'logs/weekly-review'
monthlyDir: string;       // 默认 'logs/monthly-review'
externalWeeklyDir: string;// 默认 'exports/weekly-reports'
externalMonthlyDir: string;// 默认 'exports/monthly-reports'
// 模板（system prompt；空 = 用内置默认句）
weeklyPrompt: string;     // 默认 ''
monthlyPrompt: string;    // 默认 ''
```

`createDefaultAiReviewSettings` 里全给空串 `''`，`normalize` 里用 `typeof x === 'string' ? x : ''`（路径再做一道清洗：去首尾 `/`、禁止 `..` 防越权写出 vault）。导出一个常量供默认目录复用：

```ts
export const DEFAULT_REPORT_DIRS = {
  weekly: 'logs/weekly-review',
  monthly: 'logs/monthly-review',
  externalWeekly: 'exports/weekly-reports',
  externalMonthly: 'exports/monthly-reports',
} as const;
export function sanitizeRelDir(input: string, fallback: string): string; // 去 ../、去首尾斜杠、空→fallback
```

---

## Task 1: 设置 schema 扩展（路径 + 模板字段）

**Files:** `app/shared/aiReview/aiReviewSettings.ts`, `app/scripts/verify-ai-settings.ts`

- [ ] **红**：在 `verify-ai-settings.ts` 加断言：
  - `def.weeklyDir === ''`、`def.weeklyPrompt === ''` 等 6 个默认空。
  - `normalizeAiReviewSettings({ weeklyDir: '../etc', monthlyPrompt: 123 })` → `weeklyDir` 被清成 `''`（`..` 非法），`monthlyPrompt` → `''`（非字符串）。
  - 合法值保留：`{ weeklyDir: 'reports/wk', weeklyPrompt: '自定义' }` 原样保留（`weeklyDir` 去斜杠后为 `reports/wk`）。
  - 导出 `DEFAULT_REPORT_DIRS.weekly === 'logs/weekly-review'`。
  - `sanitizeRelDir('  /a/b/ ', 'fb') === 'a/b'`；`sanitizeRelDir('../x','fb')==='fb'`；`sanitizeRelDir('','fb')==='fb'`。
- [ ] **绿**：加字段、默认、normalize、`sanitizeRelDir`、`DEFAULT_REPORT_DIRS`。
- [ ] 跑 `verify:ai-settings` 通过。
- [ ] 同步：`AiOnboarding.tsx`/`SettingsPanel.tsx` 用 spread/factory，无需改；TS 不报错即可。

---

## Task 2: 报告 prompt 可覆盖（weekly/monthly 纯函数）

**Files:** `app/shared/aiReview/weekly.ts`, `app/shared/aiReview/monthly.ts`, `app/scripts/verify-weekly.ts`, `app/scripts/verify-monthly.ts`

- [ ] **红**：
  - `verify-weekly.ts`：`buildWeeklyMessages({..., systemPrompt: '我的周报格式'})` → `messages[0].content` 含「我的周报格式」；不传 systemPrompt → 仍含默认「你是周报助手」。
  - `verify-monthly.ts`：同理加 `systemPrompt` 断言。
- [ ] **绿**：
  - `WeeklyParams` 加可选 `systemPrompt?: string`；`buildWeeklyMessages` 里 `const system = params.systemPrompt?.trim() || '<默认句>'`。
  - `MonthlyParams` 同样处理。
  - 默认句保持不变（既有 user 段断言不受影响）。
- [ ] 跑 `verify:weekly`、`verify:monthly` 通过。

---

## Task 3: 报告路径可覆盖（exportReports I/O）

**Files:** `app/electron/aiReview/exportReports.ts`, `app/scripts/verify-export-reports.ts`

- [ ] **红**：在 `verify-export-reports.ts` 加：
  - `generatePersonalWeekly({..., relativeDir: 'custom/wk'})` → `filePath` 含 `custom/wk`，不含 `logs/weekly-review`。
  - 不传 `relativeDir` → 仍落 `logs/weekly-review`（现有断言保留）。
  - `generateExternalReport({..., relativeDir: 'out/ext'})` → 落 `out/ext`；不传 → 落 `exports/weekly-reports`。
- [ ] **绿**：
  - `WeeklyGenParams`/`MonthlyGenParams`/`ExternalGenParams` 各加可选 `relativeDir?: string`。
  - 拼路径处改为 `path.join(vaultPath, params.relativeDir || '<默认>', `${key}.md`)`。外部报告默认仍按 kind 选 `exports/weekly-reports|monthly-reports`。
- [ ] 跑 `verify:export-reports` 通过。

---

## Task 4: 主进程接线（把设置里的路径/模板传进生成）

**Files:** `app/electron/main.ts`（4 个 generate* handler）

- [ ] `generateWeekly`：读 `settings.weeklyDir`（空→`DEFAULT_REPORT_DIRS.weekly`，经 `sanitizeRelDir`）传 `relativeDir`；`systemPrompt: settings.weeklyPrompt` 传给 `buildWeeklyMessages`（注意：weekly 的 buildMessages 在 exportReports 内部调用——需把 `systemPrompt` 透传进 `generatePersonalWeekly`，再由它转给 `buildWeeklyMessages`；为此 `WeeklyGenParams` 也加 `systemPrompt?`）。
- [ ] `generateMonthly`：同理透传 `monthlyDir` + `monthlyPrompt`。
- [ ] `generateExternal`：weekly/monthly 分别用 `externalWeeklyDir`/`externalMonthlyDir`；对外报 prompt 复用 monthly 的 `buildMonthlyMessages`，systemPrompt 用对应（weekly→weeklyPrompt，monthly→monthlyPrompt）或专门字段——**MVP：对外报暂复用个人 prompt**，不新增字段，避免设置爆炸。
- [ ] `typecheck` 通过。

> 注：Task 3 让 exportReports 接 `relativeDir`；Task 2 让 build 接 `systemPrompt`。Task 4 把两者从 settings 喂进去。`generatePersonalWeekly` 需把 `systemPrompt` 并进它内部 `buildWeeklyMessages(params)` 调用——所以 `WeeklyGenParams extends WeeklyParams` 自动带上 `systemPrompt?`，无需额外改动（直接生效）。

---

## Task 5: 认报告模板（识别周/月报格式 → prompt）

**Files:** `app/shared/aiReview/recognizeReportTemplate.ts`（新）, `app/scripts/verify-recognize-report.ts`（新）, main.ts IPC, preload, vite-env.d.ts

复用「认我的模板」思路，但**产物是一段 system prompt 字符串**（不是 section 配置）。

- [ ] **红**：`verify-recognize-report.ts`：
  - `buildRecognizeReportMessages('## 本周亮点\n## 踩坑\n## 下周', 'weekly')` → user 段含粘贴内容、system 段要求「输出可直接做生成指令的 prompt」。
  - `parseRecognizedReportPrompt('```\n生成时请包含：亮点/踩坑/下周\n```')` → 去围栏 → 返回 `'生成时请包含：亮点/踩坑/下周'`。
  - 空/垃圾输入 → 返回 `''`（调用方回落默认）。
- [ ] **绿**：实现两个纯函数（`buildRecognizeReportMessages(raw, kind)`、`parseRecognizedReportPrompt(raw): string`）。
- [ ] IPC：`aiReview:recognizeReportTemplate` (kind, rawTemplate) → 调 LLM → `parseRecognizedReportPrompt` → `{ ok, prompt, error }`。
- [ ] preload + `vite-env.d.ts` 暴露 `recognizeReportTemplate(kind, raw)`。
- [ ] 跑 `verify:recognize-report` 通过。

---

## Task 6: 设置 UI（路径 4 框 + 模板 2 框 + 认模板）

**Files:** `app/src/components/SettingsPanel.tsx`, `app/src/i18n.ts`

在现有「生成报告」section 下方新增一块「报告输出与模板」：

- [ ] 4 个路径输入框（个人周/月、对外周/月），`placeholder` 显示默认目录，留空即默认；走 `updateSettings('weeklyDir', v)` 等。
- [ ] 2 个可折叠 prompt 框（周报模板、月报模板），同段落 prompt 的展开/收起交互；留空显示默认句作 placeholder。
- [ ] 每个模板框旁一个「认我的模板」：粘贴框 + 识别按钮 → 调 `recognizeReportTemplate(kind, draft)` → 成功则把返回 prompt 填进对应 `weeklyPrompt`/`monthlyPrompt`（可预览后确认）。复用已有 recognize UI 的 busy/status 模式。
- [ ] i18n：zh + en 加全部新文案（路径标签/提示、模板标签、认模板按钮/状态）。
- [ ] `typecheck` 通过。

---

## Task 7: 全量回归 + 提交

- [ ] `npm run typecheck`
- [ ] `npm run verify:rc`（含新增 `verify:recognize-report`，记得注册进 package.json 与 rc 链）
- [ ] `npm run build`
- [ ] 提交：`feat(ai-review): configurable report dirs + editable/recognizable report templates`

---

## 决策点（已与用户确认）

- 路径：**4 个全独立可设**（个人周/月、对外周/月）。
- 模板：**可编辑 prompt + 认我的模板**，周报/月报各一套。
- 对外报告的 prompt：MVP 复用个人 prompt（不为对外单列字段，避免设置项过多）。如后续要独立，再加 2 字段即可。

## 风险/兼容

- 所有新字段可选、默认空 → 旧 `aiReviewSettings` 自动升级，行为不变。
- 路径做 `..` 过滤，禁止写出 vault。
- 既有 4 个 verify 测试通过「不传新参 = 旧行为」保住。
