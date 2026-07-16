import {
  createInvisibleGlassSettings,
  type InvisibleGlassSettings,
} from '../shared/invisibleGlass';

export type PerformanceFrostControllerOptions = {
  applyGlass(settings: InvisibleGlassSettings): void;
  notifyRenderer(active: boolean): void;
};

export type PerformanceFrostController = ReturnType<typeof createPerformanceFrostController>;

export function createPerformanceFrostController({
  applyGlass,
  notifyRenderer: _notifyRenderer,
}: PerformanceFrostControllerOptions) {
  let configuredGlass = createInvisibleGlassSettings({ enabled: false });

  return {
    setConfiguredGlass(next: InvisibleGlassSettings): void {
      configuredGlass = createInvisibleGlassSettings(next);
      applyGlass(configuredGlass);
    },

    reapplyConfiguredGlass(): void {
      applyGlass(configuredGlass);
    },

    // Keep system Acrylic enabled while Windows moves the HWND. Switching the
    // composition material here freezes the live desktop backdrop.
    noteMove(): void {},

    beginMove(): void {},

    dispose(): void {},
  };
}
