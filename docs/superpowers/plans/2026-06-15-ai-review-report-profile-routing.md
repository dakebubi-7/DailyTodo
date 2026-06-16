# 实现计划 · AI 日报/周报/月报按报告类型选择账号

> 日期：2026-06-15  
> 对应设计：`docs/superpowers/specs/2026-06-12-ai-review-diagnostics-write-safety-design.md`  
> 本计划优先实现用户已确认的方案 A：**日报、个人周报、个人月报分别选择 AI 账号/API Key**。

## 目标

1. 在 AI 复盘设置中新增 3 个报告类型账号选择：
   - 日报使用账号
   - 个人周报使用账号
   - 个人月报使用账号
2. 每个选择项支持：
   - 跟随当前默认账号（不存具体账号 id）
   - 指定某个已保存的 AI profile
3. 日报、个人周报、个人月报生成时按报告类型解析账号：
   - 先用对应报告类型指定账号
   - 未指定则用 `activeProfileId`
   - 指定账号失效/删除/无 Key 时回退默认账号
   - 默认账号也不可用时失败，并给出不泄露 Key 的错误
4. 保持现有账号体系不破坏：
   - API Key 仍只保存在 `profiles[].apiKey`
   - 路由字段只保存 profile id
   - 识别模板、列模型、对外报告等未纳入本次路由范围的功能继续使用当前默认账号
5. 为后续“慢在哪里”的诊断打基础：先让不同报告类型能切换到更快/更适合的模型账号；完整分阶段进度面板和 token usage 诊断可在下一步实现。

## 非目标 / 范围边界

1. 不实现“每个自定义 AI block 单独选择 Key”。设计文档已明确第一版只按日报、周报、月报路由。
2. 不把完整 API Key 写入 UI 文案、运行结果、Obsidian 文件或诊断结构。
3. 不在本次把对外周报/对外月报纳入新路由。它们继续走当前默认账号，除非后续单独确认需要扩展。
4. 不在本次实现完整过程诊断面板、token usage 展示、streaming 输出或 Obsidian 写入冲突分类；这些属于设计中的下一阶段。

## 现状摘要

### 现有账号数据

`app/shared/aiReview/aiReviewSettings.ts` 中已有：

- `AiProfile`：保存 `id/name/provider/baseUrl/apiKey/model/timeoutSeconds/maxTokens/note`
- `AiReviewSettings.profiles`
- `AiReviewSettings.activeProfileId`
- `resolveActiveProfile(settings)`：当前所有 AI 调用共同使用的默认账号解析器

当前 `normalizeAiReviewSettings` 会：

- 有显式 `profiles`：保留并修正坏的 `activeProfileId` 到第一个 profile
- 没有 `profiles`：把旧版顶层配置迁移为一个默认 profile

### 现有生成入口

`app/electron/main.ts` 当前核心问题：

```ts
function getLlmCaller() {
  const s = getAiReviewSettings();
  const p = resolveActiveProfile(s);
  return (messages) => callChatCompletion(...p...);
}
```

因此以下入口都只走当前默认账号：

- `runReviewForDate(...)` / `aiReview:runForDate`：日报
- `aiReview:generateWeekly`：个人周报
- `aiReview:generateMonthly`：个人月报
- `aiReview:generateExternal`：对外周/月报
- 模板识别、报告模板识别、Obsidian 模板识别

本次只改前三类个人报告入口。

### 现有设置 UI

`app/src/components/SettingsPanel.tsx`：

- `AiAccountZone` 负责当前账号下拉 + 管理账号弹窗
- AI 复盘页在 `section === 'aiReview'` 下渲染：
  - 启用 AI 复盘
  - `AiAccountZone`
  - 手动生成
  - 周报/月报数据精度
  - 超时与定时配置

账号路由 UI 适合放在 `AiAccountZone` 下方、手动生成上方，作为“报告使用账号”小节。

## 数据结构设计

### 1. 扩展 `AiReviewSettings`

在 `AiReviewSettings` 中新增 3 个可选字段：

```ts
export interface AiReviewSettings {
  // ...existing fields
  dailyReviewProfileId?: string;
  weeklyReportProfileId?: string;
  monthlyReportProfileId?: string;
}
```

含义：

- `undefined` / `''`：跟随当前默认账号 `activeProfileId`
- 非空字符串：指定 profile id

### 2. 默认值

`createDefaultAiReviewSettings()` 增加：

```ts
dailyReviewProfileId: '',
weeklyReportProfileId: '',
monthlyReportProfileId: '',
```

选择空字符串而不是 `undefined`，方便 `<select value>` 和持久化一致。

### 3. normalize 行为

