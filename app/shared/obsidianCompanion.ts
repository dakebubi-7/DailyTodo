export type CaptureType = 'task' | 'inspiration' | 'work' | 'note';
export type CaptureSource = 'desktop' | 'mobile-inbox' | 'clipboard';
export type CaptureStatus = 'new' | 'synced' | 'archived' | 'error';
export type RuleStopMode = 'continue' | 'stop';
export type WriteMode = 'append' | 'managed-block';

export function isWriteMode(value: unknown): value is WriteMode {
  return value === 'append' || value === 'managed-block';
}

export interface CaptureItem {
  id: string;
  type: CaptureType;
  content: string;
  tags: string[];
  priority?: 'high' | 'medium' | 'low';
  source: CaptureSource;
  status: CaptureStatus;
  createdAt: string;
  updatedAt?: string;
  syncedAt?: string;
  metadata?: Record<string, string>;
}

export interface CompanionRuleCondition {
  type?: CaptureType;
  tagsAny?: string[];
  tagsAll?: string[];
  containsAny?: string[];
  priority?: 'high' | 'medium' | 'low';
  source?: CaptureSource;
}

export interface CompanionRuleWriteTarget {
  target: string;
  section?: string;
  templateId: string;
  mode: WriteMode;
}

export interface CompanionRule {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  when: CompanionRuleCondition;
  write: CompanionRuleWriteTarget;
  afterMatch: RuleStopMode;
}

export interface CompanionTemplate {
  id: string;
  name: string;
  body: string;
}

export interface CompanionPreset {
  id: string;
  name: string;
  description: string;
  rules: CompanionRule[];
  templates: CompanionTemplate[];
}

export interface CompanionSettings {
  vaultPath: string;
  mobileInboxPath: string;
  presetId: string;
  syncMode: 'manual' | 'on-change' | 'interval';
  previewBeforeWrite: boolean;
  rules: CompanionRule[];
  templates: CompanionTemplate[];
}

export interface SyncPlanChange {
  filePath: string;
  action: 'create-file' | 'update-file';
  section?: string;
  mode: WriteMode;
  content: string;
  itemIds: string[];
  ruleId: string;
}

export interface SyncPlan {
  ok: boolean;
  vaultPath?: string;
  changes: SyncPlanChange[];
  unmatchedItems: CaptureItem[];
  errors: string[];
}

export interface CompanionWriteResult {
  ok: boolean;
  errors: string[];
}

export interface CompanionMobileImportResult {
  ok: boolean;
  items: CaptureItem[];
  errors: string[];
}

export {
  isCaptureItem,
  isCompanionRule,
  isCompanionTemplate,
  isSyncPlan,
  readCompanionMobileImportResult,
  readCompanionSyncPlan,
  readCompanionWriteResult,
} from './obsidianCompanionValidation';
