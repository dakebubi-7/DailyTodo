import type { ChangeEvent } from 'react';
import type { CustomBlock, RenderType } from '../../../shared/aiReview/sectionConfig';
import { RENDER_TYPES, isRenderType } from '../../../shared/aiReview/sectionConfig';

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '纯文本',
  list: '列表',
  table: '表格',
  callout: '引用框',
  dataview: '数据视图',
};

interface TemplateBlockControlsProps {
  block: CustomBlock;
  promptExpanded: boolean;
  onUpdate: (id: string, patch: Partial<CustomBlock>) => void;
  onDelete: (id: string) => void;
  onTogglePrompt: (id: string) => void;
}

export function TemplateBlockControls({
  block,
  promptExpanded,
  onUpdate,
  onDelete,
  onTogglePrompt,
}: TemplateBlockControlsProps) {
  const handleRenderTypeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const nextRenderType = event.target.value;
    if (!isRenderType(nextRenderType)) return;
    if (
      nextRenderType === 'dataview' &&
      !confirm('导出 PDF/Word 时该块会降级为说明文字，继续?')
    )
      return;
    onUpdate(block.id, { renderType: nextRenderType });
  };

  return (
    <div className="template-block-custom-controls">
      <label className="ai-toggle">
        <input
          type="checkbox"
          checked={block.aiGenerate}
          onChange={(e) => onUpdate(block.id, { aiGenerate: e.target.checked })}
        />
        AI生成
      </label>
      <select
        className="render-type-select"
        value={block.renderType}
        disabled={!block.aiGenerate}
        onChange={handleRenderTypeChange}
      >
        {RENDER_TYPES.map((value) => (
          <option key={value} value={value}>
            {RENDER_TYPE_LABELS[value]}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="block-prompt-toggle"
        disabled={!block.aiGenerate}
        aria-expanded={promptExpanded}
        onClick={() => onTogglePrompt(block.id)}
      >
        {promptExpanded ? '收起提示词' : '提示词'}
      </button>
      <button className="block-delete-btn" onClick={() => onDelete(block.id)}>
        删
      </button>
    </div>
  );
}

interface TemplateBlockPromptInputProps {
  block: CustomBlock;
  expanded: boolean;
  onUpdate: (id: string, patch: Partial<CustomBlock>) => void;
}

export function TemplateBlockPromptInput({ block, expanded, onUpdate }: TemplateBlockPromptInputProps) {
  if (!expanded) return null;

  return (
    <textarea
      className="block-prompt-input"
      rows={3}
      value={block.prompt}
      disabled={!block.aiGenerate}
      onChange={(e) => onUpdate(block.id, { prompt: e.target.value })}
      placeholder="自定义提示词，留空则使用默认提示词"
    />
  );
}
