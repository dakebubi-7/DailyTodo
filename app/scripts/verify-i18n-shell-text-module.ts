import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const entryPath = join(root, 'src', 'i18n.ts');
const zhShellPath = join(root, 'src', 'i18n', 'shellTextZh.ts');
const enShellPath = join(root, 'src', 'i18n', 'shellTextEn.ts');
const zhSettingsPath = join(root, 'src', 'i18n', 'shellTextZhSettings.ts');
const enSettingsPath = join(root, 'src', 'i18n', 'shellTextEnSettings.ts');
const settingsTypesPath = join(root, 'src', 'i18n', 'settingsTextTypes.ts');
const packagePath = join(root, 'package.json');

function read(path: string): string {
  return readFileSync(path, 'utf8');
}

function lineCount(path: string): number {
  return read(path).split(/\r?\n/).length;
}

for (const path of [zhShellPath, enShellPath, zhSettingsPath, enSettingsPath, settingsTypesPath]) {
  assert.ok(existsSync(path), `${path} should exist after splitting shell text from src/i18n.ts.`);
}

const entry = read(entryPath);
const zhShell = read(zhShellPath);
const enShell = read(enShellPath);
const zhSettings = read(zhSettingsPath);
const enSettings = read(enSettingsPath);
const settingsTypes = read(settingsTypesPath);
const packageJson = JSON.parse(read(packagePath));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(entry, /export function getShellText\(/, 'src/i18n.ts should continue to export getShellText.');
assert.match(entry, /from '\.\/i18n\/shellTextZh'/, 'src/i18n.ts should import the Chinese shell text module.');
assert.match(entry, /from '\.\/i18n\/shellTextEn'/, 'src/i18n.ts should import the English shell text module.');
assert.doesNotMatch(entry, /const\s+zh\s*=\s*{/, 'src/i18n.ts should not keep the Chinese shell text inline.');
assert.doesNotMatch(entry, /const\s+en\s*:/, 'src/i18n.ts should not keep the English shell text inline.');
assert.ok(lineCount(entryPath) < 80, `src/i18n.ts should stay a small entrypoint, got ${lineCount(entryPath)} lines.`);

assert.match(zhShell, /export const zhShellText/, 'Chinese shell module should export zhShellText.');
assert.match(enShell, /export const enShellText/, 'English shell module should export enShellText.');
assert.match(zhShell, /settings:\s*zhSettingsText/, 'Chinese shell module should compose settings from the settings module.');
assert.match(enShell, /settings:\s*enSettingsText/, 'English shell module should compose settings from the settings module.');
assert.match(zhSettings, /export const zhSettingsText/, 'Chinese settings module should export zhSettingsText.');
assert.match(enSettings, /export const enSettingsText/, 'English settings module should export enSettingsText.');
assert.match(settingsTypes, /export type SettingsText\s*=\s*typeof import\('\.\/shellTextZhSettings'\)\.zhSettingsText/, 'Settings text type module should own the shared contract.');
assert.match(enSettings, /import type \{ SettingsText \} from '\.\/settingsTextTypes'/, 'English settings module should use the shared settings text contract.');
assert.doesNotMatch(enSettings, /from '\.\/shellTextZhSettings'/, 'English settings module should not depend on Chinese locale data.');
assert.match(enSettings, /satisfies SettingsText/, 'English settings module should satisfy the shared settings text contract.');

for (const path of [zhShellPath, enShellPath, zhSettingsPath, enSettingsPath]) {
  assert.ok(lineCount(path) < 300, `${path} should remain below the production large-file threshold; got ${lineCount(path)} lines.`);
}

const i18nModule = await import(pathToFileURL(entryPath).href) as typeof import('../src/i18n');
const zh = i18nModule.getShellText('zh-CN');
const en = i18nModule.getShellText('en-US');

assert.equal(zh.settings.templateSources.dailyNotePath, '每日记录文件位置');
assert.equal(en.settings.templateSources.dailyNotePath, 'Daily note file path');
assert.equal(zh.titlebar.settings, '设置');
assert.equal(en.titlebar.settings, 'Settings');
assert.equal(zh.daily.headings.today, '今日任务');
assert.equal(en.daily.headings.today, "Today's Tasks");
assert.equal(zh.app.inspiration, '灵感随笔');
assert.equal(en.app.inspiration, 'Inspiration');

assert.equal(
  scripts['verify:i18n-shell-text-module'],
  'tsx scripts/verify-i18n-shell-text-module.ts',
  'package.json should expose the focused i18n shell-text module verifier.',
);
assertCleanupCoreIncludes('verify:i18n-shell-text-module', 'cleanup-core should include the focused i18n shell-text verifier.');

console.log('i18n shell text module verification passed');
