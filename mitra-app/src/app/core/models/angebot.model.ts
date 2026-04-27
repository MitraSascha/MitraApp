import { KontaktAdresse } from './kontakt.model';

export type AngebotStatus = 'entwurf' | 'gesendet' | 'angenommen' | 'abgelehnt' | 'abgelaufen';

export interface AngebotKunde {
  firma: string;
  ansprechpartner?: string;
  adresse: KontaktAdresse;
  kontakt_id?: string;
}

export interface Angebotsposition {
  id: string;
  pos_nr: number;
  artnr?: string;
  bezeichnung: string;
  beschreibung?: string;
  menge: number;
  einheit: string;
  einzelpreis: number;
  rabatt_prozent: number;
  gesamtpreis: number;
  ist_manuell: boolean;
  artikel_id?: string;
  foerdermittel_hinweis?: string;
}

export interface Angebot {
  id: string;
  angebotsnummer: string;
  titel: string;
  status: AngebotStatus;
  kunde: AngebotKunde;
  positionen: Angebotsposition[];
  notiz_id?: string;
  nettobetrag: number;
  mwst_prozent: number;
  mwst_betrag: number;
  bruttobetrag: number;
  zahlungsziel_tage: number;
  gueltigkeit_tage: number;
  freitext_kopf?: string;
  freitext_fuss?: string;
  ragflow_referenz_ids: string[];
  erstellt_am: string;
  geaendert_am: string;
  erstellt_von: number;
  pdf_url?: string;
  version: number;
}

export interface AngebotAusNotizRequest {
  notiz_id: string;
  kunde: Partial<AngebotKunde>;
}
