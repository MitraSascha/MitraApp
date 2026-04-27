import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { v4 as uuidv4 } from 'uuid';
import { Angebot, Angebotsposition } from '../../../core/models/angebot.model';
import { AngeboteStore } from '../stores/angebote.store';
import { AngeboteService } from '../services/angebote.service';
import { NotizStore } from '../../notizen/stores/notizen.store';
import { NotizenService } from '../../notizen/services/notizen.service';

@Component({
  selector: 'app-angebot-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './angebot-editor.component.html',
  styleUrl: './angebot-editor.component.scss',
})
export class AngebotEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly store = inject(AngeboteStore);
  private readonly service = inject(AngeboteService);
  readonly notizStore = inject(NotizStore);
  private readonly notizService = inject(NotizenService);

  readonly isNeu = signal(false);
  readonly isSaving = signal(false);
  readonly showKiPanel = signal(false);

  angebot: Angebot | null = null;

  // KI-Generierung Felder
  ausgewaehlteNotizId = '';
  kundeFirma = '';
  kundeAnsprechpartner = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'neu') {
      this.isNeu.set(true);
      this.angebot = this.erstelleLeeresAngebot();
      await this.notizService.ladeAlle();
      return;
    }

    const gefunden = this.store.angebote().find(a => a.id === id);
    if (gefunden) {
      this.angebot = { ...gefunden, positionen: [...gefunden.positionen] };
    }
  }

  private erstelleLeeresAngebot(): Angebot {
    const now = new Date().toISOString();
    return {
      id: uuidv4(),
      angebotsnummer: `ANG-${Date.now()}`,
      titel: '',
      status: 'entwurf',
      kunde: { firma: '', adresse: {} },
      positionen: [],
      nettobetrag: 0,
      mwst_prozent: 19,
      mwst_betrag: 0,
      bruttobetrag: 0,
      zahlungsziel_tage: 30,
      gueltigkeit_tage: 30,
      ragflow_referenz_ids: [],
      erstellt_am: now,
      geaendert_am: now,
      erstellt_von: 0,
      version: 1,
    };
  }

  async generiereAusNotiz(): Promise<void> {
    if (!this.ausgewaehlteNotizId || !this.kundeFirma.trim()) return;
    this.store.setGenerating(true);
    try {
      const generiert = await this.service.erstelleAusNotiz({
        notiz_id: this.ausgewaehlteNotizId,
        kunde: {
          firma: this.kundeFirma.trim(),
          ansprechpartner: this.kundeAnsprechpartner.trim() || undefined,
        },
      });
      this.angebot = generiert;
      this.showKiPanel.set(false);
      this.isNeu.set(false);
    } catch {
      // Fehlerbehandlung: Angebot bleibt leer → manuell befüllen
    } finally {
      this.store.setGenerating(false);
    }
  }

  addPosition(): void {
    if (!this.angebot) return;
    this.angebot = this.service.addPosition(this.angebot);
  }

  updatePosition(posId: string, field: keyof Angebotsposition, value: string | number): void {
    if (!this.angebot) return;
    this.angebot = this.service.updatePosition(this.angebot, posId, { [field]: value } as Partial<Angebotsposition>);
  }

  removePosition(posId: string): void {
    if (!this.angebot) return;
    this.angebot = this.service.removePosition(this.angebot, posId);
  }

  async speichern(): Promise<void> {
    if (!this.angebot) return;
    this.isSaving.set(true);
    try {
      this.angebot.geaendert_am = new Date().toISOString();
      await this.service.speichereAngebot(this.angebot);
      this.router.navigate(['/angebote']);
    } finally {
      this.isSaving.set(false);
    }
  }

  async exportPdf(): Promise<void> {
    if (!this.angebot) return;
    try {
      const blob = await this.service.exportiereAlsPdf(this.angebot.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${this.angebot.angebotsnummer}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF-Export nicht verfügbar (Offline)
    }
  }

  formatEuro(value: number): string {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  }

  zurueck(): void {
    this.router.navigate(['/angebote']);
  }
}
