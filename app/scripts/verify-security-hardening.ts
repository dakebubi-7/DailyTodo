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
assert.match(companion, /import \{ writeTextFileAtomic \} from '\.\/fileWrite'/, 'companion sync should import atomic writes');
assert.match(companion, /writeTextFileAtomic\(change\.filePath, next\)/, 'companion sync should use atomic writes');
const daily = readFileSync(new URL('../electron/obsidianSyncDailyNote.ts', import.meta.url), 'utf8');
assert.match(daily, /import \{ writeTextFileAtomic \} from '\.\/fileWrite'/, 'daily note sync should import atomic writes');
assert.match(daily, /writeTextFileAtomic\(filePath, nextContent\)/, 'daily note sync should use atomic writes');
const companionIpc = readFileSync(new URL('../electron/companionIpc.ts', import.meta.url), 'utf8');
assert.match(companionIpc, /getCompanionSettings\(\)\.mobileInboxPath/, 'companion IPC should bind mobile inbox import to configured path');
assert.match(companionIpc, /resolvedRequestedPath !== resolvedConfiguredPath/, 'companion IPC should reject non-configured mobile inbox paths');
const accessors = readFileSync(new URL('../electron/appStateAccessors.ts', import.meta.url), 'utf8');
assert.match(accessors, /protectAiReviewSettingsSecrets/, 'AI settings must be encrypted at rest');
assert.match(accessors, /revealAiReviewSettingsSecrets/, 'AI settings must be decrypted on read');


assert.match(companionIpc, /buildSyncPlan\(getCompanionSettings\(\)/, 'companion preview/write should plan from configured main-process settings');
assert.match(companionIpc, /writeSyncPlan\(plan, configured\.vaultPath\)/, 'companion write should re-bind plan vault to configured settings');
assert.doesNotMatch(companionIpc, /buildSyncPlan\(settings,/, 'companion IPC must not trust renderer-supplied settings for planning');

const companionWrite = readFileSync(new URL('../electron/obsidianCompanion.ts', import.meta.url), 'utf8');
assert.match(companionWrite, /export function writeSyncPlan\(plan: SyncPlan, expectedVaultPath\?: string\)/, 'writeSyncPlan should accept an expected vault path');
assert.match(companionWrite, /Sync plan vault path does not match the configured companion vault/, 'writeSyncPlan should reject mismatched vault paths');

const mainWindowEvents = readFileSync(new URL('../electron/mainWindowEvents.ts', import.meta.url), 'utf8');
assert.match(mainWindowEvents, /hardenRendererNavigation\(win\)/, 'main window must harden navigation');
const navigation = readFileSync(new URL('../electron/windowNavigationSecurity.ts', import.meta.url), 'utf8');
assert.match(navigation, /will-navigate/, 'navigation hardening should deny unexpected will-navigate targets');
assert.match(navigation, /setWindowOpenHandler/, 'navigation hardening should deny unexpected window.open targets');

const mainWindowFactory = readFileSync(new URL('../electron/mainWindowFactory.ts', import.meta.url), 'utf8');
assert.match(mainWindowFactory, /sandbox:\s*true/, 'main window should enable renderer sandbox');
const taskMenuWindowSource = readFileSync(new URL('../electron/taskMenuWindow.ts', import.meta.url), 'utf8');
assert.match(taskMenuWindowSource, /sandbox:\s*true/, 'task menu window should enable renderer sandbox');
assert.match(taskMenuWindowSource, /hardenRendererNavigation\(menu\)/, 'task menu window must harden navigation');

const settingsIpcSource = readFileSync(new URL('../electron/settingsIpc.ts', import.meta.url), 'utf8');
assert.match(settingsIpcSource, /filterValidTasks/, 'store:set must validate task payloads');

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.doesNotMatch(indexHtml, /script-src 'self' 'unsafe-inline'/, 'CSP should not allow unsafe-inline scripts');
assert.match(indexHtml, /script-src 'self'/, 'CSP should allow only self scripts');
assert.match(indexHtml, /object-src 'none'/, 'CSP should disable plugins/object embeds');

const aiSettingsIpc = readFileSync(new URL('../electron/aiReviewSettingsSectionsIpc.ts', import.meta.url), 'utf8');
assert.match(aiSettingsIpc, /maskAiReviewSettingsSecretsForRenderer/, 'AI settings getter should mask secrets before renderer exposure');
assert.match(aiSettingsIpc, /mergeAiReviewSettingsSecretsFromRenderer/, 'AI settings setter should restore secrets from main-process storage');

console.log('security hardening verification passed');

