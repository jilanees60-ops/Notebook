import React from 'react';
import { Block } from '../../../types/notebook';
import { Info, AlertTriangle, Lightbulb, Bookmark } from 'lucide-react';

interface CalloutBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, block: Block) => void;
}

export const CalloutBlock: React.FC<CalloutBlockProps> = ({ block, onUpdate, onKeyDown }) => {
  const calloutType = block.metadata?.calloutType || 'info';

  const types = [
    { id: 'info', icon: Info, bg: 'bg-sky-50 dark:bg-sky-950/40', border: 'border-sky-300 dark:border-sky-800', text: 'text-sky-600 dark:text-sky-400' },
    { id: 'tip', icon: Lightbulb, bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-300 dark:border-emerald-800', text: 'text-emerald-600 dark:text-emerald-400' },
    { id: 'warning', icon: AlertTriangle, bg: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-amber-300 dark:border-amber-800', text: 'text-amber-600 dark:text-amber-400' },
    { id: 'note', icon: Bookmark, bg: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-violet-300 dark:border-violet-800', text: 'text-violet-600 dark:text-violet-400' },
  ];

  const currentConfig = types.find((t) => t.id === calloutType) || types[0];
  const IconComponent = currentConfig.icon;

  const cycleType = () => {
    const ids = types.map((t) => t.id);
    const nextIdx = (ids.indexOf(calloutType) + 1) % ids.length;
    onUpdate(block.content, {
      ...block.metadata,
      calloutType: ids[nextIdx],
    });
  };

  return (
    <div
      className={`w-full my-3 p-3.5 rounded-xl border ${currentConfig.border} ${currentConfig.bg} flex items-start gap-3 transition-colors`}
    >
      <button
        type="button"
        onClick={cycleType}
        title="Click to change callout type"
        className={`p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors shrink-0 mt-0.5 ${currentConfig.text}`}
      >
        <IconComponent className="w-4 h-4" />
      </button>

      <div className="flex-1 min-w-0">
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onUpdate((e.target as HTMLDivElement).innerText, block.metadata)}
          onKeyDown={(e) => onKeyDown(e, block)}
          data-placeholder="Important takeaway or callout message..."
          className="w-full text-sm text-slate-800 dark:text-slate-200 outline-none leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400"
        >
          {block.content}
        </div>
      </div>
    </div>
  );
};
