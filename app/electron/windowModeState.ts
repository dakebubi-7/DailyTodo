import type { WindowMode } from '../shared/windowMode';

export type WindowModeState = {
  getMode: () => WindowMode;
  setMode: (mode: WindowMode) => void;
};

export function createWindowModeState(initialMode: WindowMode): WindowModeState {
  let mode = initialMode;

  return {
    getMode: () => mode,
    setMode: (nextMode) => {
      mode = nextMode;
    },
  };
}
