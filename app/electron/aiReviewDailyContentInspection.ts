import fs from 'fs';
import { hasManagedAiContent } from '../shared/aiReview/markers';
import type { ReadResult } from './aiReview/atomicWrite';
import type { InspectDailyResult } from './sharedTypes';

export type DailyAiContentInspection = InspectDailyResult & {
  snapshot?: ReadResult;
};

export function inspectDailyAiContentWithSnapshot(
  getDailyFilePath: (date?: string) => string,
  date: string,
): DailyAiContentInspection {
  const filePath = getDailyFilePath(date);
  if (!fs.existsSync(filePath)) return { exists: false, hasAiContent: false, filePath };

  try {
    const beforeRead = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, 'utf-8');
    const afterRead = fs.statSync(filePath);
    if (beforeRead.size !== afterRead.size || beforeRead.mtimeMs !== afterRead.mtimeMs) {
      return { exists: true, hasAiContent: false, filePath, error: '日记文件在读取过程中被外部修改，请稍后重试' };
    }
    return {
      exists: true,
      hasAiContent: hasManagedAiContent(content),
      filePath,
      snapshot: { content, stamp: { size: afterRead.size, mtimeMs: afterRead.mtimeMs } },
    };
  } catch (error) {
    return { exists: true, hasAiContent: false, filePath, error: error instanceof Error ? error.message : String(error) };
  }
}
