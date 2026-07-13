import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRecognizeMessages, parseRecognizedSections, readAiReviewRecognizeTemplateResult } from '../shared/aiReview/recognizeTemplate';
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


// LLM/runtime non-string content should fall back instead of throwing.
const nonString = parseRecognizedSections({ content: 'not-a-string' } as never, defaults);
assert.equal(nonString.sections, defaults);
assert.equal(nonString.confidence, 'low');
assert.equal(nonString.unmatched, true);


// LLM/runtime JSON with malformed section entries should fall back instead of throwing.
const malformedSection = parseRecognizedSections('{"sections":[null],"confidence":"medium"}', defaults);
assert.equal(malformedSection.sections, defaults);
assert.equal(malformedSection.confidence, 'low');
assert.equal(malformedSection.unmatched, true);

// confidence low + 空 sections → unmatched
const low = parseRecognizedSections('{"sections":[],"confidence":"low"}', defaults);
assert.equal(low.unmatched, true);


assert.deepEqual(
  readAiReviewRecognizeTemplateResult({
    ok: true,
    sections: [{ markerKey: 'REVIEW', title: '??', type: 'ai', prompt: 'p' }],
    confidence: 'high',
    unmatched: false,
  }),
  {
    ok: true,
    sections: [{ markerKey: 'REVIEW', title: '??', type: 'ai', prompt: 'p' }],
    confidence: 'high',
    unmatched: false,
  },
);
assert.equal(
  readAiReviewRecognizeTemplateResult({ ok: true, sections: [{ markerKey: 'REVIEW' }] }),
  undefined,
);
assert.equal(readAiReviewRecognizeTemplateResult(null), undefined);

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const recognizeSource = readFileSync(join(root, 'shared/aiReview/recognizeTemplate.ts'), 'utf8');

assert.match(recognizeSource, /import \{ isObjectRecord \} from '\.\.\/unknownValueGuards';/, 'template recognition should reuse the shared object-record guard');
assert.match(recognizeSource, /isObjectRecord\(json\)/, 'parseRecognizedSections should narrow parsed JSON with the shared record guard');
assert.doesNotMatch(recognizeSource, /function isObject\(value: unknown\)/, 'template recognition should not redeclare the shared object-record guard');
assert.match(recognizeSource, /isReviewMarkerKey/, 'parseRecognizedSections should use the shared marker-key guard');
assert.doesNotMatch(recognizeSource, /json as Record<string, unknown>/, 'parseRecognizedSections should not cast parsed JSON to a record');
assert.doesNotMatch(recognizeSource, /sections as unknown\[\]/, 'parseRecognizedSections should not cast parsed sections arrays');
assert.doesNotMatch(recognizeSource, /as Array<Record<string, unknown>>/, 'parseRecognizedSections should not cast section entries after runtime checks');
assert.doesNotMatch(recognizeSource, /raw\.markerKey as 'REVIEW' \| 'TOMORROW' \| 'KNOWLEDGE'/, 'parseRecognizedSections should narrow markerKey with a guard');
assert.doesNotMatch(recognizeSource, /confidence as 'high' \| 'medium'/, 'parseRecognizedSections should narrow confidence with a guard');

console.log('Recognize template verification passed');
