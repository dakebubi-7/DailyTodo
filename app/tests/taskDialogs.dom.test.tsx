// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { TaskCompletionDialog } from '../src/components/TaskCompletionDialog';
import { TaskReviewDialog } from '../src/components/TaskReviewDialog';
import { getTaskDialogIsolation } from '../src/components/AppOverlayStack';
import type { Task } from '../src/types/task';

const task: Task = {
  id: 'task-1',
  text: 'Finish dialog accessibility checks',
  completed: false,
  priority: 'medium',
  createdAt: '2026-07-14T08:00:00.000Z',
  taskDate: '2026-07-14',
  isToday: true,
};

const reviewedTask: Task = {
  ...task,
  completionReviews: [{
    id: 'review-1',
    status: 'done',
    percent: 100,
    summary: 'Complete',
    unknowns: '',
    nextStep: '',
    reviewedAt: '2026-07-14T08:00:00.000Z',
  }],
};

afterEach(cleanup);

describe('task dialog DOM integration', () => {
  it('isolates only the normal application surface while a task dialog is open', () => {
    expect(getTaskDialogIsolation({ completionTask: task, reviewTask: null })).toEqual({
      inert: true,
      ariaHidden: true,
    });
    expect(getTaskDialogIsolation({ completionTask: null, reviewTask: reviewedTask })).toEqual({
      inert: true,
      ariaHidden: true,
    });
    expect(getTaskDialogIsolation({ completionTask: null, reviewTask: null })).toEqual({
      inert: false,
      ariaHidden: false,
    });
  });

  it('renders the completion dialog as a labelled modal and focuses its first enabled control', async () => {
    render(
      <TaskCompletionDialog
        task={task}
        onCancel={vi.fn()}
        onSave={vi.fn()}
        onCompleteWithoutReview={vi.fn()}
      />,
    );

    const dialog = await screen.findByRole('dialog');

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('task-completion-dialog-title');
    expect(document.getElementById('task-completion-dialog-title')).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(dialog.querySelector('select')));
  });

  it('wraps completion-dialog Tab boundaries, closes on Escape, and restores the trigger on unmount', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const onCancel = vi.fn();
    const view = render(
      <TaskCompletionDialog
        task={task}
        onCancel={onCancel}
        onSave={vi.fn()}
        onCompleteWithoutReview={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea'));
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];

    lastControl.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(firstControl);

    firstControl.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastControl);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledOnce();

    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('renders the review dialog as a labelled modal and preserves its keyboard focus lifecycle', async () => {
    const trigger = document.createElement('button');
    document.body.append(trigger);
    trigger.focus();
    const onClose = vi.fn();
    const view = render(
      <TaskReviewDialog
        task={reviewedTask}
        onClose={onClose}
        onAddRecord={vi.fn()}
        onDeleteRecord={vi.fn()}
      />,
    );
    const dialog = await screen.findByRole('dialog');
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button, input, select, textarea'));
    const firstControl = controls[0];
    const lastControl = controls[controls.length - 1];

    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toBe('task-review-dialog-title');
    expect(document.getElementById('task-review-dialog-title')).not.toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(firstControl));

    lastControl.focus();
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(firstControl);

    firstControl.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(lastControl);

    fireEvent.keyDown(dialog, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledOnce();

    view.unmount();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
