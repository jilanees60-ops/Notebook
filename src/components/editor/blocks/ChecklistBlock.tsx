import React, { useState } from 'react';
import { Block, ChecklistItem } from '../../../types/notebook';
import { Check, Plus, Trash2, Calendar, Flag, CheckCircle2 } from 'lucide-react';

interface ChecklistBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onDeleteBlock?: () => void;
}

export const ChecklistBlock: React.FC<ChecklistBlockProps> = ({
  block,
  onUpdate,
}) => {
  const items: ChecklistItem[] = block.metadata?.checklistItems || [
    { id: 'ci_1', text: 'New task', completed: false, priority: 'medium' },
  ];

  const [newItemText, setNewItemText] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const updateItems = (newItems: ChecklistItem[]) => {
    onUpdate(block.content, {
      ...block.metadata,
      checklistItems: newItems,
    });
  };

  const toggleItem = (id: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    updateItems(updated);
  };

  const updateItemText = (id: string, text: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, text } : item
    );
    updateItems(updated);
  };

  const removeItem = (id: string) => {
    const updated = items.filter((item) => item.id !== id);
    updateItems(updated);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem: ChecklistItem = {
      id: 'ci_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      text: newItemText.trim(),
      completed: false,
      priority: 'medium',
    };
    updateItems([...items, newItem]);
    setNewItemText('');
  };

  const cyclePriority = (id: string) => {
    const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const updated = items.map((item) => {
      if (item.id === id) {
        const currentIndex = priorities.indexOf(item.priority || 'medium');
        const nextPriority = priorities[(currentIndex + 1) % priorities.length];
        return { ...item, priority: nextPriority };
      }
      return item;
    });
    updateItems(updated);
  };

  const updateDueDate = (id: string, date: string) => {
    const updated = items.map((item) =>
      item.id === id ? { ...item, dueDate: date } : item
    );
    updateItems(updated);
  };

  return (
    <div className="w-full my-2 p-3.5 bg-slate-50/70 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800">
      {/* Title & Progress Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <input
            type="text"
            value={block.content || 'Checklist'}
            onChange={(e) => onUpdate(e.target.value, block.metadata)}
            placeholder="Checklist Title"
            className="font-semibold text-sm text-slate-800 dark:text-slate-100 bg-transparent border-none outline-none focus:ring-0"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="font-mono tabular-nums">{completedCount}/{totalCount} completed</span>
          <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
            {progressPercent}%
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Checklist items list */}
      <div className="space-y-1.5">
        {items.map((item) => {
          const isCompleted = item.completed;
          const priorityColor =
            item.priority === 'high'
              ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40'
              : item.priority === 'low'
              ? 'text-sky-500 bg-sky-50 dark:bg-sky-950/40'
              : 'text-amber-500 bg-amber-50 dark:bg-amber-950/40';

          return (
            <div
              key={item.id}
              className={`group flex items-center justify-between gap-2 p-1.5 rounded-lg transition-colors ${
                isCompleted
                  ? 'bg-slate-100/50 dark:bg-slate-800/30'
                  : 'hover:bg-white dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                {/* Custom Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                    isCompleted
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'border border-slate-300 dark:border-slate-600 hover:border-emerald-400 bg-white dark:bg-slate-900'
                  }`}
                >
                  {isCompleted && <Check className="w-3 h-3 stroke-[3]" />}
                </button>

                {/* Text Content */}
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateItemText(item.id, e.target.value)}
                  onFocus={() => setEditingItemId(item.id)}
                  onBlur={() => setEditingItemId(null)}
                  className={`text-sm flex-1 bg-transparent border-none outline-none ${
                    isCompleted
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                />
              </div>

              {/* Priority & Due Date & Delete action controls */}
              <div className="flex items-center gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                {/* Priority Flag */}
                <button
                  type="button"
                  onClick={() => cyclePriority(item.id)}
                  title={`Priority: ${item.priority || 'medium'} (Click to cycle)`}
                  className={`px-1.5 py-0.5 rounded text-[11px] font-medium flex items-center gap-1 transition-colors ${priorityColor}`}
                >
                  <Flag className="w-2.5 h-2.5" />
                  <span className="capitalize">{item.priority || 'medium'}</span>
                </button>

                {/* Due Date */}
                <div className="relative flex items-center">
                  <input
                    type="date"
                    value={item.dueDate || ''}
                    onChange={(e) => updateDueDate(item.id, e.target.value)}
                    className="text-[11px] text-slate-500 bg-transparent border-0 py-0.5 px-1 cursor-pointer focus:ring-0"
                    title="Set Due Date"
                  />
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Item Input */}
      <div className="mt-3 flex items-center gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
        <Plus className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="Add a new item (Press Enter)..."
          className="text-sm flex-1 bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
        />
        {newItemText && (
          <button
            type="button"
            onClick={addItem}
            className="text-xs px-2.5 py-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-md font-medium"
          >
            Add
          </button>
        )}
      </div>
    </div>
  );
};
