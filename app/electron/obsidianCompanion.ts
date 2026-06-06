import fs from 'fs';
import path from 'path';

type CaptureItem = import('../shared/obsidianCompanion').CaptureItem;
type CompanionRule = import('../shared/obsidianCompanion').CompanionRule;
type CompanionSettings = import('../shared/obsidianCompanion').CompanionSettings;
type CaptureType = import('../shared/obsidianCompanion').CaptureType;
type SyncPlan = import('../shared/obsidianCompanion').SyncPlan;
type SyncPlanChange = import('../shared/obsidianCompanion').SyncPlanChange;

export function getDateKey(value = new Date().toISOString()) {
  return value.slice(0, 10);
}

export function getTimeKey(value = new Date().toISOString()) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

export function renderTemplate(template: string, item: CaptureItem) {
  const replacements: Record<string, string> = {
    date: getDateKey(item.createdAt),
    time: getTimeKey(item.createdAt),
    content: item.content,
    tags: item.tags.map((tag) => (tag.startsWith('#') ? tag : `#${tag}`)).join(' '),
    priority: item.priority || '',
    source: item.source,
    status: item.status,
    createdAt: item.createdAt,
  };

  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => replacements[key] ?? '');
}

export function matchesRule(item: CaptureItem, rule: CompanionRule) {
  if (!rule.enabled) return false;
  const condition = rule.when;

  if (condition.type && item.type !== condition.type) return false;
  if (condition.priority && item.priority !== condition.priority) return false;
  if (condition.source && item.source !== condition.source) return false;

  if (condition.tagsAny?.length) {
    const tags = new Set(item.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()));
    if (!condition.tagsAny.some((tag) => tags.has(tag.replace(/^#/, '').toLowerCase()))) return false;
  }

  if (condition.tagsAll?.length) {
    const tags = new Set(item.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()));
    if (!condition.tagsAll.every((tag) => tags.has(tag.replace(/^#/, '').toLowerCase()))) return false;
  }

  if (condition.containsAny?.length) {
    const content = item.content.toLowerCase();
    if (!condition.containsAny.some((keyword) => content.includes(keyword.toLowerCase()))) return false;
  }

  return true;
}

function resolveTargetPath(vaultPath: string, target: string, item: CaptureItem) {
  const rendered = renderTemplate(target, item).replace(/[<>:"|?*]/g, '-');
  if (path.isAbsolute(rendered)) {
    throw new Error(`Target path must be relative to the vault: ${rendered}`);
  }

  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Target path escapes the selected vault: ${rendered}`);
  }

  return resolved;
}

export function buildSyncPlan(settings: CompanionSettings, items: CaptureItem[]): SyncPlan {
  const errors: string[] = [];
  const changes: SyncPlanChange[] = [];
  const unmatchedItems: CaptureItem[] = [];
  const templates = new Map(settings.templates.map((template) => [template.id, template]));
  const rules = [...settings.rules].sort((a, b) => b.priority - a.priority);

  if (!settings.vaultPath) {
    return { ok: false, changes: [], unmatchedItems: items, errors: ['Obsidian vault path is missing.'] };
  }

  for (const item of items) {
    let matched = false;

    for (const rule of rules) {
      if (!matchesRule(item, rule)) continue;
      matched = true;

      const template = templates.get(rule.write.templateId);
      if (!template) {
        errors.push(`Rule "${rule.name}" references missing template "${rule.write.templateId}".`);
        continue;
      }

      try {
        const filePath = resolveTargetPath(settings.vaultPath, rule.write.target, item);
        changes.push({
          filePath,
          action: fs.existsSync(filePath) ? 'update-file' : 'create-file',
          section: rule.write.section,
          mode: rule.write.mode,
          content: renderTemplate(template.body, item),
          itemIds: [item.id],
          ruleId: rule.id,
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
      }

      if (rule.afterMatch === 'stop') break;
    }

    if (!matched) unmatchedItems.push(item);
  }

  return { ok: errors.length === 0, changes, unmatchedItems, errors };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function insertIntoSection(existing: string, section: string | undefined, content: string) {
  if (!section) return `${existing.trimEnd()}\n${content}\n`;

  const headingMatch = section.match(/^(#{1,6})\s+(.+)$/);
  if (!headingMatch) {
    return `${existing.trimEnd()}\n\n${section}\n${content}\n`;
  }

  const headingLevel = headingMatch[1].length;
  const headingPattern = new RegExp(`^${escapeRegExp(section)}\\s*$`, 'm');
  const match = headingPattern.exec(existing);

  if (!match) {
    return `${existing.trimEnd()}\n\n${section}\n${content}\n`;
  }

  const afterHeading = match.index + match[0].length;
  const rest = existing.slice(afterHeading);
  const nextHeadingPattern = new RegExp(`\\n#{1,${headingLevel}}\\s+`, 'm');
  const nextHeadingMatch = nextHeadingPattern.exec(rest);
  const insertAt = nextHeadingMatch ? afterHeading + nextHeadingMatch.index : existing.length;
  const before = existing.slice(0, insertAt).trimEnd();
  const after = existing.slice(insertAt);

  return before + '\n' + content + (after.startsWith('\n') ? after : '\n' + after);
}

function replaceManagedBlock(existing: string, ruleId: string, content: string) {
  const start = `<!-- DAILYTODO:START ${ruleId} -->`;
  const end = `<!-- DAILYTODO:END ${ruleId} -->`;
  const block = `${start}\n${content}\n${end}`;
  const pattern = new RegExp(`${escapeRegExp(start)}[\\s\\S]*?${escapeRegExp(end)}`);
  return pattern.test(existing) ? existing.replace(pattern, block) : `${existing.trimEnd()}\n\n${block}\n`;
}

export function writeSyncPlan(plan: SyncPlan) {
  if (!plan.ok) return { ok: false, errors: plan.errors };

  const errors: string[] = [];
  for (const change of plan.changes) {
    try {
      fs.mkdirSync(path.dirname(change.filePath), { recursive: true });
      const existing = fs.existsSync(change.filePath) ? fs.readFileSync(change.filePath, 'utf-8') : '';
      const next =
        change.mode === 'managed-block'
          ? replaceManagedBlock(existing, change.ruleId, change.content)
          : insertIntoSection(existing, change.section, change.content);
      fs.writeFileSync(change.filePath, next, 'utf-8');
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { ok: errors.length === 0, errors };
}

function getUniqueDestination(directory: string, fileName: string) {
  const parsed = path.parse(fileName);
  let candidate = path.join(directory, fileName);
  let index = 1;

  while (fs.existsSync(candidate)) {
    candidate = path.join(directory, `${parsed.name}-${Date.now()}-${index}${parsed.ext}`);
    index += 1;
  }

  return candidate;
}

function normalizeCaptureType(value: unknown): CaptureType {
  return value === 'task' || value === 'work' || value === 'note' || value === 'inspiration' ? value : 'inspiration';
}

export function importMobileInbox(inboxPath: string): { ok: boolean; items: CaptureItem[]; errors: string[] } {
  if (!inboxPath || !fs.existsSync(inboxPath)) {
    return { ok: false, items: [], errors: ['Mobile inbox path does not exist.'] };
  }

  const processed = path.join(inboxPath, '_processed');
  const failed = path.join(inboxPath, '_failed');
  fs.mkdirSync(processed, { recursive: true });
  fs.mkdirSync(failed, { recursive: true });

  const items: CaptureItem[] = [];
  const errors: string[] = [];
  const files = fs
    .readdirSync(inboxPath)
    .filter((name) => ['.md', '.txt', '.json'].includes(path.extname(name).toLowerCase()));

  for (const file of files) {
    const filePath = path.join(inboxPath, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const ext = path.extname(file).toLowerCase();
      const parsed = ext === '.json' ? JSON.parse(raw) : { content: raw, type: 'inspiration', tags: [] };

      items.push({
        id: `mobile-${Date.now()}-${items.length}`,
        type: normalizeCaptureType(parsed.type),
        content: String(parsed.content || raw).trim(),
        tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
        priority: parsed.priority === 'high' || parsed.priority === 'medium' || parsed.priority === 'low' ? parsed.priority : undefined,
        source: 'mobile-inbox',
        status: 'new',
        createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : new Date().toISOString(),
        metadata: { fileName: file },
      });

      fs.renameSync(filePath, getUniqueDestination(processed, file));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      fs.renameSync(filePath, getUniqueDestination(failed, file));
    }
  }

  return { ok: errors.length === 0, items, errors };
}
