import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

type OutputAsset = {
  file: string;
  bytes: number;
};

const root = join(import.meta.dirname, '..');
const dist = join(root, 'dist');
const indexPath = join(dist, 'index.html');

if (!existsSync(indexPath)) {
  throw new Error('Production renderer output is missing. Run npm.cmd run build before verify:build-output.');
}

const indexHtml = readFileSync(indexPath, 'utf8');
const scripts = [...indexHtml.matchAll(/<script[^>]+src="(?:\.\/)?([^"?]+)(?:\?[^\"]*)?"/g)].map((match) => match[1]);
const styles = [...indexHtml.matchAll(/<link[^>]+href="(?:\.\/)?([^"?]+)(?:\?[^\"]*)?"[^>]*>/g)]
  .map((match) => match[1])
  .filter((file) => file.startsWith('assets/') && file.endsWith('.css'));

function toAsset(file: string): OutputAsset {
  const path = join(dist, file);
  if (!existsSync(path)) {
    throw new Error(`Production asset referenced by index.html is missing: ${file}`);
  }
  return { file, bytes: statSync(path).size };
}

const scriptAssets = scripts.map(toAsset);
const discovered = new Set(styles);
const visited = new Set<string>();

function collectImportedAssets(file: string) {
  if (visited.has(file) || !file.endsWith('.js')) return;
  visited.add(file);
  const source = readFileSync(join(dist, file), 'utf8');
  for (const match of source.matchAll(/["']\.\/([^"']+\.(?:js|css))["']/g)) {
    const imported = match[1].startsWith('assets/') ? match[1] : `assets/${match[1]}`;
    discovered.add(imported);
    collectImportedAssets(imported);
  }
}

for (const entryScript of scripts) collectImportedAssets(entryScript);

const allAssets = [...discovered].map(toAsset);
const entry = scriptAssets[0];
const app = allAssets.find((asset) => asset.file.startsWith('assets/App-') && asset.file.endsWith('.js'));
const cssAssets = allAssets.filter((asset) => asset.file.endsWith('.css'));

if (!entry || !app) {
  throw new Error('Could not find the renderer entry and App chunk from dist/index.html imports.');
}

console.log(JSON.stringify({
  entry,
  app,
  css: cssAssets,
}, null, 2));
