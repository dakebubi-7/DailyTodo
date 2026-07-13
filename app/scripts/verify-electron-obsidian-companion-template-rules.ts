import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const planningModulePath = join(root, 'electron/obsidianCompanionPlanning.ts');
const templateRulesModulePath = join(root, 'electron/obsidianCompanionTemplateRules.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(planningModulePath), 'Companion sync planning module should exist.');
assert.ok(existsSync(templateRulesModulePath), 'Companion template/rule policy should live in a focused module.');

const planning = readFileSync(planningModulePath, 'utf8');
const templateRules = readFileSync(templateRulesModulePath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(planning, /from '\.\/obsidianCompanionTemplateRules'/, 'Companion planning should import focused template/rule policies.');
assert.match(templateRules, /export function getDateKey\b/, 'Template/rule policy should own date token formatting.');
assert.match(templateRules, /export function getTimeKey\b/, 'Template/rule policy should own time token formatting.');
assert.match(templateRules, /export function renderTemplate\b/, 'Template/rule policy should own capture template rendering.');
assert.match(templateRules, /export function matchesRule\b/, 'Template/rule policy should own capture-rule matching.');
assert.doesNotMatch(templateRules, /Object\.entries\(replacements\)\.map|new Map\(/, 'Fixed template tokens should use direct lookup without per-render collection allocation.');
assert.doesNotMatch(planning, /export function renderTemplate\b/, 'Sync planning should not retain inline template rendering.');
assert.doesNotMatch(planning, /export function matchesRule\b/, 'Sync planning should not retain inline rule matching.');
assert.equal(
  scripts['verify:electron-obsidian-companion-template-rules'],
  'tsx scripts/verify-electron-obsidian-companion-template-rules.ts',
  'package.json should expose the focused Companion template/rule verifier.',
);
assertCleanupCoreIncludes(
  'verify:electron-obsidian-companion-template-rules',
  'cleanup-core should include the focused Companion template/rule verifier.',
);

console.log('electron Obsidian Companion template/rule verification passed');
