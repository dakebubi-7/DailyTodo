import type { ComponentProps } from 'react';
import { getShellText } from '../i18n';
import type { AppBehaviorSettings, ObsidianTemplateSettings } from '../../shared/appSettings';
import type { SyncPlan } from '../../shared/obsidianCompanion';
import type { SyncPreview } from '../../shared/obsidianTemplates';
import type { PersonalizationSettings } from '../types/personalization';
import type { Task } from '../types/task';
import { createAppModalActions } from './appModalActions';
import { createAppPersonalizationActions } from './appPersonalization';
import { createAppCompletionActions } from './appCompletionActions';
import { getInitialTemplateForKind, type AppTemplateKind } from './appTemplateEditor';
import { getTaskDialogIsolation, type AppOverlayStack } from '../components/AppOverlayStack';
import type { ObsidianCompanionPanel } from '../components/ObsidianCompanionPanel';
import type { SettingsPanel } from '../components/SettingsPanel';

export interface AppShellOverlayCompositionOptions {
  settingsOpen: boolean;
  personalization: PersonalizationSettings;
  appSettings: AppBehaviorSettings;
  obsidianTemplates: ObsidianTemplateSettings;
  obsidianPath: string;
  settingsSyncPreview: SyncPreview | null;
  isDark: boolean;
  selectedDate: string;
  completedCount: number;
  allTasks: Task[];
  clearCompleted: ComponentProps<typeof SettingsPanel>['onClearCompleted'];
  appPersonalizationActions: ReturnType<typeof createAppPersonalizationActions>;
  updateAppSettings: ComponentProps<typeof SettingsPanel>['onAppSettingsChange'];
  updateObsidianTemplates: ComponentProps<typeof SettingsPanel>['onObsidianTemplatesChange'];
  chooseObsidianFolder: ComponentProps<typeof SettingsPanel>['onChooseObsidian'];
  previewSettingsSync: ComponentProps<typeof SettingsPanel>['onPreviewSync'];
  resetObsidianTemplates: ComponentProps<typeof SettingsPanel>['onResetTemplates'];
  appModalActions: ReturnType<typeof createAppModalActions>;
  companionOpen: boolean;
  companionSettings: ComponentProps<typeof ObsidianCompanionPanel>['settings'];
  companionPlan: SyncPlan | null;
  companionStatus: string;
  updateCompanionSettings: ComponentProps<typeof ObsidianCompanionPanel>['onChange'];
  chooseCompanionVault: ComponentProps<typeof ObsidianCompanionPanel>['onChooseVault'];
  previewCompanion: ComponentProps<typeof ObsidianCompanionPanel>['onPreview'];
  syncCompanion: ComponentProps<typeof ObsidianCompanionPanel>['onSync'];
  importCompanionMobileInbox: ComponentProps<typeof ObsidianCompanionPanel>['onImportMobileInbox'];
  reviewDialogState: {
    completionTask: Task | null;
    currentReviewTask: Task | null;
  };
  completionActions: ReturnType<typeof createAppCompletionActions>;
  deleteTaskReview: ComponentProps<typeof AppOverlayStack>['reviewDialogProps']['onDeleteRecord'];
  aiOnboarding: ComponentProps<typeof AppOverlayStack>['aiOnboarding'];
  editingTemplateKind: AppTemplateKind | null;
}

export function createAppShellOverlayComposition({
  settingsOpen,
  personalization,
  appSettings,
  obsidianTemplates,
  obsidianPath,
  settingsSyncPreview,
  isDark,
  selectedDate,
  completedCount,
  allTasks,
  clearCompleted,
  appPersonalizationActions,
  updateAppSettings,
  updateObsidianTemplates,
  chooseObsidianFolder,
  previewSettingsSync,
  resetObsidianTemplates,
  appModalActions,
  companionOpen,
  companionSettings,
  companionPlan,
  companionStatus,
  updateCompanionSettings,
  chooseCompanionVault,
  previewCompanion,
  syncCompanion,
  importCompanionMobileInbox,
  reviewDialogState,
  completionActions,
  deleteTaskReview,
  aiOnboarding,
  editingTemplateKind,
}: AppShellOverlayCompositionOptions): ComponentProps<typeof AppOverlayStack> {
  const shellText = getShellText(appSettings.language);
  const editingTemplateInitialTemplate = editingTemplateKind
    ? getInitialTemplateForKind(editingTemplateKind, obsidianTemplates)
    : null;
  const settingsPanelProps = {
    isOpen: settingsOpen,
    settings: personalization,
    appSettings,
    obsidianTemplates,
    obsidianPath,
    syncPreview: settingsSyncPreview,
    isDark,
    selectedDate,
    completedCount,
    tasks: allTasks,
    onClearCompleted: clearCompleted,
    onApplyTheme: appPersonalizationActions.applyThemePreset,
    onResetTheme: appPersonalizationActions.resetCurrentThemeDefaults,
    onChange: appPersonalizationActions.changePersonalization,
    onAppSettingsChange: updateAppSettings,
    onObsidianTemplatesChange: updateObsidianTemplates,
    onChooseObsidian: chooseObsidianFolder,
    onPreviewSync: previewSettingsSync,
    onResetTemplates: resetObsidianTemplates,
    onEditTemplate: appModalActions.editTemplate,
    onClose: appModalActions.closeSettings,
    onOpenCompanionSettings: appModalActions.openCompanionSettings,
  };
  const companionPanelProps = {
    isOpen: companionOpen,
    settings: companionSettings,
    syncPlan: companionPlan,
    status: companionStatus,
    onChange: updateCompanionSettings,
    onClose: appModalActions.closeCompanion,
    onChooseVault: chooseCompanionVault,
    onPreview: previewCompanion,
    onSync: syncCompanion,
    onImportMobileInbox: importCompanionMobileInbox,
  };
  const completionDialogProps = {
    task: reviewDialogState.completionTask,
    onCancel: appModalActions.cancelCompletion,
    onSave: completionActions.completeWithReview,
    onCompleteWithoutReview: completionActions.completeWithoutReview,
  };
  const reviewDialogProps = {
    task: reviewDialogState.currentReviewTask,
    onClose: appModalActions.closeReview,
    onAddRecord: appModalActions.addCompletionRecord,
    onDeleteRecord: deleteTaskReview,
  };
  const { inert: isTaskDialogOpen } = getTaskDialogIsolation({
    completionTask: completionDialogProps.task,
    reviewTask: reviewDialogProps.task,
  });
  const overlayStackProps = {
    settingsPanelProps,
    aiOnboarding,
    aiOnboardingText: shellText.settings.aiReview.onboarding,
    onCompleteAiOnboarding: appModalActions.completeAiOnboarding,
    editingTemplateKind,
    editingTemplateInitialTemplate,
    onSaveTemplate: appModalActions.saveTemplate,
    onCancelTemplate: appModalActions.cancelTemplate,
    companionPanelProps,
    completionDialogProps,
    reviewDialogProps,
    isTaskDialogOpen,
  };

  return overlayStackProps;
}
