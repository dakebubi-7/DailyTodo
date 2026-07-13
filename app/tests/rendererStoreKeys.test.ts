import { describe, expect, it } from 'vitest';
import {
  filterRendererStoreKeys,
  isRendererStoreKey,
  pickRendererStoreEntries,
} from '../shared/rendererStoreKeys';

describe('renderer store key allowlist', () => {
  it('accepts known renderer keys only', () => {
    expect(isRendererStoreKey('tasks')).toBe(true);
    expect(isRendererStoreKey('aiReviewSettings')).toBe(false);
    expect(isRendererStoreKey(123)).toBe(false);
  });

  it('filters batched keys and entries', () => {
    expect(filterRendererStoreKeys(['tasks', 'aiReviewSettings', 1, 'isDark'])).toEqual(['tasks', 'isDark']);
    expect(
      pickRendererStoreEntries({
        tasks: [{ id: 'a' }],
        aiReviewSettings: { apiKey: 'secret' },
        isDark: true,
      }),
    ).toEqual({
      tasks: [{ id: 'a' }],
      isDark: true,
    });
  });
});
