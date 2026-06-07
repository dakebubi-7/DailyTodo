import type { AiReviewSettings } from './aiReviewSettings';

/**
 * 是否需要在启动时弹出 AI 首次向导。
 * 规则：AI 尚未启用，且用户从未关闭过向导。
 * 一旦启用 AI 或显式关闭/跳过向导，后续都不再打扰。
 */
export function shouldShowOnboarding(settings: AiReviewSettings): boolean {
  return !settings.enabled && !settings.onboardingDismissed;
}

/** 返回已标记「向导已关闭」的设置副本（不可变，不修改入参）。 */
export function dismissOnboarding(settings: AiReviewSettings): AiReviewSettings {
  return { ...settings, onboardingDismissed: true };
}
