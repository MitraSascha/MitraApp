import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DashboardStore } from './stores/dashboard.store';
import { NotizenService } from '../notizen/services/notizen.service';
import { TermineService } from '../termine/services/termine.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  readonly store = inject(DashboardStore);
  private readonly notizenService = inject(NotizenService);
  private readonly termineService = inject(TermineService);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.notizenService.ladeAlle(),
      this.termineService.ladeAlle(),
    ]);
  }

  formatZeit(iso: string): string {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  }
}
