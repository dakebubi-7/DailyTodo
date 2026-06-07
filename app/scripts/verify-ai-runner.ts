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
    REVIEW_MARKERS.REVIEW.start,
    '## 复盘',
    REVIEW_MARKERS.REVIEW.end,
    REVIEW_MARKERS.TOMORROW.start,
    '## 明日待办',
    REVIEW_MARKERS.TOMORROW.end,
    REVIEW_MARKERS.KNOWLEDGE.start,
    '## 可复用知识',
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

fs.rmSync(dir, { recursive: true, force: true });
console.log('AI runner verification passed');
