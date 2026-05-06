import { Component, input, output, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notiz, NotizItem, NotizVonwem, NotizTopic } from '../../../core/models/notiz.model';
import { VONWEM, TOPICS, VONWEM_ENTRIES, TOPICS_ENTRIES } from '../../../core/models/notiz.constants';
import { SchnellEingabeComponent } from '../schnell-eingabe/schnell-eingabe.component';
import { FreitextEingabeComponent } from '../freitext-eingabe/freitext-eingabe.component';
import { ItemZeileComponent } from '../item-zeile/item-zeile.component';

@Component({
  selector: 'app-notiz-karte',
  standalone: true,
  imports: [CommonModule, FormsModule, SchnellEingabeComponent, FreitextEingabeComponent, ItemZeileComponent],
  templateUrl: './notiz-karte.component.html',
  styleUrl: './notiz-karte.component.scss',
})
export class NotizKarteComponent implements OnInit {
  readonly notiz       = input.required<Notiz>();
  readonly defaultOpen = input(false);
  readonly updated     = output<Notiz>();
  readonly deleted     = output<void>();

  readonly VONWEM        = VONWEM;
  readonly TOPICS        = TOPICS;
  readonly vonwemEntries = VONWEM_ENTRIES;
  readonly topicsEntries = TOPICS_ENTRIES;

  offen      = signal(false);
  eingabeModus = signal<'schnell' | 'freitext'>('schnell');

  get vw() { return VONWEM[this.notiz().vonwem ?? 'kunde'] ?? VONWEM['kunde']; }
  get td() { return TOPICS[this.notiz().topic ?? 'allgemein'] ?? TOPICS['allgemein']; }

  get gefilterteItems() {
    return (this.notiz().ki_items ?? [])
      .filter(i => i.text.trim())
      .sort((a, b) => {
        // Erst nach Hersteller gruppieren (alphabetisch), dann nach Text
        const ha = (a.hersteller || 'ZZZ').toLowerCase();
        const hb = (b.hersteller || 'ZZZ').toLowerCase();
        if (ha !== hb) return ha.localeCompare(hb, 'de');
        return a.text.localeCompare(b.text, 'de');
      });
  }

  /** Einzigartige Hersteller für kompakte Anzeige im Header */
  get herstellerListe(): string[] {
    const items = this.notiz().ki_items ?? [];
    const set = new Set(items.map(i => i.hersteller).filter(Boolean) as string[]);
    return [...set].sort((a, b) => a.localeCompare(b, 'de'));
  }

  ngOnInit(): void {
    this.offen.set(this.defaultOpen());
  }

  formatDatum(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  feldAktualisieren(feld: keyof Notiz, wert: unknown): void {
    this.updated.emit({ ...this.notiz(), [feld]: wert });
  }

  itemHinzufuegen(item: NotizItem): void {
    this.updated.emit({
      ...this.notiz(),
      ki_items: [...(this.notiz().ki_items ?? []), item],
    });
  }

  itemAktualisieren(id: string, updated: NotizItem): void {
    this.updated.emit({
      ...this.notiz(),
      ki_items: (this.notiz().ki_items ?? []).map(i => i.id === id ? updated : i),
    });
  }

  itemLoeschen(id: string): void {
    this.updated.emit({
      ...this.notiz(),
      ki_items: (this.notiz().ki_items ?? []).filter(i => i.id !== id),
    });
  }

  statusFarbe(status: string): string {
    const map: Record<string, string> = {
      offen:          '#94a3b8',
      in_bearbeitung: '#f97316',
      erledigt:       '#34d058',
    };
    return map[status] ?? '#94a3b8';
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      offen:          '○ Offen',
      in_bearbeitung: '◐ Läuft',
      erledigt:       '● Erledigt',
    };
    return map[status] ?? status;
  }

  statusWechseln(): void {
    const reihenfolge = ['offen', 'in_bearbeitung', 'erledigt'];
    const aktuell = this.notiz().status ?? 'offen';
    const naechster = reihenfolge[(reihenfolge.indexOf(aktuell) + 1) % reihenfolge.length];
    this.feldAktualisieren('status', naechster);
  }

