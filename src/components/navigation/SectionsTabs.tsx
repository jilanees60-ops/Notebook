import React, { useState } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { Section } from '../../types/notebook';
import { APP_CONFIG } from '../../config/appConfig';
import { Plus, MoreHorizontal, Copy, Trash2, Pin } from 'lucide-react';

export const SectionsTabs: React.FC = () => {
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
  const [menuSecId, setMenuSecId] = useState<string | null>(null);

  if (!activeNotebook) return null;

  const handleCreate = async () => {
    if (!newSecName.trim()) return;
    await createSection(newSecName.trim(), activeNotebook.color);
    setNewSecName('');
    setIsCreating(false);
  };

  return (
    <div className="w-full bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center px-4 overflow-x-auto select-none gap-1 shrink-0 h-10 scrollbar-none">
      {/* Sections Tabs list */}
      <div className="flex items-center gap-1">
        {sections.map((sec) => {
          const isActive = activeSection?.id === sec.id;
          const secColor = sec.color || activeNotebook.color || '#6366F1';

          return (
            <div key={sec.id} className="relative group shrink-0">
              <button
                type="button"
                onClick={() => setActiveSection(sec)}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-t-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60'
                }`}
                style={{
                  borderTop: isActive ? `3px solid ${secColor}` : '3px solid transparent',
                }}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: secColor }}
                />
                <span className="truncate max-w-[130px]">{sec.name}</span>

                {/* Context menu trigger */}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuSecId(menuSecId === sec.id ? null : sec.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 hover:text-slate-900 dark:hover:text-white p-0.5 rounded transition-opacity"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </span>
              </button>

              {/* Section Context Menu */}
              {menuSecId === sec.id && (
                <div className="absolute left-0 top-8 z-50 w-44 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const newName = prompt('Rename section:', sec.name);
                      if (newName && newName.trim()) {
                        updateSection(sec.id, { name: newName.trim() });
                      }
                      setMenuSecId(null);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    Rename Section
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      duplicateSection(sec.id);
                      setMenuSecId(null);
                    }}
                    className="w-full flex items-center gap-1.5 text-left px-2.5 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Duplicate Section</span>
                  </button>

                  {/* Section Color Options */}
                  <div className="px-2.5 py-1.5 border-t border-slate-100 dark:border-slate-700">
                    <p className="text-[10px] text-slate-400 font-semibold mb-1">Tab Color</p>
                    <div className="flex items-center gap-1">
                      {APP_CONFIG.availableColors.slice(0, 6).map((c) => (
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
                        if (confirm(`Move section "${sec.name}" and its pages to Trash?`)) {
                          deleteSection(sec.id);
                        }
                        setMenuSecId(null);
                      }}
                      className="w-full flex items-center gap-1.5 text-left px-2.5 py-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete Section</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* New Section Inline or Button */}
      {isCreating ? (
        <div className="flex items-center gap-1 ml-1">
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
            className="text-xs px-2 py-1 rounded border border-indigo-400 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none w-32"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="text-xs px-2 py-1 bg-indigo-600 text-white rounded font-medium"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="text-xs text-slate-400 hover:text-slate-600 px-1"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors ml-1"
          title="Add Section"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Section</span>
        </button>
      )}
    </div>
  );
};
