import { strict as assert } from 'node:assert';
import {
  AiReviewSettings,
  createDefaultAiProfile,
  normalizeAiReviewSettings,
} from '../shared/aiReview/aiReviewSettings';
import {
  selectProfile,
  updateProfile,
  addProfile,
  duplicateProfile,
  deleteProfile,
} from '../shared/aiReview/profileOps';

function base(): AiReviewSettings {
  return normalizeAiReviewSettings({
    profiles: [
      { id: 'a', name: 'A', provider: 'openai', baseUrl: 'https://a/v1', apiKey: 'ka', model: 'ma', timeoutSeconds: 60 },
      { id: 'b', name: 'B', provider: 'anthropic', baseUrl: 'https://api.anthropic.com', apiKey: 'kb', model: 'mb', timeoutSeconds: 90 },
    ],
    activeProfileId: 'a',
  });
}

// select：切换当前；不存在的 id 不改
assert.equal(selectProfile(base(), 'b').activeProfileId, 'b', 'select 切换当前');
assert.equal(selectProfile(base(), 'missing').activeProfileId, 'a', 'select 不存在 id → 不变');

// update：改字段、不改 id；不存在的 id 不变
const upd = updateProfile(base(), 'a', { apiKey: 'new', model: 'mz' });
assert.equal(upd.profiles[0].apiKey, 'new');
assert.equal(upd.profiles[0].model, 'mz');
assert.equal(upd.profiles[0].id, 'a', 'update 不改 id');
assert.deepEqual(updateProfile(base(), 'missing', { apiKey: 'x' }).profiles, base().profiles, 'update 不存在 id → 不变');

// add：追加并设为当前；不动旧账号（验证“新增不丢旧账号”）
const np = { ...createDefaultAiProfile(), id: 'c', name: 'C' };
const added = addProfile(base(), np);
assert.equal(added.profiles.length, 3);
assert.equal(added.activeProfileId, 'c', 'add 后设为当前');
assert.equal(added.profiles[0].id, 'a', 'add 不动旧账号 A');
assert.equal(added.profiles[1].id, 'b', 'add 不动旧账号 B');

// duplicate：克隆来源、保留 key、新 id+名、设为当前；源不存在不变
const dup = duplicateProfile(base(), 'b', 'b2', 'B 副本');
assert.equal(dup.profiles.length, 3);
assert.equal(dup.profiles[2].id, 'b2');
assert.equal(dup.profiles[2].apiKey, 'kb', '复制保留来源 key');
assert.equal(dup.profiles[2].name, 'B 副本');
assert.equal(dup.activeProfileId, 'b2', 'duplicate 后设为当前');
assert.equal(duplicateProfile(base(), 'missing', 'x', 'X').profiles.length, 2, 'duplicate 源不存在 → 不变');

// delete 非当前 → 当前不变
const delOther = deleteProfile(base(), 'b', createDefaultAiProfile());
assert.equal(delOther.profiles.length, 1);
assert.equal(delOther.activeProfileId, 'a', '删非当前 → 当前不变');

// delete 当前 → 当前移到剩余首个
const delActive = deleteProfile(base(), 'a', createDefaultAiProfile());
assert.equal(delActive.profiles.length, 1);
assert.equal(delActive.profiles[0].id, 'b');
assert.equal(delActive.activeProfileId, 'b', '删当前 → 当前移到剩余首个');

// delete 删空 → fallback 兜底
const fb = { ...createDefaultAiProfile(), id: 'fb' };
const one = normalizeAiReviewSettings({
  profiles: [{ id: 'only', name: 'O', provider: 'auto', baseUrl: 'https://o/v1', apiKey: 'k', model: 'm', timeoutSeconds: 90 }],
  activeProfileId: 'only',
});
const emptied = deleteProfile(one, 'only', fb);
assert.equal(emptied.profiles.length, 1);
assert.equal(emptied.profiles[0].id, 'fb', '删空 → fallback');
assert.equal(emptied.activeProfileId, 'fb');

console.log('profile ops verification passed');
