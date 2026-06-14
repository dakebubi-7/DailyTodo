import React, { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { motion } from 'framer-motion';
import { TemplateRecognitionModal } from './TemplateRecognitionModal';
import { useSortableMotion } from '../hooks/useSortableMotion';
import type {
  DailyTemplate,
  ReportTemplate,
  CustomBlock,
  FixedBlock,
  RenderType,
} from '../../shared/aiReview/sectionConfig';
import {
  createDailyBlockOrder,
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
  getDailyBlockOrder,
} from '../../shared/aiReview/sectionConfig';

export type TemplateKind =
  | 'daily'
  | 'personalWeekly'
  | 'personalMonthly'
  | 'externalWeekly'
  | 'externalMonthly';

type ReportTemplateKind = Exclude<TemplateKind, 'daily'>;
type VisualBlock =
  | { type: 'fixed'; id: FixedBlock['id']; block: FixedBlock }
  | { type: 'custom'; id: string; block: CustomBlock };

interface Props {
  kind: TemplateKind;
  initialTemplate: DailyTemplate | ReportTemplate;
  onSave: (template: DailyTemplate | ReportTemplate) => void;
  onCancel: () => void;
}

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '纯文本',
  list: '列表',
  table: '表格',
  callout: '引用框',
  dataview: '数据视图',
};

function isDailyTemplate(t: DailyTemplate | ReportTemplate): t is DailyTemplate {
  return 'fixedBlocks' in t;
}

function visualKey(item: { type: 'fixed' | 'custom'; id: string }) {
  return `${item.type}:${item.id}`;
}

function moveItem<T>(items: T[], from: number, to: number) {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

interface SortableBlockRowProps {
  sortableId: string;
  isDragActive: boolean;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}

// One reorderable template block row. Mirrors the task list: spring-driven
// make-room displacement during drag, instant jump-to-rest on release (no
// bounce). The "≡" handle is the drag activator.
function SortableBlockRow({ sortableId, isDragActive, children }: SortableBlockRowProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, isDragging } = useSortable({
    id: sortableId,
    transition: null,
  });
  const { style } = useSortableMotion({ transform, isDragging, isDragActive });

  const dragHandle = (
    <span
      {...attributes}
      {...listeners}
      ref={setActivatorNodeRef}
      className="drag-handle"
      role="button"
      tabIndex={0}
      aria-label="拖动调整区块顺序"
    >
      ≡
    </span>
  );

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      className={`template-block-row ${isDragging ? 'template-block-row-dragging' : ''}`}
    >
      {children(dragHandle)}
    </motion.div>
  );
}

