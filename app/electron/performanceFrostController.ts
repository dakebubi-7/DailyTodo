import {
  createInvisibleGlassSettings,
  type InvisibleGlassSettings,
} from '../shared/invisibleGlass';

export type PerformanceFrostControllerOptions = {
  applyGlass(settings: InvisibleGlassSettings): boolean;
  notifyRenderer(active: boolean): void;
  notifyNativeGlassApplied(applied: boolean): void;
};

export type PerformanceFrostController = ReturnType<typeof createPerformanceFrostController>;

export function createPerformanceFrostController({
  applyGlass,
  notifyRenderer: _notifyRenderer,
  notifyNativeGlassApplied,
}: PerformanceFrostControllerOptions) {
  let configuredGlass = createInvisibleGlassSettings({ enabled: false });

  function applyConfiguredGlass(): boolean {
    const nativeGlassApplied = applyGlass(configuredGlass);
    notifyNativeGlassApplied(nativeGlassApplied);
    return nativeGlassApplied;
  }

  return {
    setConfiguredGlass(next: InvisibleGlassSettings): boolean {
      configuredGlass = createInvisibleGlassSettings(next);
      return applyConfiguredGlass();
    },

    reapplyConfiguredGlass(): boolean {
      return applyConfiguredGlass();
    },

    // Keep system Acrylic enabled while Windows moves the HWND. Switching the
    // composition material here freezes the live desktop backdrop.
    noteMove(): void {},

    beginMove(): void {},

    dispose(): void {},
  };
}
