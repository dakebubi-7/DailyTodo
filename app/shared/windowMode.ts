export type WindowMode = 'normal' | 'onTop' | 'desktop';

export const WINDOW_MODE_KEY = 'windowMode';
export const LEGACY_ALWAYS_ON_TOP_KEY = 'alwaysOnTop';

export const DEFAULT_WINDOW_MODE: WindowMode = 'onTop';

export function isWindowMode(value: unknown): value is WindowMode {
  return value === 'normal' || value === 'onTop' || value === 'desktop';
}

/**
 * 解析存储的窗口模式。优先用新键 windowMode；缺失时从旧布尔 alwaysOnTop 迁移
 * （true→onTop，false→normal），让老用户升级后行为不变。
 */
export function resolveWindowMode(storedMode: unknown, legacyAlwaysOnTop?: unknown): WindowMode {
  if (isWindowMode(storedMode)) return storedMode;
  if (typeof legacyAlwaysOnTop === 'boolean') return legacyAlwaysOnTop ? 'onTop' : 'normal';
  return DEFAULT_WINDOW_MODE;
}

/** 置顶只在 onTop 模式开启；desktop 与 normal 都不抢前台 Z 序。 */
export function isAlwaysOnTop(mode: WindowMode): boolean {
  return mode === 'onTop';
}

/** desktop 模式才需要 Win+D 守卫（被最小化时弹回桌面）。 */
export function needsDesktopGuard(mode: WindowMode): boolean {
  return mode === 'desktop';
}

/**
 * 标题栏图钉按钮：在 normal ↔ onTop 间切。
 * 若当前在 desktop，点图钉视为「退出桌面模式并置顶」。
 */
export function togglePinnedMode(current: WindowMode): WindowMode {
  return current === 'onTop' ? 'normal' : 'onTop';
}

/**
 * 托盘「钉在桌面」勾选项：勾上→desktop；取消→normal。
 * 三模式互斥由此保证（进 desktop 必然关闭置顶）。
 */
export function setDesktopMode(current: WindowMode, pinnedToDesktop: boolean): WindowMode {
  if (pinnedToDesktop) return 'desktop';
  return current === 'desktop' ? 'normal' : current;
}
