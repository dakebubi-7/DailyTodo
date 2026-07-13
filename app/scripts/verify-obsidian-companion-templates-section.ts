import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const panelPath = join(root, 'src/components/ObsidianCompanionPanel.tsx');
const sectionPath = join(root, 'src/components/obsidianCompanion/ObsidianCompanionTemplatesSection.tsx');

assert.ok(existsSync(panelPath), 'Obsidian Companion panel should exist.');
assert.ok(existsSync(sectionPath), 'Obsidian Companion templates section should exist.');

const panel = readFileSync(panelPath, 'utf8');
const section = readFileSync(sectionPath, 'utf8');

assert.match(section, /export function ObsidianCompanionTemplatesSection\b/, 'templates section should export its focused component.');
assert.match(panel, /from '\.\/obsidianCompanion\/ObsidianCompanionTemplatesSection'/, 'panel should import the templates section.');
assert.match(panel, /<ObsidianCompanionTemplatesSection\b/, 'panel should compose the templates section.');
assert.match(section, /settings\.templates\.map/, 'templates section should render the current template list.');
assert.match(section, /templates: settings\.templates\.map/, 'templates section should own immutable template updates.');
assert.match(section, /candidate\.id === template\.id/, 'templates section should update only the edited template.');
assert.match(section, /companion-template-editor/, 'templates section should preserve template editor styling.');
assert.doesNotMatch(panel, /companion-template-editor/, 'panel should no longer own template editor markup.');

console.log('Obsidian Companion templates section verification passed');
