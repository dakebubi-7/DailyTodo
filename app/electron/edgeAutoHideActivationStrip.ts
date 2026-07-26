import { BrowserWindow } from 'electron';
import type { EdgeAutoHideActivationStrip } from './edgeAutoHideController';
import {
  EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
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
  let pageRevision = 0;

  function notifyActivate(source: string): void {
    // Never activate while the strip is supposed to be hidden; a stale always-on-top
    // strip must not steal clicks from the restored main window.
    if (!visible || disposed) return;
    diag?.(`edge auto-hide: activation strip ${source}`);
    activate();
  }

  function hardHide(target: BrowserWindow): void {
    pageRevision += 1;
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
    const revision = ++pageRevision;
    target.setBounds(bounds);
    if (typeof target.setAlwaysOnTop === 'function') {
      target.setAlwaysOnTop(true, 'screen-saver');
    }
    target.setIgnoreMouseEvents(true);

    const isCurrent = (): boolean => !disposed
      && visible
      && strip === target
      && !target.isDestroyed()
      && pageRevision === revision;
    const hideAndRestore = (): void => {
      if (!isCurrent()) return;
      hardHide(target);
      activate();
    };

    let setEdge: Promise<unknown>;
    try {
      setEdge = target.webContents.executeJavaScript(
        `document.documentElement.dataset.edge = ${JSON.stringify(edge)};`,
        true,
      );
    } catch {
      hideAndRestore();
      return;
    }

    void setEdge
      .then(() => {
        if (!isCurrent()) return;
        target.setIgnoreMouseEvents(false);
        target.showInactive();
        diag?.(`edge auto-hide: activation strip shown ${edge} ${bounds.x},${bounds.y} ${bounds.width}x${bounds.height}`);
      })
      .catch(hideAndRestore);
  }

  function ensureWindow(): BrowserWindow | null {
    if (disposed) return null;
    if (strip && !strip.isDestroyed()) return strip;

    ready = false;
    visible = false;
    strip = new BrowserWindow({
      width: EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
      height: EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX,
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
      if (!strip || strip.isDestroyed() || !visible || !pending) return;
      const next = pending;
      pending = null;
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
<html data-edge="right">
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
      .glass-pull {
        position: absolute;
        display: block;
        box-sizing: border-box;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.26), rgba(194,231,210,0.12)),
          rgba(207,242,221,0.16);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.34),
          0 4px 12px rgba(0,8,6,0.27);
        backdrop-filter: blur(14px) saturate(1.2);
        -webkit-backdrop-filter: blur(14px) saturate(1.2);
        transition: width 150ms ease, height 150ms ease, background 150ms ease, box-shadow 150ms ease;
      }
      .glass-pull::before {
        content: "";
        position: absolute;
        width: 6px;
        height: 6px;
        border-right: 1.5px solid rgba(244,255,248,0.94);
        border-bottom: 1.5px solid rgba(244,255,248,0.94);
      }
      html[data-edge="right"] .glass-pull {
        top: 50%;
        right: 0;
        width: 15px;
        height: 72px;
        transform: translateY(-50%);
        border: 1px solid rgba(237,255,244,0.42);
        border-right: 0;
        border-radius: 9px 0 0 9px;
      }
      html[data-edge="right"] .glass-pull::before {
        top: 50%;
        left: 50%;
        transform: translate(-23%, -50%) rotate(135deg);
      }
      html[data-edge="right"] body:hover .glass-pull {
        width: 19px;
      }
      html[data-edge="left"] .glass-pull {
        top: 50%;
        left: 0;
        width: 15px;
        height: 72px;
        transform: translateY(-50%);
        border: 1px solid rgba(237,255,244,0.42);
        border-left: 0;
        border-radius: 0 9px 9px 0;
      }
      html[data-edge="left"] .glass-pull::before {
        top: 50%;
        left: 50%;
        transform: translate(-77%, -50%) rotate(-45deg);
      }
      html[data-edge="left"] body:hover .glass-pull {
        width: 19px;
      }
      html[data-edge="top"] .glass-pull {
        top: 0;
        left: 50%;
        width: 72px;
        height: 15px;
        transform: translateX(-50%);
        border: 1px solid rgba(237,255,244,0.42);
        border-top: 0;
        border-radius: 0 0 9px 9px;
      }
      html[data-edge="top"] .glass-pull::before {
        top: 50%;
        left: 50%;
        transform: translate(-50%, -77%) rotate(45deg);
      }
      html[data-edge="top"] body:hover .glass-pull {
        height: 19px;
      }
      body:hover .glass-pull {
        background:
          linear-gradient(180deg, rgba(255,255,255,0.34), rgba(202,244,220,0.18)),
          rgba(217,251,230,0.27);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.4),
          0 4px 13px rgba(0,8,6,0.3);
      }
    </style>
  </head>
  <body>
    <div class="glass-pull"></div>
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
