import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const packagePath = join(root, 'package.json');
const runnerPath = join(root, 'scripts', 'verify-cleanup-core.ts');

const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.equal(
  scripts['verify:cleanup-core'],
  'tsx scripts/verify-cleanup-core.ts',
  'verify:cleanup-core should delegate to the focused cleanup-core runner instead of owning a very long inline command.',
);

assert.ok(existsSync(runnerPath), 'cleanup-core runner module should exist.');

const runner = readFileSync(runnerPath, 'utf8');

assert.match(runner, /import \{ spawnSync \} from 'node:child_process';/, 'cleanup-core runner should execute package scripts through spawnSync.');
assert.match(runner, /const cleanupCoreCommands = \[/, 'cleanup-core runner should keep the command list as structured data.');
assert.match(runner, /["']verify:cleanup-core-runner-module["']/, 'cleanup-core runner should include its own structural verifier.');
assert.match(runner, /["']verify:task-core["']/, 'cleanup-core runner should include the task-core verification suite.');
assert.match(runner, /["']verify:electron-main-diagnostics-bootstrap-module["']/, 'cleanup-core runner should include the latest Electron diagnostics bootstrap verifier.');
assert.match(runner, /["']verify:settings-sync-section["']/, 'cleanup-core runner should include the Settings sync section verifier near the end of the suite.');
assert.match(runner, /["']typecheck["']/, 'cleanup-core runner should keep TypeScript typecheck in the cleanup-core suite.');
assert.match(runner, /for \(const command of cleanupCoreCommands\)/, 'cleanup-core runner should execute commands in declaration order.');
assert.match(runner, /process\.env\.npm_execpath/, 'cleanup-core runner should locate the npm CLI from npm_execpath.');
assert.match(runner, /spawnSync\(process\.execPath, \[npmCli, 'run', command\]/, 'cleanup-core runner should invoke npm through the current Node executable to avoid shell/.cmd portability issues.');
assert.match(runner, /stdio: 'inherit'/, 'cleanup-core runner should inherit child process stdio so verifier output remains visible.');
assert.match(runner, /process\.exit\(result\.status \?\? 1\)/, 'cleanup-core runner should stop with the failing child exit code.');

console.log('cleanup-core runner module verification passed');
