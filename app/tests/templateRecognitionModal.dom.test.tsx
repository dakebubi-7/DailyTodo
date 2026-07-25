// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TemplateRecognitionModal } from '../src/components/TemplateRecognitionModal';

afterEach(cleanup);

describe('TemplateRecognitionModal', () => {
  it('applies only the recognized blocks left after removing a draft block', () => {
    const onApply = vi.fn();

    render(
      <TemplateRecognitionModal
        existingBlocks={[]}
        onApply={onApply}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '## First\nContent\n## Second\nContent' },
    });
    fireEvent.click(screen.getByRole('button', { name: '开始识别' }));
    const removeFirst = screen.getByRole('button', { name: '删除 First' });
    expect(removeFirst.querySelector('svg')).toBeTruthy();
    expect(removeFirst.textContent?.trim()).toBe('');
    fireEvent.click(removeFirst);
    fireEvent.click(screen.getByRole('button', { name: '替换自定义区块' }));

    expect(onApply).toHaveBeenCalledWith(
      [expect.objectContaining({ name: 'Second' })],
      'replace',
    );
  });

  it('disables applying when every recognized draft block is removed', () => {
    render(
      <TemplateRecognitionModal
        existingBlocks={[]}
        onApply={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '## First\nContent\n## Second\nContent' },
    });
    fireEvent.click(screen.getByRole('button', { name: '开始识别' }));
    fireEvent.click(screen.getByRole('button', { name: /First/ }));
    fireEvent.click(screen.getByRole('button', { name: /Second/ }));

    expect(screen.getByText('没有可应用的识别区块。你可以重新识别。')).toBeTruthy();

    const applyButtons = screen.getAllByRole('button', { name: /自定义区块/ });
    expect(applyButtons).toHaveLength(2);
    expect(applyButtons.every((button) => button.disabled)).toBe(true);
    expect(screen.getByRole('button', { name: '重新识别' }).disabled).toBe(false);
  });
});
