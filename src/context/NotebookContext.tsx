import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  Notebook,
  Section,
  Page,
  Block,
  BlockType,
  Tag,
  PageTag,
  PageVersion,
  SyncStatus,
  PaperStyle,
} from '../types/notebook';
import { indexedDb } from '../services/db/indexedDb';
import { getCurrentUser } from '../services/supabase/client';
import { syncEngine } from '../services/supabase/syncEngine';

interface NotebookContextType {
  notebooks: Notebook[];
  activeNotebook: Notebook | null;
  setActiveNotebook: (nb: Notebook | null) => void;
  sections: Section[];
  activeSection: Section | null;
  setActiveSection: (sec: Section | null) => void;
  pages: Page[];
  activePage: Page | null;
  setActivePage: (p: Page | null) => void;
  blocks: Block[];
  tags: Tag[];
  pageTags: PageTag[];
  syncStatus: SyncStatus;
  syncMessage: string;
  currentUser: { id: string; email?: string } | null;
  isInitialized: boolean;
  activeView: 'notebook' | 'favorites' | 'recent' | 'trash' | 'tag';
  setActiveView: (view: 'notebook' | 'favorites' | 'recent' | 'trash' | 'tag') => void;
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;

  // Notebook operations
  createNotebook: (name: string, color?: string, icon?: string, description?: string) => Promise<Notebook>;
  updateNotebook: (id: string, partial: Partial<Notebook>) => Promise<void>;
  deleteNotebook: (id: string, permanent?: boolean) => Promise<void>;
  reorderNotebooks: (orderedIds: string[]) => Promise<void>;

  // Section operations
  createSection: (name: string, color?: string) => Promise<Section | null>;
  updateSection: (id: string, partial: Partial<Section>) => Promise<void>;
  deleteSection: (id: string, permanent?: boolean) => Promise<void>;
  duplicateSection: (id: string) => Promise<Section | null>;
  reorderSections: (orderedIds: string[]) => Promise<void>;

  // Page operations
  createPage: (title?: string, paperStyle?: PaperStyle) => Promise<Page | null>;
  updatePage: (id: string, partial: Partial<Page>) => Promise<void>;
  deletePage: (id: string, permanent?: boolean) => Promise<void>;
  duplicatePage: (id: string) => Promise<Page | null>;
  movePage: (pageId: string, targetSectionId: string, targetNotebookId: string) => Promise<void>;
  reorderPages: (orderedIds: string[]) => Promise<void>;

  // Block operations
  addBlock: (type: BlockType, position?: number, initialContent?: string, metadata?: any) => Promise<Block | null>;
  insertBlocks: (newBlocks: Block[], position?: number) => Promise<void>;
  updateBlock: (id: string, content: string, metadata?: any) => Promise<void>;
  deleteBlock: (id: string, permanent?: boolean) => Promise<void>;
  reorderBlocks: (orderedIds: string[]) => Promise<void>;

