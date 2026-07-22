import { describe, expect, it, vi } from 'vitest';
import { createAcrylicGradientColor } from '../shared/invisibleGlass';
import {
  applyNativeWindowDragRegion,
  applyInvisibleGlassBackgroundMaterial,
  applyWin32GlassFallback,
  createWin32AccentPolicy,
  decodeNativeWindowHandle,
  getWin32CursorPosition,
  runWin32Operation,
  shouldDisableWin32GlassForDesktopHost,
  shouldPreferWin32AcrylicFallback,
} from '../electron/win32Native';

describe('Win32 native operations', () => {
  it('decodes Electron native-window-handle buffers to their HWND value', () => {
    const handle = Buffer.alloc(8);
    handle.writeBigUInt64LE(0x1234n);

    expect(decodeNativeWindowHandle(handle)).toBe(0x1234n);
  });

  it('creates the live BlurBehind policy from the current glass blur strength', () => {
    expect(createWin32AccentPolicy(true, { opacity: 32, blurStrength: 24 })).toEqual({
      AccentState: 3,
      AccentFlags: 0,
      GradientColor: 0,
      AnimationId: 0,
    });
    expect(createWin32AccentPolicy(true, { opacity: 32, blurStrength: 10 }).AccentState).toBe(3);
    expect(createWin32AccentPolicy(true, { opacity: 32, blurStrength: 0 }).AccentState).toBe(0);
    expect(createWin32AccentPolicy(false)).toEqual({
      AccentState: 0,
      AccentFlags: 0,
      GradientColor: 0,
      AnimationId: 0,
    });
  });

  it('returns the fallback and emits the operation name when a native call fails', () => {
    const diag = vi.fn();
    const result = runWin32Operation(diag, 'sendToBottom', () => {
      throw new Error('user32 unavailable');
    }, false);

    expect(result).toBe(false);
    expect(diag).toHaveBeenCalledWith('Win32 sendToBottom failed: Error: user32 unavailable');
  });

  it('returns a successful native operation value without diagnostics', () => {
    const diag = vi.fn();
    expect(runWin32Operation(diag, 'setTopmost', () => true, false)).toBe(true);
    expect(diag).not.toHaveBeenCalled();
  });

  it('uses Acrylic when invisible glass is enabled and reports no native glass after restoring the normal window material', () => {
    const diag = vi.fn();
    const setBackgroundMaterial = vi.fn();
    const win = { setBackgroundMaterial };

    expect(applyInvisibleGlassBackgroundMaterial(diag, win, true)).toBe(true);
    expect(setBackgroundMaterial).toHaveBeenLastCalledWith('acrylic');

    expect(applyInvisibleGlassBackgroundMaterial(diag, win, false)).toBe(false);
    expect(setBackgroundMaterial).toHaveBeenLastCalledWith('none');
    expect(diag).toHaveBeenCalledWith(expect.stringContaining('native Acrylic enabled for invisible glass'));
    expect(diag).toHaveBeenCalledWith('native background material disabled: restored normal window material');
  });

  it('uses the Win32 Acrylic fallback when Electron material is unavailable or rejected', () => {
    const unavailableDiag = vi.fn();
    const unavailableFallback = vi.fn(() => true);
    expect(applyInvisibleGlassBackgroundMaterial(unavailableDiag, {}, true, unavailableFallback)).toBe(true);
    expect(unavailableFallback).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(unavailableDiag).toHaveBeenCalledWith('native background material unavailable; using Win32 Acrylic fallback');

    const rejectedDiag = vi.fn();
    const rejectedFallback = vi.fn(() => true);
    expect(applyInvisibleGlassBackgroundMaterial(rejectedDiag, {
      setBackgroundMaterial: () => {
        throw new Error('Acrylic unavailable');
      },
    }, true, rejectedFallback)).toBe(true);
    expect(rejectedFallback).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(rejectedDiag).toHaveBeenCalledWith('native Acrylic enable failed: Error: Acrylic unavailable; using Win32 Acrylic fallback');
  });

  it('uses the Win32 Acrylic fallback when Windows 10 prefers it', () => {
    const diag = vi.fn();
    const setBackgroundMaterial = vi.fn();
    const fallback = vi.fn(() => true);

    expect(applyInvisibleGlassBackgroundMaterial(diag, { setBackgroundMaterial }, true, fallback, true)).toBe(true);
    expect(fallback).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
    expect(setBackgroundMaterial).not.toHaveBeenCalled();
    expect(diag).toHaveBeenCalledWith(expect.stringContaining('using Win32 Acrylic fallback for invisible glass'));
  });

  it('prefers Win32 Acrylic on Windows 10 because Electron acrylic does not blur the desktop there', () => {
    expect(shouldPreferWin32AcrylicFallback('win32', '10.0.19045')).toBe(true);
  });

  it('keeps Electron Acrylic on Windows 11 builds', () => {
    expect(shouldPreferWin32AcrylicFallback('win32', '10.0.22631')).toBe(false);
  });

  it('only disables Win32 glass for Windows 10 windows hosted by Explorer', () => {
    expect(shouldDisableWin32GlassForDesktopHost(true, false)).toBe(false);
    expect(shouldDisableWin32GlassForDesktopHost(true, true)).toBe(true);
    expect(shouldDisableWin32GlassForDesktopHost(false, true)).toBe(false);
  });

  it('reports no native glass when an invisible-theme blur strength is cleared', () => {
    const diag = vi.fn();
    const setBackgroundMaterial = vi.fn();
    expect(applyInvisibleGlassBackgroundMaterial(diag, { setBackgroundMaterial }, {
      enabled: true,
      opacity: 58,
      blurStrength: 0,
    })).toBe(false);
    expect(setBackgroundMaterial).toHaveBeenCalledWith('none');
  });

  it('keeps the documented DWM blur path available when the Acrylic composition call is rejected', () => {
    const diag = vi.fn();
    const setAcrylic = vi.fn(() => false);
    const setDwmBlur = vi.fn(() => true);
    const window = {
      isDestroyed: () => false,
      getNativeWindowHandle: () => Buffer.alloc(8),
    };

    expect(applyWin32GlassFallback(diag, { setAcrylic, setDwmBlur }, window, true)).toBe(true);
    expect(setAcrylic).toHaveBeenCalledOnce();
    expect(setAcrylic).toHaveBeenCalledWith(expect.any(Buffer), expect.objectContaining({ enabled: true }));
    expect(setDwmBlur).toHaveBeenCalledOnce();
    expect(diag).toHaveBeenCalledWith(expect.stringContaining('Win32 glass fallback enabled'));
  });

  it('updates the native caption region only for a live window', () => {
    const setWindowDragRegion = vi.fn(() => true);
    const window = {
      isDestroyed: () => false,
      getNativeWindowHandle: () => Buffer.alloc(8),
    };
    const region = { left: 24, top: 0, right: 320, bottom: 32, enabled: true };

    expect(applyNativeWindowDragRegion({ setWindowDragRegion }, window, region)).toBe(true);
    expect(setWindowDragRegion).toHaveBeenCalledOnce();
    expect(setWindowDragRegion).toHaveBeenCalledWith(expect.any(Buffer), region);

    const destroyedWindow = {
      isDestroyed: () => true,
      getNativeWindowHandle: vi.fn(() => Buffer.alloc(8)),
    };
    expect(applyNativeWindowDragRegion({ setWindowDragRegion }, destroyedWindow, region)).toBe(false);
    expect(destroyedWindow.getNativeWindowHandle).not.toHaveBeenCalled();
  });

  it('returns the global cursor position when the Win32 bridge is available', () => {
    expect(getWin32CursorPosition({ getCursorPosition: () => ({ x: -64, y: 240 }) })).toEqual({ x: -64, y: 240 });
    expect(getWin32CursorPosition(null)).toBeNull();
  });

});
