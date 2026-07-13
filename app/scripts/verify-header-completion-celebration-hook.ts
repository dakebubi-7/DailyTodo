import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const headerPath = join(root, 'src/components/Header.tsx');
const hookPath = join(root, 'src/components/header/useCompletionCelebration.ts');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(headerPath), 'Header component should exist.');
assert.ok(existsSync(hookPath), 'Header completion celebration lifecycle should live in a focused hook.');

const header = readFileSync(headerPath, 'utf8');
const hook = readFileSync(hookPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(header, /from '\.\/header\/useCompletionCelebration'/, 'Header should consume the focused completion celebration hook.');
assert.match(header, /useCompletionCelebration\(\{ completedCount, totalCount \}\);/, 'Header should delegate celebration lifecycle with its current counts.');
assert.match(hook, /import \{ useEffect, useRef \} from 'react';/, 'Celebration hook should own effect and previous-count state.');
assert.match(hook, /const prevCompletedRef = useRef\(completedCount\);/, 'Celebration hook should track the previous completion count.');
assert.match(hook, /completedCount > 0 && completedCount === totalCount && prevCompletedRef\.current < totalCount/, 'Celebration hook should only trigger when all tasks are newly complete.');
assert.match(hook, /void import\('canvas-confetti'\)\.then\(\(\{ default: confetti \}\) => \{/, 'Celebration hook should lazy-load canvas-confetti.');
assert.match(hook, /confetti\(\{[\s\S]*particleCount: 90,[\s\S]*spread: 70,[\s\S]*origin: \{ y: 0\.62 \},[\s\S]*colors: \['#2D4A3E', '#C9A84C', '#5B9A8B'\],[\s\S]*\}\);/, 'Celebration hook should preserve the confetti payload.');
assert.match(hook, /prevCompletedRef\.current = completedCount;/, 'Celebration hook should update the previous completion count after each render.');
assert.equal(scripts['verify:header-completion-celebration-hook'], 'tsx scripts/verify-header-completion-celebration-hook.ts', 'package.json should expose the focused Header celebration verifier.');
assertCleanupCoreIncludes('verify:header-completion-celebration-hook', 'cleanup-core should include the focused Header celebration verifier.');

console.log('Header completion celebration hook verification passed');
