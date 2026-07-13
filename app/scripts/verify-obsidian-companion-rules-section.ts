import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const panelPath = join(root, 'src/components/ObsidianCompanionPanel.tsx');
const sectionPath = join(root, 'src/components/obsidianCompanion/ObsidianCompanionRulesSection.tsx');

assert.ok(existsSync(panelPath), 'Obsidian Companion panel should exist.');
assert.ok(existsSync(sectionPath), 'Obsidian Companion rules section should exist.');

const panel = readFileSync(panelPath, 'utf8');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function ObsidianCompanionRulesSection\b/, 'rules section should export its focused component.');
assert.match(panel, /from '\.\/obsidianCompanion\/ObsidianCompanionRulesSection'/, 'panel should import the rules section.');
assert.match(panel, /<ObsidianCompanionRulesSection\b/, 'panel should compose the rules section.');
assert.match(section, /function updateRule\b/, 'rules section should own immutable rule updates.');
assert.match(section, /settings\.rules\.map/, 'rules section should render the current rule list.');
assert.match(section, /isWriteMode\(nextMode\)/, 'rules section should preserve write-mode validation.');
assert.match(section, /companion-rule-row/, 'rules section should preserve rule row styling.');
assert.match(section, /companion-rule-controls/, 'rules section should preserve rule control styling.');
assert.doesNotMatch(panel, /companion-rule-row/, 'panel should no longer own rule row markup.');

console.log('Obsidian Companion rules section verification passed');
