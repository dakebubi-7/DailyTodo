import { app, BrowserWindow, Menu, Tray, crashReporter, dialog, ipcMain, nativeImage, screen, shell } from 'electron';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import Store from 'electron-store';
import { buildSyncPlan, importMobileInbox, writeSyncPlan } from './obsidianCompanion';
import {
  APP_SETTINGS_KEY,
  OBSIDIAN_TEMPLATE_SETTINGS_KEY,
  createDefaultObsidianTemplateSettings,
  normalizeAppSettings,
  normalizeObsidianTemplateSettings,
} from '../shared/appSettings';
import {
  INSPIRATION_END_MARKER,
  INSPIRATION_START_MARKER,
  TASK_END_MARKER,
  TASK_START_MARKER,
  WORK_END_MARKER,
  WORK_START_MARKER,
  buildDailyNoteContent,
  buildInspirationBlock as buildTemplateInspirationBlock,
  buildSyncPreview,
  buildTaskBlock as buildTemplateTaskBlock,
  buildTaskLines as buildTemplateTaskLines,
  buildWorkBlock as buildTemplateWorkBlock,
  readMarkedBlockBody as readTemplateMarkedBlockBody,
  replaceManagedBlock,
  resolveTemplatePath,
} from '../shared/obsidianTemplates';
import { createDefaultCompanionSettings } from '../shared/obsidianCompanionDefaults';
import { CompanionSettings } from '../shared/obsidianCompanion';
import {
  buildDevRendererUrl,
  buildRendererQuery,
  type RendererRoute,
} from '../shared/rendererRoute';
import {
  WINDOW_MODE_KEY,
  LEGACY_ALWAYS_ON_TOP_KEY,
  WindowMode,
  resolveWindowMode,
  isAlwaysOnTop,
  needsDesktopGuard,
  togglePinnedMode,
  setDesktopMode,
} from '../shared/windowMode';
import { runReviewForFile } from './aiReview/runner';
import { backfillReviews } from './aiReview/backfill';
import { callChatCompletion, listModels } from '../shared/llm/openaiClient';
import type { LlmProvider } from '../shared/llm/openaiClient';
import { AI_REVIEW_SETTINGS_KEY, normalizeAiReviewSettings, DEFAULT_REPORT_DIRS, sanitizeRelDir, resolveActiveProfile } from '../shared/aiReview/aiReviewSettings';
import { normalizeSections } from '../shared/aiReview/sectionConfig';
import { buildRecognizeMessages, parseRecognizedSections } from '../shared/aiReview/recognizeTemplate';
import { buildRecognizeReportMessages, parseRecognizedReportPrompt } from '../shared/aiReview/recognizeReportTemplate';
import { parseTemplateFile } from '../shared/aiReview/templateFile';
import type { ChatMessage } from '../shared/llm/openaiClient';
import type { StatTask } from '../shared/aiReview/stats';
import { shiftDateKey, getBusinessDateKey } from '../shared/taskRollover';
import { getNextTimerDelay, getNextWeeklyDelay, getNextMonthlyDelay } from '../shared/aiReview/timer';
import { generatePersonalWeekly, generatePersonalMonthly, generateExternalReport } from './aiReview/exportReports';
import { isoWeekKey } from '../shared/aiReview/weekly';
import { buildMonthlyMessages, monthKey, monthRange, selectMonthlySources, type MonthlySource } from '../shared/aiReview/monthly';
import { DEFAULT_EXTERNAL_WEEKLY_SYSTEM, DEFAULT_EXTERNAL_MONTHLY_SYSTEM } from '../shared/aiReview/defaultPrompts';
import { computeRangeStats } from '../shared/aiReview/stats';

// 关闭 Chromium 在 Windows 上的原生窗口遮挡计算：透明无边框窗口在 Win+D / 点击桌面后
// 会被判定为「被遮挡」而暂停合成，表现为窗口空白/消失，直到系统弹窗触发重绘。关闭后所有
// 模式都不再发生这种静默消失。必须在 app ready 之前调用。
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');


const DEV_APPDATA_ROOT = 'G:\\Personal-AI\\DailyTodo\\data';
const DEV_OBSIDIAN_PATH = 'G:\\Personal-AI\\Personal-KB';
const LOCAL_BLOG_DRAFT_DIR = 'C:\\Users\\25788\\blog\\content\\posts';

function isDevelopmentBuild() {
  return !app.isPackaged;
}

try {
  if (isDevelopmentBuild() && fs.existsSync(DEV_APPDATA_ROOT)) {
    app.setPath('userData', DEV_APPDATA_ROOT);
  }
} catch {}

function getStoreConfigPath() {
  try {
    return path.join(app.getPath('userData'), 'config.json');
  } catch {
    return path.join(process.env.APPDATA || '', 'daily-todo', 'config.json');
  }
}

