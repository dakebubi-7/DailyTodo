import fs from 'fs';
import type { ElectronStoreLike, VaultStatus } from './sharedTypes';

const OBSIDIAN_PATH_KEY = 'obsidianVaultPath';

type CreateObsidianVaultAccessorsOptions = {
  store: ElectronStoreLike;
  isDevelopmentBuild(): boolean;
  devObsidianPath: string;
  zh(text: string): string;
};

function isExistingDirectory(filePath: string) {
  try {
    return fs.existsSync(filePath) && fs.statSync(filePath).isDirectory();
  } catch {
    return false;
  }
}

export function createObsidianVaultAccessors({
  store,
  isDevelopmentBuild,
  devObsidianPath,
  zh,
}: CreateObsidianVaultAccessorsOptions) {
  function getDefaultVaultPath() {
    return isDevelopmentBuild() && isExistingDirectory(devObsidianPath) ? devObsidianPath : '';
  }

  function getVaultPath() {
    const storedPath = store.get(OBSIDIAN_PATH_KEY);
    return (typeof storedPath === 'string' ? storedPath : undefined) || getDefaultVaultPath();
  }

  function getVaultStatus(): VaultStatus {
    const vaultPath = getVaultPath();
    if (!vaultPath) return { ok: false, reason: zh('\u8bf7\u5148\u9009\u62e9 Obsidian \u6587\u4ef6\u5939') };
    if (!fs.existsSync(vaultPath)) {
      return {
        ok: false,
        reason: zh('\u5df2\u8bb0\u5f55\u7684 Obsidian \u6587\u4ef6\u5939\u4e0d\u5b58\u5728\uff0c\u8bf7\u70b9\u201c\u66f4\u6539\u6587\u4ef6\u5939\u201d\u91cd\u65b0\u9009\u62e9'),
      };
    }
    if (!isExistingDirectory(vaultPath)) {
      return {
        ok: false,
        reason: zh('\u5df2\u8bb0\u5f55\u7684 Obsidian \u8def\u5f84\u4e0d\u662f\u6587\u4ef6\u5939\uff0c\u8bf7\u70b9\u201c\u66f4\u6539\u6587\u4ef6\u5939\u201d\u91cd\u65b0\u9009\u62e9'),
      };
    }
    return { ok: true, vaultPath };
  }

  return { getDefaultVaultPath, getVaultPath, getVaultStatus };
}
