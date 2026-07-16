import { BrowserWindow } from 'electron';
import { existsSync } from 'node:fs';
import { release } from 'node:os';
import { join } from 'node:path';
import {
  createInvisibleGlassSettings,
  createWin32AccentPolicyFromGlass,
  type InvisibleGlassSettings,
  normalizeInvisibleGlassPayload,
} from '../shared/invisibleGlass';

export type Win32Api = {
  ptr: (handle: Buffer) => unknown;
  getExStyle: (hwnd: unknown) => number;
  setExStyle: (hwnd: unknown, style: number) => void;
  getForegroundClass: () => string;
  isForegroundWindow: (handle: Buffer) => boolean;
  setTopmost: (handle: Buffer) => void;
  clearTopmost: (handle: Buffer) => void;
  sendToBottom: (handle: Buffer) => void;
  attachToDesktop: (handle: Buffer) => boolean;
  detachFromDesktop: (handle: Buffer) => void;
  isAttachedToDesktop: (handle: Buffer) => boolean;
  setDesktopOwner: (handle: Buffer) => boolean;
  clearDesktopOwner: (handle: Buffer) => void;
  getCursorPosition: () => Win32CursorPosition | null;
  setWindowDragRegion: (handle: Buffer, region: NativeWindowDragRegion) => boolean;
  setAcrylic: (handle: Buffer, settings: InvisibleGlassSettings) => boolean;
  setDwmBlur: (handle: Buffer, enabled: boolean) => boolean;
};

export type Win32CursorPosition = {
  x: number;
  y: number;
};

export type NativeWindowDragRegion = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  enabled: boolean;
};

export type CreateWin32NativeHelpersOptions = {
  diag(message: string): void;
};

export type Win32NativeHelpers = {
  win32: Win32Api | null;
  getCursorPosition(): Win32CursorPosition | null;
  isDesktopForeground(): boolean;
  applyToolWindowStyle(win: BrowserWindow): boolean;
  applyNativeBackgroundMaterial(win: BrowserWindow): void;
  setInvisibleGlassBackgroundMaterial(win: BrowserWindow, payload: unknown): boolean;
  setNativeWindowDragRegion(win: BrowserWindow, region: NativeWindowDragRegion): boolean;
};

export type NativeBackgroundMaterialWindow = {
  setBackgroundMaterial(material: 'auto' | 'none' | 'mica' | 'acrylic' | 'tabbed'): void;
};

const GWL_EXSTYLE = -20;
const WS_EX_TOOLWINDOW = 0x00000080;

const HWND_TOPMOST = -1;
const HWND_NOTOPMOST = -2;
const HWND_BOTTOM = 1;
const SWP_NOSIZE = 0x0001;
const SWP_NOMOVE = 0x0002;
const SWP_NOACTIVATE = 0x0010;
const GWLP_HWNDPARENT = -8;
const SMTO_NORMAL = 0x0000;
const PROGMAN_SPAWN_WORKERW = 0x052c;
const WCA_ACCENT_POLICY = 19;
const WINDOWS_11_BUILD = 22000;

export function createWin32AccentPolicy(
  enabled: boolean,
  options: { opacity?: number; blurStrength?: number } = {},
) {
  return createWin32AccentPolicyFromGlass(createInvisibleGlassSettings({
    enabled,
    opacity: options.opacity,
    blurStrength: options.blurStrength ?? (enabled ? 24 : 0),
  }));
}

export function runWin32Operation<T>(
  diag: (message: string) => void,
  operation: string,
  run: () => T,
  fallback: T,
): T {
  try {
    return run();
  } catch (error) {
    diag(`Win32 ${operation} failed: ${String(error)}`);
    return fallback;
  }
}

export function decodeNativeWindowHandle(handle: Buffer): bigint {
  return process.arch === 'x64'
    ? handle.readBigUInt64LE(0)
    : BigInt(handle.readUInt32LE(0));
}

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

