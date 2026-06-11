import { strict as assert } from 'node:assert';
import { renderDailyMarkdownTemplate, missingDailyCoreTokens } from '../shared/dailyMarkdownTemplate';

const content = renderDailyMarkdownTemplate({
  template: '# {{date}}\n{{work}}\n{{inspiration}}\n{{tasks}}',
  date: '2026-06-10',
  work: '完成项目设计',
  inspiration: '一个新想法',
  tasks: '- [x] 写计划',
  review: '',
  tomorrow: '',
  knowledge: '',
});
assert.ok(content.includes('2026-06-10'));
assert.ok(content.includes('完成项目设计'));
assert.ok(content.includes('一个新想法'));
assert.ok(content.includes('- [x] 写计划'));

assert.deepEqual(missingDailyCoreTokens('{{work}}\n{{tasks}}'), ['inspiration']);

const fallback = renderDailyMarkdownTemplate({
  template: '# Custom only',
  date: '2026-06-10',
  work: '工作',
  inspiration: '灵感',
  tasks: '任务',
  review: '',
  tomorrow: '',
  knowledge: '',
});
assert.ok(fallback.includes('# Custom only'));
assert.ok(fallback.includes('## 今日工作\n工作'));
assert.ok(fallback.includes('## 灵感随笔\n灵感'));
assert.ok(fallback.includes('## 每日任务\n任务'));

console.log('verify-daily-markdown-template ok');
