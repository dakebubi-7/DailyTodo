export type DailyCoreToken = 'work' | 'inspiration' | 'tasks';

export type DailyCoreSectionValues = Record<DailyCoreToken, string>;

const CORE_TOKENS: DailyCoreToken[] = ['work', 'inspiration', 'tasks'];

const TOKEN_LABELS: Record<DailyCoreToken, string> = {
  work: '今日工作',
  inspiration: '灵感随笔',
  tasks: '每日任务',
};

function tokenPattern(token: string): RegExp {
  return new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, 'g');
}

export function missingDailyCoreTokens(template: string): DailyCoreToken[] {
  return CORE_TOKENS.filter((token) => !tokenPattern(token).test(template));
}

export function appendMissingDailyCoreSections(
  content: string,
  missing: DailyCoreToken[],
  values: DailyCoreSectionValues,
): string {
  if (!missing.length) return content;

  const fallbackSections = missing
    .map((token) => `## ${TOKEN_LABELS[token]}\n${values[token]}`)
    .join('\n\n');
  return `${content.trim()}\n\n${fallbackSections}`;
}
