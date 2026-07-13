import { BrowserWindow } from 'electron';
import path from 'path';
import {
  buildDevRendererUrl,
  buildRendererQuery,
  type RendererRoute,
} from '../shared/rendererRoute';

type CreateRendererLoaderOptions = {
  diag(message: string): void;
};

export function createRendererLoader({ diag }: CreateRendererLoaderOptions) {
  return function loadRenderer(win: BrowserWindow, route: RendererRoute) {
    const devServerUrl = process.env.ELECTRON_RENDERER_URL || process.env.VITE_DEV_SERVER_URL;
    if (devServerUrl) {
      const url = buildDevRendererUrl(devServerUrl, route);
      diag(`loadURL ${url}`);
      win.loadURL(url);
      return;
    }

    const query = buildRendererQuery(route);
    diag(`loadFile dist/index.html ${JSON.stringify(query)}`);
    win.loadFile(path.join(__dirname, '../dist/index.html'), { query });
  };
}
