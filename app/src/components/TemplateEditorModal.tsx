import { useState } from 'react';
import { TemplateRecognitionModal } from './TemplateRecognitionModal';
import { TemplateEditorBlockList } from './templateEditor/TemplateEditorBlockList';
import type { DailyTemplate, ReportTemplate, CustomBlock, FixedBlock } from '../../shared/aiReview/sectionConfig';
import { createDefaultDailyTemplate, createDefaultReportTemplate } from '../../shared/aiReview/sectionConfig';
import {
  addTemplateCustomBlock,
  applyRecognizedTemplateBlocks,
  completeTemplateForSave,
  getDailyVisualBlocks,
  getTemplateCustomBlocks,
  isDailyTemplate,
  isReportTemplateKind,
  moveDailyTemplateBlock,
  moveItem,
  renameDailyFixedBlock,
  setTemplateCustomBlocks,
  updateTemplateCustomBlock,
  type TemplateKind,
} from './templateEditor/templateEditorModel';

export type { TemplateKind } from './templateEditor/templateEditorModel';

interface Props {
  kind: TemplateKind;
  initialTemplate: DailyTemplate | ReportTemplate;
  onSave: (template: DailyTemplate | ReportTemplate) => void;
  onCancel: () => void;
}

export function TemplateEditorModal({ kind, initialTemplate, onSave, onCancel }: Props) {
  const [template, setTemplate] = useState<DailyTemplate | ReportTemplate>(() => JSON.parse(JSON.stringify(initialTemplate)));
  const [recognitionOpen, setRecognitionOpen] = useState(false);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(() => new Set());
  const [dirty, setDirty] = useState(false);
  const customBlocks = getTemplateCustomBlocks(template);
  const isDaily = isDailyTemplate(template);
  const dailyVisualBlocks = isDaily ? getDailyVisualBlocks(template) : [];
  const markDirty = () => setDirty(true);

  const setCustomBlocks = (blocks: CustomBlock[]) => {
    setTemplate(setTemplateCustomBlocks(template, blocks));
    markDirty();
  };
  const addBlock = () => {
    setTemplate(addTemplateCustomBlock(template, { id: crypto.randomUUID(), name: '新区块', aiGenerate: true, renderType: 'text', prompt: '' }));
    markDirty();
  };
  const deleteBlock = (id: string) => {
    if (!confirm('删除后该块及其内容将被移除，确定?')) return;
    setCustomBlocks(customBlocks.filter((block) => block.id !== id));
  };
  const renameFixed = (id: FixedBlock['id'], name: string) => {
    if (!isDailyTemplate(template)) return;
    setTemplate(renameDailyFixedBlock(template, id, name));
    markDirty();
  };
  const updateBlock = (id: string, patch: Partial<CustomBlock>) => {
    setTemplate(updateTemplateCustomBlock(template, id, patch));
    markDirty();
  };
  const togglePrompt = (id: string) => setExpandedPromptIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });
  const moveBlocks = (from: number, to: number) => {
    if (isDailyTemplate(template)) setTemplate(moveDailyTemplateBlock(template, from, to));
    else setCustomBlocks(moveItem(customBlocks, from, to));
    markDirty();
  };
  const applyRecognizedBlocks = (blocks: CustomBlock[], mode: 'replace' | 'append') => {
    setTemplate(applyRecognizedTemplateBlocks(template, blocks, mode));
    markDirty();
    setRecognitionOpen(false);
  };
  const handleReset = () => {
    if (!confirm('将重置为默认模板，自定义内容丢失，确定?')) return;
    setTemplate(isReportTemplateKind(kind) ? createDefaultReportTemplate(kind) : createDefaultDailyTemplate());
    setDirty(true);
  };
  const handleCancel = () => {
    if (dirty && !confirm('有未保存的修改，确定离开?')) return;
    onCancel();
  };

  return (
    <div className="template-editor-overlay" onClick={(event) => { if (event.target === event.currentTarget) handleCancel(); }}>
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
        <TemplateEditorBlockList
          isDaily={isDaily}
          dailyBlocks={dailyVisualBlocks}
          customBlocks={customBlocks}
          expandedPromptIds={expandedPromptIds}
          onRenameFixed={renameFixed}
          onUpdateBlock={updateBlock}
          onDeleteBlock={deleteBlock}
          onTogglePrompt={togglePrompt}
          onMove={moveBlocks}
        />
        <div className="template-editor-actions-row">
          <button onClick={addBlock}>+ 添加区块</button>
          <button onClick={() => setRecognitionOpen(true)}>AI 识别并套用模板</button>
        </div>
        <div className="template-editor-footer">
          <button className="btn-reset" onClick={handleReset}>恢复默认</button>
          <div>
            <button className="btn-cancel" onClick={handleCancel}>取消</button>
            <button className="btn-save" onClick={() => onSave(completeTemplateForSave(template))}>保存</button>
          </div>
        </div>
        {recognitionOpen && <TemplateRecognitionModal existingBlocks={customBlocks} onApply={applyRecognizedBlocks} onCancel={() => setRecognitionOpen(false)} />}
      </div>
    </div>
  );
}
