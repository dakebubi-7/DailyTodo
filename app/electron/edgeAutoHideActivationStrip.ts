import { BrowserWindow } from 'electron';
import type { EdgeAutoHideActivationStrip } from './edgeAutoHideController';
import {
  EDGE_AUTO_HIDE_REVEAL_PX,
  getActivationStripBounds,
  type EdgeAutoHideEdge,
  type Rect,
} from './edgeAutoHideGeometry';

const ACTIVATE_MESSAGE = 'edge-auto-hide-activate';

type CreateEdgeAutoHideActivationStripOptions = {
  activate(): void;
  diag?(message: string): void;
};

export function createEdgeAutoHideActivationStrip({
  activate,
  diag,
}: CreateEdgeAutoHideActivationStripOptions): EdgeAutoHideActivationStrip & { dispose(): void } {
  let strip: BrowserWindow | null = null;
  let disposed = false;
  let ready = false;
  let visible = false;
  let pending: { edge: EdgeAutoHideEdge; expandedBounds: Rect; workArea: Rect } | null = null;

  function notifyActivate(source: string): void {
    // Never activate while the strip is supposed to be hidden; a stale always-on-top
    // strip must not steal clicks from the restored main window.
    if (!visible || disposed) return;
    diag?.(`edge auto-hide: activation strip ${source}`);
    activate();
  }

  function hardHide(target: BrowserWindow): void {
    visible = false;
    pending = null;
    try {
      target.setIgnoreMouseEvents(true);
    } catch {
      // ignore
    }
    if (target.isVisible()) target.hide();
  }

  function applyShow(target: BrowserWindow, edge: EdgeAutoHideEdge, expandedBounds: Rect, workArea: Rect): void {
    const bounds = getActivationStripBounds(edge, expandedBounds, workArea);
    target.setBounds(bounds);
    if (typeof target.setAlwaysOnTop === 'function') {
      target.setAlwaysOnTop(true, 'screen-saver');
    }
    target.setIgnoreMouseEvents(false);
    visible = true;
    target.showInactive();
    diag?.(`edge auto-hide: activation strip shown ${edge} ${bounds.x},${bounds.y} ${bounds.width}x${bounds.height}`);
  }

  function ensureWindow(): BrowserWindow | null {
    if (disposed) return null;
    if (strip && !strip.isDestroyed()) return strip;

    ready = false;
    visible = false;
    strip = new BrowserWindow({
      width: EDGE_AUTO_HIDE_REVEAL_PX,
      height: EDGE_AUTO_HIDE_REVEAL_PX,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      hasShadow: false,
      skipTaskbar: true,
      focusable: false,
      resizable: false,
      maximizable: false,
      minimizable: false,
      fullscreenable: false,
      alwaysOnTop: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
      },
    });
    strip.setMenuBarVisibility?.(false);
    strip.setIgnoreMouseEvents(true);
    strip.webContents.on('console-message', (_event, _level, message) => {
      if (String(message).includes(ACTIVATE_MESSAGE)) {
        notifyActivate('console');
      }
    });
    strip.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'mouseMove' || input.type === 'mouseDown') {
        notifyActivate(input.type);
      }
    });
    strip.webContents.on('did-finish-load', () => {
      ready = true;
      if (!strip || strip.isDestroyed() || !pending || !visible && !pending) {
        // If we were asked to hide before load finished, stay hidden.
      }
      if (!strip || strip.isDestroyed() || !pending) return;
      if (!visible && pending) {
        // show() may have been requested before ready; only apply if still wanted.
      }
      const next = pending;
      pending = null;
      // Only show if a show is still desired. pending existing means show was requested.
      applyShow(strip, next.edge, next.expandedBounds, next.workArea);
    });
    strip.on('closed', () => {
      strip = null;
      ready = false;
      visible = false;
      pending = null;
    });
    strip.loadURL(getActivationStripPageUrl());
    return strip;
  }

  return {
    show(edge: EdgeAutoHideEdge, expandedBounds: Rect, workArea: Rect): void {
      const target = ensureWindow();
      if (!target) return;
      // Mark desired visibility before ready so did-finish-load can apply it.
      visible = true;
      if (!ready) {
        pending = { edge, expandedBounds, workArea };
        return;
      }
      pending = null;
      applyShow(target, edge, expandedBounds, workArea);
    },
    hide(): void {
      pending = null;
      visible = false;
      if (strip && !strip.isDestroyed()) hardHide(strip);
    },
    dispose(): void {
      disposed = true;
      pending = null;
      visible = false;
      if (strip && !strip.isDestroyed()) strip.destroy();
      strip = null;
      ready = false;
    },
  };
}

export function getActivationStripPageHtml(): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        overflow: hidden;
        background: transparent;
        cursor: pointer;
      }
      .strip {
        width: 100%;
        height: 100%;
        border-radius: 999px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.42), rgba(255,255,255,0.10) 48%, rgba(180,210,255,0.16)),
          rgba(255, 255, 255, 0.12);
        border: 1px solid rgba(255, 255, 255, 0.34);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.55),
          inset 0 -1px 0 rgba(255,255,255,0.08),
          0 4px 14px rgba(20, 30, 50, 0.16);
        backdrop-filter: blur(18px) saturate(1.35);
        -webkit-backdrop-filter: blur(18px) saturate(1.35);
      }
    </style>
  </head>
  <body>
    <div class="strip"></div>
    <script>
      const notify = () => console.log('${ACTIVATE_MESSAGE}');
      document.addEventListener('mouseenter', notify);
      document.addEventListener('mousemove', notify);
      document.addEventListener('mousedown', notify);
      document.addEventListener('pointerdown', notify);
      document.addEventListener('click', notify);
    </script>
  </body>
</html>`;
}

function getActivationStripPageUrl(): string {
  return `data:text/html;charset=utf-8,${encodeURIComponent(getActivationStripPageHtml())}`;
}

export { getActivationStripBounds };
