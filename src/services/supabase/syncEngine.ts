import { getSupabaseClient, getSupabaseSession } from './client';
import { indexedDb } from '../db/indexedDb';
import { SyncStatus, SyncQueueItem } from '../../types/notebook';

type SyncListener = (status: SyncStatus, message?: string) => void;
type DataPulledListener = () => void;

class SyncEngine {
  private listeners: Set<SyncListener> = new Set();
  private dataPulledListeners: Set<DataPulledListener> = new Set();
  private currentStatus: SyncStatus = 'saved';
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

  public onDataPulled(listener: DataPulledListener): () => void {
    this.dataPulledListeners.add(listener);
    return () => {
      this.dataPulledListeners.delete(listener);
    };
  }

  public setStatus(status: SyncStatus, message?: string) {
    this.currentStatus = status;
    this.listeners.forEach((listener) => listener(status, message));
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  public scheduleSync(delayMs = 1200) {
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
      // Local-only mode (No Supabase client configured)
      this.setStatus('local', 'Local only (IndexedDB)');
      return;
    }

    // Verify authenticated cloud session
    const session = await getSupabaseSession();
    const authUserId = session?.user?.id;

    if (!authUserId) {
      // User is not authenticated with Supabase.
      // Strictly do not attempt cloud writes with a fake user ID!
      this.setStatus('local', 'Local only');
      return;
    }

    this.isSyncing = true;
    this.setStatus('syncing', 'Syncing with Supabase...');

    try {
      // 1. Process Outgoing Sync Queue
      const queue = await indexedDb.getSyncQueue();
      for (const item of queue) {
        try {
          await this.processQueueItem(client, item, authUserId);
          await indexedDb.dequeueSync(item.id);
        } catch (itemErr) {
          console.warn(`Error syncing item ${item.table} ${item.record_id}:`, itemErr);
          item.retry_count = (item.retry_count || 0) + 1;
          if (item.retry_count > 5) {
            // Drop problematic item after 5 failed tries to unblock queue
            await indexedDb.dequeueSync(item.id);
          } else {
            await indexedDb.enqueueSync(item);
          }
        }
      }

      // 2. Pull Remote Changes for this authenticated user
      const pulled = await this.pullRemoteData(client, authUserId);
      if (pulled) {
        this.dataPulledListeners.forEach((listener) => listener());
      }

      this.setStatus('synced', 'Synced with cloud');
      setTimeout(() => {
        if (this.currentStatus === 'synced') {
          this.setStatus('saved', 'Saved');
        }
      }, 3000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      this.setStatus('error', err?.message || 'Sync error. Working offline.');
    } finally {
      this.isSyncing = false;
    }
  }

  private async processQueueItem(client: any, item: SyncQueueItem, authUserId: string): Promise<void> {
    const { table, action, payload } = item;

    if (action === 'delete') {
      // Enforce user ownership on delete
      const { error } = await client
        .from(table)
        .delete()
        .eq('id', item.record_id)
        .eq('user_id', authUserId);
      if (error) throw error;
      return;
    }

    // Attach verified authenticated user_id to satisfy Supabase RLS
    const remotePayload = {
      ...payload,
      user_id: authUserId,
    };

    // Upsert record into authenticated user's private database
    const { error } = await client.from(table).upsert(remotePayload);
    if (error) throw error;
  }

  private async pullRemoteData(client: any, userId: string): Promise<boolean> {
    let hasPulledAny = false;
    try {
      // Pull notebooks
      const { data: remoteNotebooks } = await client
        .from('notebooks')
        .select('*')
        .eq('user_id', userId);

      if (remoteNotebooks && remoteNotebooks.length > 0) {
        const localNotebooks = await indexedDb.getNotebooks(true);
        for (const remote of remoteNotebooks) {
          const local = localNotebooks.find((n) => n.id === remote.id);
          if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
            await indexedDb.saveNotebook(remote);
            hasPulledAny = true;
          }
        }
      }

      // Pull sections
      const { data: remoteSections } = await client
        .from('sections')
        .select('*')
        .eq('user_id', userId);

      if (remoteSections && remoteSections.length > 0) {
        const localSections = await indexedDb.getSections(undefined, true);
        for (const remote of remoteSections) {
          const local = localSections.find((s) => s.id === remote.id);
          if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
            await indexedDb.saveSection(remote);
            hasPulledAny = true;
          }
        }
      }

      // Pull pages
      const { data: remotePages } = await client
        .from('pages')
        .select('*')
        .eq('user_id', userId);

      if (remotePages && remotePages.length > 0) {
        for (const remote of remotePages) {
          const local = await indexedDb.getPage(remote.id);
          if (!local || new Date(remote.updated_at) >= new Date(local.updated_at)) {
            await indexedDb.savePage(remote);
            hasPulledAny = true;
          }
        }
      }

      // Pull blocks
      const { data: remoteBlocks } = await client
        .from('blocks')
        .select('*')
        .eq('user_id', userId);

      if (remoteBlocks && remoteBlocks.length > 0) {
        await indexedDb.saveBlocks(remoteBlocks);
        hasPulledAny = true;
      }
    } catch (pullErr) {
      console.warn('Failed to pull some remote data:', pullErr);
    }
    return hasPulledAny;
  }
}

export const syncEngine = new SyncEngine();
