import { strict as assert } from 'node:assert';
import {
  MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS,
  buildRecognizeObsidianTemplateMessages,
  parseRecognizedObsidianTemplateDraft,
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

const fallback = parseRecognizedObsidianTemplateDraft('not json');
assert.equal(fallback.unmatched, true);
assert.equal(fallback.presetId, 'simple');
assert.equal(fallback.modules.work.enabled, true);

const empty = validateObsidianTemplateRecognitionInput('');
assert.equal(empty.ok, false);

const tooLong = validateObsidianTemplateRecognitionInput('x'.repeat(MAX_OBSIDIAN_TEMPLATE_RECOGNITION_CHARS + 1));
assert.equal(tooLong.ok, false);

console.log('Obsidian template recognition verification passed');