function createWin32Api(diag: (message: string) => void): Win32Api | null {
  if (process.platform !== 'win32') return null;

  try {
    const koffi = require('koffi');
    const user32 = koffi.load('user32.dll');
    const dwmapi = koffi.load('dwmapi.dll');

    const GetWindowLongPtrW = user32.func('intptr_t __stdcall GetWindowLongPtrW(void* hWnd, int nIndex)');
    const GetWindowLongPtrW_Ptr = user32.func('void* __stdcall GetWindowLongPtrW(void* hWnd, int nIndex)');
    const SetWindowLongPtrW = user32.func('intptr_t __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, intptr_t dwNewLong)');
    const SetWindowLongPtrW_Ptr = user32.func('void* __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, void* dwNewLong)');
    const GetForegroundWindow = user32.func('void* __stdcall GetForegroundWindow()');
    const GetClassNameW = user32.func('int __stdcall GetClassNameW(void* hWnd, uint16_t* lpClassName, int nMaxCount)');
    const Point = koffi.struct('POINT', {
      x: 'int',
      y: 'int',
    });
    const GetCursorPos = user32.func('bool __stdcall GetCursorPos(POINT* lpPoint)');
    const SetWindowPos = user32.func('bool __stdcall SetWindowPos(void* hWnd, void* hWndInsertAfter, int X, int Y, int cx, int cy, uint32_t uFlags)');
    const FindWindowW = user32.func('void* __stdcall FindWindowW(const char16_t* lpClassName, const char16_t* lpWindowName)');
    const FindWindowExW = user32.func('void* __stdcall FindWindowExW(void* hWndParent, void* hWndChildAfter, const char16_t* lpszClass, const char16_t* lpszWindow)');
    const IsWindow = user32.func('bool __stdcall IsWindow(void* hWnd)');
    const SendMessageTimeoutW = user32.func('intptr_t __stdcall SendMessageTimeoutW(void* hWnd, uint Msg, uintptr_t wParam, intptr_t lParam, uint fuFlags, uint uTimeout, uintptr_t* lpdwResult)');
    const hitTestDllPath = [
      join(process.resourcesPath, 'native', 'win32-hit-test', 'win32-hit-test.dll'),
      join(__dirname, '..', 'native', 'win32-hit-test', 'bin', 'win32-hit-test.dll'),
    ].find(existsSync);
    if (!hitTestDllPath) throw new Error('win32 hit-test DLL was not found');
    const hitTestDll = koffi.load(hitTestDllPath);
    const InstallWindowHitTest = hitTestDll.func('bool __stdcall InstallWindowHitTest(void* hWnd)');
    const SetWindowDragRegion = hitTestDll.func('bool __stdcall SetWindowDragRegion(void* hWnd, int left, int top, int right, int bottom, int enabled)');
    const AccentPolicy = koffi.struct('ACCENT_POLICY', {
      AccentState: 'uint32_t',
      AccentFlags: 'uint32_t',
      GradientColor: 'uint32_t',
      AnimationId: 'uint32_t',
    });
    const WindowCompositionAttributeData = koffi.struct('WINDOWCOMPOSITIONATTRIBDATA', {
      Attribute: 'int',
      Data: 'void*',
      SizeOfData: 'size_t',
    });
    const DwmBlurBehind = koffi.struct('DWM_BLURBEHIND', {
      DwFlags: 'uint32_t',
      FEnable: 'int',
      HRgnBlur: 'void*',
      FTransitionOnMaximized: 'int',
    });
    const SetWindowCompositionAttribute = user32.func('bool __stdcall SetWindowCompositionAttribute(void* hWnd, WINDOWCOMPOSITIONATTRIBDATA* data)');
    const DwmEnableBlurBehindWindow = dwmapi.func('int __stdcall DwmEnableBlurBehindWindow(void* hWnd, DWM_BLURBEHIND* pBlurBehind)');

    function findDesktopComponentHost(): unknown | null {
      let iconWorker: unknown | null = null;
      while (true) {
        iconWorker = FindWindowExW(null, iconWorker, 'WorkerW', null);
        if (!iconWorker) return null;
        if (FindWindowExW(iconWorker, null, 'SHELLDLL_DefView', null)) break;
      }

      let host = FindWindowExW(null, iconWorker, 'WorkerW', null);
      while (host) {
        if (!FindWindowExW(host, null, 'SHELLDLL_DefView', null)) return host;
        host = FindWindowExW(null, host, 'WorkerW', null);
      }
      return null;
    }

    function isHostedByDesktopComponentHost(hwnd: unknown): boolean {
      const host = findDesktopComponentHost();
      if (!host || !IsWindow(host)) return false;
      const owner = GetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT);
      return String(owner) === String(host);
    }

    const win32: Win32Api = {
      ptr: (handle: Buffer) => decodeNativeWindowHandle(handle),
      getExStyle: (hwnd) => runWin32Operation(diag, 'getExStyle', () => Number(GetWindowLongPtrW(hwnd, GWL_EXSTYLE)), 0),
      setExStyle: (hwnd, style) => {
        runWin32Operation(diag, 'setExStyle', () => SetWindowLongPtrW(hwnd, GWL_EXSTYLE, style), undefined);
      },
      getForegroundClass: () => {
        return runWin32Operation(diag, 'getForegroundClass', () => {
          const hwnd = GetForegroundWindow();
          if (!hwnd) return '';
          const buf = Buffer.alloc(512);
          const len = GetClassNameW(hwnd, buf, 256);
          if (!len) return '';
          return buf.toString('utf16le', 0, len * 2);
        }, '');
      },
      isForegroundWindow: (handle: Buffer) => {
        return runWin32Operation(diag, 'isForegroundWindow', () => {
          const foreground = GetForegroundWindow();
          if (!foreground) return false;
          return Number(foreground) === Number(decodeNativeWindowHandle(handle))
            || String(foreground) === String(decodeNativeWindowHandle(handle));
        }, false);
      },
      setTopmost: (handle: Buffer) => {
        runWin32Operation(diag, 'setTopmost', () => {
          SetWindowPos(decodeNativeWindowHandle(handle), createHwndBuffer(HWND_TOPMOST), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        }, undefined);
      },
      clearTopmost: (handle: Buffer) => {
        runWin32Operation(diag, 'clearTopmost', () => {
          SetWindowPos(decodeNativeWindowHandle(handle), createHwndBuffer(HWND_NOTOPMOST), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        }, undefined);
      },
      sendToBottom: (handle: Buffer) => {
        runWin32Operation(diag, 'sendToBottom', () => {
          SetWindowPos(decodeNativeWindowHandle(handle), createHwndBuffer(HWND_BOTTOM), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
        }, undefined);
      },
      attachToDesktop: (handle: Buffer) => {
        return runWin32Operation(diag, 'attachToDesktop', () => {
          const progman = FindWindowW('Progman', null);
          if (!progman) return false;
          const result = [BigInt(0)];
          SendMessageTimeoutW(progman, PROGMAN_SPAWN_WORKERW, 0n, 0n, SMTO_NORMAL, 1000, result);

          const host = findDesktopComponentHost();
          if (!host) return false;
          const hwnd = decodeNativeWindowHandle(handle);
          SetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT, host);
          return isHostedByDesktopComponentHost(hwnd);
        }, false);
      },
      detachFromDesktop: (handle: Buffer) => {
        runWin32Operation(diag, 'detachFromDesktop', () => {
          const hwnd = decodeNativeWindowHandle(handle);
          SetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT, null);
        }, undefined);
      },
      isAttachedToDesktop: (handle: Buffer) => {
        return runWin32Operation(diag, 'isAttachedToDesktop', () => {
          return isHostedByDesktopComponentHost(decodeNativeWindowHandle(handle));
        }, false);
      },
      setDesktopOwner: (handle: Buffer) => {
        return runWin32Operation(diag, 'setDesktopOwner', () => {
          const progman = FindWindowW('Progman', null);
          if (!progman) return false;
          SetWindowLongPtrW_Ptr(decodeNativeWindowHandle(handle), GWLP_HWNDPARENT, progman);
          return true;
        }, false);
      },
      clearDesktopOwner: (handle: Buffer) => {
        runWin32Operation(diag, 'clearDesktopOwner', () => {
          SetWindowLongPtrW_Ptr(decodeNativeWindowHandle(handle), GWLP_HWNDPARENT, null);
        }, undefined);
      },
      getCursorPosition: () => {
        return runWin32Operation(diag, 'getCursorPosition', () => {
          const point = { x: 0, y: 0 };
          return GetCursorPos(point) ? point : null;
        }, null);
      },
      setWindowDragRegion: (handle: Buffer, region) => {
        return runWin32Operation(diag, 'setWindowDragRegion', () => {
          const hwnd = decodeNativeWindowHandle(handle);
          if (!InstallWindowHitTest(hwnd)) return false;
          return Boolean(SetWindowDragRegion(
            hwnd,
            Math.round(region.left),
            Math.round(region.top),
            Math.round(region.right),
            Math.round(region.bottom),
            region.enabled ? 1 : 0,
          ));
        }, false);
      },
      setAcrylic: (handle: Buffer, settings: InvisibleGlassSettings) => {
        return runWin32Operation(diag, 'setAcrylic', () => {
          const accent = createWin32AccentPolicyFromGlass(settings);
          const data = {
            Attribute: WCA_ACCENT_POLICY,
            Data: koffi.as(accent, 'ACCENT_POLICY *'),
            SizeOfData: koffi.sizeof(AccentPolicy),
          };
          const applied = Boolean(SetWindowCompositionAttribute(decodeNativeWindowHandle(handle), data));
          if (!applied) {
            diag(`Win32 SetWindowCompositionAttribute failed with error ${koffi.errno()} `
              + `(ACCENT_POLICY=${koffi.sizeof(AccentPolicy)}, WINDOWCOMPOSITIONATTRIBDATA=${koffi.sizeof(WindowCompositionAttributeData)})`);
          }
          return applied;
        }, false);
      },
      setDwmBlur: (handle: Buffer, enabled: boolean) => {
        return runWin32Operation(diag, 'setDwmBlur', () => {
          const blurBehind = {
            DwFlags: 1,
            FEnable: enabled ? 1 : 0,
            HRgnBlur: null,
            FTransitionOnMaximized: 0,
          };
          const result = DwmEnableBlurBehindWindow(decodeNativeWindowHandle(handle), blurBehind);
          if (result < 0) diag(`Win32 DwmEnableBlurBehindWindow returned HRESULT 0x${(result >>> 0).toString(16)}`);
          return result >= 0;
        }, false);
      },
    };

    diag('koffi user32 bound ok');
    return win32;
  } catch (error) {
    diag(`koffi bind failed: ${String(error)}`);
    return null;
  }
}

