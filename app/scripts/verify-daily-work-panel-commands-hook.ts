import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const panelPath = join(root, 'src/components/DailyWorkPanel.tsx');
const hookPath = join(root, 'src/components/dailyWorkPanel/useDailyWorkPanelCommands.ts');
const panelSource = readFileSync(panelPath, 'utf8');

assert.ok(existsSync(hookPath), 'DailyWorkPanel command-menu hook module should exist.');

const hookSource = readFileSync(hookPath, 'utf8');

assert.match(
  hookSource,
  /export function useDailyWorkPanelCommands\b/,
  'Command-menu state should have a dedicated hook export.',
);
assert.match(
  hookSource,
  /shouldOpenDailyCommandMenu/,
  'Command hook should own slash-trigger detection.',
);
assert.match(
  hookSource,
  /event\.key === 'Escape'/,
  'Command hook should close the menu on Escape.',
);
assert.match(
  hookSource,
  /event\.key === 'ArrowUp' \|\| event\.key === 'ArrowDown'/,
  'Command hook should own arrow-key menu navigation.',
);
assert.match(
  hookSource,
  /setCommandIndex\(0\)/,
  'Command hook should reset the selected command index when it closes or opens.',
);

assert.match(
  panelSource,
  /import \{ useDailyWorkPanelCommands \} from '\.\/dailyWorkPanel\/useDailyWorkPanelCommands';/,
  'DailyWorkPanel should compose the dedicated command-menu hook.',
);
assert.match(
  panelSource,
  /const \{ commandOpen, commandIndex, closeCommandMenu, handleCommandTextChange, handleCommandKeyDown, setCommandIndex \} = useDailyWorkPanelCommands\(/,
  'DailyWorkPanel should use command-menu state and routing from the hook.',
);
assert.doesNotMatch(
  panelSource,
  /const \[commandOpen, setCommandOpen\] = useState\(false\)|const \[commandIndex, setCommandIndex\] = useState\(0\)/,
  'DailyWorkPanel should not retain inline command-menu state.',
);

console.log('DailyWorkPanel command-menu hook verification passed');
