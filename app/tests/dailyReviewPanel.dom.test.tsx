// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DailyReviewPanel } from '../src/components/taskList/DailyReviewPanel';
import { getShellText } from '../src/i18n';

const sourceDate = '2026-07-25';
const currentDate = '2026-07-26';
const localStorageValues = new Map<string, string>();

Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => localStorageValues.get(key) ?? null,
    setItem: (key: string, value: string) => localStorageValues.set(key, value),
    removeItem: (key: string) => localStorageValues.delete(key),
    clear: () => localStorageValues.clear(),
  },
});

function batch(overrides: Record<string, unknown> = {}) {
  return {
    sourceDate,
    createdAt: '2026-07-26T08:00:00.000Z',
    updatedAt: '2026-07-26T08:00:00.000Z',
    items: [{
      taskId: 'login-flow',
      taskText: 'Verify the login flow',
      sourceReviewId: 'review-1',
      sourceReviewRevision: 'review-1|partial|70',
      completed: false,
      wasFocus: true,
      status: 'completed',
      attempts: 1,
      review: {
        id: 'review-1',
        status: 'partial',
        percent: 70,
        summary: 'The test environment startup fails.',
        unknowns: 'The startup error has not been identified.',
        nextStep: 'Diagnose the startup error, then add login-flow tests.',
        reviewedAt: '2026-07-25T18:00:00.000Z',
      },
      suggestion: {
        progressSummary: 'Login-flow work is 70% complete.',
        blocker: 'The test environment startup fails.',
        suggestedAction: 'Fix the startup error first; then add the login-flow tests.',
        shouldCarryForward: true,
        createdAt: '2026-07-26T08:01:00.000Z',
      },
    }],
    ...overrides,
  };
}

function setAiReviewApi({
  enabled,
  dailyBatch,
  generatedBatch = dailyBatch,
}: {
  enabled: boolean;
  dailyBatch?: ReturnType<typeof batch>;
  generatedBatch?: ReturnType<typeof batch>;
}) {
  const getSettings = vi.fn().mockResolvedValue({ enabled });
  const getDailyReviewBatch = vi.fn().mockResolvedValue(dailyBatch);
  const runDailyReviewBatch = vi.fn().mockResolvedValue({ ok: true, batch: generatedBatch });
  Object.assign(window, {
    electronAPI: {
      aiReview: { getSettings, getDailyReviewBatch, runDailyReviewBatch },
    },
  });
  return { getSettings, getDailyReviewBatch, runDailyReviewBatch };
}

afterEach(() => {
  cleanup();
  localStorageValues.clear();
  Reflect.deleteProperty(window, 'electronAPI');
});

describe('DailyReviewPanel', () => {
  it('stays absent and avoids reading or generating a batch while AI-assisted review is disabled', async () => {
    const api = setAiReviewApi({ enabled: false });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(api.getSettings).toHaveBeenCalledTimes(1));
    expect(api.getDailyReviewBatch).not.toHaveBeenCalled();
    expect(api.runDailyReviewBatch).not.toHaveBeenCalled();
    expect(screen.queryByText(/yesterday/i)).toBeNull();
  });

  it('reads the previous business date without generating until the user requests it', async () => {
    const api = setAiReviewApi({ enabled: true, dailyBatch: undefined, generatedBatch: batch() });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(api.getDailyReviewBatch).toHaveBeenCalledWith(sourceDate));
    expect(api.runDailyReviewBatch).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /generate/i }));
    await waitFor(() => expect(api.runDailyReviewBatch).toHaveBeenCalledWith(sourceDate));
  });

  it('stays absent when the persisted batch has no actionable records', async () => {
    const api = setAiReviewApi({ enabled: true, dailyBatch: batch({ items: [] }) });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(api.getDailyReviewBatch).toHaveBeenCalledWith(sourceDate));
    expect(screen.queryByText(/yesterday's review/i)).toBeNull();
    expect(api.runDailyReviewBatch).not.toHaveBeenCalled();
  });

  it('keeps a viewed review prompt hidden after remounting on the same day', async () => {
    const api = setAiReviewApi({ enabled: true, dailyBatch: batch() });
    const first = render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    first.unmount();

    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(api.getDailyReviewBatch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('button', { name: /view/i })).toBeNull());
  });

  it('keeps a dismissed review prompt hidden after remounting on the same day', async () => {
    const api = setAiReviewApi({ enabled: true, dailyBatch: batch() });
    const first = render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /dismiss/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    first.unmount();

    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(api.getDailyReviewBatch).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(screen.queryByRole('button', { name: /view/i })).toBeNull());
  });

  it('shows the human record separately from the AI action and only adopts after confirmation', async () => {
    const onAdoptDailyReviewSuggestion = vi.fn();
    setAiReviewApi({ enabled: true, dailyBatch: batch() });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={onAdoptDailyReviewSuggestion}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /view/i }));

    expect(screen.getByText('Your record')).toBeTruthy();
    expect(screen.getByText(/70% complete.*test environment startup fails/i)).toBeTruthy();
    expect(screen.getByText('AI suggested action')).toBeTruthy();
    expect(screen.getByText(/fix the startup error first/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /adopt as today focus/i }));
    const action = screen.getByLabelText(/focus action/i) as HTMLInputElement;
    expect(action.value).toBe('Fix the startup error first; then add the login-flow tests.');
    fireEvent.change(action, { target: { value: 'Diagnose startup, then write login tests.' } });
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }));
    expect(onAdoptDailyReviewSuggestion).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /adopt as today focus/i }));
    fireEvent.change(screen.getByLabelText(/focus action/i), {
      target: { value: 'Diagnose startup, then write login tests.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^confirm$/i }));
    expect(onAdoptDailyReviewSuggestion).toHaveBeenCalledWith({
      taskId: 'login-flow',
      sourceDate,
      sourceReviewId: 'review-1',
      sourceReviewRevision: 'review-1|partial|70',
      suggestedAction: 'Fix the startup error first; then add the login-flow tests.',
      action: 'Diagnose startup, then write login tests.',
    });
  });

  it('closes the detail panel when Escape is pressed', async () => {
    setAiReviewApi({ enabled: true, dailyBatch: batch() });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /view/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /view/i }));
    expect(screen.getByRole('dialog', { name: /yesterday's review/i })).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog', { name: /yesterday's review/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /view/i })).toBeNull();
  });

  it('offers an explicit retry for failed items only after the user clicks it', async () => {
    const failedBatch = batch({
      items: [{
        ...batch().items[0],
        status: 'failed',
        suggestion: undefined,
        error: 'AI review needs available balance.',
      }],
    });
    const api = setAiReviewApi({ enabled: true, dailyBatch: failedBatch, generatedBatch: batch() });
    render(
      <DailyReviewPanel
        currentDate={currentDate}
        text={getShellText('en-US').app}
        onAdoptDailyReviewSuggestion={vi.fn()}
      />,
    );

    await waitFor(() => expect(screen.getByRole('button', { name: /retry/i })).toBeTruthy());
    expect(api.runDailyReviewBatch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    await waitFor(() => expect(api.runDailyReviewBatch).toHaveBeenCalledWith(sourceDate));
  });
});
