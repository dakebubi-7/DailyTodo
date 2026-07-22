import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const helperPath = join(root, 'src/app/appShellEffects.ts');
const runtimeHookPath = join(root, 'src/app/useAppRuntimeEffects.ts');
const appPath = join(root, 'src/App.tsx');
const packagePath = join(root, 'package.json');

assert.ok(existsSync(helperPath), 'App shell effects helper module should exist.');
assert.ok(existsSync(runtimeHookPath), 'App runtime effects hook module should exist.');

const helper = readFileSync(helperPath, 'utf8');
const runtimeHook = readFileSync(runtimeHookPath, 'utf8');
const app = readFileSync(appPath, 'utf8');
const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
const scripts = packageJson.scripts as Record<string, string>;

assert.match(helper, /export function syncSettingsMode\b/, 'helper should export syncSettingsMode.');
assert.match(helper, /setSettingsMode\?\.\(settingsOpen\)/, 'helper should preserve optional settings-mode IPC call.');
assert.match(helper, /export function syncDocumentThemeClasses\b/, 'helper should export syncDocumentThemeClasses.');
assert.match(helper, /document\.documentElement\.classList\.toggle\('dark', isDark\)/, 'helper should preserve dark class toggle.');
assert.match(helper, /document\.documentElement\.classList\.toggle\('texture-disabled', !textureEnabled\)/, 'helper should preserve texture-disabled class toggle.');
assert.match(helper, /export function syncDocumentFontScale\b/, 'helper should export syncDocumentFontScale.');
assert.match(helper, /clampFontScale\(fontScale\)/, 'helper should preserve font-scale clamping through appPersonalization.');
assert.match(helper, /document\.documentElement\.style\.fontSize = `\$\{\(14 \* scale\) \/ 100\}px`/, 'helper should preserve rem base font-size formula.');
assert.match(helper, /export function syncAlwaysOnTopPreference\b/, 'helper should export syncAlwaysOnTopPreference.');
assert.match(helper, /setWindowMode\?\.\(alwaysOnTop \? 'onTop' : 'normal'\)/, 'helper should explicitly synchronize the preferred window mode.');
assert.doesNotMatch(helper, /toggleAlwaysOnTop\?\.\(\)/, 'preference sync should not invert the current window mode.');
assert.match(helper, /export function buildInvisibleGlassSettings\b/, 'helper should export invisible-glass settings construction.');
assert.match(helper, /export function shouldSyncInvisibleGlassSettings\b/, 'helper should export invisible-glass previous-state comparison.');
assert.match(helper, /export function syncInvisibleGlassTheme\b/, 'helper should export invisible-glass theme synchronization.');
assert.match(helper, /Reflect\.get\(result, 'nativeGlassApplied'\) === true/, 'invisible-glass sync should expose whether native material was actually applied.');
assert.match(helper, /export function getInvisibleGlassFallbackShellAttributes\b/, 'helper should export shell-only invisible-glass fallback attributes.');
assert.match(
  helper,
  /isInvisibleTheme && \(blurStrength \?\? 0\) > 0 && !nativeGlassApplied/,
  'CSS glass fallback should require the invisible theme, a positive blur strength, and unavailable native material.',
);
assert.match(helper, /'data-glass-fallback': 'css'/, 'shell fallback helper should mark the CSS fallback explicitly.');

assert.match(app, /from '\.\/app\/useAppRuntimeEffects'/, 'App should import the runtime effects hook.');
assert.match(app, /useAppRuntimeEffects\(\{/, 'App should delegate runtime effects through the runtime hook.');
assert.match(app, /const \[nativeGlassApplied, setNativeGlassApplied\] = useState\(false\)/, 'App should track actual native-glass application state.');
assert.match(
  app,
  /window\.electronAPI\?\.onNativeGlassAppliedChanged\(setNativeGlassApplied\)/,
  'App should update native-material state when the main process reapplies glass after a window-mode change.',
);
assert.doesNotMatch(
  app,
  /onPerformanceFrostChanged\(setNativeGlassApplied\)/,
  'App should not conflate native-material availability with performance-frost state.',
);
assert.match(
  app,
  /getInvisibleGlassFallbackShellAttributes\([\s\S]*?themeState\.isInvisibleTheme[\s\S]*?appState\.personalization\.blurStrength[\s\S]*?nativeGlassApplied/,
  'App should derive the shell fallback flag from theme, blur strength, and actual native-material status.',
);
assert.match(runtimeHook, /from '\.\/appShellEffects'/, 'runtime hook should import shell effect helpers.');
assert.match(runtimeHook, /syncSettingsMode\(appState\.settingsOpen\)/, 'runtime hook should delegate settings-mode effect.');
assert.match(runtimeHook, /syncDocumentThemeClasses\(taskEffects\.isDark, appState\.personalization\.texture\)/, 'runtime hook should delegate document theme class effect.');
assert.match(runtimeHook, /syncDocumentFontScale\(appState\.personalization\.fontScale\)/, 'runtime hook should delegate document font-scale effect.');
assert.match(runtimeHook, /syncAlwaysOnTopPreference\(appState\.personalization\.alwaysOnTop\)/, 'runtime hook should delegate always-on-top effect.');
assert.match(runtimeHook, /\[appState\.personalization\.alwaysOnTop\]/, 'runtime hook should resync window mode when the always-on-top preference changes.');
assert.match(
  runtimeHook,
  /shouldSyncInvisibleGlassSettings\([\s\S]*previousInvisibleGlassRef\.current[\s\S]*nextInvisibleGlass/,
  'runtime hook should skip unchanged invisible-glass payloads before native IPC.',
);
assert.match(
  runtimeHook,
  /previousInvisibleGlassRef\.current = nextInvisibleGlass/,
  'runtime hook should remember the last synchronized invisible-glass payload.',
);
assert.match(
  runtimeHook,
  /syncInvisibleGlassTheme\([\s\S]*activeThemeId === 'invisible'[\s\S]*windowOpacity[\s\S]*blurStrength/,
  'runtime hook should still synchronize native material when the invisible-glass payload changes.',
);
assert.match(runtimeHook, /setNativeGlassApplied: \(value: boolean\) => void/, 'runtime hook should receive the native-material state setter.');
assert.match(
  runtimeHook,
  /let current = true;[\s\S]*?syncInvisibleGlassTheme\([\s\S]*?\.then\(\(nativeGlassApplied\) => \{[\s\S]*?if \(current\) setNativeGlassApplied\(nativeGlassApplied\)/,
  'runtime hook should ignore stale native-material responses before updating the shell fallback state.',
);
assert.doesNotMatch(app, /document\.documentElement\.classList\.toggle\('dark', isDark\)/, 'App should not inline dark class toggling.');
assert.doesNotMatch(app, /document\.documentElement\.style\.fontSize = `\$\{\(14 \* scale\) \/ 100\}px`/, 'App should not inline font-size formula.');
assert.equal(scripts['verify:app-shell-effects-module'], 'tsx scripts/verify-app-shell-effects-module.ts', 'package.json should expose the focused shell effects verifier.');
assertCleanupCoreIncludes('verify:app-shell-effects-module', 'cleanup-core should include the focused shell effects verifier.');

console.log('App shell effects helper verification passed');
