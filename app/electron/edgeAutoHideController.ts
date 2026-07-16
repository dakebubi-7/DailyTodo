import {
  getEdgeAttachment,
  getExpandedBounds,
  getRetractedBounds,
  isPointInActivationStrip,
  isPointOnDesktopEdge,
  type EdgeAutoHideEdge,
  type Point,
  type Rect,
} from './edgeAutoHideGeometry';

const POLL_INTERVAL_MS = 64;
const RETRACT_DELAY_MS = 450;
const RETRACT_ANIMATION_MS = 150;
const RESTORE_ANIMATION_MS = 300;
const ANIMATION_FRAME_MS = 16;
// Wait until the user finishes dragging before snapping. Continuous move events
// must not pull the window back to the edge mid-drag.
const SETTLE_DEBOUNCE_MS = 140;

type EdgeAutoHideWindow = {
  getBounds(): Rect;
  setBounds(bounds: Rect): void;
  isDestroyed(): boolean;
  isMinimized(): boolean;
  isVisible(): boolean;
};

export type EdgeAutoHideActivationStrip = {
  show(edge: EdgeAutoHideEdge, expandedBounds: Rect, workArea: Rect): void;
  hide(): void;
  dispose?(): void;
};

const NO_OP_ACTIVATION_STRIP: EdgeAutoHideActivationStrip = {
  show: () => undefined,
  hide: () => undefined,
};

type CreateEdgeAutoHideControllerOptions = {
  win: EdgeAutoHideWindow;
  getWorkAreaForBounds(bounds: Rect): Rect;
  getCursorPosition(): Point | null;
  isEnabled(): boolean;
  diag(message: string): void;
  activationStrip?: EdgeAutoHideActivationStrip;
};

export type EdgeAutoHideController = {
  noteMoveStarted(): void;
  noteMoveSettled(): void;
  noteResizeOrReset(): void;
  noteForcedExpandAndClear(): void;
  noteSettingsMode(open: boolean): void;
  noteWindowModeChanged(): void;
  noteActivationStripActivated(): void;
  reconcileSettings(enabled?: boolean): void;
  dispose(): void;
};

