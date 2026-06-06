import { RefObject, useEffect } from 'react';

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

    const headerOffset = () => {
      if (!headerSelector) return 0;
      const header = el.querySelector(headerSelector) as HTMLElement | null;
      return header ? header.offsetHeight : 0;
    };

    const track = document.createElement('div');
    track.className = 'floating-scrollbar-track';
    const thumb = document.createElement('div');
    thumb.className = 'floating-scrollbar-thumb';
    track.appendChild(thumb);
    el.appendChild(track);

    let hideTimer: number | undefined;
    let dragging = false;
    let hovering = false;

    const PAD = 4;

    const metrics = () => {
      const { scrollHeight, clientHeight, scrollTop } = el;
      const scrollable = scrollHeight - clientHeight;
      const trackHeight = clientHeight - headerOffset() - PAD * 2;
      const thumbHeight = Math.max(28, (clientHeight / scrollHeight) * trackHeight);
      return { scrollable, trackHeight, thumbHeight, scrollTop };
    };

    const layout = () => {
      const { scrollHeight, clientHeight } = el;
      if (scrollHeight - clientHeight <= 2) {
        track.style.display = 'none';
        return false;
      }
      track.style.display = 'block';
      const offset = headerOffset();
      track.style.top = `${el.scrollTop + offset + PAD}px`;
      track.style.height = `${clientHeight - offset - PAD * 2}px`;

      const { scrollable, trackHeight, thumbHeight, scrollTop } = metrics();
      const ratio = scrollable > 0 ? scrollTop / scrollable : 0;
      thumb.style.height = `${thumbHeight}px`;
      thumb.style.transform = `translateX(-50%) translateY(${ratio * (trackHeight - thumbHeight)}px)`;
      return true;
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

    const onScroll = () => {
      show();
      scheduleHide();
    };

    let startY = 0;
    let startScrollTop = 0;

    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      const { scrollable, trackHeight, thumbHeight } = metrics();
      const usable = trackHeight - thumbHeight;
      if (usable <= 0) return;
      const deltaPx = event.clientY - startY;
      el.scrollTop = startScrollTop + (deltaPx / usable) * scrollable;
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

    const resizeObserver = new ResizeObserver(() => layout());
    resizeObserver.observe(el);
    const mutationObserver = new MutationObserver(() => layout());
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
      mutationObserver.disconnect();
      if (hideTimer) window.clearTimeout(hideTimer);
      track.remove();
    };
  }, [ref, headerSelector]);
}
