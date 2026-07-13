import type { ComponentProps } from 'react';
import { AppMainContent } from '../components/AppMainContent';
import { AppOverlayStack } from '../components/AppOverlayStack';
import { TitleBar } from '../components/TitleBar';
import { createAppShellOverlayComposition } from './appShellOverlayComposition';
import { createAppShellMainContentComposition } from './appShellMainContentComposition';
import type { AppShellCompositionOptions } from './appShellCompositionTypes';

export type { AppShellCompositionOptions } from './appShellCompositionTypes';

export interface AppShellComposition {
  titleBarProps: ComponentProps<typeof TitleBar>;
  overlayStackProps: ComponentProps<typeof AppOverlayStack>;
  mainContentProps: ComponentProps<typeof AppMainContent>;
}

export function createAppShellComposition({
  titleBar,
  mainContent,
  overlay,
}: AppShellCompositionOptions): AppShellComposition {
  const titleBarProps = {
    compactMode: titleBar.compactMode,
    settingsOpen: titleBar.settingsOpen,
    lockWindowPosition: titleBar.lockWindowPosition,
    language: titleBar.language,
    onToggleCompactMode: titleBar.appModalActions.toggleCompactMode,
    onToggleSettings: titleBar.appModalActions.toggleSettings,
    onToggleLockWindowPosition: titleBar.appModalActions.toggleLockWindowPosition,
  };
  const mainContentProps = createAppShellMainContentComposition(mainContent);
  const overlayStackProps = createAppShellOverlayComposition(overlay);

  return {
    titleBarProps,
    overlayStackProps,
    mainContentProps,
  };
}
