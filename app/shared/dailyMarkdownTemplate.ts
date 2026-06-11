export type DailyCoreToken = 'work' | 'inspiration' | 'tasks';

export interface DailyMarkdownRenderParams {
  template: string;
  date: string;
  work: string;
  inspiration: string;
  tasks: string;
  review: string;
  tomorrow: string;
  knowledge: string;
}

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

export function renderDailyMarkdownTemplate(params: DailyMarkdownRenderParams): string {
  const values: Record<string, string> = {
    date: params.date,
    work: params.work.trim() || '〔未填写〕',
    inspiration: params.inspiration.trim() || '〔未填写〕',
    tasks: params.tasks.trim() || '〔未填写〕',
    review: params.review.trim(),
    tomorrow: params.tomorrow.trim(),
    knowledge: params.knowledge.trim(),
  };

  const baseTemplate =
    params.template.trim() || '# DailyTodo · {{date}}\n\n{{work}}\n\n{{inspiration}}\n\n{{tasks}}';

  let rendered = Object.entries(values).reduce(
    (text, [token, value]) => text.replace(tokenPattern(token), value),
    baseTemplate,
  );

  const missing = missingDailyCoreTokens(baseTemplate);
  if (missing.length) {
    const fallbackSections = missing
      .map((token) => `## ${TOKEN_LABELS[token]}\n${values[token]}`)
      .join('\n\n');
    rendered = `${rendered.trim()}\n\n${fallbackSections}`;
  }

  return `${rendered.trim()}\n`;
}
