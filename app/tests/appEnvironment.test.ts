import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAppEnvironment } from '../electron/appEnvironment';

const temporaryDirectories: string[] = [];

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

function createTemporaryDirectory(): string {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'dailytodo-environment-'));
  temporaryDirectories.push(directory);
  return directory;
}

describe('app environment', () => {
  it('uses explicit development-only environment overrides when the user-data path is a directory', () => {
    const userDataDirectory = createTemporaryDirectory();
    const setPath = vi.fn();
    const environment = createAppEnvironment({
      app: { isPackaged: false, setPath },
      appDirname: 'app',
      resourcesPath: 'resources',
      env: {
        DAILTODO_USER_DATA_DIR: userDataDirectory,
        DAILTODO_OBSIDIAN_PATH: 'D:/workspace/obsidian',
        DAILTODO_BLOG_DRAFT_DIR: 'D:/workspace/blog/posts',
      },
    });

    environment.applyDevelopmentUserDataOverride();

    expect(setPath).toHaveBeenCalledWith('userData', userDataDirectory);
    expect(environment.devObsidianPath).toBe('D:/workspace/obsidian');
    expect(environment.localBlogDraftDir).toBe('D:/workspace/blog/posts');
  });

  it('keeps portable defaults when development overrides are absent or invalid', () => {
    const setPath = vi.fn();
    const environment = createAppEnvironment({
      app: { isPackaged: false, setPath },
      appDirname: 'app',
      resourcesPath: 'resources',
      env: { DAILTODO_USER_DATA_DIR: 'D:/missing/dailytodo-user-data' },
    });

    environment.applyDevelopmentUserDataOverride();

    expect(setPath).not.toHaveBeenCalled();
    expect(environment.devObsidianPath).toBe('');
    expect(environment.localBlogDraftDir).toBe('');
  });

  it('does not apply development overrides in packaged builds', () => {
    const userDataDirectory = createTemporaryDirectory();
    const setPath = vi.fn();
    const environment = createAppEnvironment({
      app: { isPackaged: true, setPath },
      appDirname: 'app',
      resourcesPath: 'resources',
      env: {
        DAILTODO_USER_DATA_DIR: userDataDirectory,
        DAILTODO_OBSIDIAN_PATH: 'D:/workspace/obsidian',
        DAILTODO_BLOG_DRAFT_DIR: 'D:/workspace/blog/posts',
      },
    });

    environment.applyDevelopmentUserDataOverride();

    expect(setPath).not.toHaveBeenCalled();
    expect(environment.devObsidianPath).toBe('');
    expect(environment.localBlogDraftDir).toBe('');
  });
});
