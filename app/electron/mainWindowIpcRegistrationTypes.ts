import type { CreateMainWindowBootstrapOptions } from './mainWindowBootstrap';
import type { SetupMainBrowserWindowOptions } from './mainWindowFactory';
import type { PerformanceFrostController } from './performanceFrostController';
import type { EdgeAutoHideController } from './edgeAutoHideController';

export type MainWindowIpcRegistrationOptions = Pick<
  CreateMainWindowBootstrapOptions,
  | 'win'
  | 'store'
  | 'diag'
  | 'scheduleAiTimers'
  | 'getTaskMenuWindow'
  | 'openTaskMenuWindow'
  | 'closeTaskMenuWindow'
  | 'getTaskMenuPayload'
  | 'setTaskMenuPayload'
  | 'getMainWindow'
  | 'getWindowMode'
  | 'hideMainWindow'
  | 'getAppSettings'
  | 'persistWindowState'
  | 'compactModeKey'
  | 'autoStartKey'
  | 'settingsMode'
  | 'setWindowMode'
  | 'setAppSettings'
  | 'reapplyWindowZOrder'
  | 'setInvisibleGlassBackgroundMaterial'
  | 'setNativeWindowDragRegion'
  | 'getCompanionSettings'
  | 'setCompanionSettings'
  | 'getAiReviewSettings'
  | 'setAiReviewSettings'
  | 'getObsidianTemplateSettings'
  | 'setObsidianTemplateSettings'
  | 'getReviewSections'
  | 'setReviewSections'
  | 'runReviewForDate'
  | 'inspectDailyAiContent'
  | 'getDateKey'
  | 'getVaultPath'
  | 'getVaultStatus'
  | 'getDailyFilePath'
  | 'buildDailySourceRules'
  | 'getDailySourceRules'
  | 'getLlmCaller'
  | 'ensureReportLlmAvailable'
  | 'emitAiReviewProgress'
  | 'stage'
  | 'createDiagnostic'
  | 'extractDocxText'
  | 'zh'
  | 'obsidianPathKey'
  | 'getDefaultVaultPath'
  | 'syncTasksToObsidian'
  | 'previewTasksToObsidian'
  | 'buildDailyTemplate'
  | 'triggerOverviewUpdate'
> & {
  performanceFrost: Pick<PerformanceFrostController, 'setConfiguredGlass'>;
  edgeAutoHide: Pick<EdgeAutoHideController, 'noteResizeOrReset' | 'noteSettingsMode' | 'noteWindowModeChanged' | 'reconcileSettings'>;
};

export type MainWindowIpcRegistrations = Pick<
  SetupMainBrowserWindowOptions,
  | 'registerWindowIpc'
  | 'registerSettingsIpc'
  | 'registerTaskContextMenuIpc'
  | 'registerCompanionIpc'
  | 'registerAiReviewIpc'
  | 'registerObsidianIpc'
>;