function createSafeStore() {
  try {
    return new Store();
  } catch (error) {
    const configPath = getStoreConfigPath();
    if (configPath && fs.existsSync(configPath)) {
      const backupPath = path.join(
        path.dirname(configPath),
        `config.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      );
      fs.copyFileSync(configPath, backupPath);
      fs.writeFileSync(configPath, '{}', 'utf-8');
    }
    return new Store();
  }
}

const store = createSafeStore();

type Task = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  taskDate?: string;
  isToday: boolean;
  carriedFromDate?: string;
  carriedFromTaskId?: string;
  completedAt?: string;
  completionReview?: {
    id?: string;
    status: 'done' | 'partial' | 'blocked';
    percent: number;
    summary: string;
    unknowns: string;
    nextStep: string;
    reviewedAt: string;
  };
  completionReviews?: {
    id?: string;
    status: 'done' | 'partial' | 'blocked';
    percent: number;
    summary: string;
    unknowns: string;
    nextStep: string;
    reviewedAt: string;
  }[];
};

type WindowState = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
};

type DesktopWidgetState = 'desktop-visible' | 'app-background' | 'dt-active';

const OBSIDIAN_PATH_KEY = 'obsidianVaultPath';
const COMPANION_SETTINGS_KEY = 'obsidianCompanionSettings';
const WINDOW_STATE_KEY = 'windowState';
const COMPACT_MODE_KEY = 'compactMode';
const AUTO_START_KEY = 'autoStart';
const MIN_WINDOW_WIDTH = 240;
const DEFAULT_WINDOW_WIDTH = 240;
const DEFAULT_WINDOW_HEIGHT = 480;
const RESET_WINDOW_WIDTH = 240;
const RESET_WINDOW_HEIGHT = 480;
const APP_ICON_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABiklEQVR4nO3bQRKCMAwFUM7BHbgCB0Dv4PW8ijdx6ca1rpxhFCFpkv6kDTPZgc1/QumCDgPxmJb5FamouZoLrgaBbhwKgW4WioBuEoqAbg6KgG4KjoBuCAqAbgaOgG4ECoBuAl3qAM/H3bRcA1iHt0BQA6gVXhtBBaB2eE0EMQAqvBZCAiRAAiSAGcC0zBetSoAECAjQ/RyQAAmQAOoBQwFMy3wqrb1wXQBQx2wVgDymawCrSa1rgFCToHX4pgBKx2kCQDJGeADpGO4AtJvXAKwGwAmhdXeFAOCcRwl/u543yzXA+tzS8P+CSyCqAkj+eWp4LoL5JFg7/DiOLAST1yAy/KeoCGbrgNoA6/AuADgIVuEpCOYrQcn1R8/4Vnh3ANwF0h7Ad0hKeBcAWwiUa45udUp4cwAOArcoz/tR+CoAVgilkx4EAIUgXRG6/1CSsxByAWBRVuGnSN8Lm4WPAsBBoP5e2D0D0uA/4aMBaFTX+4a63jm2G751BFL4VhFY4VuCKA4eHYKa6w3BqOZexsuoaQAAAABJRU5ErkJggg==';

function resolveIconPath(fileName: string) {
  const candidates = isDevelopmentBuild()
    ? [path.join(__dirname, '..', 'build', fileName)]
    : [path.join(process.resourcesPath, fileName)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return '';
}

function createAppIcon() {
  const iconPath = resolveIconPath('icon.png');
  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) return image;
  }
  return nativeImage.createFromBuffer(Buffer.from(APP_ICON_PNG_BASE64, 'base64'));
}

function createTrayIcon() {
  const iconPath = resolveIconPath('tray.png');
  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) return image.resize({ width: 16, height: 16 });
  }
  return nativeImage.createFromBuffer(Buffer.from(APP_ICON_PNG_BASE64, 'base64')).resize({ width: 16, height: 16 });
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let persistTimer: NodeJS.Timeout | null = null;
let isQuitting = false;
// 当前窗口模式的进程内真相源（normal / onTop / desktop）。createWindow 时从存储解析。
let windowMode: WindowMode = 'onTop';

// ===== 崩溃诊断（轻量，仅写文件，不改窗口行为） =====
const DIAG_LOG = (() => {
  try {
    return path.join(app.getPath('userData'), 'diag.log');
  } catch {
    return path.join(process.env.APPDATA || process.cwd(), 'daily-todo-diag.log');
  }
})();

function diag(message: string) {
  try {
    fs.appendFileSync(DIAG_LOG, `[${new Date().toISOString()}] ${message}\n`, 'utf-8');
  } catch {}
}

try {
  // 本地 minidump（userData/Crashpad），仅本地保存，不上传。原生崩溃时留证据。
  crashReporter.start({ submitURL: '', uploadToServer: false, compress: false });
} catch (error) {
  diag(`crashReporter.start failed: ${String(error)}`);
}

process.on('uncaughtException', (error) => {
  diag(`uncaughtException: ${error?.stack || String(error)}`);
});
process.on('unhandledRejection', (reason) => {
  diag(`unhandledRejection: ${String(reason)}`);
});
diag('=== app starting ===');

// ===== Win32 原生：给窗口加 WS_EX_TOOLWINDOW（不上任务栏 / 不进 Alt+Tab） =====
const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;

type Win32Api = {
  ptr: (handle: Buffer) => unknown;
  getExStyle: (hwnd: unknown) => number;
  setExStyle: (hwnd: unknown, style: number) => void;
  getForegroundClass: () => string;
  isForegroundWindow: (handle: Buffer) => boolean;
  setTopmost: (handle: Buffer) => void;
  /**清除 topmost 属性，降为普通 Z 序窗口（可被其它 app 盖住）。 */
  clearTopmost: (handle: Buffer) => void;
  sendToBottom: (handle: Buffer) => void;
  /** 把窗口的 owner 设为桌面(Progman)，让 Win+D「显示桌面」把它当桌面一部分、不最小化。成功返回 true。 */
  setDesktopOwner: (handle: Buffer) => boolean;
  /** 还原 owner 为 null，恢复普通顶层窗口语义（退出 desktop 模式时调用）。 */
  clearDesktopOwner: (handle: Buffer) => void;
};

const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;
const HWND_BOTTOM = 1;
const SWP_NOSIZE = 0x0001;
const SWP_NOMOVE = 0x0002;
const SWP_NOACTIVATE = 0x0010;
const GWLP_HWNDPARENT = -8;

function createHwndBuffer(value: number): Buffer {
  const size = process.arch === 'x64' ? 8 : 4;
  const buf = Buffer.alloc(size);
  if (size === 8) {
    buf.writeBigInt64LE(BigInt(value), 0);
  } else {
    buf.writeInt32LE(value, 0);
  }
  return buf;
}

let win32: Win32Api | null = null;
if (process.platform === 'win32') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');

    const GetWindowLongPtrW = user32.func('intptr_t __stdcall GetWindowLongPtrW(void* hWnd, int nIndex)');
    const SetWindowLongPtrW = user32.func('intptr_t __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, intptr_t dwNewLong)');
    // 同一符号的指针变体：第三参收 HWND 指针（设 owner）或 null（清 owner），避免指针→整数转换。
    const SetWindowLongPtrW_Ptr = user32.func('void* __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, void* dwNewLong)');
    // 只读调用：用于判断当前前台窗口是不是「桌面」(Win+D / 点桌面时前台变成 WorkerW 或 Progman)。
    // 只读，不写任何原生窗口标志，没有历史上 SetParent/SetWindowLongPtr 的原生崩溃风险。
    const GetForegroundWindow = user32.func('void* __stdcall GetForegroundWindow()');
    const GetClassNameW = user32.func('int __stdcall GetClassNameW(void* hWnd, uint16_t* lpClassName, int nMaxCount)');
    // 纯 Z 序调用：把窗口压到 Z 序最底（桌面之上、所有应用之下）。只动 Z 序、不改父子/标志，
    // 与 moveTop 同族，无 SetParent/SetWindowLongPtr 的原生崩溃风险；NOACTIVATE 不抢焦点。
    const SetWindowPos = user32.func('bool __stdcall SetWindowPos(void* hWnd, void* hWndInsertAfter, int X, int Y, int cx, int cy, uint32_t uFlags)');

    // 找桌面根窗口 Progman，用作 owner 让窗口豁免 Win+D「显示桌面」。
    const FindWindowW = user32.func('void* __stdcall FindWindowW(const char16_t* lpClassName, const char16_t* lpWindowName)');

    win32 = {
      ptr: (handle: Buffer) => koffi.as(handle, 'void*'),
      getExStyle: (hwnd) => Number(GetWindowLongPtrW(hwnd, GWL_EXSTYLE)),
      setExStyle: (hwnd, style) => { SetWindowLongPtrW(hwnd, GWL_EXSTYLE, style); },
      getForegroundClass: () => {
        try {
          const hwnd = GetForegroundWindow();
          if (!hwnd) return '';
          const buf = Buffer.alloc(256 * 2);
          const len = GetClassNameW(hwnd, buf, 256);
          return len > 0 ? buf.toString('utf16le', 0, len * 2) : '';
        } catch {
          return '';
        }
      },
      isForegroundWindow: (handle: Buffer) => {
        try {
          const fg = GetForegroundWindow();
          if (!fg) return false;
          const hwnd = koffi.as(handle, 'void*');
          return fg === hwnd;
        } catch {
          return false;
        }
      },
      setTopmost: (handle: Buffer) => {
        const hwnd = koffi.as(handle, 'void*');
        SetWindowPos(hwnd, createHwndBuffer(HWND_TOPMOST), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
      },
      clearTopmost: (handle: Buffer) => {
        const hwnd = koffi.as(handle, 'void*');
        SetWindowPos(hwnd, createHwndBuffer(HWND_NOTOPMOST), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
      },
      sendToBottom: (handle: Buffer) => {
        const hwnd = koffi.as(handle, 'void*');
        // HWND_BOTTOM 在 MSDN 明确说明：如果窗口是 topmost，会先移除 topmost 再沉底。一次原子操作。
        SetWindowPos(hwnd, createHwndBuffer(HWND_BOTTOM), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
      },
      setDesktopOwner: (handle: Buffer) => {
        // 把窗口 owner 设为桌面根窗口 Progman：Win+D「显示桌面」会跳过以桌面为 owner 的窗口，
        // 从而不再最小化我们。仅在进入 desktop 模式时调用一次（不在 blur/focus 等高频事件里）。
        const hwnd = koffi.as(handle, 'void*');
        const progman = FindWindowW('Progman', null);
        if (!progman) return false;
        SetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT, progman);
        return true;
      },
      clearDesktopOwner: (handle: Buffer) => {
        // 还原 owner 为 null，恢复普通顶层窗口语义。退出 desktop 模式时调用一次。
        const hwnd = koffi.as(handle, 'void*');
        SetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT, null);
      },
    };
    diag('koffi user32 bound ok');
  } catch (error) {
    win32 = null;
    diag(`koffi bind failed: ${String(error)}`);
  }
}

/** 前台窗口是否是「桌面」——Win+D / 点击桌面空白处会让 WorkerW 或 Progman 成为前台。 */
function isDesktopForeground(): boolean {
  if (!win32) return false;
  const cls = win32.getForegroundClass();
  return cls === 'WorkerW' || cls === 'Progman';
}

/**
 * 之前会加 WS_EX_TOOLWINDOW，但 diag 实测发现这个标志会导致「失焦时窗口停止合成、看似消失，
 * 直到其他应用抢焦点或系统弹窗出现才恢复」——这是 Win10 DWM 对工具窗口的处理。
 * 副作用：不上任务栏仍由 BrowserWindow 的 `skipTaskbar: true` 兜底；不进 Alt+Tab 由
 * `frame: false` + `transparent: true` 隐式达成。
 * 因此本函数保留为 no-op（参数保留以避免破坏调用点），不再写 WS_EX_TOOLWINDOW。
 */
function applyToolWindowStyle(win: BrowserWindow): boolean {
  return false;
}

const gotLock = app.requestSingleInstanceLock();
diag(`singleInstanceLock gotLock=${gotLock}`);
if (!gotLock) {
  diag('duplicate instance → quit');
  app.quit();
} else {
  app.on('second-instance', () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
}

// 视为「桌面/外壳」前台的窗口类名：
// - WorkerW / Progman：传统桌面根窗口（Win+D 时会出现）
// - SHELLDLL_DefView / SysListView32：点桌面空白/图标时常见的图标层前台类
// 注意：CabinetWClass（文件管理器）、Shell_TrayWnd（任务栏）、TaskListThumbnailWnd（任务栏缩略图）
// 不算桌面前台，它们是普通应用窗口。
const DESKTOP_FG_CLASSES = new Set([
  'WorkerW',
  'Progman',
  'SHELLDLL_DefView',
  'SysListView32',
]);


// Win+D / 点桌面时前台会抖动：一串 explorer / taskbar / thumbnail / chromium 窗口轮流拿前台。
// 记录最近一次看到「桌面态信号」的时间，用于在宽限期内吸收抖动、避免我们刚被拉回又立刻被误沉。
let desktopShellSeenAt = 0;
let lastDesktopGuardSnapshot = '';
// 应用前台后短暂重复 app-background 动作，吸收 Win+D 恢复窗口时的原生 Z 序延迟。
let appBackgroundSettleUntil = 0;
let lastAppForegroundClass = '';

function applyDesktopWidgetState(win: BrowserWindow, nextState: DesktopWidgetState, force = false) {
  if (win.isDestroyed() || windowMode !== 'desktop') return;
  if (!win32) return;
  if (!force && desktopWidgetState === nextState) return;

  const handle = win.getNativeWindowHandle();
  if (!handle) return;

  desktopWidgetState = nextState;

  if (nextState === 'desktop-visible') {
    applyDesktopOwner(win);
    try {
      if (!userHidden && !win.isVisible()) {
        win.showInactive();
      }
      win.setAlwaysOnTop(true, 'screen-saver');
      win32.setTopmost(handle);
    } catch (error) {
      diag(`desktop state desktop-visible failed: ${String(error)}`);
    }
    return;
  }

  if (nextState === 'dt-active') {
    clearDesktopOwner(win);
    try {
      win.setAlwaysOnTop(false, 'normal');
      win32.clearTopmost(handle);
      if (!win.isVisible()) {
        win.show();
      }
    } catch (error) {
      diag(`desktop state dt-active failed: ${String(error)}`);
    }
    return;
  }

  clearDesktopOwner(win);
  try {
    win.setAlwaysOnTop(false, 'normal');
    win32.clearTopmost(handle);
    win32.sendToBottom(handle);
  } catch (error) {
    diag(`desktop state app-background failed: ${String(error)}`);
  }
}

function zh(text: string) {
  return text;
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateKey(date?: string) {
  return (date || getTodayDate()).slice(0, 10);
}

function getTaskDate(task: Task) {
  return task.taskDate || task.createdAt?.slice(0, 10) || getTodayDate();
}

function escapeTaskText(text: string) {
  return text.replace(/\r?\n/g, ' ').trim();
}


function formatDateTime(value?: string) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('zh-CN');
}

function getReviewDate(review: NonNullable<Task['completionReview']>) {
  return getDateKey(review.reviewedAt);
}

function getCompletionReviews(task: Task) {
  if (task.completionReviews?.length) return task.completionReviews;
  return task.completionReview ? [task.completionReview] : [];
}

function getDefaultVaultPath() {
  return isDevelopmentBuild() && fs.existsSync(DEV_OBSIDIAN_PATH) ? DEV_OBSIDIAN_PATH : '';
}

function getVaultPath() {
  return (store.get(OBSIDIAN_PATH_KEY) as string | undefined) || getDefaultVaultPath();
}

function getVaultStatus() {
  const vaultPath = getVaultPath();
  if (!vaultPath) return { ok: false, reason: zh('\u8bf7\u5148\u9009\u62e9 Obsidian \u6587\u4ef6\u5939') };
  if (!fs.existsSync(vaultPath)) {
    return {
      ok: false,
      reason: zh('\u5df2\u8bb0\u5f55\u7684 Obsidian \u6587\u4ef6\u5939\u4e0d\u5b58\u5728\uff0c\u8bf7\u70b9\u201c\u66f4\u6539\u6587\u4ef6\u5939\u201d\u91cd\u65b0\u9009\u62e9'),
    };
  }
  return { ok: true, vaultPath };
}

function getCompanionSettings() {
  const existing = store.get(COMPANION_SETTINGS_KEY);
  if (existing && typeof existing === 'object') return existing as CompanionSettings;
  return createDefaultCompanionSettings(getVaultPath());
}

function setCompanionSettings(value: CompanionSettings) {
  store.set(COMPANION_SETTINGS_KEY, value);
}

function getAppSettings() {
  return normalizeAppSettings(store.get(APP_SETTINGS_KEY));
}

function setAppSettings(value: unknown) {
  const settings = normalizeAppSettings(value);
  store.set(APP_SETTINGS_KEY, settings);
  return settings;
}

function getObsidianTemplateSettings() {
  return normalizeObsidianTemplateSettings(store.get(OBSIDIAN_TEMPLATE_SETTINGS_KEY));
}

function setObsidianTemplateSettings(value: unknown) {
  const settings = normalizeObsidianTemplateSettings(value);
  store.set(OBSIDIAN_TEMPLATE_SETTINGS_KEY, settings);
  return settings;
}

const AI_REVIEW_SECTIONS_KEY = 'aiReviewSections';

function getAiReviewSettings() {
  return normalizeAiReviewSettings(store.get(AI_REVIEW_SETTINGS_KEY));
}
function getReviewSections() {
  return normalizeSections(store.get(AI_REVIEW_SECTIONS_KEY));
}
function getLlmCaller() {
  const s = getAiReviewSettings();
  const p = resolveActiveProfile(s);
  return (messages: ChatMessage[]) =>
    callChatCompletion(
      { baseUrl: p.baseUrl, apiKey: p.apiKey, model: p.model, maxTokens: p.maxTokens },
      messages,
      { timeoutMs: p.timeoutSeconds * 1000, provider: p.provider },
    );
}

/** .docx → 纯文本（mammoth）。仅主进程用，动态引入避免进入 renderer 包。 */
async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import('mammoth');
  const { value } = await mammoth.extractRawText({ buffer });
  return value;
}

async function runReviewForDate(date: string, tasks: Task[]) {
  const settings = getAiReviewSettings();
  if (!settings.enabled || !resolveActiveProfile(settings).apiKey) return { ok: false, error: 'AI 复盘未启用或缺少 Key', filledMarkers: [], skippedMarkers: [] };
  const filePath = getDailyFilePath(date);
  return runReviewForFile({
    filePath,
    date,
    tasks: tasks as StatTask[],
    sections: getReviewSections(),
    callLlm: getLlmCaller(),
  });
}

let aiTimer: ReturnType<typeof setTimeout> | null = null;
let weeklyTimer: ReturnType<typeof setTimeout> | null = null;
let monthlyTimer: ReturnType<typeof setTimeout> | null = null;

/** 按设置的时间排程一次定时器；到点向渲染层发 aiReview:tick（由渲染层带 tasks 触发补偿），然后重新排程。 */
function scheduleAiTimer(win: BrowserWindow) {
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
  const settings = getAiReviewSettings();
  if (!settings.timerEnabled) return;
  const delay = getNextTimerDelay(new Date(), settings.timerTime);
  aiTimer = setTimeout(() => {
    if (!win.isDestroyed()) win.webContents.send('aiReview:tick');
    scheduleAiTimer(win);
  }, delay);
}

/** 周报定时：到点发 aiReview:weeklyTick（渲染层带 tasks 生成上一周），然后重新排程。 */
function scheduleWeeklyTimer(win: BrowserWindow) {
  if (weeklyTimer) {
    clearTimeout(weeklyTimer);
    weeklyTimer = null;
  }
  const settings = getAiReviewSettings();
  if (!settings.weeklyTimerEnabled) return;
  const delay = getNextWeeklyDelay(new Date(), settings.weeklyTimerWeekday, settings.weeklyTimerTime);
  weeklyTimer = setTimeout(() => {
    if (!win.isDestroyed()) win.webContents.send('aiReview:weeklyTick');
    scheduleWeeklyTimer(win);
  }, delay);
}

/** 月报定时：到点发 aiReview:monthlyTick（渲染层带 tasks 生成上一月），然后重新排程。 */
function scheduleMonthlyTimer(win: BrowserWindow) {
  if (monthlyTimer) {
    clearTimeout(monthlyTimer);
    monthlyTimer = null;
  }
  const settings = getAiReviewSettings();
  if (!settings.monthlyTimerEnabled) return;
  const delay = getNextMonthlyDelay(new Date(), settings.monthlyTimerDay, settings.monthlyTimerTime);
  monthlyTimer = setTimeout(() => {
    if (!win.isDestroyed()) win.webContents.send('aiReview:monthlyTick');
    scheduleMonthlyTimer(win);
  }, delay);
}

function getDailyFilePath(date?: string) {
  return resolveTemplatePath(getVaultPath(), getObsidianTemplateSettings().dailyNotePath, getDateKey(date));
}

/**
 * 每次写入 logs/daily/*.md 之后调用，
 * 触发 Personal-KB 的日记总览脚本，把新日期行追加进 wiki/Daily/日记总览.md。
 * 静默失败 —— 总览更新失败不影响主同步流程。
 */
function triggerOverviewUpdate(filePath: string) {
  try {
    const vaultPath = getVaultPath();
    if (!vaultPath) return;
    const scriptPath = path.join(vaultPath, 'tools', 'update_daily_overview.py');
    if (!fs.existsSync(scriptPath)) return;
    spawnSync('python', [scriptPath, '--from-hook'], {
      input: JSON.stringify({ tool_name: 'Write', tool_input: { file_path: filePath } }),
      cwd: vaultPath,
      encoding: 'utf-8',
      timeout: 10000,
      windowsHide: true,
    });
  } catch {
    // 静默失败
  }
}

function getTaskExportFilePath(date?: string) {
  return resolveTemplatePath(getVaultPath(), getObsidianTemplateSettings().taskExportPath, getDateKey(date));
}


function buildTaskLines(tasks: Task[], date: string, templates = getObsidianTemplateSettings()) {
  const selected = getDateKey(date);
  return buildTemplateTaskLines(tasks, selected, templates);
}

function buildTaskBlock(date: string, tasks: Task[], templates = getObsidianTemplateSettings()) {
  const selected = getDateKey(date);
  return buildTemplateTaskBlock(selected, tasks, templates);
}

function buildWorkBlock(dailyWork = '', templates = getObsidianTemplateSettings()) {
  return buildTemplateWorkBlock(dailyWork, templates);
}

function buildInspirationBlock(inspiration = '', templates = getObsidianTemplateSettings()) {
  return buildTemplateInspirationBlock(inspiration, templates);
}

function buildDailyTemplate(date: string, dailyWork = '', inspiration = '', templates = getObsidianTemplateSettings()) {
  const selected = getDateKey(date);
  return buildDailyNoteContent({ date: selected, tasks: [], dailyWork, dailyInspiration: inspiration, templates });
}

function migrateLegacyInspirationSection(existing: string, inspiration = '') {
  if (existing.includes(INSPIRATION_START_MARKER)) return existing;

  const headings = [`## ${zh('\u788e\u788e\u5ff5')}`, `## ${zh('\u7075\u611f\u95ea\u5ff5')}`];
  const match = headings
    .map((heading) => ({ heading, start: existing.indexOf(heading) }))
    .filter((item) => item.start !== -1)
    .sort((a, b) => a.start - b.start)[0];

  if (!match) return `${existing.trimEnd()}\n\n${buildInspirationBlock(inspiration)}\n`;

  const nextHeading = existing.indexOf('\n## ', match.start + match.heading.length);
  const before = existing.slice(0, match.start).trimEnd();
  const legacySection = existing.slice(match.start + match.heading.length, nextHeading === -1 ? undefined : nextHeading).trim();
  const after = nextHeading === -1 ? '' : existing.slice(nextHeading).trimStart();
  const migratedInspiration = inspiration.trim() || (legacySection === '-' ? '' : legacySection);

  return [before, buildInspirationBlock(migratedInspiration), after].filter(Boolean).join('\n\n') + '\n';
}

function upsertMarkedBlock(existing: string, startMarker: string, endMarker: string, block: string) {
  return replaceManagedBlock(existing, startMarker, endMarker, block);
}

function readMarkedBlockBody(existing: string, startMarker: string, endMarker: string) {
  return readTemplateMarkedBlockBody(existing, startMarker, endMarker);
}

function removeUnmarkedWorkSections(existing: string) {
  const workHeading = `## ${zh('\u4eca\u65e5\u5de5\u4f5c')}`;
  let content = existing;
  let searchFrom = 0;

  while (true) {
    const start = content.indexOf(workHeading, searchFrom);
    if (start === -1) return content;

    const markerStart = content.lastIndexOf(WORK_START_MARKER, start);
    const markerEnd = content.indexOf(WORK_END_MARKER, start);
    const insideMarkedBlock = markerStart !== -1 && markerEnd !== -1 && markerStart < start && start < markerEnd;

    if (insideMarkedBlock) {
      searchFrom = start + workHeading.length;
      continue;
    }

    const nextHeading = content.indexOf('\n## ', start + workHeading.length);
    const before = content.slice(0, start).trimEnd();
    const after = nextHeading === -1 ? '' : content.slice(nextHeading).trimStart();
    content = [before, after].filter(Boolean).join('\n\n') + '\n';
    searchFrom = before.length;
  }
}

function migrateLegacyWorkSection(existing: string, dailyWork = '') {
  const workHeading = `## ${zh('\u4eca\u65e5\u5de5\u4f5c')}`;
  if (existing.includes(WORK_START_MARKER)) return removeUnmarkedWorkSections(existing);

  const start = existing.indexOf(workHeading);
  if (start === -1) return existing;

  const nextHeading = existing.indexOf('\n## ', start + workHeading.length);
  const before = existing.slice(0, start).trimEnd();
  const legacySection = existing.slice(start + workHeading.length, nextHeading === -1 ? undefined : nextHeading).trim();
  const after = nextHeading === -1 ? '' : existing.slice(nextHeading).trimStart();
  const migratedWork = dailyWork.trim() || (legacySection === '-' ? '' : legacySection);

  return [before, buildWorkBlock(migratedWork), after].filter(Boolean).join('\n\n') + '\n';
}

function buildBlogDraft(date: string, tasks: Task[], obsidianContent = '') {
  const selected = getDateKey(date);
  const taskLines = buildTaskLines(tasks, selected);
  const completed = tasks.filter((task) => getTaskDate(task) === selected && task.completed).length;
  const total = tasks.filter((task) => getTaskDate(task) === selected).length;

  return [
    '---',
    `title: "${selected} ${zh('\u6bcf\u65e5\u5de5\u4f5c\u4e0e\u7075\u611f\u95ea\u5ff5')}"`,
    `date: "${selected}"`,
    `category: "${zh('\u6bcf\u65e5\u8bb0\u5f55')}"`,
    `tags: ["${zh('\u5de5\u4f5c\u8bb0\u5f55')}", "${zh('\u7075\u611f\u95ea\u5ff5')}", "DailyTodo"]`,
    `excerpt: "${zh('\u4eca\u65e5\u5b8c\u6210')} ${completed}/${total} ${zh('\u9879\u4efb\u52a1\uff0c\u6574\u7406\u5de5\u4f5c\u8fdb\u5c55\u548c\u7075\u611f\u7247\u6bb5\u3002')}"`,
    'draft: true',
    '---',
    '',
    `# ${selected} ${zh('\u6bcf\u65e5\u5de5\u4f5c\u4e0e\u7075\u611f\u95ea\u5ff5')}`,
    '',
    `## ${zh('\u4eca\u5929\u505a\u4e86\u4ec0\u4e48')}`,
    obsidianContent.trim() || zh('\u4eca\u5929\u7684\u5de5\u4f5c\u8bb0\u5f55\u8fd8\u6ca1\u6709\u586b\u5199\u3002'),
    '',
    `## ${zh('\u4efb\u52a1\u56de\u987e')}`,
    taskLines.length ? taskLines.join('\n') : `- ${zh('\u4eca\u5929\u8fd8\u6ca1\u6709\u8bb0\u5f55\u4efb\u52a1\u3002')}`,
    '',
    `## ${zh('\u53ef\u4ee5\u7ee7\u7eed\u6c89\u6dc0\u7684\u5185\u5bb9')}`,
    `- ${zh('\u8fd9\u91cc\u53ef\u4ee5\u5728\u53d1\u5e03\u524d\u8865\u5145\u66f4\u5b8c\u6574\u7684\u590d\u76d8\u3001\u94fe\u63a5\u6216\u56fe\u7247\u3002')}`,
    '',
    `> ${zh('\u8fd9\u7bc7\u6587\u7ae0\u7531')} DailyTodo ${zh('\u81ea\u52a8\u751f\u6210\u8349\u7a3f\uff0c\u53d1\u5e03\u524d\u53ef\u4ee5\u628a')} \`draft: true\` ${zh('\u6539\u4e3a')} \`draft: false\`${zh('\u3002')}`,
    '',
  ].join('\n');
}

function syncOneDailyNote(tasks: Task[], selected: string, dailyWork = '', inspiration = '', useProvidedDailySections = false) {
  const templates = getObsidianTemplateSettings();
  const filePath = getDailyFilePath(selected);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const existing = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : buildDailyTemplate(selected, dailyWork, inspiration, templates);
  const migratedWork = migrateLegacyWorkSection(existing, dailyWork);
  const migratedInspiration = migrateLegacyInspirationSection(migratedWork, inspiration);
  const existingWork = readMarkedBlockBody(migratedInspiration, WORK_START_MARKER, WORK_END_MARKER);
  const existingInspiration = readMarkedBlockBody(migratedInspiration, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER);
  const nextWork = useProvidedDailySections ? dailyWork : existingWork;
  const nextInspiration = useProvidedDailySections ? (inspiration.trim() || existingInspiration) : existingInspiration;
  const withWork = upsertMarkedBlock(migratedInspiration, WORK_START_MARKER, WORK_END_MARKER, buildWorkBlock(nextWork, templates));
  const withInspiration = upsertMarkedBlock(withWork, INSPIRATION_START_MARKER, INSPIRATION_END_MARKER, buildInspirationBlock(nextInspiration, templates));
  const nextContent = upsertMarkedBlock(withInspiration, TASK_START_MARKER, TASK_END_MARKER, buildTaskBlock(selected, tasks, templates));
  fs.writeFileSync(filePath, nextContent, 'utf-8');
  return { filePath, nextContent };
}

function getDatesAffectedBySync(tasks: Task[], selected: string) {
  const dates = new Set([selected]);

  tasks.forEach((task) => {
    const taskDate = getTaskDate(task);
    const hasRecordOnSelected = getCompletionReviews(task).some((review) => getReviewDate(review) === selected);

    if (taskDate === selected || hasRecordOnSelected) {
      dates.add(taskDate);
    }
  });

  return Array.from(dates);
}

function syncTasksToObsidian(tasks: Task[], date?: string, dailyWork = '', inspiration = '') {
  const vaultStatus = getVaultStatus();
  if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, reason: vaultStatus.reason };

  const selected = getDateKey(date);
  const affectedDates = getDatesAffectedBySync(tasks, selected);
  let selectedResult = syncOneDailyNote(tasks, selected, dailyWork, inspiration, true);

  affectedDates
    .filter((affectedDate) => affectedDate !== selected)
    .forEach((affectedDate) => {
      syncOneDailyNote(tasks, affectedDate);
    });

  if (fs.existsSync(LOCAL_BLOG_DRAFT_DIR)) {
    fs.writeFileSync(path.join(LOCAL_BLOG_DRAFT_DIR, `daily-memo-${selected}.md`), buildBlogDraft(selected, tasks, selectedResult.nextContent), 'utf-8');
  }
  triggerOverviewUpdate(selectedResult.filePath);
  void runReviewForDate(selected, tasks).catch(() => {});
  return { ok: true, filePath: selectedResult.filePath };
}

function previewTasksToObsidian(tasks: Task[], date?: string, dailyWork = '', inspiration = '', beforeTasks?: Task[]) {
  const vaultStatus = getVaultStatus();
  if (!vaultStatus.ok || !vaultStatus.vaultPath) {
    return {
      files: [],
      managedBlocks: [],
      taskCount: 0,
      completionRecordCount: 0,
      deletedReviewWillDisappear: false,
      error: vaultStatus.reason,
    };
  }

  const selected = getDateKey(date);
  const filePath = getDailyFilePath(selected);
  const existingDailyNote = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
  return buildSyncPreview({
    date: selected,
    tasksBeforeDelete: beforeTasks,
    tasksAfterDelete: tasks,
    dailyWork,
    dailyInspiration: inspiration,
    templates: getObsidianTemplateSettings(),
    vaultPath: vaultStatus.vaultPath,
    existingDailyNote,
  });
}

function getInitialBounds() {
  const saved = store.get(WINDOW_STATE_KEY) as WindowState | undefined;
  const { workArea } = screen.getPrimaryDisplay();
  const width = Math.max(MIN_WINDOW_WIDTH, saved?.width || DEFAULT_WINDOW_WIDTH);
  const height = saved?.height || DEFAULT_WINDOW_HEIGHT;
  const x = saved?.x ?? workArea.x + workArea.width - width - 30;
  const y = saved?.y ?? workArea.y + 48;
  return { width, height, x, y };
}

function loadRenderer(win: BrowserWindow, route: RendererRoute) {
  const devServerUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
  if (devServerUrl) {
    const url = buildDevRendererUrl(devServerUrl, route);
    diag(`loadURL ${url}`);
    win.loadURL(url);
    return;
  }

  const query = buildRendererQuery(route);
  diag(`loadFile dist/index.html ${JSON.stringify(query)}`);
  win.loadFile(path.join(__dirname, '../dist/index.html'), { query });
}

function persistWindowState(win: BrowserWindow) {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    if (win.isDestroyed() || win.isMinimized()) return;
    store.set(WINDOW_STATE_KEY, win.getBounds());
  }, 250);
}

