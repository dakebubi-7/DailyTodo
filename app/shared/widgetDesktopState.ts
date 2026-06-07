// 桌面组件「钉在桌面」两态模型（不跟踪前台，故不闪烁）：
// - idle：默认。owner=Progman 豁免 Win+D + 沉到最底，贴在桌面上、被 app 盖住。
// - active：用户点了组件自己。临时浮到最上，方便打字 / 点任务；失焦即回 idle。
// 纯函数，便于不启动 Electron 直接断言。
export type WidgetPinState = 'idle' | 'active';
export type WidgetPinEvent = 'enter' | 'widget-focus' | 'widget-blur';

export function nextWidgetDesktopState(
  current: WidgetPinState,
  event: WidgetPinEvent,
): WidgetPinState {
  switch (event) {
    case 'widget-focus':
      return 'active';
    case 'enter':
    case 'widget-blur':
      return 'idle';
    default:
      return current;
  }
}
