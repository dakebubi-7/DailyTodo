import { strict as assert } from 'node:assert';
import { createDefaultSections, SectionType } from '../shared/aiReview/sectionConfig';
import { buildReviewMessages } from '../shared/aiReview/promptBuilder';

const sections = createDefaultSections();
const review = sections.find((s) => s.markerKey === 'REVIEW')!;
assert.equal(review.type, SectionType.Ai);
assert.ok(review.prompt.length > 0);

const tomorrow = sections.find((s) => s.markerKey === 'TOMORROW')!;
assert.equal(tomorrow.type, SectionType.Deterministic, '明日待办先确定性结转');

const messages = buildReviewMessages({
  date: '2026-06-07',
  dailyContent: '## 今日工作\n写了复盘引擎\n## 每日任务\n- [x] Task1',
  section: review,
  stats: { date: '2026-06-07', total: 1, completed: 1, completionRate: 100 },
});
assert.equal(messages[0].role, 'system');
assert.equal(messages[1].role, 'user');
assert.ok(messages[1].content.includes('2026-06-07'));
assert.ok(messages[1].content.includes('写了复盘引擎'), 'daily content included');
assert.ok(messages[1].content.includes('100'), 'deterministic stats injected, not invented');
assert.ok(messages[0].content.includes('不要编造数字') || messages[0].content.includes('do not invent'));

console.log('Section config verification passed');
