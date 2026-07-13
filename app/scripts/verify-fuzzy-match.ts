import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fuzzyMatchTitle, fuzzyMatchTitles } from '../shared/aiReview/fuzzyMatch';

// 单标题命中
assert.equal(fuzzyMatchTitle('今日复盘')!.markerKey, 'REVIEW');
assert.equal(fuzzyMatchTitle('明天计划')!.markerKey, 'TOMORROW');
assert.equal(fuzzyMatchTitle('学到了什么')!.markerKey, 'KNOWLEDGE');
assert.equal(fuzzyMatchTitle('Summary of today')!.markerKey, 'REVIEW', '英文近义词');
assert.equal(fuzzyMatchTitle('随便写的标题'), null, '认不出 → null');

// 一组标题
const result = fuzzyMatchTitles(['回顾', 'TODO', '完全无关的东西']);
assert.equal(result.matches.length, 2);
assert.deepEqual(result.matches.map((m) => m.markerKey).sort(), ['REVIEW', 'TOMORROW']);
assert.deepEqual(result.unmatched, ['完全无关的东西']);

// 全部认不出 → matches 空、unmatched 全量（调用方走手动指认兜底）
const allUnknown = fuzzyMatchTitles(['xyz', 'abc']);
assert.equal(allUnknown.matches.length, 0);
assert.equal(allUnknown.unmatched.length, 2);

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const fuzzySource = readFileSync(join(root, 'shared/aiReview/fuzzyMatch.ts'), 'utf8');
assert.match(fuzzySource, /REVIEW_MARKER_KEYS/, 'fuzzyMatch should iterate canonical marker keys');
assert.doesNotMatch(fuzzySource, /Object\.keys\(SYNONYMS\) as ReviewMarkerKey\[\]/, 'fuzzyMatch should not cast Object.keys(SYNONYMS) to ReviewMarkerKey[]');

console.log('Fuzzy match verification passed');