  // Tag operations
  createTag: (name: string, color?: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;
  togglePageTag: (pageId: string, tagId: string) => Promise<void>;

  // Version history
  createPageVersion: (reason?: string) => Promise<void>;
  restorePageVersion: (version: PageVersion) => Promise<void>;

  // Trash
  restoreFromTrash: (type: 'notebook' | 'section' | 'page', id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;

  // Sync
  triggerManualSync: () => Promise<void>;
  refreshAllData: () => Promise<void>;
}

const NotebookContext = createContext<NotebookContextType | undefined>(undefined);

export const NotebookProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [activeNotebook, setActiveNotebookState] = useState<Notebook | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSectionState] = useState<Section | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [activePage, setActivePageState] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [pageTags, setPageTags] = useState<PageTag[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [syncMessage, setSyncMessage] = useState<string>('Ready');
  const [currentUser, setCurrentUser] = useState<{ id: string; email?: string } | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'notebook' | 'favorites' | 'recent' | 'trash' | 'tag'>('notebook');
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  // Keep a ref to blocks to avoid stale closures in debounced saves
  const blocksRef = useRef<Block[]>([]);
  blocksRef.current = blocks;

  // Track sync engine status
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((status, msg) => {
      setSyncStatus(status);
      if (msg) setSyncMessage(msg);
    });
    return unsubscribe;
  }, []);

  // Initialize DB and Seed Data
  const initialize = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);
      const userId = user?.id || 'local_user';

      // Seed if empty
      await indexedDb.initializeDefaultDataIfEmpty(userId);

      // Load Notebooks
      const nbs = await indexedDb.getNotebooks(false);
      nbs.sort((a, b) => a.position - b.position);
      setNotebooks(nbs);

      // Select first active notebook or restore saved selection
      const savedNbId = await indexedDb.getSetting<string>('active_notebook_id');
      const targetNb = nbs.find((n) => n.id === savedNbId) || nbs[0] || null;
      setActiveNotebookState(targetNb);

      if (targetNb) {
        const secs = await indexedDb.getSections(targetNb.id, false);
        secs.sort((a, b) => a.position - b.position);
        setSections(secs);

        const savedSecId = await indexedDb.getSetting<string>('active_section_id');
        const targetSec = secs.find((s) => s.id === savedSecId) || secs[0] || null;
        setActiveSectionState(targetSec);

        if (targetSec) {
          const pgs = await indexedDb.getPages(targetSec.id, false);
          pgs.sort((a, b) => a.position - b.position);
          setPages(pgs);

          const savedPageId = await indexedDb.getSetting<string>('active_page_id');
          const targetPage = pgs.find((p) => p.id === savedPageId) || pgs[0] || null;
          setActivePageState(targetPage);

          if (targetPage) {
            const blks = await indexedDb.getBlocks(targetPage.id, false);
            blks.sort((a, b) => a.position - b.position);
            setBlocks(blks);
          }
        }
      }

      // Load Tags & PageTags
      const loadedTags = await indexedDb.getTags();
      setTags(loadedTags);
      const loadedPageTags = await indexedDb.getPageTags();
      setPageTags(loadedPageTags);

      setIsInitialized(true);

      // Trigger background sync with cloud if available
      syncEngine.sync();
    } catch (e) {
      console.error('Initialization error:', e);
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Set Active Notebook & reload sections
  const setActiveNotebook = useCallback(async (nb: Notebook | null) => {
    setActiveNotebookState(nb);
    if (!nb) {
      setSections([]);
      setActiveSectionState(null);
      setPages([]);
      setActivePageState(null);
      setBlocks([]);
      return;
    }

    await indexedDb.setSetting('active_notebook_id', nb.id);
    const secs = await indexedDb.getSections(nb.id, false);
    secs.sort((a, b) => a.position - b.position);
    setSections(secs);

    const firstSec = secs[0] || null;
    setActiveSectionState(firstSec);

    if (firstSec) {
      await indexedDb.setSetting('active_section_id', firstSec.id);
      const pgs = await indexedDb.getPages(firstSec.id, false);
      pgs.sort((a, b) => a.position - b.position);
      setPages(pgs);

      const firstPage = pgs[0] || null;
      setActivePageState(firstPage);

      if (firstPage) {
        await indexedDb.setSetting('active_page_id', firstPage.id);
        const blks = await indexedDb.getBlocks(firstPage.id, false);
        blks.sort((a, b) => a.position - b.position);
        setBlocks(blks);
      } else {
        setBlocks([]);
      }
    } else {
      setPages([]);
      setActivePageState(null);
      setBlocks([]);
    }
  }, []);

  // Set Active Section & reload pages
  const setActiveSection = useCallback(async (sec: Section | null) => {
    setActiveSectionState(sec);
    if (!sec) {
      setPages([]);
      setActivePageState(null);
      setBlocks([]);
      return;
    }

    await indexedDb.setSetting('active_section_id', sec.id);
    const pgs = await indexedDb.getPages(sec.id, false);
    pgs.sort((a, b) => a.position - b.position);
    setPages(pgs);

    const firstPage = pgs[0] || null;
    setActivePageState(firstPage);

    if (firstPage) {
      await indexedDb.setSetting('active_page_id', firstPage.id);
      const blks = await indexedDb.getBlocks(firstPage.id, false);
      blks.sort((a, b) => a.position - b.position);
      setBlocks(blks);
    } else {
      setBlocks([]);
    }
  }, []);

  // Set Active Page & reload blocks
  const setActivePage = useCallback(async (page: Page | null) => {
    setActivePageState(page);
    if (!page) {
      setBlocks([]);
      return;
    }

    await indexedDb.setSetting('active_page_id', page.id);
    const blks = await indexedDb.getBlocks(page.id, false);
    blks.sort((a, b) => a.position - b.position);
    setBlocks(blks);
  }, []);

  // Refresh All Data
  const refreshAllData = useCallback(async () => {
    const nbs = await indexedDb.getNotebooks(false);
    nbs.sort((a, b) => a.position - b.position);
    setNotebooks(nbs);

    if (activeNotebook) {
      const refreshedNb = nbs.find((n) => n.id === activeNotebook.id) || nbs[0] || null;
      setActiveNotebookState(refreshedNb);
      if (refreshedNb) {
        const secs = await indexedDb.getSections(refreshedNb.id, false);
        secs.sort((a, b) => a.position - b.position);
        setSections(secs);

        if (activeSection) {
          const refreshedSec = secs.find((s) => s.id === activeSection.id) || secs[0] || null;
          setActiveSectionState(refreshedSec);
          if (refreshedSec) {
            const pgs = await indexedDb.getPages(refreshedSec.id, false);
            pgs.sort((a, b) => a.position - b.position);
            setPages(pgs);

            if (activePage) {
              const refreshedPg = pgs.find((p) => p.id === activePage.id) || pgs[0] || null;
              setActivePageState(refreshedPg);
              if (refreshedPg) {
                const blks = await indexedDb.getBlocks(refreshedPg.id, false);
                blks.sort((a, b) => a.position - b.position);
                setBlocks(blks);
              }
            }
          }
        }
      }
    }

    const loadedTags = await indexedDb.getTags();
    setTags(loadedTags);
    const loadedPageTags = await indexedDb.getPageTags();
    setPageTags(loadedPageTags);
  }, [activeNotebook, activeSection, activePage]);

  // Queue helper
  const enqueueChange = async (
    table: 'notebooks' | 'sections' | 'pages' | 'blocks' | 'tags' | 'page_tags',
    action: 'insert' | 'update' | 'delete',
    recordId: string,
    payload: any
  ) => {
    await indexedDb.enqueueSync({
      id: `${table}_${recordId}_${Date.now()}`,
      table,
      action,
      record_id: recordId,
      payload,
      timestamp: Date.now(),
      retry_count: 0,
    });
    syncEngine.scheduleSync();
  };

  // --- Notebook Operations ---
  const createNotebook = async (name: string, color = '#6366F1', icon = 'BookOpen', description = ''): Promise<Notebook> => {
    const userId = currentUser?.id || 'local_user';
    const now = new Date().toISOString();
    const newNb: Notebook = {
      id: 'nb_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      user_id: userId,
      name,
      description,
      icon,
      color,
      position: notebooks.length,
      is_archived: false,
      is_favorite: false,
      created_at: now,
      updated_at: now,
    };

    await indexedDb.saveNotebook(newNb);
    await enqueueChange('notebooks', 'insert', newNb.id, newNb);

    // Auto-create default section & welcome page for this notebook
    const newSec: Section = {
      id: 'sec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      notebook_id: newNb.id,
      user_id: userId,
      name: 'General Notes',
      color,
      position: 0,
      is_archived: false,
      created_at: now,
      updated_at: now,
    };
    await indexedDb.saveSection(newSec);
    await enqueueChange('sections', 'insert', newSec.id, newSec);

    const newPage: Page = {
      id: 'page_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      section_id: newSec.id,
      notebook_id: newNb.id,
      user_id: userId,
      title: 'First Page',
      position: 0,
      is_archived: false,
      is_favorite: false,
      paper_style: 'blank',
      created_at: now,
      updated_at: now,
    };
    await indexedDb.savePage(newPage);
    await enqueueChange('pages', 'insert', newPage.id, newPage);

    const initialBlock: Block = {
      id: 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      page_id: newPage.id,
      user_id: userId,
      type: 'text',
      content: '',
      position: 0,
      created_at: now,
      updated_at: now,
    };
    await indexedDb.saveBlock(initialBlock);
    await enqueueChange('blocks', 'insert', initialBlock.id, initialBlock);

    setNotebooks((prev) => [...prev, newNb]);
    await setActiveNotebook(newNb);

    return newNb;
  };

  const updateNotebook = async (id: string, partial: Partial<Notebook>) => {
    const target = notebooks.find((n) => n.id === id);
    if (!target) return;

    const updated: Notebook = {
      ...target,
      ...partial,
      updated_at: new Date().toISOString(),
    };

    await indexedDb.saveNotebook(updated);
    await enqueueChange('notebooks', 'update', updated.id, updated);

    setNotebooks((prev) => prev.map((n) => (n.id === id ? updated : n)));
    if (activeNotebook?.id === id) {
      setActiveNotebookState(updated);
    }
  };

  const deleteNotebook = async (id: string, permanent = false) => {
    await indexedDb.deleteNotebook(id, permanent);
    await enqueueChange('notebooks', permanent ? 'delete' : 'update', id, {
      id,
      deleted_at: permanent ? null : new Date().toISOString(),
    });

    const remaining = notebooks.filter((n) => n.id !== id);
    setNotebooks(remaining);
    if (activeNotebook?.id === id) {
      setActiveNotebook(remaining[0] || null);
    }
  };

  const reorderNotebooks = async (orderedIds: string[]) => {
    const updated = orderedIds.map((id, index) => {
      const nb = notebooks.find((n) => n.id === id)!;
      return { ...nb, position: index, updated_at: new Date().toISOString() };
    });

    setNotebooks(updated);
    for (const nb of updated) {
      await indexedDb.saveNotebook(nb);
      await enqueueChange('notebooks', 'update', nb.id, nb);
    }
  };

  // --- Section Operations ---
  const createSection = async (name: string, color?: string): Promise<Section | null> => {
    if (!activeNotebook) return null;
    const userId = currentUser?.id || 'local_user';
    const now = new Date().toISOString();

    const newSec: Section = {
      id: 'sec_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      notebook_id: activeNotebook.id,
      user_id: userId,
      name,
      color: color || activeNotebook.color || '#6366F1',
      position: sections.length,
      is_archived: false,
      created_at: now,
      updated_at: now,
    };

    await indexedDb.saveSection(newSec);
    await enqueueChange('sections', 'insert', newSec.id, newSec);

    // Auto-create initial page in section
    const newPage: Page = {
      id: 'page_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      section_id: newSec.id,
      notebook_id: activeNotebook.id,
      user_id: userId,
      title: 'Untitled Page',
      position: 0,
      is_archived: false,
      is_favorite: false,
      paper_style: 'blank',
      created_at: now,
      updated_at: now,
    };
    await indexedDb.savePage(newPage);
    await enqueueChange('pages', 'insert', newPage.id, newPage);

    setSections((prev) => [...prev, newSec]);
    await setActiveSection(newSec);

    return newSec;
  };

  const updateSection = async (id: string, partial: Partial<Section>) => {
    const target = sections.find((s) => s.id === id);
    if (!target) return;

    const updated: Section = {
      ...target,
      ...partial,
      updated_at: new Date().toISOString(),
    };

    await indexedDb.saveSection(updated);
    await enqueueChange('sections', 'update', updated.id, updated);

    setSections((prev) => prev.map((s) => (s.id === id ? updated : s)));
    if (activeSection?.id === id) {
      setActiveSectionState(updated);
    }
  };

  const deleteSection = async (id: string, permanent = false) => {
    await indexedDb.deleteSection(id, permanent);
    await enqueueChange('sections', permanent ? 'delete' : 'update', id, {
      id,
      deleted_at: permanent ? null : new Date().toISOString(),
    });

    const remaining = sections.filter((s) => s.id !== id);
    setSections(remaining);
    if (activeSection?.id === id) {
      setActiveSection(remaining[0] || null);
    }
  };

  const duplicateSection = async (id: string): Promise<Section | null> => {
    const original = sections.find((s) => s.id === id);
    if (!original || !activeNotebook) return null;

    const clonedSec = await createSection(`${original.name} (Copy)`, original.color);
    if (!clonedSec) return null;

    // Clone pages
    const origPages = await indexedDb.getPages(original.id, false);
    for (const p of origPages) {
      const clonedPage: Page = {
        ...p,
        id: 'page_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        section_id: clonedSec.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      await indexedDb.savePage(clonedPage);
      await enqueueChange('pages', 'insert', clonedPage.id, clonedPage);

      const origBlocks = await indexedDb.getBlocks(p.id, false);
      const clonedBlocks = origBlocks.map((b) => ({
        ...b,
        id: 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
        page_id: clonedPage.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      await indexedDb.saveBlocks(clonedBlocks);
      for (const b of clonedBlocks) {
        await enqueueChange('blocks', 'insert', b.id, b);
      }
    }

    return clonedSec;
  };

  const reorderSections = async (orderedIds: string[]) => {
    const updated = orderedIds.map((id, index) => {
      const sec = sections.find((s) => s.id === id)!;
      return { ...sec, position: index, updated_at: new Date().toISOString() };
    });

    setSections(updated);
    for (const sec of updated) {
      await indexedDb.saveSection(sec);
      await enqueueChange('sections', 'update', sec.id, sec);
    }
  };

  // --- Page Operations ---
  const createPage = async (title = 'Untitled Page', paperStyle: PaperStyle = 'blank'): Promise<Page | null> => {
    if (!activeSection || !activeNotebook) return null;
    const userId = currentUser?.id || 'local_user';
    const now = new Date().toISOString();

    const newPage: Page = {
      id: 'page_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      section_id: activeSection.id,
      notebook_id: activeNotebook.id,
      user_id: userId,
      title,
      position: pages.length,
      is_archived: false,
      is_favorite: false,
      paper_style: paperStyle,
      created_at: now,
      updated_at: now,
    };

    await indexedDb.savePage(newPage);
    await enqueueChange('pages', 'insert', newPage.id, newPage);

    // Initial paragraph block
    const initialBlock: Block = {
      id: 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      page_id: newPage.id,
      user_id: userId,
      type: 'text',
      content: '',
      position: 0,
      created_at: now,
      updated_at: now,
    };
    await indexedDb.saveBlock(initialBlock);
    await enqueueChange('blocks', 'insert', initialBlock.id, initialBlock);

    setPages((prev) => [newPage, ...prev]);
    await setActivePage(newPage);

    return newPage;
  };

  const updatePage = async (id: string, partial: Partial<Page>) => {
    const target = pages.find((p) => p.id === id) || (activePage?.id === id ? activePage : null);
    if (!target) return;

    const updated: Page = {
      ...target,
      ...partial,
      updated_at: new Date().toISOString(),
    };

    await indexedDb.savePage(updated);
    await enqueueChange('pages', 'update', updated.id, updated);

    setPages((prev) => prev.map((p) => (p.id === id ? updated : p)));
    if (activePage?.id === id) {
      setActivePageState(updated);
    }
  };

  const deletePage = async (id: string, permanent = false) => {
    await indexedDb.deletePage(id, permanent);
    await enqueueChange('pages', permanent ? 'delete' : 'update', id, {
      id,
      deleted_at: permanent ? null : new Date().toISOString(),
    });

    const remaining = pages.filter((p) => p.id !== id);
    setPages(remaining);
    if (activePage?.id === id) {
      setActivePage(remaining[0] || null);
    }
  };

  const duplicatePage = async (id: string): Promise<Page | null> => {
    const original = pages.find((p) => p.id === id);
    if (!original) return null;

    const cloned: Page = {
      ...original,
      id: 'page_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      title: `${original.title} (Copy)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await indexedDb.savePage(cloned);
    await enqueueChange('pages', 'insert', cloned.id, cloned);

    const origBlocks = await indexedDb.getBlocks(original.id, false);
    const clonedBlocks = origBlocks.map((b) => ({
      ...b,
      id: 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      page_id: cloned.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    await indexedDb.saveBlocks(clonedBlocks);
    for (const b of clonedBlocks) {
      await enqueueChange('blocks', 'insert', b.id, b);
    }

    setPages((prev) => [cloned, ...prev]);
    await setActivePage(cloned);
    return cloned;
  };

  const movePage = async (pageId: string, targetSectionId: string, targetNotebookId: string) => {
    const page = await indexedDb.getPage(pageId);
    if (!page) return;

    const updated: Page = {
      ...page,
      section_id: targetSectionId,
      notebook_id: targetNotebookId,
      updated_at: new Date().toISOString(),
    };

    await indexedDb.savePage(updated);
    await enqueueChange('pages', 'update', updated.id, updated);
    await refreshAllData();
  };

  const reorderPages = async (orderedIds: string[]) => {
    const updated = orderedIds.map((id, index) => {
      const p = pages.find((item) => item.id === id)!;
      return { ...p, position: index, updated_at: new Date().toISOString() };
    });

    setPages(updated);
    for (const p of updated) {
      await indexedDb.savePage(p);
      await enqueueChange('pages', 'update', p.id, p);
    }
  };

  // --- Block Operations ---
  const addBlock = async (
    type: BlockType,
    position?: number,
    initialContent = '',
    metadata?: any
  ): Promise<Block | null> => {
    if (!activePage) return null;
    const userId = currentUser?.id || 'local_user';
    const now = new Date().toISOString();

    const currentBlocks = blocksRef.current;
    const pos = position !== undefined ? position : currentBlocks.length;

    // Default metadata configurations for special blocks
    let defaultMeta = metadata || {};
    if (type === 'checklist' && !defaultMeta.checklistItems) {
      defaultMeta = {
        checklistItems: [{ id: 'ci_' + Date.now(), text: 'New task', completed: false, priority: 'medium' }],
      };
    } else if (type === 'table' && !defaultMeta.tableData) {
      defaultMeta = {
        tableData: {
          headers: ['Column 1', 'Column 2', 'Column 3'],
          rows: [
            ['Cell 1, 1', 'Cell 1, 2', 'Cell 1, 3'],
            ['Cell 2, 1', 'Cell 2, 2', 'Cell 2, 3'],
          ],
        },
      };
    } else if (type === 'code' && !defaultMeta.language) {
      defaultMeta = { language: 'typescript' };
    } else if (type === 'callout' && !defaultMeta.calloutType) {
      defaultMeta = { calloutType: 'info' };
    }

    const newBlock: Block = {
      id: 'blk_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      page_id: activePage.id,
      user_id: userId,
      type,
      content: initialContent,
      position: pos,
      metadata: defaultMeta,
      created_at: now,
      updated_at: now,
    };

    // Splice into current blocks and update subsequent positions
    const updatedBlocks = [...currentBlocks];
    updatedBlocks.splice(pos, 0, newBlock);
    const reindexed = updatedBlocks.map((b, idx) => ({ ...b, position: idx }));

    setBlocks(reindexed);
    await indexedDb.saveBlocks(reindexed);
    await enqueueChange('blocks', 'insert', newBlock.id, newBlock);

    return newBlock;
  };

  const insertBlocks = async (newBlocks: Block[], position?: number) => {
    if (!activePage || newBlocks.length === 0) return;
    const currentBlocks = blocksRef.current;
    const pos = position !== undefined ? position : currentBlocks.length;

    const updatedBlocks = [...currentBlocks];
    updatedBlocks.splice(pos, 0, ...newBlocks);
    const reindexed = updatedBlocks.map((b, idx) => ({ ...b, position: idx }));

    setBlocks(reindexed);
    await indexedDb.saveBlocks(reindexed);
    for (const b of newBlocks) {
      await enqueueChange('blocks', 'insert', b.id, b);
    }
  };

  const updateBlock = async (id: string, content: string, metadata?: any) => {
    const currentBlocks = blocksRef.current;
    const target = currentBlocks.find((b) => b.id === id);
    if (!target) return;

    const updated: Block = {
      ...target,
      content,
      metadata: metadata !== undefined ? metadata : target.metadata,
      updated_at: new Date().toISOString(),
    };

    const nextBlocks = currentBlocks.map((b) => (b.id === id ? updated : b));
    setBlocks(nextBlocks);

    // Persist to IndexedDB
    await indexedDb.saveBlock(updated);

    // Debounce cloud sync
    syncEngine.scheduleSync(1200);

    // Also update page modified time
    if (activePage) {
      const updatedPage = { ...activePage, updated_at: new Date().toISOString() };
      setActivePageState(updatedPage);
      await indexedDb.savePage(updatedPage);
    }
  };

  const deleteBlock = async (id: string, permanent = false) => {
    const currentBlocks = blocksRef.current;
    await indexedDb.deleteBlock(id, permanent);
    await enqueueChange('blocks', permanent ? 'delete' : 'update', id, {
      id,
      deleted_at: permanent ? null : new Date().toISOString(),
    });

    const remaining = currentBlocks.filter((b) => b.id !== id);
    const reindexed = remaining.map((b, idx) => ({ ...b, position: idx }));
    setBlocks(reindexed);
    await indexedDb.saveBlocks(reindexed);
  };

  const reorderBlocks = async (orderedIds: string[]) => {
    const currentBlocks = blocksRef.current;
    const updated = orderedIds.map((id, index) => {
      const b = currentBlocks.find((item) => item.id === id)!;
      return { ...b, position: index, updated_at: new Date().toISOString() };
    });

    setBlocks(updated);
    await indexedDb.saveBlocks(updated);
    for (const b of updated) {
      await enqueueChange('blocks', 'update', b.id, b);
    }
  };

  // --- Tag Operations ---
  const createTag = async (name: string, color = '#6366F1'): Promise<Tag> => {
    const userId = currentUser?.id || 'local_user';
    const newTag: Tag = {
      id: 'tag_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      user_id: userId,
      name: name.toLowerCase().trim(),
      color,
      created_at: new Date().toISOString(),
    };

    await indexedDb.saveTag(newTag);
    await enqueueChange('tags', 'insert', newTag.id, newTag);
    setTags((prev) => [...prev.filter((t) => t.id !== newTag.id), newTag]);
    return newTag;
  };

  const deleteTag = async (id: string) => {
    await indexedDb.deleteTag(id);
    await enqueueChange('tags', 'delete', id, {});
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const togglePageTag = async (pageId: string, tagId: string) => {
    const existing = pageTags.find((pt) => pt.page_id === pageId && pt.tag_id === tagId);
    if (existing) {
      await indexedDb.removePageTag(pageId, tagId);
      await enqueueChange('page_tags', 'delete', `${pageId}_${tagId}`, {});
      setPageTags((prev) => prev.filter((pt) => !(pt.page_id === pageId && pt.tag_id === tagId)));
    } else {
      await indexedDb.savePageTag(pageId, tagId);
      await enqueueChange('page_tags', 'insert', `${pageId}_${tagId}`, {
        id: `${pageId}_${tagId}`,
        page_id: pageId,
        tag_id: tagId,
        user_id: currentUser?.id || 'local_user',
      });
      setPageTags((prev) => [...prev, { page_id: pageId, tag_id: tagId }]);
    }
  };

  // --- Version History ---
  const createPageVersion = async (reason = 'Manual Snapshot') => {
    if (!activePage) return;
    const version: PageVersion = {
      id: 'ver_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6),
      page_id: activePage.id,
      user_id: currentUser?.id || 'local_user',
      title: activePage.title,
      blocks_snapshot: JSON.parse(JSON.stringify(blocksRef.current)),
      snapshot_reason: reason,
      created_at: new Date().toISOString(),
    };

    await indexedDb.savePageVersion(version);
  };

  const restorePageVersion = async (version: PageVersion) => {
    if (!activePage || activePage.id !== version.page_id) return;

    // Create a snapshot of current state before restoring
    await createPageVersion('Auto-snapshot before restore');

    // Restore title
    await updatePage(activePage.id, { title: version.title });

    // Restore blocks
    const restoredBlocks = version.blocks_snapshot.map((b) => ({
      ...b,
      updated_at: new Date().toISOString(),
    }));

    setBlocks(restoredBlocks);
    await indexedDb.saveBlocks(restoredBlocks);
    for (const b of restoredBlocks) {
      await enqueueChange('blocks', 'update', b.id, b);
    }
  };

  // --- Trash Management ---
  const restoreFromTrash = async (type: 'notebook' | 'section' | 'page', id: string) => {
    if (type === 'notebook') {
      const nbs = await indexedDb.getNotebooks(true);
      const target = nbs.find((n) => n.id === id);
      if (target) {
        target.deleted_at = null;
        target.updated_at = new Date().toISOString();
        await indexedDb.saveNotebook(target);
        await enqueueChange('notebooks', 'update', target.id, target);
      }
    } else if (type === 'section') {
      const secs = await indexedDb.getSections(undefined, true);
      const target = secs.find((s) => s.id === id);
      if (target) {
        target.deleted_at = null;
        target.updated_at = new Date().toISOString();
        await indexedDb.saveSection(target);
        await enqueueChange('sections', 'update', target.id, target);
      }
    } else if (type === 'page') {
      const p = await indexedDb.getPage(id);
      if (p) {
        p.deleted_at = null;
        p.updated_at = new Date().toISOString();
        await indexedDb.savePage(p);
        await enqueueChange('pages', 'update', p.id, p);
      }
    }
    await refreshAllData();
  };

  const emptyTrash = async () => {
    await indexedDb.emptyTrash();
    await refreshAllData();
  };

  // --- Sync Operations ---
  const triggerManualSync = async () => {
    await syncEngine.sync();
  };

  return (
    <NotebookContext.Provider
      value={{
        notebooks,
        activeNotebook,
        setActiveNotebook,
        sections,
        activeSection,
        setActiveSection,
        pages,
        activePage,
        setActivePage,
        blocks,
        tags,
        pageTags,
        syncStatus,
        syncMessage,
        currentUser,
        isInitialized,
        activeView,
        setActiveView,
        selectedTagId,
        setSelectedTagId,

        createNotebook,
        updateNotebook,
        deleteNotebook,
        reorderNotebooks,

        createSection,
        updateSection,
        deleteSection,
        duplicateSection,
        reorderSections,

        createPage,
        updatePage,
        deletePage,
        duplicatePage,
        movePage,
        reorderPages,

        addBlock,
        insertBlocks,
        updateBlock,
        deleteBlock,
        reorderBlocks,

        createTag,
        deleteTag,
        togglePageTag,

        createPageVersion,
        restorePageVersion,

        restoreFromTrash,
        emptyTrash,

        triggerManualSync,
        refreshAllData,
      }}
    >
      {children}
    </NotebookContext.Provider>
  );
};

export const useNotebook = () => {
  const context = useContext(NotebookContext);
  if (!context) {
    throw new Error('useNotebook must be used within a NotebookProvider');
  }
  return context;
};
