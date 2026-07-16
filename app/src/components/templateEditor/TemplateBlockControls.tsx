import type { ChangeEvent } from 'react';
import type { CustomBlock, RenderType } from '../../../shared/aiReview/sectionConfig';
import { RENDER_TYPES, isRenderType } from '../../../shared/aiReview/sectionConfig';

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '\u7eaf\u6587\u672c',
  list: '\u5217\u8868',
  table: '\u8868\u683c',
  callout: '\u5f15\u7528\u6846',
  dataview: '\u6570\u636e\u89c6\u56fe',
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
      !confirm('\u5bfc\u51fa PDF/Word \u65f6\u8be5\u533a\u5757\u4f1a\u964d\u7ea7\u4e3a\u8bf4\u660e\u6587\u5b57\uff0c\u7ee7\u7eed\uff1f')
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
          onChange={(event) => onUpdate(block.id, { aiGenerate: event.target.checked })}
        />
        AI{'\u751f\u6210'}
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
        {promptExpanded ? '\u6536\u8d77\u63d0\u793a\u8bcd' : '\u63d0\u793a\u8bcd'}
      </button>
      <button className="block-delete-btn" onClick={() => onDelete(block.id)}>
        {'\u5220\u9664'}
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
      onChange={(event) => onUpdate(block.id, { prompt: event.target.value })}
      placeholder="\u81ea\u5b9a\u4e49\u63d0\u793a\u8bcd\uff0c\u7559\u7a7a\u5219\u4f7f\u7528\u9ed8\u8ba4\u63d0\u793a\u8bcd"
    />
  );
}
