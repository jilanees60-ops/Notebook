import React from 'react';
import { Block } from '../../../types/notebook';

interface DividerBlockProps {
  block: Block;
}

export const DividerBlock: React.FC<DividerBlockProps> = () => {
  return (
    <div className="w-full py-4 my-1 flex items-center justify-center">
      <div className="w-full border-t border-slate-200 dark:border-slate-800" />
    </div>
  );
};
