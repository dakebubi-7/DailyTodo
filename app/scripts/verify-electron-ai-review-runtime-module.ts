import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron/aiReviewRuntime.ts');
const diagnosticsModulePath = join(root, 'electron/aiReviewDiagnostics.ts');
const servicesModulePath = join(root, 'electron/mainAiReviewServices.ts');
const mainPath = join(root, 'electron/main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI review runtime module should exist.');
assert.ok(existsSync(diagnosticsModulePath), 'Electron AI review diagnostics module should exist.');
assert.ok(existsSync(servicesModulePath), 'Electron main AI review services module should exist.');

const helper = readFileSync(modulePath, 'utf8');
const diagnosticsHelper = readFileSync(diagnosticsModulePath, 'utf8');
const services = readFileSync(servicesModulePath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /import \{[^}]*BrowserWindow[^}]*\} from 'electron'/, 'AI review runtime module should own progress IPC fanout.');
assert.match(helper, /resolveProfileForReportKind/, 'AI review runtime module should own report-profile resolution.');
assert.match(helper, /callChatCompletion/, 'AI review runtime module should own report-kind LLM call wiring.');
assert.match(helper, /from '\.\/aiReviewDiagnostics'/, 'AI review runtime module should compose diagnostic assembly through the focused helper.');
assert.match(helper, /createAiReviewDiagnostics\(\)/, 'AI review runtime module should create focused diagnostics helpers.');
assert.match(diagnosticsHelper, /mergeTokenUsage/, 'AI review diagnostics module should own token-usage aggregation.');
assert.match(diagnosticsHelper, /safeBaseUrlHost/, 'AI review diagnostics module should own profile host sanitization.');
assert.match(helper, /export function createAiReviewRuntimeHelpers\b/, 'AI review runtime module should export a helper factory.');
assert.match(helper, /function ensureReportLlmAvailable\b/, 'AI review runtime module should own report-account availability checks.');
assert.match(diagnosticsHelper, /function stage\b/, 'AI review diagnostics module should own stage helper creation.');
assert.match(helper, /function emitAiReviewProgress\b/, 'AI review runtime module should own staged progress emission.');
assert.match(diagnosticsHelper, /function createDiagnostic\b/, 'AI review diagnostics module should own AI run diagnostic creation.');
assert.match(
  diagnosticsHelper,
  /function createDiagnostic[\s\S]*?for \(const result of llmResults\) \{[\s\S]*?requestDuration[\s\S]*?successful/, 
  'AI review diagnostics should aggregate LLM result metadata in one traversal.',
);
assert.doesNotMatch(
  diagnosticsHelper,
  /const successful = llmResults\.filter[\s\S]*?const diagnostics = llmResults\.map[\s\S]*?const requestDuration = diagnostics\s*\.map/,
  'AI review diagnostics should not repeatedly filter and map the same LLM result collection.',
);
assert.match(helper, /function extractDocxText\b/, 'AI review runtime module should own DOCX text extraction.');
assert.doesNotMatch(helper, /function createDiagnostic\b/, 'AI review runtime module should not retain diagnostic assembly inline.');
assert.match(helper, /'aiReview:progress'/, 'AI review runtime module should preserve aiReview:progress IPC notifications.');
assert.match(helper, /mammoth/, 'AI review runtime module should preserve mammoth-backed DOCX extraction.');

assert.match(services, /from '\.\/aiReviewRuntime'/, 'services composition should import AI review runtime helpers.');
assert.match(services, /createAiReviewRuntimeHelpers\(\{/, 'services composition should create AI review runtime helpers through the module.');
assert.match(services, /getAiReviewSettings,/, 'services composition should pass AI review settings access into the runtime helper.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should delegate runtime helper wiring to the AI review services composition.');

for (const movedFunction of [
  'ensureReportLlmAvailable',
  'stage',
  'emitAiReviewProgress',
  'createDiagnostic',
  'extractDocxText',
]) {
  const declarationPattern = new RegExp(`function ${movedFunction}\\b`);
  assert.doesNotMatch(main, declarationPattern, `main should not keep ${movedFunction} inline after extraction.`);
}

assert.equal(
  scripts['verify:electron-ai-review-runtime-module'],
  'tsx scripts/verify-electron-ai-review-runtime-module.ts',
  'package.json should expose the focused AI review runtime verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-runtime-module', 'cleanup-core should include the focused AI review runtime verifier.');

console.log('electron AI review runtime module verification passed');
