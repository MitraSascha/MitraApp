import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { Angebot, Angebotsposition, AngebotAusNotizRequest, Positionsgruppe } from '../../../core/models/angebot.model';
import { ApiService } from '../../../core/services/api.service';
import { SyncService } from '../../../core/services/sync.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { AngeboteStore } from '../stores/angebote.store';
import { UIStore } from '../../../shared/ui/ui.store';

@Injectable({ providedIn: 'root' })
export class AngeboteService {
  private readonly api = inject(ApiService);
  private readonly sync = inject(SyncService);
  private readonly db = inject(MitraDbService);
  private readonly store = inject(AngeboteStore);
  private readonly ui = inject(UIStore);

  async ladeAlle(): Promise<void> {
    this.store.setLoading(true);
    try {
      const lokal = await this.db.angebote.orderBy('erstellt_am').reverse().toArray();
      this.store.setAngebote(lokal);

      if (!navigator.onLine) return;

      const server = await firstValueFrom(this.api.get<Angebot[]>('/angebote/'));
      if (server) {
        // Lokale pending-Einträge nicht überschreiben
        const pendingIds = new Set(
          lokal.filter(a => a.sync_status === 'pending').map(a => a.id)
        );
        const pendingItems = lokal.filter(a => pendingIds.has(a.id));
        const merged = [
          ...server.filter(a => !pendingIds.has(a.id)),
          ...pendingItems,
        ];
        await this.db.angebote.bulkPut(server.filter(a => !pendingIds.has(a.id)));
        this.store.setAngebote(merged);
      }
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      if (status && status >= 400) {
        this.ui.showToast('Angebote konnten nicht geladen werden');
      }
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

    // Prüfen ob das Angebot schon auf dem Server existiert (sync_status !== 'pending' oder bereits in DB mit 'synced')
    const existing = await this.db.angebote.get(angebot.id);
    const isNeu = !existing || existing.sync_status === 'pending';

    angebot.sync_status = 'pending';
    await this.db.angebote.put(angebot);
    this.store.updateAngebot(angebot);

    await this.sync.enqueue({
      entity_type: 'angebot',
      entity_id: angebot.id,
      operation: isNeu ? 'create' : 'update',
      payload: angebot as unknown as Record<string, unknown>,
      priority: 3,
    });

    if (navigator.onLine) this.sync.processQueue();
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
    return firstValueFrom(this.api.getBlob(`/angebote/${id}/pdf/`));
  }

  addPosition(angebot: Angebot): Angebot {
    const neuePos: Angebotsposition = {
      id: uuidv4(),
      pos_nr: angebot.positionen.length + 1,
      bezeichnung: '',
      menge: 1,
      einheit: 'Stk',
      ek_einheit: 0,
      lp_einheit: 0,
      aufschlag_prozent: 0,
      vk_einheit: 0,
      einzelpreis: 0,
      rabatt_prozent: 0,
      rabatt_betrag: 0,
      vk_netto: 0,
      mwst_prozent: angebot.mwst_prozent,
      gesamtpreis: 0,
      brutto_gesamt: 0,
      ist_manuell: true,
    };
    const updated = {
      ...angebot,
      positionen: [...angebot.positionen, neuePos],
    };
    this.berechneGruppen(updated);
    this.berechneSummen(updated);
    return updated;
  }

  updatePosition(angebot: Angebot, posId: string, changes: Partial<Angebotsposition>): Angebot {
    const updated = {
      ...angebot,
      positionen: angebot.positionen.map(p => {
        if (p.id !== posId) return p;
        const merged = { ...p, ...changes };
        this.berechnePosition(merged);
        return merged;
      }),
    };
    this.berechneGruppen(updated);
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
    this.berechneGruppen(updated);
    this.berechneSummen(updated);
    return updated;
  }

  /** Berechnet alle abgeleiteten Felder einer Position */
  private berechnePosition(pos: Angebotsposition): void {
    // VK/Einheit = LP * (1 + Aufschlag/100), mindestens direkt gesetzter VK
    if (pos.lp_einheit > 0 && pos.aufschlag_prozent >= 0) {
      pos.vk_einheit = pos.lp_einheit * (1 + pos.aufschlag_prozent / 100);
    }
    pos.einzelpreis = pos.vk_einheit;

    // VK Netto = Menge * VK/Einheit
    const brutto_vor_rabatt = pos.menge * pos.vk_einheit;
    pos.rabatt_betrag = brutto_vor_rabatt * (pos.rabatt_prozent / 100);
    pos.vk_netto = brutto_vor_rabatt - pos.rabatt_betrag;
    pos.gesamtpreis = pos.vk_netto;
    pos.brutto_gesamt = pos.vk_netto * (1 + (pos.mwst_prozent || 19) / 100);
  }

  // ── Gruppen-Verwaltung ──────────────────────────────────

  addGruppe(angebot: Angebot, titel: string): Angebot {
    const gruppe: Positionsgruppe = {
      id: uuidv4(),
      nummer: (angebot.gruppen?.length ?? 0) + 1,
      titel,
      positionen: [],
      rabatt_prozent: 0,
      ek_gesamt: 0,
      aufschlag_betrag: 0,
      aufschlag_prozent: 0,
      netto_gesamt: 0,
    };
    return {
      ...angebot,
      gruppen: [...(angebot.gruppen || []), gruppe],
    };
  }

  removeGruppe(angebot: Angebot, gruppeId: string): Angebot {
    // Positionen der Gruppe werden aus der flachen Liste entfernt
    const updated = {
      ...angebot,
      positionen: angebot.positionen.filter(p => p.gruppe_id !== gruppeId),
      gruppen: (angebot.gruppen || [])
        .filter(g => g.id !== gruppeId)
        .map((g, i) => ({ ...g, nummer: i + 1 })),
    };
    this.berechneSummen(updated);
    return updated;
  }

  updateGruppe(angebot: Angebot, gruppeId: string, changes: Partial<Positionsgruppe>): Angebot {
    const updated = {
      ...angebot,
      gruppen: (angebot.gruppen || []).map(g =>
        g.id === gruppeId ? { ...g, ...changes } : g
      ),
    };
    this.berechneGruppen(updated);
    this.berechneSummen(updated);
    return updated;
  }

  addPositionToGruppe(angebot: Angebot, gruppeId: string): Angebot {
    const gruppe = (angebot.gruppen || []).find(g => g.id === gruppeId);
    if (!gruppe) return angebot;

    const gruppenPositionen = angebot.positionen.filter(p => p.gruppe_id === gruppeId);
    const neuePos: Angebotsposition = {
      id: uuidv4(),
      pos_nr: gruppenPositionen.length + 1,
      bezeichnung: '',
      menge: 1,
      einheit: 'Stk',
      ek_einheit: 0,
      lp_einheit: 0,
      aufschlag_prozent: 0,
      vk_einheit: 0,
      einzelpreis: 0,
      rabatt_prozent: 0,
      rabatt_betrag: 0,
      vk_netto: 0,
      mwst_prozent: angebot.mwst_prozent,
      gesamtpreis: 0,
      brutto_gesamt: 0,
      ist_manuell: true,
      gruppe_id: gruppeId,
    };
    const updated = {
      ...angebot,
      positionen: [...angebot.positionen, neuePos],
    };
    this.berechneGruppen(updated);
    this.berechneSummen(updated);
    return updated;
  }

  /** Ordnet eine bestehende Position einer Gruppe zu */
  movePositionToGruppe(angebot: Angebot, posId: string, gruppeId: string | undefined): Angebot {
    const updated = {
      ...angebot,
      positionen: angebot.positionen.map(p =>
        p.id === posId ? { ...p, gruppe_id: gruppeId } : p
      ),
    };
    this.berechneGruppen(updated);
    this.berechneSummen(updated);
    return updated;
  }

  /** Verschiebt eine Position innerhalb einer Gruppe (oder ungruppierten Bereich) */
  movePositionInList(angebot: Angebot, gruppeId: string | undefined, fromIndex: number, toIndex: number): Angebot {
    const isGruppe = (p: Angebotsposition) => gruppeId ? p.gruppe_id === gruppeId : !p.gruppe_id;
    const gruppenPos = angebot.positionen.filter(isGruppe);
    const anderePos = angebot.positionen.filter(p => !isGruppe(p));

    // Reorder within the group
    const [moved] = gruppenPos.splice(fromIndex, 1);
    gruppenPos.splice(toIndex, 0, moved);

    // Renumber within the group
    gruppenPos.forEach((p, i) => p.pos_nr = i + 1);

    const updated = { ...angebot, positionen: [...anderePos, ...gruppenPos] };
    this.berechneGruppen(updated);
    return updated;
  }

  /** Verschiebt eine Gruppe in der Reihenfolge */
  moveGruppe(angebot: Angebot, fromIndex: number, toIndex: number): Angebot {
    const gruppen = [...(angebot.gruppen || [])];
    const [moved] = gruppen.splice(fromIndex, 1);
    gruppen.splice(toIndex, 0, moved);
    gruppen.forEach((g, i) => g.nummer = i + 1);
    return { ...angebot, gruppen };
  }

  /** Berechnet die Gruppenstatistiken aus den Positionen */
  private berechneGruppen(angebot: Angebot): void {
    if (!angebot.gruppen) return;
    for (const gruppe of angebot.gruppen) {
      const positionen = angebot.positionen.filter(p => p.gruppe_id === gruppe.id);
      gruppe.positionen = positionen;

      const ek = positionen.reduce((s, p) => s + (p.ek_einheit * p.menge), 0);
      const netto = positionen.reduce((s, p) => s + p.gesamtpreis, 0);
      gruppe.ek_gesamt = ek;
      gruppe.netto_gesamt = netto;
      gruppe.aufschlag_betrag = netto - ek;
      gruppe.aufschlag_prozent = ek > 0 ? ((netto / ek) - 1) * 100 : 0;
    }
  }

  private berechneSummen(angebot: Angebot): void {
    angebot.nettobetrag = angebot.positionen.reduce((sum, p) => sum + p.gesamtpreis, 0);
    angebot.mwst_betrag = angebot.nettobetrag * (angebot.mwst_prozent / 100);
    angebot.bruttobetrag = angebot.nettobetrag + angebot.mwst_betrag;
  }
}
