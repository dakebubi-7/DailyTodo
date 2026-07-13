import type { CaptureItem, CompanionRule } from '../shared/obsidianCompanion';

export function getDateKey(value = new Date().toISOString()) {
  return value.slice(0, 10);
}

export function getTimeKey(value = new Date().toISOString()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function readTemplateValue(key: string, item: CaptureItem): string {
  switch (key.toLowerCase()) {
    case 'date': return getDateKey(item.createdAt);
    case 'time': return getTimeKey(item.createdAt);
    case 'content': return item.content;
    case 'tags': return item.tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' ');
    case 'priority': return item.priority || '';
    case 'source': return item.source;
    case 'status': return item.status;
    case 'createdat': return item.createdAt;
    default: return '';
  }
}

export function renderTemplate(template: string, item: CaptureItem) {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => readTemplateValue(key, item));
}

export function matchesRule(
  item: CaptureItem,
  rule: CompanionRule,
  normalizedTags?: ReadonlySet<string>,
  normalizedContent?: string,
) {
  if (!rule.enabled) return false;
  const condition = rule.when;

  if (condition.type && item.type !== condition.type) return false;
  if (condition.priority && item.priority !== condition.priority) return false;
  if (condition.source && item.source !== condition.source) return false;

  if (condition.tagsAny?.length || condition.tagsAll?.length) {
    const tags = normalizedTags ?? new Set(item.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()));
    if (condition.tagsAny?.length && !condition.tagsAny.some((tag) => tags.has(tag.replace(/^#/, '').toLowerCase()))) return false;
    if (condition.tagsAll?.length && !condition.tagsAll.every((tag) => tags.has(tag.replace(/^#/, '').toLowerCase()))) return false;
  }

  if (condition.containsAny?.length) {
    const content = normalizedContent ?? item.content.toLowerCase();
    if (!condition.containsAny.some((keyword) => content.includes(keyword.toLowerCase()))) return false;
  }

  return true;
}
