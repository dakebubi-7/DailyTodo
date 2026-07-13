export type AppQuitState = {
  isQuitting: () => boolean;
  markQuitting: () => void;
};

export function createAppQuitState(): AppQuitState {
  let quitting = false;

  return {
    isQuitting: () => quitting,
    markQuitting: () => {
      quitting = true;
    },
  };
}
