import React, { useState } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { APP_CONFIG } from '../../config/appConfig';
import {
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface SectionsListSidebarProps {
  isOpen?: boolean;
}

export const SectionsListSidebar: React.FC<SectionsListSidebarProps> = ({ isOpen = true }) => {
  const {
    activeNotebook,
    sections,
    activeSection,
    setActiveSection,
    createSection,
    updateSection,
    deleteSection,
    duplicateSection,
  } = useNotebook();

  const [isCreating, setIsCreating] = useState(false);
  const [newSecName, setNewSecName] = useState('');
  const [editingSecId, setEditingSecId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [menuSecId, setMenuSecId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newSecName.trim()) return;
    const color = activeNotebook?.color || APP_CONFIG.defaultNotebookColor;
    await createSection(newSecName.trim(), color);
    setNewSecName('');
    setIsCreating(false);
  };

  const handleSaveRename = async (id: string) => {
    if (editingName.trim()) {
      await updateSection(id, { name: editingName.trim() });
    }
    setEditingSecId(null);
  };

  return (
    <aside className="w-48 bg-slate-50/60 dark:bg-slate-900/40 border-r border-slate-200/80 dark:border-slate-800/80 flex flex-col h-full shrink-0 select-none">
      {/* Column Title: SECTIONS */}
      <div className="h-9 px-3.5 flex items-center justify-between border-b border-slate-200/70 dark:border-slate-800/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
        <span>SECTIONS</span>
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
          title="Add Section"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Sections List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {!activeNotebook ? (
          <div className="p-4 text-center text-xs text-slate-400">
            Select a notebook
          </div>
        ) : sections.length === 0 && !isCreating ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No sections yet
          </div>
        ) : (
          sections.map((sec) => {
            const isActive = activeSection?.id === sec.id;
            const secColor = sec.color || activeNotebook.color || '#6366F1';
            const isEditing = editingSecId === sec.id;

            if (isEditing) {
              return (
                <div key={sec.id} className="p-1 flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveRename(sec.id);
                      if (e.key === 'Escape') setEditingSecId(null);
                    }}
                    className="w-full text-xs px-2 py-1 rounded bg-white dark:bg-slate-800 border border-indigo-500 text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveRename(sec.id)}
                    className="p-1 text-emerald-600 hover:text-emerald-700"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSecId(null)}
                    className="p-1 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            }

            return (
              <div key={sec.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setActiveSection(sec)}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors text-left relative ${
                    isActive
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
                  }`}
                >
                  {/* Subtle Section Accent Bar */}
                  <span
                    className="w-1.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: secColor }}
                  />

                  <span className="truncate flex-1">{sec.name}</span>

                  {/* More options button */}
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuSecId(menuSecId === sec.id ? null : sec.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-opacity"
                    title="Section options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </span>
                </button>

                {/* Context popup menu */}
                {menuSecId === sec.id && (
                  <div className="absolute right-2 top-8 z-50 w-44 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingSecId(sec.id);
                        setEditingName(sec.name);
                        setMenuSecId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-left"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Rename</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        duplicateSection(sec.id);
                        setMenuSecId(null);
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-left"
                    >
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Duplicate</span>
                    </button>

                    <div className="px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold mb-1">Color</p>
                      <div className="flex items-center gap-1.5">
                        {APP_CONFIG.availableColors.slice(0, 5).map((c) => (
                          <button
                            key={c.value}
                            type="button"
                            onClick={() => {
                              updateSection(sec.id, { color: c.value });
                              setMenuSecId(null);
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
                          if (confirm(`Move section "${sec.name}" to Trash?`)) {
                            deleteSection(sec.id);
                          }
                          setMenuSecId(null);
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
          })
        )}

        {/* Inline Create Section */}
        {isCreating && (
          <div className="p-2 bg-white dark:bg-slate-800 rounded-md border border-indigo-400 space-y-2 mt-1 shadow-2xs">
            <input
              type="text"
              autoFocus
              value={newSecName}
              onChange={(e) => setNewSecName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreating(false);
              }}
              placeholder="Section name..."
              className="w-full text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-slate-900 dark:text-white outline-none"
            />
            <div className="flex items-center justify-end gap-1">
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
        )}
      </div>

      {/* Bottom Row: + Section */}
      <div className="p-2 border-t border-slate-200/80 dark:border-slate-800/80">
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/40 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Section</span>
          </button>
        )}
      </div>
    </aside>
  );
};
