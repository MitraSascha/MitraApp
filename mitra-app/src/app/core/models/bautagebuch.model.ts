import { SyncStatus } from './notiz.model';

export type WetterTyp = 'sonnig' | 'bewoelkt' | 'regen' | 'schnee' | 'sturm' | 'nebel';
export type FotoTyp = 'arbeit' | 'mangel' | 'vorher' | 'nachher' | 'allgemein';
export type MangelPrioritaet = 'niedrig' | 'mittel' | 'hoch' | 'kritisch';
export type MangelStatus = 'offen' | 'in_bearbeitung' | 'erledigt';

export type Gewerk =
  | 'Elektriker' | 'Anlagenmechaniker' | 'Fliesenleger' | 'Trockenbauer'
  | 'Maler' | 'Dachdecker' | 'Zimmermann' | 'Maurer' | 'Schlosser'
  | 'Sanitär' | 'Heizung' | 'Klima' | 'Sonstige';

export const GEWERKE: Gewerk[] = [
  'Sanitär', 'Heizung', 'Klima', 'Elektriker', 'Anlagenmechaniker',
  'Fliesenleger', 'Trockenbauer', 'Maler', 'Dachdecker', 'Zimmermann',
  'Maurer', 'Schlosser', 'Sonstige',
];

export interface TagesberichtMitarbeiter {
  name: string;
  rolle: string;
  stunden: number;
}

export interface TagesberichtArbeit {
  id: string;
  beschreibung: string;
  status: 'offen' | 'erledigt';
}

export interface TagesberichtMangel {
  id: string;
  beschreibung: string;
  prioritaet: MangelPrioritaet;
  gewerk?: Gewerk;
  foto_ids: string[];
  status: MangelStatus;
}

export interface TagesberichtCheckItem {
  id: string;
  text: string;
  erledigt: boolean;
}

export interface MaterialPosition {
  id: string;
  name: string;
  menge: number;
  einheit: string;
  erledigt: boolean;
}

export interface TagesberichtFoto {
  id: string;
  url: string;
  beschreibung: string;
  typ: FotoTyp;
  aufgenommen_am: string;
}

export interface Tagesbericht {
  id: string;
  datum: string;
  projekt_name: string;
  projekt_adresse: Record<string, string>;

  wetter: WetterTyp | '';
  temperatur?: number;

  mitarbeiter: TagesberichtMitarbeiter[];
  arbeiten_beschreibung: string;
  arbeiten_items: TagesberichtArbeit[];

  maengel: TagesberichtMangel[];
  checkliste: TagesberichtCheckItem[];
  materialliste: MaterialPosition[];

  unterschrift_auftraggeber?: string;
  unterschrift_auftragnehmer?: string;

  bemerkungen: string;
  fotos: TagesberichtFoto[];

  erstellt_am: string;
  geaendert_am: string;
  erstellt_von?: number;
  sync_status: SyncStatus;
  version: number;
}

export interface TagesberichtCreateRequest {
  datum: string;
  projekt_name: string;
  projekt_adresse?: Record<string, string>;
}
