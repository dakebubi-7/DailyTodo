import fs from 'node:fs';
import path from 'node:path';
import { atomicReplace, readWithStamp } from './atomicWrite';

export type ReviewReportKind = 'weekly' | 'monthly';

export interface ReportResult {
  ok: boolean;
  filePath?: string;
  error?: string;
  /** LLM 因输出上限被截断；文件仍写入，但提示用户调高 max_tokens。 */
  truncated?: boolean;
}

const DRAFT_NOTE = '> 🤖 AI 草稿，请复核（对外稿需自行复核脱敏）';

/**
 * 组装最终写入内容：
 * - 模型输出已自带 frontmatter（`---` 开头）：保留模型的 frontmatter，在其后插入草稿提示，
 *   不再叠加 app 的 frontmatter（避免双重 frontmatter 破坏 Obsidian 解析）。
 * - 否则：用 app 的 frontmatter + 草稿提示 + 正文（兼容不带 frontmatter 的旧/自定义模板）。
 */
export function composeReportContent(appFrontmatter: string, body: string): string {
  const trimmed = body.trim();
  const fm = trimmed.match(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/);
  if (fm) {
    const head = fm[0].trimEnd();
    const rest = trimmed.slice(fm[0].length).replace(/^\s+/, '');
    return `${head}\n\n${DRAFT_NOTE}\n\n${rest}\n`;
  }
  return `${appFrontmatter}\n\n${DRAFT_NOTE}\n\n${trimmed}\n`;
}

/** 通用写入：原子写 + AI 草稿标注。truncated 透传给调用方，文件照常写。 */
export async function writeReport(
  filePath: string,
  frontmatter: string,
  body: string,
  truncated?: boolean,
): Promise<ReportResult> {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const snap = readWithStamp(filePath);
    const content = composeReportContent(frontmatter, body);
    const write = atomicReplace(filePath, content, snap.stamp);
    if (!write.ok) return { ok: false, error: write.error };
    return truncated ? { ok: true, filePath, truncated: true } : { ok: true, filePath };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export function resolveReportFilePath({
  vaultPath,
  relativeDir,
  relativeFilePath,
  defaultDir,
  fileName,
}: {
  vaultPath: string;
  relativeDir?: string;
  relativeFilePath?: string;
  defaultDir: string;
  fileName: string;
}): string {
  const outputPath = relativeFilePath || path.join(relativeDir || defaultDir, fileName);
  if (path.isAbsolute(outputPath)) throw new Error(`Report output path must be relative to the vault: ${outputPath}`);
  const vaultRoot = path.resolve(vaultPath);
  const resolved = path.resolve(vaultRoot, outputPath);
  const relative = path.relative(vaultRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Report output path escapes the selected vault: ${outputPath}`);
  }
  return resolved;
}

export function buildPersonalReportFrontmatter(kind: ReviewReportKind, periodKey: string): string {
  const title = kind === 'weekly' ? `个人周报 ${periodKey}` : `个人月报 ${periodKey}`;
  const periodField = kind === 'weekly' ? `week: "${periodKey}"` : `month: "${periodKey}"`;
  const tag = kind === 'weekly' ? 'weekly-review' : 'monthly-review';
  return `---\ntitle: "${title}"\n${periodField}\ntags: [${tag}]\n---`;
}

export function buildExternalReportFrontmatter(kind: ReviewReportKind, periodKey: string): string {
  return `---\ntitle: "对外${kind === 'weekly' ? '周' : '月'}报 ${periodKey}"\nperiod: "${periodKey}"\ntags: [external-report, needs-review]\n---`;
}
