export interface FloatingScrollbarScrollState {
  scrollHeight: number;
  clientHeight: number;
  scrollTop: number;
}

export interface FloatingScrollbarMetrics {
  scrollable: number;
  trackHeight: number;
  thumbHeight: number;
  scrollTop: number;
}

export function getFloatingScrollbarMetrics(
  { scrollHeight, clientHeight, scrollTop }: FloatingScrollbarScrollState,
  headerHeight: number,
  padding: number,
): FloatingScrollbarMetrics {
  const scrollable = scrollHeight - clientHeight;
  const trackHeight = clientHeight - headerHeight - padding * 2;
  const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * trackHeight);
  return { scrollable, trackHeight, thumbHeight, scrollTop };
}

export function getFloatingScrollbarScrollTop(
  { scrollable, trackHeight, thumbHeight }: Pick<FloatingScrollbarMetrics, 'scrollable' | 'trackHeight' | 'thumbHeight'>,
  startScrollTop: number,
  startY: number,
  currentY: number,
): number | undefined {
  const usable = trackHeight - thumbHeight;
  if (usable <= 0) return undefined;
  return startScrollTop + ((currentY - startY) / usable) * scrollable;
}