/** 从存储解析当前窗口模式（含旧布尔 alwaysOnTop 的迁移）。 */
function getStoredWindowMode(): WindowMode {
  return resolveWindowMode(store.get(WINDOW_MODE_KEY), store.get(LEGACY_ALWAYS_ON_TOP_KEY));
}

// ===== 桌面组件模式：状态机轮询 =====
// desktop-visible：桌面前台，DT 挂到桌面并保持可见。
// app-background：真实应用前台，DT 清 owner / topmost 并沉底。
// dt-active：用户正在操作 DT，DT 可临时浮上来；一旦真实应用前台就退回 app-background。
// 用轮询而非 blur 事件，是因为 DT 被 app 盖住后再点桌面，DT 收不到 blur（它本就没焦点）。
let desktopGuardTimer: NodeJS.Timeout | null = null;
let desktopWidgetState: DesktopWidgetState = 'app-background';
const DESKTOP_GUARD_INTERVAL_MS = 64;
// 用户是否主动隐藏了窗口（托盘「隐藏窗口」/ 标题栏最小化）。为真时轮询不自动弹回，
// 以区分「用户想藏」与「Win+D 把它藏了」——后者要自动恢复，前者要尊重。
let userHidden = false;
// 防抖：每次 show() + setTopmost() 后至少等 200ms 再调，避免 32ms 轮询导致 DWM 频繁重绘造成闪烁。
let desktopLastShownAt = 0;
// deskop 模式下跟踪 owner 是否已挂到 Progman。只有桌面态才挂 owner，应用前台时清掉 owner，
// 避免窗口留在桌面特殊层，导致恢复其它应用后仍压在上面。
function applyDesktopTopmost(win: BrowserWindow) {
  if (win.isDestroyed() || windowMode !== 'desktop') return;
  if (!win32) return;

  const handle = win.getNativeWindowHandle();
  if (!handle) return;

  const fgClass = win32.getForegroundClass();
  const ownForeground = win32.isForegroundWindow(handle);
  const shellForeground = DESKTOP_FG_CLASSES.has(fgClass);
  const now = Date.now();

  if (shellForeground) {
    desktopShellSeenAt = now;
  } else if (fgClass && !ownForeground) {
    desktopShellSeenAt = 0;
  }
  const withinDesktopGrace = fgClass === '' && desktopShellSeenAt > 0 && now - desktopShellSeenAt < 700;

  const nextState: DesktopWidgetState = ownForeground
    ? 'dt-active'
    : (shellForeground || withinDesktopGrace)
      ? 'desktop-visible'
      : 'app-background';

  if (nextState === 'app-background' && fgClass && !ownForeground && fgClass !== lastAppForegroundClass) {
    lastAppForegroundClass = fgClass;
    appBackgroundSettleUntil = now + 900;
  }
  if (nextState !== 'app-background') {
    lastAppForegroundClass = '';
    appBackgroundSettleUntil = 0;
  }
  const shouldForceAppBackground = nextState === 'app-background' && now < appBackgroundSettleUntil;

  const snapshot = `fg=${fgClass || '(none)'} own=${ownForeground} shell=${shellForeground} grace=${withinDesktopGrace} state=${desktopWidgetState}->${nextState} force=${shouldForceAppBackground} owner=${desktopOwnerApplied}`;
  if (snapshot !== lastDesktopGuardSnapshot) {
    lastDesktopGuardSnapshot = snapshot;
    diag(`desktop guard snapshot: ${snapshot}`);
  }

  applyDesktopWidgetState(win, nextState, shouldForceAppBackground);
}

