import { strict as assert } from 'node:assert';
import { buildRecognizeMessages, parseRecognizedSections } from '../shared/aiReview/recognizeTemplate';
import { createDefaultSections } from '../shared/aiReview/sectionConfig';

const defaults = createDefaultSections();

const messages = buildRecognizeMessages('## 复盘\n## 明天计划\n## 学到了什么');
assert.ok(messages[1].content.includes('复盘'));

// 正常解析
const parsed = parseRecognizedSections(JSON.stringify({
  sections: [
    { markerKey: 'REVIEW', title: '复盘', type: 'ai' },
    { markerKey: 'TOMORROW', title: '明天计划', type: 'deterministic' },
    { markerKey: 'KNOWLEDGE', title: '学到了什么', type: 'ai' },
  ],
  confidence: 'high',
}), defaults);
assert.equal(parsed.sections.length, 3);
assert.equal(parsed.sections[1].title, '明天计划');
assert.equal(parsed.confidence, 'high');

// 脏输出（带围栏）也能解析
const dirty = parseRecognizedSections('```json\n{"sections":[{"markerKey":"REVIEW","title":"X","type":"ai"}],"confidence":"medium"}\n```', defaults);
assert.equal(dirty.sections[0].title, 'X');
assert.equal(dirty.confidence, 'medium');

// 完全无法解析 → 回落默认，unmatched
const fallback = parseRecognizedSections('胡言乱语', defaults);
assert.ok(fallback.sections.length >= 1, 'unparseable → defaults');
assert.equal(fallback.unmatched, true);

// confidence low + 空 sections → unmatched
const low = parseRecognizedSections('{"sections":[],"confidence":"low"}', defaults);
assert.equal(low.unmatched, true);

console.log('Recognize template verification passed');
