# DailyTodo AI 复盘过程诊断与 Obsidian 写入可靠性设计

## 背景

用户反馈 AI 复盘存在三类问题：

1. 希望知道每次生成实际使用了多少 token，但不同 provider 返回能力不一致。
2. 生成速度很慢，尤其对比官方 Minimax m3.0 页面时，不清楚慢在模型、网络、提示词、软件等待还是写入阶段。
3. 生成结束后偶尔提示“文件已被外部修改（同步/Obsidian），放弃写入避免冲突”，但 Obsidian 文件里又能看到生成内容，导致无法判断是完整写入、部分写入还是状态误报。

当前 AI 复盘更偏向最终成功/失败状态，缺少可见的过程阶段、耗时拆分、token usage 归一化和冲突后二次确认。此次设计目标是先让生成过程可解释、写入结果可确认，再基于真实数据优化速度。

## 目标

- 用详细过程阶段替代笼统的“生成中”。
- 显示每个阶段的状态、耗时和关键信息。
- 在 provider 返回 usage 时展示 input/output/total tokens。
- provider 不返回 usage 时明确显示“不支持/未返回”，不估算为真实 token。
- 区分 AI 生成失败、AI 已生成但写入失败、写入冲突、冲突但内容已完整存在、部分写入。
- 冲突后重新读取 Obsidian 文件，确认目标 AI 复盘块是否完整。
- 保持现有安全写入策略，不因为自动重试而覆盖 Obsidian 或同步软件的新内容。

## 非目标

- 本设计不强制改成完整流式生成 UI。
- 本设计不切换默认模型，也不把 provider 锁定到 Anthropic、OpenAI 或 Minimax。
- 本设计不自动覆盖外部修改过的 Obsidian 文件。
- 本设计不实现精确 token 预估；只展示 provider 实际返回的 usage，或展示输入规模提示。
- 本设计不重构整个 AI 复盘模板系统。

## 过程阶段设计

AI 复盘运行时展示一个阶段式过程面板。每个阶段包含：阶段名称、当前状态、开始时间、结束时间、耗时、补充说明。

阶段状态包括：

- `pending`：等待执行。
- `running`：正在执行。
- `success`：阶段完成。
- `warning`：阶段完成但有需要注意的信息。
- `failed`：阶段失败。
- `skipped`：阶段无需执行。

### 阶段 1：准备复盘材料

展示内容：

- 正在读取当天任务。
- 正在读取 Obsidian 日记。
- 正在识别已有 AI 复盘块。
- 判断哪些复盘块需要生成。

成功后显示：

- 任务数量。
- 待生成块数量。
- 已存在且无需生成的块数量。

### 阶段 2：构建提示词

展示内容：

- 正在套用复盘模板。
- 正在拼接任务、完成情况、历史内容和 source materials。
- 显示输入材料规模，例如字符数或 KB。

如果 provider 后续支持 token count，可在这里补充“预计输入 token”。在没有可靠 token count 前，只显示“材料大小”，避免把字符估算误当 token。

### 阶段 3：请求 AI

展示内容：

- provider。
- model。
- base URL 的安全摘要，例如只显示 host，不显示 API key。
- 请求已发送时间。
- 当前等待时长。
- timeout 设置。
- max output tokens 设置。

如果未来开启流式响应，补充显示“首次响应耗时”。当前如果仍是一次性响应，只显示“等待完整响应”。

### 阶段 4：接收生成结果

展示内容：

- 生成内容字符数。
- AI 请求总耗时。
- stop reason 或截断风险信息。
- token usage。

usage 归一化为：

- `inputTokens`
- `outputTokens`
- `totalTokens`
- `cacheReadTokens`
- `cacheWriteTokens`
- `source`

不同 provider 映射：

- OpenAI-compatible：读取 `usage.prompt_tokens`、`usage.completion_tokens`、`usage.total_tokens`。
- Anthropic：读取 `usage.input_tokens`、`usage.output_tokens`。
- Gemini：读取 `usageMetadata.promptTokenCount`、`usageMetadata.candidatesTokenCount`、`usageMetadata.totalTokenCount`。
- 其他或未返回：usage 显示为“服务未返回 token 用量”。

### 阶段 5：整理复盘块

展示内容：

- 检查生成内容是否为空。
- 检查内容是否可能被截断。
- 嵌入 AI marker 和 hash。
- 定位 Obsidian 日记中的目标写入位置。

如果内容为空或只有 usage 没有正文，应在这一阶段失败，并显示 provider 返回了无正文响应。

### 阶段 6：写入 Obsidian

展示内容：

- 写入前检查文件 size/mtime 是否和读取时一致。
- 执行安全写入。
- 写入后重新读取文件。
- 验证目标 AI block 是否完整存在。

这一阶段保持现有“不覆盖外部修改”的原则。只在确认文件未变化时写入；如果文件变化，不直接覆盖。

### 阶段 7：确认结果

展示最终状态，不再只有成功/失败两类。

最终状态包括：

