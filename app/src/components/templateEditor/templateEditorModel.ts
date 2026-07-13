import type {
  CustomBlock,
  DailyTemplate,
  FixedBlock,
  ReportTemplate,
} from '../../../shared/aiReview/sectionConfig';
import {
  createDailyBlockOrder,
  getDailyBlockOrder,
} from '../../../shared/aiReview/sectionConfig';

export type TemplateKind =
  | 'daily'
  | 'personalWeekly'
  | 'personalMonthly'
  | 'externalWeekly'
  | 'externalMonthly';

export type ReportTemplateKind = Exclude<TemplateKind, 'daily'>;

export type VisualBlock =
  | { type: 'fixed'; id: FixedBlock['id']; block: FixedBlock }
  | { type: 'custom'; id: string; block: CustomBlock };

export function isDailyTemplate(template: DailyTemplate | ReportTemplate): template is DailyTemplate {
  return 'fixedBlocks' in template;
}

export function isReportTemplateKind(kind: TemplateKind): kind is ReportTemplateKind {
  return kind !== 'daily';
}

export function visualKey(item: { type: 'fixed' | 'custom'; id: string }) {
  return `${item.type}:${item.id}`;
}

export function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved as T);
  return next;
}

export function getTemplateCustomBlocks(template: DailyTemplate | ReportTemplate): CustomBlock[] {
  return template.customBlocks;
}

export function getDailyVisualBlocks(template: DailyTemplate): VisualBlock[] {
  const fixedById = new Map(template.fixedBlocks.map((block) => [block.id, block]));
  const customById = new Map(template.customBlocks.map((block) => [block.id, block]));
  return getDailyBlockOrder(template)
    .map((item): VisualBlock | null => {
      if (item.type === 'fixed') {
        const block = fixedById.get(item.id);
        return block ? { type: 'fixed', id: item.id, block } : null;
      }
      const block = customById.get(item.id);
      return block ? { type: 'custom', id: item.id, block } : null;
    })
    .filter((item): item is VisualBlock => Boolean(item));
}

export function setTemplateCustomBlocks(
  template: DailyTemplate | ReportTemplate,
  blocks: CustomBlock[],
): DailyTemplate | ReportTemplate {
  if (!isDailyTemplate(template)) return { customBlocks: blocks };

  const blockIds = new Set(blocks.map((block) => block.id));
  return {
    ...template,
    customBlocks: blocks,
    blockOrder: template.blockOrder.filter((item) => item.type === 'fixed' || blockIds.has(item.id)),
  };
}

export function addTemplateCustomBlock(
  template: DailyTemplate | ReportTemplate,
  block: CustomBlock,
): DailyTemplate | ReportTemplate {
  if (!isDailyTemplate(template)) {
    return { customBlocks: [...template.customBlocks, block] };
  }

  return {
    ...template,
    customBlocks: [...template.customBlocks, block],
    blockOrder: [...getDailyBlockOrder(template), { type: 'custom', id: block.id }],
  };
}

export function renameDailyFixedBlock(
  template: DailyTemplate,
  id: FixedBlock['id'],
  name: string,
): DailyTemplate {
  return {
    ...template,
    fixedBlocks: template.fixedBlocks.map((block) =>
      block.id === id ? { ...block, displayName: name } : block
    ),
  };
}

export function updateTemplateCustomBlock(
  template: DailyTemplate | ReportTemplate,
  id: string,
  patch: Partial<CustomBlock>,
): DailyTemplate | ReportTemplate {
  return setTemplateCustomBlocks(
    template,
    template.customBlocks.map((block) => (block.id === id ? { ...block, ...patch } : block)),
  );
}

export function moveDailyTemplateBlock(
  template: DailyTemplate,
  from: number,
  to: number,
): DailyTemplate {
  if (from === to) return template;
  return { ...template, blockOrder: moveItem(getDailyBlockOrder(template), from, to) };
}

export function applyRecognizedTemplateBlocks(
  template: DailyTemplate | ReportTemplate,
  blocks: CustomBlock[],
  mode: 'replace' | 'append',
): DailyTemplate | ReportTemplate {
  if (!isDailyTemplate(template)) {
    return { customBlocks: mode === 'replace' ? blocks : [...template.customBlocks, ...blocks] };
  }

  const customBlocks = mode === 'replace' ? blocks : [...template.customBlocks, ...blocks];
  const fixedOrder = getDailyBlockOrder(template).filter((item) => item.type === 'fixed');
  const customOrder = blocks.map((block) => ({ type: 'custom' as const, id: block.id }));
  const blockOrder = mode === 'replace'
    ? [...fixedOrder, ...customOrder]
    : [...getDailyBlockOrder(template), ...customOrder];

  return { ...template, customBlocks, blockOrder };
}

export function completeTemplateForSave(
  template: DailyTemplate | ReportTemplate,
): DailyTemplate | ReportTemplate {
  if (!isDailyTemplate(template) || template.blockOrder.length) return template;
  return {
    ...template,
    blockOrder: createDailyBlockOrder(template.fixedBlocks, template.customBlocks),
  };
}
