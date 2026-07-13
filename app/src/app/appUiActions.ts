import type { Dispatch, SetStateAction } from 'react';

type BooleanSetter = Dispatch<SetStateAction<boolean>>;

export interface AppUiActionsDependencies {
  setIsDailyWorkOpen: BooleanSetter;
  setIsInspirationOpen: BooleanSetter;
  setSearchOpen: BooleanSetter;
  setShowOpenOnly: BooleanSetter;
}

export function createAppUiActions({
  setIsDailyWorkOpen,
  setIsInspirationOpen,
  setSearchOpen,
  setShowOpenOnly,
}: AppUiActionsDependencies) {
  return {
    toggleDailyWorkPanel: () => {
      setIsDailyWorkOpen((prev) => !prev);
      setIsInspirationOpen(false);
    },
    toggleInspirationPanel: () => {
      setIsInspirationOpen((prev) => !prev);
      setIsDailyWorkOpen(false);
    },
    closeDailyWorkPanel: () => setIsDailyWorkOpen(false),
    closeInspirationPanel: () => setIsInspirationOpen(false),
    toggleSearchOpen: () => setSearchOpen((prev) => !prev),
    toggleShowOpenOnly: () => setShowOpenOnly((prev) => !prev),
  };
}
