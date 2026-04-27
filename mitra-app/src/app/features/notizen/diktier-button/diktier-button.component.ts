import { Component, Output, EventEmitter, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotizenService } from '../services/notizen.service';
import { AUDIO_FORMATS } from '../../../core/models/hersteller.constants';

type DiktierStatus = 'idle' | 'recording' | 'processing' | 'error';

@Component({
  selector: 'app-diktier-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diktier-button.component.html',
  styleUrl: './diktier-button.component.scss',
})
export class DiktierButtonComponent {
  @Output() transkriptFertig = new EventEmitter<string>();

  private readonly service = inject(NotizenService);

  readonly status = signal<DiktierStatus>('idle');
  readonly errorMsg = signal<string | null>(null);

  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  async starteDiktat(): Promise<void> {
    this.errorMsg.set(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const format = [...AUDIO_FORMATS].find(f => MediaRecorder.isTypeSupported(f)) ?? 'audio/mp4';
      this.recorder = new MediaRecorder(stream, { mimeType: format });
      this.chunks = [];

      this.recorder.ondataavailable = e => {
        if (e.data.size > 0) this.chunks.push(e.data);
      };

      this.recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        this.status.set('processing');
        try {
          const blob = new Blob(this.chunks, { type: format });
          const text = await this.service.transkribiereAudio(blob);
          this.transkriptFertig.emit(text);
        } catch {
          this.errorMsg.set('Transkription fehlgeschlagen.');
        } finally {
          this.status.set('idle');
        }
      };

      this.recorder.start(1000); // 1s Chunks
      this.status.set('recording');
    } catch {
      this.errorMsg.set('Mikrofon-Zugriff verweigert.');
      this.status.set('error');
    }
  }

  stoppeDiktat(): void {
    if (this.recorder && this.recorder.state === 'recording') {
      this.recorder.stop();
    }
  }

  toggle(): void {
    if (this.status() === 'recording') {
      this.stoppeDiktat();
    } else {
      this.starteDiktat();
    }
  }
}
