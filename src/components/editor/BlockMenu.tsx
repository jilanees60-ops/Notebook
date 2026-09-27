import React from 'react';
import { BlockType } from '../../types/notebook';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  CheckSquare,
  Table as TableIcon,
  Code2,
  Quote,
  Image as ImageIcon,
  Paperclip,
  PenTool,
  Minus,
  Info,
} from 'lucide-react';

interface BlockMenuProps {
  onSelect: (type: BlockType) => void;
  onClose: () => void;
  filterText?: string;
}

interface BlockMenuItem {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const MENU_ITEMS: BlockMenuItem[] = [
  { type: 'text', label: 'Text', description: 'Plain text with rich inline formatting', icon: Type },
  { type: 'heading1', label: 'Heading 1', description: 'Large section heading', icon: Heading1 },
  { type: 'heading2', label: 'Heading 2', description: 'Medium section heading', icon: Heading2 },
  { type: 'heading3', label: 'Heading 3', description: 'Small section heading', icon: Heading3 },
  { type: 'checklist', label: 'Checklist', description: 'Track tasks with priorities & due dates', icon: CheckSquare },
  { type: 'table', label: 'Table', description: 'Editable data table with rows & columns', icon: TableIcon },
  { type: 'code', label: 'Code Block', description: 'Syntax highlighted code snippet', icon: Code2 },
  { type: 'callout', label: 'Callout', description: 'Highlight important tips or alerts', icon: Info },
  { type: 'quote', label: 'Quote', description: 'Capture a quote or citation', icon: Quote },
  { type: 'image', label: 'Image', description: 'Upload or link an image', icon: ImageIcon },
  { type: 'file', label: 'File Attachment', description: 'Attach PDF, spreadsheet, or doc', icon: Paperclip },
  { type: 'drawing', label: 'Drawing Canvas', description: 'Digital ink sketchpad and notes', icon: PenTool },
  { type: 'divider', label: 'Divider', description: 'Visual horizontal separator', icon: Minus },
];

export const BlockMenu: React.FC<BlockMenuProps> = ({ onSelect, onClose, filterText = '' }) => {
  const filtered = MENU_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(filterText.toLowerCase()) ||
      item.description.toLowerCase().includes(filterText.toLowerCase())
  );

  return (
    <div className="absolute z-50 mt-1 w-72 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-1.5 max-h-80 overflow-y-auto">
      <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        Insert Block
      </div>
      <div className="space-y-0.5">
        {filtered.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              type="button"
              onClick={() => {
                onSelect(item.type);
                onClose();
              }}
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-left hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
            >
              <div className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400 transition-colors">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-3 text-center text-xs text-slate-400">No matching block found</div>
        )}
      </div>
    </div>
  );
};
