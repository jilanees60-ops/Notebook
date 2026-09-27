import { Notebook, Section, Page, Block, Tag, PageTag, PageVersion, SyncQueueItem } from '../../types/notebook';

const DB_NAME = 'JNAS_NOTEBOOK_DB';
const DB_VERSION = 1;

class IndexedDbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        if (!db.objectStoreNames.contains('notebooks')) {
          const store = db.createObjectStore('notebooks', { keyPath: 'id' });
          store.createIndex('position', 'position', { unique: false });
          store.createIndex('deleted_at', 'deleted_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('sections')) {
          const store = db.createObjectStore('sections', { keyPath: 'id' });
          store.createIndex('notebook_id', 'notebook_id', { unique: false });
          store.createIndex('position', 'position', { unique: false });
          store.createIndex('deleted_at', 'deleted_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('pages')) {
          const store = db.createObjectStore('pages', { keyPath: 'id' });
          store.createIndex('section_id', 'section_id', { unique: false });
          store.createIndex('notebook_id', 'notebook_id', { unique: false });
          store.createIndex('position', 'position', { unique: false });
          store.createIndex('deleted_at', 'deleted_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('blocks')) {
          const store = db.createObjectStore('blocks', { keyPath: 'id' });
          store.createIndex('page_id', 'page_id', { unique: false });
          store.createIndex('position', 'position', { unique: false });
          store.createIndex('deleted_at', 'deleted_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('tags')) {
          db.createObjectStore('tags', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('page_tags')) {
          const store = db.createObjectStore('page_tags', { keyPath: 'id' });
          store.createIndex('page_id', 'page_id', { unique: false });
          store.createIndex('tag_id', 'tag_id', { unique: false });
        }

        if (!db.objectStoreNames.contains('page_versions')) {
          const store = db.createObjectStore('page_versions', { keyPath: 'id' });
          store.createIndex('page_id', 'page_id', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }

        if (!db.objectStoreNames.contains('sync_queue')) {
          const store = db.createObjectStore('sync_queue', { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  // Generic Transaction Helpers
  private async executeTx<T>(
    storeName: string,
    mode: IDBTransactionMode,
    operation: (store: IDBObjectStore) => Promise<T> | IDBRequest<T>
  ): Promise<T> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, mode);
      const store = tx.objectStore(storeName);
      let opResult: any;

      try {
        const res = operation(store);
        if (res instanceof Promise) {
          res.then((r) => (opResult = r)).catch(reject);
        } else if (res && 'onsuccess' in res) {
          res.onsuccess = () => (opResult = res.result);
          res.onerror = () => reject(res.error);
        }
      } catch (err) {
        reject(err);
      }

      tx.oncomplete = () => resolve(opResult);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  }

  // --- Notebooks ---
  async getNotebooks(includeDeleted = false): Promise<Notebook[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('notebooks', 'readonly');
      const store = tx.objectStore('notebooks');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: Notebook[] = req.result || [];
        resolve(includeDeleted ? all : all.filter((n) => !n.deleted_at));
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveNotebook(notebook: Notebook): Promise<void> {
    await this.executeTx('notebooks', 'readwrite', (store) => store.put(notebook));
  }

  async deleteNotebook(id: string, permanent = false): Promise<void> {
    if (permanent) {
      await this.executeTx('notebooks', 'readwrite', (store) => store.delete(id));
    } else {
      const nbs = await this.getNotebooks(true);
      const target = nbs.find((n) => n.id === id);
      if (target) {
        target.deleted_at = new Date().toISOString();
        target.updated_at = new Date().toISOString();
        await this.saveNotebook(target);
      }
    }
  }

  // --- Sections ---
  async getSections(notebookId?: string, includeDeleted = false): Promise<Section[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sections', 'readonly');
      const store = tx.objectStore('sections');
      const req = store.getAll();
      req.onsuccess = () => {
        let all: Section[] = req.result || [];
        if (!includeDeleted) {
          all = all.filter((s) => !s.deleted_at);
        }
        if (notebookId) {
          all = all.filter((s) => s.notebook_id === notebookId);
        }
        resolve(all);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveSection(section: Section): Promise<void> {
    await this.executeTx('sections', 'readwrite', (store) => store.put(section));
  }

  async deleteSection(id: string, permanent = false): Promise<void> {
    if (permanent) {
      await this.executeTx('sections', 'readwrite', (store) => store.delete(id));
    } else {
      const secs = await this.getSections(undefined, true);
      const target = secs.find((s) => s.id === id);
      if (target) {
        target.deleted_at = new Date().toISOString();
        target.updated_at = new Date().toISOString();
        await this.saveSection(target);
      }
    }
  }

  // --- Pages ---
  async getPages(sectionId?: string, includeDeleted = false): Promise<Page[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pages', 'readonly');
      const store = tx.objectStore('pages');
      const req = store.getAll();
      req.onsuccess = () => {
        let all: Page[] = req.result || [];
        if (!includeDeleted) {
          all = all.filter((p) => !p.deleted_at);
        }
        if (sectionId) {
          all = all.filter((p) => p.section_id === sectionId);
        }
        resolve(all);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async getPage(id: string): Promise<Page | null> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pages', 'readonly');
      const store = tx.objectStore('pages');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async savePage(page: Page): Promise<void> {
    await this.executeTx('pages', 'readwrite', (store) => store.put(page));
  }

  async deletePage(id: string, permanent = false): Promise<void> {
    if (permanent) {
      await this.executeTx('pages', 'readwrite', (store) => store.delete(id));
    } else {
      const p = await this.getPage(id);
      if (p) {
        p.deleted_at = new Date().toISOString();
        p.updated_at = new Date().toISOString();
        await this.savePage(p);
      }
    }
  }

  // --- Blocks ---
  async getBlocks(pageId: string, includeDeleted = false): Promise<Block[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('blocks', 'readonly');
      const store = tx.objectStore('blocks');
      const req = store.getAll();
      req.onsuccess = () => {
        let all: Block[] = req.result || [];
        all = all.filter((b) => b.page_id === pageId);
        if (!includeDeleted) {
          all = all.filter((b) => !b.deleted_at);
        }
        all.sort((a, b) => a.position - b.position);
        resolve(all);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async saveBlock(block: Block): Promise<void> {
    await this.executeTx('blocks', 'readwrite', (store) => store.put(block));
  }

  async saveBlocks(blocks: Block[]): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('blocks', 'readwrite');
      const store = tx.objectStore('blocks');
      for (const block of blocks) {
        store.put(block);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async deleteBlock(id: string, permanent = false): Promise<void> {
    if (permanent) {
      await this.executeTx('blocks', 'readwrite', (store) => store.delete(id));
    } else {
      const db = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction('blocks', 'readwrite');
        const store = tx.objectStore('blocks');
        const req = store.get(id);
        req.onsuccess = () => {
          const b: Block | undefined = req.result;
          if (b) {
            b.deleted_at = new Date().toISOString();
            b.updated_at = new Date().toISOString();
            store.put(b);
          }
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
  }

  // --- Tags ---
  async getTags(): Promise<Tag[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('tags', 'readonly');
      const store = tx.objectStore('tags');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async saveTag(tag: Tag): Promise<void> {
    await this.executeTx('tags', 'readwrite', (store) => store.put(tag));
  }

  async deleteTag(id: string): Promise<void> {
    await this.executeTx('tags', 'readwrite', (store) => store.delete(id));
  }

  // --- Page Tags ---
  async getPageTags(pageId?: string): Promise<{ id: string; page_id: string; tag_id: string }[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('page_tags', 'readonly');
      const store = tx.objectStore('page_tags');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: { id: string; page_id: string; tag_id: string }[] = req.result || [];
        resolve(pageId ? all.filter((pt) => pt.page_id === pageId) : all);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async savePageTag(pageId: string, tagId: string): Promise<void> {
    const id = `${pageId}_${tagId}`;
    await this.executeTx('page_tags', 'readwrite', (store) =>
      store.put({ id, page_id: pageId, tag_id: tagId })
    );
  }

  async removePageTag(pageId: string, tagId: string): Promise<void> {
    const id = `${pageId}_${tagId}`;
    await this.executeTx('page_tags', 'readwrite', (store) => store.delete(id));
  }

  // --- Page Versions ---
  async getPageVersions(pageId: string): Promise<PageVersion[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('page_versions', 'readonly');
      const store = tx.objectStore('page_versions');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: PageVersion[] = req.result || [];
        const filtered = all.filter((v) => v.page_id === pageId);
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        resolve(filtered);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async savePageVersion(version: PageVersion): Promise<void> {
    await this.executeTx('page_versions', 'readwrite', (store) => store.put(version));
  }

  // --- Sync Queue ---
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();
      req.onsuccess = () => {
        const all: SyncQueueItem[] = req.result || [];
        all.sort((a, b) => a.timestamp - b.timestamp);
        resolve(all);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async enqueueSync(item: SyncQueueItem): Promise<void> {
    await this.executeTx('sync_queue', 'readwrite', (store) => store.put(item));
  }

  async dequeueSync(id: string): Promise<void> {
    await this.executeTx('sync_queue', 'readwrite', (store) => store.delete(id));
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- Settings ---
  async getSetting<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const req = store.get(key);
      req.onsuccess = () => {
        resolve(req.result ? req.result.value : defaultValue);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    await this.executeTx('settings', 'readwrite', (store) => store.put({ key, value }));
  }

  // --- Trash Management ---
  async getTrashItems(): Promise<{
    notebooks: Notebook[];
    sections: Section[];
    pages: Page[];
  }> {
    const [nbs, secs, pgs] = await Promise.all([
      this.getNotebooks(true),
      this.getSections(undefined, true),
      this.getPages(undefined, true),
    ]);

    return {
      notebooks: nbs.filter((n) => !!n.deleted_at),
      sections: secs.filter((s) => !!s.deleted_at),
      pages: pgs.filter((p) => !!p.deleted_at),
    };
  }

  async emptyTrash(): Promise<void> {
    const trash = await this.getTrashItems();
    for (const nb of trash.notebooks) {
      await this.deleteNotebook(nb.id, true);
    }
    for (const sec of trash.sections) {
      await this.deleteSection(sec.id, true);
    }
    for (const page of trash.pages) {
      await this.deletePage(page.id, true);
    }
  }

  // --- Backup & Export ---
  async exportAllData(): Promise<string> {
    const [notebooks, sections, pages, tags, pageTags] = await Promise.all([
      this.getNotebooks(true),
      this.getSections(undefined, true),
      this.getPages(undefined, true),
      this.getTags(),
      this.getPageTags(),
    ]);

    // Gather blocks for all pages
    const blocksMap: Record<string, Block[]> = {};
    for (const p of pages) {
      blocksMap[p.id] = await this.getBlocks(p.id, true);
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      notebooks,
      sections,
      pages,
      blocks: blocksMap,
      tags,
      pageTags,
    };

    return JSON.stringify(payload, null, 2);
  }

  async importAllData(jsonString: string): Promise<boolean> {
    try {
      const data = JSON.parse(jsonString);
      if (!data.notebooks || !data.pages) {
        throw new Error('Invalid backup file format');
      }

      for (const nb of data.notebooks) {
        await this.saveNotebook(nb);
      }
      if (data.sections) {
        for (const sec of data.sections) {
          await this.saveSection(sec);
        }
      }
      for (const page of data.pages) {
        await this.savePage(page);
      }
      if (data.blocks) {
        for (const pageId of Object.keys(data.blocks)) {
          const blocks = data.blocks[pageId];
          await this.saveBlocks(blocks);
        }
      }
      if (data.tags) {
        for (const tag of data.tags) {
          await this.saveTag(tag);
        }
      }
      if (data.pageTags) {
        for (const pt of data.pageTags) {
          await this.savePageTag(pt.page_id, pt.tag_id);
        }
      }
      return true;
    } catch (e) {
      console.error('Import failed:', e);
      return false;
    }
  }

  // --- Seed Data Initializer ---
  async initializeDefaultDataIfEmpty(currentUserId: string): Promise<boolean> {
    const notebooks = await this.getNotebooks(false);
    if (notebooks.length > 0) {
      return false; // Already populated
    }

    const now = new Date().toISOString();
    const nb1Id = 'nb_personal_01';
    const nb2Id = 'nb_projects_02';

    // Notebook 1: Personal Knowledge Base
    const nb1: Notebook = {
      id: nb1Id,
      user_id: currentUserId,
      name: 'Personal Knowledge Base',
      description: 'Ideas, notes, architecture concepts and reading lists',
      icon: 'BookOpen',
      color: '#6366F1', // Indigo
      position: 0,
      is_archived: false,
      is_favorite: true,
      is_pinned: true,
      created_at: now,
      updated_at: now,
    };

    // Notebook 2: Work & Projects
    const nb2: Notebook = {
      id: nb2Id,
      user_id: currentUserId,
      name: 'Work & Projects',
      description: 'Development sprints, product roadmap and deliverables',
      icon: 'Briefcase',
      color: '#10B981', // Emerald
      position: 1,
      is_archived: false,
      is_favorite: false,
      created_at: now,
      updated_at: now,
    };

    // Sections for Notebook 1
    const sec1Id = 'sec_ideas_01';
    const sec2Id = 'sec_learning_02';
    const sec1: Section = {
      id: sec1Id,
      notebook_id: nb1Id,
      user_id: currentUserId,
      name: '💡 Ideas & Inspiration',
      color: '#6366F1',
      position: 0,
      is_archived: false,
      is_pinned: true,
      created_at: now,
      updated_at: now,
    };
    const sec2: Section = {
      id: sec2Id,
      notebook_id: nb1Id,
      user_id: currentUserId,
      name: '📚 Learning & Architecture',
      color: '#8B5CF6',
      position: 1,
      is_archived: false,
      created_at: now,
      updated_at: now,
    };

    // Section for Notebook 2
    const sec3Id = 'sec_sprints_03';
    const sec3: Section = {
      id: sec3Id,
      notebook_id: nb2Id,
      user_id: currentUserId,
      name: '🚀 Sprint Roadmap',
      color: '#10B981',
      position: 0,
      is_archived: false,
      created_at: now,
      updated_at: now,
    };

    // Pages
    const page1Id = 'page_welcome_01';
    const page2Id = 'page_ideas_02';
    const page3Id = 'page_arch_03';

    const page1: Page = {
      id: page1Id,
      section_id: sec1Id,
      notebook_id: nb1Id,
      user_id: currentUserId,
      title: 'Welcome to JNAS Notebook',
      icon: 'Sparkles',
      position: 0,
      is_archived: false,
      is_favorite: true,
      is_pinned: true,
      paper_style: 'blank',
      created_at: now,
      updated_at: now,
    };

    const page2: Page = {
      id: page2Id,
      section_id: sec1Id,
      notebook_id: nb1Id,
      user_id: currentUserId,
      title: 'Startup & Innovation Brainstorm',
      icon: 'Lightbulb',
      position: 1,
      is_archived: false,
      is_favorite: false,
      paper_style: 'ruled',
      created_at: now,
      updated_at: now,
    };

    const page3: Page = {
      id: page3Id,
      section_id: sec2Id,
      notebook_id: nb1Id,
      user_id: currentUserId,
      title: 'Cloudflare & Supabase Architecture',
      icon: 'Server',
      position: 0,
      is_archived: false,
      is_favorite: true,
      paper_style: 'grid',
      created_at: now,
      updated_at: now,
    };

    // Blocks for Page 1 (Welcome)
    const blocksPage1: Block[] = [
      {
        id: 'b1_callout',
        page_id: page1Id,
        user_id: currentUserId,
        type: 'callout',
        content: 'Your private, offline-first digital notebook inspired by Microsoft OneNote — built with modern web technologies, real block-based documents, and Supabase synchronization.',
        position: 0,
        metadata: { calloutType: 'tip' },
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1_h1',
        page_id: page1Id,
        user_id: currentUserId,
        type: 'heading1',
        content: 'Personal Knowledge Base Features',
        position: 1,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1_checklist',
        page_id: page1Id,
        user_id: currentUserId,
        type: 'checklist',
        content: 'Core Setup Milestones',
        position: 2,
        metadata: {
          checklistItems: [
            { id: 'c1', text: 'Offline-First IndexedDB storage ready', completed: true, priority: 'high' },
            { id: 'c2', text: 'Three-level OneNote hierarchy (Notebook → Section → Page)', completed: true, priority: 'high' },
            { id: 'c3', text: 'Connect Supabase for multi-device sync in Settings', completed: false, priority: 'medium' },
            { id: 'c4', text: 'Try drawing canvas or digital ink scratchpad', completed: false, priority: 'low' },
          ],
        },
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1_table',
        page_id: page1Id,
        user_id: currentUserId,
        type: 'table',
        content: '',
        position: 3,
        metadata: {
          tableData: {
            headers: ['Shortcut', 'Action', 'Scope'],
            rows: [
              ['Ctrl + K', 'Global Instant Search', 'Global across all notes'],
              ['Ctrl + B / I / U', 'Bold, Italic, Underline', 'Selected rich text'],
              ['/ (Slash)', 'Open Block Insertion Menu', 'Editor canvas'],
              ['Ctrl + S', 'Force immediate cloud sync', 'Active document'],
            ],
          },
        },
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b1_drawing',
        page_id: page1Id,
        user_id: currentUserId,
        type: 'drawing',
        content: 'Digital Ink & Sketchpad',
        position: 4,
        metadata: {
          drawingData: {
            strokes: [],
          },
        },
        created_at: now,
        updated_at: now,
      },
    ];

    // Blocks for Page 3 (Architecture)
    const blocksPage3: Block[] = [
      {
        id: 'b3_h1',
        page_id: page3Id,
        user_id: currentUserId,
        type: 'heading1',
        content: 'Full Stack Architecture & Data Model',
        position: 0,
        created_at: now,
        updated_at: now,
      },
      {
        id: 'b3_code',
        page_id: page3Id,
        user_id: currentUserId,
        type: 'code',
        content: `-- Supabase Row Level Security (RLS) Blueprint
CREATE TABLE notebooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT NOT NULL DEFAULT '#6366F1',
  position INTEGER DEFAULT 0,
  is_archived BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own notebooks" ON notebooks
  FOR ALL USING (auth.uid() = user_id);`,
        position: 1,
        metadata: { language: 'sql' },
        created_at: now,
        updated_at: now,
      },
    ];

    // Tags
    const tagImportant: Tag = {
      id: 'tag_important',
      user_id: currentUserId,
      name: 'important',
      color: '#F43F5E',
      created_at: now,
    };
    const tagArchitecture: Tag = {
      id: 'tag_arch',
      user_id: currentUserId,
      name: 'architecture',
      color: '#6366F1',
      created_at: now,
    };
    const tagIdea: Tag = {
      id: 'tag_idea',
      user_id: currentUserId,
      name: 'idea',
      color: '#F59E0B',
      created_at: now,
    };

    // Save all to IndexedDB
    await this.saveNotebook(nb1);
    await this.saveNotebook(nb2);
    await this.saveSection(sec1);
    await this.saveSection(sec2);
    await this.saveSection(sec3);
    await this.savePage(page1);
    await this.savePage(page2);
    await this.savePage(page3);
    await this.saveBlocks(blocksPage1);
    await this.saveBlocks(blocksPage3);
    await this.saveTag(tagImportant);
    await this.saveTag(tagArchitecture);
    await this.saveTag(tagIdea);
    await this.savePageTag(page1Id, 'tag_important');
    await this.savePageTag(page3Id, 'tag_arch');

    return true;
  }
}

export const indexedDb = new IndexedDbService();
