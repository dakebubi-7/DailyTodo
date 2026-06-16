# 实现计划 · AI 生成过程诊断面板（定位慢在哪里）

> 日期：2026-06-15  
> 前置功能：`2026-06-15-ai-review-report-profile-routing.md` 已完成，日报/个人周报/个人月报可分别选择账号。  
> 对应设计：`docs/superpowers/specs/2026-06-12-ai-review-diagnostics-write-safety-design.md`

## 目标

实现第一版“AI 生成过程诊断”，让用户在生成日报、个人周报、个人月报时能看到：

1. 本次生成是什么报告类型。
2. 实际使用了哪个 AI 账号、provider、model、base URL host。
3. 请求 AI 花了多久。
4. 是否因为输出上限被截断。
5. 生成失败是账号不可用、provider 失败、素材为空、内容无效、写入失败，还是写入成功。
6. 为后续优化“慢”提供数据依据，而不是猜测。

## 非目标 / 范围边界

1. 不实现 streaming 实时输出正文。
2. 不估算 token；只展示服务商真实返回的 usage。若没有 usage，显示“服务未返回 token 用量”。
3. 不改 Obsidian 安全写入语义，不允许覆盖外部修改。
4. 不做复杂历史持久化；第一版只把本次生成结果返回给 renderer 显示。
5. 不把完整 API Key 写入任何 result、progress、UI 或 Obsidian 文件。
6. 对外周报/月报可继续沿用旧结果结构；第一版诊断聚焦日报、个人周报、个人月报。

## 现状摘要

### LLM 调用

`app/shared/llm/openaiClient.ts` 当前：

```ts
export type LlmResult =
  | { ok: true; content: string; truncated?: boolean }
  | { ok: false; error: string };
```

已有能力：

- provider 自动识别
- OpenAI / Anthropic / Gemini 调用
- SSE 聚合
- 截断检测：
  - OpenAI `finish_reason === 'length'`
  - Anthropic `stop_reason === 'max_tokens'`
  - Gemini `finishReason === 'MAX_TOKENS'`

缺少：

- 请求耗时
- 实际命中的 provider/baseUrl（尤其 auto 模式候选）
- token usage

### 日报 runner

`app/electron/aiReview/runner.ts` 当前：

- `runReviewForFile(params)` 依次处理多个 review block。
- 每个 AI block 调用 `callLlm(messages)`。
- 失败时只把该 block skipped，不暴露具体失败原因。
- 最终返回：

```ts
{ ok, error?, filledMarkers, skippedMarkers }
```

缺少：

- block 级耗时
- provider 错误原因
- write 阶段耗时/状态

### 周/月报导出

`app/electron/aiReview/exportReports.ts` 当前：

- `generatePersonalWeekly`
- `generatePersonalMonthly`
- `generateExternalReport`

结果结构：

```ts
interface ReportResult {
  ok: boolean;
  filePath?: string;
  error?: string;
  truncated?: boolean;
}
```

周/月报比日报更适合第一版诊断，因为一次报告只调用一次 LLM。

### UI

`app/src/components/SettingsPanel.tsx` 当前：

- 手动生成按钮集中在 AI 复盘页。
- 只有 `generationStatus` 一行文字。
- 没有过程细节展示。

## 数据结构设计

新增共享诊断类型，建议放在新文件：

`app/shared/aiReview/runDiagnostics.ts`

```ts
export type AiReviewReportKind = 'daily' | 'weekly' | 'monthly';

export type AiReviewRunFinalStatus =
  | 'completed'
  | 'completedWithWarning'
  | 'generatedButNotWritten'
  | 'providerFailed'
  | 'contentInvalid'
  | 'writeFailed'
  | 'noSourceMaterials'
  | 'accountUnavailable';

export interface AiReviewTokenUsage {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  source: 'openai' | 'anthropic' | 'gemini' | 'missing';
}

export interface AiReviewProfileDiagnostic {
  profileId?: string;
  profileName?: string;
  profileSource?: 'specific' | 'default' | 'fallbackDefault' | 'missing';
  provider: string;
  model: string;
  baseUrlHost?: string;
}

export interface AiReviewStageDiagnostic {
  key:
    | 'prepareMaterials'
    | 'buildPrompt'
    | 'requestAi'
    | 'receiveResult'
    | 'writeObsidian'
    | 'confirmResult';
  label: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'warning';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  message?: string;
}

export interface AiReviewRunDiagnostic {
  runId: string;
  reportKind: AiReviewReportKind;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  finalStatus: AiReviewRunFinalStatus;
  profile: AiReviewProfileDiagnostic;
  stages: AiReviewStageDiagnostic[];
  usage?: AiReviewTokenUsage;
  truncated?: boolean;
  outputChars?: number;
  sourceChars?: number;
  error?: string;
  warning?: string;
}
```

