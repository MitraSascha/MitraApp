import { SyncStatus } from './notiz.model';

export type Zuverlaessigkeit = 'gering' | 'mittel' | 'hoch';
export type Bewertung = 1 | 2 | 3 | 4 | 5;

export interface KontaktAdresse {
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  land?: string;
}

export interface GespraechsNotiz {
  id: string;
  datum: string;
  text: string;
  erstellt_von: number;
}

export interface Kontakt {
  id: string;
  firma: string;
  ansprechpartner?: string;
  position?: string;
  mobil?: string;
  telefon?: string;
  email?: string;
  website?: string;
  adresse?: KontaktAdresse;
  branche?: string;
  bewertung?: Bewertung;
  zuverlaessigkeit?: Zuverlaessigkeit;
  ist_lieferant: boolean;
  zahlungsziel_tage?: number;
  tags: string[];
  notiz?: string;
  kennen_uns_ueber?: string;
  foto_url?: string;
  erstellt_am: string;
  zuletzt_kontaktiert?: string;
  hero_crm_id?: string;
  gespraechsnotizen: GespraechsNotiz[];
  sync_status: SyncStatus;
  local_id?: string;
  version: number;
}

export interface KiVisitenkarteResponse {
  firma?: string;
  ansprechpartner?: string;
  position?: string;
  mobil?: string;
  telefon?: string;
  email?: string;
  website?: string;
  adresse?: Partial<KontaktAdresse>;
  konfidenz: number;
}
