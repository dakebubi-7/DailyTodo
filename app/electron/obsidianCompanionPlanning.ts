import fs from 'fs';
import path from 'path';
import { isCaptureItem, isCompanionRule, isCompanionTemplate } from '../shared/obsidianCompanion';
import {
  getDateKey,
  getTimeKey,
  matchesRule,
  renderTemplate,
} from './obsidianCompanionTemplateRules';
import { isObjectRecord } from './unknownValueGuards';

type CaptureItem = import('../shared/obsidianCompanion').CaptureItem;
type CompanionRule = import('../shared/obsidianCompanion').CompanionRule;
type CompanionSettings = import('../shared/obsidianCompanion').CompanionSettings;
type SyncPlan = import('../shared/obsidianCompanion').SyncPlan;
type SyncPlanChange = import('../shared/obsidianCompanion').SyncPlanChange;
type CompanionPlanningSettings = Pick<CompanionSettings, 'vaultPath' | 'rules' | 'templates'>;

export { getDateKey, getTimeKey, matchesRule, renderTemplate } from './obsidianCompanionTemplateRules';

function getCompanionVaultPath(value: unknown) {
  return isObjectRecord(value) && typeof value.vaultPath === 'string' ? value.vaultPath : undefined;
}

function isCompanionPlanningSettings(value: unknown): value is CompanionPlanningSettings {
  return (
    isObjectRecord(value) &&
    typeof value.vaultPath === 'string' &&
    Array.isArray(value.templates) &&
    Array.isArray(value.rules) &&
    value.rules.every(isCompanionRule) &&
    value.templates.every(isCompanionTemplate)
  );
}

function resolveTargetPath(vaultPath: string, target: string, item: CaptureItem) {
  const renderedTemplate = renderTemplate(target, item);
  if (path.isAbsolute(renderedTemplate)) {
    throw new Error(`Target path must be relative to the vault: ${renderedTemplate}`);
  }
  const rendered = renderedTemplate.replace(/[<>:"|?*]/g, '-');

  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, rendered);
  const relative = path.relative(vaultRoot, resolved);

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Target path escapes the selected vault: ${rendered}`);
  }

  return resolved;
}

export function buildSyncPlan(settings: unknown, items: unknown): SyncPlan {
  const errors: string[] = [];
  const changes: SyncPlanChange[] = [];
  const unmatchedItems: CaptureItem[] = [];
  if (!Array.isArray(items) || !items.every(isCaptureItem)) {
    return {
      ok: false,
      vaultPath: getCompanionVaultPath(settings),
      changes: [],
      unmatchedItems: [],
      errors: ['Companion capture items contain malformed entries.'],
    };
  }
  if (!isObjectRecord(settings) || !Array.isArray(settings.templates) || !Array.isArray(settings.rules)) {
    return {
      ok: false,
      vaultPath: getCompanionVaultPath(settings),
      changes: [],
      unmatchedItems: items,
      errors: ['Companion settings rules/templates must be arrays.'],
    };
  }
  if (!isCompanionPlanningSettings(settings)) {
    return {
      ok: false,
      vaultPath: getCompanionVaultPath(settings),
      changes: [],
      unmatchedItems: items,
      errors: ['Companion settings rules/templates contain malformed entries.'],
    };
  }

  const templates = new Map(settings.templates.map((template) => [template.id, template]));
  const rules = [...settings.rules].sort((a, b) => b.priority - a.priority);

  if (!settings.vaultPath) {
    return { ok: false, vaultPath: settings.vaultPath, changes: [], unmatchedItems: items, errors: ['Obsidian vault path is missing.'] };
  }

  for (const item of items) {
    const normalizedTags = new Set(item.tags.map((tag) => tag.replace(/^#/, '').toLowerCase()));
    const normalizedContent = item.content.toLowerCase();
    let matched = false;

    for (const rule of rules) {
      if (!matchesRule(item, rule, normalizedTags, normalizedContent)) continue;
      matched = true;

      const template = templates.get(rule.write.templateId);
      if (!template) {
        errors.push(`Rule "${rule.name}" references missing template "${rule.write.templateId}".`);
        continue;
      }

      try {
        const filePath = resolveTargetPath(settings.vaultPath, rule.write.target, item);
        const targetExists = fs.existsSync(filePath);
        if (targetExists && !fs.statSync(filePath).isFile()) {
          throw new Error(`Sync target must be a file: ${filePath}`);
        }
        changes.push({
          filePath,
          action: targetExists ? 'update-file' : 'create-file',
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

  return { ok: errors.length === 0, vaultPath: settings.vaultPath, changes, unmatchedItems, errors };
}
