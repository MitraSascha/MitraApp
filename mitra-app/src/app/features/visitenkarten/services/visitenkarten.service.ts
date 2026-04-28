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
        // foto_url wird nicht ans Backend gesynct (base64 zu groß).
        // Beim Überschreiben des lokalen Eintrags das lokale Foto erhalten.
        const merged = await Promise.all(
          server.map(async (k) => {
            if (k.foto_url) return k;
            const lokal = await this.db.kontakte.get(k.id);
            return lokal?.foto_url ? { ...k, foto_url: lokal.foto_url } : k;
          }),
        );
        await this.db.kontakte.bulkPut(merged);
        this.store.setKontakte(merged);
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
      payload: this.syncPayload(kontakt),
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
      payload: this.syncPayload(updated),
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

  /** Entfernt Felder aus dem Payload, die der Server nicht akzeptiert. */
  private syncPayload(kontakt: Kontakt): Record<string, unknown> {
    const { local_id, ...rest } = kontakt as Kontakt & { local_id?: string };
    // base64-DataURLs bleiben lokal — Backend erwartet max. 500-Zeichen-URL
    if (rest.foto_url?.startsWith('data:')) {
      rest.foto_url = undefined;
    }
    return rest as unknown as Record<string, unknown>;
  }

  async leseVisitenkartePerKI(vorderseite: File, rueckseite?: File): Promise<KiVisitenkarteResponse> {
    const files: Record<string, File> = { file: vorderseite };
    if (rueckseite) files['file_rueckseite'] = rueckseite;
    return firstValueFrom(
      this.api.uploadFiles<KiVisitenkarteResponse>('/ki/lese-visitenkarte/', files)
    );
  }
}
