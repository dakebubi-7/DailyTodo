export function shouldOpenDailyCommandMenu(value: string, cursor: number) {
  // 光标前一个字符是斜杠(兼容全角 ／)即触发,与前文是否有手动输入无关。
  const prev = value[cursor - 1];
  return prev === '/' || prev === '／';
}

export function insertDailyCommandMarkdown(value: string, markdown: string, selectionStart: number, selectionEnd = selectionStart) {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionEnd);
  // 去掉光标前刚输入的触发斜杠(半角或全角)。
  const slashBefore = /[\/／]$/.test(before) ? before.slice(0, -1) : before;
  const next = `${slashBefore}${markdown}${after}`;
  const cursor = `${slashBefore}${markdown}`.length;
  return { value: next, cursor };
}
