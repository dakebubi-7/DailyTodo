import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const mainBundle = join(import.meta.dirname, '..', 'dist-electron', 'main.js');

if (!existsSync(mainBundle)) {
  throw new Error('Electron main bundle is missing. Run npm.cmd run build before verifying electron-store bundling.');
}

const source = readFileSync(mainBundle, 'utf8');

if (source.includes('require("electron-store")') || source.includes("require('electron-store')")) {
  throw new Error('Electron main bundle must inline electron-store because the package is ESM-only.');
}

console.log('Electron store bundle verification passed');
