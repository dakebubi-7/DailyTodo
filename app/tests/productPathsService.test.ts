import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createProductPathsService } from '../electron/productPaths';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('product paths service', () => {
  it('writes a support bundle without credentials or Obsidian paths', () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-support-'));
    temporaryDirectories.push(directory);
    const targetPath = path.join(directory, 'support.json');
    const service = createProductPathsService({
      getAppVersion: () => '1.0.0',
      getAppSettings: () => ({ language: 'en-US', minimizeToTrayOnClose: true }),
      getAiReviewSettings: () => ({
        enabled: true,
        apiKey: 'secret-key',
        profiles: [{ id: 'main', apiKey: 'profile-secret' }],
      }),
      getCompanionSettings: () => ({ vaultPath: 'C:/private/vault', mobileInboxPath: 'C:/private/inbox' }),
      getObsidianTemplateSettings: () => ({ obsidianPath: 'C:/private/vault/templates' }),
      now: () => new Date('2026-07-26T09:00:00.000Z'),
      platform: 'win32',
      arch: 'x64',
    });

    service.exportSupportBundle(targetPath);

    const contents = fs.readFileSync(targetPath, 'utf8');
    expect(contents).toContain('dailytodo-support-bundle');
    expect(contents).not.toContain('secret-key');
    expect(contents).not.toContain('profile-secret');
    expect(contents).not.toContain('C:/private/vault');
    expect(contents).not.toContain('C:/private/inbox');
  });
});
