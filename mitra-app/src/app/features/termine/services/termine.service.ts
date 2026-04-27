import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Termin, TerminCreateRequest } from '../../../core/models/termin.model';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { TerminStore } from '../stores/termine.store';
import { AuthService } from '../../../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class TermineService {
  private readonly api = inject(ApiService);
  private readonly sync = inject(SyncService);
  private readonly db = inject(MitraDbService);
  private readonly store = inject(TerminStore);
  private readonly auth = inject(AuthService);

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokal = await this.db.termine.orderBy('beginn').toArray();
      this.store.setTermine(lokal);

      if (!navigator.onLine) return;

      if (this.auth.currentUser()?.hero_partner_id) {
        await this.heroSync();
      }

      const server = await firstValueFrom(this.api.get<Termin[]>('/termine/'));
      if (server) {
        await this.db.termine.bulkPut(server);
        this.store.setTermine(server);
      }
    } catch {
      // Offline: lokale Daten bleiben
    } finally {
      this.store.setLoading(false);
    }
  }

  async heroSync(): Promise<void> {
    try {
      await firstValueFrom(this.api.post<void>('/termine/hero-sync/', {}));
      // Nach Sync: Server-Daten neu laden
      const serverDaten = await firstValueFrom(this.api.get<Termin[]>('/termine/'));
      if (serverDaten) {
        await this.db.termine.bulkPut(serverDaten);
        this.store.setTermine(serverDaten);
      }
    } catch {
      // HERO Sync optional — kein crash bei Fehler
    }
  }

  async erstelle(request: TerminCreateRequest): Promise<Termin> {
    const user = this.auth.currentUser();
    const now = new Date().toISOString();
    const termin: Termin = {
      id: uuidv4(),
      local_id: uuidv4(),
      titel: request.titel,
      typ: request.typ,
      status: 'geplant',
      beginn: request.beginn,
      ende: request.ende,
      ganztaegig: request.ganztaegig ?? false,
      adresse: request.adresse as Termin['adresse'],
      monteure: request.monteure ?? (user ? [user.id] : []),
      push_gesendet: false,
      erinnerung_minuten: request.erinnerung_minuten ?? 30,
      erstellt_am: now,
      geaendert_am: now,
      sync_status: 'pending',
      version: 1,
    };

    await this.db.termine.add(termin);
    this.store.addTermin(termin);

    await this.sync.enqueue({
      entity_type: 'termin',
      entity_id: termin.id,
      operation: 'create',
      payload: termin as unknown as Record<string, unknown>,
      priority: 2,
    });

    if (navigator.onLine) await this.sync.processQueue();
    return termin;
  }

  async aktualisiere(id: string, changes: Partial<Termin>): Promise<void> {
    const existing = await this.db.termine.get(id);
    if (!existing) return;

    const updated: Termin = {
      ...existing,
      ...changes,
      geaendert_am: new Date().toISOString(),
      sync_status: 'pending',
      version: existing.version + 1,
    };

    await this.db.termine.put(updated);
    this.store.updateTermin(updated);

    await this.sync.enqueue({
      entity_type: 'termin',
      entity_id: id,
      operation: 'update',
      payload: updated as unknown as Record<string, unknown>,
      priority: 2,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }

  async loesche(id: string): Promise<void> {
    await this.db.termine.delete(id);
    this.store.removeTermin(id);

    await this.sync.enqueue({
      entity_type: 'termin',
      entity_id: id,
      operation: 'delete',
      payload: { id },
      priority: 2,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }

  getTermineImBereich(start: string, end: string): Termin[] {
    return this.store.getTermineImBereich(start, end);
  }
}
