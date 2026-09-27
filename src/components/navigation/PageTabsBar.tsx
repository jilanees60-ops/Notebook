import React, { useState, useRef, useEffect } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { Page } from '../../types/notebook';
import {
  Plus,
  MoreHorizontal,
  Copy,
  Trash2,
  Edit2,
  FolderInput,
  Star,
  Tag,
  History,
  Download,
  Check,
  X,
} from 'lucide-react';

interface PageTabsBarProps {
  onOpenVersionHistory: () => void;
  onFocusTitle?: () => void;
}

export const PageTabsBar: React.FC<PageTabsBarProps> = ({
  onOpenVersionHistory,
  onFocusTitle,
}) => {
  const {
    activeSection,
    sections,
    pages,
    activePage,
    setActivePage,
    createPage,
    updatePage,
    deletePage,
    duplicatePage,
    reorderPages,
  } = useNotebook();

  const [menuPageId, setMenuPageId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [showMoveModal, setShowMoveModal] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuPageId(null);
        setMenuPosition(null);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Support horizontal wheel scrolling
  const handleWheel = (e: React.WheelEvent) => {
    if (scrollContainerRef.current && e.deltaY !== 0) {
      scrollContainerRef.current.scrollLeft += e.deltaY;
    }
  };

  const handleCreatePage = async () => {
    if (!activeSection) return;
    const newPage = await createPage('Untitled Page');
    if (newPage) {
      setActivePage(newPage);
      // Scroll to right end to show new tab
      setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
        if (onFocusTitle) {
          onFocusTitle();
        }
      }, 50);
    }
  };

  const handleStartRename = (page: Page) => {
    setEditingPageId(page.id);
    setEditingTitle(page.title);
    setMenuPageId(null);
  };

  const handleSaveRename = async (pageId: string) => {
    if (editingTitle.trim()) {
      await updatePage(pageId, { title: editingTitle.trim() });
    }
    setEditingPageId(null);
  };

  // Drag and drop reordering
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedPageId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedPageId || draggedPageId === targetId) return;

    const currentIds = pages.map((p) => p.id);
    const fromIndex = currentIds.indexOf(draggedPageId);
    const toIndex = currentIds.indexOf(targetId);

    if (fromIndex !== -1 && toIndex !== -1) {
      const reordered = [...currentIds];
      reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, draggedPageId);
      await reorderPages(reordered);
    }
    setDraggedPageId(null);
  };

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    setMenuPageId(pageId);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // Move page to another section
  const handleMovePage = async (pageId: string, targetSectionId: string) => {
    await updatePage(pageId, { section_id: targetSectionId });
    setShowMoveModal(null);
    setMenuPageId(null);
  };

  if (!activeSection) {
    return null;
  }

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 select-none">
      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        className="flex items-center gap-1 px-3 pt-1.5 overflow-x-auto no-scrollbar scroll-smooth"
      >
        {pages.map((page) => {
          const isActive = activePage?.id === page.id;
          const isEditing = editingPageId === page.id;

          if (isEditing) {
            return (
              <div
                key={page.id}
                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-500 rounded-t-md text-xs shrink-0"
              >
                <input
                  type="text"
                  autoFocus
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(page.id);
                    if (e.key === 'Escape') setEditingPageId(null);
                  }}
                  className="w-28 text-xs bg-transparent text-slate-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRename(page.id)}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPageId(null)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          }

          return (
            <div
              key={page.id}
              draggable
              onDragStart={(e) => handleDragStart(e, page.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, page.id)}
              onContextMenu={(e) => handleContextMenu(e, page.id)}
              onClick={() => setActivePage(page)}
              title={page.title || 'Untitled Page'}
              className={`group relative flex items-center gap-1.5 px-3 py-1.5 rounded-t-md text-xs font-medium cursor-pointer transition-colors shrink-0 max-w-[200px] border-b-2 ${
                isActive
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white border-indigo-500 shadow-2xs font-semibold'
                  : 'bg-slate-100/60 dark:bg-slate-850/40 text-slate-600 dark:text-slate-400 border-transparent hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="truncate">{page.title || 'Untitled Page'}</span>

              {/* Tab ⋯ menu trigger */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  setMenuPageId(menuPageId === page.id ? null : page.id);
                  setMenuPosition({ x: rect.left, y: rect.bottom + 4 });
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-opacity"
                title="Page options"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* + Page Button */}
        <button
          type="button"
          onClick={handleCreatePage}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-t-md text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 font-medium"
          title="Create a new page in this section"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Page</span>
        </button>
      </div>

      {/* Floating Context Menu */}
      {menuPageId && menuPosition && (
        <div
          ref={menuRef}
          style={{ top: menuPosition.y, left: Math.min(menuPosition.x, window.innerWidth - 180) }}
          className="fixed z-50 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs select-none animate-in fade-in zoom-in-95 duration-100"
        >
          {(() => {
            const page = pages.find((p) => p.id === menuPageId);
            if (!page) return null;

            return (
              <>
                <button
                  type="button"
                  onClick={() => handleStartRename(page)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Rename</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    duplicatePage(page.id);
                    setMenuPageId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left"
                >
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Duplicate</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowMoveModal(page.id)}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left"
                >
                  <FolderInput className="w-3.5 h-3.5 text-slate-400" />
                  <span>Move to Section...</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    updatePage(page.id, { is_favorite: !page.is_favorite });
                    setMenuPageId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left"
                >
                  <Star className={`w-3.5 h-3.5 ${page.is_favorite ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                  <span>{page.is_favorite ? 'Unfavorite' : 'Favorite'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenVersionHistory();
                    setMenuPageId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-left"
                >
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Version History</span>
                </button>

                <div className="border-t border-slate-100 dark:border-slate-700 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Move "${page.title}" to Trash?`)) {
                      deletePage(page.id);
                    }
                    setMenuPageId(null);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Page</span>
                </button>
              </>
            );
          })()}
        </div>
      )}

      {/* Move Section Sub-modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 w-80 p-4 space-y-3">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Move Page to Section</h4>
            <div className="max-h-60 overflow-y-auto space-y-1">
              {sections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  disabled={sec.id === activeSection.id}
                  onClick={() => handleMovePage(showMoveModal, sec.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-left ${
                    sec.id === activeSection.id
                      ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-700 text-slate-400'
                      : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: sec.color || '#6366f1' }} />
                  <span className="truncate">{sec.name}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMoveModal(null)}
                className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
