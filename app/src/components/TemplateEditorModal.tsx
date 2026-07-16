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
    setTemplate(addTemplateCustomBlock(template, { id: crypto.randomUUID(), name: '\u65b0\u533a\u5757', aiGenerate: true, renderType: 'text', prompt: '' }));
    markDirty();
  };
  const deleteBlock = (id: string) => {
    if (!confirm('\u5220\u9664\u540e\u8be5\u533a\u5757\u53ca\u5176\u5185\u5bb9\u5c06\u88ab\u79fb\u9664\uff0c\u786e\u5b9a\uff1f')) return;
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
    if (!confirm('\u5c06\u91cd\u7f6e\u4e3a\u9ed8\u8ba4\u6a21\u677f\uff0c\u81ea\u5b9a\u4e49\u5185\u5bb9\u4e22\u5931\uff0c\u786e\u5b9a\uff1f')) return;
    setTemplate(isReportTemplateKind(kind) ? createDefaultReportTemplate(kind) : createDefaultDailyTemplate());
    setDirty(true);
  };
  const handleCancel = () => {
    if (dirty && !confirm('\u6709\u672a\u4fdd\u5b58\u7684\u4fee\u6539\uff0c\u786e\u5b9a\u79bb\u5f00\uff1f')) return;
    onCancel();
  };

  const editorTitle = kind === 'daily'
    ? '\u65e5\u62a5\u6a21\u677f\u7f16\u8f91\u5668'
    : kind === 'personalWeekly'
    ? '\u4e2a\u4eba\u5468\u62a5\u6a21\u677f\u7f16\u8f91\u5668'
    : kind === 'personalMonthly'
    ? '\u4e2a\u4eba\u6708\u62a5\u6a21\u677f\u7f16\u8f91\u5668'
    : kind === 'externalWeekly'
    ? '\u5bf9\u5916\u5468\u62a5\u6a21\u677f\u7f16\u8f91\u5668'
    : '\u5bf9\u5916\u6708\u62a5\u6a21\u677f\u7f16\u8f91\u5668';

  return (
    <div className="template-editor-overlay" onClick={(event) => { if (event.target === event.currentTarget) handleCancel(); }}>
      <div className="template-editor-modal">
        <h2 className="template-editor-title">{editorTitle}</h2>
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
          <button onClick={addBlock}>+ {'\u6dfb\u52a0\u533a\u5757'}</button>
          <button onClick={() => setRecognitionOpen(true)}>AI {'\u8bc6\u522b\u5e76\u5957\u7528\u6a21\u677f'}</button>
        </div>
        <div className="template-editor-footer">
          <button className="btn-reset" onClick={handleReset}>{'\u6062\u590d\u9ed8\u8ba4'}</button>
          <div>
            <button className="btn-cancel" onClick={handleCancel}>{'\u53d6\u6d88'}</button>
            <button className="btn-save" onClick={() => onSave(completeTemplateForSave(template))}>{'\u4fdd\u5b58'}</button>
          </div>
        </div>
        {recognitionOpen && <TemplateRecognitionModal existingBlocks={customBlocks} onApply={applyRecognizedBlocks} onCancel={() => setRecognitionOpen(false)} />}
      </div>
    </div>
  );
}
