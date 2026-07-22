import { describe, expect, it, vi } from 'vitest';
import { createPerformanceFrostController } from '../electron/performanceFrostController';

describe('performance frost controller', () => {
  it('reapplies the last configured glass after the desktop host changes', () => {
    const applyGlass = vi.fn(() => true);
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied: vi.fn(),
    });

    expect(controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 })).toBe(true);
    applyGlass.mockClear();

    expect(controller.reapplyConfiguredGlass()).toBe(true);

    expect(applyGlass).toHaveBeenCalledWith({ enabled: true, opacity: 58, blurStrength: 14 });
  });

  it('returns the native material outcome from the configured glass update', () => {
    const applyGlass = vi.fn(() => false);
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied: vi.fn(),
    });

    expect(controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 })).toBe(false);
  });

  it('reports when reapplying glass loses native material', () => {
    const applyGlass = vi.fn()
      .mockReturnValueOnce(true)
      .mockReturnValueOnce(false);
    const notifyRenderer = vi.fn();
    const notifyNativeGlassApplied = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied,
    });

    expect(controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 })).toBe(true);
    expect(controller.reapplyConfiguredGlass()).toBe(false);

    expect(notifyNativeGlassApplied).toHaveBeenCalledTimes(2);
    expect(notifyNativeGlassApplied).toHaveBeenNthCalledWith(1, true);
    expect(notifyNativeGlassApplied).toHaveBeenNthCalledWith(2, false);
    expect(notifyRenderer).not.toHaveBeenCalled();
  });

  it('keeps native acrylic live while the window moves', () => {
    vi.useFakeTimers();
    const applyGlass = vi.fn();
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied: vi.fn(),
    });

    controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
    applyGlass.mockClear();
    notifyRenderer.mockClear();

    controller.noteMove();

    expect(applyGlass).not.toHaveBeenCalled();
    expect(notifyRenderer).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);

    expect(applyGlass).not.toHaveBeenCalled();
    expect(notifyRenderer).not.toHaveBeenCalled();
  });

  it('does not replace live acrylic before the first move event', () => {
    const applyGlass = vi.fn();
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied: vi.fn(),
    });

    controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
    applyGlass.mockClear();
    notifyRenderer.mockClear();

    controller.beginMove();

    expect(applyGlass).not.toHaveBeenCalled();
    expect(notifyRenderer).not.toHaveBeenCalled();
  });

  it('does not schedule material changes while the window continues moving', () => {
    vi.useFakeTimers();
    const applyGlass = vi.fn();
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied: vi.fn(),
    });

    controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
    applyGlass.mockClear();
    notifyRenderer.mockClear();
    controller.noteMove();
    vi.advanceTimersByTime(100);
    controller.noteMove();

    expect(applyGlass).not.toHaveBeenCalled();
    expect(notifyRenderer).not.toHaveBeenCalled();

    vi.advanceTimersByTime(150);
    expect(applyGlass).not.toHaveBeenCalled();
  });

  it('applies configuration changes directly after a move', () => {
    vi.useFakeTimers();
    const applyGlass = vi.fn();
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({
      applyGlass,
      notifyRenderer,
      notifyNativeGlassApplied: vi.fn(),
    });

    controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
    controller.noteMove();
    controller.setConfiguredGlass({ enabled: false, opacity: 58, blurStrength: 0 });
    vi.advanceTimersByTime(150);

    expect(applyGlass).toHaveBeenLastCalledWith({ enabled: false, opacity: 58, blurStrength: 0 });
    expect(notifyRenderer).toHaveBeenCalledTimes(0);
  });
});
