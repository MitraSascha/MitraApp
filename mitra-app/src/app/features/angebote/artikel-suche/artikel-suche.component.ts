import { Component, EventEmitter, Output, signal, inject, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { ArtikelSucheService, ArtikelErgebnis } from '../services/artikel-suche.service';
import { Angebotsposition } from '../../../core/models/angebot.model';

type Quelle = 'artikelstamm' | 'hero' | 'grosshaendler';

@Component({
  selector: 'app-artikel-suche',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './artikel-suche.component.html',
  styleUrl: './artikel-suche.component.scss',
})
export class ArtikelSucheComponent implements OnDestroy {
  @Output() artikelGewaehlt = new EventEmitter<Angebotsposition>();

  private readonly service = inject(ArtikelSucheService);

  readonly isLoading = signal(false);
  readonly quelle = signal<Quelle>('artikelstamm');
  readonly ghWartet = signal(false);

  suchbegriff = '';
  ergebnisse: ArtikelErgebnis[] = [];
  fehler = '';

  private pollTimer: ReturnType<typeof setInterval> | null = null;

  setQuelle(q: Quelle): void {
    this.quelle.set(q);
    this.ergebnisse = [];
    this.fehler = '';
    this.stopPolling();
  }

  ngOnDestroy(): void {
    this.stopPolling();
  }

  async suchen(): Promise<void> {
    const q = this.suchbegriff.trim();
    if (!q) return;

    // Großhändler: Shop im Browser öffnen statt direkte Suche
    if (this.quelle() === 'grosshaendler') {
      await this.openGrosshaendlerShop(q);
      return;
    }

    this.isLoading.set(true);
    this.fehler = '';
    this.ergebnisse = [];
    try {
      if (this.quelle() === 'artikelstamm') {
        this.ergebnisse = await this.service.sucheArtikelstamm(q);
      } else {
        this.ergebnisse = await this.service.sucheHero(q);
      }
      if (this.ergebnisse.length === 0) {
        this.fehler = 'Keine Treffer gefunden.';
      }
    } catch {
      this.fehler = 'Suche fehlgeschlagen – Verbindung prüfen.';
    } finally {
      this.isLoading.set(false);
    }
  }

  /** Öffnet den Großhändler-Shop und startet Polling für zurückkommende Artikel */
  async openGrosshaendlerShop(suchbegriff?: string): Promise<void> {
    this.fehler = '';
    try {
      await this.service.openGrosshaendlerShop(suchbegriff);
      this.ghWartet.set(true);
      this.startPolling();
    } catch (e) {
      this.fehler = (e as Error).message || 'Großhändler-Shop konnte nicht geöffnet werden.';
    }
  }

  private startPolling(): void {
    this.stopPolling();
    // Alle 2 Sekunden prüfen ob Artikel zurückgekommen sind
    this.pollTimer = setInterval(async () => {
      try {
        const artikel = await this.service.polleGrosshaendlerWarenkorb();
        if (artikel.length > 0) {
          this.ergebnisse = artikel;
          this.ghWartet.set(false);
          this.stopPolling();
        }
      } catch { /* stille Fehler beim Polling */ }
    }, 2000);
  }

  private stopPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.ghWartet.set(false);
  }

  uebernehmen(artikel: ArtikelErgebnis): void {
    const preis = typeof artikel.preis_vk === 'number' ? artikel.preis_vk : 0;
    const lp = artikel.preis_lp ?? preis;
    const pos: Angebotsposition = {
      id: uuidv4(),
      pos_nr: 0,
      artnr: artikel.artnr || undefined,
      bezeichnung: artikel.bezeichnung,
      beschreibung: artikel.beschreibung,
      menge: 1,
      einheit: artikel.einheit || 'Stk',
      ek_einheit: preis,
      lp_einheit: lp,
      aufschlag_prozent: lp > 0 ? ((preis / lp) - 1) * 100 : 0,
      vk_einheit: preis,
      einzelpreis: preis,
      rabatt_prozent: 0,
      rabatt_betrag: 0,
      vk_netto: preis,
      mwst_prozent: 19,
      gesamtpreis: preis,
      brutto_gesamt: preis * 1.19,
      ist_manuell: false,
      artikel_id: artikel.id || undefined,
      artikel_details: {
        artikelname: artikel.bezeichnung,
        artikelnummer: artikel.artnr,
        kategorie: artikel.kategorie,
        hersteller: artikel.hersteller,
        beschreibung: artikel.beschreibung,
        lieferant: artikel.quelle === 'grosshaendler' ? 'Gut Mollenhauer' : undefined,
      },
    };
    this.artikelGewaehlt.emit(pos);
    this.ergebnisse = [];
    this.suchbegriff = '';
    this.fehler = '';
  }

  formatPreis(preis: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(preis);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') this.suchen();
  }
}
