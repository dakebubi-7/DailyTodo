import { strict as assert } from 'node:assert';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const titleBarPath = join(root, 'src/components/TitleBar.tsx');
const hookPath = join(root, 'src/components/useTitleBarMoreMenu.ts');
const titleBarSource = readFileSync(titleBarPath, 'utf8');

assert.ok(existsSync(hookPath), 'TitleBar more-menu lifecycle should live in a focused hook.');

const hookSource = readFileSync(hookPath, 'utf8');

assert.match(
  hookSource,
  /export function useTitleBarMoreMenu\b/,
  'More-menu lifecycle hook should have a focused export.',
);
assert.match(
  hookSource,
  /event\.target instanceof Element \? event\.target : null/,
  'More-menu outside-click handling should guard pointer event targets before closest().',
);
assert.match(
  hookSource,
  /target\?\.closest\('\.titlebar-more-wrap'\)/,
  'More-menu outside-click handling should preserve the titlebar menu boundary.',
);
assert.match(
  hookSource,
  /window\.electronAPI\?\.resetPosition\(\)/,
  'More-menu hook should keep the existing reset-position action.',
);
assert.match(
  hookSource,
  /setMoreOpen\(false\)/,
  'More-menu hook should close after outside clicks and reset actions.',
);

assert.match(
  titleBarSource,
  /import \{ useTitleBarMoreMenu \} from '\.\/useTitleBarMoreMenu';/,
  'TitleBar should compose the focused more-menu lifecycle hook.',
);
assert.match(
  titleBarSource,
  /const \{ moreOpen, toggleMoreMenu, resetPosition \} = useTitleBarMoreMenu\(\);/,
  'TitleBar should render using the more-menu hook state and actions.',
);
assert.doesNotMatch(
  titleBarSource,
  /const \[moreOpen, setMoreOpen\] = useState\(false\)/,
  'TitleBar should not retain inline more-menu state.',
);
assert.doesNotMatch(
  titleBarSource,
  /document\.addEventListener\('pointerdown', handlePointerDown\)/,
  'TitleBar should not retain the more-menu document listener.',
);

console.log('TitleBar more-menu hook verification passed');
