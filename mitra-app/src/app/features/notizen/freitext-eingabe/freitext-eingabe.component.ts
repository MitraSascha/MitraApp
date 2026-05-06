import { Component, input, output, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TopicConfig } from '../../../core/models/notiz.constants';
import { NotizItem, NotizItemTyp } from '../../../core/models/notiz.model';
import { NotizenService } from '../services/notizen.service';
import { DiktierButtonComponent } from '../../../shared/components/diktier-button/diktier-button.component';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-freitext-eingabe',
  standalone: true,
  imports: [CommonModule, FormsModule, DiktierButtonComponent],
  templateUrl: './freitext-eingabe.component.html',
  styleUrl: './freitext-eingabe.component.scss',
})
export class FreitextEingabeComponent {
  readonly topicId     = input.required<string>();
  readonly topicConfig = input.required<TopicConfig>();
  readonly confirmed   = output<{ items: NotizItem[]; rawText: string; summary: string }>();

  private readonly service    = inject(NotizenService);
  private readonly destroyRef = inject(DestroyRef);

  text      = signal('');
  vorschlaege = signal<(NotizItem & { _proposal?: boolean })[] | null>(null);
  entscheidungen = signal<Record<string, boolean>>({});
  loading   = signal(false);
  fehler    = signal('');
  summary   = signal('');

  get angenommeneAnzahl() {
    const d = this.entscheidungen();
    return this.vorschlaege()?.filter(p => d[p.id] !== false).length ?? 0;
  }

  onTranskript(text: string): void {
    this.text.update(current => current ? `${current} ${text}` : text);
  }

  async analysieren(): Promise<void> {
    if (!this.text().trim()) return;
    this.loading.set(true);
    this.fehler.set('');
    this.vorschlaege.set(null);

    try {
      const result = await this.service.strukturierePerKI({
        transkript: this.text(),
        kategorie: this.topicId(),
      });

      const items: NotizItem[] = (result.items ?? []).map(i => ({
        ...i,
        id: uuidv4(),
        erledigt: false,
      }));

      this.vorschlaege.set(items);
      this.summary.set(result.ki_text ?? '');

      const d: Record<string, boolean> = {};
      items.forEach(i => (d[i.id] = true));
      this.entscheidungen.set(d);
    } catch {
      this.fehler.set('KI-Analyse fehlgeschlagen. Bitte erneut versuchen.');
    } finally {
      this.loading.set(false);
    }
  }

  setEntscheidung(id: string, val: boolean): void {
    this.entscheidungen.update(d => ({ ...d, [id]: val }));
  }

  alleAkzeptieren(): void {
    const d: Record<string, boolean> = {};
    this.vorschlaege()?.forEach(p => (d[p.id] = true));
    this.entscheidungen.set(d);
  }

  bestaetigen(): void {
    const d = this.entscheidungen();
    const items = (this.vorschlaege() ?? []).filter(p => d[p.id] !== false);
    this.confirmed.emit({ items, rawText: this.text(), summary: this.summary() });
    this.vorschlaege.set(null);
    this.entscheidungen.set({});
    this.text.set('');
    this.summary.set('');
  }

  getCatConfig(typ: NotizItemTyp) {
    return this.topicConfig().categories.find(c => c.id === typ)
      ?? { color: '#94a3b8', label: typ };
  }
}
