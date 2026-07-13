import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'electron', 'aiReviewRunnerBridge.ts');
const servicesPath = join(root, 'electron', 'mainAiReviewServices.ts');
const mainPath = join(root, 'electron', 'main.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(modulePath), 'Electron AI review runner bridge module should exist.');

const bridge = readFileSync(modulePath, 'utf8');
const services = readFileSync(servicesPath, 'utf8');
const main = readFileSync(mainPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(bridge, /export type AiReviewRunnerBridgeTask\b/, 'runner bridge should export a task shape for the delayed runner call.');
assert.match(bridge, /export type AiReviewRunner\b/, 'runner bridge should export the delayed runner function type.');
assert.match(bridge, /export function createAiReviewRunnerBridge\b/, 'runner bridge should export createAiReviewRunnerBridge.');
assert.match(bridge, /let runner: AiReviewRunner \| null = null;/, 'runner bridge should own the nullable delayed runner state.');
assert.match(bridge, /setRunner:\s*\(nextRunner(?::\s*AiReviewRunner)?\)\s*=>\s*\{\s*runner = nextRunner;\s*\}/, 'runner bridge should expose a setter for the real runner.');
assert.match(bridge, /runReviewForDate:\s*\(date(?::\s*string)?, tasks(?::\s*AiReviewRunnerBridgeTask\[\])?, force\??(?::\s*boolean)?\)\s*=>\s*\{/, 'runner bridge should expose the injected runReviewForDate callback.');
assert.match(bridge, /if \(!runner\) \{\s*throw new Error\('AI daily review runner not initialized'\);\s*\}/, 'runner bridge should preserve the uninitialized-runner error.');
assert.match(bridge, /return runner\(date, tasks, force\);/, 'runner bridge should forward calls to the initialized runner.');

assert.match(services, /from '\.\/aiReviewRunnerBridge'/, 'services composition should import the AI review runner bridge helper.');
assert.match(services, /const aiReviewRunnerBridge = createAiReviewRunnerBridge\(\)/, 'services composition should create the delayed AI review runner bridge.');
assert.match(services, /runReviewForDate: aiReviewRunnerBridge\.runReviewForDate/, 'services composition should inject the bridge callback into Obsidian sync helpers.');
assert.match(services, /aiReviewRunnerBridge\.setRunner\(runReviewForDate\)/, 'services composition should set the real AI review runner after runner creation.');
assert.match(main, /from '\.\/mainAiReviewServices'/, 'main should delegate runner bridge wiring to the AI review services composition.');
assert.doesNotMatch(main, /let runReviewForDateImpl:/, 'main should not keep the nullable runReviewForDateImpl state inline after extraction.');
assert.doesNotMatch(main, /runReviewForDateImpl = runReviewForDate;/, 'main should not assign the delayed runner inline after extraction.');
assert.doesNotMatch(main, /AI daily review runner not initialized/, 'main should not own the uninitialized runner error string after extraction.');

assert.equal(
  scripts['verify:electron-ai-review-runner-bridge-module'],
  'tsx scripts/verify-electron-ai-review-runner-bridge-module.ts',
  'package.json should expose the focused AI review runner bridge verifier.',
);
assertCleanupCoreIncludes('verify:electron-ai-review-runner-bridge-module', 'cleanup-core should include the focused AI review runner bridge verifier.');

console.log('electron AI review runner bridge module verification passed');
