# DailyTodo AI 复盘 LLM 自动兼容设计

日期：2026-06-08

## 背景

当前 AI 复盘需要用户理解并正确配置 LLM 协议。用户在设置里填写 Base URL、API Key、模型名和协议后，主进程通过 `callChatCompletion` 直接构造请求。现有逻辑主要依赖 URL 字符串自动识别协议：Anthropic 官方地址走 Claude 原生协议，Gemini 官方地址走 Gemini 原生协议，其余默认走 OpenAI 兼容协议。

这对熟悉 API 的用户可用，但对小白用户不友好。典型失败包括：

- 中转站裸域名缺少 `/v1` 时返回 404。
- 中转站返回 SSE，但只有 `choices: []` 和 `usage`，没有正文，当前只提示“流式空内容”。
- 用户把 Claude Code 专用凭据或专用服务当作 Anthropic API 使用，返回官方客户端限制提示。
- 用户不知道应选择 OpenAI 兼容、Claude 原生、Gemini 原生，或 Base URL 应填到哪一级。

## 目标

让 AI 复盘配置尽量变成“小白一步到位”：用户只需要输入服务商或中转站给的 URL、API Key 和模型名，DailyTodo 尽可能自动判断可用调用方式。

成功标准：

1. `provider=auto` 时，不再只是按 URL 静态判断，而是能尝试多个常见协议和 URL 变体。
2. 对 OpenAI 兼容中转站，能自动处理裸域名、`/v1`、误填完整 `/chat/completions` 等常见 URL 形态。
3. 对流式和非流式响应都保持兼容，支持标准 OpenAI、Anthropic、Gemini 响应。
4. 对非标准中转站响应，尽量提取正文；如果无法提取，要给出小白能理解的诊断和建议。
5. 不破坏用户显式选择协议时的行为。用户选择 OpenAI 兼容、Claude 原生、Gemini 原生时，按该协议调用。
6. 不泄露 API Key。错误信息、日志、测试输出不得包含完整 Key。

## 非目标

- 不保证任何完全私有、无文档、无正文返回的服务都能成功生成。
- 不绕过服务商权限、账号限制或 Claude Code 官方客户端专用限制。
- 不在本次大改设置 UI 为完整向导；本次优先增强后端兼容和错误提示。
- 不自动裁剪 AI 复盘内容到任意长度；如果确认是上下文过长，本次只给出明确诊断，后续可单独做输入压缩/裁剪功能。

## 设计概览

在现有 LLM 客户端上增加一层自动兼容逻辑。显式协议仍走现有路径；自动协议走候选探测路径。

核心思路：

1. 根据用户输入生成一组候选调用方式。
2. 候选包含协议和规范化后的 Base URL。
3. 逐个尝试候选，直到成功返回正文。
4. 如果全部失败，汇总失败原因，输出最有用、最容易理解的错误。

建议拆分为三个职责：

- 请求构造：继续由 `buildRequest` 根据协议生成 URL、headers、body、parse、aggregate。
- 自动候选：新增 helper 生成 URL/协议候选。
- 错误诊断：新增 helper 把 404、401、usage-only SSE、Claude Code restricted 等错误归类为小白提示。

## 自动候选策略

当 `provider` 为 `auto` 时：

### URL 规范化

基于用户输入生成去重后的 Base URL 候选：

1. 原始 URL 去掉尾部斜杠。
2. 如果 URL 以 `/chat/completions` 结尾，截回上一级 base：
   - `https://host/v1/chat/completions` → `https://host/v1`
   - `https://host/chat/completions` → `https://host`
3. 如果 URL 没有明显 API 版本路径，追加 `/v1` 作为 OpenAI 兼容候选：
   - `https://host` → `https://host/v1`
4. 如果 URL 已是 `/v1`，不重复追加。
5. 保留 Anthropic/Gemini 官方地址的原生候选。

### 协议顺序

候选顺序以“最常见、最安全”为优先：

1. 如果 URL 明显是 Gemini 官方原生地址且不含 `/openai`，优先 Gemini 原生。
2. 如果 URL 明显是 Anthropic 官方地址，优先 Anthropic 原生。
3. 其余优先 OpenAI 兼容。
4. 对未知中转站，先尝试 OpenAI 兼容原始/修正 URL，再尝试原生协议候选。

这样符合多数中转站实际情况：绝大多数中转站宣称支持 GPT、Claude、Gemini 时，本质上仍是 OpenAI 兼容 `/chat/completions`。

## 响应解析增强

### OpenAI 非流式

继续支持：

- `choices[0].message.content` 字符串
- `choices[0].message.content` 分段数组

增强支持：

