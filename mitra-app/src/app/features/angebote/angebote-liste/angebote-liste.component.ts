import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AngeboteStore } from '../stores/angebote.store';
import { AngeboteService } from '../services/angebote.service';
import { Angebot } from '../../../core/models/angebot.model';

@Component({
  selector: 'app-angebote-liste',
  standalone: true,
  imports: [],
  templateUrl: './angebote-liste.component.html',
  styleUrl: './angebote-liste.component.scss',
})
export class AngeboteListeComponent implements OnInit {
  private readonly router = inject(Router);
  readonly store = inject(AngeboteStore);
  private readonly service = inject(AngeboteService);

  readonly aktuellerTab = signal<'entwuerfe' | 'gesendet' | 'abgeschlossen'>('entwuerfe');

  async ngOnInit(): Promise<void> {
    await this.service.ladeAlle();
  }

  setTab(tab: 'entwuerfe' | 'gesendet' | 'abgeschlossen'): void {
    this.aktuellerTab.set(tab);
  }

  get aktuelleAngebote(): Angebot[] {
    const tab = this.aktuellerTab();
    if (tab === 'entwuerfe') return this.store.entwuerfe();
    if (tab === 'gesendet') return this.store.gesendete();
    return this.store.abgeschlossene();
  }

  openDetail(id: string): void {
    this.router.navigate(['/angebote', id]);
  }

  openNeu(): void {
    this.router.navigate(['/angebote', 'neu']);
  }

  formatEuro(value: number): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      entwurf: 'Entwurf',
      gesendet: 'Gesendet',
      angenommen: 'Angenommen',
      abgelehnt: 'Abgelehnt',
      abgelaufen: 'Abgelaufen',
    };
    return map[status] ?? status;
  }
}
