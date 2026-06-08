/** 模板「选文件」支持的扩展名（小写，含点）。.docx 走注入的提取器，.md/.txt 直接 utf-8 解码。 */
export const TEMPLATE_FILE_EXTENSIONS = ['md', 'txt', 'docx'] as const;

export type ParseTemplateResult = { ok: true; text: string } | { ok: false; error: string };

/** 取小写扩展名（不含点）；无扩展名返回空串。 */
export function fileExt(fileName: string): string {
  const i = fileName.lastIndexOf('.');
  return i >= 0 ? fileName.slice(i + 1).toLowerCase() : '';
}

/**
 * 把文件内容解析成纯文本模板。
 * - .md / .txt：utf-8 解码。
 * - .docx：调用注入的 extractDocx（主进程用 mammoth），保持本模块零依赖、可单测。
 * - 其它扩展名或空内容：返回错误。
 */
export async function parseTemplateFile(
  buffer: Buffer,
  fileName: string,
  extractDocx?: (buf: Buffer) => Promise<string>,
): Promise<ParseTemplateResult> {
  const ext = fileExt(fileName);

  if (ext === 'md' || ext === 'txt') {
    const text = buffer.toString('utf-8').trim();
    return text ? { ok: true, text } : { ok: false, error: '文件内容为空' };
  }

  if (ext === 'docx') {
    if (!extractDocx) return { ok: false, error: '缺少 .docx 解析器' };
    try {
      const text = (await extractDocx(buffer)).trim();
      return text
        ? { ok: true, text }
        : { ok: false, error: '未能从 .docx 提取到文字（可能是空文档或纯图片扫描件）' };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  return { ok: false, error: `不支持的文件类型：.${ext || '未知'}（仅支持 .md / .txt / .docx）` };
}
