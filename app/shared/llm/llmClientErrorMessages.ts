import { isObjectRecord } from './llmProviderResponseParsing';
import type { ChatTransportErrorFormatters, ModelTransportErrorFormatters } from './llmClientTransport';

function usageOnlyStreamError(events: unknown[]): string {
  const eventWithUsage = events.find((event) => isObjectRecord(event) && isObjectRecord(event.usage));
  const record = isObjectRecord(eventWithUsage) ? eventWithUsage : {};
  const withUsage = isObjectRecord(record.usage) ? record.usage : {};
  const promptTokens = Number.isFinite(Number(withUsage.prompt_tokens)) ? Number(withUsage.prompt_tokens) : undefined;
  const promptLine = promptTokens ? `本次输入约 ${promptTokens} tokens。` : '服务商没有返回可用正文。';
  return [
    `模型没有返回正文，只返回了 token 用量统计。${promptLine}`,
    '可能原因：模型不支持当前生成接口、模型名不可用、输入过长、中转站异常，或账号余额/权限限制。',
    '建议先用设置里的模型列表或短文本测试；如果短文本可以，再换长上下文模型或减少复盘输入内容。',
  ].join('\n');
}

function diagnoseHttpError(status: number, body: string): string {
  const snippet = body.slice(0, 200);
  const lower = body.toLowerCase();

  if (lower.includes('official claude code client only')) {
    return [
      '这个服务或凭据看起来是 Claude Code 官方客户端专用，不能在 DailyTodo 这类第三方应用中直接使用。',
      '请使用 Anthropic Console 创建的 API Key，或使用支持 OpenAI 兼容协议的中转站 Key。',
      `原始返回 ${status}：${snippet}`,
    ].join('\n');
  }

  if (status === 404 || lower.includes('not found')) {
    return [
      'LLM 接口没有找到请求路径。',
      '如果这是 OpenAI 兼容或中转站接口，Base URL 通常需要填到 /v1，不要填完整的 /chat/completions。',
      'DailyTodo 的自动识别会尝试常见 URL 变体；如果仍失败，请检查中转站文档里的 Base URL。',
      `原始返回 ${status}：${snippet}`,
    ].join('\n');
  }

  if (status === 401 || status === 403) {
    return [
      'LLM 鉴权失败：API Key 无效、无权限、余额不足，或当前服务限制了访问。',
      '请确认 Key 属于当前 Base URL 对应的服务商，不要混用官方 Key 和中转站 URL。',
      `原始返回 ${status}：${snippet}`,
    ].join('\n');
  }

  return `LLM 返回 ${status}：${snippet}`;
}

export function summarizeAutoErrors(errors: string[]): string {
  const joined = errors.join('\n---\n');
  if (joined.includes('只返回了 token 用量统计')) {
    return joined.split('\n---\n').find((error) => error.includes('只返回了 token 用量统计')) ?? joined.slice(0, 1200);
  }
  if (joined.includes('Claude Code 官方客户端专用')) {
    return joined.split('\n---\n').find((error) => error.includes('Claude Code 官方客户端专用')) ?? joined.slice(0, 1200);
  }
  if (joined.includes('没有找到请求路径')) {
    return [
      '自动识别已尝试常见协议和 URL 变体，但都没有成功。',
      '主要失败原因：LLM 接口没有找到请求路径。请检查中转站文档里的 Base URL，通常应填到 /v1。',
      '尝试记录：',
      joined.slice(0, 1200),
    ].join('\n');
  }
  if (joined.includes('空内容')) {
    return joined.split('\n---\n').find((error) => error.includes('空内容')) ?? joined.slice(0, 1200);
  }
  return [
    '自动识别已尝试常见协议和 URL 变体，但都没有成功。',
    '请确认 Base URL、API Key、模型名属于同一个服务商或中转站。',
    '尝试记录：',
    joined.slice(0, 1200),
  ].join('\n');
}

export function createChatTransportErrors(): ChatTransportErrorFormatters {
  return {
    diagnoseHttpError,
    usageOnlyStreamError,
    emptyStreamError: (events, text) => {
      const last = events.length ? JSON.stringify(events[events.length - 1]).slice(0, 300) : text.slice(0, 300);
      return `LLM 返回空内容（流式，${events.length} 段）。末段：${last}`;
    },
    nonJsonError: (text) => `LLM 返回非 JSON：${text.slice(0, 200)}`,
    emptyContentError: (data) => `LLM 返回空内容。原始：${JSON.stringify(data).slice(0, 300)}`,
    timeoutError: (timeoutMs) => `请求超时：${timeoutMs}ms`,
  };
}

export function createModelTransportErrors(): ModelTransportErrorFormatters {
  return {
    httpError: (status, body) => `获取模型列表失败 ${status}：${body.slice(0, 200)}`,
    emptyModelsError: '该接口未返回可用模型，请手动填写',
    timeoutError: (timeoutMs) => `请求超时：${timeoutMs}ms`,
  };
}
