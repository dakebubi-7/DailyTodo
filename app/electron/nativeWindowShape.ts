import type { Rectangle } from 'electron';

type WindowSize = Pick<Rectangle, 'width' | 'height'>;

export function createRoundedWindowShape({ width, height }: WindowSize, radius: number): Rectangle[] {
  const boundedWidth = Math.max(1, Math.floor(width));
  const boundedHeight = Math.max(1, Math.floor(height));
  const boundedRadius = Math.min(
    Math.max(0, Math.floor(radius)),
    Math.floor(boundedWidth / 2),
    Math.floor(boundedHeight / 2),
  );

  if (boundedRadius === 0) {
    return [{ x: 0, y: 0, width: boundedWidth, height: boundedHeight }];
  }

  const shape: Rectangle[] = [
    { x: 0, y: boundedRadius, width: boundedWidth, height: boundedHeight - (boundedRadius * 2) },
  ];

  for (let y = 0; y < boundedRadius; y += 1) {
    const verticalDistance = boundedRadius - y - 0.5;
    const inset = Math.ceil(boundedRadius - Math.sqrt((boundedRadius ** 2) - (verticalDistance ** 2)));
    const row = { x: inset, y, width: boundedWidth - (inset * 2), height: 1 };
    shape.push(row, { ...row, y: boundedHeight - y - 1 });
  }

  return shape;
}
