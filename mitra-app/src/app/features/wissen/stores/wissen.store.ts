import { Injectable, signal, computed } from '@angular/core';
import { ChatMessage, ChatSession } from '../../../core/models/chat.model';

@Injectable({ providedIn: 'root' })
export class WissenStore {
  private readonly _nachrichten = signal<ChatMessage[]>([]);
  private readonly _sessionId = signal<string | null>(null);
  private readonly _isStreaming = signal(false);
  private readonly _isLoading = signal(false);
  private readonly _sessions = signal<ChatSession[]>([]);

  readonly nachrichten = this._nachrichten.asReadonly();
  readonly sessionId = this._sessionId.asReadonly();
  readonly isStreaming = this._isStreaming.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly sessions = this._sessions.asReadonly();

  readonly hatNachrichten = computed(() => this._nachrichten().length > 0);

  setNachrichten(nachrichten: ChatMessage[]): void {
    this._nachrichten.set(nachrichten);
  }

  addNachricht(msg: ChatMessage): void {
    this._nachrichten.update(list => [...list, msg]);
  }

  updateLetzteNachricht(content: string, status: ChatMessage['status']): void {
    this._nachrichten.update(list => {
      if (list.length === 0) return list;
      const copy = [...list];
      copy[copy.length - 1] = { ...copy[copy.length - 1], content, status };
      return copy;
    });
  }

  setLetzteNachrichtQuellen(quellen: ChatMessage['quellen']): void {
    this._nachrichten.update(list => {
      if (list.length === 0) return list;
      const copy = [...list];
      copy[copy.length - 1] = { ...copy[copy.length - 1], quellen };
      return copy;
    });
  }

  appendToLetzteNachricht(chunk: string): void {
    this._nachrichten.update(list => {
      if (list.length === 0) return list;
      const copy = [...list];
      const last = copy[copy.length - 1];
      copy[copy.length - 1] = { ...last, content: last.content + chunk };
      return copy;
    });
  }

  setSessionId(id: string | null): void {
    this._sessionId.set(id);
  }

  setStreaming(value: boolean): void {
    this._isStreaming.set(value);
  }

  setLoading(value: boolean): void {
    this._isLoading.set(value);
  }

  setSessions(sessions: ChatSession[]): void {
    this._sessions.set(sessions);
  }

  neueSession(): void {
    this._nachrichten.set([]);
    this._sessionId.set(null);
  }
}
