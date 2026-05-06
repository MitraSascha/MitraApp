import { Injectable, signal, computed, inject } from '@angular/core';
import { ChatMessage, ChatSession } from '../../../core/models/chat.model';
import { MitraDbService } from '../../../core/db/mitra-db.service';

@Injectable({ providedIn: 'root' })
export class WissenStore {
  private readonly db = inject(MitraDbService);

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

  /** Lädt Sessions und (optional) Nachrichten der letzten Session aus IndexedDB. */
  async init(): Promise<void> {
    const sessions = await this.db.chat_sessions.orderBy('letzte_nachricht_am').reverse().toArray();
    this._sessions.set(sessions);
    if (sessions.length > 0) {
      const letzte = sessions[0];
      this._sessionId.set(letzte.id);
      const msgs = await this.db.chat_messages
        .where('session_id').equals(letzte.id)
        .sortBy('timestamp');
      this._nachrichten.set(msgs);
    }
  }

  /** Lädt Nachrichten einer bestimmten Session. */
  async ladeSession(sessionId: string): Promise<void> {
    this._sessionId.set(sessionId);
    const msgs = await this.db.chat_messages
      .where('session_id').equals(sessionId)
      .sortBy('timestamp');
    this._nachrichten.set(msgs);
  }

  setNachrichten(nachrichten: ChatMessage[]): void {
    this._nachrichten.set(nachrichten);
  }

  addNachricht(msg: ChatMessage): void {
    this._nachrichten.update(list => [...list, msg]);
    // Persist asynchron — blockiert UI nicht
    this.db.chat_messages.put(msg).catch(() => {});
  }

  updateLetzteNachricht(content: string, status: ChatMessage['status']): void {
    this._nachrichten.update(list => {
      if (list.length === 0) return list;
      const copy = [...list];
      const updated = { ...copy[copy.length - 1], content, status };
      copy[copy.length - 1] = updated;
      // Persist finale Nachricht
      if (status === 'complete' || status === 'error') {
        this.db.chat_messages.put(updated).catch(() => {});
      }
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

  /** Speichert/aktualisiert die aktuelle Session in IndexedDB. */
  async persistSession(): Promise<void> {
    const sid = this._sessionId();
    if (!sid) return;
    const msgs = this._nachrichten();
    const session: ChatSession = {
      id: sid,
      titel: msgs.find(m => m.role === 'user')?.content.slice(0, 60) ?? 'Chat',
      erstellt_am: msgs[0]?.timestamp ?? new Date().toISOString(),
      letzte_nachricht_am: msgs[msgs.length - 1]?.timestamp ?? new Date().toISOString(),
      nachrichten_anzahl: msgs.length,
    };
    await this.db.chat_sessions.put(session);
    this._sessions.update(list => {
      const without = list.filter(s => s.id !== sid);
      return [session, ...without];
    });
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
