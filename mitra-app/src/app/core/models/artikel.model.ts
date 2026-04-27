export type ArtikelEinheit = 'Stk' | 'm' | 'm²' | 'm³' | 'kg' | 'l' | 'Set' | 'Pck' | 'Std';
export type ArtikelKategorie = 'sanitaer' | 'heizung' | 'klima' | 'elektro' | 'sonstiges';

export interface Artikel {
  id: string;
  artnr: string;
  hersteller_artnr?: string;
  ean?: string;
  bezeichnung: string;
  beschreibung?: string;
  hersteller: string;
  lieferant: string;
  einheit: ArtikelEinheit;
  preis_ek: number;
  preis_vk?: number;
  warengruppe?: string;
  kategorie: ArtikelKategorie;
  verfuegbar: boolean;
  bild_url?: string;
  datanorm_version: string;
  importiert_am: string;
}

export interface ArtikelSucheRequest {
  q: string;
  kategorie?: ArtikelKategorie;
  hersteller?: string;
  limit?: number;
}

export interface ArtikelSucheResponse {
  artikel: Artikel[];
  total: number;
  query: string;
}
