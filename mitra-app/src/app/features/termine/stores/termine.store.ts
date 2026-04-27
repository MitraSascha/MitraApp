import { Injectable, signal, computed } from '@angular/core';
import { Termin } from '../../../core/models/termin.model';
import { SyncStatus } from '../../../core/models/notiz.model';

@Injectable({ providedIn: 'root' })
export class TerminStore {
  private readonly _termine = signal<Termin[]>([]);
  private readonly _aktiverTermin = signal<Termin | null>(null);
  private readonly _isLoading = signal<boolean>(false);
  private readonly _syncStatus = signal<SyncStatus>('synced');

  readonly termine = this._termine.asReadonly();
  readonly aktiverTermin = this._aktiverTermin.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly syncStatus = this._syncStatus.asReadonly();

  readonly heutigeTermine = computed(() => {
    const heute = new Date().toISOString().slice(0, 10);
    return this._termine()
      .filter(t => t.beginn.startsWith(heute))
      .sort((a, b) => a.beginn.localeCompare(b.beginn));
  });

  readonly morgigTermine = computed(() => {
    const morgen = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    return this._termine()
      .filter(t => t.beginn.startsWith(morgen))
      .sort((a, b) => a.beginn.localeCompare(b.beginn));
  });

  readonly naechsteTermine = computed(() => [
    ...this.heutigeTermine(),
    ...this.morgigTermine(),
  ]);

  setTermine(termine: Termin[]): void {
    this._termine.set(termine);
  }

  addTermin(termin: Termin): void {
    this._termine.update(list =>
      [...list, termin].sort((a, b) => a.beginn.localeCompare(b.beginn))
    );
  }

  updateTermin(updated: Termin): void {
    this._termine.update(list =>
      list.map(t => t.id === updated.id ? updated : t)
    );
    if (this._aktiverTermin()?.id === updated.id) {
      this._aktiverTermin.set(updated);
    }
  }

  removeTermin(id: string): void {
    this._termine.update(list => list.filter(t => t.id !== id));
    if (this._aktiverTermin()?.id === id) {
      this._aktiverTermin.set(null);
    }
  }

  setAktiverTermin(termin: Termin | null): void {
    this._aktiverTermin.set(termin);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  setSyncStatus(status: SyncStatus): void {
    this._syncStatus.set(status);
  }

  getTermineImBereich(start: string, end: string): Termin[] {
    return this._termine().filter(t => t.beginn >= start && t.beginn <= end);
  }
}
