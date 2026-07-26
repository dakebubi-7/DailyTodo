import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const invisibleGlass = readFileSync(join(root, 'shared/invisibleGlass.ts'), 'utf8').replace(/\r\n/g, '\n');
const themePresets = readFileSync(join(root, 'src/types/themePresets.ts'), 'utf8').replace(/\r\n/g, '\n');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8').replace(/\r\n/g, '\n');
const marker = '/* Invisible theme glass convergence: native Acrylic supplies desktop blur; opacity is continuous; CSS only tints the foreground. */';
const start = globals.indexOf(marker);
const endMarker = '/* End invisible theme glass convergence. */';

assert.notEqual(start, -1, 'Invisible theme needs one final glass-convergence block.');

const end = globals.indexOf(endMarker, start);
assert.notEqual(end, -1, 'Invisible glass convergence needs an explicit end marker.');
const convergence = globals.slice(start, end + endMarker.length);

for (const selector of [
  ".app-shell[data-theme='invisible']",
  ".app-shell[data-theme='invisible'] .titlebar",
  ".app-shell[data-theme='invisible'] .app-top",
  ".app-shell[data-theme='invisible'] .task-card",
  ".app-shell[data-theme='invisible'] .task-toolbar",
  ".app-shell[data-theme='invisible'] .compact-day-strip",
  ".app-shell[data-theme='invisible'] .compact-day-summary",
  ".app-shell[data-theme='invisible'] .compact-day-progress-track",
  ".app-shell[data-theme='invisible'] .task-daily-panels",
  ".app-shell[data-theme='invisible'] .task-daily-action",
  ".app-shell[data-theme='invisible'] .task-filter-controls",
  ".app-shell[data-theme='invisible'] .task-view-launcher",
  ".app-shell[data-theme='invisible'] .task-view-menu-popover",
  ".app-shell[data-theme='invisible'] .settings-panel",
  ".settings-v2-sidebar",
  ".settings-v2-content",
  ".settings-v2-page :is(.settings-section, .settings-zone, .settings-inline-section)",
  ".settings-preview-list",
  ".settings-rule-card",
  ".settings-nav-item",
  ".settings-switch-row",
  ".settings-reset-button",
  ".settings-field input",
  ".completion-field",
  ".review-field",
  ".app-shell[data-theme='invisible'] :is(.task-search-input, .task-filter-button, .task-filter-select, .task-clear-filter, .task-tool-icon)",
  ".titlebar-menu",
  ".priority-popover",
  ".month-calendar",
  ".completion-dialog",
  ".review-dialog",
]) {
  assert.ok(convergence.includes(selector), `Invisible glass convergence should cover ${selector}.`);
}

assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\] \{[\s\S]*?backdrop-filter:\s*none\s*!important/,
  'Invisible app shell should avoid live CSS backdrop-filter so window drag stays fluid over acrylic.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\]\[data-glass-fallback='css'\] \{[\s\S]*?backdrop-filter:\s*blur\(18px\) saturate\(var\(--glass-saturation\)\)\s*!important[\s\S]*?-webkit-backdrop-filter:\s*blur\(18px\) saturate\(var\(--glass-saturation\)\)\s*!important/,
  'Invisible shell should restore one CSS blur plate only when native material is unavailable.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\] \.task-card \{[\s\S]*?backdrop-filter:\s*none\s*!important/,
  'Invisible nested transparent surfaces should avoid stacked blur so shell blur stays continuous.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\] \.compact-day-strip,[\s\S]*?\.app-shell\[data-theme='invisible'\] \.task-view-menu-popover \{[\s\S]*?background:\s*transparent\s*!important[\s\S]*?backdrop-filter:\s*none\s*!important/,
  'Invisible compact day and task-workspace surfaces should inherit the one shell plate.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\] \.settings-panel,[\s\S]*?backdrop-filter:\s*none\s*!important/,
  'Invisible floating surfaces should avoid nested backdrop-filter so blur drag stays smooth.',
);
assert.doesNotMatch(
  convergence,
  /\.app-shell\[data-theme='invisible'\] > \* \{[\s\S]*?position:\s*relative;/,
  'Invisible frost stacking must not force every direct child into relative flow, or the absolute settings panel collapses into the column and overflows.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\] > \.settings-panel \{[\s\S]*?position:\s*absolute;/,
  'Invisible settings panel must stay absolutely positioned over the compact left strip.',
);
assert.match(
  convergence,
  /--invisible-frost-mix/,
  'Invisible shell should expose a continuous frost mix so intermediate blur steps stay visible over acrylic.',
);
assert.doesNotMatch(
  convergence,
  /--invisible-frost-mix:\s*0;/,
  'Invisible shell must inherit continuous frost mix from the viewport; hard-resetting to 0 makes blur feel binary.',
);
assert.doesNotMatch(
  convergence,
  /--invisible-surface-alpha:\s*var\(--window-opacity\);/,
  'Invisible shell must not overwrite continuous surface alpha with opacity-only window alpha.',
);
assert.doesNotMatch(
  convergence,
  /--invisible-veil-alpha:\s*0;/,
  'Invisible shell must inherit continuous veil alpha from the viewport for stepless blur.',
);
assert.match(
  convergence,
  /var\(--invisible-veil-alpha/,
  'Frost veil should consume continuous veil alpha so blur densifies clear -> frosted -> solid.',
);
assert.match(
  convergence,
  /var\(--invisible-frost-mix/,
  'Frost veil should consume continuous frost mix for intermediate blur steps.',
);
assert.match(
  convergence,
  /--invisible-glass-surface-opacity:\s*max\(0\.92,\s*var\(--window-opacity\)\)/,
  'Floating settings surfaces stay high-opacity and readable, independent of blur densify.',
);
assert.match(
  convergence,
  /--invisible-surface-alpha/,
  'Invisible shell should expose continuous surface alpha for commercial frost feel.',
);
assert.match(
  convergence,
  /--invisible-veil-alpha/,
  'Invisible shell should expose continuous veil alpha for commercial frost feel.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\]::before/,
  'Invisible shell should keep a frost veil hook without live CSS backdrop-filter.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\]::before \{[\s\S]*?content:\s*none/,
  'Invisible frost veil must be disabled so shell opacity stays a single unified plate.',
);
assert.match(
  convergence,
  /--invisible-frost-mix/,
  'TickTick-style invisible shell must keep continuous frost reveal for the blur slider.',
);
assert.match(
  convergence,
  /--invisible-glass-surface-opacity:\s*max\(0\.92,\s*var\(--window-opacity\)\)/,
  'Invisible settings surfaces stay high-opacity and readable, independent of blur densify.',
);
assert.match(
  convergence,
  /--invisible-glass-control-opacity:\s*max\(0\.92,\s*var\(--window-opacity\)\)/,
  'Invisible settings controls stay high-opacity and readable, independent of blur densify.',
);
assert.doesNotMatch(
  convergence,
  /--invisible-glass-(?:surface|control)-opacity:\s*min\(var\(--window-opacity\),/,
  'Invisible glass convergence must not cap the user-selected opacity below the slider maximum.',
);
assert.match(
  convergence,
  /rgba\(250, 250, 252, var\(--invisible-glass-surface-opacity\)\)/,
  'Light invisible floating surfaces should not use a fixed opaque fill.',
);
assert.match(
  convergence,
  /rgba\(18, 20, 24, var\(--invisible-glass-surface-opacity\)\)/,
  'Dark invisible floating surfaces should not use a fixed opaque fill.',
);
assert.doesNotMatch(
  convergence,
  /rgba\([^)]*,\s*0\.(?:[3-9][0-9]|2[5-9])\)/,
  'Final invisible glass convergence must not reintroduce a heavy foreground tint over native Acrylic.',
);
assert.match(
  convergence,
  /\.app-shell\[data-theme='invisible'\] :is\(\.task-search-input, \.task-filter-button, \.task-filter-select, \.task-clear-filter, \.task-tool-icon\) \{[\s\S]*?background:\s*transparent\s*!important/,
  'Invisible task toolbar controls should inherit the one shell plate instead of painting individual glass chips.',
);

const lightInvisibleTextSelectors = [
  '.theme-invisible .app-brand h1',
  '.theme-invisible .task-text',
  '.theme-invisible .date-current',
];

for (const selector of lightInvisibleTextSelectors) {
  const selectorIndex = globals.lastIndexOf(`\n${selector}`);
  assert.notEqual(selectorIndex, -1, `Light invisible text selector should exist: ${selector}.`);
  const declarationEnd = globals.indexOf('}', selectorIndex);
  const declaration = globals.slice(selectorIndex, declarationEnd + 1);
  assert.match(
    declaration,
    /text-shadow:\s*none\s*!important/,
    `Light invisible text must not add a white readability halo: ${selector}.`,
  );
}

for (const [selector, color] of [
  ["html:not(.dark) .app-shell[data-theme='invisible'] :is(.app-brand h1, .task-text, .task-subtask-text, .date-current)", '#1f2937'],
  ["html:not(.dark) .app-shell[data-theme='invisible'] :is(.task-card-completed .task-text, .task-subtask-row-completed .task-subtask-text, .task-subtask-completed)", '#4b5563'],
  [".dark .app-shell[data-theme='invisible'] :is(.app-brand h1, .task-text, .task-subtask-text, .date-current)", '#f8fafc'],
  [".dark .app-shell[data-theme='invisible'] :is(.task-card-completed .task-text, .task-subtask-row-completed .task-subtask-text, .task-subtask-completed)", '#cbd5e1'],
] as const) {
  const selectorIndex = convergence.lastIndexOf(`\n${selector}`);
  assert.notEqual(selectorIndex, -1, `Invisible semantic text selector should exist: ${selector}.`);
  const declarationEnd = convergence.indexOf('}', selectorIndex);
  const declaration = convergence.slice(selectorIndex, declarationEnd + 1);
  assert.match(
    declaration,
    new RegExp(`color:\\s*${color}\\s*!important`),
    `Invisible semantic text selector should use readable ${color}: ${selector}.`,
  );
}

for (const selector of [
  ".app-shell[data-theme='invisible'] .task-card-completed .task-text-browse",
  ".app-shell[data-theme='invisible'] .task-subtask-row-completed .task-subtask-text",
  ".app-shell[data-theme='invisible'] .task-subtask-completed",
]) {
  const selectorIndex = convergence.lastIndexOf(`\n${selector}`);
  assert.notEqual(selectorIndex, -1, `Invisible completed text selector should exist: ${selector}.`);
  const declarationEnd = convergence.indexOf('}', selectorIndex);
  const declaration = convergence.slice(selectorIndex, declarationEnd + 1);
  assert.match(
    declaration,
    /text-decoration:\s*line-through\s*!important/,
    `Invisible completed text must keep its strikethrough: ${selector}.`,
  );
  assert.match(
    declaration,
    /opacity:\s*1\s*!important/,
    `Invisible completed text must not be faded by a completion opacity: ${selector}.`,
  );
}

assert.doesNotMatch(
  convergence,
  /\.app-shell\[data-theme='invisible'\] \.task-card-completed \.task-text\s*\{[\s\S]*?opacity:\s*1\s*!important/,
  'Invisible completed-task styles must not reveal the aria-hidden active title layer.',
);

assert.match(
  invisibleGlass,
  /export const DEFAULT_INVISIBLE_GLASS_OPACITY = 58;/,
  'Invisible glass default opacity should stay high enough for readable foreground tints.',
);
assert.match(
  invisibleGlass,
  /export function resolveNativeBlurTier\(/,
  'Invisible glass should keep native host acrylic helper available for diagnostics.',
);
assert.match(
  invisibleGlass,
  /type NativeBlurTier = 'off' \| 'on'/,
  'Native host acrylic stays theme-level on/off; continuous densify owns the blur slider feel.',
);
assert.match(
  invisibleGlass,
  /CSS_ASSIST_BLUR_MAX_PX = 18/,
  'Non-invisible CSS assist blur should keep a small max radius helper.',
);
assert.match(
  invisibleGlass,
  /export function resolveInvisibleFrostMix\(/,
  'Invisible glass should map the blur slider to continuous frost reveal.',
);
assert.match(
  invisibleGlass,
  /export function resolveInvisibleSurfaceAlpha\(/,
  'Invisible glass should map blur to continuous surface alpha.',
);
assert.match(
  invisibleGlass,
  /export function resolveInvisibleVeilAlpha\(/,
  'Invisible glass should map blur to continuous veil alpha.',
);
assert.match(
  invisibleGlass,
  /export function resolveCssAssistBlurPx\(/,
  'Invisible glass keeps a CSS blur helper for non-invisible themes.',
);
assert.match(
  invisibleGlass,
  /return \(blur \/ 100\) \* CSS_ASSIST_BLUR_MAX_PX;/,
  'CSS assist blur should scale continuously from the 0-100 slider without integer steps.',
);
assert.match(
  invisibleGlass,
  /ACCENT_ENABLE_BLURBEHIND/,
  'Enabled native host blur should use the lightweight BlurBehind material.',
);
assert.doesNotMatch(
  invisibleGlass,
  /captureDesktopBackdropForWindow|ContinuousDesktopBlurLayer/,
  'TickTick-style path must not keep wallpaper capture as the primary model.',
);
assert.match(
  invisibleGlass,
  /createAcrylicGradientColor\(opacityPercent: number\)/,
  'Native acrylic tint should track continuous opacity only.',
);
assert.match(
  invisibleGlass,
  /export function getNativeGlassHostSignature\(/,
  'Native host updates should key off a stable host signature, not every CSS blur step.',
);

assert.match(
  themePresets,
  /id:\s*'invisible'[\s\S]*?windowOpacity:\s*58,/,
  'Invisible theme preset should default to a readable window opacity.',
);
assert.doesNotMatch(
  themePresets,
  /id:\s*'invisible'[\s\S]*?windowOpacity:\s*3[0-9],/,
  'Invisible theme preset must not ship with a near-transparent default window opacity.',
);

assert.doesNotMatch(
  appTsx,
  /ContinuousDesktopBlurLayer/,
  'App shell should not mount the wallpaper continuous blur layer in TickTick-style mode.',
);
assert.equal(
  existsSync(join(root, 'src/app/ContinuousDesktopBlurLayer.tsx')),
  false,
  'Wallpaper continuous blur layer file should be removed.',
);
assert.equal(
  existsSync(join(root, 'electron/desktopBackdrop.ts')),
  false,
  'Desktop wallpaper capture module should be removed.',
);

console.log('verify-invisible-glass passed');


