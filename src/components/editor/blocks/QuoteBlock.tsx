import React from 'react';
import { Block } from '../../../types/notebook';
import { Quote } from 'lucide-react';

interface QuoteBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, block: Block) => void;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({ block, onUpdate, onKeyDown }) => {
  return (
    <div className="w-full my-2.5 flex items-start gap-3 pl-3 border-l-4 border-indigo-500/80 bg-indigo-50/20 dark:bg-indigo-950/20 py-2 pr-3 rounded-r-lg">
      <Quote className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={(e) => onUpdate((e.target as HTMLDivElement).innerText, block.metadata)}
          onKeyDown={(e) => onKeyDown(e, block)}
          data-placeholder="Enter quote or note..."
          className="w-full italic text-slate-700 dark:text-slate-300 text-sm leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:not-italic"
        >
          {block.content}
        </div>
      </div>
    </div>
  );
};
