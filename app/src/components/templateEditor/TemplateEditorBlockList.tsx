import { useState } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { CustomBlock, FixedBlock } from '../../../shared/aiReview/sectionConfig';
import { SortableBlockRow } from './SortableBlockRow';
import { TemplateBlockControls, TemplateBlockPromptInput } from './TemplateBlockControls';
import { type VisualBlock, visualKey } from './templateEditorModel';

export function TemplateEditorBlockList({
  isDaily,
  dailyBlocks,
  customBlocks,
  expandedPromptIds,
  onRenameFixed,
  onUpdateBlock,
  onDeleteBlock,
  onTogglePrompt,
  onMove,
}: {
  isDaily: boolean;
  dailyBlocks: VisualBlock[];
  customBlocks: CustomBlock[];
  expandedPromptIds: Set<string>;
  onRenameFixed: (id: FixedBlock['id'], name: string) => void;
  onUpdateBlock: (id: string, patch: Partial<CustomBlock>) => void;
  onDeleteBlock: (id: string) => void;
  onTogglePrompt: (id: string) => void;
  onMove: (from: number, to: number) => void;
}) {
  const [isDragActive, setIsDragActive] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const items = isDaily ? dailyBlocks.map(visualKey) : customBlocks.map((block) => block.id);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setIsDragActive(false);
    if (!over || active.id === over.id) return;
    const from = items.indexOf(String(active.id));
    const to = items.indexOf(String(over.id));
    if (from !== -1 && to !== -1) onMove(from, to);
  };

  return (
    <section className="template-editor-block-list">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={() => setIsDragActive(true)}
        onDragCancel={() => setIsDragActive(false)}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {isDaily
            ? dailyBlocks.map((item) => (
              <SortableBlockRow key={visualKey(item)} sortableId={visualKey(item)} isDragActive={isDragActive}>
                {(dragHandle) => <>
                  {dragHandle}
                  <input className="block-name-input" value={item.type === 'fixed' ? item.block.displayName : item.block.name} onChange={(event) => {
                    if (item.type === 'fixed') onRenameFixed(item.block.id, event.target.value);
                    else onUpdateBlock(item.block.id, { name: event.target.value });
                  }} />
                  {item.type === 'custom' && <>
                    <TemplateBlockControls block={item.block} promptExpanded={expandedPromptIds.has(item.block.id)} onUpdate={onUpdateBlock} onDelete={onDeleteBlock} onTogglePrompt={onTogglePrompt} />
                    <TemplateBlockPromptInput block={item.block} expanded={expandedPromptIds.has(item.block.id)} onUpdate={onUpdateBlock} />
                  </>}
                </>}
              </SortableBlockRow>
            ))
            : customBlocks.map((block) => (
              <SortableBlockRow key={block.id} sortableId={block.id} isDragActive={isDragActive}>
                {(dragHandle) => <>
                  {dragHandle}
                  <input className="block-name-input" value={block.name} onChange={(event) => onUpdateBlock(block.id, { name: event.target.value })} />
                  <TemplateBlockControls block={block} promptExpanded={expandedPromptIds.has(block.id)} onUpdate={onUpdateBlock} onDelete={onDeleteBlock} onTogglePrompt={onTogglePrompt} />
                  <TemplateBlockPromptInput block={block} expanded={expandedPromptIds.has(block.id)} onUpdate={onUpdateBlock} />
                </>}
              </SortableBlockRow>
            ))}
        </SortableContext>
      </DndContext>
    </section>
  );
}
