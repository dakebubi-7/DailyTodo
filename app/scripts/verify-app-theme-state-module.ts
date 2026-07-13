import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appThemeState.ts');
const appPath = join(root, 'src/App.tsx');
const runtimeEffectsPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const globalStylesPath = join(root, 'src/styles/globals.css');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App theme state helper module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const runtimeEffects = readFileSync(runtimeEffectsPath, 'utf8');
const globalStyles = readFileSync(globalStylesPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export interface AppThemeState\b/, 'helper should export AppThemeState.');
assert.match(helper, /export function createAppThemeState\b/, 'helper should export createAppThemeState.');
assert.match(helper, /matchThemePreset\(personalization\)/, 'helper should preserve theme preset fallback.');
assert.match(helper, /themeClass: activeThemeId \? `theme-\$\{activeThemeId\}` : ''/, 'helper should preserve theme CSS class construction.');
assert.match(helper, /isInvisibleTheme: activeThemeId === 'invisible'/, 'helper should preserve invisible-theme detection.');

assert.match(app, /from '\.\/app\/appThemeState'/, 'App should import theme state helper.');
assert.match(app, /createAppThemeState\(appState\.personalization\)/, 'App should delegate theme state derivation from local app state.');
assert.match(app, /const themeState = useMemo\(\(\) => createAppThemeState\(appState\.personalization\), \[appState\.personalization\]\);/, 'App should memoize theme state until personalization changes.');
assert.match(app, /themeState\.activeThemeId/, 'App should consume derived active theme id.');
assert.match(app, /themeState\.themeClass/, 'App should consume derived theme class.');
assert.match(app, /themeState\.isInvisibleTheme/, 'App should consume derived invisible theme state.');
assert.match(runtimeEffects, /import\('\.\.\/styles\/watercolor-theme\.css'\)/, 'Runtime effects should load the watercolor stylesheet only when the watercolor theme is active.');
assert.match(runtimeEffects, /activeThemeId !== 'watercolor'/, 'Runtime effects should skip the watercolor stylesheet outside the watercolor theme.');
assert.doesNotMatch(globalStyles, /@import '\.\/watercolor-theme\.css';/, 'global styles should not eagerly load the watercolor stylesheet.');
assert.doesNotMatch(app, /const activeThemeId = personalization\.themeId \|\| matchThemePreset\(personalization\)/, 'App should not inline activeThemeId derivation.');
assert.doesNotMatch(app, /const activeThemeClass = activeThemeId \? `theme-\$\{activeThemeId\}` : ''/, 'App should not inline activeThemeClass derivation.');
assert.doesNotMatch(app, /const isInvisibleTheme = activeThemeId === 'invisible'/, 'App should not inline invisible-theme derivation.');
assert.equal(scripts['verify:app-theme-state-module'], 'tsx scripts/verify-app-theme-state-module.ts', 'package.json should expose the focused theme state verifier.');
assertCleanupCoreIncludes('verify:app-theme-state-module', 'cleanup-core should include the focused theme state verifier.');

console.log('App theme state helper verification passed');