function startDesktopGuard(win: BrowserWindow) {
  stopDesktopGuard();
  desktopWidgetState = 'app-background';
  applyDesktopTopmost(win);
  desktopGuardTimer = setInterval(() => applyDesktopTopmost(win), DESKTOP_GUARD_INTERVAL_MS);
}

function stopDesktopGuard() {
  if (desktopGuardTimer) {
    clearInterval(desktopGuardTimer);
    desktopGuardTimer = null;
  }
  desktopWidgetState = 'app-background';
}

// ===== 桌面模式：owner=Progman 豁免 Win+D =====
// 窗口仍是普通可交互顶层窗口（不做 WS_CHILD 子窗口嵌入——那会命中历史原生崩溃且透明窗口渲染异常）。
// 只把 owner 设为桌面根窗口 Progman，让「显示桌面」(Win+D) 把它当桌面一部分、不最小化。
// owner 仅在进入/退出 desktop 模式时各设一次，绝不在 blur/focus/minimize 等高频事件里调用。
let desktopOwnerApplied = false;

/** 进入 desktop 模式：把 owner 设为 Progman。失败（无 win32 / 抛错）不崩溃，仅记日志，靠轮询兜底。 */
function applyDesktopOwner(win: BrowserWindow) {
  if (win.isDestroyed()) return;
  const handle = win.getNativeWindowHandle();
  if (!win32 || !handle) {
    diag('owner: no win32 / no handle → skip (polling still active)');
    return;
  }
  try {
    const ok = win32.setDesktopOwner(handle);
    desktopOwnerApplied = ok;
    diag(`owner: setDesktopOwner ${ok ? 'ok' : 'progman-not-found'}`);
  } catch (error) {
    desktopOwnerApplied = false;
    diag(`owner: set threw → skip: ${String(error)}`);
  }
}

