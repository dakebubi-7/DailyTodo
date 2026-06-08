/**
 * 对外导出脱敏（硬规则，不经 AI）：
 * 按 `## ` 标题切段，只放行被显式标记为 work 的段；
 * 含 private/secret 标记或未标记 work 的段一律剔除。
 * 即便后续 AI 失败，也由这里兜死，私人内容绝不进入 exports/。
 */
export function redactForExport(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const sections: string[][] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      if (current.length) sections.push(current);
      current = [line];
    } else {
      current.push(line);
    }
  }
  if (current.length) sections.push(current);

  const kept = sections.filter((section) => {
    const text = section.join('\n');
    const lower = text.toLowerCase();
    // 含 private/secret 标签 → 剔除
    if (/tag:\s*(private|secret)/i.test(text) || lower.includes('#private') || lower.includes('#secret')) {
      return false;
    }
    // 只放行显式标记 work 的段
    return /tag:\s*work/i.test(text) || lower.includes('#work') || /type:\s*work/i.test(text);
  });

  return kept.map((s) => s.join('\n').trim()).filter(Boolean).join('\n\n');
}
