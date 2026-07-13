import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  AI_ACCOUNT_PRESETS,
  getAiAccountPresetId,
  normalizeAiAccountMaxTokens,
  normalizeAiAccountTimeout,
} from '../src/components/settings/aiAccountManagerModel';

const here = dirname(fileURLToPath(import.meta.url));
const settingsPanel = readFileSync(join(here, '../src/components/SettingsPanel.tsx'), 'utf8');
const aiReviewSection = readFileSync(join(here, '../src/components/settings/AiReviewSettingsSection.tsx'), 'utf8');
const aiReviewWidgets = readFileSync(join(here, '../src/components/settings/AiReviewSettingsWidgets.tsx'), 'utf8');
const aiAccountManager = readFileSync(join(here, '../src/components/settings/AiAccountManager.tsx'), 'utf8');
const aiAccountManagerModel = readFileSync(join(here, '../src/components/settings/aiAccountManagerModel.ts'), 'utf8');
const aiAccountListPath = join(here, '../src/components/settings/AiAccountList.tsx');
const aiAccountDetailsPath = join(here, '../src/components/settings/AiAccountDetails.tsx');
assert.ok(existsSync(aiAccountListPath), 'account list should be extracted into its own component');
assert.ok(existsSync(aiAccountDetailsPath), 'account details should be extracted into its own component');
const aiAccountList = readFileSync(aiAccountListPath, 'utf8');
const aiAccountDetails = readFileSync(aiAccountDetailsPath, 'utf8');
const liveSettingsPanel = settingsPanel.replace(
  /\/\* obsolete AiReviewSection removed during settings v2 migration[\s\S]*?\*\/\s*/,
  '',
);

assert.match(liveSettingsPanel, /<AiReviewSettingsSection[\s\S]*?text=\{text\}/, 'SettingsPanel should pass flat settings text into AiReviewSettingsSection');
assert.match(aiReviewSection, /<AiAccountZone[\s\S]*?text=\{text\.aiReview\}/, 'AiReviewSettingsSection should pass flat aiReview text into AiAccountZone');
assert.match(aiReviewWidgets, /<AiAccountManager[\s\S]*?text=\{text\}/, 'AiAccountZone should pass flat aiReview text into AiAccountManager');
assert.doesNotMatch(aiReviewSection, /text=\{\{\s*settings:\s*\{\s*aiReview:\s*text\s*\}/, 'AiReviewSettingsSection must not pass nested settings text');
assert.doesNotMatch(aiReviewWidgets, /text=\{\{\s*settings:\s*\{\s*aiReview:\s*text\s*\}/, 'AiAccountZone must not pass nested settings text');
assert.doesNotMatch(aiAccountManager, /text=\{\{\s*settings:\s*\{\s*aiReview:\s*text\s*\}/, 'AiAccountManager must not receive nested settings text');
assert.match(aiReviewWidgets, /createDefaultAiProfile\(\)/, 'new AI accounts should be based on createDefaultAiProfile');
assert.match(aiAccountDetails, /maxTokens/, 'AI account details should expose maxTokens');
assert.doesNotMatch(aiAccountDetails, /outputTokens/, 'old outputTokens field must not be used');
assert.match(aiAccountManager, /from '\.\/AiAccountList'/, 'AI account manager should use its extracted account list');
assert.match(aiAccountManager, /from '\.\/AiAccountDetails'/, 'AI account manager should use its extracted account details form');
assert.match(aiAccountManager, /<AiAccountList/, 'AI account manager should delegate profile list rendering to AiAccountList');
assert.match(aiAccountManager, /<AiAccountDetails/, 'AI account manager should delegate account form rendering to AiAccountDetails');
assert.match(aiAccountManagerModel, /export const AI_ACCOUNT_PRESETS/, 'account presets should live in the account model module');
assert.match(aiAccountManagerModel, /export function getAiAccountPresetId/, 'preset lookup should live in the account model module');
assert.match(aiAccountManagerModel, /export function normalizeAiAccountTimeout/, 'timeout normalization should live in the account model module');
assert.match(aiAccountManagerModel, /export function normalizeAiAccountMaxTokens/, 'token normalization should live in the account model module');
assert.doesNotMatch(aiAccountManager, /const AI_PRESETS/, 'AI account manager should not keep account presets inline');
assert.match(aiAccountList, /export function AiAccountList/, 'account list should be exported from its own component');
assert.match(aiAccountList, /profiles\.map/, 'account list should render the available profiles');
assert.match(aiAccountList, /onSelectEditing/, 'account list should own profile selection wiring');
assert.match(aiAccountDetails, /export function AiAccountDetails/, 'account details form should be exported from its own component');
assert.match(aiAccountDetails, /from '\.\/aiAccountManagerModel'/, 'account details should use the extracted account model helpers');
assert.match(aiAccountDetails, /normalizeAiAccountTimeout/, 'account details should keep timeout normalization through the account model');
assert.match(aiAccountDetails, /normalizeAiAccountMaxTokens/, 'account details should keep token normalization through the account model');
assert.match(aiAccountManager, /ai-account-close/, 'account manager should preserve the close control');
assert.match(aiAccountList, /profile\.id === activeId/, 'account list should preserve active account markers');
assert.doesNotMatch(liveSettingsPanel, /function AiReviewSection\(/, 'obsolete AiReviewSection must not be live code');

assert.equal(getAiAccountPresetId('https://api.deepseek.com'), 'deepseek', 'known provider URLs should resolve their preset id');
assert.equal(getAiAccountPresetId('https://custom.example.test/v1'), 'custom', 'unknown provider URLs should resolve to custom');
assert.equal(normalizeAiAccountTimeout(9.5), 10, 'timeout should clamp to the supported minimum');
assert.equal(normalizeAiAccountTimeout(600.5), 600, 'timeout should clamp to the supported maximum');
assert.equal(normalizeAiAccountTimeout(Number.NaN), null, 'invalid timeout values should be ignored');
assert.equal(normalizeAiAccountMaxTokens(255.5), 256, 'token count should clamp to the supported minimum');
assert.equal(normalizeAiAccountMaxTokens(32768.5), 32768, 'token count should clamp to the supported maximum');
assert.equal(normalizeAiAccountMaxTokens(Number.POSITIVE_INFINITY), null, 'invalid token counts should be ignored');
assert.equal(AI_ACCOUNT_PRESETS.find((preset) => preset.id === 'glm')?.label, '智谱 GLM', 'the GLM preset label should be preserved');

console.log('verify-settings-v2-ai-account passed');
