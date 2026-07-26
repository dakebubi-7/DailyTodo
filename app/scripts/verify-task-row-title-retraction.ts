import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCleanupCoreIncludes } from './verifyCleanupCore';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const taskItem = readFileSync(join(root, 'src/components/TaskItem.tsx'), 'utf8');
const controls = readFileSync(join(root, 'src/components/taskItem/taskItemControls.tsx'), 'utf8');
const actionControls = readFileSync(join(root, 'src/components/taskItem/taskItemActionControls.tsx'), 'utf8');
const globals = readFileSync(join(root, 'src/styles/globals.css'), 'utf8').replace(/\r\n/g, '\n');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  scripts: Record<string, string>;
};
const normalCardSelector = '.task-card:not(.history-cleanup-task-card)';
const normalCardInteractiveSelector = `${normalCardSelector}:is(:hover, :focus-within)`;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readCssRange(css: string, selector: string): { start: number; end: number; content: string } {
  const selectorPattern = new RegExp(`^[ \\t]*${escapeRegExp(selector)}[ \\t]*\\{`, 'gm');
  let selectorMatch: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;

  while ((match = selectorPattern.exec(css)) !== null) {
    selectorMatch = match;
  }

  assert.ok(selectorMatch?.index !== undefined, `CSS should define ${selector}.`);
  const selectorStart = selectorMatch.index;

  const blockStart = css.indexOf('{', selectorStart + selectorMatch[0].length - 1);
  assert.notEqual(blockStart, -1, `CSS rule for ${selector} should open a declaration block.`);

  let depth = 1;
  for (let index = blockStart + 1; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') depth -= 1;
    if (depth === 0) {
      return {
        start: selectorStart,
        end: index + 1,
        content: css.slice(blockStart + 1, index),
      };
    }
  }

  assert.fail(`CSS rule for ${selector} should close its declaration block.`);
}

function readCssBlock(css: string, selector: string): string {
  return readCssRange(css, selector).content;
}

function assertRuleIncludes(selector: string, declarations: string[], message: string, css = globals): void {
  const block = readCssBlock(css, selector);
  for (const declaration of declarations) {
    assert.match(block, new RegExp(`(?:^|\\n)\\s*${escapeRegExp(declaration)}`), `${message}: ${declaration}`);
  }
}

function assertCssDoesNotDefine(css: string, selector: string, message: string): void {
  assert.doesNotMatch(css, new RegExp(`^[ \\t]*${escapeRegExp(selector)}[ \\t]*\\{`, 'm'), message);
}

