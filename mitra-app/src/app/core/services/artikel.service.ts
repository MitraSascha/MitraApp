import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Artikel, ArtikelSucheRequest, ArtikelSucheResponse } from '../models/artikel.model';
import { ApiService } from './api.service';
import { MitraDbService } from '../db/mitra-db.service';

@Injectable({ providedIn: 'root' })
export class ArtikelService {
  private readonly api = inject(ApiService);
  private readonly db = inject(MitraDbService);

  async suche(request: ArtikelSucheRequest): Promise<ArtikelSucheResponse> {
    // Erst lokalen Cache durchsuchen (Offline-Fallback)
    const params: Record<string, string> = { q: request.q };
    if (request.kategorie) params['kategorie'] = request.kategorie;
    if (request.hersteller) params['hersteller'] = request.hersteller;
    if (request.limit) params['limit'] = String(request.limit);

    if (!navigator.onLine) {
      return this.sucheLokal(request);
    }

    try {
      const result = await firstValueFrom(
        this.api.get<ArtikelSucheResponse>('/artikel/suche/', params)
      );
      // Ergebnisse im lokalen Cache speichern
      if (result.artikel.length > 0) {
        await this.db.artikel_cache.bulkPut(result.artikel);
      }
      return result;
    } catch {
      return this.sucheLokal(request);
    }
  }

  async ladeArtikel(artnr: string): Promise<Artikel | null> {
    // Erst aus Cache
    const cached = await this.db.artikel_cache
      .where('artnr').equals(artnr)
      .first();
    if (cached) return cached;

    if (!navigator.onLine) return null;

    try {
      return await firstValueFrom(
        this.api.get<Artikel>(`/artikel/${encodeURIComponent(artnr)}/`)
      );
    } catch {
      return null;
    }
  }

  private async sucheLokal(request: ArtikelSucheRequest): Promise<ArtikelSucheResponse> {
    const q = request.q.toLowerCase();
    const alle = await this.db.artikel_cache.toArray();

    const gefiltert = alle.filter(a => {
      const treffer =
        a.bezeichnung.toLowerCase().includes(q) ||
        a.artnr.toLowerCase().includes(q) ||
        a.hersteller.toLowerCase().includes(q);
      const kategorieOk = !request.kategorie || a.kategorie === request.kategorie;
      const herstellerOk = !request.hersteller || a.hersteller === request.hersteller;
      return treffer && kategorieOk && herstellerOk;
    });

    const limit = request.limit ?? 20;
    return {
      artikel: gefiltert.slice(0, limit),
      total: gefiltert.length,
      query: request.q,
    };
  }
}
