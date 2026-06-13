import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const settingsPanel = readFileSync(join(here, '../src/components/SettingsPanel.tsx'), 'utf8');
const liveSettingsPanel = settingsPanel.replace(
  /\/\* obsolete AiReviewSection removed during settings v2 migration[\s\S]*?\*\/\s*/,
  '',
);

assert.match(liveSettingsPanel, /<AiAccountManager[\s\S]*?text=\{text\}/, 'AiAccountManager should receive flat aiReview text');
assert.doesNotMatch(liveSettingsPanel, /text=\{\{\s*settings:\s*\{\s*aiReview:\s*text\s*\}/, 'AiAccountManager must not receive nested settings text');
assert.match(liveSettingsPanel, /createDefaultAiProfile\(\)/, 'new AI accounts should be based on createDefaultAiProfile');
assert.match(liveSettingsPanel, /maxTokens/, 'AI account manager should expose maxTokens');
assert.doesNotMatch(liveSettingsPanel, /outputTokens/, 'old outputTokens field must not be used');
assert.doesNotMatch(liveSettingsPanel, /function AiReviewSection\(/, 'obsolete AiReviewSection must not be live code');

console.log('verify-settings-v2-ai-account passed');