注意：

- 不包含 `apiKey`。
- `baseUrlHost` 只取 hostname，不显示完整 URL query/path。
- `profileSource` 复用已实现的 report profile routing source。

## LLM usage / meta 扩展

在 `openaiClient.ts` 扩展成功结果：

```ts
export interface LlmDiagnostics {
  provider: LlmProvider;
  baseUrl: string;
  durationMs: number;
  usage?: AiReviewTokenUsage;
}

export type LlmResult =
  | { ok: true; content: string; truncated?: boolean; diagnostics?: LlmDiagnostics }
  | { ok: false; error: string; diagnostics?: Partial<LlmDiagnostics> };
```

### usage 提取规则

OpenAI-compatible：

```ts
usage.prompt_tokens
usage.completion_tokens
usage.total_tokens
```

Anthropic：

```ts
usage.input_tokens
usage.output_tokens
```

Gemini：

```ts
usageMetadata.promptTokenCount
usageMetadata.candidatesTokenCount
usageMetadata.totalTokenCount
```

如果缺失：

```ts
{ source: 'missing' }
```

### duration 规则

- 在 `callChatCompletionOnce` 内记录 `Date.now()` 起止。
- auto 模式下：
  - 成功结果带成功 candidate 的 provider/baseUrl/duration。
  - 失败汇总可不展开每个 candidate 到 UI，避免过长；保留现有错误文本。

## 主进程诊断构建

在 `app/electron/main.ts` 增加 helper：

```ts
function createReportDiagnosticContext(reportKind, resolution)
function finishDiagnostic(...)
function profileDiagnosticFromResolution(...)
```

并用一个小工具计时：

```ts
async function timedStage(stage, fn)
```

第一版不要做实时 push，只在生成完成后随 IPC result 返回。

### 日报

`runReviewForDate` 返回类型扩展为：

```ts
{
  ok: boolean;
  error?: string;
  filledMarkers: string[];
  skippedMarkers: string[];
  diagnostic?: AiReviewRunDiagnostic;
}
```

实现方式：

1. `prepareMaterials`：读取 file path、template/custom blocks 前后计时。
2. `requestAi`：runner 内可能有多个 block 调用。第一版可聚合：
   - 总 request duration = 所有 LLM 调用 duration 相加或外层耗时。
   - 若任一 LLM 失败，标记 warning/providerFailed，但兼容现有 skipped 行为。
3. `writeObsidian`：runner 当前内部写入，第一版可以在 `runReviewForFile` 外层整体计时，详细写入阶段后续再拆。

为了不大改 runner，第一版可在 `callLlm` wrapper 收集每次 LLM result 的 diagnostics，然后 `runReviewForDate` 组装总体 diagnostic。

### 个人周报 / 个人月报

最清晰，按阶段：

1. `prepareMaterials`：collect source materials + stats。
2. `buildPrompt`：`generatePersonalWeekly/Monthly` 内部 build messages，目前在函数内部。可选择：
   - 方案 A：保持内部 build，只把 requestAi/writeObsidian 作为外层大阶段。
   - 方案 B：把 build messages 从 exportReports 暴露出来，让 main 分阶段更精细。

第一版采用方案 A，减少侵入：

- `prepareMaterials` 在 main handler 内计时。
- `requestAi + writeObsidian` 由 wrapped `callLlm` 和整体 generate function 计时推导。
- `sourceChars` 从 collected sources 计算。

## IPC / Renderer 类型

更新 `app/src/vite-env.d.ts`：

- `runForDate` result 增加 `diagnostic?: AiReviewRunDiagnostic`
- `generateWeekly` / `generateMonthly` result 增加 `diagnostic?: AiReviewRunDiagnostic`

`preload.ts` 不需要变，因为 invoke 名称和参数不变。

