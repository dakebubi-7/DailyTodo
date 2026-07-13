import { useEffect, useState } from 'react';
import type { Task, TaskCompletionReview } from '../../types/task';
import { isTaskCompletionReviewStatus } from '../../../shared/completionReviews';

type UseTaskCompletionDialogFormOptions = {
  task: Task | null;
  onSave: (taskId: string, review: Omit<TaskCompletionReview, 'reviewedAt' | 'id'>) => void;
};

export function useTaskCompletionDialogForm({ task, onSave }: UseTaskCompletionDialogFormOptions) {
  const [status, setStatus] = useState<TaskCompletionReview['status']>('done');
  const [percent, setPercent] = useState(100);
  const [summary, setSummary] = useState('');
  const [unknowns, setUnknowns] = useState('');
  const [nextStep, setNextStep] = useState('');

  useEffect(() => {
    if (!task) return;
    setStatus('done');
    setPercent(100);
    setSummary('');
    setUnknowns('');
    setNextStep('');
  }, [task]);

  const selectStatus = (value: string) => {
    if (!isTaskCompletionReviewStatus(value)) return;
    setStatus(value);
    if (value === 'done') setPercent(100);
    if (value === 'partial' && percent === 100) setPercent(80);
    if (value === 'blocked' && percent === 100) setPercent(50);
  };

  const save = () => {
    if (!task) return;
    onSave(task.id, {
      status,
      percent,
      summary: summary.trim(),
      unknowns: unknowns.trim(),
      nextStep: nextStep.trim(),
    });
  };

  return {
    nextStep,
    percent,
    save,
    selectStatus,
    setNextStep,
    setPercent,
    setSummary,
    setUnknowns,
    status,
    summary,
    unknowns,
  };
}
