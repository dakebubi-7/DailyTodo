import { useEffect, useRef } from 'react';
import {
  createDefaultInputKeybindingSettings,
  type InputKeybindingSettings,
} from '../../../shared/inputKeybindings';
import { useMarkdownEditor } from '../../hooks/useMarkdownEditor';

export function TaskCompletionMarkdownField({
  label,
  value,
  placeholder,
  onChange,
  resetKey,
  inputKeybindings = createDefaultInputKeybindingSettings(),
  onSubmit,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  resetKey: string;
  inputKeybindings?: InputKeybindingSettings;
  onSubmit?: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editor = useMarkdownEditor({
    value,
    onChange,
    textareaRef,
    inputKeybindings,
    scope: 'completion-note',
    onSubmit,
  });

  useEffect(() => {
    editor.resetHistory(value, value.length);
    // Reset only when switching tasks; editor records ordinary value updates itself.
  }, [resetKey]);

  return (
    <label className="completion-field mt-2">
      {label}
      <div className="completion-input-shell">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => editor.handleChange(event.target.value, event.currentTarget.selectionStart)}
          onCompositionEnd={(event) => editor.handleChange(event.currentTarget.value, event.currentTarget.selectionStart)}
          onKeyDown={editor.onKeyDown}
          placeholder={placeholder}
        />
      </div>
    </label>
  );
}
