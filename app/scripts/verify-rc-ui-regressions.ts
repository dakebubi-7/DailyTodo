import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dailyWorkPanel = readFileSync(join(root, 'src/components/DailyWorkPanel.tsx'), 'utf8');
const globalsCss = readFileSync(join(root, 'src/styles/globals.css'), 'utf8');
const appTsx = readFileSync(join(root, 'src/App.tsx'), 'utf8');
const appShellComposition = readFileSync(join(root, 'src/app/useAppShellComposition.ts'), 'utf8');
const appTaskView = readFileSync(join(root, 'src/app/appTaskView.ts'), 'utf8');
const titleBar = readFileSync(join(root, 'src/components/TitleBar.tsx'), 'utf8');
const dailyWorkPanelCommands = readFileSync(join(root, 'src/components/dailyWorkPanel/useDailyWorkPanelCommands.ts'), 'utf8');

function assert(condition: unknown, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

assert(
  dailyWorkPanel.includes('taskCommands') && dailyWorkPanel.includes('insertTaskMarkdown'),
  'DailyWorkPanel slash menu must be task-based, not fixed template commands.',
);
assert(
  dailyWorkPanel.includes('taskCommands: Task[]') && !dailyWorkPanel.includes('const taskCommands = useMemo'),
  'DailyWorkPanel should consume the shared command ordering instead of sorting the same tasks per panel.',
);

assert(
  !dailyWorkPanel.includes('text.commands.today') &&
    !dailyWorkPanel.includes('text.commands.open') &&
    !dailyWorkPanel.includes('text.commands.completed') &&
    !dailyWorkPanel.includes('text.commands.review'),
  'DailyWorkPanel still exposes fixed slash template commands.',
);

assert(
  dailyWorkPanel.includes('insertDailyCommandMarkdown') &&
    dailyWorkPanelCommands.includes('shouldOpenDailyCommandMenu') &&
    !dailyWorkPanel.includes('value.endsWith'),
  'DailyWorkPanel slash commands must follow the cursor instead of only opening at the end of the text.',
);

assert(
  globalsCss.includes('resize: vertical;') &&
    globalsCss.includes('overscroll-behavior: contain') &&
    globalsCss.includes('.daily-dialog-expanded .daily-dialog-textarea') &&
    globalsCss.includes('daily-dialog-textarea-command-open'),
  'Daily dialog textarea must be resizable, visibly focused, and keep expanded layout stable.',
);

assert(
  globalsCss.includes('position: fixed') &&
    globalsCss.includes('width: 100vw') &&
    globalsCss.includes('height: 100vh') &&
    globalsCss.includes('inset: 0'),
  'Root app shell must explicitly cover the transparent BrowserWindow viewport.',
);

assert(
  appShellComposition.includes('selectedDateTasksForCommands') &&
    appTaskView.includes('selectedDateTasksForCommands: selectedDateTaskCommands') &&
    !appTsx.includes('const selectedDateTasksForCommands = allTasks.filter'),
  'Slash task source should flow from the selected-date task list through the extracted task-view composition.',
);

assert(
  titleBar.includes('titlebar-drag-space') &&
    titleBar.includes("WebkitAppRegion: lockWindowPosition ? 'no-drag' : 'drag'") &&
    globalsCss.includes('.titlebar-drag-space'),
  'TitleBar must keep a dedicated drag spacer so the window remains movable at narrow widths.',
);

assert(
  !titleBar.includes('onMouseLeave={() => setMoreOpen(false)}'),
  'TitleBar more menu must not close on hover-leave before the reset item can be clicked.',
);

assert(
  globalsCss.includes('.titlebar-actions-primary') &&
    globalsCss.includes('.titlebar-actions-window') &&
    globalsCss.includes('@media (max-width: 320px)') &&
    globalsCss.includes('.titlebar-actions-primary') &&
    globalsCss.includes('display: none'),
  'Narrow titlebar layout must hide non-critical controls before window controls overflow or leave blank hit gaps.',
);

assert(
  globalsCss.includes('right: calc(-0.15rem)') &&
    globalsCss.includes('top: calc(100% + 0.15rem)') &&
    globalsCss.includes('z-index: 400'),
  'Titlebar more menu must stay close to its trigger with a high stacking layer for reliable clicking.',
);

console.log('RC UI regression verification passed');