  freitextBestaetigt(event: { items: NotizItem[]; rawText: string; summary: string }): void {
    const bestehend = (this.notiz().ki_items ?? []).filter(i => i.text.trim());
    this.updated.emit({
      ...this.notiz(),
      ki_items: [...bestehend, ...event.items],
      raw_transcript: event.rawText,
      summary: event.summary || this.notiz().summary,
    });
  }

  loeschenBestaetigen(): void {
    if (confirm('Notiz löschen?')) {
      this.deleted.emit();
    }
  }

  exportPdf(): void {
    const notiz = this.notiz();
    const vw = this.vw;
    const td = this.td;

    const win = window.open('', '_blank');
    if (!win) return;

    const itemsHtml = this.gefilterteItems.map(i => {
      const cat = td.categories.find((c: {id: string; label: string; color: string}) => c.id === i.typ) ?? { label: i.typ, color: '#888' };
      return `<div class="item">
        <span class="cat" style="color:${cat.color}">${cat.label}</span>
        ${i.hersteller ? `<span class="her">${i.hersteller}</span>` : ''}
        <span class="text">${i.text}</span>
      </div>`;
    }).join('');

    win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8">
<title>${notiz.titel || 'Notiz'}</title>
<style>
  body{font-family:'IBM Plex Mono',monospace;padding:24px;color:#111;font-size:12px}
  h1{font-size:16px;margin-bottom:4px}
  .meta{color:#666;font-size:10px;margin-bottom:16px;display:flex;gap:12px;flex-wrap:wrap}
  .badge{border:1px solid #ddd;border-radius:4px;padding:2px 8px}
  .summary{background:#f9f9f9;border-left:3px solid #e8700a;padding:8px 12px;margin-bottom:16px;color:#333;font-size:11px;line-height:1.6}
  .item{display:flex;gap:8px;align-items:baseline;padding:5px 0;border-bottom:1px solid #f0f0f0}
  .cat{font-size:10px;min-width:80px;flex-shrink:0}
  .her{font-size:10px;color:#e86500}
  .text{flex:1}
  .footer{margin-top:24px;color:#aaa;font-size:9px;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<h1>${notiz.titel || 'Ohne Titel'}</h1>
<div class="meta">
  <span class="badge">${vw.icon} ${vw.label}</span>
  <span class="badge">${td.icon} ${td.label}</span>
  <span class="badge">${this.statusLabel(notiz.status)}</span>
  <span>${this.formatDatum(notiz.erstellt_am)}</span>
</div>
${notiz.summary ? `<div class="summary">${notiz.summary}</div>` : ''}
<div class="items">${itemsHtml}</div>
<div class="footer">MitraApp — ${new Date().toLocaleDateString('de-DE')}</div>
</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
  }

  exportJson(): void {
    const json = JSON.stringify(this.notiz(), null, 2);
    this.downloadBlob(json, 'application/json', `${this.safeName()}.json`);
  }

  exportMarkdown(): void {
    const n = this.notiz();
    const zeilen = [
      `# ${n.titel || 'Ohne Titel'}`,
      `_${this.formatDatum(n.erstellt_am)} · ${this.vw.label} · ${this.td.label}_`,
      '',
      n.summary ? `> ${n.summary}\n` : '',
      ...this.gefilterteItems.map(i =>
        `- **${i.typ}** ${i.hersteller ? `[${i.hersteller}] ` : ''}${i.text}`
      ),
    ].join('\n');
    this.downloadBlob(zeilen, 'text/markdown', `${this.safeName()}.md`);
  }

  private safeName(): string {
    return (this.notiz().titel || 'notiz')
      .replace(/[^a-zA-Z0-9äöüÄÖÜß\-_]/g, '_')
      .substring(0, 30);
  }

  private downloadBlob(content: string, type: string, filename: string): void {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = filename;
    a.click();
  }
}
