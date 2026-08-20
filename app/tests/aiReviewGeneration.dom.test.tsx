// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getShellText } from '../src/i18n';
import { useAiReviewGeneration } from '../src/components/settings/useAiReviewGeneration';
import type { Task } from '../src/types/task';

const text = getShellText('en-US').settings;
const tasks: Task[] = [];

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  Object.defineProperty(window, 'electronAPI', { value: undefined, configurable: true });
});

function DailyRegenerationHarness() {
  const generation = useAiReviewGeneration({
    isOpen: true,
    zh: false,
    text,
    selectedDate: '2026-08-19',
    tasks,
    onUpdateTask: () => {},
  });

  return (
    <>
      <button type="button" onClick={() => generation.runGeneration('daily')}>Regenerate</button>
      {generation.pendingDailyRegeneration && (
        <div role="dialog" aria-label="Confirm daily regeneration">
          <button type="button" onClick={generation.confirmDailyRegeneration}>Confirm</button>
          <button type="button" onClick={generation.cancelDailyRegeneration}>Cancel</button>
        </div>
      )}
      <output aria-label="generation status">{generation.generationStatus}</output>
      <output aria-label="generation progress">{generation.currentProgress?.status ?? ''}</output>
    </>
  );
}

describe('AI daily regeneration confirmation', () => {
  it('uses application confirmation and forces regeneration after the user confirms', async () => {
    const inspectDaily = vi.fn(async () => ({ exists: true, hasAiContent: true, filePath: 'daily.md' }));
    const runForDate = vi.fn(async () => ({ ok: true, filePath: 'daily.md' }));
    Object.defineProperty(window, 'electronAPI', {
      value: { aiReview: { inspectDaily, runForDate } },
      configurable: true,
    });
    const nativeConfirm = vi.spyOn(window, 'confirm');

    render(<DailyRegenerationHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));

    expect(await screen.findByRole('dialog', { name: 'Confirm daily regeneration' })).not.toBeNull();
    expect(nativeConfirm).not.toHaveBeenCalled();
    expect(runForDate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(runForDate).toHaveBeenCalledWith('2026-08-19', tasks, true));
    expect(screen.getByLabelText('generation status').textContent).toContain(text.aiReview.genSuccess);
    expect(screen.getByLabelText('generation progress').textContent).toBe('completed');
  });

  it('treats cancellation as a neutral outcome instead of a failed generation', async () => {
    const inspectDaily = vi.fn(async () => ({ exists: true, hasAiContent: true, filePath: 'daily.md' }));
    const runForDate = vi.fn(async () => ({ ok: true, filePath: 'daily.md' }));
    Object.defineProperty(window, 'electronAPI', {
      value: { aiReview: { inspectDaily, runForDate } },
      configurable: true,
    });

    render(<DailyRegenerationHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Regenerate' }));
    await screen.findByRole('dialog', { name: 'Confirm daily regeneration' });

    act(() => screen.getByRole('button', { name: 'Cancel' }).click());

    expect(runForDate).not.toHaveBeenCalled();
    expect(screen.getByLabelText('generation status').textContent).toBe('Daily regeneration canceled');
    expect(screen.getByLabelText('generation progress').textContent).toBe('');
  });
});
