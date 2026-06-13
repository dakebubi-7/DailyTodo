import { strict as assert } from 'node:assert';
import {
  customBlockMarker,
  REVIEW_MARKERS,
  readBlockBody,
  upsertBlock,
} from '../shared/aiReview/markers';

assert.deepEqual(REVIEW_MARKERS, {
  REVIEW: { start: '<!-- DAILYTODO:REVIEW:START -->', end: '<!-- DAILYTODO:REVIEW:END -->' },
  TOMORROW: { start: '<!-- DAILYTODO:TOMORROW:START -->', end: '<!-- DAILYTODO:TOMORROW:END -->' },
  KNOWLEDGE: { start: '<!-- DAILYTODO:KNOWLEDGE:START -->', end: '<!-- DAILYTODO:KNOWLEDGE:END -->' },
});
assert.deepEqual(customBlockMarker('abc-123'), {
  start: '<!-- DAILYTODO:CUSTOM:abc-123:START -->',
  end: '<!-- DAILYTODO:CUSTOM:abc-123:END -->',
});
assert.deepEqual(customBlockMarker('Abc_123-Z'), {
  start: '<!-- DAILYTODO:CUSTOM:Abc_123-Z:START -->',
  end: '<!-- DAILYTODO:CUSTOM:Abc_123-Z:END -->',
});
assert.deepEqual(customBlockMarker('needs review'), {
  start: '<!-- DAILYTODO:CUSTOM:~bmVlZHMgcmV2aWV3:START -->',
  end: '<!-- DAILYTODO:CUSTOM:~bmVlZHMgcmV2aWV3:END -->',
});
assert.deepEqual(customBlockMarker('你好'), {
  start: '<!-- DAILYTODO:CUSTOM:~5L2g5aW9:START -->',
  end: '<!-- DAILYTODO:CUSTOM:~5L2g5aW9:END -->',
});
assert.deepEqual(customBlockMarker('😀'), {
  start: '<!-- DAILYTODO:CUSTOM:~8J-YgA:START -->',
  end: '<!-- DAILYTODO:CUSTOM:~8J-YgA:END -->',
});
assert.deepEqual(customBlockMarker('é'), {
  start: '<!-- DAILYTODO:CUSTOM:~ZcyB:START -->',
  end: '<!-- DAILYTODO:CUSTOM:~ZcyB:END -->',
});
assert.deepEqual(customBlockMarker(''), {
  start: '<!-- DAILYTODO:CUSTOM:~:START -->',
  end: '<!-- DAILYTODO:CUSTOM:~:END -->',
});
assert.deepEqual(customBlockMarker(' '), {
  start: '<!-- DAILYTODO:CUSTOM:~IA:START -->',
  end: '<!-- DAILYTODO:CUSTOM:~IA:END -->',
});
assert.notEqual(
  customBlockMarker('abc').start,
  customBlockMarker(' abc ').start,
  'raw-safe and spaced-safe ids should not collide',
);
assert.notEqual(
  customBlockMarker('').start,
  customBlockMarker('   ').start,
  'different raw blank ids should not collide',
);
assert.notEqual(
  customBlockMarker('a b').start,
  customBlockMarker('a/b').start,
  'distinct custom ids must not collide after normalization',
);
assert.notEqual(
  customBlockMarker('a b').start,
  customBlockMarker('a-b').start,
  'unsafe and raw-safe ids must not collide',
);

function customSegment(id: string): string {
  const marker = customBlockMarker(id).start;
  const match = marker.match(/^<!-- DAILYTODO:CUSTOM:([^:]+):START -->$/);
  assert.ok(match, `expected ${JSON.stringify(marker)} to be a CUSTOM marker`);
  return match[1];
}

const emptySegment = customSegment('   ');
const punctuationSegment = customSegment('!!!');
const nonAsciiSegment = customSegment('你好');
assert.ok(emptySegment.length > 0, 'empty custom id must produce a non-empty safe segment');
assert.ok(punctuationSegment.length > 0, 'punctuation-only custom id must produce a non-empty safe segment');
assert.ok(nonAsciiSegment.length > 0, 'non-ASCII custom id must produce a non-empty safe segment');
assert.notEqual(emptySegment, punctuationSegment, 'empty and punctuation-only ids should be distinct');
assert.notEqual(emptySegment, nonAsciiSegment, 'empty and non-ASCII ids should be distinct');
assert.notEqual(punctuationSegment, nonAsciiSegment, 'punctuation-only and non-ASCII ids should be distinct');

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
