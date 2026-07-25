import React, { useState, useRef } from 'react';
import { isRenderType, RENDER_TYPES, type CustomBlock, type RenderType } from '../../shared/aiReview/sectionConfig';
import { parseRecognizedBlocks } from '../../shared/recognizeTemplateBlocks';

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '纯文本', list: '列表', table: '表格', callout: '引用框', dataview: '数据视图',
};

interface Props {
  existingBlocks: CustomBlock[];
  onApply: (blocks: CustomBlock[], mode: 'replace' | 'append') => void;
  onCancel: () => void;
}

type Step = 'input' | 'preview';

export function TemplateRecognitionModal({ existingBlocks, onApply, onCancel }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [recognized, setRecognized] = useState<CustomBlock[]>([]);
  const [expandedPromptIds, setExpandedPromptIds] = useState<Set<string>>(() => new Set());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.md') && !file.name.endsWith('.txt')) {
      setError('仅支持 .md / .txt 格式');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      const fileText = ev.target?.result;
      setText(typeof fileText === 'string' ? fileText : '');
    };
    reader.readAsText(file, 'utf-8');
  };

  const handleRecognize = () => {
    if (!text.trim()) {
      setError('请先粘贴内容或选择文件');
      return;
    }
    setError('');
    const result = parseRecognizedBlocks(text, existingBlocks);
    if (result.confidence === 'low' && result.blocks.length === 0) {
      setError('识别失败,请手动添加区块');
      return;
    }
    setRecognized(result.blocks);
    setStep('preview');
  };

  const updateRecognized = (id: string, patch: Partial<CustomBlock>) => {
    setRecognized((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  };

  const removeRecognized = (id: string) => {
    setRecognized((prev) => prev.filter((block) => block.id !== id));
  };

  const togglePrompt = (id: string) => {
    setExpandedPromptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="recognition-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="recognition-modal">
        <h3>AI 识别模板</h3>

        {step === 'input' && (
          <>
            <div className="recognition-file-row">
              <button onClick={() => fileRef.current?.click()}>选择文件</button>
              <input
                ref={fileRef}
                type="file"
                accept=".md,.txt"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <span className="recognition-hint">或直接粘贴 Markdown 文本</span>
            </div>
            <textarea
              className="recognition-textarea"
              rows={10}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此粘贴 Markdown 模板内容..."
            />
            {error && <p className="recognition-error">{error}</p>}
            <div className="recognition-footer">
              <button onClick={onCancel}>取消</button>
              <button className="btn-primary" onClick={handleRecognize}>开始识别</button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <p className="recognition-hint">识别结果(可调整后应用):</p>
            {recognized.map((block) => {
              const promptExpanded = expandedPromptIds.has(block.id);

              return (
                <div key={block.id} className="recognition-block-row">
                  <input
                    value={block.name}
                    onChange={(e) => updateRecognized(block.id, { name: e.target.value })}
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={block.aiGenerate}
                      onChange={(e) => updateRecognized(block.id, { aiGenerate: e.target.checked })}
                    />
                    AI生成
                  </label>
                  <select
                    value={block.renderType}
                    disabled={!block.aiGenerate}
                    onChange={(e) => {
                      const nextRenderType = e.target.value;
                      if (!isRenderType(nextRenderType)) return;
                      updateRecognized(block.id, { renderType: nextRenderType });
                    }}
                  >
                    {RENDER_TYPES.map((v) => (
                      <option key={v} value={v}>{RENDER_TYPE_LABELS[v]}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="recognition-prompt-toggle"
                    disabled={!block.aiGenerate}
                    aria-expanded={promptExpanded}
                    onClick={() => togglePrompt(block.id)}
                  >
                    {promptExpanded ? '收起提示词' : '提示词'}
                  </button>
                  <button
                    type="button"
                    className="recognition-remove-button"
                    aria-label={`删除 ${block.name}`}
                    title={`删除 ${block.name}`}
                    onClick={() => removeRecognized(block.id)}
                  >
                    &times;
                  </button>
                  {promptExpanded && (
                    <textarea
                      className="recognition-prompt-input"
                      rows={2}
                      value={block.prompt}
                      disabled={!block.aiGenerate}
                      onChange={(e) => updateRecognized(block.id, { prompt: e.target.value })}
                      placeholder="自定义提示词，留空则使用默认提示词"
                    />
                  )}
                </div>
              );
            })}
            {recognized.length === 0 && (
              <p className="recognition-empty">没有可应用的识别区块。你可以重新识别。</p>
            )}
            {error && <p className="recognition-error">{error}</p>}
            <div className="recognition-footer">
              <button onClick={() => setStep('input')}>重新识别</button>
              <button disabled={recognized.length === 0} onClick={() => onApply(recognized, 'append')}>追加到自定义区块</button>
              <button className="btn-primary" disabled={recognized.length === 0} onClick={() => onApply(recognized, 'replace')}>替换自定义区块</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
