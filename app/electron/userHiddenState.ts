export type UserHiddenState = {
  isHidden(): boolean;
  setHidden(nextHidden: boolean): void;
};

export function createUserHiddenState(): UserHiddenState {
  let hidden = false;

  return {
    isHidden: () => hidden,
    setHidden: (nextHidden) => {
      hidden = nextHidden;
    },
  };
}
