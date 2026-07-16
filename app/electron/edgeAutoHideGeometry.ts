export type EdgeAutoHideEdge = 'left' | 'right' | 'top';

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Point = {
  x: number;
  y: number;
};

// Thickness of the independent liquid-glass handle only. The main window fully leaves the screen.
export const EDGE_AUTO_HIDE_REVEAL_PX = 8;
// Side handles stay short and centered so they do not dominate the screen edge.
export const EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX = 96;
// Top only snaps when the window is truly placed at the top.
export const EDGE_AUTO_HIDE_TOP_SNAP_PX = 12;
// Sides hide only after the user pushes the window past the edge.
// A flush side placement stays visible and never auto-hides.
export const EDGE_AUTO_HIDE_SIDE_PUSH_IN_PX = 24;

export function getEdgeAttachment(bounds: Rect, workArea: Rect): EdgeAutoHideEdge | null {
  // Signed gap: 0 = flush, positive = inset into the desktop, negative = already past the edge.
  const leftGap = bounds.x - workArea.x;
  const rightGap = getRight(workArea) - getRight(bounds);
  const topGap = bounds.y - workArea.y;

  // Top: normal "placed at top" attachment.
  if (Math.abs(topGap) <= EDGE_AUTO_HIDE_TOP_SNAP_PX) {
    return 'top';
  }

  // Sides: only attach/hide when the user has dragged past the edge.
  // Flush or merely nearby side placement must remain free.
  if (leftGap <= -EDGE_AUTO_HIDE_SIDE_PUSH_IN_PX) {
    return 'left';
  }
  if (rightGap <= -EDGE_AUTO_HIDE_SIDE_PUSH_IN_PX) {
    return 'right';
  }

  return null;
}

export function getExpandedBounds(edge: EdgeAutoHideEdge, bounds: Rect, workArea: Rect): Rect {
  switch (edge) {
    case 'left':
      return { ...bounds, x: workArea.x };
    case 'right':
      return { ...bounds, x: getRight(workArea) - bounds.width };
    case 'top':
      return { ...bounds, y: workArea.y };
  }
}

export function getRetractedBounds(edge: EdgeAutoHideEdge, bounds: Rect, workArea: Rect): Rect {
  // Fully park the main window offscreen. Only the independent glass handle remains visible.
  switch (edge) {
    case 'left':
      return { ...bounds, x: workArea.x - bounds.width };
    case 'right':
      return { ...bounds, x: getRight(workArea) };
    case 'top':
      return { ...bounds, y: workArea.y - bounds.height };
  }
}

export function getActivationStripBounds(edge: EdgeAutoHideEdge, expandedBounds: Rect, workArea: Rect): Rect {
  switch (edge) {
    case 'left':
    case 'right': {
      const height = Math.min(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX, expandedBounds.height);
      const y = expandedBounds.y + Math.round((expandedBounds.height - height) / 2);
      return {
        x: edge === 'left' ? workArea.x : getRight(workArea) - EDGE_AUTO_HIDE_REVEAL_PX,
        y,
        width: EDGE_AUTO_HIDE_REVEAL_PX,
        height,
      };
    }
    case 'top':
      return {
        x: expandedBounds.x + Math.round((expandedBounds.width - Math.min(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX, expandedBounds.width)) / 2),
        y: workArea.y,
        width: Math.min(EDGE_AUTO_HIDE_SIDE_STRIP_LENGTH_PX, expandedBounds.width),
        height: EDGE_AUTO_HIDE_REVEAL_PX,
      };
  }
}

// How close the cursor must be to the absolute desktop edge to count as a hide intent.
// Keep this tiny so normal in-window use never feels like "touching the edge".
export const EDGE_AUTO_HIDE_DESKTOP_EDGE_HIT_PX = 4;

export function isPointInRect(point: Point, bounds: Rect): boolean {
  return point.x >= bounds.x
    && point.x < getRight(bounds)
    && point.y >= bounds.y
    && point.y < getBottom(bounds);
}

// Hide only when the cursor actually touches the docked desktop edge.
// Leaving the window body alone is not enough.
export function isPointOnDesktopEdge(point: Point, edge: EdgeAutoHideEdge, workArea: Rect): boolean {
  switch (edge) {
    case 'left':
      return point.x >= workArea.x
        && point.x < workArea.x + EDGE_AUTO_HIDE_DESKTOP_EDGE_HIT_PX
        && point.y >= workArea.y
        && point.y < getBottom(workArea);
    case 'right':
      return point.x >= getRight(workArea) - EDGE_AUTO_HIDE_DESKTOP_EDGE_HIT_PX
        && point.x <= getRight(workArea)
        && point.y >= workArea.y
        && point.y < getBottom(workArea);
    case 'top':
      return point.y >= workArea.y
        && point.y < workArea.y + EDGE_AUTO_HIDE_DESKTOP_EDGE_HIT_PX
        && point.x >= workArea.x
        && point.x < getRight(workArea);
  }
}

export function isPointInActivationStrip(
  point: Point,
  edge: EdgeAutoHideEdge,
  expandedBounds: Rect,
  workArea: Rect,
): boolean {
  return isPointInRect(point, getActivationStripBounds(edge, expandedBounds, workArea));
}

function getRight(bounds: Rect): number {
  return bounds.x + bounds.width;
}

function getBottom(bounds: Rect): number {
  return bounds.y + bounds.height;
}
