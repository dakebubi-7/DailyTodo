import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const modulePath = join(root, 'src/app/appViewportStyle.ts');

assert.ok(existsSync(modulePath), 'App viewport style helper module should exist.');

const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const viewportStyle = readFileSync(modulePath, 'utf8');

assert.ok(
  viewportStyle.includes('export function createAppViewportStyle('),
  'App viewport style helper should export createAppViewportStyle.'
);
assert.ok(
  app.includes("import { createAppViewportStyle } from './app/appViewportStyle';"),
  'App should import createAppViewportStyle from the app module.'
);
assert.ok(
  app.includes('createAppViewportStyle(appState.personalization, themeState.isInvisibleTheme)'),
  'App should initialize its viewport style from the extracted helper.'
);
assert.match(
  app,
  /const viewportStyle = useMemo\(\(\) => createAppViewportStyle\(appState\.personalization, themeState\.isInvisibleTheme\), \[appState\.personalization, themeState\.isInvisibleTheme\]\);/,
  'App should memoize viewport CSS variables until their inputs change.',
);
assert.ok(
  app.includes('style={viewportStyle}'),
  'App viewport should receive the memoized CSS variable object.',
);
assert.doesNotMatch(
  app,
  /const windowOpacity = clamp\(personalization\.windowOpacity \/ 100, 0, 1\);/,
  'App should not inline app viewport opacity calculations.'
);
assert.doesNotMatch(
  app,
  /'--window-opacity': windowOpacity/,
  'App should not inline app viewport CSS variables.'
);
assert.doesNotMatch(
  app,
  /type CSSProperties/,
  'App should not import CSSProperties only for the viewport style object.'
);

const requiredTokens = [
  '--personal-accent',
  '--personal-secondary',
  '--window-opacity',
  '--panel-opacity',
  '--top-opacity',
  '--card-opacity',
  '--control-opacity',
  '--menu-opacity',
  '--input-opacity',
  '--dialog-opacity',
  '--settings-panel-opacity',
  '--readable-surface-opacity',
  '--glass-saturation',
  '--blur-strength',
  '--shell-radius',
  '--card-radius',
  '--control-radius',
];

for (const token of requiredTokens) {
  assert.ok(viewportStyle.includes(`'${token}':`), `App viewport helper should expose ${token}.`);
}

assert.ok(
  viewportStyle.includes('isInvisibleTheme ? windowOpacity'),
  'App viewport helper should keep invisible theme opacity unification.'
);
assert.ok(
  viewportStyle.includes('satisfies CSSProperties'),
  'App viewport helper should type-check the returned CSS variable object.'
);

console.log('verify-app-viewport-style-module passed');
