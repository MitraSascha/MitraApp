import { Component, OnInit, inject, signal, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { v4 as uuidv4 } from 'uuid';
import { Angebot, Angebotsposition, ArtikelDetails, Positionsgruppe } from '../../../core/models/angebot.model';
import { AngeboteStore } from '../stores/angebote.store';
import { AngeboteService } from '../services/angebote.service';
import { NotizStore } from '../../notizen/stores/notizen.store';
import { NotizenService } from '../../notizen/services/notizen.service';
import { ArtikelSucheComponent } from '../artikel-suche/artikel-suche.component';
import { MitraDbService } from '../../../core/db/mitra-db.service';
import { SyncService } from '../../../core/services/sync.service';
import { BautagebuchStore } from '../../bautagebuch/stores/bautagebuch.store';
import { BautagebuchService } from '../../bautagebuch/services/bautagebuch.service';
import { Tagesbericht } from '../../../core/models/bautagebuch.model';
import { Notiz } from '../../../core/models/notiz.model';

@Component({
  selector: 'app-angebot-editor',
  standalone: true,
  imports: [FormsModule, ArtikelSucheComponent, CommonModule, DragDropModule],
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
  readonly btbStore = inject(BautagebuchStore);
  private readonly btbService = inject(BautagebuchService);

  readonly isNeu = signal(false);
  readonly isSaving = signal(false);
  readonly kiPanelOpen = signal(false);
  readonly showArtikelSuche = signal(false);
  readonly expandedPosId = signal<string | null>(null);
  readonly editPosId = signal<string | null>(null);

  angebot: Angebot | null = null;
  readonly ladeError = signal('');

  // KI-Generierung Felder
  ausgewaehlteNotizId = '';
  ausgewaehlteMateriallisteId = '';
  kundeFirma = '';
  kundeAnsprechpartner = '';

  private readonly db = inject(MitraDbService);
  private readonly syncService = inject(SyncService);
  private readonly cdr = inject(ChangeDetectorRef);

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('[Angebote] ngOnInit, id=', id);

    if (!id || id === 'neu') {
      this.isNeu.set(true);
      this.angebot = this.erstelleLeeresAngebot();
      console.log('[Angebote] Neues Angebot erstellt:', this.angebot.id);
      this.cdr.detectChanges();
      this.notizService.ladeAlle();
      this.btbService.ladeAlle();
      return;
    }

    try {
      // 1. Router-State
      const nav = this.router.getCurrentNavigation();
      const state = nav?.extras?.state as { angebot?: Angebot } | undefined;
      if (state?.angebot) {
        this.angebot = { ...state.angebot, positionen: [...state.angebot.positionen] };
        this.cdr.detectChanges();
        return;
      }

      // 2. Store
      let gefunden: Angebot | undefined = this.store.angebote().find(a => a.id === id);

      // 3. IndexedDB
      if (!gefunden && id) {
        gefunden = await this.db.angebote.get(id) ?? undefined;
      }

      // 4. Vom Server nachladen
      if (!gefunden && id) {
        await this.service.ladeAlle();
        gefunden = this.store.angebote().find(a => a.id === id);
      }

      if (gefunden) {
        this.angebot = { ...gefunden, positionen: [...gefunden.positionen] };
      } else {
        console.error('[Angebote] Angebot nicht gefunden:', id);
        this.ladeError.set(`Angebot "${id}" nicht gefunden`);
      }
    } catch (err) {
      console.error('[Angebote] Fehler beim Laden:', err);
      this.ladeError.set(`Fehler: ${err}`);
    }
    this.cdr.detectChanges();
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
      gruppen: [],
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
      sync_status: 'pending',
      version: 1,
    };
  }

  /** Ausgewählte Notiz (für Vorschau) */
  get ausgewaehlteNotiz() {
    if (!this.ausgewaehlteNotizId) return null;
    return this.notizStore.notizen().find(n => n.id === this.ausgewaehlteNotizId) ?? null;
  }

  /** Ausgewähltes Bautagebuch (für Materialliste-Vorschau) */
  get ausgewaehlteMaterialliste() {
    if (!this.ausgewaehlteMateriallisteId) return null;
    return this.btbStore.berichte().find(b => b.id === this.ausgewaehlteMateriallisteId) ?? null;
  }

  /** Bautagebuch-Berichte die eine Materialliste haben */
  get berichteMitMaterial(): Tagesbericht[] {
    return this.btbStore.berichte().filter(b => b.materialliste?.length > 0);
  }

  readonly kiError = signal('');

  async generiereAusNotiz(): Promise<void> {
    if (!this.ausgewaehlteNotizId || !this.kundeFirma.trim()) return;
    this.kiError.set('');
    this.store.setGenerating(true);
    try {
      // Notiz muss auf dem Server existieren — ggf. erst synchronisieren
      const notiz = await this.db.notizen.get(this.ausgewaehlteNotizId);
      if (notiz?.sync_status === 'pending') {
        await this.syncService.processQueue();
      }

      const generiert = await this.service.erstelleAusNotiz({
        notiz_id: this.ausgewaehlteNotizId,
        kunde: {
          firma: this.kundeFirma.trim(),
          ansprechpartner: this.kundeAnsprechpartner.trim() || undefined,
        },
      });
      this.angebot = generiert;
      this.kiPanelOpen.set(false);
      this.isNeu.set(false);
    } catch (err: unknown) {
      const httpErr = err as { status?: number; error?: { error?: string } };
      if (httpErr?.status === 404) {
        this.kiError.set('Notiz wurde noch nicht synchronisiert. Bitte warte einen Moment und versuche es erneut.');
      } else if (httpErr?.status === 400) {
        this.kiError.set(httpErr?.error?.error || 'Fehler bei der KI-Generierung. Die Notiz braucht Text-Inhalt.');
      } else {
        this.kiError.set('KI-Generierung fehlgeschlagen. Bitte manuell befüllen.');
      }
    } finally {
      this.store.setGenerating(false);
    }
  }

  async generiereAusMaterialliste(): Promise<void> {
    if (!this.ausgewaehlteMateriallisteId || !this.kundeFirma.trim()) return;
    this.kiError.set('');
    this.store.setGenerating(true);
    try {
      const bericht = this.btbStore.berichte().find(b => b.id === this.ausgewaehlteMateriallisteId);
      if (!bericht?.materialliste?.length) {
        this.kiError.set('Bautagebuch hat keine Materialliste.');
        return;
      }
      // Materialliste als Text formatieren für die KI-Pipeline
      const materialText = bericht.materialliste
        .map(m => `${m.menge} ${m.einheit} ${m.name}`)
        .join('\n');

      const generiert = await this.service.erstelleAusNotiz({
        notiz_id: '', // wird nicht gebraucht
        kunde: {
          firma: this.kundeFirma.trim(),
          ansprechpartner: this.kundeAnsprechpartner.trim() || undefined,
        },
        materialliste_text: materialText,
      });
      this.angebot = generiert;
      this.kiPanelOpen.set(false);
      this.isNeu.set(false);
    } catch {
      this.kiError.set('KI-Generierung aus Materialliste fehlgeschlagen.');
    } finally {
      this.store.setGenerating(false);
    }
  }

  addPosition(): void {
    if (!this.angebot) return;
    this.angebot = this.service.addPosition(this.angebot);
  }

  artikelUebernehmen(pos: Angebotsposition): void {
    if (!this.angebot) return;
    pos.pos_nr = this.angebot.positionen.length + 1;
    pos.mwst_prozent = pos.mwst_prozent ?? this.angebot.mwst_prozent;
    this.angebot = {
      ...this.angebot,
      positionen: [...this.angebot.positionen, pos],
    };
    this.service['berechneGruppen'](this.angebot);
    this.service['berechneSummen'](this.angebot);
    this.angebot = { ...this.angebot };
    this.showArtikelSuche.set(false);
  }

  updatePosition(posId: string, field: keyof Angebotsposition, value: string | number): void {
    if (!this.angebot) return;
    this.angebot = this.service.updatePosition(this.angebot, posId, { [field]: value } as Partial<Angebotsposition>);
  }

  /** Wenn VK/Einheit direkt gesetzt wird, Aufschlag% zurückrechnen */
  onVkEinheitChange(posId: string, vk: number): void {
    if (!this.angebot) return;
    const pos = this.angebot.positionen.find(p => p.id === posId);
    if (!pos) return;
    const aufschlag = pos.lp_einheit > 0
      ? ((vk / pos.lp_einheit) - 1) * 100
      : 0;
    this.angebot = this.service.updatePosition(this.angebot, posId, {
      vk_einheit: vk,
      aufschlag_prozent: Math.round(aufschlag * 100) / 100,
    });
  }

  openPosEditor(posId: string): void {
    this.editPosId.set(posId);
    this.expandedPosId.set(null);
  }

  closePosEditor(): void {
    this.editPosId.set(null);
  }

  getEditPos(): Angebotsposition | null {
    if (!this.angebot || !this.editPosId()) return null;
    return this.angebot.positionen.find(p => p.id === this.editPosId()!) ?? null;
  }

  toggleDetails(posId: string): void {
    this.expandedPosId.set(this.expandedPosId() === posId ? null : posId);
  }

  updateArtikelDetail(posId: string, field: keyof ArtikelDetails, value: string): void {
    if (!this.angebot) return;
    const pos = this.angebot.positionen.find(p => p.id === posId);
    if (!pos?.artikel_details) return;
    pos.artikel_details = { ...pos.artikel_details, [field]: value };
    // Wenn Artikelname geändert → auch Bezeichnung aktualisieren
    if (field === 'artikelname') {
      pos.bezeichnung = value;
    }
    this.angebot = { ...this.angebot, positionen: [...this.angebot.positionen] };
  }

  removePosition(posId: string): void {
    if (!this.angebot) return;
    this.angebot = this.service.removePosition(this.angebot, posId);
  }

  // ── Gruppen ──────────────────────────────────────────

  readonly neuerGruppeName = signal('');

  addGruppe(): void {
    if (!this.angebot) return;
    const name = this.neuerGruppeName().trim();
    if (!name) return;
    this.angebot = this.service.addGruppe(this.angebot, name);
    this.neuerGruppeName.set('');
  }

  removeGruppe(gruppeId: string): void {
    if (!this.angebot) return;
    this.angebot = this.service.removeGruppe(this.angebot, gruppeId);
  }

  updateGruppe(gruppeId: string, field: keyof Positionsgruppe, value: string | number): void {
    if (!this.angebot) return;
    this.angebot = this.service.updateGruppe(this.angebot, gruppeId, { [field]: value } as Partial<Positionsgruppe>);
  }

  addPositionToGruppe(gruppeId: string): void {
    if (!this.angebot) return;
    this.angebot = this.service.addPositionToGruppe(this.angebot, gruppeId);
  }

  artikelInGruppe(gruppeId: string, pos: Angebotsposition): void {
    if (!this.angebot) return;
    pos.pos_nr = this.angebot.positionen.filter(p => p.gruppe_id === gruppeId).length + 1;
    pos.gruppe_id = gruppeId;
    pos.mwst_prozent = pos.mwst_prozent ?? this.angebot.mwst_prozent;
    this.angebot = {
      ...this.angebot,
      positionen: [...this.angebot.positionen, pos],
    };
    this.service['berechneGruppen'](this.angebot);
    this.service['berechneSummen'](this.angebot);
    this.angebot = { ...this.angebot };
  }

  getGruppenPositionen(gruppeId: string): Angebotsposition[] {
    return this.angebot?.positionen.filter(p => p.gruppe_id === gruppeId) ?? [];
  }

  getUngruppiertPositionen(): Angebotsposition[] {
    return this.angebot?.positionen.filter(p => !p.gruppe_id) ?? [];
  }

  readonly sucheGruppeId = signal<string | null>(null);

  toggleGruppeSuche(gruppeId: string): void {
    this.sucheGruppeId.set(this.sucheGruppeId() === gruppeId ? null : gruppeId);
  }

  // ── Drag & Drop ──────────────────────────────────────

  /** Gruppenübergreifendes Verschieben von Positionen */
  dropPositionCross(event: CdkDragDrop<Angebotsposition[], Angebotsposition[], Angebotsposition>, targetGruppeId: string | undefined): void {
    if (!this.angebot) return;
    const pos = event.item.data;

    if (event.previousContainer.id === event.container.id) {
      // Innerhalb derselben Gruppe verschoben
      if (event.previousIndex === event.currentIndex) return;
      this.angebot = this.service.movePositionInList(this.angebot, targetGruppeId, event.previousIndex, event.currentIndex);
    } else {
      // Zwischen Gruppen verschoben: gruppe_id ändern + Position einfügen
      this.angebot = this.service.movePositionToGruppe(this.angebot, pos.id, targetGruppeId);
      // Nach dem Gruppen-Wechsel an die richtige Stelle sortieren
      const targetPositionen = this.angebot.positionen.filter(
        p => targetGruppeId ? p.gruppe_id === targetGruppeId : !p.gruppe_id
      );
      const currentIdx = targetPositionen.findIndex(p => p.id === pos.id);
      if (currentIdx !== -1 && currentIdx !== event.currentIndex) {
        this.angebot = this.service.movePositionInList(this.angebot, targetGruppeId, currentIdx, event.currentIndex);
      }
    }
  }

  dropGruppe(event: CdkDragDrop<Positionsgruppe[]>): void {
    if (!this.angebot || event.previousIndex === event.currentIndex) return;
    this.angebot = this.service.moveGruppe(this.angebot, event.previousIndex, event.currentIndex);
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
