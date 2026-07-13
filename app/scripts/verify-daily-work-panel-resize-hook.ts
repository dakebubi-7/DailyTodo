import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const panelPath = join(root, 'src/components/DailyWorkPanel.tsx');
const hookPath = join(root, 'src/components/dailyWorkPanel/useDailyWorkPanelResize.ts');
const panelSource = readFileSync(panelPath, 'utf8');

assert.ok(existsSync(hookPath), 'DailyWorkPanel resize lifecycle hook module should exist.');

const hookSource = readFileSync(hookPath, 'utf8');

assert.match(
  hookSource,
  /export function useDailyWorkPanelResize\b/,
  'Resize lifecycle should have a dedicated hook export.',
);
assert.match(
  hookSource,
  /useState\(64\)/,
  'Resize hook should preserve the initial 64px editor height.',
);
assert.match(
  hookSource,
  /MIN_EDITOR_HEIGHT\s*=\s*56/,
  'Resize hook should preserve the 56px minimum editor height.',
);
assert.match(
  hookSource,
  /MAX_EDITOR_HEIGHT\s*=\s*480/,
  'Resize hook should preserve the 480px maximum editor height.',
);
assert.match(
  hookSource,
  /window\.removeEventListener\('pointermove', onMove\)/,
  'Resize hook should remove the pointermove listener when dragging ends.',
);
assert.match(
  hookSource,
  /window\.removeEventListener\('pointerup', onUp\)/,
  'Resize hook should remove the pointerup listener when dragging ends.',
);

assert.match(
  panelSource,
  /import \{ useDailyWorkPanelResize \} from '\.\/dailyWorkPanel\/useDailyWorkPanelResize';/,
  'DailyWorkPanel should compose the dedicated resize hook.',
);
assert.match(
  panelSource,
  /const \{ editorHeight, startResize \} = useDailyWorkPanelResize\(textareaRef\);/,
  'DailyWorkPanel should use the hook height and pointer handler.',
);
assert.doesNotMatch(
  panelSource,
  /const \[editorHeight, setEditorHeight\] = useState\(64\)|const startResize = \(event:/,
  'DailyWorkPanel should not retain inline resize state or pointer lifecycle.',
);

console.log('DailyWorkPanel resize hook verification passed');
