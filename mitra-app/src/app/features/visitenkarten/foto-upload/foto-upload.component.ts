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
  readonly previewVorderseite = signal<string | null>(null);
  readonly previewRueckseite = signal<string | null>(null);
  readonly errorMsg = signal<string | null>(null);

  private fileVorderseite: File | null = null;
  private fileRueckseite: File | null = null;

  openVorderseite(): void {
    document.getElementById('foto-input-vorderseite')?.click();
  }

  openRueckseite(): void {
    document.getElementById('foto-input-rueckseite')?.click();
  }

  onVorderseitSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileVorderseite = file;
    this.errorMsg.set(null);
    const reader = new FileReader();
    reader.onload = e => this.previewVorderseite.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  onRueckseitSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.fileRueckseite = file;
    this.errorMsg.set(null);
    const reader = new FileReader();
    reader.onload = e => this.previewRueckseite.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  async auslesen(): Promise<void> {
    if (!this.fileVorderseite) return;

    this.errorMsg.set(null);
    this.isProcessing.set(true);
    try {
      const kiDaten = await this.service.leseVisitenkartePerKI(
        this.fileVorderseite,
        this.fileRueckseite ?? undefined,
      );
      this.fotoAusgelesen.emit({
        fotoUrl: this.previewVorderseite() ?? '',
        kiDaten,
      });
    } catch {
      this.errorMsg.set('KI-Auslese fehlgeschlagen. Felder bitte manuell ausfüllen.');
      this.fotoAusgelesen.emit({
        fotoUrl: this.previewVorderseite() ?? '',
        kiDaten: { konfidenz: 0 },
      });
    } finally {
      this.isProcessing.set(false);
    }
  }

  reset(): void {
    this.fileVorderseite = null;
    this.fileRueckseite = null;
    this.previewVorderseite.set(null);
    this.previewRueckseite.set(null);
    this.errorMsg.set(null);
  }
}
