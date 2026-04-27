import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { NotizenService } from '../services/notizen.service';
import { NotizStore } from '../stores/notizen.store';
import { Notiz, NotizStatus } from '../../../core/models/notiz.model';

@Component({
  selector: 'app-notiz-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './notiz-detail.component.html',
  styleUrl: './notiz-detail.component.scss',
})
export class NotizDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly service = inject(NotizenService);
  private readonly store = inject(NotizStore);

  readonly notiz = signal<Notiz | null>(null);
  readonly activeTab = signal<'freitext' | 'ki'>('freitext');

  readonly statusOptionen: Array<{ value: NotizStatus; label: string }> = [
    { value: 'offen', label: 'Offen' },
    { value: 'in_bearbeitung', label: 'In Bearbeitung' },
    { value: 'erledigt', label: 'Erledigt' },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const found = this.store.notizen().find(n => n.id === id);
      this.notiz.set(found ?? null);
    }
  }

  async statusAendern(status: NotizStatus): Promise<void> {
    const n = this.notiz();
    if (!n) return;
    await this.service.statusAendern(n.id, status);
    this.notiz.set({ ...n, status });
  }

  async loeschen(): Promise<void> {
    const n = this.notiz();
    if (!n) return;
    if (confirm(`"${n.titel}" wirklich löschen?`)) {
      await this.service.loesche(n.id);
      this.router.navigate(['/notizen']);
    }
  }

  bearbeiten(): void {
    const n = this.notiz();
    if (n) this.router.navigate(['/notizen', n.id, 'bearbeiten']);
  }

  zurueck(): void {
    this.router.navigate(['/notizen']);
  }
}
