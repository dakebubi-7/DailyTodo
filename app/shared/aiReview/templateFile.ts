/** 模板「选文件」支持的扩展名（小写，含点）。.docx 走注入的提取器，.md/.txt 直接 utf-8 解码。 */
export const TEMPLATE_FILE_EXTENSIONS = ['md', 'txt', 'docx'] as const;

export { parseTemplateFile } from './templateFileParsing';
export type { ParseTemplateResult } from './templateFileParsing';

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
