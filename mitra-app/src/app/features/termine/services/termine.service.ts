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

  private getWocheVonBis(): { von: string; bis: string } {
    const heute = new Date();
    const wochentag = heute.getDay();
    const diffZuMontag = wochentag === 0 ? -6 : 1 - wochentag;
    const montag = new Date(heute);
    montag.setDate(heute.getDate() + diffZuMontag);
    montag.setHours(0, 0, 0, 0);
    const sonntag = new Date(montag);
    sonntag.setDate(montag.getDate() + 6);
    return {
      von: montag.toISOString().slice(0, 10),
      bis: sonntag.toISOString().slice(0, 10),
    };
  }

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokal = await this.db.termine.orderBy('beginn').toArray();
      this.store.setTermine(lokal);

      if (!navigator.onLine) return;

      if (this.auth.currentUser()?.hero_partner_id) {
        await this.heroSync(7);
      }

      const { von, bis } = this.getWocheVonBis();
      const server = await firstValueFrom(
        this.api.get<Termin[]>(`/termine/?von=${von}&bis=${bis}`)
      );
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

  async heroSync(tage: 7 | 14 | 30 = 7): Promise<{ neu: number; aktualisiert: number }> {
    try {
      const result = await firstValueFrom(
        this.api.post<{ neu: number; aktualisiert: number }>('/termine/hero-sync/', { tage })
      );
      const { von, bis } = this.getWocheVonBis();
      const serverDaten = await firstValueFrom(
        this.api.get<Termin[]>(`/termine/?von=${von}&bis=${bis}`)
      );
      if (serverDaten) {
        await this.db.termine.bulkPut(serverDaten);
        this.store.setTermine(serverDaten);
      }
      return result ?? { neu: 0, aktualisiert: 0 };
    } catch {
      return { neu: 0, aktualisiert: 0 };
    }
  }

  async checkReminders(): Promise<void> {
    if (!navigator.onLine) return;
    try {
      await firstValueFrom(this.api.post<void>('/termine/check-reminders/', {}));
    } catch { /* ignorieren */ }
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
      erinnerung_ton: request.erinnerung_ton ?? true,
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
