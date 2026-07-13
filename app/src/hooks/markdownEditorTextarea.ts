const MIRROR_STYLE_PROPS = [
  'paddingTop',
  'paddingRight',
  'paddingBottom',
  'paddingLeft',
  'fontFamily',
  'fontSize',
  'fontWeight',
  'fontStyle',
  'lineHeight',
  'letterSpacing',
  'textTransform',
  'wordSpacing',
  'tabSize',
] as const;

/**
 * 精确测量光标所在行相对 textarea 内容顶部的像素位置。
 * 镜像节点复刻 textarea 的字体、宽度和换行规则，以支持软换行。
 */
function measureCaret(textarea: HTMLTextAreaElement, caret: number): { top: number; lineHeight: number } {
  const style = window.getComputedStyle(textarea);
  const mirror = document.createElement('div');
  MIRROR_STYLE_PROPS.forEach((prop) => {
    mirror.style[prop] = style[prop];
  });
  mirror.style.position = 'absolute';
  mirror.style.visibility = 'hidden';
  mirror.style.whiteSpace = 'pre-wrap';
  mirror.style.overflowWrap = 'break-word';
  mirror.style.wordBreak = style.wordBreak;
  mirror.style.width = `${textarea.clientWidth}px`;
  mirror.style.boxSizing = 'border-box';
  mirror.style.top = '0';
  mirror.style.left = '-9999px';

  mirror.textContent = textarea.value.slice(0, caret);
  const marker = document.createElement('span');
  marker.textContent = textarea.value.slice(caret) || '.';
  mirror.appendChild(marker);

  document.body.appendChild(mirror);
  const top = marker.offsetTop;
  let lineHeight = parseFloat(style.lineHeight);
  if (!Number.isFinite(lineHeight)) {
    const fontSize = parseFloat(style.fontSize);
    lineHeight = Number.isFinite(fontSize) ? fontSize * 1.4 : 18;
  }
  document.body.removeChild(mirror);

  return { top, lineHeight };
}

/** 把光标所在行滚进 textarea 可视区。 */
export function scrollCaretIntoView(textarea: HTMLTextAreaElement, caret: number) {
  const { top, lineHeight } = measureCaret(textarea, caret);

  if (top < textarea.scrollTop) {
    textarea.scrollTop = top;
  } else if (top + lineHeight > textarea.scrollTop + textarea.clientHeight) {
    textarea.scrollTop = top + lineHeight - textarea.clientHeight;
  }
}

/** 在 React 受控更新完成后恢复选区，并确保光标可见。 */
export function restoreTextareaSelection(
  textarea: HTMLTextAreaElement,
  selection: { start: number; end: number },
) {
  textarea.focus();
  textarea.setSelectionRange(selection.start, selection.end);
  scrollCaretIntoView(textarea, selection.start);
}
