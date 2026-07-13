import {
  appendMissingDailyCoreSections,
  missingDailyCoreTokens,
  type DailyCoreSectionValues,
} from './dailyMarkdownCoreSections';

export { missingDailyCoreTokens } from './dailyMarkdownCoreSections';
export type { DailyCoreToken } from './dailyMarkdownCoreSections';

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

function tokenPattern(token: string): RegExp {
  return new RegExp(`\\{\\{\\s*${token}\\s*\\}\\}`, 'g');
}

export function renderDailyMarkdownTemplate(params: DailyMarkdownRenderParams): string {
  const values: DailyCoreSectionValues & Record<string, string> = {
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
  rendered = appendMissingDailyCoreSections(rendered, missing, values);

  return `${rendered.trim()}\n`;
}
