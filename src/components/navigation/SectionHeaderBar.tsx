import React, { useState, useRef, useEffect } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { Section } from '../../types/notebook';
import { APP_CONFIG } from '../../config/appConfig';
import {
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  X,
} from 'lucide-react';

interface SectionHeaderBarProps {
  onToggleSidebar?: () => void;
}

export const SectionHeaderBar: React.FC<SectionHeaderBarProps> = () => {
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

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreatingInline, setIsCreatingInline] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setIsCreatingInline(false);
      }
    };
    window.addEventListener('mousedown', handleOutsideClick);
    return () => window.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCreate = async () => {
    if (!newSectionName.trim()) return;
    const color = activeNotebook?.color || APP_CONFIG.defaultNotebookColor;
    const sec = await createSection(newSectionName.trim(), color);
    if (sec) {
      setActiveSection(sec);
    }
    setNewSectionName('');
    setIsCreatingInline(false);
    setIsDropdownOpen(false);
  };

  const handleSaveRename = async (id: string) => {
    if (editingName.trim()) {
      await updateSection(id, { name: editingName.trim() });
    }
    setEditingSectionId(null);
  };

  if (!activeNotebook) {
    return null;
  }

  const sectionColor = activeSection?.color || activeNotebook?.color || '#6366f1';

  return (
    <div className="w-full bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800/80 px-4 py-2 flex items-center justify-between gap-3 select-none">
      {/* Current Section Switcher Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-850 text-slate-900 dark:text-white transition-colors group"
          title="Switch Section"
        >
          {/* Subtle color dot/accent */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: sectionColor }}
          />
          <span className="text-sm font-semibold tracking-tight truncate max-w-[240px]">
            {activeSection ? activeSection.name : 'Select a Section'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
          <div className="absolute left-0 mt-1 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 p-1.5 z-50 text-xs">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Sections in {activeNotebook.name}</span>
              <button
                type="button"
                onClick={() => setIsCreatingInline(true)}
                className="hover:text-slate-900 dark:hover:text-white"
                title="Add Section"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <div className="max-h-56 overflow-y-auto space-y-0.5 mt-1">
              {sections.map((sec) => {
                const isSelected = activeSection?.id === sec.id;
                const isEditing = editingSectionId === sec.id;

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
                          if (e.key === 'Escape') setEditingSectionId(null);
                        }}
                        className="w-full text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-750 border border-indigo-500 text-slate-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveRename(sec.id)}
                        className="text-emerald-600 hover:text-emerald-700 p-0.5"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingSectionId(null)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                }

                return (
                  <div
                    key={sec.id}
                    className={`group flex items-center justify-between px-2 py-1.5 rounded cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                    onClick={() => {
                      setActiveSection(sec);
                      setIsDropdownOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: sec.color || '#6366f1' }}
                      />
                      <span className="truncate">{sec.name}</span>
                    </div>

                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSectionId(sec.id);
                          setEditingName(sec.name);
                        }}
                        className="p-0.5 hover:text-slate-900 dark:hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSection(sec.id);
                        }}
                        className="p-0.5 hover:text-slate-900 dark:hover:text-white"
                        title="Duplicate"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Move section "${sec.name}" to Trash?`)) {
                            deleteSection(sec.id);
                          }
                        }}
                        className="p-0.5 text-rose-500 hover:text-rose-700"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {isCreatingInline && (
                <div className="p-1 mt-1 border-t border-slate-100 dark:border-slate-700 flex items-center gap-1">
                  <input
                    type="text"
                    autoFocus
                    placeholder="New section name..."
                    value={newSectionName}
                    onChange={(e) => setNewSectionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreate();
                      if (e.key === 'Escape') setIsCreatingInline(false);
                    }}
                    className="w-full text-xs px-2 py-0.5 rounded bg-white dark:bg-slate-750 border border-indigo-500 text-slate-900 dark:text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="text-emerald-600 hover:text-emerald-700 p-0.5"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingInline(false)}
                    className="text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {!isCreatingInline && (
              <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsCreatingInline(true)}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white text-xs rounded hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Section</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: + Section button with clean inline creation */}
      <div>
        {isCreatingInline ? (
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-indigo-400">
            <input
              type="text"
              autoFocus
              placeholder="Section name..."
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') setIsCreatingInline(false);
              }}
              className="text-xs bg-transparent text-slate-900 dark:text-white outline-none w-32 sm:w-44 py-0.5"
            />
            <button
              type="button"
              onClick={handleCreate}
              className="text-emerald-600 hover:text-emerald-700 p-0.5"
              title="Create section"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsCreatingInline(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsCreatingInline(true)}
            className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors font-medium"
            title="Add a new section to this notebook"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>+ Section</span>
          </button>
        )}
      </div>
    </div>
  );
};
