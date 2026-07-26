export type CompletionEvidence = {
  status: 'done' | 'partial' | 'blocked';
  reviewedAt: string;
};

export type CompletionState = {
  completed: boolean;
  completedAt: string | undefined;
};

export function resolveCompletionState(review: CompletionEvidence): CompletionState {
  if (review.status !== 'done') {
    return { completed: false, completedAt: undefined };
  }

  return { completed: true, completedAt: review.reviewedAt };
}