export function getWin32CursorPosition(
  win32: Pick<Win32Api, 'getCursorPosition'> | null,
): Win32CursorPosition | null {
  return win32?.getCursorPosition() ?? null;
}

export function isDesktopForeground(win32: Pick<Win32Api, 'getForegroundClass'> | null): boolean {
  if (!win32) return false;
  const cls = win32.getForegroundClass();
  return cls === 'WorkerW' || cls === 'Progman';
}

function applyToolWindowStyle(_win: BrowserWindow): boolean {
  void GWL_EXSTYLE;
  void WS_EX_TOOLWINDOW;
  return false;
}

function hasNativeBackgroundMaterial(win: unknown): win is NativeBackgroundMaterialWindow {
  if ((typeof win !== 'object' || win === null) && typeof win !== 'function') return false;
  return typeof Reflect.get(win, 'setBackgroundMaterial') === 'function';
}

export function applyInvisibleGlassBackgroundMaterial(
  diag: (message: string) => void,
  win: unknown,
  payload: unknown,
  applyWin32AcrylicFallback: (settings: InvisibleGlassSettings) => boolean = () => false,
  preferWin32Fallback = false,
): boolean {
  const settings = normalizeInvisibleGlassPayload(payload);

  if (preferWin32Fallback) {
    const applied = applyWin32AcrylicFallback(settings);
    diag(settings.enabled
      ? `using Win32 Acrylic fallback for invisible glass (opacity=${settings.opacity}, blur=${settings.blurStrength})`
      : 'using Win32 Acrylic fallback to restore normal window material');
    return applied;
  }

  if (!hasNativeBackgroundMaterial(win)) {
    const applied = applyWin32AcrylicFallback(settings);
    diag(`native background material unavailable${applied ? '; using Win32 Acrylic fallback' : ''}`);
    return applied;
  }

  try {
    const wantsBlur = settings.enabled && settings.blurStrength > 0;
    if (wantsBlur) {
      win.setBackgroundMaterial('acrylic');
      diag(`native Acrylic enabled for invisible glass (opacity=${settings.opacity}, blur=${settings.blurStrength})`);
    } else {
      win.setBackgroundMaterial('none');
      diag(settings.enabled
        ? 'native background material disabled: blur strength is zero (true clear / no blur)'
        : 'native background material disabled: restored normal window material');
    }
    return true;
  } catch (error) {
    const applied = applyWin32AcrylicFallback(settings);
    const wantsBlur = settings.enabled && settings.blurStrength > 0;
    diag(`native ${wantsBlur ? 'Acrylic enable' : 'background material disable'} failed: ${String(error)}${applied ? '; using Win32 Acrylic fallback' : ''}`);
    return applied;
  }
}

