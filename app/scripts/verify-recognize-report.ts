import { strict as assert } from 'node:assert';
import {
  buildRecognizeReportMessages,
  parseRecognizedReportPrompt,
} from '../shared/aiReview/recognizeReportTemplate';

// 构建消息：含粘贴内容 + 要求输出可直接当生成指令的 prompt
const msgs = buildRecognizeReportMessages('## 本周亮点\n## 踩坑\n## 下周计划', 'weekly');
assert.equal(msgs[0].role, 'system');
assert.equal(msgs[1].role, 'user');
assert.ok(msgs[1].content.includes('本周亮点'), '粘贴内容进 user');
assert.ok(msgs[0].content.includes('周报') || msgs[0].content.includes('周'), 'kind 体现在 system');

const msgsM = buildRecognizeReportMessages('## 月度成果', 'monthly');
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

console.log('Recognize report verification passed');
