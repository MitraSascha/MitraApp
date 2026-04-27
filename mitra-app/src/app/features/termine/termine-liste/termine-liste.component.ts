import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TerminStore } from '../stores/termine.store';
import { TermineService } from '../services/termine.service';
import { Termin } from '../../../core/models/termin.model';

@Component({
  selector: 'app-termine-liste',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './termine-liste.component.html',
  styleUrl: './termine-liste.component.scss',
})
export class TermineListeComponent implements OnInit {
  readonly store = inject(TerminStore);
  private readonly service = inject(TermineService);

  async ngOnInit(): Promise<void> {
    await this.service.ladeAlle();
  }

  async loesche(termin: Termin, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (confirm(`"${termin.titel}" wirklich löschen?`)) {
      await this.service.loesche(termin.id);
    }
  }

  formatDatum(iso: string): string {
    return new Date(iso).toLocaleDateString('de-DE', {
      weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'
    });
  }

  trackById(_: number, t: Termin): string { return t.id; }
}
