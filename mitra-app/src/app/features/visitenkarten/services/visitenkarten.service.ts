import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Kontakt, KiVisitenkarteResponse } from '../../../core/models/kontakt.model';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { VisitenkartenStore } from '../stores/visitenkarten.store';

@Injectable({ providedIn: 'root' })
export class VisitenkartenService {
  private readonly api = inject(ApiService);
  private readonly sync = inject(SyncService);
  private readonly db = inject(MitraDbService);
  private readonly store = inject(VisitenkartenStore);

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokal = await this.db.kontakte.orderBy('firma').toArray();
      this.store.setKontakte(lokal);

      if (!navigator.onLine) return;

      const server = await firstValueFrom(this.api.get<Kontakt[]>('/kontakte/'));
      if (server) {
        await this.db.kontakte.bulkPut(server);
        this.store.setKontakte(server);
      }
    } catch {
      // Offline: lokale Daten bleiben
    } finally {
      this.store.setLoading(false);
    }
  }

  async erstelle(data: Partial<Kontakt>): Promise<Kontakt> {
    const now = new Date().toISOString();
    const kontakt: Kontakt = {
      id: uuidv4(),
      local_id: uuidv4(),
      firma: data.firma ?? '',
      ansprechpartner: data.ansprechpartner,
      position: data.position,
      mobil: data.mobil,
      telefon: data.telefon,
      email: data.email,
      website: data.website,
      adresse: data.adresse,
      branche: data.branche,
      bewertung: data.bewertung,
      zuverlaessigkeit: data.zuverlaessigkeit,
      ist_lieferant: data.ist_lieferant ?? false,
      zahlungsziel_tage: data.zahlungsziel_tage,
      tags: data.tags ?? [],
      notiz: data.notiz,
      foto_url: data.foto_url,
      erstellt_am: now,
      gespraechsnotizen: [],
      sync_status: 'pending',
      version: 1,
    };

    await this.db.kontakte.add(kontakt);
    this.store.addKontakt(kontakt);

    await this.sync.enqueue({
      entity_type: 'kontakt',
      entity_id: kontakt.id,
      operation: 'create',
      payload: kontakt as unknown as Record<string, unknown>,
      priority: 4,
    });

    if (navigator.onLine) await this.sync.processQueue();
    return kontakt;
  }

  async aktualisiere(id: string, changes: Partial<Kontakt>): Promise<void> {
    const existing = await this.db.kontakte.get(id);
    if (!existing) return;

    const updated: Kontakt = {
      ...existing,
      ...changes,
      sync_status: 'pending',
      version: existing.version + 1,
    };

    await this.db.kontakte.put(updated);
    this.store.updateKontakt(updated);

    await this.sync.enqueue({
      entity_type: 'kontakt',
      entity_id: id,
      operation: 'update',
      payload: updated as unknown as Record<string, unknown>,
      priority: 4,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }

  async loesche(id: string): Promise<void> {
    await this.db.kontakte.delete(id);
    this.store.removeKontakt(id);

    await this.sync.enqueue({
      entity_type: 'kontakt',
      entity_id: id,
      operation: 'delete',
      payload: { id },
      priority: 4,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }

  async leseVisitenkartePerKI(foto: File): Promise<KiVisitenkarteResponse> {
    return firstValueFrom(
      this.api.uploadFile<KiVisitenkarteResponse>('/ki/lese-visitenkarte/', foto)
    );
  }
}
