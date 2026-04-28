import { Injectable, signal, computed, inject } from '@angular/core';
import { MitraDbService } from '../db/mitra-db.service';
import { ApiService } from './api.service';
import { UIStore } from '../../shared/ui/ui.store';
import { SyncQueueItem, SyncResult, SyncConflict } from '../models/sync.model';

@Injectable({ providedIn: 'root' })
export class SyncService {
  private readonly db = inject(MitraDbService);
  private readonly api = inject(ApiService);
  private readonly uiStore = inject(UIStore);

  private readonly _isSyncing = signal<boolean>(false);
  private readonly _pendingCount = signal<number>(0);
  private readonly _lastSyncAt = signal<Date | null>(null);

  readonly isSyncing = this._isSyncing.asReadonly();
  readonly pendingCount = this._pendingCount.asReadonly();
  readonly lastSyncAt = this._lastSyncAt.asReadonly();
  readonly hasPending = computed(() => this._pendingCount() > 0);

  private foregroundInterval: ReturnType<typeof setInterval> | null = null;

  init(): void {
    // Online-Event
    window.addEventListener('online', () => {
      this.uiStore.setOnline(true);
      this.processQueue();
    });
    window.addEventListener('offline', () => {
      this.uiStore.setOnline(false);
    });

    // Visibility-Change (Tab-Fokus)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        this.processQueue();
      }
    });

    // Foreground-Tick alle 60s
    this.foregroundInterval = setInterval(() => {
      if (!document.hidden && navigator.onLine) {
        this.processQueue();
      }
    }, 60_000);

    // SW Background Sync registrieren (Chrome/Edge/Firefox, nicht iOS)
    this.registerBackgroundSync();

    // Initiale Queue-Verarbeitung
    if (navigator.onLine) {
      this.processQueue();
    }

    this.updatePendingCount();
  }

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'attempts' | 'status'>): Promise<void> {
    await this.db.sync_queue.add({
      ...item,
      created_at: Date.now(),
      attempts: 0,
      status: 'pending',
    } as SyncQueueItem);
    await this.updatePendingCount();
  }

  async processQueue(): Promise<SyncResult> {
    if (this._isSyncing()) return { success: true, synced_count: 0, failed_count: 0, conflicts: [] };
    if (!navigator.onLine) return { success: false, synced_count: 0, failed_count: 0, conflicts: [] };

    this._isSyncing.set(true);
    const result: SyncResult = { success: true, synced_count: 0, failed_count: 0, conflicts: [] };

    try {
      const items = await this.db.sync_queue
        .where('status').equals('pending')
        .sortBy('[priority+created_at]');

      for (const item of items) {
        const result_entity = await this.syncEntity(item);
        if (result_entity === true) {
          await this.db.sync_queue.update(item.id!, { status: 'completed' });
          result.synced_count++;
        } else if (result_entity === 'dead') {
          // 4xx-Fehler: Payload ist dauerhaft invalid — sofort als failed markieren
          await this.db.sync_queue.update(item.id!, {
            status: 'failed',
            attempts: item.attempts + 1,
            last_attempt_at: Date.now(),
          });
          result.failed_count++;
        } else {
          await this.db.sync_queue.update(item.id!, {
            status: item.attempts >= 3 ? 'failed' : 'pending',
            attempts: item.attempts + 1,
            last_attempt_at: Date.now(),
          });
          result.failed_count++;
        }
      }

      this._lastSyncAt.set(new Date());
    } finally {
      this._isSyncing.set(false);
      await this.updatePendingCount();
    }

    return result;
  }

  async retryFailed(): Promise<SyncResult> {
    await this.db.sync_queue.where('status').equals('failed').modify({ status: 'pending', attempts: 0 });
    return this.processQueue();
  }

  async clearCompleted(): Promise<void> {
    await this.db.sync_queue.where('status').equals('completed').delete();
  }

  async getQueueItems(): Promise<SyncQueueItem[]> {
    return this.db.sync_queue.toArray();
  }

  private async updatePendingCount(): Promise<void> {
    const count = await this.db.sync_queue.where('status').equals('pending').count();
    this._pendingCount.set(count);
  }

  private async syncEntity(item: SyncQueueItem): Promise<boolean | 'dead'> {
    const pathMap: Record<string, string> = {
      notiz: '/notizen/',
      termin: '/termine/',
      kontakt: '/kontakte/',
      angebot: '/angebote/',
    };
    const basePath = pathMap[item.entity_type];
    if (!basePath) return false;

    try {
      if (item.operation === 'create') {
        await this.api.post(basePath, item.payload).toPromise();
      } else if (item.operation === 'update') {
        await this.api.put(`${basePath}${item.entity_id}/`, item.payload).toPromise();
      } else if (item.operation === 'delete') {
        await this.api.delete(`${basePath}${item.entity_id}/`).toPromise();
      }
      return true;
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: unknown };
      if (httpErr?.status && httpErr.status >= 400 && httpErr.status < 500) {
        console.error(
          `[Sync] ${httpErr.status} auf ${item.entity_type}/${item.entity_id}:`,
          JSON.stringify(httpErr.error, null, 2),
          '\nPayload:', item.payload,
        );
        return 'dead';  // Client-Fehler — kein Retry sinnvoll
      }
      return false;
    }
  }

  private async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const reg = await navigator.serviceWorker.ready;
        await (reg as ServiceWorkerRegistration & { sync: { register(tag: string): Promise<void> } }).sync.register('mitra-sync');
      } catch {
        // Background Sync nicht verfügbar (iOS) — kein Fehler
      }
    }
  }
}
