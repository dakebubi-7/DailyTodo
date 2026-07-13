import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewTemplateToolsIpc.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const preloadPath = join(root, 'electron', 'preload.ts');
const viteEnvPath = join(root, 'src', 'vite-env.d.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review template/tools IPC module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const preload = readFileSync(preloadPath, 'utf8');
const viteEnv = readFileSync(viteEnvPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /import \{[^}]*app[^}]*dialog[^}]*ipcMain[^}]*type BrowserWindow[^}]*\} from 'electron'/s, 'template/tools IPC module should own Electron dialog and ipcMain dependencies.');
assert.match(moduleSource, /export type RegisterAiReviewTemplateToolsIpcHandlersOptions\b/, 'template/tools IPC module should export explicit registration dependencies.');
assert.match(moduleSource, /getLlmCaller\(\): \(messages: ChatMessage\[\]\) => Promise<LlmResult>/, 'template/tools IPC should expose the shared LLM result contract.');
assert.match(moduleSource, /export function registerAiReviewTemplateToolsIpcHandlers\b/, 'template/tools IPC module should export its registration function.');
assert.match(moduleSource, /buildRecognizeMessages/, 'template/tools IPC module should own review-template recognition messages.');
assert.match(moduleSource, /parseRecognizedSections/, 'template/tools IPC module should own review-template recognition parsing.');
assert.match(moduleSource, /buildRecognizeReportMessages/, 'template/tools IPC module should own report-template recognition messages.');
assert.match(moduleSource, /parseRecognizedReportPrompt/, 'template/tools IPC module should own report-template prompt parsing.');
assert.match(
  moduleSource,
  /aiReview:recognizeTemplate'[\s\S]*typeof rawTemplate !== 'string' \|\| !rawTemplate\.trim\(\)[\s\S]*getAiReviewSettings\(\)/,
  'review-template recognition should validate rawTemplate before checking AI settings or API keys.',
);
assert.match(
  moduleSource,
  /aiReview:recognizeReportTemplate'[\s\S]*typeof rawTemplate !== 'string' \|\| !rawTemplate\.trim\(\)[\s\S]*getAiReviewSettings\(\)/,
  'report-template recognition should validate rawTemplate before checking AI settings or API keys.',
);
assert.match(
  moduleSource,
  /aiReview:recognizeTemplate', async \(_event, rawTemplate: unknown\)/,
  'review-template recognition IPC should expose rawTemplate as unknown before validation.',
);
assert.match(
  moduleSource,
  /aiReview:recognizeReportTemplate', async \(_event, target: unknown, rawTemplate: unknown\)/,
  'report-template recognition IPC should expose target and rawTemplate as unknown before validation.',
);
assert.match(
  preload,
  /recognizeTemplate: \(rawTemplate: unknown\) => ipcRenderer\.invoke\('aiReview:recognizeTemplate', rawTemplate\)/,
  'review-template recognition preload API should forward unknown runtime template input.',
);
assert.match(
  preload,
  /recognizeReportTemplate: \(target: unknown, rawTemplate: unknown\) => ipcRenderer\.invoke\('aiReview:recognizeReportTemplate', target, rawTemplate\)/,
  'report-template recognition preload API should forward unknown runtime target and template inputs.',
);
assert.match(
  viteEnv,
  /recognizeTemplate: \(rawTemplate: unknown\) => Promise<unknown>/,
  'review-template recognition ambient preload type should expose rawTemplate and return as unknown.',
);
assert.match(
  viteEnv,
  /recognizeReportTemplate:\s*\(\s*target: unknown,\s*rawTemplate: unknown\s*\) => Promise<unknown>/,
  'report-template recognition ambient preload type should expose target/rawTemplate and return as unknown.',
);
assert.doesNotMatch(
  viteEnv,
  /recognizeTemplate: \(rawTemplate: unknown\) => Promise<\{\s*ok: boolean;/,
  'review-template recognition ambient preload type should not claim a trusted structured recognition result.',
);
assert.doesNotMatch(
  viteEnv,
  /recognizeReportTemplate:\s*\(\s*target: unknown,\s*rawTemplate: unknown\s*\)\s*=>\s*Promise<\{\s*ok: boolean;/,
  'report-template recognition ambient preload type should not claim a trusted structured report-template result.',
);
assert.match(moduleSource, /parseTemplateFile/, 'template/tools IPC module should own template-file parsing.');
assert.match(moduleSource, /listModels\(/, 'template/tools IPC module should own model listing.');
assert.match(
  moduleSource,
  /aiReview:listModels', async \(\s*_event,\s*cfg: unknown,\s*\)/,
  'model-list IPC should expose cfg as unknown before field-level narrowing.',
);
assert.doesNotMatch(
  moduleSource,
  /cfg as \{ baseUrl\?: unknown; apiKey\?: unknown; provider\?: unknown \}/,
  'model-list IPC should not cast runtime config objects before field-level narrowing.',
);
assert.match(
  moduleSource,
  /import \{ isObjectRecord \} from '\.\/unknownValueGuards';/,
  'model-list IPC should reuse the Electron shared object-record guard.',
);
assert.doesNotMatch(
  moduleSource,
  /function isRecord\(/,
  'model-list IPC should not retain an array-accepting local object guard.',
);
assert.match(
  moduleSource,
  /const modelListConfig = isObjectRecord\(cfg\) \? cfg : undefined;/,
  'model-list IPC should reject array-shaped runtime config before reading config fields.',
);
assert.match(
  preload,
  /listModels: \(cfg: unknown\) => ipcRenderer\.invoke\('aiReview:listModels', cfg\)/,
  'model-list preload API should forward unknown runtime config input.',
);
assert.match(
  viteEnv,
  /listModels: \(cfg: unknown\) => Promise<unknown>/,
  'model-list ambient preload type should expose cfg and return as unknown.',
);
assert.doesNotMatch(
  viteEnv,
  /listModels: \(cfg: unknown\) => Promise<\{ ok: true; models: string\[\] \} \| \{ ok: false; error: string \}>/,
  'model-list ambient preload type should not claim trusted ListModelsResult returns.',
);
assert.match(moduleSource, /dialog\.showOpenDialog\(win, \{/, 'template/tools IPC module should own the template-file picker dialog.');
assert.match(
  viteEnv,
  /aiReview:\s*\{[\s\S]*pickTemplateFile: \(\) => Promise<unknown>/,
  'AI Review template picker ambient preload type should expose unknown returns.',
);
assert.doesNotMatch(
  viteEnv,
  /aiReview:\s*\{[\s\S]*pickTemplateFile: \(\) => Promise<\{ ok: boolean; text\?: string; fileName\?: string; error\?: string; canceled\?: boolean \}>/,
  'AI Review template picker ambient preload type should not claim trusted picker result returns.',
);
assert.match(moduleSource, /app\.getPath\('documents'\)/, 'template/tools IPC module should preserve the documents-directory fallback for picking template files.');
assert.match(moduleSource, /resolveActiveProfile\(settings\)\.apiKey/, 'template/tools IPC module should preserve active-profile API-key guards.');
assert.match(moduleSource, /safeTarget:\s*ReportTemplateTarget/, 'template/tools IPC module should preserve report-template target narrowing.');
assert.doesNotMatch(
  moduleSource,
  /provider = cfg\?\.provider \?\? 'auto'/,
  'model-list IPC should not pass arbitrary malformed runtime provider values through to listModels.',
);
assert.match(
  moduleSource,
  /rawProvider === 'openai' \|\|\s*rawProvider === 'anthropic' \|\|\s*rawProvider === 'gemini' \|\|\s*rawProvider === 'auto'/,
  'model-list IPC should explicitly narrow runtime provider values before calling listModels.',
);
assert.match(moduleSource, /timeoutMs:\s*20_000/, 'template/tools IPC module should preserve model-list timeout.');
assert.match(moduleSource, /extensions:\s*\['md', 'txt', 'docx'\]/, 'template/tools IPC module should preserve template-file extensions.');
assert.match(
  moduleSource,
  /const filePath = result\.filePaths\[0\];[\s\S]*typeof filePath !== 'string'[\s\S]*path\.basename\(filePath\)/,
  'template-file picker should reject malformed non-string runtime paths before deriving the file name.',
);
assert.match(
  moduleSource,
  /fs\.statSync\(filePath\)\.isFile\(\)[\s\S]*fs\.readFileSync\(filePath\)/,
  'template-file picker should verify the selected path is a real file before reading it.',
);

for (const channel of [
  'aiReview:recognizeTemplate',
  'aiReview:recognizeReportTemplate',
  'aiReview:listModels',
  'aiReview:pickTemplateFile',
]) {
  const registrationPattern = new RegExp("ipcMain\\.handle\\('" + channel + "'");
  assert.match(moduleSource, registrationPattern, `template/tools IPC module should register ${channel}.`);
  assert.doesNotMatch(parent, registrationPattern, `parent AI Review IPC module should delegate ${channel} instead of registering it inline.`);
}

assert.match(parent, /from '\.\/aiReviewTemplateToolsIpc'/, 'parent AI Review IPC module should import the template/tools IPC module.');
assert.match(parent, /registerAiReviewTemplateToolsIpcHandlers\(\{/, 'parent AI Review IPC module should delegate template/tools handler registration.');
for (const dependency of ['win', 'getAiReviewSettings', 'getReviewSections', 'getLlmCaller', 'getVaultPath', 'extractDocxText', 'zh']) {
  assert.match(parent, new RegExp(`\\b${dependency},`), `parent AI Review IPC module should pass ${dependency} to the template/tools IPC module.`);
}

for (const symbol of [
  'buildRecognizeMessages',
  'parseRecognizedSections',
  'buildRecognizeReportMessages',
  'parseRecognizedReportPrompt',
  'parseTemplateFile',
  'listModels',
  'ReportTemplateTarget',
  'LlmProvider',
]) {
  assert.doesNotMatch(parent, new RegExp(`\\b${symbol}\\b`), `parent AI Review IPC module should not keep direct ${symbol} references after template/tools extraction.`);
}
assert.doesNotMatch(parent, /dialog\.showOpenDialog/, 'parent AI Review IPC module should not own the template-file picker dialog after extraction.');
assert.doesNotMatch(parent, /app\.getPath\('documents'\)/, 'parent AI Review IPC module should not own the picker fallback path after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-template-tools-ipc-module'],
  'tsx scripts/verify-electron-ai-review-template-tools-ipc-module.ts',
  'package.json should expose the focused AI Review template/tools IPC verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-template-tools-ipc-module', 'cleanup-core should include the focused AI Review template/tools IPC verifier.');

console.log('electron AI Review template/tools IPC module verification passed');
