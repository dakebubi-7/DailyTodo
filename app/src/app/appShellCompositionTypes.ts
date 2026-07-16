import type { ComponentProps } from 'react';
import type { TitleBar } from '../components/TitleBar';
import type { createAppModalActions } from './appModalActions';
import type { AppShellMainContentCompositionOptions } from './appShellMainContentComposition';
import type { AppShellOverlayCompositionOptions } from './appShellOverlayComposition';

export interface AppShellTitleBarCompositionInputs {
  compactMode: ComponentProps<typeof TitleBar>['compactMode'];
  settingsOpen: AppShellOverlayCompositionOptions['settingsOpen'];
  lockWindowPosition: ComponentProps<typeof TitleBar>['lockWindowPosition'];
  language: AppShellOverlayCompositionOptions['appSettings']['language'];
  appModalActions: ReturnType<typeof createAppModalActions>;
}

export type AppShellMainContentCompositionInputs = AppShellMainContentCompositionOptions;

export type AppShellOverlayCompositionInputs = AppShellOverlayCompositionOptions;

export interface AppShellCompositionOptions {
  titleBar: AppShellTitleBarCompositionInputs;
  mainContent: AppShellMainContentCompositionInputs;
  overlay: AppShellOverlayCompositionInputs;
}
