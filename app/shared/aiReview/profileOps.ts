import { AiProfile, AiReviewSettings } from './aiReviewSettings';

/** 切换当前生效账号；id 不存在则不变。 */
export function selectProfile(settings: AiReviewSettings, id: string): AiReviewSettings {
  if (!settings.profiles.some((p) => p.id === id)) return settings;
  return { ...settings, activeProfileId: id };
}

/** 改某账号字段（id 不可被 patch 改动）；id 不存在则不变。 */
export function updateProfile(settings: AiReviewSettings, id: string, patch: Partial<AiProfile>): AiReviewSettings {
  if (!settings.profiles.some((p) => p.id === id)) return settings;
  return {
    ...settings,
    profiles: settings.profiles.map((p) => (p.id === id ? { ...p, ...patch, id: p.id } : p)),
  };
}

/** 追加一个新账号并设为当前；不动已有账号。 */
export function addProfile(settings: AiReviewSettings, profile: AiProfile): AiReviewSettings {
  return { ...settings, profiles: [...settings.profiles, profile], activeProfileId: profile.id };
}

/** 复制来源账号为新账号（新 id + 新名，保留其余字段）并设为当前；源不存在则不变。 */
export function duplicateProfile(
  settings: AiReviewSettings,
  sourceId: string,
  newId: string,
  newName: string,
): AiReviewSettings {
  const src = settings.profiles.find((p) => p.id === sourceId);
  if (!src) return settings;
  const clone: AiProfile = { ...src, id: newId, name: newName };
  return { ...settings, profiles: [...settings.profiles, clone], activeProfileId: clone.id };
}

/** 删除账号；删空时用 fallback 兜底；删的是当前账号则当前移到剩余首个。 */
export function deleteProfile(settings: AiReviewSettings, id: string, fallback: AiProfile): AiReviewSettings {
  const remaining = settings.profiles.filter((p) => p.id !== id);
  if (remaining.length === 0) {
    return { ...settings, profiles: [fallback], activeProfileId: fallback.id };
  }
  const activeProfileId = settings.activeProfileId === id ? remaining[0].id : settings.activeProfileId;
  return { ...settings, profiles: remaining, activeProfileId };
}
