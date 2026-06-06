import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const buildDir = path.join(root, 'build');
const svg = readFileSync(path.join(buildDir, 'app-icon.svg'));

const icoSizes = [16, 24, 32, 48, 64, 128, 256];
const pngBuffers = await Promise.all(
  icoSizes.map((size) => sharp(svg).resize(size, size).png().toBuffer()),
);

const ico = await pngToIco(pngBuffers);
writeFileSync(path.join(buildDir, 'icon.ico'), ico);

await sharp(svg).resize(512, 512).png().toFile(path.join(buildDir, 'icon.png'));
await sharp(svg).resize(256, 256).png().toFile(path.join(buildDir, 'tray.png'));

console.log('Icons generated: build/icon.ico, build/icon.png, build/tray.png');