`normalizeAiReviewSettings(value)` 中新增归一化：

- 如果字段不是字符串 → `''`
- 如果字段是 `''` → 保留，表示跟随默认账号
- 如果字段是已存在 profile id → 保留
- 如果字段指向不存在 profile → 建议保留原字符串还是清空？

本计划采用：**保留字符串，不在 normalize 阶段清空**。

理由：

- normalize 只负责形状修正，不负责业务路由告警。
- 运行时解析器能识别 `missing`，回退默认账号并产生可测试的 source/warning。
- 如果用户后来恢复同 id 的 profile，设置可自动恢复。

但 UI 层 `<select>` 若当前 id 不在 profiles 内，需要显示为“已失效，生成时会回退默认账号”或让 value 回到空。为保持第一版简单，UI 可通过 hint 展示警告，保存时不主动删除。

## 路由解析器设计

在 `app/shared/aiReview/aiReviewSettings.ts` 中新增类型与函数：

```ts
export type AiReviewReportKind = 'daily' | 'weekly' | 'monthly';

export type AiReviewProfileSource =
  | 'specific'
  | 'default'
  | 'fallbackDefault'
  | 'missing';

export interface AiReviewProfileResolution {
  reportKind: AiReviewReportKind;
  profile: AiProfile;
  source: AiReviewProfileSource;
  requestedProfileId?: string;
  warning?: string;
}

export function resolveProfileForReportKind(
  settings: AiReviewSettings,
  reportKind: AiReviewReportKind,
): AiReviewProfileResolution;
```

### 解析规则

1. 根据 `reportKind` 取字段：
   - `daily` → `dailyReviewProfileId`
   - `weekly` → `weeklyReportProfileId`
   - `monthly` → `monthlyReportProfileId`
2. 如果该字段为空：
   - 返回 `resolveActiveProfile(settings)`
   - `source: 'default'`
3. 如果该字段命中 profile 且 `apiKey.trim()` 非空：
   - 返回该 profile
   - `source: 'specific'`
4. 如果该字段命中 profile 但 Key 为空：
   - 尝试默认账号 `resolveActiveProfile(settings)`
   - 默认账号有 Key：返回默认账号，`source: 'fallbackDefault'`，warning 说明指定账号缺少 Key
   - 默认账号也无 Key：返回指定 profile 或默认 profile 均可，但生成前必须判定无可用 Key并失败；建议返回指定 profile 且 `source: 'missing'`
5. 如果该字段不命中任何 profile：
   - 尝试默认账号
   - 默认账号有 Key：返回默认账号，`source: 'fallbackDefault'`，warning 说明指定账号不存在
   - 默认账号也无 Key：返回默认账号，`source: 'missing'`

### Key 可用性 helper

新增内部 helper：

```ts
function hasUsableApiKey(profile: AiProfile): boolean {
  return Boolean(profile.apiKey.trim());
}
```

该 helper 不导出也可以；若 verify 需要可通过路由结果间接测试。

## 主进程调用改造

### 1. 保留现有 `getLlmCaller()`

保留给这些非报告路由功能使用：

- 模板识别
- 报告模板识别
- Obsidian 模板识别
- listModels（本来按传入 cfg）
- 对外报告（本次不扩展）

### 2. 新增 report-kind caller

在 `app/electron/main.ts` 中新增：

```ts
function getLlmCallerForReportKind(reportKind: AiReviewReportKind) {
  const s = getAiReviewSettings();
  const resolution = resolveProfileForReportKind(s, reportKind);
  const p = resolution.profile;
  return {
    resolution,
    callLlm: (messages: ChatMessage[]) =>
      callChatCompletion(
        { baseUrl: p.baseUrl, apiKey: p.apiKey, model: p.model, maxTokens: p.maxTokens },
        messages,
        { timeoutMs: p.timeoutSeconds * 1000, provider: p.provider },
      ),
  };
}
```

### 3. 生成前检查

为避免重复逻辑，新增 helper：

```ts
function ensureReportLlmAvailable(reportKind: AiReviewReportKind):
  | { ok: true; callLlm: (messages: ChatMessage[]) => Promise<LlmResult>; resolution: AiReviewProfileResolution }
  | { ok: false; error: string; resolution?: AiReviewProfileResolution };
```

规则：

- `settings.enabled === false` → 失败：`AI 复盘未启用`
- 解析到的 profile 无 Key → 失败：`AI 复盘缺少可用账号 Key，请在设置中选择账号或填写 API Key`
- 成功则返回 caller + resolution

错误信息不包含 API Key，不包含 baseUrl 完整敏感参数。

### 4. 替换三个入口

#### 日报

