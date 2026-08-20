import { describe, expect, it } from 'vitest';
import { createAppStateAccessors } from '../electron/appStateAccessors';
import { OBSIDIAN_TEMPLATE_SETTINGS_KEY } from '../shared/appSettings';

describe('app state accessors', () => {
  it('persists normalized Obsidian templates on their first read so custom block markers stay stable', () => {
    const values = new Map<string, unknown>();
    const store = {
      get(key: string, defaultValue?: unknown) {
        return values.has(key) ? values.get(key) : defaultValue;
      },
      set(key: string, value: unknown) {
        values.set(key, value);
      },
    };
    const accessors = createAppStateAccessors({
      store,
      isDevelopmentBuild: () => false,
      devObsidianPath: '',
      zh: (text) => text,
    });

    const first = accessors.getObsidianTemplateSettings();
    const second = accessors.getObsidianTemplateSettings();

    expect(values.get(OBSIDIAN_TEMPLATE_SETTINGS_KEY)).toEqual(first);
    expect(second.dailyTemplate.customBlocks.map((block) => block.id))
      .toEqual(first.dailyTemplate.customBlocks.map((block) => block.id));
  });
});