function sameBounds(a: Rect, b: Rect): boolean {
  return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function interpolateBounds(from: Rect, to: Rect, progress: number): Rect {
  return {
    x: Math.round(from.x + (to.x - from.x) * progress),
    y: Math.round(from.y + (to.y - from.y) * progress),
    width: Math.round(from.width + (to.width - from.width) * progress),
    height: Math.round(from.height + (to.height - from.height) * progress),
  };
}

export function createEdgeAutoHideController({
  win,
  getWorkAreaForBounds,
  getCursorPosition,
  isEnabled,
  diag,
  activationStrip = NO_OP_ACTIVATION_STRIP,
}: CreateEdgeAutoHideControllerOptions): EdgeAutoHideController {
  let edge: EdgeAutoHideEdge | null = null;
  let expandedBounds: Rect | null = null;
  let workArea: Rect | null = null;
  let retracted = false;
  let settingsOpen = false;
  let disposed = false;
  let dragging = false;
  let leaveTimer: ReturnType<typeof setTimeout> | null = null;
  let settleTimer: ReturnType<typeof setTimeout> | null = null;
  let animationTimer: ReturnType<typeof setInterval> | null = null;
  let ignoreProgrammaticBoundsEvents = false;
  const pollTimer = setInterval(poll, POLL_INTERVAL_MS);

  function canOperate(): boolean {
    return !disposed && isEnabled() && !settingsOpen && !win.isDestroyed() && !win.isMinimized() && win.isVisible();
  }

  function clearLeaveTimer(): void {
    if (leaveTimer === null) return;
    clearTimeout(leaveTimer);
    leaveTimer = null;
  }

  function clearSettleTimer(): void {
    if (settleTimer === null) return;
    clearTimeout(settleTimer);
    settleTimer = null;
  }

  function stopAnimation(): void {
    if (animationTimer === null) return;
    clearInterval(animationTimer);
    animationTimer = null;
  }

  function withProgrammaticBounds(action: () => void): void {
    ignoreProgrammaticBoundsEvents = true;
    try {
      action();
    } finally {
      setTimeout(() => {
        ignoreProgrammaticBoundsEvents = false;
      }, 0);
    }
  }

  function animateBounds(from: Rect, to: Rect, durationMs: number, easing: (t: number) => number, onDone?: () => void): void {
    stopAnimation();
    if (durationMs <= 0 || sameBounds(from, to) || win.isDestroyed()) {
      withProgrammaticBounds(() => win.setBounds(to));
      onDone?.();
      return;
    }
    const startedAt = Date.now();
    animationTimer = setInterval(() => {
      if (win.isDestroyed()) {
        stopAnimation();
        return;
      }
      const elapsed = Date.now() - startedAt;
      const raw = Math.min(1, elapsed / durationMs);
      const next = interpolateBounds(from, to, easing(raw));
      withProgrammaticBounds(() => win.setBounds(next));
      if (raw >= 1) {
        stopAnimation();
        onDone?.();
      }
    }, ANIMATION_FRAME_MS);
  }

  function restoreImmediate(): void {
    clearLeaveTimer();
    stopAnimation();
    if (!retracted || win.isDestroyed()) {
      retracted = false;
      activationStrip.hide();
      return;
    }
    const target = expandedBounds ?? win.getBounds();
    retracted = false;
    activationStrip.hide();
    withProgrammaticBounds(() => win.setBounds(target));
    diag('edge auto-hide: restored');
  }

  function restore(): void {
    clearLeaveTimer();
    if (!retracted || !expandedBounds || win.isDestroyed()) return;
    const from = win.getBounds();
    const target = expandedBounds;
    retracted = false;
    // Hide the independent strip first so it cannot sit above the main window
    // and steal clicks after restore.
    activationStrip.hide();
    animateBounds(from, target, RESTORE_ANIMATION_MS, easeOutCubic, () => {
      // Keep side/top attachment after restore so the docked window can hide
      // again when the cursor touches the desktop edge. Detach only when dragged away.
      activationStrip.hide();
      diag('edge auto-hide: restored');
      // If the cursor is already on the desktop edge, schedule hide immediately.
      poll();
    });
  }

  function clearAttachment(): void {
    edge = null;
    expandedBounds = null;
    workArea = null;
  }

  function reset(): void {
    stopAnimation();
    restore();
    clearAttachment();
  }

  function forcedExpandAndClear(): void {
    dragging = false;
    clearSettleTimer();
    restoreImmediate();
    clearAttachment();
  }

  function scheduleRetraction(immediate = false): void {
    if (leaveTimer !== null || !edge || !expandedBounds || !workArea || retracted || dragging) return;
    const delay = immediate ? 0 : RETRACT_DELAY_MS;
    leaveTimer = setTimeout(() => {
      leaveTimer = null;
      if (!canOperate() || !edge || !expandedBounds || !workArea || retracted || dragging) return;
      const cursor = getCursorPosition();
      // Immediate side push-in may still have the cursor over the window; allow hide.
      // Normal hide only fires while the cursor is still touching the desktop edge.
      if (!immediate && (!cursor || !isPointOnDesktopEdge(cursor, edge, workArea))) return;
      const retractedBounds = getRetractedBounds(edge, expandedBounds, workArea);
      const from = win.getBounds();
      retracted = true;
      activationStrip.show(edge, expandedBounds, workArea);
      animateBounds(from, retractedBounds, RETRACT_ANIMATION_MS, easeInCubic, () => {
        diag(`edge auto-hide: retracted ${edge}`);
      });
    }, delay);
  }

  function poll(): void {
    if (!canOperate() || !edge || !expandedBounds || !workArea || dragging) {
      if (dragging) clearLeaveTimer();
      return;
    }
    const cursor = getCursorPosition();
    if (!cursor) {
      clearLeaveTimer();
      return;
    }
    if (retracted) {
      if (isPointInActivationStrip(cursor, edge, expandedBounds, workArea)) restore();
      return;
    }
    // Only the absolute desktop edge counts as hide intent.
    // Leaving the window body alone must keep the docked window expanded.
    if (isPointOnDesktopEdge(cursor, edge, workArea)) {
      scheduleRetraction();
      return;
    }
    clearLeaveTimer();
  }

  function applySettle(): void {
    clearLeaveTimer();
    clearAttachment();
    if (!canOperate()) return;
    const bounds = win.getBounds();
    const matchingWorkArea = getWorkAreaForBounds(bounds);
    const attachment = getEdgeAttachment(bounds, matchingWorkArea);
    if (!attachment) {
      diag('edge auto-hide: no snap');
      return;
    }
    edge = attachment;
    workArea = matchingWorkArea;
    expandedBounds = getExpandedBounds(attachment, bounds, matchingWorkArea);
    if (!sameBounds(bounds, expandedBounds)) {
      withProgrammaticBounds(() => {
        win.setBounds(expandedBounds!);
      });
      diag(`edge auto-hide: snapped ${attachment}`);
    } else {
      diag(`edge auto-hide: attached ${attachment}`);
    }
    // Side attachment only happens after a deliberate push past the edge.
    // Retract immediately in that case so "drag in a bit" hides, while a
    // flush side placement never attaches and therefore never hides.
    if (attachment === 'left' || attachment === 'right') {
      scheduleRetraction(true);
      return;
    }
    poll();
  }

  function scheduleSettle(): void {
    clearSettleTimer();
    settleTimer = setTimeout(() => {
      settleTimer = null;
      dragging = false;
      applySettle();
    }, SETTLE_DEBOUNCE_MS);
  }

  return {
    noteMoveStarted(): void {
      if (ignoreProgrammaticBoundsEvents) return;
      dragging = true;
      clearSettleTimer();
      clearLeaveTimer();
      // A user drag cancels auto-hide state so the window can leave the edge freely.
      stopAnimation();
      if (retracted && expandedBounds && !win.isDestroyed()) {
        const target = expandedBounds;
        retracted = false;
        activationStrip.hide();
        withProgrammaticBounds(() => win.setBounds(target));
      }
      clearAttachment();
    },
    noteMoveSettled(): void {
      // BrowserWindow.setBounds emits move as well. Ignore those.
      if (ignoreProgrammaticBoundsEvents || retracted) return;
      // Always wait for the drag/move stream to go quiet before snapping so a
      // near-edge placement attaches only after the user releases.
      scheduleSettle();
    },
    noteResizeOrReset(): void {
      if (ignoreProgrammaticBoundsEvents || retracted) return;
      dragging = false;
      clearSettleTimer();
      reset();
    },
    noteForcedExpandAndClear(): void {
      // Used before hide/minimize/show so a fully parked window cannot get stuck offscreen.
      forcedExpandAndClear();
    },
    noteSettingsMode(open: boolean): void {
      settingsOpen = open;
      forcedExpandAndClear();
    },
    noteWindowModeChanged(): void {
      forcedExpandAndClear();
    },
    noteActivationStripActivated(): void {
      if (!retracted) {
        activationStrip.hide();
        return;
      }
      restore();
    },
    reconcileSettings(enabled = isEnabled()): void {
      if (!enabled) forcedExpandAndClear();
    },
    dispose(): void {
      if (disposed) return;
      stopAnimation();
      clearSettleTimer();
      forcedExpandAndClear();
      disposed = true;
      activationStrip.dispose?.();
      clearInterval(pollTimer);
    },
  };
}




