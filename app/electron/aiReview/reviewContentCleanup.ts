const FINAL_START = 'DAILYTODO_FINAL_START';
const FINAL_END = 'DAILYTODO_FINAL_END';

function skipLeadingBlankLines(content: string, start: number) {
  let cursor = start;
  while (cursor < content.length) {
    const lineEnd = content.indexOf('\n', cursor);
    const line = content.slice(cursor, lineEnd === -1 ? content.length : lineEnd);
    if (line.trim()) return cursor;
    cursor = lineEnd === -1 ? content.length : lineEnd + 1;
  }
  return cursor;
}

function extractFinalBlock(content: string) {
  let started = false;
  const finalLines: string[] = [];
  let lineStart = 0;

  while (lineStart <= content.length) {
    const lineEnd = content.indexOf('\n', lineStart);
    const line = content.slice(lineStart, lineEnd === -1 ? content.length : lineEnd).replace(/\r$/, '');
    if (!started) {
      if (line.trim() === FINAL_START) started = true;
    } else if (line.trim() === FINAL_END) {
      break;
    } else {
      finalLines.push(line);
    }
    if (lineEnd === -1) break;
    lineStart = lineEnd + 1;
  }
  return started ? finalLines.join('\n').trim() : null;
}

function isMetaPrefixLine(line: string) {
  const text = line.trim();
  return /^(?:\u8f6f\u4ef6\u63d0\u793a|\u63d0\u793a\u8bcd|\u7528\u6237\u8981\u6c42|\u8981\u6c42|\u4efb\u52a1|\u65e5\u671f|\u786e\u5b9a\u6027\u7edf\u8ba1|\u4eca\u5929\u7684\u65e5\u8bb0\u539f\u6587|\u4ee5\u4e0b\u662f|\u4e0b\u9762\u662f)(?:[:\uff1a]|\b)/i.test(text)
    || /^(?:\u6211\u5c06|\u6211\u4f1a|\u8ba9\u6211)(?:[:\uff1a]|\b)/i.test(text)
    || /^(?:let me|the user wants|the user asked|the user is asking|i will|i need to|i should|we need to)(?:[:\uff1a]|\b)/i.test(text);
}

export function cleanReviewContent(content: string) {
  const finalBlock = extractFinalBlock(content);
  if (finalBlock !== null) return finalBlock;

  const normalized = content
    .replace(/^```(?:markdown)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .replace(/\r\n/g, '\n');
  let start = skipLeadingBlankLines(normalized, 0);
  while (start < normalized.length) {
    const lineEnd = normalized.indexOf('\n', start);
    const line = normalized.slice(start, lineEnd === -1 ? normalized.length : lineEnd);
    if (!isMetaPrefixLine(line)) break;
    start = skipLeadingBlankLines(normalized, lineEnd === -1 ? normalized.length : lineEnd + 1);
  }
  return normalized.slice(start).trim();
}

export function stripDuplicateReviewHeading(content: string, outerHeading: string, fallbackTitle: string, date: string) {
  const normalized = content.replace(/\r\n/g, '\n');
  let start = skipLeadingBlankLines(normalized, 0);
  const firstLineEnd = normalized.indexOf('\n', start);
  const first = normalized.slice(start, firstLineEnd === -1 ? normalized.length : firstLineEnd).trim();
  if (!/^#{1,6}\s+/.test(first)) return normalized.slice(start).trim();

  const generatedHeading = first.replace(/^#{1,6}\s+/, '').trim();
  const expectedHeading = outerHeading.trim() || fallbackTitle.trim();
  if (!expectedHeading) return normalized.slice(start).trim();
  if (generatedHeading !== expectedHeading && generatedHeading !== `${date} ${expectedHeading}`) {
    return normalized.slice(start).trim();
  }

  start = skipLeadingBlankLines(normalized, firstLineEnd === -1 ? normalized.length : firstLineEnd + 1);
  return normalized.slice(start).trim();
}
