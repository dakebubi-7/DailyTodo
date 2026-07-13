import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewSourceMaterialsIpc.ts');
const reportKindPath = join(root, 'electron', 'aiReviewReportKind.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const preloadPath = join(root, 'electron', 'preload.ts');
const viteEnvPath = join(root, 'src', 'vite-env.d.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review source-materials IPC module should exist.');
assert.ok(existsSync(reportKindPath), 'Electron AI Review report-kind guard module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const reportKind = readFileSync(reportKindPath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*ipcMain[^}]*\} from 'electron'/, 'source-materials IPC module should own ipcMain registration.');
assert.match(moduleSource, /export type RegisterAiReviewSourceMaterialsIpcHandlersOptions\b/, 'source-materials IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /export function registerAiReviewSourceMaterialsIpcHandlers\b/, 'source-materials IPC module should export its registration function.');
assert.match(moduleSource, /ipcMain\.handle\('aiReview:testSourceMaterials'/, 'source-materials IPC module should register aiReview:testSourceMaterials.');
assert.match(moduleSource, /getDateKey\(date\?: unknown\): string/, 'source-materials IPC module should inject an untrusted-date normalizer.');
assert.match(moduleSource, /aiReview:testSourceMaterials'[^)]*kind: unknown, date: unknown/, 'source-materials IPC should treat report kind and date as unknown runtime data.');
assert.match(moduleSource, /aiReview:testSourceMaterials'[^)]*date: unknown/, 'source-materials IPC should treat the runtime date as unknown before normalization.');
assert.match(moduleSource, /from '\.\/aiReviewReportKind'/, 'source-materials IPC module should use the shared report-kind guard.');
assert.match(reportKind, /export function isAiReviewReportKind\(value: unknown\): value is AiReviewReportKind/, 'shared report-kind module should validate weekly/monthly report kinds.');
assert.match(reportKind, /export const AI_REVIEW_REPORT_KIND_ERROR = 'AI Review report kind is malformed\.'/, 'shared report-kind module should expose a stable malformed-kind error.');
assert.match(moduleSource, /if \(!isAiReviewReportKind\(kind\)\) \{\s*return \{ ok: false, error: AI_REVIEW_REPORT_KIND_ERROR, sources: \[\] \};\s*\}\s*const vaultStatus = getVaultStatus\(\);/s, 'source-materials IPC should reject malformed report kinds before vault or source work.');
assert.match(preload, /testSourceMaterials: \(kind: unknown, date: unknown\) => ipcRenderer\.invoke\('aiReview:testSourceMaterials', kind, date\)/, 'preload should expose source-material report kind as runtime data.');
assert.match(viteEnv, /testSourceMaterials:\s*\(\s*kind: unknown,\s*date: unknown/s, 'ambient preload API should expose source-material report kind as unknown.');
assert.match(
  viteEnv,
  /testSourceMaterials:\s*\(\s*kind: unknown,\s*date: unknown\s*\)\s*=>\s*Promise<unknown>/s,
  'ambient source-materials should expose unknown return values at the preload boundary.',
);
assert.doesNotMatch(
  viteEnv,
  /testSourceMaterials:\s*\(\s*kind: unknown,\s*date: unknown\s*\)\s*=>\s*Promise<\{\s*ok: boolean;/s,
  'ambient source-materials should not claim a trusted structured sources result.',
);
assert.match(moduleSource, /getVaultStatus\(\)/, 'source-materials IPC module should preserve vault status checks.');
assert.match(moduleSource, /getAiReviewSettings\(\)/, 'source-materials IPC module should read AI Review settings for monthly source mode.');
assert.match(moduleSource, /getObsidianTemplateSettings\(\)/, 'source-materials IPC module should read template settings for daily and weekly paths.');
assert.match(moduleSource, /getDateKey\(date\)/, 'source-materials IPC module should normalize the requested date through injected getDateKey.');
assert.match(moduleSource, /getWeekDates\(selected\)/, 'source-materials IPC module should use shared week-date helper for weekly tests.');
assert.match(moduleSource, /collectDailySourcesForDates\(\{/, 'source-materials IPC module should collect weekly daily source file candidates.');
assert.match(moduleSource, /collectMonthlySources\(\{/, 'source-materials IPC module should collect monthly source file candidates.');
assert.match(moduleSource, /buildDailySourceRules\(templateSettings\.dailyPath\)/, 'source-materials IPC module should build daily source rules from template settings.');
assert.match(moduleSource, /weeklyPathTemplate:\s*templateSettings\.weeklyPath/, 'source-materials IPC module should use the weekly report template path for monthly source tests.');
assert.match(moduleSource, /mode:\s*settings\.monthlySourceMode/, 'source-materials IPC module should preserve monthly source mode.');
assert.match(moduleSource, /sources\.map\(\(source\) => \(\{ label: source\.label, filePath: source\.filePath \}\)\)/, 'source-materials IPC module should preserve the source list response shape.');

assert.match(parent, /from '\.\/aiReviewSourceMaterialsIpc'/, 'parent AI Review IPC module should import the source-materials IPC module.');
assert.match(parent, /registerAiReviewSourceMaterialsIpcHandlers\(\{/, 'parent AI Review IPC module should delegate source-materials handler registration.');
for (const dependency of ['getVaultStatus', 'getAiReviewSettings', 'getObsidianTemplateSettings', 'getDateKey', 'buildDailySourceRules']) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the source-materials IPC module.`);
}

assert.doesNotMatch(parent, /ipcMain\.handle\('aiReview:testSourceMaterials'/, 'parent AI Review IPC module should not register aiReview:testSourceMaterials inline after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-source-materials-ipc-module'],
  'tsx scripts/verify-electron-ai-review-source-materials-ipc-module.ts',
  'package.json should expose the focused AI Review source-materials IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-source-materials-ipc-module', 'cleanup-core should include the focused AI Review source-materials IPC verifier.');

console.log('electron AI Review source-materials IPC module verification passed');
