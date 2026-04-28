import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TermineService } from '../services/termine.service';
import { TerminStore } from '../stores/termine.store';
import { Termin, TerminTyp, TerminCreateRequest } from '../../../core/models/termin.model';

@Component({
  selector: 'app-termin-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './termin-detail.component.html',
  styleUrl: './termin-detail.component.scss',
})
export class TerminDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(TermineService);
  private readonly store = inject(TerminStore);

  readonly isNeu = signal(false);
  readonly termin = signal<Termin | null>(null);
  readonly isSaving = signal(false);

  // Formularfelder
  readonly titel = signal('');
  readonly typ = signal<TerminTyp>('aufmass');
  readonly beginn = signal('');
  readonly ende = signal('');
  readonly beschreibung = signal('');
  readonly erinnerungMinuten = signal(30);
  readonly erinnerungTon = signal(true);

  readonly erinnerungOptionen = [
    { minuten: 0,    label: 'Keine' },
    { minuten: 15,   label: '15 Min' },
    { minuten: 30,   label: '30 Min' },
    { minuten: 60,   label: '1 Std' },
    { minuten: 120,  label: '2 Std' },
    { minuten: 240,  label: '4 Std' },
    { minuten: 480,  label: '8 Std' },
    { minuten: 720,  label: '12 Std' },
    { minuten: 1440, label: '1 Tag' },
  ];

  readonly typOptionen: Array<{ value: TerminTyp; label: string }> = [
    { value: 'aufmass', label: 'Aufmaß' },
    { value: 'wartung', label: 'Wartung' },
    { value: 'notdienst', label: 'Notdienst' },
    { value: 'besprechung', label: 'Besprechung' },
    { value: 'lieferung', label: 'Lieferung' },
    { value: 'sonstiges', label: 'Sonstiges' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id || id === 'neu') {
      this.isNeu.set(true);
      const now = new Date();
      this.beginn.set(this.toDatetimeLocal(now));
      const end = new Date(now.getTime() + 3600000);
      this.ende.set(this.toDatetimeLocal(end));
    } else {
      const found = this.store.termine().find(t => t.id === id);
      if (found) {
        this.termin.set(found);
        this.titel.set(found.titel);
        this.typ.set(found.typ);
        this.beginn.set(this.toDatetimeLocal(new Date(found.beginn)));
        this.ende.set(this.toDatetimeLocal(new Date(found.ende)));
        this.beschreibung.set(found.beschreibung ?? '');
        this.erinnerungMinuten.set(found.erinnerung_minuten);
        this.erinnerungTon.set(found.erinnerung_ton ?? true);
      }
    }
  }

  async speichern(): Promise<void> {
    if (!this.titel().trim()) return;
    this.isSaving.set(true);
    try {
      const request: TerminCreateRequest = {
        titel: this.titel(),
        typ: this.typ(),
        beginn: new Date(this.beginn()).toISOString(),
        ende: new Date(this.ende()).toISOString(),
        erinnerung_minuten: this.erinnerungMinuten(),
        erinnerung_ton: this.erinnerungTon(),
      };

      if (this.isNeu()) {
        await this.service.erstelle(request);
      } else {
        await this.service.aktualisiere(this.termin()!.id, {
          titel: request.titel,
          typ: request.typ,
          beginn: request.beginn,
          ende: request.ende,
          erinnerung_minuten: request.erinnerung_minuten,
          erinnerung_ton: request.erinnerung_ton,
          beschreibung: this.beschreibung(),
        });
      }
      this.router.navigate(['/termine']);
    } finally {
      this.isSaving.set(false);
    }
  }

  async loesche(): Promise<void> {
    const t = this.termin();
    if (t && confirm(`"${t.titel}" wirklich löschen?`)) {
      await this.service.loesche(t.id);
      this.router.navigate(['/termine']);
    }
  }

  private toDatetimeLocal(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