export function applyWin32GlassFallback(
  diag: (message: string) => void,
  win32: Pick<Win32Api, 'setAcrylic' | 'setDwmBlur'> | null,
  win: Pick<BrowserWindow, 'isDestroyed' | 'getNativeWindowHandle'>,
  payload: unknown,
): boolean {
  if (!win32 || win.isDestroyed()) return false;
  const settings = normalizeInvisibleGlassPayload(payload);
  const handle = win.getNativeWindowHandle();
  const acrylicApplied = win32.setAcrylic(handle, settings);
  const wantsBlur = settings.enabled && settings.blurStrength > 0;
  const dwmBlurApplied = acrylicApplied ? false : win32.setDwmBlur(handle, wantsBlur);
  const applied = acrylicApplied || dwmBlurApplied;
  diag(
    `Win32 glass fallback ${applied ? (settings.enabled ? 'enabled' : 'disabled') : 'not applied'} `
    + `(Acrylic: ${acrylicApplied ? 'enabled' : 'unavailable'}, DWM blur: ${dwmBlurApplied ? 'enabled' : 'unavailable'}, opacity=${settings.opacity}, blur=${settings.blurStrength})`,
  );
  return applied;
}

function applyNativeBackgroundMaterial(
  diag: (message: string) => void,
  win32: Pick<Win32Api, 'setAcrylic' | 'setDwmBlur'> | null,
  win: BrowserWindow,
): void {
  if (process.platform !== 'win32') return;
  applyInvisibleGlassBackgroundMaterial(
    diag,
    win,
    false,
    (settings) => applyWin32GlassFallback(diag, win32, win, settings),
    shouldPreferWin32AcrylicFallback(),
  );
}

