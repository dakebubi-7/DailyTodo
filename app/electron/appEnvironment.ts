import type { App } from 'electron';
import fs from 'fs';
import type { IconPathOptions } from './appIcons';

const USER_DATA_OVERRIDE_ENV = 'DAILTODO_USER_DATA_DIR';
const OBSIDIAN_PATH_OVERRIDE_ENV = 'DAILTODO_OBSIDIAN_PATH';
const BLOG_DRAFT_DIR_OVERRIDE_ENV = 'DAILTODO_BLOG_DRAFT_DIR';

type CreateAppEnvironmentOptions = {
  app: Pick<App, 'isPackaged' | 'setPath'>;
  appDirname: string;
  resourcesPath: string;
  env?: NodeJS.ProcessEnv;
};

export function createAppEnvironment({
  app,
  appDirname,
  resourcesPath,
  env = process.env,
}: CreateAppEnvironmentOptions) {
  function isDevelopmentBuild() {
    return !app.isPackaged;
  }

  const devObsidianPath = isDevelopmentBuild() ? env[OBSIDIAN_PATH_OVERRIDE_ENV] || '' : '';
  const localBlogDraftDir = isDevelopmentBuild() ? env[BLOG_DRAFT_DIR_OVERRIDE_ENV] || '' : '';

  function applyDevelopmentUserDataOverride() {
    const userDataDirectory = isDevelopmentBuild() ? env[USER_DATA_OVERRIDE_ENV] : '';
    try {
      if (userDataDirectory && fs.existsSync(userDataDirectory) && fs.statSync(userDataDirectory).isDirectory()) {
        app.setPath('userData', userDataDirectory);
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
    devObsidianPath,
    localBlogDraftDir,
  };
}
