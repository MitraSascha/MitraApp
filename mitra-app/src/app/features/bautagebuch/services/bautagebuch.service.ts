import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Tagesbericht, TagesberichtCreateRequest } from '../../../core/models/bautagebuch.model';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { BautagebuchStore } from '../stores/bautagebuch.store';
import { AuthService } from '../../../core/services/auth.service';
import { UIStore } from '../../../shared/ui/ui.store';

@Injectable({ providedIn: 'root' })
export class BautagebuchService {
  private readonly api = inject(ApiService);
  private readonly sync = inject(SyncService);
  private readonly db = inject(MitraDbService);
  private readonly store = inject(BautagebuchStore);
  private readonly auth = inject(AuthService);
  private readonly ui = inject(UIStore);

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokal = await this.db.bautagebuch.orderBy('datum').reverse().toArray();
      this.store.setBerichte(lokal);

      if (!navigator.onLine) return;

      const server = await firstValueFrom(this.api.get<Tagesbericht[]>('/bautagebuch/'));
      if (server) {
        const pendingIds = new Set(
          lokal.filter(b => b.sync_status === 'pending').map(b => b.id)
        );
        const pendingItems = lokal.filter(b => pendingIds.has(b.id));
        const merged = [
          ...server.filter(b => !pendingIds.has(b.id)),
          ...pendingItems,
        ];
        await this.db.bautagebuch.bulkPut(server.filter(b => !pendingIds.has(b.id)));
        this.store.setBerichte(merged);
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status && status >= 400) {
        this.ui.showToast('Bautagebuch konnte nicht geladen werden');
      }
    } finally {
      this.store.setLoading(false);
    }
  }

  async erstelle(request: TagesberichtCreateRequest): Promise<Tagesbericht> {
    const user = this.auth.currentUser();
    const now = new Date().toISOString();
    const bericht: Tagesbericht = {
      id: uuidv4(),
      datum: request.datum,
      projekt_name: request.projekt_name,
      projekt_adresse: request.projekt_adresse ?? {},
      wetter: '',
      mitarbeiter: [],
      arbeiten_beschreibung: '',
      arbeiten_items: [],
      maengel: [],
      checkliste: [],
      materialliste: [],
      bemerkungen: '',
      fotos: [],
      erstellt_am: now,
      geaendert_am: now,
      erstellt_von: user?.id ?? 0,
      sync_status: 'pending',
      version: 1,
    };

    await this.db.bautagebuch.add(bericht);
    this.store.addBericht(bericht);

    await this.sync.enqueue({
      entity_type: 'bautagebuch',
      entity_id: bericht.id,
      operation: 'create',
      payload: bericht as unknown as Record<string, unknown>,
      priority: 3,
    });

    if (navigator.onLine) this.sync.processQueue();
    return bericht;
  }

  async aktualisiere(id: string, changes: Partial<Tagesbericht>): Promise<void> {
    const existing = await this.db.bautagebuch.get(id);
    if (!existing) return;

    const updated: Tagesbericht = {
      ...existing,
      ...changes,
      geaendert_am: new Date().toISOString(),
      sync_status: 'pending',
      version: existing.version + 1,
    };

    await this.db.bautagebuch.put(updated);
    this.store.updateBericht(updated);

    await this.sync.enqueue({
      entity_type: 'bautagebuch',
      entity_id: id,
      operation: 'update',
      payload: updated as unknown as Record<string, unknown>,
      priority: 3,
    });

    if (navigator.onLine) this.sync.processQueue();
  }

  // ── KI-Analyse ──

  async kiArbeiten(berichtId: string, text: string): Promise<{ items: any[] }> {
    return firstValueFrom(
      this.api.post<{ items: any[] }>(`/bautagebuch/${berichtId}/ki-arbeiten/`, { text })
    );
  }

  async kiMaengel(berichtId: string, text: string): Promise<{ items: any[] }> {
    return firstValueFrom(
      this.api.post<{ items: any[] }>(`/bautagebuch/${berichtId}/ki-maengel/`, { text })
    );
  }

  async kiMaterialliste(berichtId: string, text: string): Promise<{ items: any[] }> {
    return firstValueFrom(
      this.api.post<{ items: any[] }>(`/bautagebuch/${berichtId}/ki-materialliste/`, { text })
    );
  }

  async loesche(id: string): Promise<void> {
    await this.db.bautagebuch.delete(id);
    this.store.removeBericht(id);

    await this.sync.enqueue({
      entity_type: 'bautagebuch',
      entity_id: id,
      operation: 'delete',
      payload: { id },
      priority: 3,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }
}
