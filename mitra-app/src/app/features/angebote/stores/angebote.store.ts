import { Injectable, signal, computed } from '@angular/core';
import { Angebot, AngebotStatus } from '../../../core/models/angebot.model';

@Injectable({ providedIn: 'root' })
export class AngeboteStore {
  private readonly _angebote = signal<Angebot[]>([]);
  private readonly _aktivesAngebot = signal<Angebot | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isGenerating = signal(false);

  readonly angebote = this._angebote.asReadonly();
  readonly aktivesAngebot = this._aktivesAngebot.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isGenerating = this._isGenerating.asReadonly();

  readonly entwuerfe = computed(() =>
    this._angebote().filter(a => a.status === 'entwurf')
  );
  readonly gesendete = computed(() =>
    this._angebote().filter(a => a.status === 'gesendet')
  );
  readonly abgeschlossene = computed(() =>
    this._angebote().filter(a =>
      a.status === 'angenommen' || a.status === 'abgelehnt' || a.status === 'abgelaufen'
    )
  );

  setAngebote(angebote: Angebot[]): void {
    this._angebote.set(angebote);
  }

  addAngebot(angebot: Angebot): void {
    this._angebote.update(list => [angebot, ...list]);
  }

  updateAngebot(updated: Angebot): void {
    this._angebote.update(list =>
      list.map(a => a.id === updated.id ? updated : a)
    );
    if (this._aktivesAngebot()?.id === updated.id) {
      this._aktivesAngebot.set(updated);
    }
  }

  removeAngebot(id: string): void {
    this._angebote.update(list => list.filter(a => a.id !== id));
    if (this._aktivesAngebot()?.id === id) {
      this._aktivesAngebot.set(null);
    }
  }

  setAktivesAngebot(angebot: Angebot | null): void {
    this._aktivesAngebot.set(angebot);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  setGenerating(value: boolean): void {
    this._isGenerating.set(value);
  }
}
