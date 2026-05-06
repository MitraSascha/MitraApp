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
  preis_lp?: number;
  kategorie?: string;
  typ?: 'artikel' | 'leistung';
  quelle: 'artikelstamm' | 'hero' | 'grosshaendler';
  verfuegbar?: boolean;
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

  /**
   * IDS Connect: Öffnet Großhändler-Shop im neuen Tab.
   * User sucht & wählt dort Artikel. Shop sendet Warenkorb an unsere Hook-URL.
   */
  async openGrosshaendlerShop(suchbegriff?: string): Promise<void> {
    const res = await firstValueFrom(
      this.api.get<{ shop_url: string; params: Record<string, string> }>(
        `/artikel/ids-shop-url/?q=${encodeURIComponent(suchbegriff || '')}`,
      )
    );
    if (!res?.shop_url) throw new Error('IDS Connect nicht konfiguriert');

    // Unsichtbares Formular erstellen und im neuen Tab absenden (POST mit Credentials)
    const form = document.createElement('form');
    form.method = 'POST';
    form.enctype = 'multipart/form-data';
    form.acceptCharset = 'UTF-8';
    form.action = res.shop_url;
    form.target = '_blank';
    for (const [key, value] of Object.entries(res.params)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = key;
      input.value = value;
      form.appendChild(input);
    }
    document.body.appendChild(form);
    form.submit();
    document.body.removeChild(form);
  }

  /**
   * Pollt den IDS-Warenkorb — liefert Artikel die vom Großhändler-Shop zurückkamen.
   */
  async polleGrosshaendlerWarenkorb(): Promise<ArtikelErgebnis[]> {
    const res = await firstValueFrom(
      this.api.get<SucheAntwort>('/artikel/ids-warenkorb/')
    );
    return res?.artikel ?? [];
  }
}
