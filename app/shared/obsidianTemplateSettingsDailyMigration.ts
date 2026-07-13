import { createDailyBlockOrder, createDefaultDailyTemplate } from './aiReview/sectionConfig';
import type { DailyBlockOrderItem, DailyTemplate, FixedBlockId } from './aiReview/sectionConfig';

const TEMPLATE_CUSTOM_TOKENS = ['review', 'tomorrow', 'knowledge'] as const;
type TemplateCustomToken = (typeof TEMPLATE_CUSTOM_TOKENS)[number];
const TEMPLATE_CUSTOM_TOKEN_SET = new Set<unknown>(TEMPLATE_CUSTOM_TOKENS);

function isTemplateCustomToken(token: string): token is TemplateCustomToken {
  return TEMPLATE_CUSTOM_TOKEN_SET.has(token);
}

export function migrateLegacyDailyMarkdownTemplate(old: string): DailyTemplate {
  const defaults = createDefaultDailyTemplate();
  if (!old || typeof old !== 'string' || !old.includes('{{')) {
    return defaults;
  }

  const fixedBlocks = defaults.fixedBlocks;
  const markerToDefault = new Map(defaults.customBlocks.map((block) => {
    if (/(\u660e\u65e5\u5f85\u529e|tomorrow)/i.test(block.name)) return ['tomorrow', block] as const;
    if (/(\u53ef\u590d\u7528\u77e5\u8bc6|knowledge)/i.test(block.name)) return ['knowledge', block] as const;
    return ['review', block] as const;
  }));
  const customBlocks = defaults.customBlocks;
  const blockOrder: DailyBlockOrderItem[] = [];
  const usedFixed = new Set<FixedBlockId>();
  const usedCustom = new Set<string>();
  const tokenPattern = /\{\{\s*(work|inspire|inspiration|tasks|review|tomorrow|knowledge)\s*\}\}/gi;
  const fixedTokenMap: Record<string, FixedBlockId> = {
    work: 'work',
    inspire: 'inspire',
    inspiration: 'inspire',
    tasks: 'tasks',
  };

  for (const match of old.matchAll(tokenPattern)) {
    const token = match[1].toLowerCase();
    const fixedId = fixedTokenMap[token];
    if (fixedId) {
      if (!usedFixed.has(fixedId)) {
        usedFixed.add(fixedId);
        blockOrder.push({ type: 'fixed', id: fixedId });
      }
      continue;
    }

    if (!isTemplateCustomToken(token)) continue;
    const custom = markerToDefault.get(token);
    if (custom && !usedCustom.has(custom.id)) {
      usedCustom.add(custom.id);
      blockOrder.push({ type: 'custom', id: custom.id });
    }
  }

  return {
    fixedBlocks,
    customBlocks,
    blockOrder: blockOrder.length ? blockOrder : createDailyBlockOrder(fixedBlocks, customBlocks),
  };
}
