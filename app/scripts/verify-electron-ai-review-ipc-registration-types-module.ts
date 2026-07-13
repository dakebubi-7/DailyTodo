import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewIpcRegistrationTypes.ts');
const parentPath = join(root, 'electron', 'aiReviewIpc.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI Review IPC registration types module should exist.');

const moduleSource = readFileSync(modulePath, 'utf8');
const parent = readFileSync(parentPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(moduleSource, /export type RegisterAiReviewIpcHandlersOptions\b/, 'registration types module should export RegisterAiReviewIpcHandlersOptions.');
assert.match(moduleSource, /win: BrowserWindow/, 'registration types module should preserve BrowserWindow dependency.');
assert.match(moduleSource, /getAppSettings\(\): AppBehaviorSettings/, 'registration types module should preserve app settings dependency.');
assert.match(moduleSource, /getAiReviewSettings\(\): AiReviewSettings/, 'registration types module should preserve AI Review settings getter dependency.');
assert.match(moduleSource, /setAiReviewSettings\(value: unknown\): AiReviewSettings/, 'registration types module should preserve AI Review settings setter dependency.');
assert.match(moduleSource, /getObsidianTemplateSettings\(\): ObsidianTemplateSettings/, 'registration types module should preserve Obsidian template settings dependency.');
assert.match(moduleSource, /getReviewSections\(\): SectionConfig\[\]/, 'registration types module should preserve review sections getter dependency.');
assert.match(moduleSource, /setReviewSections\(value: unknown\): SectionConfig\[\]/, 'registration types module should preserve review sections setter dependency.');
assert.match(moduleSource, /scheduleAiTimers\(\): void/, 'registration types module should preserve AI timer scheduler dependency.');
assert.match(moduleSource, /runReviewForDate\(date: string, tasks: ElectronTask\[\], force\?: boolean\): unknown/, 'registration types module should preserve daily runner dependency.');
assert.match(moduleSource, /inspectDailyAiContent\(date: string\): InspectDailyResult/, 'registration types module should preserve daily inspection dependency.');
assert.match(moduleSource, /buildDailySourceRules\(dailyPath: string\): DailySourceRule\[\]/, 'registration types module should preserve daily source-rule builder dependency.');
assert.match(moduleSource, /getDailySourceRules\(\): DailySourceRule\[\]/, 'registration types module should preserve daily source-rules dependency.');
assert.match(moduleSource, /getLlmCaller\(\): \(messages: ChatMessage\[\]\) => Promise<LlmResult>/, 'registration types module should expose the shared LLM result contract.');
assert.match(moduleSource, /ensureReportLlmAvailable\(reportKind: AiReviewReportKind\): AiReviewReportLlmAvailableResult/, 'registration types module should preserve report LLM resolver dependency.');
assert.match(moduleSource, /emitAiReviewProgress: AiReviewReportProgressEmitter/, 'registration types module should preserve report progress emitter dependency.');
assert.match(moduleSource, /stage: AiReviewReportStageFactory/, 'registration types module should preserve report stage factory dependency.');
assert.match(moduleSource, /createDiagnostic: AiReviewReportDiagnosticFactory/, 'registration types module should preserve report diagnostic factory dependency.');
assert.match(moduleSource, /extractDocxText\(buffer: Buffer\): Promise<string>/, 'registration types module should preserve DOCX extractor dependency.');
assert.match(moduleSource, /zh\(text: string\): string/, 'registration types module should preserve localization dependency.');

assert.match(parent, /import type \{ RegisterAiReviewIpcHandlersOptions \} from '\.\/aiReviewIpcRegistrationTypes'/, 'parent AI Review IPC module should import registration options from the focused type module.');
assert.doesNotMatch(parent, /type RegisterAiReviewIpcHandlersOptions\s*=/, 'parent AI Review IPC module should not define registration options inline.');
assert.doesNotMatch(parent, /type AiReviewTask\s*=/, 'parent AI Review IPC module should not keep a local task alias solely for registration options.');

for (const forbiddenImport of [
  "from 'electron'",
  "from '../shared/appSettings'",
  "from '../shared/aiReview/aiReviewSettings'",
  "from '../shared/aiReview/sourceMaterials'",
  "from '../shared/aiReview/sectionConfig'",
  "from '../shared/llm/openaiClient'",
  "from './aiReviewReportIpcTypes'",
  "from './sharedTypes'",
]) {
  assert.doesNotMatch(parent, new RegExp(forbiddenImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `parent AI Review IPC module should not import registration-only types ${forbiddenImport}.`);
}

assert.equal(
  scripts['verify:electron-ai-review-ipc-registration-types-module'],
  'tsx scripts/verify-electron-ai-review-ipc-registration-types-module.ts',
  'package.json should expose the focused AI Review IPC registration types verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-ipc-registration-types-module', 'cleanup-core should include the focused AI Review IPC registration types verifier.');

console.log('electron AI Review IPC registration types module verification passed');
