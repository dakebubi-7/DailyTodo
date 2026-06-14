import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const settingsPanel = readFileSync(join(root, 'src/components/SettingsPanel.tsx'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8');

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

function extractAppViewportStyle(source: string) {
  const viewportSlice = extractAround(source, 'className={`app-viewport', 200, 2_400);
  const styleIndex = viewportSlice.indexOf('style={{');
  assert.notEqual(styleIndex, -1, 'App viewport should define an inline style object.');

  const firstBrace = viewportSlice.indexOf('{', styleIndex);
  assert.notEqual(firstBrace, -1, 'Could not find app viewport style opening brace.');

  let depth = 0;
  for (let index = firstBrace; index < viewportSlice.length; index += 1) {
    const char = viewportSlice[index];
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        const styleSlice = viewportSlice.slice(styleIndex, index + 1);
        assert.ok(styleSlice.includes('as CSSProperties'), 'App viewport style should be typed as CSSProperties.');
        return styleSlice;
      }
    }
  }

  throw new Error('Could not extract app viewport style object.');
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

const rangeControl = extractFunction(settingsPanel, 'function RangeControl({');
assertBlockIncludes(rangeControl, 'onDoubleClick={handleReset}', 'RangeControl should support double-click reset on the wrapping control.');
assertBlockIncludes(rangeControl, 'defaultValue', 'RangeControl should accept a reset default value.');
assertBlockIncludes(rangeControl, 'resetTitle', 'RangeControl should accept reset tooltip copy.');
assertBlockIncludes(rangeControl, /if \(typeof defaultValue === 'number'\) onChange\(defaultValue\)/, 'RangeControl should reset to defaultValue through onChange.');

assert.match(
  settingsPanel,
  /function getRecommendedOpacityRange\(recommended: number, min = OPACITY_SLIDER_MIN, max = OPACITY_SLIDER_MAX\)/,
  'SettingsPanel should define a deterministic recommended opacity range helper.'
);

const fontControl = extractSelfClosingJsx(settingsPanel, 'RangeControl', 'value={settings.fontScale ?? 100}');
assertBlockIncludes(fontControl, "onChange={(value) => updatePersonalization('fontScale', value)}", 'Global font control should update the fontScale personalization setting.');
assertBlockIncludes(fontControl, 'defaultValue={recommendation.fontScale ?? 100}', 'Global font reset should use the current theme font scale or 100.');
assertBlockIncludes(fontControl, 'resetTitle={resetToThemeDefaultTitle}', 'Global font control should use the theme-default reset tooltip.');

const radiusControl = extractSelfClosingJsx(settingsPanel, 'RangeControl', 'label={text.radius}');
assertBlockIncludes(radiusControl, "onChange={(value) => updatePersonalization('radius', value)}", 'Radius control should update the radius personalization setting.');
assertBlockIncludes(radiusControl, 'defaultValue={recommendation.radius}', 'Radius reset should use the current theme radius.');
assertBlockIncludes(radiusControl, 'resetTitle={resetToThemeDefaultTitle}', 'Radius control should use the theme-default reset tooltip.');

const opacityAreaControl = extractFunction(settingsPanel, 'function OpacityAreaControl(');
assertBlockIncludes(opacityAreaControl, '--recommended-start', 'Opacity controls should expose the recommended range start CSS variable.');
assertBlockIncludes(opacityAreaControl, '--recommended-end', 'Opacity controls should expose the recommended range end CSS variable.');
assertBlockIncludes(opacityAreaControl, 'settings-opacity-range-input', 'Opacity controls should use the recommended-range slider class.');
assert.doesNotMatch(
  settingsPanel,
  /<h3>\{text\.opacityRecommendations\}<\/h3>/,
  'The old separate opacity recommendation section should be removed from Appearance.'
);

const appViewportStyle = extractAppViewportStyle(app);

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
  assertBlockIncludes(appViewportStyle, `'${cssVar}':`, `App should expose ${cssVar} in the app viewport inline style object.`);
}

const meaningfulCssConsumers: Array<[string, RegExp, string]> = [
  ['.app-shell', /var\(--window-opacity\)/, 'App shell should use --window-opacity.'],
  ['.app-shell', /var\(--glass-saturation\)/, 'App shell blur should use --glass-saturation.'],
  ['.dark .app-shell', /var\(--window-opacity\)/, 'Dark app shell should use --window-opacity.'],
  ['.app-top', /var\(--top-opacity\)/, 'Top area should use --top-opacity.'],
  ['.task-card', /var\(--card-opacity\)/, 'Task cards should use --card-opacity.'],
  ['.dark .task-card', /var\(--card-opacity\)/, 'Dark task cards should use --card-opacity.'],
  ['.task-toolbar', /var\(--card-opacity\)/, 'Task toolbar should use --card-opacity.'],
  ['.dark .task-toolbar', /var\(--card-opacity\)/, 'Dark task toolbar should use --card-opacity.'],
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
  ['.theme-dark-mode.dark .task-card', /var\(--card-opacity\)/, 'Dark mode task cards should use --card-opacity.'],
  ['.theme-dark-mode.dark .task-toolbar', /var\(--card-opacity\)/, 'Dark mode task toolbar should use --card-opacity.'],
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

assertSelectorUses(
  '.settings-opacity-range-input::-webkit-slider-runnable-track',
  /linear-gradient[\s\S]*var\(--recommended-start\)[\s\S]*var\(--recommended-end\)/,
  'CSS should paint the recommended range directly on opacity slider tracks.'
);

console.log('verify-frosted-glass-opacity-controls passed');
