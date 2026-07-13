import { useMemo, useState } from 'react';
import { Task } from '../../types/task';
import type { CloseTaskMenu, DispatchTaskMenuUpdate } from './TaskMenuPopupPanes';
import { TaskMenuPopupPaneHeader } from './TaskMenuPopupPaneHeader';

export function getTagSuggestions(allTags: string[], selectedTags: string[], input: string) {
  return getTagSuggestionsFromSet(allTags, new Set(selectedTags), input);
}

function getTagSuggestionsFromSet(allTags: string[], selectedTagSet: ReadonlySet<string>, input: string) {
  const normalizedInput = input.toLowerCase();
  return allTags.filter((tag) => !selectedTagSet.has(tag) && tag.toLowerCase().includes(normalizedInput));
}

export function TagPane({ task, allTags, onBack, onDispatch, onClose }: { task: Task; allTags: string[]; onBack: () => void; onDispatch: DispatchTaskMenuUpdate; onClose: CloseTaskMenu }) {
  const [input, setInput] = useState('');
  const [tags, setTags] = useState(task.tags || []);
  const selectedTagSet = useMemo(() => new Set(tags), [tags]);
  const parseTags = (value: string) => value
    .split(/[,\s]+/)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
  const mergeTags = (current: string[], incoming: string[]) => Array.from(new Set([...current, ...incoming]));
  const addTags = (value: string) => {
    const nextTags = parseTags(value);
    if (nextTags.length) setTags((current) => mergeTags(current, nextTags));
  };
  const save = () => {
    const nextTags = mergeTags(tags, parseTags(input));
    onDispatch(task.id, { tags: nextTags.length > 0 ? nextTags : undefined });
    onClose();
  };
  const suggestions = getTagSuggestionsFromSet(allTags, selectedTagSet, input);

  return (
    <>
      <TaskMenuPopupPaneHeader title="标签" onBack={onBack} />
      <div className="tm-tag-body">
        {tags.length > 0 && <div className="tm-tag-chips">{tags.map((tag) => <span key={tag} className="tm-chip">{tag}<button type="button" className="tm-chip-x" aria-label={`移除 ${tag}`} onClick={() => setTags(tags.filter((current) => current !== tag))}>×</button></span>)}</div>}
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') {
              event.preventDefault();
              addTags(input);
              setInput('');
            } else if (event.key === 'Escape') save();
          }}
          placeholder="输入标签，回车添加"
          className="tm-input"
          autoFocus
        />
        {suggestions.length > 0 && <div className="tm-suggest">{suggestions.slice(0, 6).map((tag) => <button key={tag} type="button" className="tm-suggest-chip" onClick={() => { addTags(tag); setInput(''); }}>{tag}</button>)}</div>}
      </div>
      <div className="tm-footer"><button type="button" className="tm-btn-primary" onClick={save}>保存</button></div>
    </>
  );
}
