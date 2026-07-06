import 'react';

// Electron 无边框窗口的拖拽区域属性（CSS 的 -webkit-app-region）。
// React 的 CSSProperties 默认不含它，这里做模块增强补上；
// framer-motion 的 MotionStyle 派生自 CSSProperties，会一并生效。
declare module 'react' {
  interface CSSProperties {
    WebkitAppRegion?: 'drag' | 'no-drag';
    [key: `--${string}`]: string | number | undefined;
  }
}
