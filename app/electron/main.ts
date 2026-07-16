import { app } from 'electron';
import {
  WINDOW_MODE_KEY,
  LEGACY_ALWAYS_ON_TOP_KEY,
  isAlwaysOnTop,
} from '../shared/windowMode';
import { createAppIcon, createTrayIcon } from './appIcons';
import { createAppEnvironment } from './appEnvironment';
import { createAppQuitState } from './appQuitState';
import { MIN_WINDOW_WIDTH, RESET_WINDOW_WIDTH } from './windowState';
import { createSafeStore } from './safeStore';
import { createMainDiagnostics } from './diagnostics';
import { createDesktopWindowModeController } from './desktopWindowMode';
import { registerAppLifecycleHandlers } from './appLifecycle';
import { createMainAiReviewServices } from './mainAiReviewServices';
import { createWin32NativeHelpers } from './win32Native';
import { createAppStateAccessors } from './appStateAccessors';
import { createMainWindowComposition } from './mainWindowComposition';
import { zh } from './mainLocalization';
import { createMainRuntimeState } from './mainRuntimeState';
import { disableNativeWindowOcclusion } from './nativeOcclusionPolicy';
import { createRendererLoader } from './rendererLoader';
import { registerSingleInstancePolicy } from './singleInstance';
import { createSettingsModeState } from './settingsModeState';
import { createTrayRefreshBridge } from './trayRefreshBridge';
import { createUserHiddenState } from './userHiddenState';
import { createWindowModeState } from './windowModeState';
import {
  OBSIDIAN_PATH_KEY,
  WINDOW_STATE_KEY,
  COMPACT_MODE_KEY,
  AUTO_START_KEY,
} from './mainStoreKeys';

disableNativeWindowOcclusion(app);

const {
  isDevelopmentBuild,
  applyDevelopmentUserDataOverride,
  getIconPathOptions,
  devObsidianPath,
  localBlogDraftDir,
} = createAppEnvironment({
  app,
  appDirname: __dirname,
  resourcesPath: process.resourcesPath,
});

applyDevelopmentUserDataOverride();

const store = createSafeStore();

const runtimeState = createMainRuntimeState();
const appQuitState = createAppQuitState();
const settingsMode = createSettingsModeState({ initialRestoreWidth: RESET_WINDOW_WIDTH });
const windowModeState = createWindowModeState('onTop');

const diag = createMainDiagnostics();

const {
  win32,
  applyToolWindowStyle,
  applyNativeBackgroundMaterial,
  setInvisibleGlassBackgroundMaterial,
  setNativeWindowDragRegion,
  getCursorPosition,
} = createWin32NativeHelpers({
  diag,
});

registerSingleInstancePolicy({
  app,
  diag,
  getMainWindow: runtimeState.getMainWindow,
});

const {
  getDefaultVaultPath,
  getVaultPath,
  getVaultStatus,
  getCompanionSettings,
  setCompanionSettings,
  getAppSettings,
  setAppSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getReviewSections,
  setReviewSections,
  buildDailySourceRules,
  getDailySourceRules,
  getLlmCaller,
} = createAppStateAccessors({
  store,
  isDevelopmentBuild,
  devObsidianPath,
  zh,
});

const {
  ensureReportLlmAvailable,
  stage,
  emitAiReviewProgress,
  createDiagnostic,
  extractDocxText,
  getDateKey,
  getDailyFilePath,
  triggerOverviewUpdate,
  syncTasksToObsidian,
  previewTasksToObsidian,
  buildDailyTemplate,
  inspectDailyAiContent,
  runReviewForDate,
  scheduleAiTimers,
} = createMainAiReviewServices({
  getAiReviewSettings,
  getObsidianTemplateSettings,
  getReviewSections,
  getVaultPath,
  getVaultStatus,
  getMainWindow: runtimeState.getMainWindow,
  localBlogDraftDir,
  zh,
});

const loadRenderer = createRendererLoader({
  diag,
});

const userHidden = createUserHiddenState();

const desktopWindowMode = createDesktopWindowModeController({
  diag,
  getWindowMode: windowModeState.getMode,
  setWindowModeState: windowModeState.setMode,
  userHidden,
  getWin32: () => win32,
});

const trayRefreshBridge = createTrayRefreshBridge();

const { createWindow } = createMainWindowComposition({
  store,
  diag,
  scheduleAiTimers,
  compactModeKey: COMPACT_MODE_KEY,
  autoStartKey: AUTO_START_KEY,
  obsidianPathKey: OBSIDIAN_PATH_KEY,
  windowStateKey: WINDOW_STATE_KEY,
  windowModeKey: WINDOW_MODE_KEY,
  legacyAlwaysOnTopKey: LEGACY_ALWAYS_ON_TOP_KEY,
  minWindowWidth: MIN_WINDOW_WIDTH,
  getDefaultVaultPath,
  isAlwaysOnTop,
  createAppIcon: () => createAppIcon(getIconPathOptions()),
  createTrayIcon: () => createTrayIcon(getIconPathOptions()),
  quitApp: () => {
    appQuitState.markQuitting();
    app.quit();
  },
  applyNativeBackgroundMaterial,
  setInvisibleGlassBackgroundMaterial,
  setNativeWindowDragRegion,
  getCursorPosition,
  applyToolWindowStyle,
  runtimeState,
  appQuitState,
  settingsMode,
  windowModeState,
  userHidden,
  desktopWindowMode,
  trayRefreshBridge,
  loadRenderer,
  getAppSettings,
  setAppSettings,
  getCompanionSettings,
  setCompanionSettings,
  getAiReviewSettings,
  setAiReviewSettings,
  getObsidianTemplateSettings,
  setObsidianTemplateSettings,
  getReviewSections,
  setReviewSections,
  runReviewForDate,
  inspectDailyAiContent,
  getDateKey,
  getVaultPath,
  getVaultStatus,
  getDailyFilePath,
  buildDailySourceRules,
  getDailySourceRules,
  getLlmCaller,
  ensureReportLlmAvailable,
  emitAiReviewProgress,
  stage,
  createDiagnostic,
  extractDocxText,
  zh,
  syncTasksToObsidian,
  previewTasksToObsidian,
  buildDailyTemplate,
  triggerOverviewUpdate,
});

registerAppLifecycleHandlers({
  diag,
  createWindow,
  markQuitting: appQuitState.markQuitting,
  isQuitting: appQuitState.isQuitting,
  getMainWindow: runtimeState.getMainWindow,
  clearMainWindow: runtimeState.clearMainWindow,
  getWindowMode: windowModeState.getMode,
  clearDesktopOwner: desktopWindowMode.clearDesktopOwner,
});
