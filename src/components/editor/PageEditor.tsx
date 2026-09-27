import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { Block, BlockType, PaperStyle } from '../../types/notebook';
import { TextBlock } from './blocks/TextBlock';
import { HeadingBlock } from './blocks/HeadingBlock';
import { ChecklistBlock } from './blocks/ChecklistBlock';
import { TableBlock } from './blocks/TableBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { FileBlock } from './blocks/FileBlock';
import { DrawingBlock } from './blocks/DrawingBlock';
import { DividerBlock } from './blocks/DividerBlock';
import { EditorToolbar } from './EditorToolbar';
import { SectionHeaderBar } from '../navigation/SectionHeaderBar';
import { PageTabsBar } from '../navigation/PageTabsBar';
import { BlockMenu } from './BlockMenu';
import { copyBlocksToClipboard, processClipboardPaste } from '../../lib/editor/clipboard';
import { uploadAsset } from '../../services/supabase/client';
import {
  GripVertical,
  Plus,
  Trash2,
  FileText,
  X,
  Clock,
  Calendar,
} from 'lucide-react';

interface PageEditorProps {
  onOpenVersionHistory: () => void;
  onOpenGlobalSearch: () => void;
  onToggleFocusMode?: () => void;
  isFocusMode?: boolean;
}

