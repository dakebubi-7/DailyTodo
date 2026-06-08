import type { SectionConfig } from './sectionConfig';
import { createDefaultSections, normalizeSections } from './sectionConfig';

/** 用户覆盖层：按 markerKey 记录用户改动的字段（部分覆盖）。 */
export type SectionOverride = Partial<Omit<SectionConfig, 'markerKey'>> & { markerKey: SectionConfig['markerKey'] };

/**
 * 预设 + 覆盖：以 base（预设，默认或公司模板）为底，叠加用户 override 层。
 * 预设升级时，用户未改的字段自动跟随新预设；改过的字段保留。
 */
export function applyOverrides(base: SectionConfig[], overrides: SectionOverride[]): SectionConfig[] {
  const byKey = new Map(overrides.map((o) => [o.markerKey, o]));
  return base.map((section) => {
    const ov = byKey.get(section.markerKey);
    if (!ov) return section;
    return {
      ...section,
      title: typeof ov.title === 'string' && ov.title.trim() ? ov.title : section.title,
      type: ov.type ?? section.type,
      prompt: typeof ov.prompt === 'string' && ov.prompt.trim() ? ov.prompt : section.prompt,
    };
  });
}

/** 「恢复默认」：清空 override，回到 base 预设。 */
export function resetToDefault(base?: SectionConfig[]): SectionConfig[] {
  return base ? normalizeSections(base) : createDefaultSections();
}
