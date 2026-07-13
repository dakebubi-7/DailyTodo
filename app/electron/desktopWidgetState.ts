export type DesktopWidgetState = 'desktop-visible' | 'app-background' | 'dt-active';

export type ResolveDesktopWidgetStateOptions = {
  foregroundClass: string;
  ownForeground: boolean;
  currentState: DesktopWidgetState;
  desktopShellSeenAt: number;
  now: number;
  desktopForegroundClasses: ReadonlySet<string>;
};

export type DesktopWidgetStateResolution = {
  nextState: DesktopWidgetState;
  desktopShellSeenAt: number;
  shellForeground: boolean;
  withinDesktopGrace: boolean;
  shouldForceAppBackground: boolean;
};

export function resolveDesktopWidgetState({
  foregroundClass,
  ownForeground,
  currentState,
  desktopShellSeenAt,
  now,
  desktopForegroundClasses,
}: ResolveDesktopWidgetStateOptions): DesktopWidgetStateResolution {
  const shellForeground = desktopForegroundClasses.has(foregroundClass);
  const nextDesktopShellSeenAt = shellForeground
    ? now
    : foregroundClass && !ownForeground
      ? 0
      : desktopShellSeenAt;
  const withinDesktopGrace =
    foregroundClass === '' &&
    currentState === 'desktop-visible' &&
    nextDesktopShellSeenAt > 0 &&
    now - nextDesktopShellSeenAt < 120;
  const nextState: DesktopWidgetState = ownForeground
    ? 'dt-active'
    : (shellForeground || withinDesktopGrace)
      ? 'desktop-visible'
      : 'app-background';

  return {
    nextState,
    desktopShellSeenAt: nextDesktopShellSeenAt,
    shellForeground,
    withinDesktopGrace,
    shouldForceAppBackground:
      nextState === 'app-background' &&
      Boolean(foregroundClass) &&
      !ownForeground &&
      !shellForeground,
  };
}
