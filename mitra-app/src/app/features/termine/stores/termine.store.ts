import { Injectable, signal, computed } from '@angular/core';
import { Termin } from '../../../core/models/termin.model';
import { SyncStatus } from '../../../core/models/notiz.model';

export type KalenderView = 'tag' | 'woche' | 'monat';

export interface WochenTag {
  datum: string;
  label: string;
  termine: Termin[];
}

export interface MonatsZelle {
  datum: string;
  tag: number;
  istAktuellerMonat: boolean;
  istHeute: boolean;
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
  private readonly _viewMode = signal<KalenderView>('woche');
  private readonly _selectedDate = signal<string>(toLocalDateKey(new Date()));

  readonly termine = this._termine.asReadonly();
  readonly aktiverTermin = this._aktiverTermin.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly syncStatus = this._syncStatus.asReadonly();
  readonly viewMode = this._viewMode.asReadonly();
  readonly selectedDate = this._selectedDate.asReadonly();

  /** Termine am ausgewählten Tag */
  readonly tagesTermine = computed(() => {
    const key = this._selectedDate();
    return this._termine()
      .filter(t => toLocalDateKey(new Date(t.beginn)) === key)
      .sort((a, b) => a.beginn.localeCompare(b.beginn));
  });

  /** Monatsgrid: 6 Wochen x 7 Tage */
  readonly monatsGrid = computed((): MonatsZelle[][] => {
    const sel = new Date(this._selectedDate() + 'T00:00:00');
    const monat = sel.getMonth();
    const jahr = sel.getFullYear();
    const heute = toLocalDateKey(new Date());

    // Erster Tag des Monats
    const erster = new Date(jahr, monat, 1);
    // Montag der Woche des 1. → Start des Grids
    const startWochentag = erster.getDay() === 0 ? 6 : erster.getDay() - 1; // Mo=0
    const gridStart = new Date(erster);
    gridStart.setDate(erster.getDate() - startWochentag);

    const grid: MonatsZelle[][] = [];
    const cursor = new Date(gridStart);
    for (let w = 0; w < 6; w++) {
      const woche: MonatsZelle[] = [];
      for (let d = 0; d < 7; d++) {
        const key = toLocalDateKey(cursor);
        woche.push({
          datum: key,
          tag: cursor.getDate(),
          istAktuellerMonat: cursor.getMonth() === monat,
          istHeute: key === heute,
          termine: this._termine()
            .filter(t => toLocalDateKey(new Date(t.beginn)) === key),
        });
        cursor.setDate(cursor.getDate() + 1);
      }
      grid.push(woche);
    }
    return grid;
  });

  readonly selectedDateLabel = computed(() => {
    const d = new Date(this._selectedDate() + 'T00:00:00');
    const mode = this._viewMode();
    if (mode === 'tag') {
      return d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
    }
    if (mode === 'monat') {
      return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
    }
    return `KW ${this.getKW(d)}, ${d.getFullYear()}`;
  });

  private getKW(d: Date): number {
    const onejan = new Date(d.getFullYear(), 0, 1);
    const today = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayOfYear = ((today.getTime() - onejan.getTime() + 86400000) / 86400000);
    return Math.ceil(dayOfYear / 7);
  }

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

  setViewMode(mode: KalenderView): void { this._viewMode.set(mode); }
  setSelectedDate(date: string): void { this._selectedDate.set(date); }

  navigiere(richtung: -1 | 1): void {
    const d = new Date(this._selectedDate() + 'T00:00:00');
    const mode = this._viewMode();
    if (mode === 'tag') d.setDate(d.getDate() + richtung);
    else if (mode === 'woche') d.setDate(d.getDate() + richtung * 7);
    else d.setMonth(d.getMonth() + richtung);
    this._selectedDate.set(toLocalDateKey(d));
  }

  heute(): void {
    this._selectedDate.set(toLocalDateKey(new Date()));
  }

  getTermineImBereich(start: string, end: string): Termin[] {
    return this._termine().filter(t => t.beginn >= start && t.beginn <= end);
  }
}
