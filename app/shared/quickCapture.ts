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

const NATURAL_DATE_PATTERNS: Array<{ pattern: RegExp; intent: QuickCaptureDateIntent }> = [
  { pattern: /今天/, intent: { kind: 'today', label: '今天' } },
  { pattern: /明天/, intent: { kind: 'tomorrow', label: '明天' } },
  { pattern: /后天/, intent: { kind: 'day-after-tomorrow', label: '后天' } },
  ...Object.entries(WEEKDAY_TOKENS).map(([label, weekday]) => ({
    pattern: new RegExp(label),
    intent: { kind: 'weekday' as const, label, weekday },
  })),
];

const NATURAL_URGENCY_PATTERNS = /很急|紧急|加急|急需|尽快|马上|立刻|高优先级|重要/;
const NATURAL_FILLER_PATTERN = /^(?:我|你|他|她|我们|明天|今天|后天|周[一二三四五六日天]|要|需要|得|去|到|在|把|进行|做|处理|推进|安排|一下|一个|一份|公司|学校|家里|办公室)+$/;

function parseDateIntent(token: string): QuickCaptureDateIntent | undefined {
  if (token === '今天') return { kind: 'today', label: '今天' };
  if (token === '明天') return { kind: 'tomorrow', label: '明天' };
  if (token === '后天') return { kind: 'day-after-tomorrow', label: '后天' };
  if (token in WEEKDAY_TOKENS) {
    return { kind: 'weekday', label: token, weekday: WEEKDAY_TOKENS[token] };
  }
  return undefined;
}

function parseNaturalDateIntent(input: string): QuickCaptureDateIntent | undefined {
  return NATURAL_DATE_PATTERNS.find((item) => item.pattern.test(input))?.intent;
}

function isTimeToken(token: string) {
  return /^([01]?\d|2[0-3]):[0-5]\d$/.test(token) || /^([01]?\d|2[0-3])点$/.test(token);
}

function extractNaturalTaskTitle(input: string) {
  const withoutMarkers = input
    .replace(/!高|!中|!低/g, ' ')
    .replace(/[#@][\p{L}\p{N}_-]+/gu, ' ')
    .replace(NATURAL_URGENCY_PATTERNS, ' ')
    .replace(/[，。,.!?！？、；;：:]/g, ' ')
    .trim();

  let longestCandidate = '';
  for (const token of withoutMarkers.split(/\s+/)) {
    if (!token) continue;
    for (const segment of token.split(/(?=明天|今天|后天|周[一二三四五六日天]|很急|紧急|加急|尽快)/)) {
      const candidate = segment
        .replace(/^(?:我|你|他|她|我们)?(?:今天|明天|后天|周[一二三四五六日天])?/, '')
        .replace(/^(?:要|需要|得|去|到|在|把|进行|做|处理|推进|安排)+/, '')
        .replace(/^(?:公司|学校|家里|办公室)+/, '')
        .replace(/^(?:要|需要|得|去|到|在|把|进行|做|处理|推进|安排)+/, '')
        .replace(/(?:很急|紧急|加急|急需|尽快|马上|立刻|一下|一个|一份)+$/, '')
        .trim();
      if (candidate && !NATURAL_FILLER_PATTERN.test(candidate) && candidate.length > longestCandidate.length) {
        longestCandidate = candidate;
      }
    }
  }

  return longestCandidate || withoutMarkers;
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

  const rawTitle = titleTokens.join(' ').trim();
  const naturalDateIntent = parseNaturalDateIntent(input);
  const hasInlineNaturalSignal = titleTokens.some((token) => parseNaturalDateIntent(token) || NATURAL_URGENCY_PATTERNS.test(token));
  dateIntent = dateIntent || naturalDateIntent;
  priority = priority || (NATURAL_URGENCY_PATTERNS.test(input) ? 'high' : undefined);
  const title = rawTitle && !hasInlineNaturalSignal
    ? rawTitle
    : extractNaturalTaskTitle(input);
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
