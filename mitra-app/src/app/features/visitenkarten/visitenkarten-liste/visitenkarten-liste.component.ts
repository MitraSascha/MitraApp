import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { VisitenkartenStore } from '../stores/visitenkarten.store';
import { VisitenkartenService } from '../services/visitenkarten.service';

@Component({
  selector: 'app-visitenkarten-liste',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './visitenkarten-liste.component.html',
  styleUrl: './visitenkarten-liste.component.scss',
})
export class VisitenkartenListeComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly service = inject(VisitenkartenService);
  readonly store = inject(VisitenkartenStore);

  readonly isLoading = signal(false);

  async ngOnInit(): Promise<void> {
    this.isLoading.set(true);
    try {
      await this.service.ladeAlle();
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(query: string): void {
    this.store.setSearchQuery(query);
  }

  openDetail(id: string): void {
    this.router.navigate(['/visitenkarten', id]);
  }

  openNeu(): void {
    this.router.navigate(['/visitenkarten', 'neu']);
  }
}
