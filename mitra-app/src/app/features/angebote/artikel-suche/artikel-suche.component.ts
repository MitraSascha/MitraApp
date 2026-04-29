import { Component, EventEmitter, Output, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { ArtikelSucheService, ArtikelErgebnis } from '../services/artikel-suche.service';
import { Angebotsposition } from '../../../core/models/angebot.model';

type Quelle = 'artikelstamm' | 'hero';

@Component({
  selector: 'app-artikel-suche',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './artikel-suche.component.html',
  styleUrl: './artikel-suche.component.scss',
})
export class ArtikelSucheComponent {
  @Output() artikelGewaehlt = new EventEmitter<Angebotsposition>();

  private readonly service = inject(ArtikelSucheService);

  readonly isLoading = signal(false);
  readonly quelle = signal<Quelle>('artikelstamm');

  suchbegriff = '';
  ergebnisse: ArtikelErgebnis[] = [];
  fehler = '';

  setQuelle(q: Quelle): void {
    this.quelle.set(q);
    this.ergebnisse = [];
    this.fehler = '';
  }

  async suchen(): Promise<void> {
    const q = this.suchbegriff.trim();
    if (!q) return;
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

  uebernehmen(artikel: ArtikelErgebnis): void {
    const preis = typeof artikel.preis_vk === 'number' ? artikel.preis_vk : 0;
    const pos: Angebotsposition = {
      id: uuidv4(),
      pos_nr: 0,
      artnr: artikel.artnr || undefined,
      bezeichnung: artikel.bezeichnung,
      beschreibung: artikel.beschreibung,
      menge: 1,
      einheit: artikel.einheit || 'Stk',
      einzelpreis: preis,
      rabatt_prozent: 0,
      gesamtpreis: preis,
      ist_manuell: false,
      artikel_id: artikel.id || undefined,
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
