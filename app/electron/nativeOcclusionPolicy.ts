export type NativeOcclusionPolicyApp = {
  commandLine: {
    appendSwitch: (name: string, value: string) => void;
  };
};

export function disableNativeWindowOcclusion(app: NativeOcclusionPolicyApp): void {
  app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');
}