export const PageEditor: React.FC<PageEditorProps> = ({
  onOpenVersionHistory,
  onOpenGlobalSearch,
  onToggleFocusMode,
  isFocusMode,
}) => {
  const {
    activeNotebook,
    activeSection,
    activePage,
    blocks,
    currentUser,
    updatePage,
    addBlock,
    insertBlocks,
    updateBlock,
    deleteBlock,
    reorderBlocks,
    duplicatePage,
    deletePage,
    triggerManualSync,
  } = useNotebook();

  const [activeMenuBlockIndex, setActiveMenuBlockIndex] = useState<number | null>(null);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const [dropTargetBlockId, setDropTargetBlockId] = useState<string | null>(null);
  const [showPageInfoModal, setShowPageInfoModal] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Focus title input helper
  const focusTitle = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  };

  // Compute word and character counts
  const { wordCount, charCount } = useMemo(() => {
    let words = (activePage?.title || '').trim().split(/\s+/).filter(Boolean).length;
    let chars = (activePage?.title || '').length;

    for (const b of blocks) {
      if (b.content) {
        const clean = b.content.replace(/<[^>]+>/g, ' ').trim();
        words += clean.split(/\s+/).filter(Boolean).length;
        chars += clean.length;
      }
      if (b.type === 'checklist' && b.metadata?.checklistItems) {
        for (const item of b.metadata.checklistItems) {
          words += item.text.trim().split(/\s+/).filter(Boolean).length;
          chars += item.text.length;
        }
      }
    }
    return { wordCount: words, charCount: chars };
  }, [activePage?.title, blocks]);

  // Global Keyboard shortcuts & copy handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S: Manual sync
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        triggerManualSync();
      }
      // Ctrl+K: Global search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenGlobalSearch();
      }
      // Ctrl+Shift+C: Copy entire note to OneNote/Word/Email
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        if (activePage) {
          copyBlocksToClipboard(blocks, activePage.title);
        }
      }
      // Ctrl+Shift+F: Toggle Focus Mode
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        if (onToggleFocusMode) {
          onToggleFocusMode();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerManualSync, onOpenGlobalSearch, activePage, blocks, onToggleFocusMode]);

  // Copy entire page handler
  const handleCopyPage = async () => {
    if (!activePage) return;
    await copyBlocksToClipboard(blocks, activePage.title);
  };

  // Clipboard Paste handler on Editor Canvas
  const handlePaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    if (!activePage) return;

    // Check if the user pressed Ctrl+Shift+V or if event contains rich content
    const handled = await processClipboardPaste(e, {
      userId: currentUser?.id || 'local_user',
      pageId: activePage.id,
      insertPosition: blocks.length,
      onInsertBlocks: async (newBlocks) => {
        await insertBlocks(newBlocks);
      },
      onUploadImage: async (file) => {
        const res = await uploadAsset(file, 'images');
        return res.url;
      },
    });

    if (handled) {
      e.preventDefault();
    }
  };

  // Drag and drop block reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedBlockId(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedBlockId && draggedBlockId !== id) {
      setDropTargetBlockId(id);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedBlockId || draggedBlockId === targetId) return;

    const currentIds = blocks.map((b) => b.id);
    const fromIndex = currentIds.indexOf(draggedBlockId);
    const toIndex = currentIds.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const reordered = [...currentIds];
      reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, draggedBlockId);
      await reorderBlocks(reordered);
    }

    setDraggedBlockId(null);
    setDropTargetBlockId(null);
  };

  const handleBlockKeyDown = async (
    e: React.KeyboardEvent<HTMLDivElement>,
    block: Block
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (block.type === 'text' || block.type.startsWith('heading')) {
        e.preventDefault();
        const currentIdx = blocks.findIndex((b) => b.id === block.id);
        await addBlock('text', currentIdx + 1);
      }
    } else if (e.key === 'Backspace' && (!block.content || block.content === '<br>' || block.content === '')) {
      if (blocks.length > 1) {
        e.preventDefault();
        await deleteBlock(block.id);
      }
    }
  };

  const handleTransformType = async (blockId: string, newType: BlockType, content: string) => {
    const target = blocks.find((b) => b.id === blockId);
    if (target) {
      target.type = newType;
      await updateBlock(blockId, content);
    }
  };

  const renderBlock = (block: Block, index: number) => {
    switch (block.type) {
      case 'heading1':
      case 'heading2':
      case 'heading3':
        return (
          <HeadingBlock
            block={block}
            onUpdate={(val) => updateBlock(block.id, val)}
            onKeyDown={handleBlockKeyDown}
          />
        );
      case 'checklist':
        return (
          <ChecklistBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onDeleteBlock={() => deleteBlock(block.id)}
          />
        );
      case 'table':
        return (
          <TableBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
          />
        );
      case 'code':
        return (
          <CodeBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
          />
        );
      case 'quote':
        return (
          <QuoteBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onKeyDown={handleBlockKeyDown}
          />
        );
      case 'callout':
        return (
          <CalloutBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onKeyDown={handleBlockKeyDown}
          />
        );
      case 'image':
        return (
          <ImageBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onDeleteBlock={() => deleteBlock(block.id)}
          />
        );
      case 'file':
        return (
          <FileBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onDeleteBlock={() => deleteBlock(block.id)}
          />
        );
      case 'drawing':
        return (
          <DrawingBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onDeleteBlock={() => deleteBlock(block.id)}
          />
        );
      case 'divider':
        return <DividerBlock block={block} />;
      case 'text':
      default:
        return (
          <TextBlock
            block={block}
            onUpdate={(val, meta) => updateBlock(block.id, val, meta)}
            onKeyDown={handleBlockKeyDown}
            onTransformType={handleTransformType}
          />
        );
    }
  };

  const paperStyle = activePage?.paper_style || 'blank';
  const paperClass =
    paperStyle === 'ruled'
      ? 'bg-ruled-pattern'
      : paperStyle === 'grid'
      ? 'bg-grid-pattern'
      : paperStyle === 'dots'
      ? 'bg-dots-pattern'
      : '';

  return (
    <div
      onPaste={handlePaste}
      className="flex-1 flex flex-col h-full bg-white dark:bg-slate-950 overflow-hidden select-text"
    >
      {/* 1. Section Header: SECTION: 💡 Ideas & Inspiration      + Section */}
      <SectionHeaderBar />

      {/* 2. Top Horizontal Page Tabs: Welcome │ Startup Ideas │ Untitled Page │ + Page */}
      <PageTabsBar
        onOpenVersionHistory={onOpenVersionHistory}
        onFocusTitle={focusTitle}
      />

      {/* 3. Minimal Editor Toolbar Ribbon */}
      <EditorToolbar
        onInsertBlock={(type) => addBlock(type)}
        currentPaperStyle={paperStyle}
        onChangePaperStyle={(style: PaperStyle) => {
          if (activePage) updatePage(activePage.id, { paper_style: style });
        }}
        onOpenVersionHistory={onOpenVersionHistory}
        onCopyPage={handleCopyPage}
        onRenamePage={focusTitle}
        onDuplicatePage={() => {
          if (activePage) duplicatePage(activePage.id);
        }}
        onDeletePage={() => {
          if (activePage && confirm(`Move "${activePage.title}" to Trash?`)) {
            deletePage(activePage.id);
          }
        }}
        onToggleFavorite={() => {
          if (activePage) updatePage(activePage.id, { is_favorite: !activePage.is_favorite });
        }}
        onOpenPageInfo={() => setShowPageInfoModal(true)}
        isFavorite={activePage?.is_favorite}
      />

      {/* 4. Main Writing Canvas Scroll Area */}
      {!activePage ? (
        <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-950 select-none">
          <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
            <FileText className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-1">
            No Page Selected
          </h3>
          <p className="text-xs text-slate-400 max-w-xs">
            Select a page tab above or click "+ Page" to start writing.
          </p>
        </div>
      ) : (
        <div
          ref={containerRef}
          onClick={(e) => {
            if (e.target === containerRef.current) {
              addBlock('text');
            }
          }}
          className={`flex-1 overflow-y-auto px-6 sm:px-12 md:px-16 lg:px-24 py-8 transition-colors cursor-text ${paperClass}`}
        >
          <div className="max-w-4xl mx-auto">
            {/* Page Title (Large, Seamless, Clean) */}
            <input
              ref={titleInputRef}
              type="text"
              value={activePage.title}
              onChange={(e) => updatePage(activePage.id, { title: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (blocks.length === 0) {
                    addBlock('text');
                  }
                }
              }}
              placeholder="Untitled Page"
              className="w-full text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white bg-transparent border-none outline-none placeholder:text-slate-300 dark:placeholder:text-slate-700 tracking-tight leading-tight mb-6"
            />

            {/* Document Blocks List (Natural document flow, no block card borders) */}
            <div className="space-y-0.5 relative">
              {blocks.map((block, index) => {
                const isDropTarget = dropTargetBlockId === block.id;

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, block.id)}
                    onDragOver={(e) => handleDragOver(e, block.id)}
                    onDrop={(e) => handleDrop(e, block.id)}
                    className={`relative group/block flex items-start gap-1 py-0.5 transition-all ${
                      isDropTarget ? 'border-t-2 border-indigo-500' : ''
                    }`}
                  >
                    {/* Left Subtle Hover Handle: Add Block & Drag */}
                    <div className="opacity-0 group-hover/block:opacity-100 flex items-center gap-0.5 pt-1 shrink-0 select-none transition-opacity -ml-6 pr-1">
                      <button
                        type="button"
                        onClick={() =>
                          setActiveMenuBlockIndex(
                            activeMenuBlockIndex === index ? null : index
                          )
                        }
                        className="p-0.5 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Insert block"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <div
                        className="p-0.5 rounded text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing transition-colors"
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Rendered Block Content */}
                    <div className="flex-1 min-w-0">
                      {renderBlock(block, index)}
                    </div>

                    {/* Right Subtle Hover: Delete Block */}
                    <div className="opacity-0 group-hover/block:opacity-100 pt-1 shrink-0 transition-opacity">
                      <button
                        type="button"
                        onClick={() => deleteBlock(block.id)}
                        className="p-0.5 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Delete block"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Insert Block Dropdown Menu */}
                    {activeMenuBlockIndex === index && (
                      <div className="absolute left-6 top-8 z-50">
                        <BlockMenu
                          onSelect={(type) => {
                            addBlock(type, index + 1);
                            setActiveMenuBlockIndex(null);
                          }}
                          onClose={() => setActiveMenuBlockIndex(null)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Click-to-write zone */}
              <div
                onClick={() => addBlock('text')}
                className="py-16 cursor-text min-h-[180px]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Page Info Modal (Opened via ⋯ More Menu) */}
      {showPageInfoModal && activePage && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 w-80 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Page Info</h4>
              <button
                type="button"
                onClick={() => setShowPageInfoModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <p className="text-[10px] uppercase font-semibold text-slate-400">Title</p>
                <p className="font-medium text-slate-900 dark:text-white">{activePage.title || 'Untitled Page'}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-700">
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Words</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{wordCount}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-semibold text-slate-400">Characters</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{charCount}</p>
                </div>
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Created: {new Date(activePage.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Updated: {new Date(activePage.updated_at).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowPageInfoModal(false)}
                className="px-3 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
