// app/src/components/TemplateRecognitionModal.tsx
import React, { useState, useRef } from 'react';
import type { CustomBlock, RenderType } from '../../shared/aiReview/sectionConfig';
import { parseRecognizedBlocks } from '../../shared/recognizeTemplateBlocks';

const RENDER_TYPE_LABELS: Record<RenderType, string> = {
  text: '纯文本', list: '列表', table: '表格', callout: 'Callout', dataview: 'Dataview',
};

interface Props {
  existingBlocks: CustomBlock[]; // current custom blocks (used as fallback)
  onApply: (blocks: CustomBlock[], mode: 'replace' | 'append') => void;
  onCancel: () => void;
}

type Step = 'input' | 'preview';

export function TemplateRecognitionModal({ existingBlocks, onApply, onCancel }: Props) {
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [recognized, setRecognized] = useState<CustomBlock[]>([]);
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
    reader.onload = (ev) => setText(ev.target?.result as string ?? '');
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
            {recognized.map((block) => (
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
                  onChange={(e) => updateRecognized(block.id, { renderType: e.target.value as RenderType })}
                >
                  {(Object.entries(RENDER_TYPE_LABELS) as [RenderType, string][]).map(([v, label]) => (
                    <option key={v} value={v}>{label}</option>
                  ))}
                </select>
              </div>
            ))}
            {error && <p className="recognition-error">{error}</p>}
            <div className="recognition-footer">
              <button onClick={() => setStep('input')}>重新识别</button>
              <button onClick={() => onApply(recognized, 'append')}>追加到自定义区块</button>
              <button className="btn-primary" onClick={() => onApply(recognized, 'replace')}>替换自定义区块</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
