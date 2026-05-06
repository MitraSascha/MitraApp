import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BautagebuchStore } from '../stores/bautagebuch.store';
import { BautagebuchService } from '../services/bautagebuch.service';
import { Tagesbericht } from '../../../core/models/bautagebuch.model';

@Component({
  selector: 'app-bautagebuch-liste',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bautagebuch-liste.component.html',
  styleUrl: './bautagebuch-liste.component.scss',
})
export class BautagebuchListeComponent implements OnInit {
  readonly store = inject(BautagebuchStore);
  private readonly service = inject(BautagebuchService);
  private readonly router = inject(Router);

  readonly zeigeNeuDialog = signal(false);
  projektName = '';

  async ngOnInit(): Promise<void> {
    await this.service.ladeAlle();
  }

  async neuerBericht(): Promise<void> {
    if (!this.projektName.trim()) return;
    const bericht = await this.service.erstelle({
      datum: new Date().toISOString().slice(0, 10),
      projekt_name: this.projektName.trim(),
    });
    this.projektName = '';
    this.zeigeNeuDialog.set(false);
    this.router.navigate(['/bautagebuch', bericht.id], { state: { bericht } });
  }

  oeffneBericht(bericht: Tagesbericht): void {
    this.router.navigate(['/bautagebuch', bericht.id], { state: { bericht } });
  }

  loeschenKandidatId: string | null = null;

  loeschenAnfragen(id: string, event: Event): void {
    event.stopPropagation();
    this.loeschenKandidatId = id;
  }

  loeschenAbbrechen(): void {
    this.loeschenKandidatId = null;
  }

  async loeschenBestaetigen(): Promise<void> {
    if (!this.loeschenKandidatId) return;
    await this.service.loesche(this.loeschenKandidatId);
    this.loeschenKandidatId = null;
  }

  wetterIcon(wetter: string): string {
    const map: Record<string, string> = {
      sonnig: '☀️', bewoelkt: '☁️', regen: '🌧️',
      schnee: '❄️', sturm: '⛈️', nebel: '🌫️',
    };
    return map[wetter] || '—';
  }

  formatDatum(datum: string): string {
    return new Date(datum).toLocaleDateString('de-DE', {
      weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
    });
  }
}
