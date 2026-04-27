import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Angebot, Angebotsposition, AngebotAusNotizRequest } from '../../../core/models/angebot.model';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { AngeboteStore } from '../stores/angebote.store';

@Injectable({ providedIn: 'root' })
export class AngeboteService {
  private readonly api = inject(ApiService);
  private readonly sync = inject(SyncService);
  private readonly db = inject(MitraDbService);
  private readonly store = inject(AngeboteStore);

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokal = await this.db.angebote.orderBy('erstellt_am').reverse().toArray();
      this.store.setAngebote(lokal);

      if (!navigator.onLine) return;

      const server = await firstValueFrom(this.api.get<Angebot[]>('/angebote/'));
      if (server) {
        await this.db.angebote.bulkPut(server);
        this.store.setAngebote(server);
      }
    } catch {
      // Offline: lokale Daten bleiben
    } finally {
      this.store.setLoading(false);
    }
  }

  /**
   * KI-Pipeline: Notiz → Angebot generieren (Django Backend)
   */
  async erstelleAusNotiz(request: AngebotAusNotizRequest): Promise<Angebot> {
    this.store.setGenerating(true);
    try {
      const angebot = await firstValueFrom(
        this.api.post<Angebot>('/angebote/erstellen-aus-notiz/', request)
      );
      await this.db.angebote.put(angebot);
      this.store.addAngebot(angebot);
      return angebot;
    } finally {
      this.store.setGenerating(false);
    }
  }

  async speichereAngebot(angebot: Angebot): Promise<void> {
    this.berechneSummen(angebot);
    await this.db.angebote.put(angebot);
    this.store.updateAngebot(angebot);

    await this.sync.enqueue({
      entity_type: 'angebot',
      entity_id: angebot.id,
      operation: 'update',
      payload: angebot as unknown as Record<string, unknown>,
      priority: 3,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }

  async loeschen(id: string): Promise<void> {
    await this.db.angebote.delete(id);
    this.store.removeAngebot(id);

    await this.sync.enqueue({
      entity_type: 'angebot',
      entity_id: id,
      operation: 'delete',
      payload: { id },
      priority: 3,
    });

    if (navigator.onLine) await this.sync.processQueue();
  }

  async exportiereAlsPdf(id: string): Promise<Blob> {
    const response = await firstValueFrom(
      this.api.get<Blob>(`/angebote/${id}/pdf/`)
    );
    return response;
  }

  addPosition(angebot: Angebot): Angebot {
    const neuePos: Angebotsposition = {
      id: uuidv4(),
      pos_nr: angebot.positionen.length + 1,
      bezeichnung: '',
      menge: 1,
      einheit: 'Stk',
      einzelpreis: 0,
      rabatt_prozent: 0,
      gesamtpreis: 0,
      ist_manuell: true,
    };
    const updated = {
      ...angebot,
      positionen: [...angebot.positionen, neuePos],
    };
    this.berechneSummen(updated);
    return updated;
  }

  updatePosition(angebot: Angebot, posId: string, changes: Partial<Angebotsposition>): Angebot {
    const updated = {
      ...angebot,
      positionen: angebot.positionen.map(p => {
        if (p.id !== posId) return p;
        const merged = { ...p, ...changes };
        merged.gesamtpreis = merged.menge * merged.einzelpreis * (1 - merged.rabatt_prozent / 100);
        return merged;
      }),
    };
    this.berechneSummen(updated);
    return updated;
  }

  removePosition(angebot: Angebot, posId: string): Angebot {
    const updated = {
      ...angebot,
      positionen: angebot.positionen
        .filter(p => p.id !== posId)
        .map((p, i) => ({ ...p, pos_nr: i + 1 })),
    };
    this.berechneSummen(updated);
    return updated;
  }

  private berechneSummen(angebot: Angebot): void {
    angebot.nettobetrag = angebot.positionen.reduce((sum, p) => sum + p.gesamtpreis, 0);
    angebot.mwst_betrag = angebot.nettobetrag * (angebot.mwst_prozent / 100);
    angebot.bruttobetrag = angebot.nettobetrag + angebot.mwst_betrag;
  }
}