export function shouldPreferWin32AcrylicFallback(
  platform = process.platform,
  operatingSystemRelease = release(),
): boolean {
  if (platform !== 'win32') return false;
  const buildMatch = /^(\d+)\.(\d+)\.(\d+)/.exec(operatingSystemRelease);
  if (!buildMatch) return true;
  const build = Number(buildMatch[3]);
  // Electron setBackgroundMaterial('acrylic') is a real desktop blur material on Windows 11+.
  // On Windows 10 it can report success while leaving the desktop unblurred, so use the Win32 path.
  return !Number.isFinite(build) || build < WINDOWS_11_BUILD;
}

export function shouldDisableWin32GlassForDesktopHost(
  prefersWin32AcrylicFallback: boolean,
  isDesktopHosted: boolean,
): boolean {
  return prefersWin32AcrylicFallback && isDesktopHosted;
}

export function applyNativeWindowDragRegion(
  win32: Pick<Win32Api, 'setWindowDragRegion'> | null,
  win: Pick<BrowserWindow, 'isDestroyed' | 'getNativeWindowHandle'>,
  region: NativeWindowDragRegion,
  diag: (message: string) => void = () => undefined,
): boolean {
  if (!win32 || win.isDestroyed()) {
    diag('native drag region skipped because the Win32 bridge or window was unavailable');
    return false;
  }
  const applied = win32.setWindowDragRegion(win.getNativeWindowHandle(), region);
  diag(`native drag region ${applied ? 'applied' : 'rejected'} (${Math.round(region.left)},${Math.round(region.top)} -> ${Math.round(region.right)},${Math.round(region.bottom)}, enabled=${region.enabled})`);
  return applied;
}

export function createWin32NativeHelpers({
  diag,
}: CreateWin32NativeHelpersOptions): Win32NativeHelpers {
  const win32 = createWin32Api(diag);

  return {
    win32,
    getCursorPosition: () => getWin32CursorPosition(win32),
    isDesktopForeground: () => isDesktopForeground(win32),
    applyToolWindowStyle,
    applyNativeBackgroundMaterial: (win) => applyNativeBackgroundMaterial(diag, win32, win),
    setInvisibleGlassBackgroundMaterial: (win, payload) => {
      if (process.platform !== 'win32') return false;
      const isDesktopHosted = win32?.isAttachedToDesktop(win.getNativeWindowHandle()) ?? false;
      if (shouldDisableWin32GlassForDesktopHost(shouldPreferWin32AcrylicFallback(), isDesktopHosted)) {
        // A transparent Chromium window hosted by Explorer is composed as opaque black when
        // Windows 10 receives ACCENT_ENABLE_BLURBEHIND. Keep the transparent host clear and
        // let the renderer's existing frost layers provide the visual treatment instead.
        if (hasNativeBackgroundMaterial(win)) {
          win.setBackgroundMaterial('none');
          diag('Windows 10 transparent window: native Acrylic disabled to preserve desktop composition');
          return true;
        }
        return false;
      }

      return applyInvisibleGlassBackgroundMaterial(
        diag,
        win,
        payload,
        (settings) => applyWin32GlassFallback(diag, win32, win, settings),
        shouldPreferWin32AcrylicFallback(),
      );
    },
    setNativeWindowDragRegion: (win, region) => applyNativeWindowDragRegion(win32, win, region, diag),
  };
}
