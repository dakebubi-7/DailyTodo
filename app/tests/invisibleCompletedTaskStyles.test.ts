import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(resolve(process.cwd(), 'src/styles/globals.css'), 'utf8');

describe('invisible theme completed task text', () => {
  it('keeps the single browse text copy visible while hovering completed tasks', () => {
    const browseOverride = stylesheet.match(
      /\.app-shell\[data-theme='invisible'\] \.task-card-completed \.task-text-wrap \.task-text-browse\s*\{([\s\S]*?)\}/,
    )?.[1] ?? '';
    const activeOverride = stylesheet.match(
      /\.app-shell\[data-theme='invisible'\] \.task-card-completed \.task-text-wrap \.task-text-active\s*\{([\s\S]*?)\}/,
    )?.[1] ?? '';

    expect(browseOverride).toContain('opacity: 1 !important');
    expect(browseOverride).toContain('transform: none !important');
    expect(activeOverride).toContain('opacity: 0 !important');
    expect(activeOverride).toContain('transition: none !important');
  });
});
