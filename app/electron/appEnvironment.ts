import type { App } from 'electron';
import fs from 'fs';
import type { IconPathOptions } from './appIcons';

const DEV_APPDATA_ROOT = 'G:\\Personal-AI\\DailyTodo\\data';
const DEV_OBSIDIAN_PATH = 'G:\\Personal-AI\\Personal-KB';
const LOCAL_BLOG_DRAFT_DIR = 'C:\\Users\\25788\\blog\\content\\posts';

type CreateAppEnvironmentOptions = {
  app: Pick<App, 'isPackaged' | 'setPath'>;
  appDirname: string;
  resourcesPath: string;
};

export function createAppEnvironment({
  app,
  appDirname,
  resourcesPath,
}: CreateAppEnvironmentOptions) {
  function isDevelopmentBuild() {
    return !app.isPackaged;
  }

  function applyDevelopmentUserDataOverride() {
    try {
      if (isDevelopmentBuild() && fs.existsSync(DEV_APPDATA_ROOT) && fs.statSync(DEV_APPDATA_ROOT).isDirectory()) {
        app.setPath('userData', DEV_APPDATA_ROOT);
      }
    } catch {}
  }

  function getIconPathOptions(): IconPathOptions {
    return {
      isDevelopment: isDevelopmentBuild(),
      appDirname,
      resourcesPath,
    };
  }

  return {
    isDevelopmentBuild,
    applyDevelopmentUserDataOverride,
    getIconPathOptions,
    devObsidianPath: DEV_OBSIDIAN_PATH,
    localBlogDraftDir: LOCAL_BLOG_DRAFT_DIR,
  };
}
