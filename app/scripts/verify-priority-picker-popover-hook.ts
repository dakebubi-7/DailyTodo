import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const pickerPath = join(root, 'src/components/PriorityPicker.tsx');
const hookPath = join(root, 'src/components/priorityPicker/usePriorityPickerPopover.ts');
const pickerSource = readFileSync(pickerPath, 'utf8');

assert.ok(existsSync(hookPath), 'PriorityPicker popover lifecycle should live in a focused hook.');

const hookSource = readFileSync(hookPath, 'utf8');

assert.match(
  hookSource,
  /export function usePriorityPickerPopover\b/,
  'PriorityPicker popover hook should have a focused export.',
);
assert.match(
  hookSource,
  /buttonRef = useRef<HTMLButtonElement>\(null\)/,
  'Popover hook should own the trigger reference.',
);
assert.match(
  hookSource,
  /popoverRef = useRef<HTMLDivElement>\(null\)/,
  'Popover hook should own the popover reference.',
);
assert.match(
  hookSource,
  /event\.target instanceof Node \? event\.target : null/,
  'Popover hook should retain guarded outside-click target handling.',
);
assert.match(
  hookSource,
  /window\.requestAnimationFrame/, 
  'Popover hook should retain frame-coalesced repositioning.',
);
assert.match(
  hookSource,
  /window\.cancelAnimationFrame/, 
  'Popover hook should cancel pending repositioning during cleanup.',
);
assert.match(
  hookSource,
  /window\.addEventListener\('scroll', handleReposition, true\)/,
  'Popover hook should preserve capture-phase scroll repositioning.',
);

assert.match(
  pickerSource,
  /import \{ usePriorityPickerPopover \} from '\.\/priorityPicker\/usePriorityPickerPopover';/,
  'PriorityPicker should compose the focused popover lifecycle hook.',
);
assert.match(
  pickerSource,
  /const \{ buttonRef, isOpen, popoverRef, position, togglePopover, closePopover \} = usePriorityPickerPopover\(\);/,
  'PriorityPicker should render with popover hook state and actions.',
);
assert.doesNotMatch(
  pickerSource,
  /const repositionFrameRef = useRef<number \| undefined>\(undefined\)/,
  'PriorityPicker should not retain inline popover reposition lifecycle state.',
);
assert.doesNotMatch(
  pickerSource,
  /document\.addEventListener\('pointerdown', handlePointerDown\)/,
  'PriorityPicker should not retain the document outside-click listener.',
);

console.log('PriorityPicker popover hook verification passed');
