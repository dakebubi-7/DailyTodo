import assert from 'node:assert/strict';
import {
  createChatTransportErrors,
  createModelTransportErrors,
  summarizeAutoErrors,
} from '../shared/llm/llmClientErrorMessages';

const chatErrors = createChatTransportErrors();
assert.match(
  chatErrors.diagnoseHttpError(404, 'not found'),
  /Base URL.*\/v1/,
  '404 diagnostics should preserve the actionable OpenAI-compatible Base URL guidance',
);
assert.match(
  chatErrors.usageOnlyStreamError([{ usage: { prompt_tokens: 42 } }]),
  /42 tokens/,
  'usage-only stream diagnostics should retain prompt token context when supplied',
);
assert.match(
  chatErrors.emptyStreamError([], 'raw response'),
  /LLM 返回空内容/, 
  'empty stream diagnostics should preserve the existing user-facing failure label',
);

const modelErrors = createModelTransportErrors();
assert.equal(modelErrors.emptyModelsError, '该接口未返回可用模型，请手动填写', 'model-list fallback text should remain stable');
assert.match(modelErrors.httpError(401, 'denied'), /401.*denied/, 'model-list HTTP diagnostics should preserve status and body snippets');

assert.match(
  summarizeAutoErrors(['openai https://example.test: LLM 接口没有找到请求路径。']),
  /自动识别已尝试常见协议和 URL 变体/,
  'automatic candidate failures should preserve the targeted missing-path summary',
);

console.log('LLM client error messages verification passed');
