import React, { useState, useRef, useEffect } from 'react';
import { BlockType, PaperStyle } from '../../types/notebook';
import {
  Undo2,
  Redo2,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Link2,
  Image as ImageIcon,
  MoreHorizontal,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  Table as TableIcon,
  Code2,
  PenTool,
  Paperclip,
  Info,
  History,
  Copy,
  Trash2,
  Star,
  FolderInput,
  Edit2,
  Square,
  AlignJustify,
  Grid,
} from 'lucide-react';

interface EditorToolbarProps {
  onInsertBlock: (type: BlockType) => void;
  currentPaperStyle: PaperStyle;
  onChangePaperStyle: (style: PaperStyle) => void;
  onOpenVersionHistory: () => void;
  onCopyPage?: () => void;
  onRenamePage?: () => void;
  onDuplicatePage?: () => void;
  onMovePage?: () => void;
  onDeletePage?: () => void;
  onToggleFavorite?: () => void;
  onOpenPageInfo?: () => void;
  isFavorite?: boolean;
}

const TEXT_COLORS = ['#0F172A', '#4F46E5', '#059669', '#E11D48', '#D97706', '#0284C7', '#7C3AED'];
const HIGHLIGHT_COLORS = ['transparent', '#FEF08A', '#BBF7D0', '#BAE6FD', '#FBCFE8', '#FED7AA'];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onInsertBlock,
  currentPaperStyle,
  onChangePaperStyle,
  onOpenVersionHistory,
  onCopyPage,
  onRenamePage,
  onDuplicatePage,
  onMovePage,
  onDeletePage,
  onToggleFavorite,
  onOpenPageInfo,
  isFavorite,
}) => {
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTextColor, setShowTextColor] = useState(false);
  const [showHighlightColor, setShowHighlightColor] = useState(false);

  const formatRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (formatRef.current && !formatRef.current.contains(e.target as Node)) {
        setShowFormatMenu(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter web link URL (https://...):');
    if (url) {
      applyFormat('createLink', url);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onInsertBlock('image');
    }
  };

  return (
    <div className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-xs border-b border-slate-200/80 dark:border-slate-800/80 px-3 py-1 flex items-center justify-between gap-2 overflow-x-auto no-scrollbar select-none text-xs">
      <div className="flex items-center gap-0.5 shrink-0">
        {/* 1. Undo */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('undo');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        {/* 2. Redo */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('redo');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* 3. Format Menu Dropdown */}
        <div className="relative" ref={formatRef}>
          <button
            type="button"
            onClick={() => setShowFormatMenu(!showFormatMenu)}
            className="flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-200 font-medium transition-colors"
            title="Text formatting & styles"
          >
            <span>Format</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showFormatMenu && (
            <div className="absolute left-0 mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              {/* Headings */}
              <div className="space-y-0.5 pb-1 mb-1 border-b border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => {
                    onInsertBlock('heading1');
                    setShowFormatMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-left"
                >
                  <Heading1 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Heading 1</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onInsertBlock('heading2');
                    setShowFormatMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-left"
                >
                  <Heading2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Heading 2</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onInsertBlock('heading3');
                    setShowFormatMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-medium text-left"
                >
                  <Heading3 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Heading 3</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onInsertBlock('text');
                    setShowFormatMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <span>¶ Paragraph</span>
                </button>
              </div>

              {/* Text Alignment */}
              <div className="flex items-center justify-around py-1 mb-1 border-b border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('justifyLeft');
                  }}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Align Left"
                >
                  <AlignLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('justifyCenter');
                  }}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Align Center"
                >
                  <AlignCenter className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('justifyRight');
                  }}
                  className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                  title="Align Right"
                >
                  <AlignRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Strikethrough & Styles */}
              <div className="space-y-0.5 pb-1 mb-1 border-b border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyFormat('strikeThrough');
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 line-through text-left"
                >
                  <Strikethrough className="w-3.5 h-3.5 text-slate-400" />
                  <span>Strikethrough</span>
                </button>
              </div>

              {/* Color & Highlight Pickers */}
              <div className="space-y-1 py-1">
                <div>
                  <button
                    type="button"
                    onClick={() => setShowTextColor(!showTextColor)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Palette className="w-3.5 h-3.5 text-slate-400" />
                      <span>Text Color</span>
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {showTextColor && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyFormat('foreColor', c);
                          }}
                          style={{ backgroundColor: c }}
                          className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setShowHighlightColor(!showHighlightColor)}
                    className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                  >
                    <span className="flex items-center gap-2">
                      <Highlighter className="w-3.5 h-3.5 text-slate-400" />
                      <span>Highlight</span>
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </button>
                  {showHighlightColor && (
                    <div className="flex items-center gap-1.5 px-2 py-1.5">
                      {HIGHLIGHT_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyFormat('hiliteColor', c);
                          }}
                          style={{ backgroundColor: c === 'transparent' ? '#F1F5F9' : c }}
                          className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* 4. Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('bold');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-bold transition-colors"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        {/* 5. Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('italic');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 italic transition-colors"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        {/* 6. Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('underline');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 underline transition-colors"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* 7. Bullets */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('insertUnorderedList');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
          title="Bulleted List"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        {/* 8. Numbered list */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            applyFormat('insertOrderedList');
          }}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        {/* 9. Checklist */}
        <button
          type="button"
          onClick={() => onInsertBlock('checklist')}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-emerald-600 transition-colors"
          title="Checklist / To-Do"
        >
          <CheckSquare className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

        {/* 10. Link */}
        <button
          type="button"
          onClick={handleInsertLink}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
          title="Insert Link"
        >
          <Link2 className="w-3.5 h-3.5" />
        </button>

        {/* 11. Image */}
        <button
          type="button"
          onClick={() => onInsertBlock('image')}
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 transition-colors"
          title="Insert Image (or paste screenshot)"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 12. ⋯ More Menu */}
      <div className="relative shrink-0" ref={moreRef}>
        <button
          type="button"
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="flex items-center gap-1 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-600 dark:text-slate-300 transition-colors"
          title="More tools & page actions"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {showMoreMenu && (
          <div className="absolute right-0 mt-1 w-52 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
            {/* Rich Elements */}
            <div className="space-y-0.5 pb-1 mb-1 border-b border-slate-100 dark:border-slate-700">
              <button
                type="button"
                onClick={() => {
                  onInsertBlock('table');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <TableIcon className="w-3.5 h-3.5 text-sky-500" />
                <span>Insert Table</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onInsertBlock('code');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Insert Code Block</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onInsertBlock('drawing');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                <span>Digital Ink / Canvas</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onInsertBlock('file');
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <Paperclip className="w-3.5 h-3.5 text-violet-500" />
                <span>Attach File</span>
              </button>
            </div>

            {/* Paper Background Style */}
            <div className="px-2 py-1 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Paper Style</p>
              <div className="flex items-center gap-1">
                {(['blank', 'ruled', 'grid', 'dots'] as PaperStyle[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => {
                      onChangePaperStyle(st);
                      setShowMoreMenu(false);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] capitalize ${
                      currentPaperStyle === st
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Page Actions */}
            <div className="space-y-0.5 py-1">
              {onRenamePage && (
                <button
                  type="button"
                  onClick={() => {
                    onRenamePage();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename Page</span>
                </button>
              )}

              {onDuplicatePage && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicatePage();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duplicate Page</span>
                </button>
              )}

              {onMovePage && (
                <button
                  type="button"
                  onClick={() => {
                    onMovePage();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                  <span>Move Page</span>
                </button>
              )}

              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleFavorite();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Star className={`w-3.5 h-3.5 ${isFavorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>{isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                </button>
              )}

              {onCopyPage && (
                <button
                  type="button"
                  onClick={() => {
                    onCopyPage();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy Note to Clipboard</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onOpenVersionHistory();
                  setShowMoreMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>Version History</span>
              </button>

              {onOpenPageInfo && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenPageInfo();
                    setShowMoreMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-left"
                >
                  <Info className="w-3.5 h-3.5 text-slate-400" />
                  <span>Page Info</span>
                </button>
              )}

              {onDeletePage && (
                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => {
                      onDeletePage();
                      setShowMoreMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-1 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-left"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Page</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
