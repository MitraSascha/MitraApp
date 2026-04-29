import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

export interface ArtikelErgebnis {
  id: string;
  artnr: string;
  bezeichnung: string;
  beschreibung?: string;
  hersteller?: string;
  einheit: string;
  preis_vk: number;
  kategorie?: string;
  typ?: 'artikel' | 'leistung';
  quelle: 'artikelstamm' | 'hero';
}

interface SucheAntwort {
  artikel: ArtikelErgebnis[];
  total: number;
  query: string;
}

@Injectable({ providedIn: 'root' })
export class ArtikelSucheService {
  private readonly api = inject(ApiService);

  async sucheArtikelstamm(q: string, limit = 20): Promise<ArtikelErgebnis[]> {
    const res = await firstValueFrom(
      this.api.get<SucheAntwort>(`/artikel/suche/?q=${encodeURIComponent(q)}&limit=${limit}`)
    );
    return res?.artikel ?? [];
  }

  async sucheHero(q: string, typ: 'alle' | 'artikel' | 'leistungen' = 'alle', limit = 20): Promise<ArtikelErgebnis[]> {
    const res = await firstValueFrom(
      this.api.get<SucheAntwort>(`/artikel/hero-suche/?q=${encodeURIComponent(q)}&typ=${typ}&limit=${limit}`)
    );
    return res?.artikel ?? [];
  }
}
