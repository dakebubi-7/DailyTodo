import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const titleBarPath = join(root, 'src/components/TitleBar.tsx');
const actionsPath = join(root, 'src/components/titleBar/TitleBarPrimaryActions.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(actionsPath), 'TitleBar primary actions should live in a focused presentation module.');

const titleBar = readFileSync(titleBarPath, 'utf8');
const actions = readFileSync(actionsPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(titleBar, /import \{ TitleBarPrimaryActions \} from '\.\/titleBar\/TitleBarPrimaryActions';/, 'TitleBar should compose the focused primary-actions module.');
assert.match(titleBar, /<TitleBarPrimaryActions[\s\S]*pinned=\{pinned\}/, 'TitleBar should pass window-mode state to the primary-actions module.');
assert.match(actions, /export function TitleBarPrimaryActions\b/, 'Primary actions should have a focused presentation export.');
assert.match(actions, /data-titlebar-primary="true"/, 'Primary actions should preserve the selected-state marker.');
assert.match(actions, /titlebar-actions-primary/, 'Primary actions should preserve their layout class.');
assert.match(actions, /titlebarPrimaryActiveStyle/, 'Primary actions should preserve their active visual treatment.');
assert.match(actions, /onTogglePin/, 'Primary actions should receive the pin interaction callback.');
assert.match(actions, /onToggleLock/, 'Primary actions should receive the lock interaction callback.');
assert.match(actions, /onToggleSettings/, 'Primary actions should receive the settings interaction callback.');
assert.doesNotMatch(titleBar, /className="titlebar-actions-primary"/, 'TitleBar should not retain primary action button JSX after extraction.');
assert.equal(scripts['verify:title-bar-primary-actions-module'], 'tsx scripts/verify-title-bar-primary-actions-module.ts', 'package.json should expose the focused titlebar primary-actions verifier.');
assertCleanupCoreIncludes('verify:title-bar-primary-actions-module', 'cleanup-core should include the focused titlebar primary-actions verifier.');

console.log('TitleBar primary actions module verification passed');
