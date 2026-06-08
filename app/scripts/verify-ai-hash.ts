import { strict as assert } from 'node:assert';
import { computeBodyHash, embedHash, extractHash, hashMatches } from '../shared/aiReview/hash';

const body = '🤖 AI 草稿\n今天完成了 X。';
const stamped = embedHash(body);
assert.ok(stamped.includes('<!-- DAILYTODO:AI_HASH:sha256:'), 'must embed hash comment');
assert.ok(stamped.includes('🤖 AI 草稿'), 'body preserved');

const extracted = extractHash(stamped);
assert.equal(extracted, computeBodyHash(body), 'extract returns the embedded hash');

// 未改动 → 一致
assert.equal(hashMatches(stamped), true, 'unmodified stamped body matches');

// 用户改了正文 → 不一致
const edited = stamped.replace('完成了 X', '完成了 Y');
assert.equal(hashMatches(edited), false, 'user edit breaks the hash');

// normalize：仅尾随空格/空行差异不算改动
const cosmetic = stamped.replace('今天完成了 X。', '今天完成了 X。   ');
assert.equal(hashMatches(cosmetic), true, 'trailing whitespace is not a real edit');

// 无 hash 行
assert.equal(extractHash('纯用户文本'), null);
assert.equal(hashMatches('纯用户文本'), false);


// 幂等：对已盖章内容再次盖章后仍可校验通过（normalizeBody 必须剥离所有 hash 行）
const restamped = embedHash(stamped);
assert.equal(hashMatches(restamped), true, 're-embed must stay verifiable');

console.log('AI hash verification passed');