`runReviewForDate(date, tasks)` 改为：

- 使用 `ensureReportLlmAvailable('daily')`
- 失败时返回原 shape：`{ ok: false, error, filledMarkers: [], skippedMarkers: [] }`
- 成功时传 `callLlm` 给 `runReviewForFile`

#### 个人周报

`aiReview:generateWeekly` 改为：

- 使用 `ensureReportLlmAvailable('weekly')`
- 失败返回 `{ ok: false, error }`
- 成功传 `callLlm` 给 `generatePersonalWeekly`

#### 个人月报

`aiReview:generateMonthly` 改为：

- 使用 `ensureReportLlmAvailable('monthly')`
- 失败返回 `{ ok: false, error }`
- 成功传 `callLlm` 给 `generatePersonalMonthly`

### 5. 暂不改对外报告

`aiReview:generateExternal` 继续使用：

```ts
resolveActiveProfile(settings)
getLlmCaller()
```

并在代码注释中说明：对外报告路由不在本次范围。

## UI 改造

### 1. i18n 文案

在 `app/src/i18n.ts` 的 `settings.aiReview` 中英文各新增：

中文建议：

```ts
reportAccountRouting: '报告使用账号',
reportAccountRoutingHint: '可让日报、周报、月报分别使用不同账号；留空则跟随当前账号。',
dailyReviewAccount: '日报账号',
weeklyReportAccount: '周报账号',
monthlyReportAccount: '月报账号',
followCurrentAccount: '跟随当前账号',
profileMissingFallback: '指定账号不存在或缺少 Key，生成时会回退当前账号。',
```

英文建议：

```ts
reportAccountRouting: 'Report accounts',
reportAccountRoutingHint: 'Use different accounts for daily, weekly, and monthly reports. Leave empty to follow the current account.',
dailyReviewAccount: 'Daily account',
weeklyReportAccount: 'Weekly account',
monthlyReportAccount: 'Monthly account',
followCurrentAccount: 'Follow current account',
profileMissingFallback: 'The selected account is missing or has no key; generation will fall back to the current account.',
```

### 2. SettingsPanel 插入小节

在 `section === 'aiReview'` 中，`<AiAccountZone ... />` 后、手动生成前插入：

```tsx
<ReportAccountRoutingSection
  text={text.aiReview}
  settings={aiReviewSettings}
  profiles={aiReviewSettings.profiles ?? []}
  onUpdate={updateAiReview}
/>
```

也可以先内联，不必拆独立文件；但为了清晰，建议在 `SettingsPanel.tsx` 内新增小组件。

### 3. 小组件行为

`ReportAccountRoutingSection` 渲染 3 个 `<select>`：

- `value={settings.dailyReviewProfileId ?? ''}`
- `value={settings.weeklyReportProfileId ?? ''}`
- `value={settings.monthlyReportProfileId ?? ''}`

每个 select 的 options：

```tsx
<option value="">{text.followCurrentAccount}</option>
{profiles.map((profile) => (
  <option key={profile.id} value={profile.id}>
    {profile.name || profile.model || profile.id}
  </option>
))}
```

保存：

```tsx
onChange={(event) => onUpdate('dailyReviewProfileId', event.target.value)}
```

若当前字段非空但在 profiles 中找不到，显示一条小提示，不显示 Key。

### 4. 删除账号时的行为

当前 `AiAccountManager.onDelete` 会删除 profile 并更新 `activeProfileId`，不会清理新增的报告路由字段。

本计划保持：**不主动清空路由字段**，运行时按 fallback 处理。

理由：

- 简化实现，避免删除账号时同时修改多个隐式字段造成意外。
- 能让用户看到“指定账号失效”的状态。
- 与设计的 fallbackDefault/missing 语义一致。

如果 UI 手感不佳，后续可在删除账号时同步清空指向该 id 的报告路由字段。

## 验证计划

### 1. 新增 verify 脚本

新增 `app/scripts/verify-report-profile-routing.ts`。

覆盖：

1. 默认设置中 3 个路由字段为空。
2. normalize 保留合法路由字段。
3. `dailyReviewProfileId` 命中 `p-daily` 时，`resolveProfileForReportKind(settings, 'daily')` 返回 `p-daily`，`source === 'specific'`。
4. `weeklyReportProfileId` 为空时，周报返回 active profile，`source === 'default'`。
5. `monthlyReportProfileId` 指向不存在 id，active 有 Key 时，返回 active，`source === 'fallbackDefault'`，有 warning。
6. 指定 profile 存在但 `apiKey === ''`，active 有 Key 时，fallback 到 active。
7. 指定 profile 和 active 都无 Key 时，`source === 'missing'` 或返回结果可让主进程失败；断言 warning/error 不包含任何实际 Key。
8. 路由结果中不复制/新增 API Key 字段；只返回 profile 对象本身，UI/诊断不能持久化 Key。

