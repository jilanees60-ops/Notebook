import React, { useRef, useEffect } from 'react';
import { Block, BlockType } from '../../../types/notebook';

interface TextBlockProps {
  block: Block;
  onUpdate: (content: string, metadata?: any) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, block: Block) => void;
  onTransformType?: (blockId: string, newType: BlockType, content: string) => void;
  isFocused?: boolean;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  block,
  onUpdate,
  onKeyDown,
  onTransformType,
  isFocused,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const align = block.metadata?.align || 'left';

  // Only sync DOM when block ID changes or if external content drastically changed and not active element
  useEffect(() => {
    if (contentRef.current) {
      if (document.activeElement !== contentRef.current) {
        if (contentRef.current.innerHTML !== block.content) {
          contentRef.current.innerHTML = block.content;
        }
      }
    }
  }, [block.id]);

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  const handleInput = () => {
    if (!contentRef.current) return;
    const text = contentRef.current.innerText || '';
    const html = contentRef.current.innerHTML;

    // Check markdown shortcuts
    if (onTransformType) {
      if (text.startsWith('# ') || text === '#') {
        onTransformType(block.id, 'heading1', text.replace(/^#\s?/, ''));
        return;
      }
      if (text.startsWith('## ') || text === '##') {
        onTransformType(block.id, 'heading2', text.replace(/^##\s?/, ''));
        return;
      }
      if (text.startsWith('### ') || text === '###') {
        onTransformType(block.id, 'heading3', text.replace(/^###\s?/, ''));
        return;
      }
      if (text.startsWith('[] ') || text.startsWith('[ ] ')) {
        onTransformType(block.id, 'checklist', text.replace(/^\[\s?\]\s?/, ''));
        return;
      }
      if (text.startsWith('> ') || text === '>') {
        onTransformType(block.id, 'quote', text.replace(/^>\s?/, ''));
        return;
      }
      if (text.startsWith('```')) {
        onTransformType(block.id, 'code', text.replace(/^```/, ''));
        return;
      }
      if (text.startsWith('--- ') || text === '---') {
        onTransformType(block.id, 'divider', '');
        return;
      }
    }

    onUpdate(html);
  };

  const alignClass =
    align === 'center'
      ? 'text-center'
      : align === 'right'
      ? 'text-right'
      : 'text-left';

  return (
    <div className="relative group w-full">
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => onKeyDown(e, block)}
        data-placeholder="Start writing..."
        className={`w-full text-slate-800 dark:text-slate-100 outline-none leading-relaxed text-[15px] min-h-[1.5rem] py-0.5 whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 dark:empty:before:text-slate-600 empty:before:pointer-events-none ${alignClass}`}
      />
    </div>
  );
};
