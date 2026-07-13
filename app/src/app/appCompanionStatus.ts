import type { SyncPlan } from '../../shared/obsidianCompanion';
import type { CaptureItem } from '../../shared/obsidianCompanion';

interface CompanionResultWithErrors {
  ok: boolean;
  errors: string[];
}

interface CompanionMobileImportResult extends CompanionResultWithErrors {
  items: CaptureItem[];
}

export function getCompanionPreviewStatus(plan: SyncPlan): string {
  return plan.ok ? `Preview ready: ${plan.changes.length} change(s).` : plan.errors.join(' ');
}

export function getCompanionSyncStatus(result: CompanionResultWithErrors): string {
  return result.ok ? 'Synced to Obsidian.' : result.errors.join(' ');
}

export function getCompanionMobileImportStatus(result: CompanionMobileImportResult): string {
  return result.ok ? `Imported ${result.items.length} mobile item(s).` : result.errors.join(' ');
}
