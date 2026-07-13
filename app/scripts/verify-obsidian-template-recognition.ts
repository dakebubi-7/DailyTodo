import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import {
  MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS,
  buildRecognizeObsidianTemplateMessages,
  parseRecognizedObsidianTemplateDraft,
  readObsidianTemplateRecognitionResult,
  readTemplatePickerResult,
  validateObsidianTemplateRecognitionInput,
} from '../shared/obsidianTemplateRecognition';

const messages = buildRecognizeObsidianTemplateMessages('# Daily\n## 今日推进\n## 明日计划');
assert.equal(messages.length, 2);
assert.ok(messages[0].content.includes('DailyTodo'));
assert.ok(messages[1].content.includes('今日推进'));

const parsed = parseRecognizedObsidianTemplateDraft(JSON.stringify({
  presetId: 'custom',
  dailyNotePath: 'Journal/{{date}}.md',
  modules: {
    work: { enabled: true, title: '今日推进' },
    inspiration: { enabled: false, title: '灵感' },
    tasks: { enabled: true, title: '任务' },
    review: { enabled: true, title: '复盘' },
    tomorrow: { enabled: true, title: '明日计划' },
    knowledge: { enabled: false, title: '知识' },
  },
  taskLineTemplate: '- [{{checked}}] {{text}}',
  completionReviewTemplate: '- {{summary}}',
  unmappedSections: [{ title: '天气', reason: '不是 DailyTodo 模块', excerpt: '晴' }],
  notes: ['已识别 4 个模块'],
}));
assert.equal(parsed.unmatched, false);
assert.equal(parsed.dailyNotePath, 'Journal/{{date}}.md');
assert.equal(parsed.modules.work.title, '今日推进');
assert.equal(parsed.modules.tomorrow.enabled, true);
assert.equal(parsed.unmappedSections[0].title, '天气');

const dirty = parseRecognizedObsidianTemplateDraft('```json\n{"presetId":"knowledge","modules":{"knowledge":{"enabled":true,"title":"知识"}}}\n```');
assert.equal(dirty.unmatched, false);
assert.equal(dirty.presetId, 'knowledge');
assert.equal(dirty.modules.knowledge.enabled, true);

const notesWithInvalidEntries = parseRecognizedObsidianTemplateDraft(JSON.stringify({
  presetId: 'simple',
  notes: [' first ', '', '  ', 42, 'second'],
}));
assert.deepEqual(notesWithInvalidEntries.notes, ['first', 'second']);

const recognitionSource = readFileSync(new URL('../shared/obsidianTemplateRecognition.ts', import.meta.url), 'utf8');
const recognitionResultReadersUrl = new URL('../shared/obsidianTemplateRecognitionResultReaders.ts', import.meta.url);
assert.equal(existsSync(recognitionResultReadersUrl), true, 'template recognition result readers module should exist.');
const recognitionResultReadersSource = readFileSync(recognitionResultReadersUrl, 'utf8');
assert.doesNotMatch(
  recognitionSource,
  /function textArray\(value: unknown\)\s*\{\s*return Array\.isArray\(value\)\s*\? value\.map\([^\n]+\)\.filter\(Boolean\)/s,
);

const sectionsWithInvalidEntries = parseRecognizedObsidianTemplateDraft(JSON.stringify({
  presetId: 'simple',
  unmappedSections: [null, { title: ' first ', reason: ' why ', excerpt: ' note ' }, 42],
}));
assert.deepEqual(sectionsWithInvalidEntries.unmappedSections, [{ title: 'first', reason: 'why', excerpt: 'note' }]);
assert.doesNotMatch(
  recognitionSource,
  /function unmappedSections\(value: unknown\): RecognizedUnmappedSection\[\]\s*\{\s*if \(!Array\.isArray\(value\)\) return \[\];\s*return value\s*\.map\(/s,
);

const fallback = parseRecognizedObsidianTemplateDraft('not json');
assert.equal(fallback.unmatched, true);
assert.equal(fallback.presetId, 'simple');
assert.equal(fallback.modules.work.enabled, true);

const empty = validateObsidianTemplateRecognitionInput('');
assert.equal(empty.ok, false);

const tooLong = validateObsidianTemplateRecognitionInput('x'.repeat(MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS + 1));
assert.equal(tooLong.ok, false);

const recognitionSuccess = readObsidianTemplateRecognitionResult({ ok: true, draft: parsed });
assert.equal(recognitionSuccess?.ok, true);
if (recognitionSuccess?.ok) {
  assert.equal(recognitionSuccess.draft.modules.work.title, parsed.modules.work.title);
}

const recognitionFailure = readObsidianTemplateRecognitionResult({ ok: false, error: 'no key', draft: null });
assert.equal(recognitionFailure?.ok, false);
if (recognitionFailure && !recognitionFailure.ok) {
  assert.equal(recognitionFailure.error, 'no key');
}

assert.equal(
  readObsidianTemplateRecognitionResult({ ok: true, draft: { ...parsed, modules: { work: parsed.modules.work } } }),
  undefined,
);

const pickerSuccess = readTemplatePickerResult({ ok: true, text: '# Template', fileName: 'daily.md' });
assert.equal(pickerSuccess?.ok, true);
assert.equal(pickerSuccess?.text, '# Template');
assert.equal(pickerSuccess?.fileName, 'daily.md');

const pickerCanceled = readTemplatePickerResult({ ok: false, canceled: true });
assert.equal(pickerCanceled?.ok, false);
assert.equal(pickerCanceled?.canceled, true);

assert.equal(readTemplatePickerResult({ ok: true, text: 42 }), undefined);
assert.equal(readTemplatePickerResult({ ok: false, canceled: 'yes' }), undefined);

assert.match(recognitionSource, /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/, 'template recognition should reuse the shared object-record guard.');
assert.doesNotMatch(recognitionSource, /function isObject\(value: unknown\)/, 'template recognition should not redeclare the shared object-record guard.');
assert.match(
  recognitionSource,
  /from '\.\/obsidianTemplateRecognitionResultReaders'/,
  'template recognition should re-export focused IPC result readers.',
);
assert.match(
  recognitionResultReadersSource,
  /export function readObsidianTemplateRecognitionResult\b/,
  'result readers module should own recognition IPC result parsing.',
);
assert.match(
  recognitionResultReadersSource,
  /export function readTemplatePickerResult\b/,
  'result readers module should own template-picker IPC result parsing.',
);
assert.doesNotMatch(
  recognitionSource,
  /function readObsidianTemplateRecognitionResult\(/,
  'template recognition should not keep recognition IPC result parsing inline.',
);
assert.doesNotMatch(
  recognitionSource,
  /function readTemplatePickerResult\(/,
  'template recognition should not keep template-picker IPC result parsing inline.',
);

console.log('Obsidian template recognition verification passed');
