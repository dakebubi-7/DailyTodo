import { RefObject, useEffect } from 'react';
import { getFloatingScrollbarMetrics, getFloatingScrollbarScrollTop } from './floatingScrollbarMetrics';

interface FloatingScrollbarOptions {
  /** 容器内固定不滚动的头部选择器;滚动条会从其下方开始,不覆盖该区域。 */
  headerSelector?: string;
}

/**
 * 悬浮式可拖动滚动条:
 * - 不占布局空间(绝对定位悬浮在内容右侧),内容保持贴边。
 * - 仅当内容可滚动时出现;滚动/拖动时淡入,空闲后淡出;悬停在条上时常显。
 * - thumb 可拖动以滚动内容。
 */
export function useFloatingScrollbar(
  ref: RefObject<HTMLElement | null>,
  options: FloatingScrollbarOptions = {},
) {
  const { headerSelector } = options;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (getComputedStyle(el).position === 'static') {
      el.style.position = 'relative';
    }

    const header = headerSelector ? el.querySelector(headerSelector) : null;
    let headerHeight = header instanceof HTMLElement ? header.offsetHeight : 0;

    const track = document.createElement('div');
    track.className = 'floating-scrollbar-track';
    const thumb = document.createElement('div');
    thumb.className = 'floating-scrollbar-thumb';
    track.appendChild(thumb);
    el.appendChild(track);

    let hideTimer: number | undefined;
    let layoutFrame: number | undefined;
    let shouldShowOnLayout = false;
    let dragging = false;
    let hovering = false;

    const PAD = 4;

    const metrics = () => getFloatingScrollbarMetrics(el, headerHeight, PAD);

    const layout = () => {
      const { scrollHeight, clientHeight } = el;
      if (scrollHeight - clientHeight <= 2) {
        track.style.display = 'none';
        return false;
      }
      track.style.display = 'block';
      track.style.top = `${el.scrollTop + headerHeight + PAD}px`;
      track.style.height = `${clientHeight - headerHeight - PAD * 2}px`;

      const { scrollable, trackHeight, thumbHeight, scrollTop } = metrics();
      const ratio = scrollable > 0 ? scrollTop / scrollable : 0;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateX(-50%) translateY(${ratio * (trackHeight - thumbHeight)}px)`;
      return true;
    };

    const scheduleLayout = (show = false) => {
      shouldShowOnLayout ||= show;
      if (layoutFrame !== undefined) return;
      layoutFrame = window.requestAnimationFrame(() => {
        layoutFrame = undefined;
        const shouldShow = shouldShowOnLayout;
        shouldShowOnLayout = false;
        if (layout() && shouldShow) track.classList.add('is-visible');
      });
    };

    const show = () => {
      if (!layout()) return;
      track.classList.add('is-visible');
    };

    const scheduleHide = () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (!dragging && !hovering) track.classList.remove('is-visible');
      }, 900);
    };

    const scheduleShow = () => {
      scheduleLayout(true);
    };

    const onScroll = () => {
      scheduleShow();
      scheduleHide();
    };

    let startY = 0;
    let startScrollTop = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const nextScrollTop = getFloatingScrollbarScrollTop(metrics(), startScrollTop, startY, event.clientY);
      if (nextScrollTop === undefined) return;
      el.scrollTop = nextScrollTop;
    };

    const onPointerUp = () => {
      if (!dragging) return;
      dragging = false;
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      scheduleHide();
    };

    const onThumbPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      dragging = true;
      startY = event.clientY;
      startScrollTop = el.scrollTop;
      show();
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    };

    const onTrackEnter = () => {
      hovering = true;
      show();
    };
    const onTrackLeave = () => {
      hovering = false;
      scheduleHide();
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    thumb.addEventListener('pointerdown', onThumbPointerDown);
    track.addEventListener('pointerenter', onTrackEnter);
    track.addEventListener('pointerleave', onTrackLeave);

    const resizeObserver = new ResizeObserver(() => scheduleLayout());
    resizeObserver.observe(el);
    let headerResizeObserver: ResizeObserver | undefined;
    if (header instanceof HTMLElement) {
      headerResizeObserver = new ResizeObserver(() => {
        headerHeight = header.offsetHeight;
        scheduleLayout();
      });
      headerResizeObserver.observe(header);
    }
    const mutationObserver = new MutationObserver(() => scheduleLayout());
    mutationObserver.observe(el, { childList: true, subtree: true });

    layout();

    return () => {
      el.removeEventListener('scroll', onScroll);
      thumb.removeEventListener('pointerdown', onThumbPointerDown);
      track.removeEventListener('pointerenter', onTrackEnter);
      track.removeEventListener('pointerleave', onTrackLeave);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      resizeObserver.disconnect();
      headerResizeObserver?.disconnect();
      mutationObserver.disconnect();
      if (hideTimer) window.clearTimeout(hideTimer);
      if (layoutFrame !== undefined) window.cancelAnimationFrame(layoutFrame);
      track.remove();
    };
  }, [ref, headerSelector]);
}
