import { SyncStatus } from './notiz.model';

export type TerminStatus = 'geplant' | 'bestaetigt' | 'abgesagt' | 'erledigt';
export type TerminTyp = 'aufmass' | 'wartung' | 'notdienst' | 'besprechung' | 'lieferung' | 'sonstiges';

export interface TerminAdresse {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  zusatz?: string;
  google_maps_url?: string;
}

export interface Termin {
  id: string;
  hero_crm_id?: string;
  titel: string;
  beschreibung?: string;
  typ: TerminTyp;
  status: TerminStatus;
  beginn: string;
  ende: string;
  ganztaegig: boolean;
  adresse?: TerminAdresse;
  kontakt_id?: string;
  monteure: number[];
  push_gesendet: boolean;
  erinnerung_minuten: number;
  erinnerung_ton: boolean;
  notiz_id?: string;
  erstellt_am: string;
  geaendert_am: string;
  sync_status: SyncStatus;
  local_id?: string;
  version: number;
}

export interface TerminCreateRequest {
  titel: string;
  typ: TerminTyp;
  beginn: string;
  ende: string;
  ganztaegig?: boolean;
  adresse?: Partial<TerminAdresse>;
  monteure?: number[];
  erinnerung_minuten?: number;
  erinnerung_ton?: boolean;
}