assert.ok(controls.includes('className="task-text task-text-browse"'), 'Browse mode should render the visible two-line task title.');
assert.match(controls, /className="task-text task-text-active"\s+aria-hidden="true"/s, 'Active title should remain available as an aria-hidden one-line layout layer.');
assert.match(
  controls,
  /<span(?=[^>]*className="task-text-row")(?=[^>]*title=\{getTaskTextTitle\(task\)\})(?=[^>]*onDoubleClick=\{onStartEdit\})[^>]*>\s*<span\s+className="task-text task-text-browse">\s*\{task\.text\}\s*<\/span>\s*<span\s+className="task-text task-text-active"\s+aria-hidden="true">\s*\{task\.text\}\s*<\/span>\s*<\/span>/,
  'The title row should own its tooltip and double-click behavior around browse and aria-hidden active title layers.',
);
assert.match(controls, /export function DragHandleButton[\s\S]*?return \(\s*<span\s+className="task-drag-slot">\s*<button[\s\S]*?className="task-drag-handle"/, 'DragHandleButton should own the drag-slot wrapper around its drag-handle button.');
assert.doesNotMatch(taskItem, /task-cluster-main-spacer/, 'Task rows should no longer retain the removed cluster main spacer.');
assert.match(taskItem, /!isCleanupMode && \([\s\S]*?<TaskActionLayer/, 'History cleanup mode should continue to guard the action layer.');
assert.match(taskItem, /from '\.\/taskItem\/taskItemActionControls'/, 'TaskItem should retain action-layer module ownership.');
assert.match(actionControls, /export function TaskActionLayer\b/, 'The focused action-controls module should continue to own TaskActionLayer.');

assertRuleIncludes('.task-card-no-children', ['grid-template-columns: auto auto auto minmax(0, 1fr) !important;'], 'No-child task cards should use the four-column row grid.');
assertRuleIncludes('.task-card-has-children', ['grid-template-columns: auto auto auto minmax(0, 1fr) !important;'], 'Task cards with children should use the four-column row grid.');
assertRuleIncludes('.task-card > .task-text-wrap,\n.task-card > .task-edit-input', ['grid-column: 4 !important;'], 'Task content and editing should occupy grid column 4.');
const preciseHoverRange = readCssRange(globals, '@media (hover: hover) and (pointer: fine)');
const preciseHover = preciseHoverRange.content;
const outsidePreciseHover = `${globals.slice(0, preciseHoverRange.start)}${globals.slice(preciseHoverRange.end)}`;
const touchFallback = `@media (hover: none), (pointer: coarse)`;
const touchFallbackCss = readCssBlock(globals, touchFallback);
assertRuleIncludes(`${normalCardSelector} > .task-action-layer`, ['opacity: 1;', 'pointer-events: auto;'], 'Normal task cards without fine hover should keep their action layer visible and interactive.', touchFallbackCss);
assertRuleIncludes(`${normalCardSelector} > .task-action-layer .task-delete-action`, ['opacity: 1;', 'pointer-events: auto;'], 'Normal task cards without fine hover should keep delete reachable.', touchFallbackCss);
assertRuleIncludes(normalCardSelector, ['--task-row-action-space: 0rem;', 'padding-right: calc(0.5rem + var(--task-row-action-space)) !important;'], 'Idle normal task cards should reserve trailing space through the action-space variable.', preciseHover);
assertRuleIncludes(`${normalCardSelector} > .task-action-layer`, ['opacity: 0;', 'pointer-events: none;'], 'Idle task action space should be hidden and non-interactive.', preciseHover);
assertRuleIncludes(`${normalCardSelector} > .task-drag-slot`, ['width: 0;'], 'Idle normal task cards should retract the drag slot.', preciseHover);
assertRuleIncludes(`${normalCardSelector} > .task-text-wrap .task-text-browse`, ['display: -webkit-box;', 'overflow: hidden;', '-webkit-box-orient: vertical;', '-webkit-line-clamp: 2;'], 'Normal task cards should render browse titles as two-line clamps.', preciseHover);
assertRuleIncludes(`${normalCardSelector} > .task-text-wrap .task-text-active`, ['display: block;', 'overflow: hidden;', 'text-overflow: ellipsis;', 'white-space: nowrap;', 'opacity: 0;'], 'Normal task cards should render active titles as one-line ellipses until hover or focus.', preciseHover);
assertRuleIncludes(normalCardInteractiveSelector, ['--task-row-action-space: var(--task-action-safe-space);'], 'Normal hover/focus cards should reserve action space.', preciseHover);
assertRuleIncludes(`${normalCardInteractiveSelector} > .task-action-layer`, ['opacity: 1;', 'pointer-events: auto;'], 'Normal hover/focus cards should reveal their exact action layer.', preciseHover);
assertRuleIncludes(`${normalCardInteractiveSelector} > .task-drag-slot:has(.task-drag-handle:not(:disabled))`, ['width: 0.95rem;'], 'Normal hover/focus cards should reveal the enabled drag slot.', preciseHover);
assertRuleIncludes(`${normalCardInteractiveSelector} > .task-text-wrap .task-text-browse`, ['opacity: 0;'], 'Normal hover/focus cards should hide browse titles.', preciseHover);
assertRuleIncludes(`${normalCardInteractiveSelector} > .task-text-wrap .task-text-active`, ['opacity: 1;'], 'Normal hover/focus cards should reveal active titles.', preciseHover);
assertRuleIncludes(`${normalCardInteractiveSelector} > .task-text-wrap > .task-text-row`, ['height: 1.25em;'], 'Normal hover/focus cards should retract the title row to one line.', preciseHover);
for (const selector of [
  normalCardInteractiveSelector,
  `${normalCardInteractiveSelector} > .task-action-layer`,
  `${normalCardInteractiveSelector} > .task-drag-slot:has(.task-drag-handle:not(:disabled))`,
  `${normalCardInteractiveSelector} > .task-text-wrap .task-text-browse`,
  `${normalCardInteractiveSelector} > .task-text-wrap .task-text-active`,
  `${normalCardInteractiveSelector} > .task-text-wrap > .task-text-row`,
]) {
  assertCssDoesNotDefine(outsidePreciseHover, selector, `Retraction-only selector ${selector} should stay inside precise-hover media.`);
}
assertRuleIncludes('.task-card.history-cleanup-task-card', ['grid-template-columns: auto minmax(0, 1fr) !important;', 'padding-right: 0.5rem !important;'], 'History cleanup task cards should have no normal action lane.');
assertRuleIncludes('.history-cleanup-task-card > .task-text-wrap,\n.history-cleanup-task-card > .task-edit-input', ['grid-column: 2 !important;'], 'History cleanup content and editing should occupy grid column 2.');
const reducedMotion = readCssBlock(globals, '@media (prefers-reduced-motion: reduce)');
assertRuleIncludes('.task-text-row', ['transition: none !important;'], 'Reduced motion should disable title-row transitions.', reducedMotion);
assertRuleIncludes('.task-drag-slot', ['transition: none !important;'], 'Reduced motion should disable drag-slot transitions.', reducedMotion);
assertRuleIncludes('.task-action-layer', ['transition: none !important;'], 'Reduced motion should disable action-layer transitions.', reducedMotion);

assert.equal(packageJson.scripts['verify:task-row-title-retraction'], 'tsx scripts/verify-task-row-title-retraction.ts', 'package.json should expose the focused task row title retraction verifier.');
assertCleanupCoreIncludes('verify:task-row-title-retraction', 'cleanup-core should include the focused task row title retraction verifier.');

console.log('Task row title retraction verification passed');
