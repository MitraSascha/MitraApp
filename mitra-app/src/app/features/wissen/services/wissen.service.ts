import { Injectable, inject } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../../../core/models/chat.model';
import { ApiService } from '../../../core/services/api.service';
import { WissenStore } from '../stores/wissen.store';

@Injectable({ providedIn: 'root' })
export class WissenService {
  private readonly api = inject(ApiService);
  private readonly store = inject(WissenStore);

  async sendeFrageStreaming(frage: string): Promise<void> {
    // Nutzernachricht sofort einfügen
    const userMsg: ChatMessage = {
      id: uuidv4(),
      session_id: this.store.sessionId() ?? '',
      role: 'user',
      content: frage,
      status: 'complete',
      quellen: [],
      timestamp: new Date().toISOString(),
    };
    this.store.addNachricht(userMsg);

    // Platzhalter für Antwort
    const assistentMsg: ChatMessage = {
      id: uuidv4(),
      session_id: this.store.sessionId() ?? '',
      role: 'assistant',
      content: '',
      status: 'streaming',
      quellen: [],
      timestamp: new Date().toISOString(),
    };
    this.store.addNachricht(assistentMsg);
    this.store.setStreaming(true);

    try {
      const body: Record<string, unknown> = { frage };
      if (this.store.sessionId()) {
        body['session_id'] = this.store.sessionId();
      }

      await new Promise<void>((resolve, reject) => {
        let buffer = '';
        const sub = this.api.streamSSE('/wissen/chat/', body).subscribe({
          next: (chunk: string) => {
            buffer += chunk;
            // SSE-Zeilen parsen: "data: {...}\n\n"
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') {
                sub.unsubscribe();
                resolve();
                return;
              }
              try {
                const obj = JSON.parse(payload);
                if (obj.session_id && !this.store.sessionId()) {
                  this.store.setSessionId(obj.session_id);
                }
                if (obj.text) {
                  this.store.appendToLetzteNachricht(obj.text);
                }
                if (obj.quellen) {
                  this.store.setLetzteNachrichtQuellen(obj.quellen);
                }
              } catch {
                // Ignore parse errors for incomplete chunks
              }
            }
          },
          error: reject,
          complete: resolve,
        });
      });

      this.store.updateLetzteNachricht(
        this.store.nachrichten()[this.store.nachrichten().length - 1].content,
        'complete'
      );
      await this.store.persistSession();
    } catch {
      this.store.updateLetzteNachricht(
        'Fehler: Wissenssuche konnte nicht abgerufen werden.',
        'error'
      );
    } finally {
      this.store.setStreaming(false);
    }
  }

  neueSession(): void {
    this.store.neueSession();
  }
}
