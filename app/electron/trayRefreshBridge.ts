export type TrayRefreshBridge = {
  refreshTrayMenu: () => void;
  setRefreshTrayMenu: (refreshTrayMenu: () => void) => void;
};

export function createTrayRefreshBridge(): TrayRefreshBridge {
  let refreshTrayMenuImpl: (() => void) | null = null;

  return {
    refreshTrayMenu: () => {
      refreshTrayMenuImpl?.();
    },
    setRefreshTrayMenu: (refreshTrayMenu) => {
      refreshTrayMenuImpl = refreshTrayMenu;
    },
  };
}
