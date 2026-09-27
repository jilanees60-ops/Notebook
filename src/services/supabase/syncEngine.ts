import { getSupabaseClient } from './client';
import { indexedDb } from '../db/indexedDb';
import { SyncStatus, SyncQueueItem } from '../../types/notebook';

type SyncListener = (status: SyncStatus, message?: string) => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private currentStatus: SyncStatus = 'idle';
  private isSyncing = false;
  private syncTimer: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.setStatus('syncing', 'Back online. Synchronizing data...');
        this.sync();
      });

      window.addEventListener('offline', () => {
        this.setStatus('offline', 'Working offline. Changes saved locally.');
      });
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setStatus(status: SyncStatus, message?: string) {
    this.currentStatus = status;
    this.listeners.forEach((listener) => listener(status, message));
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  public scheduleSync(delayMs = 1500) {
    if (this.syncTimer) {
      clearTimeout(this.syncTimer);
    }
    this.setStatus('saving', 'Saving changes...');
    this.syncTimer = setTimeout(() => {
      this.sync();
    }, delayMs);
  }

  public async sync(): Promise<void> {
    if (this.isSyncing) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setStatus('offline', 'Offline. Changes stored locally in IndexedDB.');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      // Offline / Local-only mode
      this.setStatus('saved', 'Saved locally in IndexedDB');
      return;
    }

    this.isSyncing = true;
    this.setStatus('syncing', 'Syncing with Supabase...');

    try {
      // 1. Process Outgoing Sync Queue
      const queue = await indexedDb.getSyncQueue();
      for (const item of queue) {
        try {
          await this.processQueueItem(client, item);
          await indexedDb.dequeueSync(item.id);
        } catch (itemErr) {
          console.warn(`Error syncing item ${item.table} ${item.record_id}:`, itemErr);
          // Increment retry count
          item.retry_count = (item.retry_count || 0) + 1;
          if (item.retry_count > 5) {
            // Drop problematic item after 5 failed tries
            await indexedDb.dequeueSync(item.id);
          } else {
            await indexedDb.enqueueSync(item);
          }
        }
      }

      // 2. Pull Remote Changes (if user is authenticated in Supabase)
      const { data: { session } } = await client.auth.getSession();
      if (session?.user) {
        await this.pullRemoteData(client, session.user.id);
      }

      this.setStatus('synced', 'Synced with cloud');
      setTimeout(() => {
        if (this.currentStatus === 'synced') {
          this.setStatus('saved', 'All changes saved');
        }
      }, 3000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.setStatus('error', err?.message || 'Sync error. Working offline.');
    } finally {
      this.isSyncing = false;
    }
  }

  private async processQueueItem(client: any, item: SyncQueueItem): Promise<void> {
    const { table, action, payload } = item;

    if (action === 'delete') {
      const { error } = await client.from(table).delete().eq('id', item.record_id);
      if (error) throw error;
      return;
    }

    // Insert or update (upsert)
    const { error } = await client.from(table).upsert(payload);
    if (error) throw error;
  }

  private async pullRemoteData(client: any, userId: string): Promise<void> {
    try {
      // Pull notebooks
      const { data: remoteNotebooks } = await client
        .from('notebooks')
        .select('*')
        .eq('user_id', userId);

      if (remoteNotebooks && remoteNotebooks.length > 0) {
        for (const nb of remoteNotebooks) {
          await indexedDb.saveNotebook(nb);
        }
      }

      // Pull sections
      const { data: remoteSections } = await client
        .from('sections')
        .select('*')
        .eq('user_id', userId);

      if (remoteSections && remoteSections.length > 0) {
        for (const sec of remoteSections) {
          await indexedDb.saveSection(sec);
        }
      }

      // Pull pages
      const { data: remotePages } = await client
        .from('pages')
        .select('*')
        .eq('user_id', userId);

      if (remotePages && remotePages.length > 0) {
        for (const page of remotePages) {
          await indexedDb.savePage(page);
        }
      }

      // Pull blocks
      const { data: remoteBlocks } = await client
        .from('blocks')
        .select('*')
        .eq('user_id', userId);

      if (remoteBlocks && remoteBlocks.length > 0) {
        await indexedDb.saveBlocks(remoteBlocks);
      }
    } catch (pullErr) {
      console.warn('Failed to pull some remote data:', pullErr);
    }
  }
}

export const syncEngine = new SyncEngine();
