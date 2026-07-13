export type AiReviewRunnerBridgeTask = {
  id: string;
  text: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
  taskDate?: string;
  isToday: boolean;
  subtasks?: AiReviewRunnerBridgeTask[];
};

export type AiReviewRunner = (
  date: string,
  tasks: AiReviewRunnerBridgeTask[],
  force?: boolean,
) => Promise<unknown>;

export function createAiReviewRunnerBridge() {
  let runner: AiReviewRunner | null = null;

  return {
    setRunner: (nextRunner: AiReviewRunner) => {
      runner = nextRunner;
    },
    runReviewForDate: (date: string, tasks: AiReviewRunnerBridgeTask[], force?: boolean) => {
      if (!runner) {
        throw new Error('AI daily review runner not initialized');
      }

      return runner(date, tasks, force);
    },
  };
}
