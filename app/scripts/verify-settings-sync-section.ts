import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanelPath = join(root, 'src/components/SettingsPanel.tsx');
const sectionPath = join(root, 'src/components/settings/SyncSettingsSection.tsx');

assert.ok(existsSync(sectionPath), 'SyncSettingsSection should exist.');

const settingsPanel = readFileSync(settingsPanelPath, 'utf8');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function SyncSettingsSection\b/, 'SyncSettingsSection should export SyncSettingsSection.');
assert.match(section, /type SyncTemplatePathField = 'dailyPath' \| 'weeklyPath' \| 'monthlyPath' \| 'externalWeeklyPath' \| 'externalMonthlyPath'/, 'SyncSettingsSection should own typed template path fields.');
assert.match(section, /settingsZones\.obsidianSync/, 'SyncSettingsSection should keep Obsidian sync zone heading.');
assert.match(section, /value=\{obsidianTemplates\[field\] \|\| defaultVal\}/, 'SyncSettingsSection should preserve default path fallback display.');
assert.match(section, /onObsidianTemplatesChange\(\{ \.\.\.obsidianTemplates, \[field\]: e\.target\.value \}\)/, 'SyncSettingsSection should preserve path update merging.');
assert.match(section, /onPreviewSync/, 'SyncSettingsSection should preserve sync preview trigger.');
assert.match(section, /syncPreview\.files\.length/, 'SyncSettingsSection should preserve preview file count display.');
assert.doesNotMatch(section, /syncDeletedReviewsToObsidian/, 'SyncSettingsSection should not expose the obsolete deleted-review sync toggle.');
assert.doesNotMatch(section, /confirmBeforeDeletingReview/, 'SyncSettingsSection should not keep a duplicate review-delete confirmation toggle.');
assert.doesNotMatch(section, /ToggleRow/, 'SyncSettingsSection should not include delete-review setting controls.');

assert.match(settingsPanel, /from '\.\/settings\/SyncSettingsSection'/, 'SettingsPanel should import SyncSettingsSection.');
assert.match(settingsPanel, /<SyncSettingsSection\b/, 'SettingsPanel should render SyncSettingsSection.');
assert.doesNotMatch(settingsPanel, /settingsZones\.obsidianSync/, 'SettingsPanel should not keep sync section heading inline.');
assert.doesNotMatch(settingsPanel, /syncPreview\.files\.length/, 'SettingsPanel should not keep sync preview display inline.');
assert.doesNotMatch(settingsPanel, /syncDeletedReviewsToObsidian/, 'SettingsPanel should not keep sync-deleted toggle inline.');

console.log('settings sync section verification passed');
