import React, { useState } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  Plus,
  MoreHorizontal,
  Trash2,
  Trash,
  Settings,
  Edit2,
  Check,
  X,
} from 'lucide-react';

interface NotebooksSidebarProps {
  isOpen: boolean;
  onClose?: () => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
}

export const NotebooksSidebar: React.FC<NotebooksSidebarProps> = ({
  isOpen,
  onOpenSettings,
  onOpenTrash,
}) => {
  const {
    notebooks,
    activeNotebook,
    setActiveNotebook,
    createNotebook,
    updateNotebook,
    deleteNotebook,
  } = useNotebook();

  const [isCreating, setIsCreating] = useState(false);
  const [newNbName, setNewNbName] = useState('');
  const [newNbColor, setNewNbColor] = useState(APP_CONFIG.defaultNotebookColor);
  const [editingNbId, setEditingNbId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuNbId, setMenuNbId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!newNbName.trim()) return;
    await createNotebook(newNbName.trim(), newNbColor);
    setNewNbName('');
    setIsCreating(false);
  };

  const handleSaveRename = async (id: string) => {
    if (editingName.trim()) {
      await updateNotebook(id, { name: editingName.trim() });
    }
    setEditingNbId(null);
  };

  const activeNotebooks = notebooks.filter((n) => !n.is_archived);

  if (!isOpen) return null;

  return (
    <aside className="w-52 bg-slate-50/90 dark:bg-slate-900/60 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 select-none">
      {/* Column Title: NOTEBOOKS */}
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <span>NOTEBOOKS</span>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title="Add Notebook"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Notebooks List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {activeNotebooks.map((nb) => {
          const isActive = activeNotebook?.id === nb.id;
          const isEditing = editingNbId === nb.id;

          if (isEditing) {
            return (
              <div key={nb.id} className="p-1 flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveRename(nb.id);
                    if (e.key === 'Escape') setEditingNbId(null);
                  }}
                  className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-indigo-500 text-slate-900 dark:text-white outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleSaveRename(nb.id)}
                  className="p-1 text-emerald-600 hover:text-emerald-700"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setEditingNbId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          }

          return (
            <div key={nb.id} className="relative group">
              <button
                type="button"
                onClick={() => setActiveNotebook(nb)}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left ${
                  isActive
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                }`}
              >
                {/* Subtle Color Dot */}
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: nb.color || '#6366F1' }}
                />

                <span className="truncate flex-1">{nb.name}</span>

                {/* More options button on hover */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuNbId(menuNbId === nb.id ? null : nb.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                  title="Notebook options"
                >
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </span>
              </button>

              {/* Context popup */}
              {menuNbId === nb.id && (
                <div className="absolute right-2 top-8 z-50 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingNbId(nb.id);
                      setEditingName(nb.name);
                      setMenuNbId(null);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-left"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Rename</span>
                  </button>

                  <div className="px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Color</p>
                    <div className="flex items-center gap-1.5">
                      {APP_CONFIG.availableColors.slice(0, 5).map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => {
                            updateNotebook(nb.id, { color: c.value });
                            setMenuNbId(null);
                          }}
                          style={{ backgroundColor: c.value }}
                          className="w-3.5 h-3.5 rounded-full hover:scale-110 transition-transform"
                        />
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Move notebook "${nb.name}" to Trash?`)) {
                          deleteNotebook(nb.id);
                        }
                        setMenuNbId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-left"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Inline Create Form */}
        {isCreating && (
          <div className="p-2 bg-white dark:bg-slate-800 rounded-md border border-indigo-400 space-y-2 mt-1 shadow-2xs">
            <input
              type="text"
              autoFocus
              value={newNbName}
              onChange={(e) => setNewNbName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              placeholder="Notebook name..."
              className="w-full text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {APP_CONFIG.availableColors.slice(0, 4).map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setNewNbColor(c.value)}
                    style={{ backgroundColor: c.value }}
                    className={`w-3.5 h-3.5 rounded-full transition-transform ${
                      newNbColor === c.value ? 'ring-2 ring-indigo-500 scale-110' : ''
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-2 py-0.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreate}
                  className="px-2 py-0.5 text-xs bg-indigo-600 text-white rounded font-medium"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Row: + Notebook button & Secondary actions: Trash, Settings */}
      <div className="p-2 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1">
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Notebook</span>
          </button>
        )}

        <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-slate-400">
          <button
            type="button"
            onClick={onOpenTrash}
            className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Trash"
          >
            <Trash className="w-3 h-3" />
            <span>Trash</span>
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-1 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            title="Settings"
          >
            <Settings className="w-3 h-3" />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
