import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import {
  Tagesbericht, TagesberichtMitarbeiter, TagesberichtArbeit,
  TagesberichtMangel, MaterialPosition, WetterTyp, GEWERKE, Gewerk,
} from '../../../core/models/bautagebuch.model';
import { BautagebuchStore } from '../stores/bautagebuch.store';
import { BautagebuchService } from '../services/bautagebuch.service';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { DiktierButtonComponent } from '../../../shared/components/diktier-button/diktier-button.component';

@Component({
  selector: 'app-bautagebuch-editor',
  standalone: true,
  imports: [FormsModule, DiktierButtonComponent],
  templateUrl: './bautagebuch-editor.component.html',
  styleUrl: './bautagebuch-editor.component.scss',
})
export class BautagebuchEditorComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly store = inject(BautagebuchStore);
  private readonly service = inject(BautagebuchService);
  private readonly db = inject(MitraDbService);

  bericht: Tagesbericht | null = null;
  readonly isSaving = signal(false);
  readonly activeTab = signal<'arbeiten' | 'maengel' | 'materialliste'>('arbeiten');

  readonly GEWERKE = GEWERKE;

  readonly wetterOptionen: { key: WetterTyp; icon: string; label: string }[] = [
    { key: 'sonnig', icon: '☀️', label: 'Sonnig' },
    { key: 'bewoelkt', icon: '☁️', label: 'Bewölkt' },
    { key: 'regen', icon: '🌧️', label: 'Regen' },
    { key: 'schnee', icon: '❄️', label: 'Schnee' },
    { key: 'sturm', icon: '⛈️', label: 'Sturm' },
    { key: 'nebel', icon: '🌫️', label: 'Nebel' },
  ];

  // Temp-Felder für Inline-Add
  neuerMitarbeiterName = '';
  neuerMitarbeiterRolle = 'Monteur';
  neueArbeit = '';
  neuerMangel = '';
  neuesMaterial = '';

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    try {
      const nav = this.router.getCurrentNavigation();
      const state = nav?.extras?.state as { bericht?: Tagesbericht } | undefined;
      if (state?.bericht) {
        this.bericht = structuredClone(state.bericht);
        this.ensureMaterialliste();
        return;
      }

      let gefunden: Tagesbericht | undefined = this.store.berichte().find(b => b.id === id);
      if (!gefunden) gefunden = await this.db.bautagebuch.get(id);
      if (!gefunden) {
        await this.service.ladeAlle();
        gefunden = this.store.berichte().find(b => b.id === id);
      }

      if (gefunden) {
        this.bericht = structuredClone(gefunden);
        this.ensureMaterialliste();
      }
    } catch (err) {
      console.error('[Bautagebuch] Fehler beim Laden:', err);
    }
  }

  private ensureMaterialliste(): void {
    if (this.bericht && !this.bericht.materialliste) {
      this.bericht.materialliste = [];
    }
  }

  // ── Wetter ──
  setWetter(w: WetterTyp): void {
    if (!this.bericht) return;
    this.bericht.wetter = this.bericht.wetter === w ? '' : w;
  }

  // ── Mitarbeiter ──
  addMitarbeiter(): void {
    if (!this.bericht || !this.neuerMitarbeiterName.trim()) return;
    this.bericht.mitarbeiter = [
      ...this.bericht.mitarbeiter,
      { name: this.neuerMitarbeiterName.trim(), rolle: this.neuerMitarbeiterRolle, stunden: 8 },
    ];
    this.neuerMitarbeiterName = '';
  }

  removeMitarbeiter(index: number): void {
    if (!this.bericht) return;
    this.bericht.mitarbeiter = this.bericht.mitarbeiter.filter((_, i) => i !== index);
  }

  updateStunden(index: number, stunden: number): void {
    if (!this.bericht) return;
    this.bericht.mitarbeiter = this.bericht.mitarbeiter.map((m, i) =>
      i === index ? { ...m, stunden } : m
    );
  }

  readonly isKiLoading = signal(false);

  // ── KI-Analyse ──
  async kiArbeiten(): Promise<void> {
    if (!this.bericht?.arbeiten_beschreibung?.trim()) return;
    this.isKiLoading.set(true);
    try {
      const res = await this.service.kiArbeiten(this.bericht.id, this.bericht.arbeiten_beschreibung);
      this.bericht.arbeiten_items = [...this.bericht.arbeiten_items, ...res.items];
    } catch { /* ignore */ }
    finally { this.isKiLoading.set(false); }
  }

  async kiMaengel(): Promise<void> {
    if (!this.bericht || !this.neuerMangel.trim()) return;
    this.isKiLoading.set(true);
    try {
      const res = await this.service.kiMaengel(this.bericht.id, this.neuerMangel);
      this.bericht.maengel = [...this.bericht.maengel, ...res.items];
      this.neuerMangel = '';
    } catch { /* ignore */ }
    finally { this.isKiLoading.set(false); }
  }

  async kiMaterialliste(): Promise<void> {
    if (!this.bericht || !this.neuesMaterial.trim()) return;
    this.isKiLoading.set(true);
    try {
      const res = await this.service.kiMaterialliste(this.bericht.id, this.neuesMaterial);
      this.bericht.materialliste = [...this.bericht.materialliste, ...res.items];
      this.neuesMaterial = '';
    } catch { /* ignore */ }
    finally { this.isKiLoading.set(false); }
  }

  // ── Arbeiten ──
  addArbeit(): void {
    if (!this.bericht || !this.neueArbeit.trim()) return;
    const item: TagesberichtArbeit = {
      id: uuidv4(),
      beschreibung: this.neueArbeit.trim(),
      status: 'offen',
    };
    this.bericht.arbeiten_items = [...this.bericht.arbeiten_items, item];
    this.neueArbeit = '';
  }

  toggleArbeit(id: string): void {
    if (!this.bericht) return;
    this.bericht.arbeiten_items = this.bericht.arbeiten_items.map(a =>
      a.id === id ? { ...a, status: a.status === 'erledigt' ? 'offen' : 'erledigt' } : a
    );
  }

  removeArbeit(id: string): void {
    if (!this.bericht) return;
    this.bericht.arbeiten_items = this.bericht.arbeiten_items.filter(a => a.id !== id);
  }

  // ── Mängel ──
  addMangel(): void {
    if (!this.bericht || !this.neuerMangel.trim()) return;
    const mangel: TagesberichtMangel = {
      id: uuidv4(),
      beschreibung: this.neuerMangel.trim(),
      prioritaet: 'mittel',
      foto_ids: [],
      status: 'offen',
    };
    this.bericht.maengel = [...this.bericht.maengel, mangel];
    this.neuerMangel = '';
  }

  onDiktierMangel(text: string): void {
    if (!this.bericht) return;
    // Text ans Textfeld anhängen — User kann weiter diktieren oder KI starten
    this.neuerMangel = this.neuerMangel ? this.neuerMangel + ' ' + text : text;
  }

  toggleMangelStatus(id: string): void {
    if (!this.bericht) return;
    this.bericht.maengel = this.bericht.maengel.map(m =>
      m.id === id ? { ...m, status: m.status === 'erledigt' ? 'offen' : 'erledigt' } : m
    );
  }

  setMangelPrio(id: string, prio: TagesberichtMangel['prioritaet']): void {
    if (!this.bericht) return;
    this.bericht.maengel = this.bericht.maengel.map(m =>
      m.id === id ? { ...m, prioritaet: prio } : m
    );
  }

  setMangelGewerk(id: string, gewerk: string): void {
    if (!this.bericht) return;
    this.bericht.maengel = this.bericht.maengel.map(m =>
      m.id === id ? { ...m, gewerk: gewerk as Gewerk } : m
    );
  }

  removeMangel(id: string): void {
    if (!this.bericht) return;
    this.bericht.maengel = this.bericht.maengel.filter(m => m.id !== id);
  }

  // ── Materialliste ──
  addMaterial(): void {
    if (!this.bericht || !this.neuesMaterial.trim()) return;
    const pos: MaterialPosition = {
      id: uuidv4(),
      name: this.neuesMaterial.trim(),
      menge: 1,
      einheit: 'Stk',
      erledigt: false,
    };
    this.bericht.materialliste = [...this.bericht.materialliste, pos];
    this.neuesMaterial = '';
  }

  onDiktierMaterial(text: string): void {
    if (!this.bericht) return;
    this.neuesMaterial = this.neuesMaterial ? this.neuesMaterial + ' ' + text : text;
  }

  updateMaterial(id: string, field: keyof MaterialPosition, value: string | number | boolean): void {
    if (!this.bericht) return;
    this.bericht.materialliste = this.bericht.materialliste.map(m =>
      m.id === id ? { ...m, [field]: value } : m
    );
  }

  toggleMaterial(id: string): void {
    if (!this.bericht) return;
    this.bericht.materialliste = this.bericht.materialliste.map(m =>
      m.id === id ? { ...m, erledigt: !m.erledigt } : m
    );
  }

  removeMaterial(id: string): void {
    if (!this.bericht) return;
    this.bericht.materialliste = this.bericht.materialliste.filter(m => m.id !== id);
  }

  // ── Speichern / Zurück ──
  async speichern(): Promise<void> {
    if (!this.bericht) return;
    this.isSaving.set(true);
    try {
      await this.service.aktualisiere(this.bericht.id, this.bericht);
      this.router.navigate(['/bautagebuch']);
    } finally {
      this.isSaving.set(false);
    }
  }

  zurueck(): void {
    this.router.navigate(['/bautagebuch']);
  }
}
