export type QuickCapturePriority = 'high' | 'medium' | 'low';

export type QuickCaptureDateIntent =
  | { kind: 'today'; label: '今天' }
  | { kind: 'tomorrow'; label: '明天' }
  | { kind: 'day-after-tomorrow'; label: '后天' }
  | { kind: 'weekday'; label: string; weekday: number };

export interface QuickCaptureResult {
  raw: string;
  title: string;
  priority?: QuickCapturePriority;
  sourceLabel?: string;
  tags: string[];
  dateIntent?: QuickCaptureDateIntent;
  timeIntent?: string;
  warnings: string[];
}

const PRIORITY_TOKENS: Record<string, QuickCapturePriority> = {
  '!高': 'high',
  '!中': 'medium',
  '!低': 'low',
};

const WEEKDAY_TOKENS: Record<string, number> = {
  周一: 1,
  周二: 2,
  周三: 3,
  周四: 4,
  周五: 5,
  周六: 6,
  周日: 0,
  周天: 0,
};

function parseDateIntent(token: string): QuickCaptureDateIntent | undefined {
  if (token === '今天') return { kind: 'today', label: '今天' };
  if (token === '明天') return { kind: 'tomorrow', label: '明天' };
  if (token === '后天') return { kind: 'day-after-tomorrow', label: '后天' };
  if (token in WEEKDAY_TOKENS) {
    return { kind: 'weekday', label: token, weekday: WEEKDAY_TOKENS[token] };
  }
  return undefined;
}

function isTimeToken(token: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(token) || /^([01]?\d|2[0-3])点$/.test(token);
}

export function parseQuickCapture(input: string): QuickCaptureResult {
  const raw = input;
  const tokens = input.trim().split(/\s+/).filter(Boolean);
  const titleTokens: string[] = [];
  const tags: string[] = [];
  let priority: QuickCapturePriority | undefined;
  let sourceLabel: string | undefined;
  let dateIntent: QuickCaptureDateIntent | undefined;
  let timeIntent: string | undefined;

  for (const token of tokens) {
    if (token in PRIORITY_TOKENS) {
      priority = PRIORITY_TOKENS[token];
      continue;
    }

    if (token.startsWith('#') && token.length > 1) {
      const label = token.slice(1);
      if (!sourceLabel) sourceLabel = label;
      else tags.push(label);
      continue;
    }

    if (token.startsWith('@') && token.length > 1) {
      tags.push(token.slice(1));
      continue;
    }

    const parsedDateIntent = parseDateIntent(token);
    if (parsedDateIntent) {
      dateIntent = parsedDateIntent;
      continue;
    }

    if (isTimeToken(token)) {
      timeIntent = token;
      continue;
    }

    titleTokens.push(token);
  }

  const title = titleTokens.join(' ').trim();
  const warnings = title ? [] : ['请输入任务内容'];

  return {
    raw,
    title,
    priority,
    sourceLabel,
    tags,
    dateIntent,
    timeIntent,
    warnings,
  };
}