/** 退出 desktop 模式：还原 owner 为 null。仅当之前设过才清，避免无谓的原生调用。 */
function clearDesktopOwner(win: BrowserWindow) {
  if (!desktopOwnerApplied || win.isDestroyed()) return;
  const handle = win.getNativeWindowHandle();
  if (!win32 || !handle) return;
  try {
    win32.clearDesktopOwner(handle);
    diag('owner: cleared');
  } catch (error) {
    diag(`owner: clear threw: ${String(error)}`);
  } finally {
    desktopOwnerApplied = false;
  }
}

/**
 * 应用窗口模式——控制 Z 序与 Win+D 豁免。
 * - onTop：永久置顶。
 * - normal：普通 Z 序，可被盖住。
 * - desktop：owner 设为桌面(Progman) 让 Win+D 收不走 + 智能置顶轮询（前台是桌面时置顶、是其它 app
 *   时沉底让位），共同实现「固定在桌面、不盖应用」的桌面组件观感。
 *
 * 任务栏：仅 normal 模式进任务栏。onTop / desktop 不进任务栏，保持挂件观感。
 */
function applyWindowMode(win: BrowserWindow, mode: WindowMode) {
  windowMode = mode;
  try {
    win.setSkipTaskbar(mode !== 'normal');
    if (mode === 'desktop') {
      win.setAlwaysOnTop(false, 'normal'); // desktop 模式的层级完全由状态机管理
      startDesktopGuard(win);
    } else {
      stopDesktopGuard();
      clearDesktopOwner(win); // 退出 desktop 时还原 owner
      win.setAlwaysOnTop(isAlwaysOnTop(mode));
    }
    diag(`applyWindowMode mode=${mode} alwaysOnTop=${isAlwaysOnTop(mode)} skipTaskbar=${mode !== 'normal'}`);
  } catch (error) {
    diag(`applyWindowMode failed: ${String(error)}`);
  }
}

