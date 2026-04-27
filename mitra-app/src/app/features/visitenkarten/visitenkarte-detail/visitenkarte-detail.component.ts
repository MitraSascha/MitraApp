import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Kontakt, KiVisitenkarteResponse } from '../../../core/models/kontakt.model';
import { VisitenkartenStore } from '../stores/visitenkarten.store';
import { VisitenkartenService } from '../services/visitenkarten.service';
import { FotoUploadComponent } from '../foto-upload/foto-upload.component';
import { VisitkarteViewerComponent } from '../visitenkarte-viewer/visitenkarte-viewer.component';

@Component({
  selector: 'app-visitenkarte-detail',
  standalone: true,
  imports: [FormsModule, FotoUploadComponent, VisitkarteViewerComponent],
  templateUrl: './visitenkarte-detail.component.html',
  styleUrl: './visitenkarte-detail.component.scss',
})
export class VisitenkartDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(VisitenkartenService);
  private readonly store = inject(VisitenkartenStore);

  readonly isNeu = signal(false);
  readonly isSaving = signal(false);
  readonly showViewer = signal(false);

  firma = '';
  ansprechpartner = '';
  position = '';
  mobil = '';
  telefon = '';
  email = '';
  website = '';
  branche = '';
  notiz = '';
  istLieferant = false;
  fotoUrl: string | null = null;
  tagsRaw = '';

  private kontaktId: string | null = null;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id === 'neu') {
      this.isNeu.set(true);
      return;
    }

    this.kontaktId = id;
    const kontakt = this.store.kontakte().find(k => k.id === id);
    if (kontakt) {
      this.fuelleFormular(kontakt);
    }
  }

  private fuelleFormular(k: Kontakt): void {
    this.firma = k.firma;
    this.ansprechpartner = k.ansprechpartner ?? '';
    this.position = k.position ?? '';
    this.mobil = k.mobil ?? '';
    this.telefon = k.telefon ?? '';
    this.email = k.email ?? '';
    this.website = k.website ?? '';
    this.branche = k.branche ?? '';
    this.notiz = k.notiz ?? '';
    this.istLieferant = k.ist_lieferant;
    this.fotoUrl = k.foto_url ?? null;
    this.tagsRaw = k.tags.join(', ');
  }

  onFotoAusgelesen(event: { fotoUrl: string; kiDaten: KiVisitenkarteResponse }): void {
    this.fotoUrl = event.fotoUrl;
    const ki = event.kiDaten;
    if (ki.firma && !this.firma) this.firma = ki.firma;
    if (ki.ansprechpartner && !this.ansprechpartner) this.ansprechpartner = ki.ansprechpartner;
    if (ki.position && !this.position) this.position = ki.position;
    if (ki.mobil && !this.mobil) this.mobil = ki.mobil;
    if (ki.telefon && !this.telefon) this.telefon = ki.telefon;
    if (ki.email && !this.email) this.email = ki.email;
    if (ki.website && !this.website) this.website = ki.website;
  }

  toggleViewer(): void {
    this.showViewer.update(v => !v);
  }

  async speichern(): Promise<void> {
    if (!this.firma.trim()) return;
    this.isSaving.set(true);

    const tags = this.tagsRaw
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);

    const data: Partial<Kontakt> = {
      firma: this.firma.trim(),
      ansprechpartner: this.ansprechpartner || undefined,
      position: this.position || undefined,
      mobil: this.mobil || undefined,
      telefon: this.telefon || undefined,
      email: this.email || undefined,
      website: this.website || undefined,
      branche: this.branche || undefined,
      notiz: this.notiz || undefined,
      ist_lieferant: this.istLieferant,
      foto_url: this.fotoUrl ?? undefined,
      tags,
    };

    try {
      if (this.isNeu()) {
        await this.service.erstelle(data);
      } else if (this.kontaktId) {
        await this.service.aktualisiere(this.kontaktId, data);
      }
      this.router.navigate(['/visitenkarten']);
    } finally {
      this.isSaving.set(false);
    }
  }

  async loeschen(): Promise<void> {
    if (!this.kontaktId) return;
    if (!confirm('Kontakt wirklich löschen?')) return;
    await this.service.loesche(this.kontaktId);
    this.router.navigate(['/visitenkarten']);
  }

  zurueck(): void {
    this.router.navigate(['/visitenkarten']);
  }
}
