import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNotebook } from '../../context/NotebookContext';
import { indexedDb } from '../../services/db/indexedDb';
import { SearchResultItem, Block } from '../../types/notebook';
import { Search, FileText, CheckSquare, Code2, Tag, BookOpen, ChevronRight, X } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const { notebooks, sections, pages, tags, setActiveNotebook, setActiveSection, setActivePage } =
    useNotebook();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pages' | 'checklists' | 'code' | 'tags'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [allBlocks, setAllBlocks] = useState<Block[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load all blocks for searching block content
  useEffect(() => {
    if (isOpen) {
      const loadAll = async () => {
        const loaded: Block[] = [];
        for (const p of pages) {
          const blks = await indexedDb.getBlocks(p.id, false);
          loaded.push(...blks);
        }
        setAllBlocks(loaded);
      };
      loadAll();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, pages]);

  // Compute search results
  const results: SearchResultItem[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const items: SearchResultItem[] = [];

    // Search Pages
    if (activeFilter === 'all' || activeFilter === 'pages') {
      for (const p of pages) {
        if (p.title.toLowerCase().includes(q)) {
          const sec = sections.find((s) => s.id === p.section_id);
          const nb = notebooks.find((n) => n.id === p.notebook_id);
          items.push({
            type: 'page',
            id: p.id,
            title: p.title,
            subtitle: `${nb?.name || 'Notebook'} / ${sec?.name || 'Section'}`,
            notebookId: p.notebook_id,
            sectionId: p.section_id,
            pageId: p.id,
            updatedAt: p.updated_at,
          });
        }
      }
    }

    // Search Blocks (text, checklists, code)
    for (const b of allBlocks) {
      const p = pages.find((page) => page.id === b.page_id);
      if (!p) continue;
      const sec = sections.find((s) => s.id === p.section_id);
      const nb = notebooks.find((n) => n.id === p.notebook_id);

      if (b.type === 'checklist' && (activeFilter === 'all' || activeFilter === 'checklists')) {
        const itemsList = b.metadata?.checklistItems || [];
        const match = itemsList.find((ci) => ci.text.toLowerCase().includes(q));
        if (match) {
          items.push({
            type: 'block',
            id: b.id,
            title: match.text,
            subtitle: `Checklist in "${p.title}" (${nb?.name || ''})`,
            matchedSnippet: match.completed ? 'Completed' : 'Pending',
            notebookId: p.notebook_id,
            sectionId: p.section_id,
            pageId: p.id,
            updatedAt: b.updated_at,
          });
        }
      } else if (b.type === 'code' && (activeFilter === 'all' || activeFilter === 'code')) {
        if (b.content.toLowerCase().includes(q)) {
          items.push({
            type: 'block',
            id: b.id,
            title: `Code (${b.metadata?.language || 'snippet'}) in "${p.title}"`,
            subtitle: `${nb?.name || 'Notebook'} / ${sec?.name || 'Section'}`,
            matchedSnippet: b.content.slice(0, 100),
            notebookId: p.notebook_id,
            sectionId: p.section_id,
            pageId: p.id,
            updatedAt: b.updated_at,
          });
        }
      } else if (b.type === 'text' || b.type.startsWith('heading')) {
        if (b.content.toLowerCase().includes(q) && (activeFilter === 'all' || activeFilter === 'pages')) {
          items.push({
            type: 'block',
            id: b.id,
            title: p.title,
            subtitle: `${nb?.name || 'Notebook'} / ${sec?.name || 'Section'}`,
            matchedSnippet: b.content.slice(0, 120),
            notebookId: p.notebook_id,
            sectionId: p.section_id,
            pageId: p.id,
            updatedAt: b.updated_at,
          });
        }
      }
    }

    // Search Tags
    if (activeFilter === 'all' || activeFilter === 'tags') {
      for (const t of tags) {
        if (t.name.toLowerCase().includes(q)) {
          items.push({
            type: 'tag',
            id: t.id,
            title: `#${t.name}`,
            subtitle: 'Tag filter',
            updatedAt: t.created_at,
          });
        }
      }
    }

    return items.slice(0, 20); // Top 20 results
  }, [query, activeFilter, pages, sections, notebooks, allBlocks, tags]);

  // Keyboard navigation inside search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1 < results.length ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        selectResult(results[selectedIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  const selectResult = (item: SearchResultItem) => {
    if (item.notebookId) {
      const nb = notebooks.find((n) => n.id === item.notebookId);
      if (nb) setActiveNotebook(nb);
    }
    if (item.sectionId) {
      const sec = sections.find((s) => s.id === item.sectionId);
      if (sec) setActiveSection(sec);
    }
    if (item.pageId) {
      const p = pages.find((page) => page.id === item.pageId);
      if (p) setActivePage(p);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[75vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search notes, checklists, code, tags across all notebooks..."
            className="w-full text-base bg-transparent border-none outline-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Segmented Controls */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2 overflow-x-auto text-xs">
          {(['all', 'pages', 'checklists', 'code', 'tags'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
              className={`px-3 py-1 rounded-lg font-medium capitalize transition-colors ${
                activeFilter === filter
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {results.map((item, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <div
                key={item.id + '_' + idx}
                onClick={() => selectResult(item)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`p-3 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-lg bg-white dark:bg-slate-800 shadow-2xs shrink-0 mt-0.5 text-slate-500">
                    {item.type === 'page' && <FileText className="w-4 h-4 text-indigo-500" />}
                    {item.type === 'block' && <CheckSquare className="w-4 h-4 text-emerald-500" />}
                    {item.type === 'tag' && <Tag className="w-4 h-4 text-amber-500" />}
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{item.subtitle}</p>
                    {item.matchedSnippet && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-1 italic font-mono">
                        "{item.matchedSnippet}"
                      </p>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            );
          })}

          {query.trim() && results.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-400">
              No matching notes or checklists found for "{query}"
            </div>
          )}

          {!query.trim() && (
            <div className="p-8 text-center text-xs text-slate-400">
              Type to instantly search across all notes, tags, checklists, and code snippets.
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span>↑↓ to navigate</span>
            <span>·</span>
            <span>↵ to select</span>
            <span>·</span>
            <span>ESC to close</span>
          </div>
          <span>{results.length} results</span>
        </div>
      </div>
    </div>
  );
};
