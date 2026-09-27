import React, { useRef, useEffect } from 'react';
import { Block } from '../../../types/notebook';

interface HeadingBlockProps {
  block: Block;
  onUpdate: (content: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>, block: Block) => void;
  isFocused?: boolean;
}

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  onUpdate,
  onKeyDown,
  isFocused,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current && contentRef.current.innerText !== block.content) {
      contentRef.current.innerText = block.content;
    }
  }, [block.id]);

  useEffect(() => {
    if (isFocused && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isFocused]);

  const handleInput = () => {
    if (contentRef.current) {
      onUpdate(contentRef.current.innerText);
    }
  };

  const getStyleClasses = () => {
    switch (block.type) {
      case 'heading1':
        return 'text-2xl font-bold text-slate-900 dark:text-white pt-3 pb-1 tracking-tight';
      case 'heading2':
        return 'text-xl font-semibold text-slate-800 dark:text-slate-100 pt-2 pb-1 tracking-tight';
      case 'heading3':
        return 'text-lg font-semibold text-slate-800 dark:text-slate-200 pt-1 pb-0.5';
      default:
        return 'text-xl font-bold';
    }
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Heading 1';
      case 'heading2':
        return 'Heading 2';
      case 'heading3':
        return 'Heading 3';
      default:
        return 'Heading';
    }
  };

  return (
    <div className="relative group w-full">
      <div
        ref={contentRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={(e) => onKeyDown(e, block)}
        data-placeholder={getPlaceholder()}
        className={`w-full outline-none whitespace-pre-wrap break-words empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300 dark:empty:before:text-slate-600 empty:before:pointer-events-none ${getStyleClasses()}`}
      />
    </div>
  );
};
