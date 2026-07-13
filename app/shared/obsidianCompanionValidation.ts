import type {
  CaptureItem,
  CompanionMobileImportResult,
  CompanionRule,
  CompanionTemplate,
  CompanionWriteResult,
  SyncPlan,
  SyncPlanChange,
  WriteMode,
} from './obsidianCompanion';
import { isObjectRecord } from './unknownValueGuards';

function isWriteMode(value: unknown): value is WriteMode {
  return value === 'append' || value === 'managed-block';
}

export function isCompanionTemplate(value: unknown): value is CompanionTemplate {
  return isObjectRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.body === 'string';
}

function isOptionalStringArray(value: unknown) {
  return value === undefined || (Array.isArray(value) && value.every((item) => typeof item === 'string'));
}

export function isCompanionRule(value: unknown): value is CompanionRule {
  if (!isObjectRecord(value)) return false;
  if (
    typeof value.id !== 'string'
    || typeof value.name !== 'string'
    || typeof value.enabled !== 'boolean'
    || typeof value.priority !== 'number'
    || !isObjectRecord(value.when)
    || !isObjectRecord(value.write)
    || (value.afterMatch !== 'continue' && value.afterMatch !== 'stop')
  ) return false;

  return (
    (value.when.type === undefined || ['task', 'inspiration', 'work', 'note'].includes(value.when.type as string))
    && (value.when.priority === undefined || ['high', 'medium', 'low'].includes(value.when.priority as string))
    && (value.when.source === undefined || ['desktop', 'mobile-inbox', 'clipboard'].includes(value.when.source as string))
    && isOptionalStringArray(value.when.tagsAny)
    && isOptionalStringArray(value.when.tagsAll)
    && isOptionalStringArray(value.when.containsAny)
    && typeof value.write.target === 'string'
    && typeof value.write.templateId === 'string'
    && (value.write.section === undefined || typeof value.write.section === 'string')
    && isWriteMode(value.write.mode)
  );
}

function isOptionalStringRecord(value: unknown) {
  return value === undefined || (isObjectRecord(value) && Object.values(value).every((item) => typeof item === 'string'));
}

export function isCaptureItem(value: unknown): value is CaptureItem {
  if (!isObjectRecord(value)) return false;
  return (
    typeof value.id === 'string'
    && ['task', 'inspiration', 'work', 'note'].includes(value.type as string)
    && typeof value.content === 'string'
    && Array.isArray(value.tags)
    && value.tags.every((tag) => typeof tag === 'string')
    && (value.priority === undefined || ['high', 'medium', 'low'].includes(value.priority as string))
    && ['desktop', 'mobile-inbox', 'clipboard'].includes(value.source as string)
    && ['new', 'synced', 'archived', 'error'].includes(value.status as string)
    && typeof value.createdAt === 'string'
    && (value.updatedAt === undefined || typeof value.updatedAt === 'string')
    && (value.syncedAt === undefined || typeof value.syncedAt === 'string')
    && isOptionalStringRecord(value.metadata)
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSyncPlanChange(value: unknown): value is SyncPlanChange {
  return isObjectRecord(value)
    && typeof value.filePath === 'string'
    && (value.action === 'create-file' || value.action === 'update-file')
    && (value.section === undefined || typeof value.section === 'string')
    && isWriteMode(value.mode)
    && typeof value.content === 'string'
    && isStringArray(value.itemIds)
    && typeof value.ruleId === 'string';
}

export function isSyncPlan(value: unknown): value is SyncPlan {
  return isObjectRecord(value)
    && typeof value.ok === 'boolean'
    && (value.vaultPath === undefined || typeof value.vaultPath === 'string')
    && Array.isArray(value.changes)
    && value.changes.every(isSyncPlanChange)
    && Array.isArray(value.unmatchedItems)
    && value.unmatchedItems.every(isCaptureItem)
    && isStringArray(value.errors);
}

export function readCompanionSyncPlan(value: unknown): SyncPlan | undefined {
  return isSyncPlan(value) ? value : undefined;
}

export function readCompanionWriteResult(value: unknown): CompanionWriteResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean' || !isStringArray(value.errors)) return undefined;
  return { ok: value.ok, errors: value.errors };
}

export function readCompanionMobileImportResult(value: unknown): CompanionMobileImportResult | undefined {
  if (!isObjectRecord(value) || typeof value.ok !== 'boolean') return undefined;
  if (!Array.isArray(value.items) || !value.items.every(isCaptureItem) || !isStringArray(value.errors)) return undefined;
  return { ok: value.ok, items: value.items, errors: value.errors };
}
