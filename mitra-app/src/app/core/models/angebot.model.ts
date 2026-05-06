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

  // Preiskalkulation (wie im Screenshot: EK → LP → Aufschlag → VK)
  ek_einheit: number;       // Einkaufspreis pro Einheit
  lp_einheit: number;       // Listenpreis pro Einheit
  aufschlag_prozent: number; // Aufschlag auf LP in %
  vk_einheit: number;       // Verkaufspreis pro Einheit (= LP * (1 + Aufschlag/100))
  einzelpreis: number;      // = vk_einheit (Kompatibilität)
  rabatt_prozent: number;   // Rabatt auf VK in %
  rabatt_betrag: number;    // Berechneter Rabattbetrag
  vk_netto: number;         // VK nach Rabatt (= vk_einheit * menge * (1 - rabatt/100))
  mwst_prozent: number;     // MwSt-Satz für diese Position (Standard 19)
  gesamtpreis: number;      // = vk_netto (Netto-Gesamt)
  brutto_gesamt: number;    // = vk_netto * (1 + mwst/100)

  ist_manuell: boolean;
  artikel_id?: string;
  foerdermittel_hinweis?: string;
  gruppe_id?: string;          // Zuordnung zur Positionsgruppe

  // Artikelstamm-Kopie (lokal editierbar, ohne Original zu ändern)
  artikel_details?: ArtikelDetails;
}

/** Kopie der Artikelstamm-Daten — wird nur in der Position gespeichert, nie zurückgeschrieben */
export interface ArtikelDetails {
  artikelname: string;
  artikelnummer?: string;
  kategorie?: string;
  matchcode?: string;
  ean?: string;
  hersteller?: string;
  hersteller_nr?: string;
  hersteller_typ?: string;
  lieferant?: string;
  lieferant_nr?: string;
  beschreibung?: string;
}

/** Positionsgruppe — fasst Positionen unter einem Überbegriff zusammen */
export interface Positionsgruppe {
  id: string;
  nummer: number;           // 1, 2, 3, ...
  titel: string;            // z.B. "Trinkwasserstrang", "Strangleitung Abwasser"
  positionen: Angebotsposition[];
  arbeitszeit_std?: number; // Arbeitszeit für diese Gruppe
  rabatt_prozent: number;   // Gruppen-Rabatt
  // Berechnete Werte
  ek_gesamt: number;
  aufschlag_betrag: number;
  aufschlag_prozent: number;
  netto_gesamt: number;
}

export interface Angebot {
  id: string;
  angebotsnummer: string;
  titel: string;
  status: AngebotStatus;
  kunde: AngebotKunde;
  positionen: Angebotsposition[];     // Flache Liste (Kompatibilität + Speicherung)
  gruppen: Positionsgruppe[];         // Gruppierte Positionen
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
  sync_status: 'pending' | 'synced' | 'conflict';
  version: number;
}

export interface AngebotAusNotizRequest {
  notiz_id: string;
  kunde: Partial<AngebotKunde>;
  materialliste_text?: string;
}
