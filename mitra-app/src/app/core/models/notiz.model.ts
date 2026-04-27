export type NotizStatus   = 'offen' | 'in_bearbeitung' | 'erledigt';
export type NotizTyp      = 'aufmass' | 'begehung' | 'wartung' | 'notdienst' | 'allgemein';
export type NotizItemTyp  = 'produkt' | 'aufgabe' | 'termin' | 'notiz';
export type SyncStatus    = 'synced' | 'pending' | 'conflict' | 'error';
export type NotizVonwem   = 'kunde' | 'lieferant' | 'intern' | 'aufmass';
export type NotizTopic    = 'sanitaer' | 'heizung' | 'notdienst' | 'allgemein';

export interface NotizHersteller {
  id: string;
  name: string;
  kategorie: 'sanitaer' | 'heizung' | 'klima' | 'sonstiges';
}

export interface NotizItem {
  id: string;
  typ: NotizItemTyp;
  text: string;
  hersteller?: string;
  menge?: number;
  einheit?: string;
  faellig_am?: string;
  erledigt: boolean;
}

export interface NotizFoto {
  id: string;
  url: string;
  thumbnail_url: string;
  aufgenommen_am: string;
  beschreibung?: string;
}

export interface Notiz {
  id: string;
  titel: string;
  freitext: string;
  ki_text?: string;
  ki_items?: NotizItem[];
  status: NotizStatus;
  typ: NotizTyp;
  // Neue Felder für Notizen-UI (optional für Rückwärtskompatibilität)
  vonwem?: NotizVonwem;
  topic?: NotizTopic;
  summary?: string;
  raw_transcript?: string;
  // Legacy
  hersteller_pills: string[];
  kategorien: string[];
  fotos: NotizFoto[];
  audio_url?: string;
  erstellt_am: string;
  geaendert_am: string;
  erstellt_von: number;
  sync_status: SyncStatus;
  local_id?: string;
  server_id?: string;
  version: number;
}

export interface NotizCreateRequest {
  titel: string;
  freitext: string;
  typ: NotizTyp;
  vonwem?: NotizVonwem;
  topic?: NotizTopic;
  hersteller_pills?: string[];
  kategorien?: string[];
}

export interface KiStrukturierRequest {
  transkript: string;
  kategorie: string;
}

export interface KiStrukturierResponse {
  ki_text: string;
  items: NotizItem[];
}
