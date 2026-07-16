import { describe, expect, it, vi } from 'vitest';
import { createPerformanceFrostController } from '../electron/performanceFrostController';

describe('performance frost controller', () => {
  it('reapplies the last configured glass after the desktop host changes', () => {
    const applyGlass = vi.fn();
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({ applyGlass, notifyRenderer });

    controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
    applyGlass.mockClear();

    controller.reapplyConfiguredGlass();

    expect(applyGlass).toHaveBeenCalledWith({ enabled: true, opacity: 58, blurStrength: 14 });
  });

  it('keeps native acrylic live while the window moves', () => {
    vi.useFakeTimers();
    const applyGlass = vi.fn();
    const notifyRenderer = vi.fn();
    const controller = createPerformanceFrostController({ applyGlass, notifyRenderer });

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
    const controller = createPerformanceFrostController({ applyGlass, notifyRenderer });

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
    const controller = createPerformanceFrostController({ applyGlass, notifyRenderer });

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
    const controller = createPerformanceFrostController({ applyGlass, notifyRenderer });

    controller.setConfiguredGlass({ enabled: true, opacity: 58, blurStrength: 14 });
    controller.noteMove();
    controller.setConfiguredGlass({ enabled: false, opacity: 58, blurStrength: 0 });
    vi.advanceTimersByTime(150);

    expect(applyGlass).toHaveBeenLastCalledWith({ enabled: false, opacity: 58, blurStrength: 0 });
    expect(notifyRenderer).toHaveBeenCalledTimes(0);
  });
});
