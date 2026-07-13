import { strict as assert } from 'node:assert';
import {
  buildRecognizeReportMessages,
  parseRecognizedReportPrompt,
  readAiReviewRecognizeReportTemplateResult,
} from '../shared/aiReview/recognizeReportTemplate';
import { readFileSync } from 'node:fs';

// 构建消息：含粘贴内容 + 要求输出可直接当生成指令的 prompt
const msgs = buildRecognizeReportMessages('## 本周亮点\n## 踩坑\n## 下周计划', 'personalWeekly');
assert.equal(msgs[0].role, 'system');
assert.equal(msgs[1].role, 'user');
assert.ok(msgs[1].content.includes('本周亮点'), '粘贴内容进 user');
assert.ok(msgs[0].content.includes('周报') || msgs[0].content.includes('周'), 'kind 体现在 system');

const msgsM = buildRecognizeReportMessages('## 月度成果', 'personalMonthly');
assert.ok(msgsM[0].content.includes('月'), 'monthly kind 体现');

// 解析：去围栏
assert.equal(
  parseRecognizedReportPrompt('```\n生成时请包含：亮点/踩坑/下周\n```'),
  '生成时请包含：亮点/踩坑/下周',
);
assert.equal(
  parseRecognizedReportPrompt('```json\n生成指令文本\n```'),
  '生成指令文本',
  '去 json 围栏',
);
assert.equal(parseRecognizedReportPrompt('  纯文本指令  '), '纯文本指令', 'trim');

// 空/无效 → 空串（调用方回落默认）
assert.equal(parseRecognizedReportPrompt(''), '');
assert.equal(parseRecognizedReportPrompt('   '), '');

assert.deepEqual(
  readAiReviewRecognizeReportTemplateResult({ ok: true, target: 'personalWeekly', prompt: 'do it' }),
  { ok: true, target: 'personalWeekly', prompt: 'do it' },
);
assert.equal(
  readAiReviewRecognizeReportTemplateResult({ ok: true, target: 'daily', prompt: 'x' }),
  undefined,
);
assert.equal(readAiReviewRecognizeReportTemplateResult(null), undefined);

const recognizeReportSource = readFileSync('shared/aiReview/recognizeReportTemplate.ts', 'utf8');
assert.match(recognizeReportSource, /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/, 'report recognition should reuse the shared object-record guard');
assert.doesNotMatch(recognizeReportSource, /function isObject\(value: unknown\)/, 'report recognition should not redeclare the shared object-record guard');

console.log('Recognize report verification passed');
