import { strict as assert } from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runReviewForFile } from '../electron/aiReview/runner';
import { createDefaultSections } from '../shared/aiReview/sectionConfig';
import { REVIEW_MARKERS, readBlockBody } from '../shared/aiReview/markers';
import { hashMatches } from '../shared/aiReview/hash';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-runner-'));
const file = path.join(dir, '2026-06-07.md');
fs.writeFileSync(
  file,
  [
    '# 2026-06-07',
    '## 复盘',
    REVIEW_MARKERS.REVIEW.start,
    REVIEW_MARKERS.REVIEW.end,
    '## 明日待办',
    REVIEW_MARKERS.TOMORROW.start,
    REVIEW_MARKERS.TOMORROW.end,
    '## 可复用知识',
    REVIEW_MARKERS.KNOWLEDGE.start,
    REVIEW_MARKERS.KNOWLEDGE.end,
  ].join('\n'),
  'utf-8',
);

const fakeLlm = async () => ({ ok: true as const, content: 'AI 生成的复盘正文' });

const result = await runReviewForFile({
  filePath: file,
  date: '2026-06-07',
  tasks: [{ completed: true, taskDate: '2026-06-07' }],
  sections: createDefaultSections(),
  callLlm: fakeLlm,
});

assert.equal(result.ok, true);
const after = fs.readFileSync(file, 'utf-8');
const reviewBody = readBlockBody(after, REVIEW_MARKERS.REVIEW);
assert.ok(reviewBody.includes('AI 生成的复盘正文'), 'AI body filled');
assert.ok(reviewBody.includes('🤖'), 'AI marker present');
assert.ok(hashMatches(reviewBody), 'embedded hash matches → unmodified');

// 第二次跑（幂等 + 用户未改 → AiUnmodified → overwrite）
const second = await runReviewForFile({
  filePath: file, date: '2026-06-07',
  tasks: [{ completed: true, taskDate: '2026-06-07' }],
  sections: createDefaultSections(), callLlm: fakeLlm,
});
assert.equal(second.ok, true);

// 用户改过 → 再跑应跳过
fs.writeFileSync(file, fs.readFileSync(file, 'utf-8').replace('AI 生成的复盘正文', '用户改写了'), 'utf-8');
const third = await runReviewForFile({
  filePath: file, date: '2026-06-07',
  tasks: [], sections: createDefaultSections(), callLlm: fakeLlm,
});
assert.ok(fs.readFileSync(file, 'utf-8').includes('用户改写了'), 'user edit preserved (skipped)');

// 明日待办：确定性结转未完成任务（不经 LLM）
const file2 = path.join(dir, '2026-06-08.md');
fs.writeFileSync(
  file2,
  [
    '# 2026-06-08',
    '## 复盘',
    REVIEW_MARKERS.REVIEW.start,
    REVIEW_MARKERS.REVIEW.end,
    '## 明日待办',
    REVIEW_MARKERS.TOMORROW.start,
    REVIEW_MARKERS.TOMORROW.end,
    '## 可复用知识',
    REVIEW_MARKERS.KNOWLEDGE.start,
    REVIEW_MARKERS.KNOWLEDGE.end,
  ].join('\n'),
  'utf-8',
);
const det = await runReviewForFile({
  filePath: file2,
  date: '2026-06-08',
  tasks: [
    { completed: false, taskDate: '2026-06-08', text: '未完成项A' },
    { completed: true, taskDate: '2026-06-08', text: '已完成项B' },
  ],
  sections: createDefaultSections(),
  callLlm: fakeLlm,
});
assert.equal(det.ok, true);
const tomorrowBody = readBlockBody(fs.readFileSync(file2, 'utf-8'), REVIEW_MARKERS.TOMORROW);
assert.ok(tomorrowBody.includes('未完成项A'), '未完成任务结转到明日待办');
assert.ok(tomorrowBody.includes('（结转）'), '结转标记');
assert.ok(!tomorrowBody.includes('已完成项B'), '已完成任务不结转');

fs.rmSync(dir, { recursive: true, force: true });
console.log('AI runner verification passed');
