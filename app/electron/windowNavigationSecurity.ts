import type { BrowserWindow } from 'electron';

/**
 * Deny unexpected navigation and window.open targets for renderer windows.
 * Local file loads and the configured dev server URL remain allowed.
 */
export function hardenRendererNavigation(win: BrowserWindow): void {
  const allowedDevServerOrigins = new Set<string>();
  for (const raw of [process.env.ELECTRON_RENDERER_URL, process.env.VITE_DEV_SERVER_URL]) {
    if (!raw) continue;
    try {
      allowedDevServerOrigins.add(new URL(raw).origin);
    } catch {
      // Ignore malformed dev server env values.
    }
  }

  const isAllowedNavigation = (url: string) => {
    if (url === 'about:blank') return true;
    try {
      const parsed = new URL(url);
      if (parsed.protocol === 'file:') return true;
      if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && allowedDevServerOrigins.has(parsed.origin)) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  win.webContents.on('will-navigate', (event, url) => {
    if (!isAllowedNavigation(url)) {
      event.preventDefault();
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedNavigation(url)) {
      return { action: 'allow' };
    }
    return { action: 'deny' };
  });
}
