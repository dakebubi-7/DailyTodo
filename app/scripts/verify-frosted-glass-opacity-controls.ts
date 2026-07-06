import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const appearanceSettings = readFileSync(join(root, 'src/components/settings/appearanceSettings.ts'), 'utf8');
const settingsControls = readFileSync(join(root, 'src/components/settings/SettingsControls.tsx'), 'utf8');
const appViewportStyle = readFileSync(join(root, 'src/app/appViewportStyle.ts'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const electronMain = readFileSync(join(root, 'electron/main.ts'), 'utf8');

function extractAround(source: string, anchor: string, beforeChars: number, afterChars: number) {
  const index = source.indexOf(anchor);
  assert.notEqual(index, -1, `Missing anchor: ${anchor}`);
  return source.slice(Math.max(0, index - beforeChars), Math.min(source.length, index + anchor.length + afterChars));
}

function extractFunction(source: string, signature: string) {
  const start = source.indexOf(signature);
  assert.notEqual(start, -1, `Missing function signature: ${signature}`);

  const bodyStart = source.indexOf(') {', start);
  assert.notEqual(bodyStart, -1, `Could not find function body for: ${signature}`);

  const firstBrace = source.indexOf('{', bodyStart);
  assert.notEqual(firstBrace, -1, `Could not find function body opening brace for: ${signature}`);

  let depth = 0;
  for (let index = firstBrace; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }
  throw new Error(`Could not extract function: ${signature}`);
}

function extractSelfClosingJsx(source: string, componentName: string, requiredSnippet: string) {
  const snippetIndex = source.indexOf(requiredSnippet);
  assert.notEqual(snippetIndex, -1, `Missing ${componentName} snippet: ${requiredSnippet}`);

  const start = source.lastIndexOf(`<${componentName}`, snippetIndex);
  assert.notEqual(start, -1, `Could not find ${componentName} start for: ${requiredSnippet}`);

  const end = source.indexOf('/>', snippetIndex);
  assert.notEqual(end, -1, `Could not find ${componentName} end for: ${requiredSnippet}`);

  return source.slice(start, end + 2);
}

function extractCssBlocksForSelector(source: string, selector: string) {
  const blocks: string[] = [];

  for (let open = source.indexOf('{'); open !== -1; open = source.indexOf('{', open + 1)) {
    const previousClose = source.lastIndexOf('}', open);
    const previousOpen = source.lastIndexOf('{', open - 1);
    const preludeStart = Math.max(previousClose, previousOpen) + 1;
    const prelude = source.slice(preludeStart, open);

    let depth = 0;
    let close = -1;
    for (let index = open; index < source.length; index += 1) {
      const char = source[index];
      if (char === '{') depth += 1;
      if (char === '}') {
        depth -= 1;
        if (depth === 0) {
          close = index;
          break;
        }
      }
    }

    assert.notEqual(close, -1, `Unbalanced CSS block after: ${prelude.trim()}`);
    if (prelude.includes(selector)) blocks.push(source.slice(preludeStart, close + 1));
  }

  return blocks;
}

function assertBlockIncludes(block: string, expected: RegExp | string, message: string) {
  if (typeof expected === 'string') {
    assert.ok(block.includes(expected), message);
    return;
  }
  assert.match(block, expected, message);
}

function assertSelectorUses(selector: string, expected: RegExp, message: string) {
  const blocks = extractCssBlocksForSelector(globalsCss, selector);
  assert.ok(blocks.length > 0, `Missing CSS selector: ${selector}`);
  assert.ok(blocks.some((block) => expected.test(block)), message);
}

function assertSelectorDoesNotUse(selector: string, rejected: RegExp, message: string) {
  const blocks = extractCssBlocksForSelector(globalsCss, selector);
  assert.ok(blocks.length > 0, `Missing CSS selector: ${selector}`);
  assert.ok(blocks.every((block) => !rejected.test(block)), message);
}

function assertSelectorBlockUses(selector: string, required: RegExp, message: string) {
  const blocks = extractCssBlocksForSelector(globalsCss, selector);
  assert.ok(blocks.length > 0, `Missing CSS selector: ${selector}`);
  assert.ok(blocks.some((block) => required.test(block)), message);
}

const rangeControl = extractFunction(settingsControls, 'export function RangeControl({');
assertBlockIncludes(rangeControl, 'onDoubleClick={handleReset}', 'RangeControl should support double-click reset on the wrapping control.');
assertBlockIncludes(rangeControl, 'defaultValue', 'RangeControl should accept a reset default value.');
assertBlockIncludes(rangeControl, 'resetTitle', 'RangeControl should accept reset tooltip copy.');
assertBlockIncludes(rangeControl, /if \(typeof defaultValue === 'number'\) onChange\(defaultValue\)/, 'RangeControl should reset to defaultValue through onChange.');

assert.match(
  appearanceSettings,
  /export function withUnifiedGlassOpacity\(settings: PersonalizationSettings, value: number\): PersonalizationSettings/,
  'appearanceSettings should define a helper that writes one opacity value into every glass opacity field.'
);
assertBlockIncludes(
  extractFunction(appearanceSettings, 'export function withUnifiedGlassOpacity('),
  'for (const key of OPACITY_KEYS)',
  'Unified opacity helper should iterate over OPACITY_KEYS.'
);
assertBlockIncludes(
  extractFunction(appearanceSettings, 'export function withUnifiedGlassOpacity('),
  'next[key] = value;',
  'Unified opacity helper should write the slider value to every opacity key.'
);
assert.match(
  settingsPanel,
  /from '\.\/settings\/appearanceSettings'/,
  'SettingsPanel should import appearance helpers from the appearanceSettings module.'
);
assert.doesNotMatch(settingsPanel, /OPACITY_AREAS\.map/, 'SettingsPanel should not render per-area opacity controls.');
assert.doesNotMatch(settingsPanel, /function OpacityAreaControl\(/, 'SettingsPanel should remove the per-area opacity control component.');
assert.doesNotMatch(settingsPanel, /settings-opacity-range-input/, 'SettingsPanel should remove the recommended-range opacity slider UI.');

const fontControl = extractSelfClosingJsx(settingsPanel, 'RangeControl', 'value={settings.fontScale ?? 100}');
assertBlockIncludes(fontControl, "onChange={(value) => updatePersonalization('fontScale', value)}", 'Global font control should update the fontScale personalization setting.');
assertBlockIncludes(fontControl, 'defaultValue={recommendation.fontScale ?? 100}', 'Global font reset should use the current theme font scale or 100.');
assertBlockIncludes(fontControl, 'resetTitle={resetToThemeDefaultTitle}', 'Global font control should use the theme-default reset tooltip.');

const glassOpacityControl = extractSelfClosingJsx(settingsPanel, 'RangeControl', "value={glassOpacityValue(settings)}");
assertBlockIncludes(glassOpacityControl, "label={appSettings.language === 'zh-CN' ? '玻璃透明度' : 'Glass opacity'}", 'Appearance should expose one user-facing glass opacity control.');
assertBlockIncludes(glassOpacityControl, 'min={OPACITY_SLIDER_MIN}', 'Glass opacity control should use the shared opacity minimum.');
assertBlockIncludes(glassOpacityControl, 'max={OPACITY_SLIDER_MAX}', 'Glass opacity control should use the shared opacity maximum.');
assertBlockIncludes(glassOpacityControl, 'defaultValue={opacityValue(recommendation, \'windowOpacity\')}', 'Glass opacity reset should use the current theme window opacity recommendation.');
assertBlockIncludes(glassOpacityControl, 'resetTitle={resetToThemeDefaultTitle}', 'Glass opacity control should use the theme-default reset tooltip.');
assertBlockIncludes(glassOpacityControl, 'onChange={(value) => onChange(withUnifiedGlassOpacity(settings, value))}', 'Glass opacity control should update all opacity fields together.');

const blurStrengthControl = extractSelfClosingJsx(settingsPanel, 'RangeControl', 'value={settings.blurStrength}');
assertBlockIncludes(blurStrengthControl, "label={appSettings.language === 'zh-CN' ? '模糊强度' : 'Blur strength'}", 'Appearance should expose a blur strength control.');
assertBlockIncludes(blurStrengthControl, 'min={0}', 'Blur strength control should start at zero.');
assertBlockIncludes(blurStrengthControl, 'max={80}', 'Blur strength control should cap at 80.');
assertBlockIncludes(blurStrengthControl, 'defaultValue={recommendation.blurStrength}', 'Blur strength reset should use the current theme blur recommendation.');
assertBlockIncludes(blurStrengthControl, 'resetTitle={resetToThemeDefaultTitle}', 'Blur strength control should use the theme-default reset tooltip.');
assertBlockIncludes(blurStrengthControl, "onChange={(value) => updatePersonalization('blurStrength', value)}", 'Blur strength control should update blurStrength.');

const radiusControl = extractSelfClosingJsx(settingsPanel, 'RangeControl', 'label={text.radius}');
assertBlockIncludes(radiusControl, "onChange={(value) => updatePersonalization('radius', value)}", 'Radius control should update the radius personalization setting.');
assertBlockIncludes(radiusControl, 'defaultValue={recommendation.radius}', 'Radius reset should use the current theme radius.');
assertBlockIncludes(radiusControl, 'resetTitle={resetToThemeDefaultTitle}', 'Radius control should use the theme-default reset tooltip.');
assert.doesNotMatch(
  settingsPanel,
  /<h3>\{text\.opacityRecommendations\}<\/h3>/,
  'The old separate opacity recommendation section should be removed from Appearance.'
);

const appCssVars = [
  '--window-opacity',
  '--top-opacity',
  '--card-opacity',
  '--control-opacity',
  '--input-opacity',
  '--dialog-opacity',
  '--menu-opacity',
  '--settings-panel-opacity',
  '--glass-saturation',
];

for (const cssVar of appCssVars) {
  assertBlockIncludes(appViewportStyle, `'${cssVar}':`, `App viewport style helper should expose ${cssVar}.`);
}

assertBlockIncludes(
  appViewportStyle,
  'satisfies CSSProperties',
  'App viewport style helper should type the CSS variable object.'
);

const meaningfulCssConsumers: Array<[string, RegExp, string]> = [
  ['.app-shell', /var\(--window-opacity\)/, 'App shell should use --window-opacity.'],
  ['.app-shell', /var\(--glass-saturation\)/, 'App shell blur should use --glass-saturation.'],
  ['.dark .app-shell', /var\(--window-opacity\)/, 'Dark app shell should use --window-opacity.'],
  ['.app-top', /var\(--top-opacity\)/, 'Top area should use --top-opacity.'],
  ['.task-card', /var\(--card-opacity\)/, 'Light task cards should use --card-opacity.'],
  ['.task-toolbar', /var\(--card-opacity\)|var\(--control-opacity\)/, 'Task toolbar should use opacity variables.'],
  ['.dark .task-toolbar', /var\(--card-opacity\)|var\(--control-opacity\)/, 'Dark task toolbar should use opacity variables.'],
  ['.add-task-container', /var\(--input-opacity\)/, 'Light input containers should use --input-opacity.'],
  ['.dark .add-task-container', /var\(--input-opacity\)/, 'Dark input containers should use --input-opacity.'],
  ['.settings-panel', /var\(--settings-panel-opacity\)/, 'Light settings panel should use --settings-panel-opacity.'],
  ['.dark .settings-panel', /var\(--settings-panel-opacity\)/, 'Dark settings panel should use --settings-panel-opacity.'],
  ['.priority-popover', /var\(--menu-opacity\)/, 'Light menu popovers should use --menu-opacity.'],
  ['.dark .priority-popover', /var\(--menu-opacity\)/, 'Dark menu popovers should use --menu-opacity.'],
  ['.completion-dialog', /var\(--dialog-opacity\)/, 'Light dialogs should use --dialog-opacity.'],
  ['.dark .completion-dialog', /var\(--dialog-opacity\)/, 'Dark dialogs should use --dialog-opacity.'],
  ['.theme-neumorphism .settings-panel', /var\(--settings-panel-opacity\)/, 'Neumorphism settings panel should use --settings-panel-opacity.'],
  ['.theme-neumorphism .completion-dialog', /var\(--dialog-opacity\)/, 'Neumorphism completion dialog should use --dialog-opacity.'],
  ['.dark .theme-minimal .task-card', /var\(--card-opacity\)/, 'Dark minimal task cards should use --card-opacity.'],
  ['.dark .theme-minimal .task-toolbar', /var\(--card-opacity\)/, 'Dark minimal task toolbar should use --card-opacity.'],
  ['.theme-dark-mode.dark .task-toolbar', /var\(--card-opacity\)|var\(--control-opacity\)/, 'Dark mode task toolbar should use opacity variables.'],
  ['.theme-dark-mode.dark .settings-panel', /var\(--settings-panel-opacity\)/, 'Dark mode settings panel should use --settings-panel-opacity.'],
  ['.theme-invisible .settings-panel', /var\(--settings-panel-opacity\)/, 'Invisible settings panel should use --settings-panel-opacity.'],
  ['.theme-invisible .priority-popover', /var\(--menu-opacity\)/, 'Invisible priority popover should use --menu-opacity.'],
  ['.theme-invisible .completion-dialog', /var\(--dialog-opacity\)/, 'Invisible completion dialog should use --dialog-opacity.'],
  ['.dark .theme-invisible .settings-panel', /var\(--settings-panel-opacity\)/, 'Dark invisible settings panel should use --settings-panel-opacity.'],
  ['.dark .theme-invisible .priority-popover', /var\(--menu-opacity\)/, 'Dark invisible priority popover should use --menu-opacity.'],
  ['.dark .theme-invisible .completion-dialog', /var\(--dialog-opacity\)/, 'Dark invisible completion dialog should use --dialog-opacity.'],
];

for (const [selector, expected, message] of meaningfulCssConsumers) {
  assertSelectorUses(selector, expected, message);
}

assert.match(
  electronMain,
  /function applyNativeBackgroundMaterial\(win: BrowserWindow\)/,
  'Electron main should define a native background material progressive enhancement helper.'
);
assert.match(
  electronMain,
  /setBackgroundMaterial/,
  'Native material helper should attempt Electron setBackgroundMaterial when available.'
);
assert.match(
  electronMain,
  /setBackgroundMaterial\('none'\)/,
  'Native material helper should disable fixed OS material so CSS blur strength controls glass strength.'
);
assert.match(
  electronMain,
  /try \{[\s\S]*setBackgroundMaterial[\s\S]*\} catch/s,
  'Native material helper should guard unsupported platforms and APIs with try/catch.'
);
assert.match(
  electronMain,
  /applyNativeBackgroundMaterial\(win\);/,
  'Main window creation should call the native material helper after BrowserWindow creation.'
);
assert.match(
  electronMain,
  /transparent: true,[\s\S]*backgroundColor: '#00000000'/,
  'Main window should preserve transparent fallback settings.'
);

assertSelectorBlockUses(
  '.task-card',
  /backdrop-filter:\s*blur\(calc\(var\(--blur-strength\) \* 0\.22\)\)/,
  'Task cards should use much less local blur than the app shell.'
);
assertSelectorBlockUses(
  '.task-card',
  /color-mix\(in srgb, rgba\(255, 255, 255, var\(--card-opacity\)\) 38%, transparent\)/,
  'Light task cards should soften --card-opacity instead of using it as a full opaque card fill.'
);
assertSelectorBlockUses(
  '.dark .task-card',
  /background:\s*transparent\s*!important/,
  'Dark task cards should be transparent so they do not draw black blocks behind rows.'
);
assertSelectorBlockUses(
  ".app-shell[data-theme='invisible'] .task-toolbar",
  /background(?:-color)?:\s*transparent\s*!important[\s\S]*backdrop-filter:\s*none\s*!important/,
  'Invisible task toolbar should match the surrounding transparent pane instead of drawing a separate black/white glass block.'
);
assertSelectorBlockUses(
  ".app-shell[data-theme='invisible'] .task-search-input",
  /background(?:-color)?:[\s\S]*!important[\s\S]*backdrop-filter:\s*none\s*!important/,
  'Invisible task toolbar inputs should avoid their own blur layer.'
);
assertSelectorBlockUses(
  ".app-shell[data-theme='invisible'] .add-task-inner",
  /background(?:-color)?:\s*transparent\s*!important|box-shadow:\s*none\s*!important/,
  'Invisible add-task shell should match the surrounding transparent pane while the text input remains a readable field.'
);
assertSelectorDoesNotUse(
  '.task-card:hover',
  /background:\s*rgba\(255, 255, 255, var\(--card-opacity\)\)/,
  'Light task card hover should not restore a full card-opacity white block.'
);
assertSelectorDoesNotUse(
  '.dark .task-card:hover',
  /background:\s*rgba\(38, 40, 43, var\(--card-opacity\)\)/,
  'Dark task card hover should not restore a full card-opacity dark block.'
);
assertSelectorBlockUses(
  '.theme-invisible.app-shell',
  /var\(--window-opacity\)/,
  'Invisible shell should keep using --window-opacity so the existing slider still controls the pane.'
);
assertSelectorBlockUses(
  '.theme-invisible.app-shell',
  /var\(--blur-strength\)/,
  'Invisible shell should keep using --blur-strength so blur controls still affect the main pane.'
);

console.log('verify-frosted-glass-opacity-controls passed');
