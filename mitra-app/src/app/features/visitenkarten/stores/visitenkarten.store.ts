import { Injectable, signal, computed } from '@angular/core';
import { Kontakt } from '../../../core/models/kontakt.model';

@Injectable({ providedIn: 'root' })
export class VisitenkartenStore {
  private readonly _kontakte = signal<Kontakt[]>([]);
  private readonly _aktiverKontakt = signal<Kontakt | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _searchQuery = signal<string>('');

  readonly kontakte = this._kontakte.asReadonly();
  readonly aktiverKontakt = this._aktiverKontakt.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();

  readonly gefilterteKontakte = computed(() => {
    const q = this._searchQuery().toLowerCase();
    if (!q) return this._kontakte();
    return this._kontakte().filter(k =>
      k.firma.toLowerCase().includes(q) ||
      k.ansprechpartner?.toLowerCase().includes(q) ||
      k.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  readonly lieferanten = computed(() =>
    this._kontakte().filter(k => k.ist_lieferant)
  );

  setKontakte(kontakte: Kontakt[]): void {
    this._kontakte.set(kontakte);
  }

  addKontakt(kontakt: Kontakt): void {
    this._kontakte.update(list => [kontakt, ...list]);
  }

  updateKontakt(updated: Kontakt): void {
    this._kontakte.update(list =>
      list.map(k => k.id === updated.id ? updated : k)
    );
    if (this._aktiverKontakt()?.id === updated.id) {
      this._aktiverKontakt.set(updated);
    }
  }

  removeKontakt(id: string): void {
    this._kontakte.update(list => list.filter(k => k.id !== id));
    if (this._aktiverKontakt()?.id === id) {
      this._aktiverKontakt.set(null);
    }
  }

  setAktiverKontakt(kontakt: Kontakt | null): void {
    this._aktiverKontakt.set(kontakt);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  setSearchQuery(q: string): void {
    this._searchQuery.set(q);
  }
}
