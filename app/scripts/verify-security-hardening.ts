import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  protectSecret,
  revealSecret,
  protectAiReviewSettingsSecrets,
  revealAiReviewSettingsSecrets,
  SECRET_PREFIX,
} from '../electron/aiReviewSecrets';
import { normalizeTaskMenuActionPayload } from '../shared/taskMenuActionUpdates';
import { isRendererStoreKey } from '../shared/rendererStoreKeys';
import { createDefaultAiReviewSettings } from '../shared/aiReview/aiReviewSettings';

const fakeCrypto = {
  isAvailable: () => true,
  encryptString: (plain: string) => Buffer.from(`ENC(${plain})`, 'utf8'),
  decryptString: (payload: Buffer) => {
    const text = payload.toString('utf8');
    const match = /^ENC\((.*)\)$/.exec(text);
    if (!match) throw new Error('bad payload');
    return match[1];
  },
};

const protectedKey = protectSecret('sk-test', fakeCrypto);
assert.ok(protectedKey.startsWith(SECRET_PREFIX));
assert.equal(revealSecret(protectedKey, fakeCrypto), 'sk-test');

const settings = createDefaultAiReviewSettings();
settings.apiKey = 'legacy-key';
settings.profiles = [{
  id: 'p1',
  name: 'Primary',
  provider: 'openai',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'profile-key',
  model: 'gpt-4o-mini',
  timeoutSeconds: 60,
  maxTokens: 1200,
}];
const sealed = protectAiReviewSettingsSecrets(settings, fakeCrypto);
assert.ok(sealed.apiKey.startsWith(SECRET_PREFIX));
assert.ok(sealed.profiles[0]?.apiKey.startsWith(SECRET_PREFIX));
const opened = revealAiReviewSettingsSecrets(sealed, fakeCrypto);
assert.equal(opened.apiKey, 'legacy-key');
assert.equal(opened.profiles[0]?.apiKey, 'profile-key');

const allowed = normalizeTaskMenuActionPayload({
  taskId: 't1',
  updates: { priority: 'high', completed: true, __action: 'edit' },
});
assert.deepEqual(allowed, { taskId: 't1', updates: { priority: 'high', __action: 'edit' } });
assert.equal(normalizeTaskMenuActionPayload({ taskId: 't1', updates: null }), null);
assert.equal(isRendererStoreKey('tasks'), true);
assert.equal(isRendererStoreKey('aiReviewSettings'), false);

const settingsIpc = readFileSync(new URL('../electron/settingsIpc.ts', import.meta.url), 'utf8');
assert.match(settingsIpc, /isRendererStoreKey/, 'settings IPC must enforce renderer store allowlist');
const taskMenuWindow = readFileSync(new URL('../electron/taskMenuWindow.ts', import.meta.url), 'utf8');
assert.doesNotMatch(taskMenuWindow, /JSON\.stringify\(payload\)/, 'task menu window must not put payload in URL');
const companion = readFileSync(new URL('../electron/obsidianCompanion.ts', import.meta.url), 'utf8');
assert.match(companion, /writeTextFileAtomic/, 'companion sync should use atomic writes');
const daily = readFileSync(new URL('../electron/obsidianSyncDailyNote.ts', import.meta.url), 'utf8');
assert.match(daily, /writeTextFileAtomic/, 'daily note sync should use atomic writes');
const accessors = readFileSync(new URL('../electron/appStateAccessors.ts', import.meta.url), 'utf8');
assert.match(accessors, /protectAiReviewSettingsSecrets/, 'AI settings must be encrypted at rest');
assert.match(accessors, /revealAiReviewSettingsSecrets/, 'AI settings must be decrypted on read');

console.log('security hardening verification passed');