/** 持久化模式并应用，再把新模式推送给渲染层让标题栏图钉同步。 */
function setWindowMode(win: BrowserWindow, mode: WindowMode) {
  store.set(WINDOW_MODE_KEY, mode);
  applyWindowMode(win, mode);
  if (!win.isDestroyed()) {
    win.webContents.send('window:modeChanged', mode);
  }
  if (tray) refreshTrayMenu();
}

function showMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  userHidden = false; // 用户主动显示 → 解除「主动隐藏」，恢复 Win+D 自动弹回
  if (mainWindow.isMinimized()) mainWindow.restore();
  if (windowMode === 'desktop') {
    desktopWidgetState = 'dt-active';
  }
  mainWindow.show();
  mainWindow.focus();
}

function hideMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  userHidden = true; // 用户主动隐藏（托盘/最小化按钮）→ 轮询不再自动弹回，尊重用户
  mainWindow.hide();
}

/** 重建托盘菜单，让「钉在桌面」勾选项反映当前模式。 */
function refreshTrayMenu() {
  if (!tray) return;
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: zh('打开 DailyTodo'), click: showMainWindow },
      {
        label: zh('钉在桌面（组件模式）'),
        type: 'checkbox',
        checked: windowMode === 'desktop',
        click: (menuItem) => {
          if (!mainWindow || mainWindow.isDestroyed()) return;
          setWindowMode(mainWindow, setDesktopMode(windowMode, menuItem.checked));
        },
      },
      { label: zh('隐藏窗口'), click: hideMainWindow },
      { type: 'separator' },
      {
        label: zh('退出'),
        click: () => {
          isQuitting = true;
          app.quit();
        },
      },
    ])
  );
}

function createTray() {
  if (tray) return;

  tray = new Tray(createTrayIcon());
  tray.setToolTip('DailyTodo');
  refreshTrayMenu();
  tray.on('click', showMainWindow);
}

