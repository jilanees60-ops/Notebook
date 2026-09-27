import React, { useState, useEffect } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { indexedDb } from '../../services/db/indexedDb';
import { Notebook, Section, Page } from '../../types/notebook';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrashModal: React.FC<TrashModalProps> = ({ isOpen, onClose }) => {
  const { restoreFromTrash, emptyTrash } = useNotebook();

  const [trashItems, setTrashItems] = useState<{
    notebooks: Notebook[];
    sections: Section[];
    pages: Page[];
  }>({ notebooks: [], sections: [], pages: [] });

  const loadTrash = async () => {
    const items = await indexedDb.getTrashItems();
    setTrashItems(items);
  };

  useEffect(() => {
    if (isOpen) {
      loadTrash();
    }
  }, [isOpen]);

  const totalCount =
    trashItems.notebooks.length + trashItems.sections.length + trashItems.pages.length;

  const handleEmptyTrash = async () => {
    if (confirm('Permanently delete all items in Trash? This action cannot be undone.')) {
      await emptyTrash();
      await loadTrash();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Recycle Bin / Trash
              </h3>
              <p className="text-xs text-slate-400 font-mono tabular-nums">{totalCount} deleted items</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {totalCount > 0 && (
              <button
                type="button"
                onClick={handleEmptyTrash}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium transition-colors"
              >
                Empty Trash
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Trash Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {/* Deleted Pages */}
          {trashItems.pages.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Pages
              </h4>
              <div className="space-y-1">
                {trashItems.pages.map((p) => (
                  <div
                    key={p.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {p.title || 'Untitled Page'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Deleted {new Date(p.deleted_at!).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await restoreFromTrash('page', p.id);
                        await loadTrash();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-500" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Sections */}
          {trashItems.sections.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Sections
              </h4>
              <div className="space-y-1">
                {trashItems.sections.map((s) => (
                  <div
                    key={s.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Deleted {new Date(s.deleted_at!).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await restoreFromTrash('section', s.id);
                        await loadTrash();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-500" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Deleted Notebooks */}
          {trashItems.notebooks.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Notebooks
              </h4>
              <div className="space-y-1">
                {trashItems.notebooks.map((nb) => (
                  <div
                    key={nb.id}
                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {nb.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        Deleted {new Date(nb.deleted_at!).toLocaleDateString()}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await restoreFromTrash('notebook', nb.id);
                        await loadTrash();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    >
                      <RotateCcw className="w-3 h-3 text-indigo-500" />
                      <span>Restore</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {totalCount === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              <Trash2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Trash is empty</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
