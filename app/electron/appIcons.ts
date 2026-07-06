import { nativeImage } from 'electron';
import fs from 'fs';
import path from 'path';

const APP_ICON_PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAABiklEQVR4nO3bQRKCMAwFUM7BHbgCB0Dv4PW8ijdx6ca1rpxhFCFpkv6kDTPZgc1/QumCDgPxmJb5FamouZoLrgaBbhwKgW4WioBuEoqAbg6KgG4KjoBuCAqAbgaOgG4ECoBuAl3qAM/H3bRcA1iHt0BQA6gVXhtBBaB2eE0EMQAqvBZCAiRAAiSAGcC0zBetSoAECAjQ/RyQAAmQAOoBQwFMy3wqrb1wXQBQx2wVgDymawCrSa1rgFCToHX4pgBKx2kCQDJGeADpGO4AtJvXAKwGwAmhdXeFAOCcRwl/u543yzXA+tzS8P+CSyCqAkj+eWp4LoL5JFg7/DiOLAST1yAy/KeoCGbrgNoA6/AuADgIVuEpCOYrQcn1R8/4Vnh3ANwF0h7Ad0hKeBcAWwiUa45udUp4cwAOArcoz/tR+CoAVgilkx4EAIUgXRG6/1CSsxByAWBRVuGnSN8Lm4WPAsBBoP5e2D0D0uA/4aMBaFTX+4a63jm2G751BFL4VhFY4VuCKA4eHYKa6w3BqOZexsuoaQAAAABJRU5ErkJggg==';

export interface IconPathOptions {
  isDevelopment: boolean;
  appDirname: string;
  resourcesPath: string;
}

export function resolveIconPath(fileName: string, options: IconPathOptions) {
  const candidates = options.isDevelopment
    ? [path.join(options.appDirname, '..', 'build', fileName)]
    : [path.join(options.resourcesPath, fileName)];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return '';
}

export function createAppIcon(options: IconPathOptions) {
  const iconPath = resolveIconPath('icon.png', options);
  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) return image;
  }
  return nativeImage.createFromBuffer(Buffer.from(APP_ICON_PNG_BASE64, 'base64'));
}

export function createTrayIcon(options: IconPathOptions) {
  const iconPath = resolveIconPath('tray.png', options);
  if (iconPath) {
    const image = nativeImage.createFromPath(iconPath);
    if (!image.isEmpty()) return image.resize({ width: 16, height: 16 });
  }
  return nativeImage.createFromBuffer(Buffer.from(APP_ICON_PNG_BASE64, 'base64')).resize({ width: 16, height: 16 });
}
