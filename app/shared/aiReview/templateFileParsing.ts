export type ParseTemplateResult = { ok: true; text: string } | { ok: false; error: string };

/** Parses template file contents after the caller has selected a supported file type. */
export async function parseTemplateFile(
  buffer: Buffer,
  fileName: string,
  extractDocx?: (buf: Buffer) => Promise<string>,
): Promise<ParseTemplateResult> {
  const ext = fileName.lastIndexOf('.') >= 0 ? fileName.slice(fileName.lastIndexOf('.') + 1).toLowerCase() : '';

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
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  return { ok: false, error: `不支持的文件类型：.${ext || '未知'}（仅支持 .md / .txt / .docx）` };
}
