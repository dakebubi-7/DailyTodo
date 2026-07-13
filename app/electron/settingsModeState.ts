export type SettingsModeState = {
  isOpen(): boolean;
  setOpen(nextOpen: boolean): void;
  getRestoreWidth(): number;
  setRestoreWidth(width: number): void;
};

type CreateSettingsModeStateOptions = {
  initialRestoreWidth: number;
};

export function createSettingsModeState({
  initialRestoreWidth,
}: CreateSettingsModeStateOptions): SettingsModeState {
  let open = false;
  let restoreWidth = initialRestoreWidth;

  return {
    isOpen: () => open,
    setOpen: (nextOpen) => {
      open = nextOpen;
    },
    getRestoreWidth: () => restoreWidth,
    setRestoreWidth: (width) => {
      restoreWidth = width;
    },
  };
}
