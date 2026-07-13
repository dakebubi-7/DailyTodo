import { isObjectRecord } from '../unknownValueGuards';

export interface TemplateNormalizationTypes<FixedBlockId extends string, RenderType extends string> {
  isFixedBlockId: (value: unknown) => value is FixedBlockId;
  isRenderType: (value: unknown) => value is RenderType;
}

export interface DailyTemplateValue<FixedBlockId extends string, RenderType extends string> {
  fixedBlocks: Array<{ id: FixedBlockId; displayName: string }>;
  customBlocks: Array<{
    id: string;
    name: string;
    aiGenerate: boolean;
    renderType: RenderType;
    prompt: string;
  }>;
  blockOrder: Array<{ type: 'fixed'; id: FixedBlockId } | { type: 'custom'; id: string }>;
}

export interface ReportTemplateValue<RenderType extends string> {
  customBlocks: Array<{
    id: string;
    name: string;
    aiGenerate: boolean;
    renderType: RenderType;
    prompt: string;
  }>;
}

export function normalizeDailyTemplateValue<FixedBlockId extends string, RenderType extends string>(
  value: unknown,
  defaults: DailyTemplateValue<FixedBlockId, RenderType>,
  types: TemplateNormalizationTypes<FixedBlockId, RenderType>,
): DailyTemplateValue<FixedBlockId, RenderType> {
  if (!isObjectRecord(value)) return defaults;
  const fixedBlocks = normalizeFixedBlocks(value.fixedBlocks, defaults.fixedBlocks, types.isFixedBlockId);
  const customBlocks = normalizeCustomBlocks(value.customBlocks, defaults.customBlocks, types.isRenderType);

  return {
    fixedBlocks,
    customBlocks,
    blockOrder: normalizeDailyBlockOrderValue(value.blockOrder, fixedBlocks, customBlocks, types.isFixedBlockId),
  };
}

export function normalizeReportTemplateValue<RenderType extends string>(
  value: unknown,
  defaults: ReportTemplateValue<RenderType>,
  isRenderType: (value: unknown) => value is RenderType,
): ReportTemplateValue<RenderType> {
  if (!isObjectRecord(value)) return defaults;
  return {
    customBlocks: normalizeCustomBlocks(value.customBlocks, defaults.customBlocks, isRenderType),
  };
}

function normalizeCustomBlocks<RenderType extends string>(
  value: unknown,
  defaults: ReportTemplateValue<RenderType>['customBlocks'],
  isRenderType: (value: unknown) => value is RenderType,
): ReportTemplateValue<RenderType>['customBlocks'] {
  if (!Array.isArray(value) || value.length === 0) return defaults;
  return value.map((block, index) => normalizeCustomBlock(block, defaults[index] ?? defaults[0]!, isRenderType));
}

function normalizeCustomBlock<RenderType extends string>(
  value: unknown,
  fallback: ReportTemplateValue<RenderType>['customBlocks'][number],
  isRenderType: (value: unknown) => value is RenderType,
): ReportTemplateValue<RenderType>['customBlocks'][number] {
  if (!isObjectRecord(value)) return { ...fallback, id: crypto.randomUUID() };
  return {
    id: typeof value.id === 'string' && value.id.trim() ? value.id : crypto.randomUUID(),
    name: typeof value.name === 'string' && value.name.trim() ? value.name : fallback.name,
    aiGenerate: typeof value.aiGenerate === 'boolean' ? value.aiGenerate : true,
    renderType: isRenderType(value.renderType) ? value.renderType : 'text' as RenderType,
    prompt: typeof value.prompt === 'string' ? value.prompt : '',
  };
}

function normalizeFixedBlocks<FixedBlockId extends string>(
  value: unknown,
  defaults: DailyTemplateValue<FixedBlockId, string>['fixedBlocks'],
  isFixedBlockId: (value: unknown) => value is FixedBlockId,
): DailyTemplateValue<FixedBlockId, string>['fixedBlocks'] {
  if (!Array.isArray(value)) return defaults;
  const byDefault = new Map(defaults.map((block) => [block.id, block]));
  const seen = new Set<FixedBlockId>();
  const blocks: DailyTemplateValue<FixedBlockId, string>['fixedBlocks'] = [];

  value.forEach((raw, index) => {
    if (!isObjectRecord(raw)) return;
    const id = isFixedBlockId(raw.id) ? raw.id : defaults[index]?.id;
    if (!id || seen.has(id)) return;
    seen.add(id);
    blocks.push({
      id,
      displayName: typeof raw.displayName === 'string' && raw.displayName.trim()
        ? raw.displayName
        : byDefault.get(id)!.displayName,
    });
  });

  defaults.forEach((block) => {
    if (!seen.has(block.id)) blocks.push(block);
  });
  return blocks;
}

export function normalizeDailyBlockOrderValue<FixedBlockId extends string, RenderType extends string>(
  value: unknown,
  fixedBlocks: DailyTemplateValue<FixedBlockId, RenderType>['fixedBlocks'],
  customBlocks: DailyTemplateValue<FixedBlockId, RenderType>['customBlocks'],
  isFixedBlockId: (value: unknown) => value is FixedBlockId,
): DailyTemplateValue<FixedBlockId, RenderType>['blockOrder'] {
  const fixedIds = new Set(fixedBlocks.map((block) => block.id));
  const customIds = new Set(customBlocks.map((block) => block.id));
  const usedFixed = new Set<FixedBlockId>();
  const usedCustom = new Set<string>();
  const order: DailyTemplateValue<FixedBlockId, RenderType>['blockOrder'] = [];

  if (Array.isArray(value)) {
    value.forEach((raw) => {
      if (!isObjectRecord(raw)) return;
      if (raw.type === 'fixed' && isFixedBlockId(raw.id) && fixedIds.has(raw.id) && !usedFixed.has(raw.id)) {
        usedFixed.add(raw.id);
        order.push({ type: 'fixed', id: raw.id });
      }
      if (raw.type === 'custom' && typeof raw.id === 'string' && customIds.has(raw.id) && !usedCustom.has(raw.id)) {
        usedCustom.add(raw.id);
        order.push({ type: 'custom', id: raw.id });
      }
    });
  }

  fixedBlocks.forEach((block) => {
    if (!usedFixed.has(block.id)) order.push({ type: 'fixed', id: block.id });
  });
  customBlocks.forEach((block) => {
    if (!usedCustom.has(block.id)) order.push({ type: 'custom', id: block.id });
  });
  return order;
}
