// app/src/components/TemplateEditorModal.tsx
import React, { useState, useCallback } from 'react';
import type {
  DailyTemplate,
  ReportTemplate,
  CustomBlock,
  FixedBlock,
  RenderType,
} from '../../shared/aiReview/sectionConfig';
import {
  createDefaultDailyTemplate,
  createDefaultReportTemplate,
} from '../../shared/aiReview/sectionConfig';

export type TemplateKind =
  | 'daily'
  | 'personalWeekly'
  | 'personalMonthly'
  | 'externalWeekly'
  | 'externalMonthly';

interface Props {
  kind: TemplateKind;
  initialTemplate: DailyTemplate | ReportTemplate;
  onSave: (template: DailyTemplate | ReportTemplate) => void;
  onCancel: () => void;
  onOpenRecognition?: () => void; // opens AI recognition secondary modal (T10)
}

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '纯文本',
  list: '列表',
  table: '表格',
  callout: 'Callout',
  dataview: 'Dataview',
};

function isDailyTemplate(t: DailyTemplate | ReportTemplate): t is DailyTemplate {
  return 'fixedBlocks' in t;
}

export function TemplateEditorModal({ kind, initialTemplate, onSave, onCancel, onOpenRecognition }: Props) {
  const [template, setTemplate] = useState<DailyTemplate | ReportTemplate>(() =>
    JSON.parse(JSON.stringify(initialTemplate))
  );
  const [dragSrc, setDragSrc] = useState<{ group: 'fixed' | 'custom'; index: number } | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<'fixed' | 'custom' | null>(null);
  const [dirty, setDirty] = useState(false);

  const markDirty = () => setDirty(true);

  // --- Fixed block handlers (daily only) ---
  const renameFixed = (index: number, name: string) => {
    if (!isDailyTemplate(template)) return;
    const next: DailyTemplate = {
      ...template,
      fixedBlocks: template.fixedBlocks.map((b, i) =>
        i === index ? { ...b, displayName: name } : b
      ),
    };
    setTemplate(next);
    markDirty();
  };

  const moveFixed = (from: number, to: number) => {
    if (!isDailyTemplate(template)) return;
    const arr = [...template.fixedBlocks];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setTemplate({ ...template, fixedBlocks: arr });
    markDirty();
  };

  // --- Custom block handlers ---
  const getCustomBlocks = (): CustomBlock[] =>
    isDailyTemplate(template) ? template.customBlocks : (template as ReportTemplate).customBlocks;

  const setCustomBlocks = (blocks: CustomBlock[]) => {
    if (isDailyTemplate(template)) {
      setTemplate({ ...template, customBlocks: blocks });
    } else {
      setTemplate({ customBlocks: blocks });
    }
    markDirty();
  };

  const addBlock = () => {
    const newBlock: CustomBlock = {
      id: Math.random().toString(36).slice(2),
      name: '新区块',
      aiGenerate: true,
      renderType: 'text',
      prompt: '',
    };
    setCustomBlocks([...getCustomBlocks(), newBlock]);
  };

  const deleteBlock = (id: string) => {
    if (!confirm('删除后该块及其内容将被移除，确定?')) return;
    setCustomBlocks(getCustomBlocks().filter((b) => b.id !== id));
  };

  const updateBlock = (id: string, patch: Partial<CustomBlock>) => {
    setCustomBlocks(getCustomBlocks().map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const moveCustom = (from: number, to: number) => {
    const arr = [...getCustomBlocks()];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    setCustomBlocks(arr);
  };

  // --- Drag handlers ---
  const handleDragStart = (group: 'fixed' | 'custom', index: number) => {
    setDragSrc({ group, index });
  };

  const handleDragOver = (e: React.DragEvent, group: 'fixed' | 'custom', _index: number) => {
    e.preventDefault();
    if (dragSrc && dragSrc.group !== group) {
      setDragOverGroup(group); // cross-group drag — show red border
      return;
    }
    setDragOverGroup(null);
  };

  const handleDrop = (group: 'fixed' | 'custom', index: number) => {
    if (!dragSrc) return;
    if (dragSrc.group !== group) {
      // Cross-group drag rejected — snap back
      setDragSrc(null);
      setDragOverGroup(null);
      return;
    }
    if (group === 'fixed') moveFixed(dragSrc.index, index);
    else moveCustom(dragSrc.index, index);
    setDragSrc(null);
    setDragOverGroup(null);
  };

  const handleDragEnd = () => {
    setDragSrc(null);
    setDragOverGroup(null);
  };

  // --- Reset ---
  const handleReset = () => {
    if (!confirm('将重置为默认模板，自定义内容丢失，确定?')) return;
    const def =
      kind === 'daily'
        ? createDefaultDailyTemplate()
        : createDefaultReportTemplate(kind as any);
    setTemplate(def);
    setDirty(true);
  };

  // --- Cancel with dirty check ---
  const handleCancel = () => {
    if (dirty && !confirm('有未保存的修改，确定离开?')) return;
    onCancel();
  };

  const handleSave = () => {
    onSave(template);
  };

  const customBlocks = getCustomBlocks();
  const isDaily = isDailyTemplate(template);

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

        {/* Fixed blocks (daily only) */}
        {isDaily && (
          <section>
            <p className="template-editor-section-label">固定区块（不可删除）</p>
            {(template as DailyTemplate).fixedBlocks.map((block: FixedBlock, i: number) => (
              <div
                key={block.id}
                className="template-block-row"
                draggable
                onDragStart={() => handleDragStart('fixed', i)}
                onDragOver={(e) => handleDragOver(e, 'fixed', i)}
                onDrop={() => handleDrop('fixed', i)}
                onDragEnd={handleDragEnd}
                style={
                  dragOverGroup === 'fixed' && dragSrc?.group === 'custom'
                    ? { border: '1px solid red' }
                    : {}
                }
              >
                <span className="drag-handle">≡</span>
                <input
                  className="block-name-input"
                  value={block.displayName}
                  onChange={(e) => renameFixed(i, e.target.value)}
                />
              </div>
            ))}
          </section>
        )}

        {/* Custom blocks */}
        <section>
          <p className="template-editor-section-label">自定义区块</p>
          {customBlocks.map((block: CustomBlock, i: number) => (
            <div
              key={block.id}
              className="template-block-row"
              draggable
              onDragStart={() => handleDragStart('custom', i)}
              onDragOver={(e) => handleDragOver(e, 'custom', i)}
              onDrop={() => handleDrop('custom', i)}
              onDragEnd={handleDragEnd}
              style={
                dragOverGroup === 'custom' && dragSrc?.group === 'fixed'
                  ? { border: '1px solid red' }
                  : {}
              }
            >
              <span className="drag-handle">≡</span>
              <input
                className="block-name-input"
                value={block.name}
                onChange={(e) => updateBlock(block.id, { name: e.target.value })}
              />
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
              <button className="block-delete-btn" onClick={() => deleteBlock(block.id)}>
                删
              </button>
            </div>
          ))}
        </section>

        {/* Add + AI recognition */}
        <div className="template-editor-actions-row">
          <button onClick={addBlock}>+ 添加区块</button>
          {onOpenRecognition && (
            <button onClick={onOpenRecognition}>上传让 AI 识别</button>
          )}
        </div>

        {/* Footer */}
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
      </div>
    </div>
  );
}
