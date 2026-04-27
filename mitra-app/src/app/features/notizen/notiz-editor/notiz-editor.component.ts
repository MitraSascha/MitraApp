import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { NotizenService } from '../services/notizen.service';
import { NotizStore } from '../stores/notizen.store';
import { NotizTyp, KiStrukturierResponse } from '../../../core/models/notiz.model';
import { HerstellerPillsComponent } from '../hersteller-pills/hersteller-pills.component';
import { DiktierButtonComponent } from '../diktier-button/diktier-button.component';

type ActiveTab = 'freitext' | 'ki';

@Component({
  selector: 'app-notiz-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, HerstellerPillsComponent, DiktierButtonComponent],
  templateUrl: './notiz-editor.component.html',
  styleUrl: './notiz-editor.component.scss',
})
export class NotizEditorComponent implements OnInit {
  private readonly service = inject(NotizenService);
  private readonly store = inject(NotizStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly titel = signal('');
  readonly freitext = signal('');
  readonly typ = signal<NotizTyp>('allgemein');
  readonly herstellerPills = signal<string[]>([]);
  readonly activeTab = signal<ActiveTab>('freitext');
  readonly kiResult = signal<KiStrukturierResponse | null>(null);
  readonly isSaving = signal(false);
  readonly isKiLoading = signal(false);
  readonly isEditMode = signal(false);
  readonly editId = signal<string | null>(null);

  readonly typOptionen: Array<{ value: NotizTyp; label: string }> = [
    { value: 'allgemein', label: 'Allgemein' },
    { value: 'aufmass', label: 'Aufmaß' },
    { value: 'begehung', label: 'Begehung' },
    { value: 'wartung', label: 'Wartung' },
    { value: 'notdienst', label: 'Notdienst' },
  ];

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode.set(true);
      this.editId.set(id);
      const notiz = this.store.notizen().find(n => n.id === id);
      if (notiz) {
        this.titel.set(notiz.titel);
        this.freitext.set(notiz.freitext);
        this.typ.set(notiz.typ);
        this.herstellerPills.set([...notiz.hersteller_pills]);
        if (notiz.ki_items) {
          this.kiResult.set({ ki_text: notiz.ki_text ?? '', items: notiz.ki_items });
        }
      }
    }
  }

  onTranskriptFertig(text: string): void {
    this.freitext.update(current => current ? `${current}\n\n${text}` : text);
  }

  async strukturierePerKI(): Promise<void> {
    if (!this.freitext().trim()) return;
    this.isKiLoading.set(true);
    try {
      const result = await this.service.strukturierePerKI({
        transkript: this.freitext(),
        kategorie: this.herstellerPills().length > 0 ? 'sanitaer' : 'allgemein',
      });
      this.kiResult.set(result);
      this.activeTab.set('ki');
    } catch {
      // KI nicht verfügbar — kein Abbruch
    } finally {
      this.isKiLoading.set(false);
    }
  }

  async speichern(): Promise<void> {
    if (!this.titel().trim()) return;
    this.isSaving.set(true);
    try {
      const ki = this.kiResult();
      if (this.isEditMode() && this.editId()) {
        await this.service.aktualisiere(this.editId()!, {
          titel: this.titel(),
          freitext: this.freitext(),
          typ: this.typ(),
          hersteller_pills: this.herstellerPills(),
          ki_text: ki?.ki_text,
          ki_items: ki?.items,
        });
      } else {
        const notiz = await this.service.erstelle({
          titel: this.titel(),
          freitext: this.freitext(),
          typ: this.typ(),
          hersteller_pills: this.herstellerPills(),
        });
        if (ki) {
          await this.service.aktualisiere(notiz.id, {
            ki_text: ki.ki_text,
            ki_items: ki.items,
          });
        }
      }
      await this.router.navigate(['/notizen']);
    } finally {
      this.isSaving.set(false);
    }
  }

  abbrechen(): void {
    this.router.navigate(['/notizen']);
  }
}
