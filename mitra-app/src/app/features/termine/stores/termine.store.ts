import { Injectable, signal, computed } from '@angular/core';
import { Termin } from '../../../core/models/termin.model';
import { SyncStatus } from '../../../core/models/notiz.model';

export interface WochenTag {
  datum: string;
  label: string;
  termine: Termin[];
}

function toLocalDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

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
    const heute = toLocalDateKey(new Date());
    return this._termine()
      .filter(t => toLocalDateKey(new Date(t.beginn)) === heute)
      .sort((a, b) => a.beginn.localeCompare(b.beginn));
  });

  readonly morgigTermine = computed(() => {
    const morgen = toLocalDateKey(new Date(Date.now() + 86_400_000));
    return this._termine()
      .filter(t => toLocalDateKey(new Date(t.beginn)) === morgen)
      .sort((a, b) => a.beginn.localeCompare(b.beginn));
  });

  readonly naechsteTermine = computed(() => [
    ...this.heutigeTermine(),
    ...this.morgigTermine(),
  ]);

  readonly wochenTermine = computed((): WochenTag[] => {
    const heute = new Date();
    const wochentag = heute.getDay(); // 0=So, 1=Mo, ...
    const diffZuMontag = wochentag === 0 ? -6 : 1 - wochentag;
    const montag = new Date(heute);
    montag.setDate(heute.getDate() + diffZuMontag);
    montag.setHours(0, 0, 0, 0);

    const woche: WochenTag[] = [];
    for (let i = 0; i < 7; i++) {
      const tag = new Date(montag);
      tag.setDate(montag.getDate() + i);
      const key = toLocalDateKey(tag);
      const tagTermine = this._termine()
        .filter(t => toLocalDateKey(new Date(t.beginn)) === key)
        .sort((a, b) => a.beginn.localeCompare(b.beginn));
      woche.push({
        datum: key,
        label: tag.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit' }),
        termine: tagTermine,
      });
    }
    return woche;
  });

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
