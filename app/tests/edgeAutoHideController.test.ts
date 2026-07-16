import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createEdgeAutoHideController } from '../electron/edgeAutoHideController';
import type { Point, Rect } from '../electron/edgeAutoHideGeometry';

describe('edge auto-hide controller', () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
  let bounds: Rect;
  let cursor: Point | null;
  let setBounds: ReturnType<typeof vi.fn>;
  let showActivationStrip: ReturnType<typeof vi.fn>;
  let hideActivationStrip: ReturnType<typeof vi.fn>;
  let controller: ReturnType<typeof createEdgeAutoHideController>;

  function settle() {
    controller.noteMoveSettled();
    vi.advanceTimersByTime(140);
  }

  function attachLeftByPushIn() {
    // Drag past the left edge; settle snaps flush, then retracts after the pause.
    controller.noteMoveStarted();
    bounds = { x: -24, y: 120, width: 240, height: 480 };
    cursor = { x: 2, y: 350 };
    settle();
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });

    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(200);
    expect(bounds).toEqual({ x: -240, y: 120, width: 240, height: 480 });

    // Leave the strip so a later hover can re-arm restore.
    cursor = { x: 500, y: 700 };
    vi.advanceTimersByTime(64);
  }

  beforeEach(() => {
    vi.useFakeTimers();
    bounds = { x: 200, y: 120, width: 240, height: 480 };
    cursor = { x: 500, y: 700 };
    setBounds = vi.fn((next: Rect) => {
      bounds = { ...next };
    });
    showActivationStrip = vi.fn();
    hideActivationStrip = vi.fn();
    controller = createEdgeAutoHideController({
      win: {
        getBounds: () => bounds,
        setBounds,
        isDestroyed: () => false,
        isMinimized: () => false,
        isVisible: () => true,
      },
      getWorkAreaForBounds: () => workArea,
      getCursorPosition: () => cursor,
      isEnabled: () => true,
      diag: () => undefined,
      activationStrip: {
        show: showActivationStrip,
        hide: hideActivationStrip,
      },
    });
  });

  afterEach(() => {
    controller.dispose();
    vi.useRealTimers();
  });

  it('snaps a top placement only when truly at the top', () => {
    controller.noteMoveStarted();
    bounds = { x: 600, y: 10, width: 240, height: 480 };
    cursor = { x: 700, y: 1 };
    settle();
    expect(bounds).toEqual({ x: 600, y: 0, width: 240, height: 480 });
  });

  it('does not hide a flush side placement', () => {
    bounds = { x: 0, y: 400, width: 240, height: 480 };
    settle();
    expect(bounds.x).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(showActivationStrip).not.toHaveBeenCalled();
    expect(bounds.x).toBe(0);
  });

  it('does not hide a nearby side placement', () => {
    bounds = { x: 40, y: 400, width: 240, height: 480 };
    settle();
    expect(bounds.x).toBe(40);
    vi.advanceTimersByTime(1000);
    expect(setBounds).not.toHaveBeenCalled();
  });

  it('retracts a side window when the drag cursor reaches the desktop edge without pushing the window past it', () => {
    controller.noteMoveStarted();
    bounds = { x: 80, y: 120, width: 240, height: 480 };
    cursor = { x: 2, y: 350 };
    settle();
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(200);
    expect(showActivationStrip).toHaveBeenCalledWith('left', { x: 0, y: 120, width: 240, height: 480 }, workArea);
    expect(bounds).toEqual({ x: -240, y: 120, width: 240, height: 480 });
  });

  it('does not alter a side window when the drag cursor does not reach the desktop edge', () => {
    controller.noteMoveStarted();
    bounds = { x: -24, y: 120, width: 240, height: 480 };
    cursor = { x: 120, y: 350 };
    settle();

    vi.advanceTimersByTime(1000);
    expect(showActivationStrip).not.toHaveBeenCalled();
    expect(bounds).toEqual({ x: -24, y: 120, width: 240, height: 480 });
  });

  it('re-hides a restored side window after a new deliberate push-in', () => {
    attachLeftByPushIn();
    expect(bounds.x).toBe(-240);

    // Open from the glass handle.
    cursor = { x: 4, y: 350 };
    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
    expect(hideActivationStrip).toHaveBeenCalled();

    // Leaving the window body alone keeps the attached window expanded.
    showActivationStrip.mockClear();
    cursor = { x: 500, y: 700 };
    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(1000);
    expect(showActivationStrip).not.toHaveBeenCalled();
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });

    // Push it past the edge again to request another retraction.
    controller.noteMoveStarted();
    bounds = { x: -24, y: 120, width: 240, height: 480 };
    cursor = { x: 2, y: 350 };
    settle();
    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(200);
    expect(showActivationStrip).toHaveBeenCalledWith('left', { x: 0, y: 120, width: 240, height: 480 }, workArea);
    expect(bounds).toEqual({ x: -240, y: 120, width: 240, height: 480 });
  });

  it('does not re-snap while the user is still dragging away from the edge', () => {
    attachLeftByPushIn();
    // Restore first via activation.
    cursor = { x: 4, y: 350 };
    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(bounds.x).toBe(0);

    controller.noteMoveStarted();
    bounds = { x: 10, y: 120, width: 240, height: 480 };
    controller.noteMoveSettled();
    expect(bounds.x).toBe(10);

    bounds = { x: 300, y: 120, width: 240, height: 480 };
    controller.noteMoveSettled();
    expect(bounds.x).toBe(300);

    vi.advanceTimersByTime(140);
    expect(bounds.x).toBe(300);
  });

  it('snaps only after the drag settles near the top edge', () => {
    controller.noteMoveStarted();
    bounds = { x: 600, y: 12, width: 240, height: 480 };
    cursor = { x: 700, y: 1 };
    controller.noteMoveSettled();
    expect(bounds.y).toBe(12);

    vi.advanceTimersByTime(139);
    expect(bounds.y).toBe(12);

    vi.advanceTimersByTime(1);
    expect(bounds).toEqual({ x: 600, y: 0, width: 240, height: 480 });
  });

  it('retracts a settled top-attached window after the pause', () => {
    controller.noteMoveStarted();
    bounds = { x: 600, y: 0, width: 240, height: 480 };
    cursor = { x: 900, y: 1 };
    settle();

    // Top attachment retracts after the same short pause.
    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(160);
    expect(showActivationStrip).toHaveBeenCalledWith('top', { x: 600, y: 0, width: 240, height: 480 }, workArea);
    expect(bounds.y).toBe(-480);
  });

  it('restores more slowly than it retracts', () => {
    attachLeftByPushIn();
    expect(bounds.x).toBe(-240);

    cursor = { x: 4, y: 350 };
    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(80);
    expect(bounds.x).toBeGreaterThan(-240);
    expect(bounds.x).toBeLessThan(0);

    vi.advanceTimersByTime(260);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('cancels a pending top retraction when the user drags away', () => {
    bounds = { x: 600, y: 0, width: 240, height: 480 };
    settle();
    vi.advanceTimersByTime(200);
    controller.noteMoveStarted();
    bounds = { x: 600, y: 180, width: 240, height: 480 };
    controller.noteMoveSettled();
    vi.advanceTimersByTime(400);
    expect(bounds.y).toBe(180);
    expect(showActivationStrip).not.toHaveBeenCalled();
  });

  it('begins restoring when the pointer enters the activation strip', () => {
    attachLeftByPushIn();
    cursor = { x: 4, y: 350 };

    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('shows a persistent activation strip when retracted and hides it after restore', () => {
    attachLeftByPushIn();

    expect(showActivationStrip).toHaveBeenCalledWith('left', { x: 0, y: 120, width: 240, height: 480 }, workArea);

    cursor = { x: 4, y: 350 };
    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(hideActivationStrip).toHaveBeenCalled();
  });

  it('restores when the activation strip is clicked', () => {
    attachLeftByPushIn();

    controller.noteActivationStripActivated();
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
    expect(hideActivationStrip).toHaveBeenCalled();
  });

  it('keeps its hidden state when its own bounds update emits a move event', () => {
    attachLeftByPushIn();
    controller.noteMoveSettled();
    expect(bounds).toEqual({ x: -240, y: 120, width: 240, height: 480 });
    cursor = { x: 4, y: 350 };

    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('keeps the edge attachment when setBounds synchronously emits move', () => {
    setBounds = vi.fn((next: Rect) => {
      bounds = { ...next };
      controller.noteMoveSettled();
    });
    controller = createEdgeAutoHideController({
      win: {
        getBounds: () => bounds,
        setBounds,
        isDestroyed: () => false,
        isMinimized: () => false,
        isVisible: () => true,
      },
      getWorkAreaForBounds: () => workArea,
      getCursorPosition: () => cursor,
      isEnabled: () => true,
      diag: () => undefined,
    });

    attachLeftByPushIn();
    cursor = { x: 4, y: 350 };

    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('keeps the activation strip visible when setBounds synchronously emits resize', () => {
    setBounds = vi.fn((next: Rect) => {
      bounds = { ...next };
      controller.noteResizeOrReset();
    });
    controller = createEdgeAutoHideController({
      win: {
        getBounds: () => bounds,
        setBounds,
        isDestroyed: () => false,
        isMinimized: () => false,
        isVisible: () => true,
      },
      getWorkAreaForBounds: () => workArea,
      getCursorPosition: () => cursor,
      isEnabled: () => true,
      diag: () => undefined,
      activationStrip: {
        show: showActivationStrip,
        hide: hideActivationStrip,
      },
    });

    attachLeftByPushIn();

    expect(showActivationStrip).toHaveBeenCalledTimes(1);
    expect(hideActivationStrip).not.toHaveBeenCalled();
    cursor = { x: 4, y: 350 };
    controller.noteActivationStripActivated();
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('uses expanded activation geometry while the main window is fully retracted', () => {
    setBounds = vi.fn((next: Rect) => {
      bounds = { ...next };
    });
    controller = createEdgeAutoHideController({
      win: {
        getBounds: () => bounds,
        setBounds,
        isDestroyed: () => false,
        isMinimized: () => false,
        isVisible: () => true,
      },
      getWorkAreaForBounds: () => workArea,
      getCursorPosition: () => cursor,
      isEnabled: () => true,
      diag: () => undefined,
      activationStrip: {
        show: showActivationStrip,
        hide: hideActivationStrip,
      },
    });

    attachLeftByPushIn();
    bounds = { x: -240, y: 120, width: 240, height: 480 };
    cursor = { x: 4, y: 350 };

    vi.advanceTimersByTime(64);
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('does not activate for bottom or non-edge positions', () => {
    bounds = { x: 600, y: 552, width: 240, height: 488 };
    settle();
    vi.advanceTimersByTime(1000);

    expect(setBounds).not.toHaveBeenCalled();
  });

  it('restores a hidden window immediately when disabled', () => {
    attachLeftByPushIn();
    expect(bounds.x).toBe(-240);

    controller.reconcileSettings(false);
    vi.advanceTimersByTime(320);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('does nothing while the cursor position is unavailable for edge hide', () => {
    cursor = null;
    bounds = { x: 600, y: 0, width: 240, height: 480 };
    settle();
    // Top attaches without moving when already flush.
    setBounds.mockClear();
    vi.advanceTimersByTime(1000);
    expect(setBounds).not.toHaveBeenCalled();
  });

  it('cleans up timers when disposed', () => {
    controller.noteMoveSettled();
    controller.dispose();
    vi.advanceTimersByTime(1000);

    expect(setBounds).not.toHaveBeenCalled();
  });

  it('forces an immediate expand and clears attachment before hide/minimize', () => {
    attachLeftByPushIn();
    expect(bounds.x).toBe(-240);

    controller.noteForcedExpandAndClear();
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
    expect(hideActivationStrip).toHaveBeenCalled();

    cursor = { x: 500, y: 700 };
    vi.advanceTimersByTime(1000);
    expect(bounds).toEqual({ x: 0, y: 120, width: 240, height: 480 });
  });

  it('uses the matched negative-coordinate work area for side push-in', () => {
    const secondaryWorkArea = { x: -1920, y: 0, width: 1920, height: 1040 };
    bounds = { x: -1944, y: 120, width: 240, height: 480 };
    cursor = { x: -1918, y: 700 };
    controller = createEdgeAutoHideController({
      win: {
        getBounds: () => bounds,
        setBounds,
        isDestroyed: () => false,
        isMinimized: () => false,
        isVisible: () => true,
      },
      getWorkAreaForBounds: () => secondaryWorkArea,
      getCursorPosition: () => cursor,
      isEnabled: () => true,
      diag: () => undefined,
    });

    controller.noteMoveStarted();
    settle();
    expect(bounds).toEqual({ x: -1920, y: 120, width: 240, height: 480 });

    vi.advanceTimersByTime(450);
    vi.advanceTimersByTime(200);
    expect(bounds).toEqual({ x: -2160, y: 120, width: 240, height: 480 });
  });
});


