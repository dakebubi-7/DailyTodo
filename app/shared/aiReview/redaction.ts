/**
 * 对外导出脱敏（硬规则，不经 AI）：
 * 按 `## ` 标题切段，只放行被显式标记为 work 的段；
 * 含 private/secret 标记或未标记 work 的段一律剔除。
 * 即便后续 AI 失败，也由这里兜死，私人内容绝不进入 exports/。
 */
export function redactForExport(markdown: string): string {
  const keptParts: string[] = [];
  let sectionStart = 0;

  const flushSection = (sectionEnd: number) => {
    const text = markdown.slice(sectionStart, sectionEnd).replace(/\r\n/g, '\n');
    if (!text) return;
    const lower = text.toLowerCase();
    if (/tag:\s*(private|secret)/i.test(text) || lower.includes('#private') || lower.includes('#secret')) {
      return;
    }
    if (/tag:\s*work/i.test(text) || lower.includes('#work') || /type:\s*work/i.test(text)) {
      const part = text.trim();
      if (part) keptParts.push(part);
    }
  };

  let lineStart = 0;
  while (lineStart < markdown.length) {
    const lineEnd = markdown.indexOf('\n', lineStart);
    const nextLineStart = lineEnd === -1 ? markdown.length : lineEnd + 1;
    const line = markdown.slice(lineStart, lineEnd === -1 ? markdown.length : lineEnd).replace(/\r$/, '');
    if (/^##\s+/.test(line) && lineStart > sectionStart) {
      flushSection(lineStart);
      sectionStart = lineStart;
    }
    if (lineEnd === -1) break;
    lineStart = nextLineStart;
  }

  flushSection(markdown.length);
  return keptParts.join('\n\n');
}
