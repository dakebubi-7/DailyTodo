import fs from 'fs';
import path from 'path';
import type { ObsidianSyncTask } from './obsidianSyncValidation';

type WriteObsidianSyncBlogDraftOutputOptions = {
  localBlogDraftDir: string;
  date: string;
  tasks: ObsidianSyncTask[];
  obsidianContent: string;
  buildBlogDraft(date: string, tasks: ObsidianSyncTask[], obsidianContent?: string): string;
};

export function writeObsidianSyncBlogDraftOutput({
  localBlogDraftDir,
  date,
  tasks,
  obsidianContent,
  buildBlogDraft,
}: WriteObsidianSyncBlogDraftOutputOptions): void {
  try {
    if (fs.existsSync(localBlogDraftDir) && fs.statSync(localBlogDraftDir).isDirectory()) {
      const blogDraftPath = path.join(localBlogDraftDir, `daily-memo-${date}.md`);
      const blogDraftExists = fs.existsSync(blogDraftPath);
      if (!blogDraftExists || fs.statSync(blogDraftPath).isFile()) {
        const existingBlogDraft = blogDraftExists ? fs.readFileSync(blogDraftPath, 'utf-8') : null;
        const nextBlogDraft = buildBlogDraft(date, tasks, obsidianContent);
        if (nextBlogDraft !== existingBlogDraft) {
          fs.writeFileSync(blogDraftPath, nextBlogDraft, 'utf-8');
        }
      }
    }
  } catch {
    // Optional blog draft output should never interrupt the primary Obsidian sync.
  }
}
