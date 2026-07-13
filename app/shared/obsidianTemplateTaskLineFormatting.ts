export function escapeTaskText(text = '') {
  return text.replace(/\r?\n/g, ' ').trim();
}

export function escapeReviewText(text = '') {
  const trimmed = text.trim();
  if (!trimmed) return '';
  return trimmed.replace(/\r?\n/g, '\n      ');
}

export function formatTaskTags(tags: string[] = []) {
  const formattedTags: string[] = [];
  for (const rawTag of tags) {
    const tag = rawTag.trim().replace(/\s+/g, '-');
    if (!tag) continue;
    formattedTags.push(tag.startsWith('#') ? tag : `#${tag}`);
  }
  return formattedTags.join(' ');
}

export function formatTaskDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

export function renderTaskLineTemplate(template: string, replacements: Record<string, string | number>) {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(replacements[key] ?? ''))
    .replace(/\{(\w+)\}/g, (_, key: string) => String(replacements[key] ?? ''));
}

export function compileCompletionReviewTemplate(template: string) {
  const detailTokens = ['summary', 'unknowns', 'nextStep'] as const;
  return template.split('\n').map((lineTemplate) => ({
    template: lineTemplate,
    referencedDetails: detailTokens.filter((token) => lineTemplate.includes(`{{${token}}}`)),
  }));
}