## UI 设计

在 `SettingsPanel.tsx` 中：

1. 新增 state：

```ts
const [lastDiagnostic, setLastDiagnostic] = useState<AiReviewRunDiagnostic | null>(null);
```

2. `runGeneration` 成功/失败后：

```ts
setLastDiagnostic(result.diagnostic ?? null);
```

3. 在 `generationStatus` 下方新增诊断卡片：

显示内容：

- 报告类型：日报 / 个人周报 / 个人月报
- 实际账号：profileName
- 来源：指定 / 跟随当前 / 回退当前 / 缺失
- provider / model / baseUrlHost
- 总耗时：x.x 秒
- 请求 AI 耗时：x.x 秒
- 输出字符数
- token usage：
  - 有 usage：输入 / 输出 / 总计
  - 无 usage：服务未返回 token 用量
- 截断：如果 `truncated`，显示“可能被截断，请调高 max_tokens 或拆分生成”
- warning/error：显示非敏感文案

不显示：

- API Key
- 完整 baseUrl
- 完整 prompt
- 完整生成正文

## 验证计划

### 新增 verify 脚本

新增：

`app/scripts/verify-ai-run-diagnostics.ts`

覆盖：

1. `openaiClient` 能从 OpenAI response 提取 usage。
2. 能从 Anthropic response 提取 usage。
3. 能从 Gemini response 提取 usage。
4. 缺 usage 时 source 为 `missing`。
5. diagnostics 中不包含 API Key。
6. SettingsPanel 源码包含诊断 UI key：
   - `lastDiagnostic`
   - `requestAi`
   - `profileName`
   - `服务未返回 token 用量` 或 i18n key

### 更新现有 verify

- `verify-openai-client.ts`：补 usage/duration 断言。
- `verify-ai-settings.ts`：不必修改，除非新增 i18n key 检查。
- `package.json` 增加：

```json
"verify:ai-run-diagnostics": "tsx scripts/verify-ai-run-diagnostics.ts"
```

并加入 `verify:rc`。

### 需要运行

```bash
npm run verify:ai-run-diagnostics
npm run verify:openai-client
npm run verify:report-profile-routing
npm run verify:ai-settings
npm run verify:weekly
npm run verify:monthly
npm run typecheck
```

## 实施顺序

1. **共享类型**
   - 新增 `shared/aiReview/runDiagnostics.ts`。
2. **LLM diagnostics**
   - 扩展 `LlmResult`。
   - 增加 usage 提取 helper。
   - 成功/失败结果带 provider/baseUrl/duration/usage。
   - 更新 `verify-openai-client.ts`。
3. **主进程包装**
   - 在 report-kind caller 外层收集 LLM diagnostics。
   - 周报/月报 handler 组装 `AiReviewRunDiagnostic`。
   - 日报 handler 通过 wrapped `callLlm` 聚合 diagnostics。
4. **返回类型**
   - 更新 `vite-env.d.ts`。
5. **UI 展示**
   - SettingsPanel 增加 `lastDiagnostic` state。
   - generationStatus 下方增加诊断卡片。
   - i18n 增加中英文文案。
6. **验证**
   - 新增 `verify-ai-run-diagnostics.ts`。
   - 更新 package scripts。
   - 运行验证命令。

## 风险与缓解

1. **一次日报可能有多个 AI block**
   - 第一版聚合 LLM 耗时和 usage；不逐 block 展示。
2. **auto provider 会尝试多个候选**
   - UI 只展示最终成功 provider/baseUrlHost；失败时保留现有汇总错误。
3. **usage 字段各家格式不同**
   - 只解析明确字段；没有就显示 missing，不估算。
4. **诊断结构误带 Key**
   - 诊断 profile 只从 profile 提取 name/provider/model/baseUrlHost，不复制 apiKey。
5. **改动面较大**
   - 分阶段实现，先 LLM meta + 周/月报诊断，再日报聚合。

## 完成标准

- 手动生成日报、个人周报、个人月报后，设置页能看到本次诊断卡片。
- 卡片能显示实际账号、provider、model、baseUrl host、耗时、截断、usage 状态。
- 无 usage 时明确显示服务未返回 token 用量。
- API Key 不出现在 diagnostic、UI、错误文案或 Obsidian 输出中。
- 所有新增和既有关键验证通过。
