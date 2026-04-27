import Dexie, { type EntityTable } from 'dexie';
import { Injectable } from '@angular/core';
import { Notiz } from '../models/notiz.model';
import { Termin } from '../models/termin.model';
import { Kontakt } from '../models/kontakt.model';
import { Angebot } from '../models/angebot.model';
import { Artikel } from '../models/artikel.model';
import { ChatMessage, ChatSession } from '../models/chat.model';
import { SyncQueueItem } from '../models/sync.model';

interface NotizRecord extends Notiz { dbId?: number; }
interface TerminRecord extends Termin { dbId?: number; }
interface KontaktRecord extends Kontakt { dbId?: number; }
interface AngebotRecord extends Angebot { dbId?: number; }

@Injectable({ providedIn: 'root' })
export class MitraDbService extends Dexie {
  notizen!: EntityTable<NotizRecord, 'id'>;
  termine!: EntityTable<TerminRecord, 'id'>;
  kontakte!: EntityTable<KontaktRecord, 'id'>;
  angebote!: EntityTable<AngebotRecord, 'id'>;
  artikel_cache!: EntityTable<Artikel, 'artnr'>;
  chat_messages!: EntityTable<ChatMessage, 'id'>;
  chat_sessions!: EntityTable<ChatSession, 'id'>;
  sync_queue!: EntityTable<SyncQueueItem, 'id'>;

  constructor() {
    super('MitraAppDB');

    this.version(1).stores({
      // notizen: id (UUID), indexes: sync_status, erstellt_am, status, typ, erstellt_von
      notizen: 'id, sync_status, erstellt_am, status, typ, erstellt_von',

      // termine: id (UUID), indexes: beginn+ende (Kalender-Range), sync_status, hero_crm_id
      termine: 'id, beginn, ende, sync_status, hero_crm_id, status',

      // kontakte: id (UUID), indexes: firma (Suche), branche, bewertung
      kontakte: 'id, firma, branche, bewertung, sync_status, hero_crm_id',

      // angebote: id (UUID), indexes: status, erstellt_am, notiz_id
      angebote: 'id, status, erstellt_am, notiz_id',

      // artikel_cache: primary=artnr, LRU max 500, älter als 7 Tage löschen
      artikel_cache: 'artnr, hersteller, bezeichnung',

      // chat_messages: compound-index [session_id+timestamp] für geordneten Verlauf
      chat_messages: 'id, session_id, timestamp, [session_id+timestamp]',

      // chat_sessions: primary=RAGflow Session-ID
      chat_sessions: 'id, letzte_nachricht_am',

      // sync_queue: auto-increment, compound [priority+created_at] für FIFO mit Prio
      sync_queue: '++id, status, entity_type, [priority+created_at]',
    });
  }
}
