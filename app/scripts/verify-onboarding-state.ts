import { strict as assert } from 'node:assert';
import { createDefaultAiReviewSettings } from '../shared/aiReview/aiReviewSettings';
import { shouldShowOnboarding, dismissOnboarding } from '../shared/aiReview/onboarding';

// 默认设置（未启用、从未关闭向导）→ 应显示向导
const fresh = createDefaultAiReviewSettings();
assert.equal(shouldShowOnboarding(fresh), true, '首启未配置 → 显示向导');

// 已启用 AI → 不再显示
assert.equal(shouldShowOnboarding({ ...fresh, enabled: true }), false, '已启用 → 不显示');

// 用户关闭过向导（即便仍未启用）→ 不显示
assert.equal(shouldShowOnboarding({ ...fresh, onboardingDismissed: true }), false, '关闭过 → 不显示');

// 启用且关闭 → 不显示
assert.equal(
  shouldShowOnboarding({ ...fresh, enabled: true, onboardingDismissed: true }),
  false,
  '启用且关闭 → 不显示',
);

// dismissOnboarding 标记关闭且不破坏其它字段
const dismissed = dismissOnboarding(fresh);
assert.equal(dismissed.onboardingDismissed, true, 'dismiss 置位');
assert.equal(dismissed.baseUrl, fresh.baseUrl, '其它字段保留');
assert.equal(shouldShowOnboarding(dismissed), false, 'dismiss 后不再显示');
// 不可变：原对象不受影响
assert.equal(fresh.onboardingDismissed, false, '原设置对象未被修改');

console.log('Onboarding state verification passed');