- `completed`：AI 内容已生成，Obsidian 文件中目标复盘块完整存在。
- `completedWithExternalChange`：检测到外部修改，但重新读取后确认目标复盘块已经完整存在。
- `generatedButNotWritten`：AI 内容已生成，但因文件变化未写入。
- `partialWriteDetected`：重新读取后发现目标复盘块存在但 marker/hash 不完整。
- `providerFailed`：请求 AI 失败或超时。
- `contentInvalid`：AI 返回内容为空、格式无法整理或疑似截断。
- `writeFailed`：文件系统写入失败。

## Obsidian 冲突后二次确认

当写入前检查发现文件已被外部修改时，不立刻只返回失败。流程改为：

1. 重新读取当前 Obsidian 文件。
2. 用目标复盘块的 marker、hash 或可验证边界检查内容是否已经存在。
3. 如果目标块完整存在，返回 `completedWithExternalChange`。
4. 如果目标块不存在，返回 `generatedButNotWritten`，并允许用户重试。
5. 如果目标块存在但 marker/hash 不完整，返回 `partialWriteDetected`，提示用户检查或重试。

这样可以覆盖用户观察到的情况：界面提示失败，但文件里似乎已有内容。新的状态会明确告诉用户“已完整存在”还是“只是看到了一部分”。

## 用户界面设计

AI 复盘区域展示最近一次运行的过程面板。推荐文案示例：

- “准备复盘材料：已读取 12 个任务，发现 1 个复盘块需要生成，用时 120ms”
- “构建提示词：材料约 18KB，max output tokens 8192”
- “请求 AI：minimax / m3.0，已等待 18 秒”
- “接收生成结果：生成 3,240 字，用时 42 秒，total tokens 5,812”
- “写入 Obsidian：检测到文件变化，正在重新读取确认”
- “确认结果：复盘块已完整存在，本次视为成功”

失败文案示例：

- “AI 内容已生成，但写入前 Obsidian 文件发生变化，未自动覆盖。当前文件中未找到完整复盘块，可重试。”
- “AI 服务未返回 token 用量，只显示生成字数和耗时。”
- “AI 返回内容疑似被截断，请调高 max output tokens 或缩短模板内容。”

## 数据结构设计

新增一次运行的过程记录结构。第一版只在应用运行时保存最近一次结果，用于界面展示和排查；不写入 Obsidian 日记，不落盘保存完整 prompt 或 AI 输出。用户重新触发生成时，用新的 run 记录替换上一条。

建议结构：

```ts
interface AiReviewRunProgress {
  runId: string;
  startedAt: string;
  finishedAt?: string;
  provider: string;
  model: string;
  finalStatus?: AiReviewFinalStatus;
  stages: AiReviewStageProgress[];
  usage?: AiReviewTokenUsage;
}

interface AiReviewStageProgress {
  key: AiReviewStageKey;
  label: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'failed' | 'skipped';
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  message?: string;
  details?: Record<string, string | number | boolean>;
}

interface AiReviewTokenUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  source: 'provider' | 'not_returned';
}
```

过程记录只保存安全信息，不保存 API key，不保存完整 prompt，不保存完整 AI 输出正文。

## Minimax m3.0 速度分析策略

本设计不先假设慢的原因，而是通过过程阶段定位。

需要重点观察：

- 构建提示词后的材料大小是否远大于官方聊天输入。
- 请求 AI 阶段耗时是否占绝大多数。
- 是否一直等待完整响应，导致没有“首段响应”的体感速度。
- max output tokens 是否过高。
- provider/base URL 是否和官方页面实际链路不同。
- 写入或冲突确认是否在生成后额外耗时。

第一版先记录证据。只有确认慢点后，后续再决定是否引入流式响应、压缩 prompt、减少 source materials 或优化模板。

## 错误处理设计

- provider 请求失败：保留 provider 错误摘要，隐藏敏感 header 和 key。
- timeout：显示 timeout 设置和实际等待时长。
- usage 缺失：不视为失败，只显示“服务未返回 token 用量”。
- 文件变化：不覆盖，进入二次确认。
- 二次确认完整：视为成功但带 warning。
- 二次确认不完整：提示可重试，不自动覆盖。

## 验证计划

- 使用 OpenAI-compatible mock 响应返回 usage，确认 token 正确显示。
- 使用无 usage 响应，确认显示“服务未返回 token 用量”。
- 模拟 provider 超时，确认阶段停在“请求 AI”并显示实际等待时长。
- 模拟 AI 返回空正文，确认失败在“整理复盘块”。
- 模拟 Obsidian 文件未变化，确认正常写入并二次读取验证完整。
- 模拟写入前文件 mtime 变化但内容已包含完整目标块，确认最终状态为 `completedWithExternalChange`。
- 模拟写入前文件变化且目标块不存在，确认状态为 `generatedButNotWritten`。
- 模拟目标块存在但 marker/hash 不完整，确认状态为 `partialWriteDetected`。
- 在真实 Minimax m3.0 配置下运行一次，确认能看到 provider/model、等待时长、生成字数、usage 是否返回、写入验证结果。

## 实现边界

该设计只覆盖 AI 复盘过程诊断、token usage 展示和 Obsidian 写入结果确认。任务列表拖拽、删除按钮、完成弹窗设置将由其他独立设计处理。
