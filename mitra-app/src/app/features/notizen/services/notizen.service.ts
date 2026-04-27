import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import {
  Notiz, NotizCreateRequest, NotizStatus,
  KiStrukturierRequest, KiStrukturierResponse,
} from '../../../core/models/notiz.model';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { NotizStore } from '../stores/notizen.store';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class NotizenService {
  private readonly api   = inject(ApiService);
  private readonly sync  = inject(SyncService);
  private readonly db    = inject(MitraDbService);
  private readonly store = inject(NotizStore);
  private readonly auth  = inject(AuthService);

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokaleDaten = await this.db.notizen.orderBy('erstellt_am').reverse().toArray();
      this.store.setNotizen(lokaleDaten);

      if (!navigator.onLine) return;

      const serverDaten = await firstValueFrom(this.api.get<Notiz[]>('/notizen/'));
      if (serverDaten) {
        await this.db.notizen.bulkPut(serverDaten);
        this.store.setNotizen(serverDaten);
      }
    } catch {
      // Offline: lokale Daten bleiben erhalten
    } finally {
      this.store.setLoading(false);
    }
  }

  async erstelle(request: NotizCreateRequest): Promise<Notiz> {
    const user = this.auth.currentUser();
    const now  = new Date().toISOString();
    const notiz: Notiz = {
      id:              uuidv4(),
      local_id:        uuidv4(),
      titel:           request.titel,
      freitext:        request.freitext,
      typ:             request.typ,
      vonwem:          request.vonwem ?? 'kunde',
      topic:           request.topic  ?? 'allgemein',
      status:          'offen',
      ki_items:        [],
      hersteller_pills: request.hersteller_pills ?? [],
      kategorien:      request.kategorien ?? [],
      fotos:           [],
      erstellt_am:     now,
      geaendert_am:    now,
      erstellt_von:    user?.id ?? 0,
      sync_status:     'pending',
      version:         1,
    };

    await this.db.notizen.add(notiz);
    this.store.addNotiz(notiz);

    await this.sync.enqueue({
      entity_type: 'notiz',
      entity_id:   notiz.id,
      operation:   'create',
      payload:     notiz as unknown as Record<string, unknown>,
      priority:    3,
    });

    if (navigator.onLine) {
      await this.sync.processQueue();
    }

    return notiz;
  }

  async aktualisiere(id: string, changes: Partial<Notiz>): Promise<void> {
    const existing = await this.db.notizen.get(id);
    if (!existing) return;

    const updated: Notiz = {
      ...existing,
      ...changes,
      geaendert_am: new Date().toISOString(),
      sync_status:  'pending',
      version:      existing.version + 1,
    };

    await this.db.notizen.put(updated);
    this.store.updateNotiz(updated);

    await this.sync.enqueue({
      entity_type: 'notiz',
      entity_id:   id,
      operation:   'update',
      payload:     updated as unknown as Record<string, unknown>,
      priority:    3,
    });

    if (navigator.onLine) {
      await this.sync.processQueue();
    }
  }

  async statusAendern(id: string, status: NotizStatus): Promise<void> {
    await this.aktualisiere(id, { status });
  }

  async loesche(id: string): Promise<void> {
    await this.db.notizen.delete(id);
    this.store.removeNotiz(id);

    await this.sync.enqueue({
      entity_type: 'notiz',
      entity_id:   id,
      operation:   'delete',
      payload:     { id },
      priority:    3,
    });

    if (navigator.onLine) {
      await this.sync.processQueue();
    }
  }

  async strukturierePerKI(request: KiStrukturierRequest): Promise<KiStrukturierResponse> {
    return firstValueFrom(
      this.api.post<KiStrukturierResponse>('/ki/strukturiere-notiz/', request)
    );
  }

  async transkribiereAudio(audioBlob: Blob): Promise<string> {
    const file   = new File([audioBlob], 'aufnahme.webm', { type: audioBlob.type });
    const result = await firstValueFrom(
      this.api.uploadFile<{ text: string }>('/ki/transkribiere/', file)
    );
    return result.text;
  }
}
