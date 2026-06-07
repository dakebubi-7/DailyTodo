import type { ReviewMarkerKey } from './markers';

/** 内置近义词词典：把用户段落标题模糊映射到三种 markerKey。完全离线，不经 AI。 */
const SYNONYMS: Record<ReviewMarkerKey, string[]> = {
  REVIEW: ['复盘', '总结', '回顾', 'review', 'summary', 'retrospective', '小结'],
  TOMORROW: ['明日', '明天', '计划', '待办', 'tomorrow', 'plan', 'todo', '下一步', 'next'],
  KNOWLEDGE: ['知识', '经验', '沉淀', '学到', '可复用', 'knowledge', 'learning', 'takeaway', '心得'],
};

export interface FuzzyMatch {
  markerKey: ReviewMarkerKey;
  matched: string;
}

/** 对单个标题做模糊匹配；命中返回 markerKey，否则 null。 */
export function fuzzyMatchTitle(title: string): FuzzyMatch | null {
  const lower = title.toLowerCase();
  for (const key of Object.keys(SYNONYMS) as ReviewMarkerKey[]) {
    const hit = SYNONYMS[key].find((word) => lower.includes(word.toLowerCase()));
    if (hit) return { markerKey: key, matched: hit };
  }
  return null;
}

export interface FuzzyResult {
  matches: Array<{ title: string; markerKey: ReviewMarkerKey }>;
  unmatched: string[];
}

/** 对一组标题模糊匹配；返回命中与未识别项。全部未识别时调用方应走「手动指认」兜底，不崩、不覆盖。 */
export function fuzzyMatchTitles(titles: string[]): FuzzyResult {
  const matches: FuzzyResult['matches'] = [];
  const unmatched: string[] = [];
  for (const title of titles) {
    const m = fuzzyMatchTitle(title);
    if (m) matches.push({ title, markerKey: m.markerKey });
    else unmatched.push(title);
  }
  return { matches, unmatched };
}
