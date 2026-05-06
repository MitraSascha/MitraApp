import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TerminStore, WochenTag, KalenderView, MonatsZelle } from '../stores/termine.store';
import { TermineService } from '../services/termine.service';
import { Termin } from '../../../core/models/termin.model';

@Component({
  selector: 'app-termine-liste',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './termine-liste.component.html',
  styleUrl: './termine-liste.component.scss',
})
export class TermineListeComponent implements OnInit {
  readonly store = inject(TerminStore);
  private readonly service = inject(TermineService);

  readonly syncMenuOffen = signal(false);
  readonly isSyncing = signal(false);
  readonly syncErgebnis = signal<string | null>(null);

  readonly heutigesDatum = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  async ngOnInit(): Promise<void> {
    await this.service.ladeAlle();
    this.service.checkReminders();
  }

  toggleSyncMenu(): void {
    this.syncMenuOffen.update(v => !v);
  }

  async syncManuell(tage: 7 | 14 | 30): Promise<void> {
    this.syncMenuOffen.set(false);
    this.isSyncing.set(true);
    this.syncErgebnis.set(null);
    try {
      const result = await this.service.heroSync(tage);
      this.syncErgebnis.set(`${result.neu} neu · ${result.aktualisiert} aktualisiert`);
      setTimeout(() => this.syncErgebnis.set(null), 4000);
    } finally {
      this.isSyncing.set(false);
    }
  }

  async loesche(termin: Termin, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(`"${termin.titel}" wirklich löschen?`)) {
      await this.service.loesche(termin.id);
    }
  }

  formatZeit(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }

  istHeute(datum: string): boolean {
    return datum === this.heutigesDatum;
  }

  // ── Kalender-Navigation ──
  setView(mode: KalenderView): void {
    this.store.setViewMode(mode);
  }

  navigiere(richtung: -1 | 1): void {
    this.store.navigiere(richtung);
  }

  gotoHeute(): void {
    this.store.heute();
  }

  selectTag(datum: string): void {
    this.store.setSelectedDate(datum);
    this.store.setViewMode('tag');
  }

  /** Stunde aus ISO-String extrahieren für Tagesansicht-Positionierung */
  getStundenPosition(iso: string): number {
    const d = new Date(iso);
    return d.getHours() + d.getMinutes() / 60;
  }

  /** Dauer in Stunden berechnen */
  getDauer(beginn: string, ende: string): number {
    return Math.max(0.5, (new Date(ende).getTime() - new Date(beginn).getTime()) / 3600000);
  }

  readonly stundenRaster = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22 Uhr

  trackById(_: number, t: Termin): string { return t.id; }
  trackByDatum(_: number, g: WochenTag): string { return g.datum; }
}
