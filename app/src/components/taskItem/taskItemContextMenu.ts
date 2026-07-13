import type { Task } from '../../types/task';

export type TaskContextMenuTheme = {
  themeId: string;
  accent: string;
  secondary: string;
  menuOpacity: number;
  blurStrength: number;
  cardRadius: number;
};

export type TaskContextMenuPayload = {
  task: Task;
  allTags: string[];
  screenX: number;
  screenY: number;
  isDark: boolean;
  theme: TaskContextMenuTheme;
};

type CssValueReader = Pick<CSSStyleDeclaration, 'getPropertyValue'> | null;

export function parseCssNumber(value: string, fallback: number, min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY): number {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback;
}

function normalizeScreenCoordinate(value: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

export function getThemeIdFromClassList(classList: Iterable<string> | null | undefined): string {
  if (!classList) return '';
  return Array.from(classList).find((className) => className.startsWith('theme-'))?.slice('theme-'.length) || '';
}

export function createTaskContextMenuTheme(options: {
  shellClassList?: Iterable<string> | null;
  themeStyle?: CssValueReader;
  viewportStyle?: CssValueReader;
}): TaskContextMenuTheme {
  const { shellClassList, themeStyle = null, viewportStyle = null } = options;

  return {
    themeId: getThemeIdFromClassList(shellClassList),
    accent: themeStyle?.getPropertyValue('--personal-accent').trim() || '#52525b',
    secondary: themeStyle?.getPropertyValue('--personal-secondary').trim() || '#a1a1aa',
    menuOpacity: viewportStyle ? parseCssNumber(viewportStyle.getPropertyValue('--menu-opacity'), 0.96, 0.3, 1) : 0.96,
    blurStrength: viewportStyle ? parseCssNumber(viewportStyle.getPropertyValue('--blur-strength'), 18, 0, 40) : 18,
    cardRadius: viewportStyle ? parseCssNumber(viewportStyle.getPropertyValue('--card-radius'), 12, 0, 32) : 12,
  };
}

export function createTaskContextMenuPayload(options: {
  task: Task;
  allTags: string[];
  screenX: number;
  screenY: number;
  isDark: boolean;
  theme: TaskContextMenuTheme;
}): TaskContextMenuPayload {
  return {
    task: options.task,
    allTags: options.allTags,
    screenX: normalizeScreenCoordinate(options.screenX),
    screenY: normalizeScreenCoordinate(options.screenY),
    isDark: options.isDark,
    theme: options.theme,
  };
}

export function createTaskContextMenuOpenPayload(options: {
  task: Task;
  allTags: string[];
  screenX: number;
  screenY: number;
  isDark: boolean;
  shellClassList?: Iterable<string> | null;
  themeStyle?: CssValueReader;
  viewportStyle?: CssValueReader;
}): TaskContextMenuPayload {
  const theme = createTaskContextMenuTheme({
    shellClassList: options.shellClassList,
    themeStyle: options.themeStyle,
    viewportStyle: options.viewportStyle,
  });

  return createTaskContextMenuPayload({
    task: options.task,
    allTags: options.allTags,
    screenX: normalizeScreenCoordinate(options.screenX),
    screenY: normalizeScreenCoordinate(options.screenY),
    isDark: options.isDark,
    theme,
  });
}
