import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import Store from 'electron-store';
import type { ElectronStoreLike } from './sharedTypes';

export function getStoreConfigPath(): string {
  try {
    return path.join(app.getPath('userData'), 'config.json');
  } catch {
    return path.join(process.env.APPDATA || '', 'daily-todo', 'config.json');
  }
}

export function createSafeStore(): ElectronStoreLike {
  try {
    return new Store() as unknown as ElectronStoreLike;
  } catch {
    const configPath = getStoreConfigPath();
    if (configPath && fs.existsSync(configPath) && fs.statSync(configPath).isFile()) {
      const backupPath = path.join(
        path.dirname(configPath),
        `config.corrupt-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
      );
      fs.copyFileSync(configPath, backupPath);
      fs.writeFileSync(configPath, '{}', 'utf-8');
    }
    return new Store() as unknown as ElectronStoreLike;
  }
}