### 2. 更新现有 verify

更新 `app/scripts/verify-ai-settings.ts`：

- 断言默认路由字段为空
- 断言 normalize 后字段保留
- 断言 SettingsPanel 源码包含：
  - `dailyReviewProfileId`
  - `weeklyReportProfileId`
  - `monthlyReportProfileId`
  - `followCurrentAccount` 或对应文案 key

更新 `app/package.json`：

```json
"verify:report-profile-routing": "tsx scripts/verify-report-profile-routing.ts"
```

如存在聚合验证脚本或 `verify:rc`，把新脚本加入；若没有，仅新增脚本并在本次验证命令中显式运行。

### 3. 类型检查

运行：

```bash
cd app
npm run verify:report-profile-routing
npm run verify:ai-settings
npm run verify:profile-ops
npm run typecheck
```

可选回归：

```bash
npm run verify:weekly
npm run verify:monthly
```

### 4. 手测清单

1. 准备 3 个账号：Daily / Weekly / Monthly，填不同 model 或 baseUrl。
2. 设置页：日报选择 Daily，周报选择 Weekly，月报选择 Monthly。
3. 点击手动生成日报/周报/月报，确认主进程使用对应账号。
   - 第一版没有过程面板，可通过临时受控 fake profile 或断点/日志验证；不要打印 API Key。
4. 把周报设置为“跟随当前账号”，切换当前账号后周报应走新的 active profile。
5. 删除月报指定账号后，月报生成应回退当前账号；如果当前账号无 Key，应失败并提示填写 Key。
6. 检查 Obsidian 输出中没有 API Key。

## 实施顺序（TDD）

1. **RED：写路由纯函数测试**
   - 新增 `verify-report-profile-routing.ts`
   - 先引用尚未实现的 `resolveProfileForReportKind`，确认失败。
2. **GREEN：实现 settings 类型、默认值、normalize、resolver**
   - 修改 `AiReviewSettings`
   - 修改 `createDefaultAiReviewSettings`
   - 修改 `normalizeAiReviewSettings`
   - 新增 `AiReviewReportKind / AiReviewProfileSource / AiReviewProfileResolution / resolveProfileForReportKind`
   - 跑新 verify 通过。
3. **主进程接入**
   - 修改 import：引入新类型/函数
   - 新增 `getLlmCallerForReportKind` 或 `ensureReportLlmAvailable`
   - 替换日报、个人周报、个人月报入口
   - 保留对外报告和模板识别使用 `getLlmCaller()`。
4. **UI 接入**
   - 增加 i18n 文案
   - 在 `SettingsPanel.tsx` 增加报告账号路由小节
   - 保存字段走现有 `updateAiReview`
   - 失效账号显示非敏感提示。
5. **验证脚本更新**
   - 更新 `verify-ai-settings.ts`
   - 更新 `package.json`
6. **最终验证**
   - `npm run verify:report-profile-routing`
   - `npm run verify:ai-settings`
   - `npm run verify:profile-ops`
   - `npm run verify:weekly`
   - `npm run verify:monthly`
   - `npm run typecheck`

## 风险与缓解

1. **normalize 清理失效 id 可能导致用户选择丢失**
   - 缓解：normalize 保留字符串，运行时 fallback。
2. **删除 profile 后 UI select value 不在 options 中**
   - 缓解：检测 missing 并显示提示；如 React select 显示异常，可额外插入 disabled option：`已失效账号：xxx`。
3. **错误信息泄露 API Key**
   - 缓解：所有 error/warning 手写固定文案，只包含报告类型、账号名称/provider/model/baseUrl host（若需要），不拼接 `apiKey`。
4. **对外报告用户以为也会切换账号**
   - 缓解：UI 文案明确“日报、个人周报、个人月报”；对外报告后续可单独扩展。
5. **现有 result type 未包含实际账号信息，用户难以确认走哪个账号**
   - 缓解：本次先通过 verify/代码路径保证；后续实现诊断面板时把 `profileName/source/provider/model/baseUrlHost` 加入非敏感进度信息。

## 完成标准

- 设置中能分别选择日报、个人周报、个人月报账号。
- 未选择时完全保持旧行为：跟随当前账号。
- 三个个人报告生成入口使用对应账号。
- 指定账号失效/无 Key 时能安全回退或失败。
- API Key 不出现在 UI 提示、错误、Obsidian 输出或新增持久化字段中。
- 新增和既有 verify/typecheck 通过。
