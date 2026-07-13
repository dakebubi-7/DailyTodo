import { useEffect, useRef } from 'react';

interface CompletionCelebrationInput {
  completedCount: number;
  totalCount: number;
}

export function useCompletionCelebration({
  completedCount,
  totalCount,
}: CompletionCelebrationInput) {
  const prevCompletedRef = useRef(completedCount);

  useEffect(() => {
    if (completedCount > 0 && completedCount === totalCount && prevCompletedRef.current < totalCount) {
      void import('canvas-confetti').then(({ default: confetti }) => {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.62 },
          colors: ['#2D4A3E', '#C9A84C', '#5B9A8B'],
        });
      });
    }
    prevCompletedRef.current = completedCount;
  }, [completedCount, totalCount]);
}
