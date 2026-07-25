import { describe, expect, it } from 'vitest';
import { applyMarkdownEditorKeyAction } from '../src/hooks/markdownEditorKeyActions';

describe('markdown editor key actions', () => {
  it('applies indent and list continuation edits', () => {
    const indented = applyMarkdownEditorKeyAction('indent', {
      value: 'hello',
      selectionStart: 0,
      selectionEnd: 0,
    });
    expect(indented?.value.startsWith('    ')).toBe(true);

    const continued = applyMarkdownEditorKeyAction('continue-list', {
      value: '- item',
      selectionStart: 6,
      selectionEnd: 6,
    });
    expect(continued?.value).toContain('\n- ');
  });
});
