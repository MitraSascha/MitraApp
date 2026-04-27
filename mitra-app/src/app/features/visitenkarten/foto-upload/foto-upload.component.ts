import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VisitenkartenService } from '../services/visitenkarten.service';
import { KiVisitenkarteResponse } from '../../../core/models/kontakt.model';

@Component({
  selector: 'app-foto-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './foto-upload.component.html',
  styleUrl: './foto-upload.component.scss',
})
export class FotoUploadComponent {
  @Output() fotoAusgelesen = new EventEmitter<{ fotoUrl: string; kiDaten: KiVisitenkarteResponse }>();

  private readonly service = inject(VisitenkartenService);

  readonly isProcessing = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly errorMsg = signal<string | null>(null);

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.errorMsg.set(null);

    // Lokale Vorschau
    const reader = new FileReader();
    reader.onload = e => this.previewUrl.set(e.target?.result as string);
    reader.readAsDataURL(file);

    this.isProcessing.set(true);
    try {
      const kiDaten = await this.service.leseVisitenkartePerKI(file);
      this.fotoAusgelesen.emit({
        fotoUrl: this.previewUrl() ?? '',
        kiDaten,
      });
    } catch {
      this.errorMsg.set('KI-Auslese fehlgeschlagen. Felder bitte manuell ausfüllen.');
      this.fotoAusgelesen.emit({
        fotoUrl: this.previewUrl() ?? '',
        kiDaten: { konfidenz: 0 },
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  openCamera(): void {
    document.getElementById('foto-input')?.click();
  }
}
