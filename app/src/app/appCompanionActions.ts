import type { Dispatch, SetStateAction } from 'react';
import type { CaptureItem, CompanionSettings, SyncPlan } from '../../shared/obsidianCompanion';
import { areCompanionSettingsEqual } from '../../shared/obsidianCompanionDefaults';
import {
  readCompanionMobileImportResult,
  readCompanionSyncPlan,
  readCompanionWriteResult,
} from '../../shared/obsidianCompanion';
import {
  getCompanionMobileImportStatus,
  getCompanionPreviewStatus,
  getCompanionSyncStatus,
} from './appCompanionStatus';
import { mergeImportedMobileCaptureItems } from './appCompanionMobile';


export interface CompanionSettingsUpdaterDependencies {
  getCompanionSettings: () => CompanionSettings;
  setCompanionSettingsState: Dispatch<SetStateAction<CompanionSettings>>;
  setCompanionSettings: (next: CompanionSettings) => Promise<unknown>;
}

export function createCompanionSettingsUpdater({
  getCompanionSettings,
  setCompanionSettingsState,
  setCompanionSettings,
}: CompanionSettingsUpdaterDependencies) {
  return async (next: CompanionSettings) => {
    if (areCompanionSettingsEqual(getCompanionSettings(), next)) return;
    setCompanionSettingsState(next);
    await setCompanionSettings(next);
  };
}

export interface AppCompanionActionDependencies {
  companionSettings: CompanionSettings;
  chooseObsidianFolder: () => Promise<string | undefined | null>;
  updateCompanionSettings: (next: CompanionSettings) => Promise<void>;
  previewCompanionSync: (settings: CompanionSettings, items: CaptureItem[]) => Promise<unknown>;
  writeCompanionSync: (settings: CompanionSettings, items: CaptureItem[]) => Promise<unknown>;
  importMobileInbox: (inboxPath: string) => Promise<unknown>;
  getCurrentCaptureItems: () => CaptureItem[];
  setCompanionPlan: (plan: SyncPlan) => void;
  setCompanionStatus: (status: string) => void;
  setMobileCaptureItems: Dispatch<SetStateAction<CaptureItem[]>>;
}

export function createAppCompanionActions({
  companionSettings,
  chooseObsidianFolder,
  updateCompanionSettings,
  previewCompanionSync,
  writeCompanionSync,
  importMobileInbox,
  getCurrentCaptureItems,
  setCompanionPlan,
  setCompanionStatus,
  setMobileCaptureItems,
}: AppCompanionActionDependencies) {
  const chooseCompanionVault = async () => {
    const vaultPath = await chooseObsidianFolder();
    if (!vaultPath) return;
    await updateCompanionSettings({ ...companionSettings, vaultPath });
  };

  const previewCompanion = async () => {
    const plan = readCompanionSyncPlan(await previewCompanionSync(companionSettings, getCurrentCaptureItems()));
    if (!plan) {
      setCompanionStatus('Companion preview returned an invalid plan.');
      return;
    }
    setCompanionPlan(plan);
    setCompanionStatus(getCompanionPreviewStatus(plan));
  };

  const syncCompanion = async () => {
    const result = readCompanionWriteResult(await writeCompanionSync(companionSettings, getCurrentCaptureItems()));
    if (!result) {
      setCompanionStatus('Companion sync returned an invalid result.');
      return;
    }
    setCompanionStatus(getCompanionSyncStatus(result));
  };

  const importCompanionMobileInbox = async () => {
    const result = readCompanionMobileImportResult(await importMobileInbox(companionSettings.mobileInboxPath));
    if (!result) {
      setCompanionStatus('Mobile inbox import returned an invalid result.');
      return;
    }
    setMobileCaptureItems((existing) => mergeImportedMobileCaptureItems(existing, result.items));
    setCompanionStatus(getCompanionMobileImportStatus(result));
  };

  return {
    chooseCompanionVault,
    previewCompanion,
    syncCompanion,
    importCompanionMobileInbox,
  };
}
