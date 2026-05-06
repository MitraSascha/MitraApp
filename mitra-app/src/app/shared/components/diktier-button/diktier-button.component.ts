import { Component, Output, EventEmitter, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

type DiktierStatus = 'idle' | 'recording' | 'processing' | 'error';

@Component({
  selector: 'app-diktier-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diktier-button.component.html',
  styleUrl: './diktier-button.component.scss',
})
export class DiktierButtonComponent implements OnDestroy {
  @Output() transkriptFertig = new EventEmitter<string>();

  readonly status = signal<DiktierStatus>('idle');
  readonly errorMsg = signal<string | null>(null);

  private recognition: any = null;
  private accumulated = '';

  toggle(): void {
    if (this.status() === 'recording') {
      this.stoppe();
    } else {
      this.accumulated = '';
      this.errorMsg.set(null);
      this.starte();
    }
  }

  private starte(): void {
    const SpeechApi = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SpeechApi) {
      this.errorMsg.set('Spracherkennung nicht unterstützt.');
      this.status.set('error');
      return;
    }

    this.recognition = new SpeechApi();
    this.recognition.lang = 'de-DE';
    this.recognition.continuous = true;
    this.recognition.interimResults = false;
    this.recognition.maxAlternatives = 1;

    this.recognition.onresult = (event: any) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          this.accumulated += event.results[i][0].transcript + ' ';
        }
      }
    };

    this.recognition.onerror = (event: any) => {
      // no-speech = Pause ohne Ton → kein echter Fehler, Neustart folgt via onend
      if (event.error === 'no-speech') return;
      this.errorMsg.set('Fehler: ' + event.error);
      this.status.set('error');
      this.recognition = null;
    };

    this.recognition.onend = () => {
      if (this.status() === 'recording') {
        // Browser hat bei Pause gestoppt → sofort neu starten
        this.starte();
      } else if (this.status() === 'processing') {
        // Manuell gestoppt → Text ausgeben
        const text = this.accumulated.trim();
        if (text) {
          this.transkriptFertig.emit(text);
        } else {
          this.errorMsg.set('Kein Text erkannt.');
        }
        this.status.set('idle');
        this.recognition = null;
      }
    };

    this.recognition.start();
    this.status.set('recording');
  }

  private stoppe(): void {
    if (this.recognition) {
      this.status.set('processing');
      this.recognition.stop();
    }
  }

  ngOnDestroy(): void {
    if (this.recognition) {
      this.status.set('idle');
      this.recognition.abort();
      this.recognition = null;
    }
  }
}
