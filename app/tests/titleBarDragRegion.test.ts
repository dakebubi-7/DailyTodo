import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const titleBarSource = readFileSync(
  resolve(process.cwd(), 'src/components/TitleBar.tsx'),
  'utf8',
);

describe('title bar native drag region', () => {
  it('uses Chromium native dragging only for the blank title-bar space', () => {
    expect(titleBarSource).toContain("className=\"titlebar-drag-space\"");
    expect(titleBarSource).toContain("WebkitAppRegion: lockWindowPosition ? 'no-drag' : 'drag'");
  });
});