- `choices[0].text`
- 顶层 `content`
- 顶层 `text`
- 顶层 `response`
- 顶层 `output_text`

仅在这些字段为字符串或可拼接文本数组时使用，避免把对象误判为正文。

### OpenAI 流式 SSE

继续支持：

- `choices[0].delta.content`
- `choices[0].message.content`

增强支持：

- `choices[0].text`
- `delta.text`
- 顶层 `content`
- 顶层 `text`
- 顶层 `response`
- 顶层 `output_text`

如果 SSE 中所有事件都没有正文，但末段或任意段包含 `usage` 且 `choices` 为空，则归类为 `usage-only-stream`，不要只报“空内容”。

## 错误诊断

新增诊断文本，优先识别以下情况：

### 404 / not found

提示：

- 当前服务没有找到请求路径。
- OpenAI 兼容接口通常应填到 `/v1`，不要填完整 `/chat/completions`。
- DailyTodo 已自动尝试常见 URL 变体；如果仍失败，请检查中转站文档中的 Base URL。

### usage-only SSE

提示：

- 模型没有返回正文，只返回 token 用量统计。
- 如果 `prompt_tokens` 存在，展示本次输入约多少 tokens。
- 可能原因：模型不支持当前生成接口、模型名不可用、输入过长、中转站异常或余额/权限限制。
- 建议先用设置里的模型列表/短文本测试，再换模型或减少输入。

### Claude Code restricted

如果错误正文包含 “official Claude Code client only” 或类似限制提示，提示：

- 这是 Claude Code 官方客户端专用服务/凭据限制。
- DailyTodo 不能使用 Claude Code 专用登录态或专用服务。
- 请使用 Anthropic Console API Key，或使用支持 OpenAI 兼容协议的中转站 Key。

### 鉴权失败

对 401/403 提示：

- API Key 无效、无权限、余额不足或服务商限制。
- 确认 Key 属于当前 Base URL 对应服务商，不要混用官方 Key 和中转站 URL。

## 设置页行为

本次不重做 UI，但需要让现有设置更可靠：

- `自动识别` 的含义从“按 URL 猜协议”升级为“自动尝试常见协议和 URL 变体”。
- “获取模型列表”继续可用；如果模型列表接口不支持，不影响手动填写模型。
- 错误信息在设置页/生成失败处显示更友好的诊断。

后续可单独做“连接测试向导”：输入 URL 和 Key 后自动检测协议、拉模型、短 prompt 测试并保存成功配置。

## 数据流

1. 用户在设置中保存账号：Base URL、API Key、Model、Provider。
2. 主进程 `getLlmCaller` 读取当前激活账号。
3. 如果 Provider 是显式协议，调用现有单协议请求。
4. 如果 Provider 是 `auto`，调用自动兼容入口。
5. 自动兼容入口生成候选列表。
6. 每个候选调用请求构造和解析逻辑。
7. 成功返回正文后结束。
8. 全部失败则返回诊断后的错误。

## 测试计划

新增或扩展 `verify-openai-client.ts`，覆盖：

1. OpenAI 兼容：用户填裸域名时自动尝试 `/v1`。
2. OpenAI 兼容：用户填 `/v1` 时不重复追加。
3. OpenAI 兼容：用户误填 `/chat/completions` 时能截回 base。
4. OpenAI JSON 标准响应正常解析。
5. OpenAI SSE 标准响应正常聚合。
6. OpenAI SSE 非标准字段能提取正文。
7. OpenAI SSE 只有 `choices: [] + usage` 时返回友好诊断。
8. Anthropic 原生响应保持可用。
9. Gemini 原生响应保持可用。
10. Claude Code restricted 错误返回友好提示。
11. 404 错误提示 URL/path 检查建议。

## 风险与缓解

### 风险：自动尝试多个候选导致请求次数增加

缓解：仅 `provider=auto` 时启用；显式协议不变。候选数控制在少量常见组合内，成功即停止。

### 风险：非标准字段误判正文

缓解：只接受字符串或文本分段数组；不把任意对象 JSON stringify 成正文。

### 风险：错误信息过长

缓解：保留原始错误片段长度限制；诊断文本以主因和建议为主。

### 风险：中转站模型需要特殊参数

缓解：本次不尝试私有参数。错误中提示检查服务商文档或换 OpenAI 兼容模型。

## 实施边界

本次实现应聚焦：

- 自动候选生成。
- 自动协议尝试。
- 响应解析增强。
- 友好错误诊断。
- 验证脚本。

不做：

- 大型 UI 向导。
- 自动内容裁剪。
- 外部联网测试真实中转站。
- API Key 持久化格式大迁移。