function createWindow() {
  if (!store.get(OBSIDIAN_PATH_KEY) && getDefaultVaultPath()) {
    store.set(OBSIDIAN_PATH_KEY, getDefaultVaultPath());
  }

  const bounds = getInitialBounds();
  const initialMode = getStoredWindowMode();

  const win = new BrowserWindow({
    ...bounds,
    minWidth: MIN_WINDOW_WIDTH,
    minHeight: 480,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    hasShadow: true,
    skipTaskbar: true,
    resizable: true,
    show: false,
    alwaysOnTop: isAlwaysOnTop(initialMode),
    icon: createAppIcon(),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // 失焦/被遮挡时不节流渲染，配合关闭 occlusion 一起防止透明窗口静默停绘。
      backgroundThrottling: false,
    },
  });

  mainWindow = win;
  diag('BrowserWindow created');
  scheduleAiTimer(win);
  scheduleWeeklyTimer(win);
  scheduleMonthlyTimer(win);
  // 工具窗口样式：不上任务栏 / 不进 Alt+Tab（保持挂件观感）。
  applyToolWindowStyle(win);
  applyWindowMode(win, initialMode);
  createTray();
  diag('tray created');

  loadRenderer(win, { view: 'main' });

  win.once('ready-to-show', () => {
    diag('ready-to-show → show()');
    win.show();
  });

  // 诊断里程碑：定位「静默消失」发生在哪一步。
  win.webContents.on('did-finish-load', () => diag('did-finish-load'));
  win.webContents.on('did-fail-load', (_e, code, desc) => diag(`did-fail-load ${code} ${desc}`));
  win.webContents.on('preload-error', (_e, p, err) => diag(`preload-error ${p}: ${String(err)}`));
  win.on('show', () => diag('evt: show'));
  win.on('closed', () => {
    diag('evt: closed');
    stopDesktopGuard();
  });
  // 全量窗口状态事件埋点：一次复现即可确定 Win+D / 点桌面到底触发了哪个事件。
  win.on('hide', () => {
    diag('evt: hide');
    // 诊断：记录 userHidden 和 windowMode 状态
    diag(`  userHidden=${userHidden} windowMode=${windowMode} isVisible=${win.isVisible()}`);
  });
  win.on('minimize', () => {
    diag('evt: minimize');
    diag(`  userHidden=${userHidden} windowMode=${windowMode} isVisible=${win.isVisible()}`);

    // 兜底：某些情况下 Win+D 会真的最小化窗口。desktop 模式且非用户主动隐藏时恢复（不抢焦点）。
    if (!needsDesktopGuard(windowMode) || isQuitting || win.isDestroyed() || userHidden) return;
    try {
      win.showInactive();
      diag('desktop guard: showInactive after minimize');
    } catch (error) {
      diag(`desktop guard failed: ${String(error)}`);
    }
  });
  win.on('restore', () => diag('evt: restore'));
  // 注意：不要在 blur 里重设任何原生窗口标志（SetParent/SetWindowLongPtr）——透明窗口在「点击桌面」
  // 失焦瞬间重设这些标志会触发主进程原生崩溃（已由 diag.log 确认）。owner 只在模式切换时设一次。
  win.on('blur', () => diag('evt: blur'));
  win.on('focus', () => diag('evt: focus'));

  // 仅记录渲染进程崩溃，不自动 reload（自动 reload 会造成崩溃→重载→再崩的循环）。
  win.webContents.on('render-process-gone', (_event, details) => {
    diag(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  win.on('unresponsive', () => diag('window unresponsive'));

  win.on('move', () => persistWindowState(win));
  win.on('resize', () => persistWindowState(win));
  // Win+D / 切换前台会让窗口失焦并可能被「显示桌面」压下；失焦时重新确立 screen-saver 层级，
  // 把它带回桌面之上（仅在置顶开启时）。
  // 注意：不要在 blur 里重新设置 setAlwaysOnTop/setVisibleOnAllWorkspaces。
  // 透明窗口在「点击桌面」失焦的瞬间重设这些原生窗口标志，会在主进程触发原生崩溃
  // （无 JS 异常、无 minidump，进程直接消失——已由 diag.log 确认）。层级只在创建/显示时设一次。
  win.on('close', (event) => {
    if (isQuitting) return;
    event.preventDefault();
    hideMainWindow();
  });

  ipcMain.handle('window:minimize', hideMainWindow);
  ipcMain.handle('window:close', hideMainWindow);

  // 新接口：完整的三模式。
  ipcMain.handle('window:getWindowMode', () => windowMode);
  ipcMain.handle('window:setWindowMode', (_event, mode: WindowMode) => {
    setWindowMode(win, mode);
    return windowMode;
  });

  // 兼容垫片：旧渲染层用布尔置顶接口。getAlwaysOnTop 返回是否 onTop；
  // toggle 在 normal ↔ onTop 间切（若当前 desktop，按图钉语义退出到 onTop）。
  ipcMain.handle('window:getAlwaysOnTop', () => windowMode === 'onTop');
  ipcMain.handle('window:toggleAlwaysOnTop', () => {
    setWindowMode(win, togglePinnedMode(windowMode));
    return windowMode === 'onTop';
  });

  ipcMain.handle('window:resetPosition', () => {
    const { workArea } = screen.getPrimaryDisplay();
    const bounds = {
      width: RESET_WINDOW_WIDTH,
      height: RESET_WINDOW_HEIGHT,
      x: workArea.x + workArea.width - RESET_WINDOW_WIDTH - 30,
      y: workArea.y + 48,
    };
    win.setBounds(bounds);
    persistWindowState(win);
    return bounds;
  });

  ipcMain.handle('window:getLockWindowPosition', () => getAppSettings().lockWindowPosition);

  ipcMain.handle('window:setLockWindowPosition', (_event, locked: boolean) => {
    const next = setAppSettings({ ...getAppSettings(), lockWindowPosition: Boolean(locked) });
    return next.lockWindowPosition;
  });

  ipcMain.handle('window:setCompactMode', (_, compactMode: boolean) => {
    store.set(COMPACT_MODE_KEY, compactMode);
  });

  ipcMain.handle('window:getCompactMode', () => {
    return Boolean(store.get(COMPACT_MODE_KEY, false));
  });

  ipcMain.handle('window:getAutoStart', () => {
    return Boolean(store.get(AUTO_START_KEY, false));
  });

  ipcMain.handle('window:setAutoStart', (_, enabled: boolean) => {
    store.set(AUTO_START_KEY, enabled);
    app.setLoginItemSettings({
      openAtLogin: enabled,
      path: app.getPath('exe'),
    });
    return enabled;
  });

  ipcMain.handle('store:get', (_, key: string) => store.get(key));
  ipcMain.handle('store:set', (event, key: string, value: unknown) => {
    store.set(key, value);
    // 任务变更广播给其它窗口（主窗口 ↔ 桌面组件双向实时同步）。
    // 排除发送方自身，避免回声；接收方靠内容比对跳过无变化更新，防止来回写形成死循环。
    if (key === 'tasks') {
      const senderId = event.sender.id;
      BrowserWindow.getAllWindows().forEach((win) => {
        if (win.isDestroyed() || win.webContents.id === senderId) return;
        win.webContents.send('tasks:changed', value);
      });
    }
  });

  ipcMain.handle('settings:getApp', () => getAppSettings());
  ipcMain.handle('settings:setApp', (_event, settings: unknown) => {
    setAppSettings(settings);
    return { ok: true };
  });
  ipcMain.handle('settings:getObsidianTemplates', () => getObsidianTemplateSettings());
  ipcMain.handle('settings:setObsidianTemplates', (_event, settings: unknown) => {
    setObsidianTemplateSettings(settings);
    return { ok: true };
  });
  ipcMain.handle('settings:resetObsidianTemplates', () => {
    const settings = createDefaultObsidianTemplateSettings();
    store.set(OBSIDIAN_TEMPLATE_SETTINGS_KEY, settings);
    return settings;
  });

  ipcMain.handle('aiReview:getSettings', () => getAiReviewSettings());
  ipcMain.handle('aiReview:setSettings', (_e, v: unknown) => {
    const next = normalizeAiReviewSettings(v);
    store.set(AI_REVIEW_SETTINGS_KEY, next);
    if (mainWindow && !mainWindow.isDestroyed()) {
      scheduleAiTimer(mainWindow);
      scheduleWeeklyTimer(mainWindow);
      scheduleMonthlyTimer(mainWindow);
    }
    return next;
  });
  ipcMain.handle('aiReview:getSections', () => getReviewSections());
  ipcMain.handle('aiReview:setSections', (_e, v: unknown) => {
    const next = normalizeSections(v);
    store.set(AI_REVIEW_SECTIONS_KEY, next);
    return next;
  });
  ipcMain.handle('aiReview:runForDate', (_e, date: string, tasks: Task[]) => runReviewForDate(getDateKey(date), tasks));
  ipcMain.handle('aiReview:backfill', async (_e, tasks: Task[]) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) return { processed: [], filled: [], errors: [] };
    const rollover = getAppSettings().rolloverTime;
    const today = getBusinessDateKey(new Date(), rollover);
    const dates = Array.from({ length: settings.backfillDays }, (_, i) => shiftDateKey(today, -i));
    return backfillReviews({
      dates,
      resolveFilePath: (d) => getDailyFilePath(d),
      tasksForDate: () => tasks as StatTask[],
      sections: getReviewSections(),
      callLlm: getLlmCaller(),
      fileExists: (p) => fs.existsSync(p),
    });
  });
  ipcMain.handle('aiReview:generateWeekly', async (_e, date: string, tasks: Task[]) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) return { ok: false, error: 'AI 复盘未启用或缺少 Key' };
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, error: vaultStatus.reason };
    const selected = getDateKey(date);
    // 取所在 ISO 周的周一到周日 7 天。
    const d = new Date(`${selected}T00:00:00`);
    const dayNr = (d.getDay() + 6) % 7;
    const monday = shiftDateKey(selected, -dayNr);
    const weekDates = Array.from({ length: 7 }, (_, i) => shiftDateKey(monday, i));
    const dailyContents = weekDates
      .map((wd) => {
        const filePath = getDailyFilePath(wd);
        return fs.existsSync(filePath) ? { date: wd, content: fs.readFileSync(filePath, 'utf-8') } : null;
      })
      .filter((x): x is { date: string; content: string } => x !== null);
    const stats = computeRangeStats(tasks as StatTask[], monday, weekDates[6]);
    return generatePersonalWeekly({
      vaultPath: vaultStatus.vaultPath,
      weekKey: isoWeekKey(selected),
      dailyContents,
      stats,
      relativeDir: sanitizeRelDir(settings.weeklyDir, DEFAULT_REPORT_DIRS.weekly),
      systemPrompt: settings.weeklyPrompt,
      callLlm: getLlmCaller(),
    });
  });
  ipcMain.handle('aiReview:generateMonthly', async (_e, date: string, tasks: Task[]) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) return { ok: false, error: 'AI 复盘未启用或缺少 Key' };
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, error: vaultStatus.reason };
    const month = monthKey(getDateKey(date));
    const { first, last } = monthRange(month);
    const dayCount = Number(last.slice(-2));
    // 当月所有日报全文（不再截断），同时收集本月相交 ISO 周的周报。
    const dailyReports: MonthlySource[] = [];
    const weekKeys = new Set<string>();
    for (let i = 0; i < dayCount; i++) {
      const wd = shiftDateKey(first, i);
      weekKeys.add(isoWeekKey(wd));
      const filePath = getDailyFilePath(wd);
      if (fs.existsSync(filePath)) dailyReports.push({ label: `${wd} 日报`, content: fs.readFileSync(filePath, 'utf-8') });
    }
    const weeklyDir = sanitizeRelDir(settings.weeklyDir, DEFAULT_REPORT_DIRS.weekly);
    const weeklyReports: MonthlySource[] = [];
    for (const wk of weekKeys) {
      const wkPath = path.join(vaultStatus.vaultPath, weeklyDir, `${wk}.md`);
      if (fs.existsSync(wkPath)) weeklyReports.push({ label: `${wk} 周报`, content: fs.readFileSync(wkPath, 'utf-8') });
    }
    // 周报优先，没有则回落当月日报全文。
    const sources = selectMonthlySources(weeklyReports, dailyReports);
    const stats = computeRangeStats(tasks as StatTask[], first, last);
    return generatePersonalMonthly({
      vaultPath: vaultStatus.vaultPath,
      month,
      sources,
      stats,
      relativeDir: sanitizeRelDir(settings.monthlyDir, DEFAULT_REPORT_DIRS.monthly),
      systemPrompt: settings.monthlyPrompt,
      callLlm: getLlmCaller(),
    });
  });
  ipcMain.handle('aiReview:generateExternal', async (_e, kind: 'weekly' | 'monthly', date: string) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) return { ok: false, error: 'AI 复盘未启用或缺少 Key' };
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, error: vaultStatus.reason };
    const selected = getDateKey(date);
    let periodKey: string;
    let dates: string[];
    if (kind === 'weekly') {
      const d = new Date(`${selected}T00:00:00`);
      const monday = shiftDateKey(selected, -((d.getDay() + 6) % 7));
      dates = Array.from({ length: 7 }, (_, i) => shiftDateKey(monday, i));
      periodKey = isoWeekKey(selected);
    } else {
      const month = monthKey(selected);
      const { first, last } = monthRange(month);
      dates = Array.from({ length: Number(last.slice(-2)) }, (_, i) => shiftDateKey(first, i));
      periodKey = month;
    }
    const rawDailyContents = dates
      .map((d) => {
        const filePath = getDailyFilePath(d);
        return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';
      })
      .filter(Boolean);
    const externalDir =
      kind === 'weekly'
        ? sanitizeRelDir(settings.externalWeeklyDir, DEFAULT_REPORT_DIRS.externalWeekly)
        : sanitizeRelDir(settings.externalMonthlyDir, DEFAULT_REPORT_DIRS.externalMonthly);
    const externalPrompt = kind === 'weekly' ? settings.externalWeeklyPrompt : settings.externalMonthlyPrompt;
    const externalDefault = kind === 'weekly' ? DEFAULT_EXTERNAL_WEEKLY_SYSTEM : DEFAULT_EXTERNAL_MONTHLY_SYSTEM;
    return generateExternalReport({
      vaultPath: vaultStatus.vaultPath,
      kind,
      periodKey,
      relativeDir: externalDir,
      rawDailyContents,
      buildMessages: (redacted) =>
        buildMonthlyMessages({
          month: periodKey,
          sources: [{ label: periodKey, content: redacted }],
          stats: { start: dates[0], end: dates[dates.length - 1], activeDays: 0, totalCompleted: 0, totalTasks: 0, streak: 0 },
          systemPrompt: externalPrompt?.trim() || externalDefault,
        }),
      callLlm: getLlmCaller(),
    });
  });
  ipcMain.handle('aiReview:recognizeTemplate', async (_e, rawTemplate: string) => {
    const fallback = getReviewSections();
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) {
      return { ok: false, error: 'AI 复盘未启用或缺少 Key', sections: fallback, unmatched: true };
    }
    if (typeof rawTemplate !== 'string' || !rawTemplate.trim()) {
      return { ok: false, error: '请粘贴你的模板内容', sections: fallback, unmatched: true };
    }
    const llm = await getLlmCaller()(buildRecognizeMessages(rawTemplate));
    if (!llm.ok) return { ok: false, error: llm.error, sections: fallback, unmatched: true };
    const parsed = parseRecognizedSections(llm.content, fallback);
    return { ok: true, sections: parsed.sections, confidence: parsed.confidence, unmatched: parsed.unmatched };
  });
  ipcMain.handle('aiReview:recognizeReportTemplate', async (_e, kind: 'weekly' | 'monthly', rawTemplate: string) => {
    const settings = getAiReviewSettings();
    if (!settings.enabled || !resolveActiveProfile(settings).apiKey) return { ok: false, error: 'AI 复盘未启用或缺少 Key', prompt: '' };
    if (typeof rawTemplate !== 'string' || !rawTemplate.trim()) return { ok: false, error: '请粘贴你的报告模板', prompt: '' };
    const safeKind = kind === 'monthly' ? 'monthly' : 'weekly';
    const llm = await getLlmCaller()(buildRecognizeReportMessages(rawTemplate, safeKind));
    if (!llm.ok) return { ok: false, error: llm.error, prompt: '' };
    const prompt = parseRecognizedReportPrompt(llm.content);
    if (!prompt) return { ok: false, error: '未能识别出可用的生成指令', prompt: '' };
    return { ok: true, prompt };
  });

  // 一键拉取模型列表：用「正在编辑」的账号配置（前端传入，不必是当前生效账号）。
  ipcMain.handle('aiReview:listModels', async (
    _e,
    cfg: { baseUrl?: string; apiKey?: string; provider?: LlmProvider | 'auto' },
  ) => {
    const baseUrl = typeof cfg?.baseUrl === 'string' ? cfg.baseUrl : '';
    const apiKey = typeof cfg?.apiKey === 'string' ? cfg.apiKey : '';
    const provider = cfg?.provider ?? 'auto';
    return listModels({ baseUrl, apiKey, model: '' }, { provider, timeoutMs: 20_000 });
  });

  // 「选文件」识别模板：弹文件框 → 读取 → 解析纯文本，回填到识别草稿框。
  ipcMain.handle('aiReview:pickTemplateFile', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: zh('选择模板文件（.md / .txt / .docx）'),
      defaultPath: getVaultPath() || app.getPath('documents'),
      properties: ['openFile'],
      filters: [{ name: zh('模板文件'), extensions: ['md', 'txt', 'docx'] }],
    });
    if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
    const filePath = result.filePaths[0];
    const fileName = path.basename(filePath);
    try {
      const buffer = fs.readFileSync(filePath);
      const parsed = await parseTemplateFile(buffer, fileName, extractDocxText);
      if (!parsed.ok) return { ok: false, error: parsed.error };
      return { ok: true, text: parsed.text, fileName };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });

  ipcMain.handle('obsidian:getPath', () => store.get(OBSIDIAN_PATH_KEY) || getDefaultVaultPath());

  ipcMain.handle('obsidian:choosePath', async () => {
    const result = await dialog.showOpenDialog(win, {
      title: zh('\u9009\u62e9 Obsidian \u4ed3\u5e93\u6216\u7528\u4e8e\u4fdd\u5b58\u6bcf\u65e5\u4efb\u52a1\u7684\u6587\u4ef6\u5939'),
      defaultPath: getVaultPath() || app.getPath('documents'),
      properties: ['openDirectory', 'createDirectory'],
    });

    if (result.canceled || !result.filePaths[0]) {
      return store.get(OBSIDIAN_PATH_KEY) || getDefaultVaultPath();
    }

    store.set(OBSIDIAN_PATH_KEY, result.filePaths[0]);
    return result.filePaths[0];
  });

  ipcMain.handle('obsidian:syncTasks', (_, tasks: Task[], date?: string, dailyWork?: string, inspiration?: string) => syncTasksToObsidian(tasks, date, dailyWork || '', inspiration || ''));

  ipcMain.handle('obsidian:previewTasks', (_, tasks: Task[], date?: string, dailyWork?: string, inspiration?: string, beforeTasks?: Task[]) => previewTasksToObsidian(tasks, date, dailyWork || '', inspiration || '', beforeTasks));

  ipcMain.handle('obsidian:openDailyNote', async (_, date?: string) => {
    const vaultStatus = getVaultStatus();
    if (!vaultStatus.ok || !vaultStatus.vaultPath) return { ok: false, reason: vaultStatus.reason };

    const selected = getDateKey(date);
    const filePath = getDailyFilePath(selected);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (!fs.existsSync(filePath)) fs.writeFileSync(filePath, buildDailyTemplate(selected), 'utf-8');
    triggerOverviewUpdate(filePath);
    const result = await shell.openPath(filePath);
    return result ? { ok: false, reason: result } : { ok: true, filePath };
  });

  ipcMain.handle('companion:getSettings', () => getCompanionSettings());
  ipcMain.handle('companion:setSettings', (_event, settings: CompanionSettings) => {
    setCompanionSettings(settings);
    return { ok: true };
  });
  ipcMain.handle('companion:previewSync', (_event, settings: CompanionSettings, items) => {
    return buildSyncPlan(settings, items || []);
  });
  ipcMain.handle('companion:writeSync', (_event, settings: CompanionSettings, items) => {
    const plan = buildSyncPlan(settings, items || []);
    return writeSyncPlan(plan);
  });
  ipcMain.handle('companion:importMobileInbox', (_event, inboxPath: string) => {
    return importMobileInbox(inboxPath);
  });
}

app.whenReady().then(() => {
  diag('whenReady → createWindow');
  createWindow();
  diag('createWindow returned');
}).catch((error) => diag(`whenReady error: ${String(error)}`));

// GPU / 工具子进程偶发崩溃时只记录、不退出，避免带崩主窗口。
app.on('child-process-gone', (_event, details) => {
  diag(`child-process-gone type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`);
  if (details.type === 'GPU') {
    // GPU 进程崩溃后 Chromium 会自行重启合成；这里不做处理，仅防止默认行为升级为退出。
  }
});

app.on('before-quit', () => {
  diag('before-quit');
  isQuitting = true;
  // 退出前若设过 owner，还原为普通顶层窗口，避免句柄关系残留。
  if (mainWindow && !mainWindow.isDestroyed() && windowMode === 'desktop') {
    clearDesktopOwner(mainWindow);
  }
});
app.on('will-quit', () => diag('will-quit'));
app.on('quit', (_e, code) => diag(`quit code=${code}`));

app.on('window-all-closed', () => {
  diag('window-all-closed');
  mainWindow = null;
  if (isQuitting && process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
