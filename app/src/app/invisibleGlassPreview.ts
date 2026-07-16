import {
  resolveInvisibleFrostMix,
  resolveInvisibleSurfaceAlpha,
  resolveInvisibleVeilAlpha,
} from '../../shared/invisibleGlass';

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function readPreviewBlur(root: HTMLElement, fallback = 0): number {
  const attr = root.getAttribute('data-preview-blur');
  if (attr != null && attr !== '') {
    const value = Number(attr);
    if (Number.isFinite(value)) return Math.min(100, Math.max(0, value));
  }
  return fallback;
}

export type InvisibleGlassCssPreview = {
  blurStrength?: number;
  windowOpacity?: number;
  /** Current opacity while previewing blur-only changes. */
  baseOpacity?: number;
};

/**
 * Apply glass preview CSS vars directly on the viewport.
 * Used while dragging sliders so React does not re-render the whole app tree.
 * Invisible blur preview is frost-only (no live CSS backdrop-filter).
 */
function isStyleRoot(el: unknown): el is HTMLElement {
  if (!el || typeof el !== 'object') return false;
  const candidate = el as {
    style?: { setProperty?: unknown };
    setAttribute?: unknown;
    getAttribute?: unknown;
  };
  return typeof candidate.style?.setProperty === 'function'
    && typeof candidate.setAttribute === 'function'
    && typeof candidate.getAttribute === 'function';
}

function previewRoots(preferred: HTMLElement | null): HTMLElement[] {
  const roots: HTMLElement[] = [];
  const push = (el: unknown) => {
    if (isStyleRoot(el) && !roots.includes(el)) roots.push(el);
  };
  push(preferred);
  if (typeof document !== 'undefined') {
    push(document.querySelector('.app-viewport'));
    push(document.querySelector('.app-shell'));
  }
  return roots;
}

export function applyInvisibleGlassCssPreview(
  preview: InvisibleGlassCssPreview,
  root: HTMLElement | null = typeof document !== 'undefined'
    ? document.querySelector('.app-viewport')
    : null,
): void {
  const targets = previewRoots(root);
  if (targets.length === 0) return;

  const primary = targets[0];
  const nextBlur = typeof preview.blurStrength === 'number' && Number.isFinite(preview.blurStrength)
    ? Math.min(100, Math.max(0, preview.blurStrength))
    : readPreviewBlur(primary, 0);

  const nextOpacity = typeof preview.windowOpacity === 'number' && Number.isFinite(preview.windowOpacity)
    ? preview.windowOpacity
    : typeof preview.baseOpacity === 'number' && Number.isFinite(preview.baseOpacity)
      ? preview.baseOpacity
      : undefined;

  for (const target of targets) {
    if (typeof preview.blurStrength === 'number' && Number.isFinite(preview.blurStrength)) {
      target.setAttribute('data-preview-blur', String(nextBlur));
      target.style.setProperty('--blur-strength', '0px');
      target.style.setProperty('--invisible-frost-mix', String(resolveInvisibleFrostMix(nextBlur)));
      target.style.setProperty('--invisible-veil-alpha', String(resolveInvisibleVeilAlpha(nextBlur)));
    }

    if (typeof nextOpacity === 'number') {
      const windowOpacity = clamp01(nextOpacity / 100);
      target.style.setProperty('--window-opacity', String(windowOpacity));
      target.style.setProperty('--panel-opacity', String(windowOpacity));
      target.style.setProperty('--top-opacity', String(windowOpacity));
      target.style.setProperty('--card-opacity', String(windowOpacity));
      target.style.setProperty('--control-opacity', String(windowOpacity));
      target.style.setProperty('--menu-opacity', String(windowOpacity));
      target.style.setProperty('--input-opacity', String(windowOpacity));
      target.style.setProperty('--dialog-opacity', String(windowOpacity));
      target.style.setProperty('--settings-panel-opacity', String(windowOpacity));
      target.style.setProperty('--readable-surface-opacity', String(Math.min(0.98, Math.max(0.62, windowOpacity + 0.16))));
      target.style.setProperty(
        '--glass-saturation',
        String(Math.min(1.4, Math.max(1.08, 1.08 + (1 - windowOpacity) * 0.32))),
      );
    }

    if (typeof nextOpacity === 'number' || typeof preview.blurStrength === 'number') {
      const opacityForSurface = typeof nextOpacity === 'number' ? nextOpacity : 58;
      target.style.setProperty(
        '--invisible-surface-alpha',
        String(resolveInvisibleSurfaceAlpha(opacityForSurface, nextBlur)),
      );
      if (typeof preview.blurStrength !== 'number') {
        target.style.setProperty('--invisible-veil-alpha', String(resolveInvisibleVeilAlpha(nextBlur)));
      }
    }
  }
}
