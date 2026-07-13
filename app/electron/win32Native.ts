import { BrowserWindow } from 'electron';

export type Win32Api = {
  ptr: (handle: Buffer) => unknown;
  getExStyle: (hwnd: unknown) => number;
  setExStyle: (hwnd: unknown, style: number) => void;
  getForegroundClass: () => string;
  isForegroundWindow: (handle: Buffer) => boolean;
  setTopmost: (handle: Buffer) => void;
  clearTopmost: (handle: Buffer) => void;
  sendToBottom: (handle: Buffer) => void;
  setDesktopOwner: (handle: Buffer) => boolean;
  clearDesktopOwner: (handle: Buffer) => void;
};

export type CreateWin32NativeHelpersOptions = {
  diag(message: string): void;
};

export type Win32NativeHelpers = {
  win32: Win32Api | null;
  isDesktopForeground(): boolean;
  applyToolWindowStyle(win: BrowserWindow): boolean;
  applyNativeBackgroundMaterial(win: BrowserWindow): void;
};

type NativeBackgroundMaterialWindow = {
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

    const GetWindowLongPtrW = user32.func('intptr_t __stdcall GetWindowLongPtrW(void* hWnd, int nIndex)');
    const SetWindowLongPtrW = user32.func('intptr_t __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, intptr_t dwNewLong)');
    const SetWindowLongPtrW_Ptr = user32.func('void* __stdcall SetWindowLongPtrW(void* hWnd, int nIndex, void* dwNewLong)');
    const GetForegroundWindow = user32.func('void* __stdcall GetForegroundWindow()');
    const GetClassNameW = user32.func('int __stdcall GetClassNameW(void* hWnd, uint16_t* lpClassName, int nMaxCount)');
    const SetWindowPos = user32.func('bool __stdcall SetWindowPos(void* hWnd, void* hWndInsertAfter, int X, int Y, int cx, int cy, uint32_t uFlags)');
    const FindWindowW = user32.func('void* __stdcall FindWindowW(const char16_t* lpClassName, const char16_t* lpWindowName)');

    const win32: Win32Api = {
      ptr: (handle: Buffer) => koffi.as(handle, 'void*'),
      getExStyle: (hwnd) => Number(GetWindowLongPtrW(hwnd, GWL_EXSTYLE)),
      setExStyle: (hwnd, style) => {
        SetWindowLongPtrW(hwnd, GWL_EXSTYLE, style);
      },
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
        SetWindowPos(hwnd, createHwndBuffer(HWND_BOTTOM), 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE);
      },
      setDesktopOwner: (handle: Buffer) => {
        const hwnd = koffi.as(handle, 'void*');
        const progman = FindWindowW('Progman', null);
        if (!progman) return false;
        SetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT, progman);
        return true;
      },
      clearDesktopOwner: (handle: Buffer) => {
        const hwnd = koffi.as(handle, 'void*');
        SetWindowLongPtrW_Ptr(hwnd, GWLP_HWNDPARENT, null);
      },
    };

    diag('koffi user32 bound ok');
    return win32;
  } catch (error) {
    diag(`koffi bind failed: ${String(error)}`);
    return null;
  }
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

function hasNativeBackgroundMaterial(win: BrowserWindow): win is BrowserWindow & NativeBackgroundMaterialWindow {
  return typeof Reflect.get(win, 'setBackgroundMaterial') === 'function';
}

function applyNativeBackgroundMaterial(diag: (message: string) => void, win: BrowserWindow): void {
  if (process.platform !== 'win32') return;

  if (!hasNativeBackgroundMaterial(win)) {
    diag('native background material unavailable');
    return;
  }

  try {
    win.setBackgroundMaterial('none');
    diag('native background material disabled: css blur controls glass strength');
  } catch (error) {
    diag(`native background material disable failed: ${String(error)}`);
  }
}

export function createWin32NativeHelpers({
  diag,
}: CreateWin32NativeHelpersOptions): Win32NativeHelpers {
  const win32 = createWin32Api(diag);

  return {
    win32,
    isDesktopForeground: () => isDesktopForeground(win32),
    applyToolWindowStyle,
    applyNativeBackgroundMaterial: (win) => applyNativeBackgroundMaterial(diag, win),
  };
}
