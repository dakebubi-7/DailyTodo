import { strict as assert } from 'node:assert';
import {
  REVIEW_MARKERS,
  readBlockBody,
  upsertBlock,
} from '../shared/aiReview/markers';

assert.equal(REVIEW_MARKERS.REVIEW.start, '<!-- DAILYTODO:REVIEW:START -->');
assert.equal(REVIEW_MARKERS.REVIEW.end, '<!-- DAILYTODO:REVIEW:END -->');

const doc = [
  '# 2026-06-07',
  '<!-- DAILYTODO:REVIEW:START -->',
  '## 复盘',
  '旧内容',
  '<!-- DAILYTODO:REVIEW:END -->',
  '',
  '## 其它',
].join('\n');

assert.equal(readBlockBody(doc, REVIEW_MARKERS.REVIEW), '## 复盘\n旧内容');

const replaced = upsertBlock(doc, REVIEW_MARKERS.REVIEW, '新块');
assert.ok(replaced.includes('新块'));
assert.ok(!replaced.includes('旧内容'), 'old body must be gone');
assert.ok(replaced.includes('## 其它'), 'sibling sections must be untouched');

// 无块时追加
const fresh = upsertBlock('# 标题\n正文', REVIEW_MARKERS.REVIEW, 'X');
assert.ok(fresh.includes('<!-- DAILYTODO:REVIEW:START -->'));
assert.ok(fresh.includes('X'));

// 幂等：同一块替换两次结果一致
const once = upsertBlock(doc, REVIEW_MARKERS.REVIEW, '同步块');
const twice = upsertBlock(once, REVIEW_MARKERS.REVIEW, '同步块');
assert.equal(once, twice, 'upsert must be idempotent');

console.log('AI markers verification passed');
