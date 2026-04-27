import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotizStore } from '../stores/notizen.store';
import { NotizenService } from '../services/notizen.service';
import { Notiz, NotizStatus, NotizVonwem, NotizTopic } from '../../../core/models/notiz.model';
import { VONWEM, TOPICS, VONWEM_ENTRIES, TOPICS_ENTRIES } from '../../../core/models/notiz.constants';
import { NotizKarteComponent } from '../notiz-karte/notiz-karte.component';
import { NeueNotizDialogComponent } from '../neue-notiz-dialog/neue-notiz-dialog.component';

@Component({
  selector: 'app-notizen-liste',
  standalone: true,
  imports: [CommonModule, NotizKarteComponent, NeueNotizDialogComponent],
  templateUrl: './notizen-liste.component.html',
  styleUrl: './notizen-liste.component.scss',
})
export class NotizenListeComponent implements OnInit {
  readonly store   = inject(NotizStore);
  readonly service = inject(NotizenService);

  readonly vonwemEntries = VONWEM_ENTRIES;
  readonly topicsEntries = TOPICS_ENTRIES;
  readonly VONWEM        = VONWEM;
  readonly TOPICS        = TOPICS;

  suche          = signal('');
  filterVonwem   = signal<NotizVonwem | 'alle'>('alle');
  filterTopic    = signal<NotizTopic | 'alle'>('alle');
  filterStatus   = signal<NotizStatus | 'alle'>('alle');
  zeigeFilter    = signal(false);
  zeigeNeuDialog = signal(false);

  readonly hatAktiveFilter = computed(() =>
    this.filterVonwem() !== 'alle'
    || this.filterTopic() !== 'alle'
    || this.filterStatus() !== 'alle'
    || this.suche() !== ''
  );

  readonly gefiltriert = computed(() => {
    const fv = this.filterVonwem();
    const ft = this.filterTopic();
    const fs = this.filterStatus();
    const q  = this.suche().toLowerCase().trim();

    return this.store.notizen().filter(n => {
      if (fv !== 'alle' && (n.vonwem ?? 'kunde') !== fv) return false;
      if (ft !== 'alle' && (n.topic  ?? 'allgemein') !== ft) return false;
      if (fs !== 'alle' && n.status !== fs) return false;
      if (!q) return true;
      return n.titel.toLowerCase().includes(q)
        || (n.ki_items ?? []).some(i =>
            i.text.toLowerCase().includes(q)
            || (i.hersteller ?? '').toLowerCase().includes(q))
        || (n.raw_transcript ?? '').toLowerCase().includes(q)
        || (n.summary ?? '').toLowerCase().includes(q);
    });
  });

  async ngOnInit(): Promise<void> {
    await this.service.ladeAlle();
  }

  filterLoeschen(): void {
    this.filterVonwem.set('alle');
    this.filterTopic.set('alle');
    this.filterStatus.set('alle');
    this.suche.set('');
  }

  async notizErstellen(event: { vonwem: NotizVonwem; topic: NotizTopic }): Promise<void> {
    await this.service.erstelle({
      titel: '',
      freitext: '',
      typ: 'allgemein',
      vonwem: event.vonwem,
      topic: event.topic,
    });
    this.zeigeNeuDialog.set(false);
  }

  async notizAktualisieren(notiz: Notiz): Promise<void> {
    await this.service.aktualisiere(notiz.id, notiz);
  }

  async notizLoeschen(id: string): Promise<void> {
    await this.service.loesche(id);
  }

  statusFarbe(status: string): string {
    const map: Record<string, string> = {
      offen: '#94a3b8', in_bearbeitung: '#f97316', erledigt: '#34d058', alle: '#94a3b8',
    };
    return map[status] ?? '#94a3b8';
  }

  istErsteLeer(notiz: Notiz, idx: number): boolean {
    return idx === 0 && !notiz.titel && (notiz.ki_items ?? []).length === 0;
  }
}