export function TemplateEditorModal({ kind, initialTemplate, onSave, onCancel }: Props) {
  const [template, setTemplate] = useState<DailyTemplate | ReportTemplate>(() =>
    JSON.parse(JSON.stringify(initialTemplate))
  );
  const [isDragActive, setIsDragActive] = useState(false);
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(() => new Set());
  const [dirty, setDirty] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const markDirty = () => setDirty(true);

  const getCustomBlocks = (): CustomBlock[] =>
    isDailyTemplate(template) ? template.customBlocks : (template as ReportTemplate).customBlocks;

  const getDailyVisualBlocks = (): VisualBlock[] => {
    if (!isDailyTemplate(template)) return [];
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
  };

  const setCustomBlocks = (blocks: CustomBlock[]) => {
    if (isDailyTemplate(template)) {
      setTemplate({
        ...template,
        customBlocks: blocks,
        blockOrder: template.blockOrder.filter((item) => item.type === 'fixed' || blocks.some((block) => block.id === item.id)),
      });
    } else {
      setTemplate({ customBlocks: blocks });
    }
    markDirty();
  };

  const addBlock = () => {
    const newBlock: CustomBlock = {
      id: crypto.randomUUID(),
      name: '新区块',
      aiGenerate: true,
      renderType: 'text',
      prompt: '',
    };
    if (isDailyTemplate(template)) {
      setTemplate({
        ...template,
        customBlocks: [...template.customBlocks, newBlock],
        blockOrder: [...getDailyBlockOrder(template), { type: 'custom', id: newBlock.id }],
      });
      markDirty();
      return;
    }
    setCustomBlocks([...getCustomBlocks(), newBlock]);
  };

  const deleteBlock = (id: string) => {
    if (!confirm('删除后该块及其内容将被移除，确定?')) return;
    setCustomBlocks(getCustomBlocks().filter((b) => b.id !== id));
  };

  const renameFixed = (id: FixedBlock['id'], name: string) => {
    if (!isDailyTemplate(template)) return;
    setTemplate({
      ...template,
      fixedBlocks: template.fixedBlocks.map((block) =>
        block.id === id ? { ...block, displayName: name } : block
      ),
    });
    markDirty();
  };

  const updateBlock = (id: string, patch: Partial<CustomBlock>) => {
    setCustomBlocks(getCustomBlocks().map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const togglePrompt = (id: string) => {
    setExpandedPromptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const moveCustom = (from: number, to: number) => {
    setCustomBlocks(moveItem(getCustomBlocks(), from, to));
  };

  const moveDailyBlock = (from: number, to: number) => {
    if (!isDailyTemplate(template) || from === to) return;
    setTemplate({ ...template, blockOrder: moveItem(getDailyBlockOrder(template), from, to) });
    markDirty();
  };

  const applyRecognizedBlocks = (blocks: CustomBlock[], mode: 'replace' | 'append') => {
    if (isDailyTemplate(template)) {
      const customBlocks = mode === 'replace' ? blocks : [...template.customBlocks, ...blocks];
      const fixedOrder = getDailyBlockOrder(template).filter((item) => item.type === 'fixed');
      const blockOrder = mode === 'replace'
        ? [...fixedOrder, ...blocks.map((block) => ({ type: 'custom' as const, id: block.id }))]
        : [...getDailyBlockOrder(template), ...blocks.map((block) => ({ type: 'custom' as const, id: block.id }))];
      setTemplate({ ...template, customBlocks, blockOrder });
      markDirty();
      setRecognitionOpen(false);
      return;
    }
    setCustomBlocks(mode === 'replace' ? blocks : [...getCustomBlocks(), ...blocks]);
    setRecognitionOpen(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setIsDragActive(false);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const ids = isDailyTemplate(template)
      ? getDailyVisualBlocks().map(visualKey)
      : getCustomBlocks().map((block) => block.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;

    if (isDailyTemplate(template)) {
      moveDailyBlock(from, to);
    } else {
      moveCustom(from, to);
    }
  };

  const handleReset = () => {
    if (!confirm('将重置为默认模板，自定义内容丢失，确定?')) return;
    const def =
      kind === 'daily'
        ? createDefaultDailyTemplate()
        : createDefaultReportTemplate(kind as ReportTemplateKind);
    setTemplate(def);
    setDirty(true);
  };

  const handleCancel = () => {
    if (dirty && !confirm('有未保存的修改，确定离开?')) return;
    onCancel();
  };

  const handleSave = () => {
    if (isDailyTemplate(template)) {
      onSave({
        ...template,
        blockOrder: template.blockOrder.length
          ? template.blockOrder
          : createDailyBlockOrder(template.fixedBlocks, template.customBlocks),
      });
      return;
    }
    onSave(template);
  };

  const customBlocks = getCustomBlocks();
  const isDaily = isDailyTemplate(template);
  const dailyVisualBlocks = getDailyVisualBlocks();

  const renderCustomControls = (block: CustomBlock) => {
    const promptExpanded = expandedPromptIds.has(block.id);

    return (
      <div className="template-block-custom-controls">
        <label className="ai-toggle">
          <input
            type="checkbox"
            checked={block.aiGenerate}
            onChange={(e) => updateBlock(block.id, { aiGenerate: e.target.checked })}
          />
          AI生成
        </label>
        <select
          className="render-type-select"
          value={block.renderType}
          disabled={!block.aiGenerate}
          onChange={(e) => {
            const rt = e.target.value as RenderType;
            if (
              rt === 'dataview' &&
              !confirm('导出 PDF/Word 时该块会降级为说明文字，继续?')
            )
              return;
            updateBlock(block.id, { renderType: rt });
          }}
        >
          {(Object.entries(RENDER_TYPE_LABELS) as [RenderType, string][]).map(
            ([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            )
          )}
        </select>
        <button
          type="button"
          className="block-prompt-toggle"
          disabled={!block.aiGenerate}
          aria-expanded={promptExpanded}
          onClick={() => togglePrompt(block.id)}
        >
          {promptExpanded ? '收起提示词' : '提示词'}
        </button>
        <button className="block-delete-btn" onClick={() => deleteBlock(block.id)}>
          删
        </button>
      </div>
    );
  };

  const renderPromptInput = (block: CustomBlock) => (
    expandedPromptIds.has(block.id) ? (
      <textarea
        className="block-prompt-input"
        rows={3}
        value={block.prompt}
        disabled={!block.aiGenerate}
        onChange={(e) => updateBlock(block.id, { prompt: e.target.value })}
        placeholder="自定义提示词，留空则使用默认提示词"
      />
    ) : null
  );

  const renderDailyRow = (item: VisualBlock) => (
    <SortableBlockRow key={visualKey(item)} sortableId={visualKey(item)} isDragActive={isDragActive}>
      {(dragHandle) => (
        <>
          {dragHandle}
          <input
            className="block-name-input"
            value={item.type === 'fixed' ? item.block.displayName : item.block.name}
            onChange={(e) => {
              if (item.type === 'fixed') renameFixed(item.block.id, e.target.value);
              else updateBlock(item.block.id, { name: e.target.value });
            }}
          />
          {item.type === 'custom' && renderCustomControls(item.block)}
          {item.type === 'custom' && renderPromptInput(item.block)}
        </>
      )}
    </SortableBlockRow>
  );

  const renderReportRow = (block: CustomBlock) => (
    <SortableBlockRow key={block.id} sortableId={block.id} isDragActive={isDragActive}>
      {(dragHandle) => (
        <>
          {dragHandle}
          <input
            className="block-name-input"
            value={block.name}
            onChange={(e) => updateBlock(block.id, { name: e.target.value })}
          />
          {renderCustomControls(block)}
          {renderPromptInput(block)}
        </>
      )}
    </SortableBlockRow>
  );

  const sortableIds = isDaily ? dailyVisualBlocks.map(visualKey) : customBlocks.map((block) => block.id);

  return (
    <div
      className="template-editor-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleCancel();
      }}
    >
      <div className="template-editor-modal">
        <h2 className="template-editor-title">
          {kind === 'daily'
            ? '日报模板编辑器'
            : kind === 'personalWeekly'
            ? '个人周报模板编辑器'
            : kind === 'personalMonthly'
            ? '个人月报模板编辑器'
            : kind === 'externalWeekly'
            ? '对外周报模板编辑器'
            : '对外月报模板编辑器'}
        </h2>

        <section className="template-editor-block-list">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={() => setIsDragActive(true)}
            onDragCancel={() => setIsDragActive(false)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {(isDaily ? dailyVisualBlocks.map(renderDailyRow) : customBlocks.map(renderReportRow))}
            </SortableContext>
          </DndContext>
        </section>

        <div className="template-editor-actions-row">
          <button onClick={addBlock}>+ 添加区块</button>
          <button onClick={() => setRecognitionOpen(true)}>AI 识别并套用模板</button>
        </div>

        <div className="template-editor-footer">
          <button className="btn-reset" onClick={handleReset}>
            恢复默认
          </button>
          <div>
            <button className="btn-cancel" onClick={handleCancel}>
              取消
            </button>
            <button className="btn-save" onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
        {recognitionOpen && (
          <TemplateRecognitionModal
            existingBlocks={customBlocks}
            onApply={applyRecognizedBlocks}
            onCancel={() => setRecognitionOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
