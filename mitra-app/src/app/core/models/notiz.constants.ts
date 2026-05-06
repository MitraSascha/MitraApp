export interface VonWemConfig {
  icon: string;
  label: string;
  color: string;
}

export interface CategoryConfig {
  id: string;
  label: string;
  color: string;
}

export interface TopicConfig {
  icon: string;
  label: string;
  color: string;
  categories: CategoryConfig[];
  hersteller: string[];
}

// ── Von Wem ───────────────────────────────────────────────────────────────────

export const VONWEM: Record<string, VonWemConfig> = {
  kunde:     { icon: '👤', label: 'Kunde',     color: '#38bdf8' },
  lieferant: { icon: '🏭', label: 'Lieferant', color: '#a78bfa' },
  intern:    { icon: '🏢', label: 'Intern',    color: '#34d399' },
  aufmass:   { icon: '📐', label: 'Aufmaß',    color: '#fbbf24' },
};

export const VONWEM_ENTRIES = Object.entries(VONWEM) as [string, VonWemConfig][];

// ── Kategorien ────────────────────────────────────────────────────────────────

const CATS_BASIS: CategoryConfig[] = [
  { id: 'notiz',   label: 'Notiz',   color: '#94a3b8' },
  { id: 'aufgabe', label: 'Aufgabe', color: '#f97316' },
  { id: 'termin',  label: 'Termin',  color: '#facc15' },
];

// ── Themen ────────────────────────────────────────────────────────────────────

export const TOPICS: Record<string, TopicConfig> = {
  sanitaer: {
    icon: '🚿', label: 'Sanitär', color: '#38bdf8',
    categories: [
      ...CATS_BASIS,
      { id: 'produkt', label: 'Sanitär', color: '#38bdf8' },
    ],
    hersteller: [
      'Grohe', 'Hansgrohe', 'Dornbracht', 'Kludi', 'Hansa', 'Schell', 'Kemper',
      'Oras', 'Damixa', 'Conti', 'KWC', 'Similor', 'Vola', 'Herzbach', 'Steinberg', 'Jörger',
      'Villeroy & Boch', 'Duravit', 'Ideal Standard', 'Roca', 'Laufen', 'Keramag',
      'Vigour', 'Sanibel', 'Diana', 'Bette', 'Kaldewei',
      'Geberit', 'TECE', 'Viega', 'Sanit', 'Mepa', 'Wisa',
      'ACO', 'Dallmer', 'KESSEL', 'HL Hutterer & Lechner',
      'HSK', 'Koralle', 'SanSwiss', 'Hüppe', 'Schulte', 'Kermi',
      'Uponor', 'Rehau', 'Aquatherm', 'Wavin', 'Oventrop',
      'Burgbad', 'Keuco', 'Pelipal', 'Puris', 'Fackelmann', 'Sanipa', 'Marlin', 'Emco', 'Sam',
      'Hewi', 'Stiebel Eltron', 'Clage', 'AEG Haustechnik', 'Vaillant',
      'Franke', 'Blanco',
    ],
  },
  heizung: {
    icon: '🔥', label: 'Heizung', color: '#f97316',
    categories: [
      ...CATS_BASIS,
      { id: 'produkt', label: 'Heizung', color: '#f97316' },
    ],
    hersteller: [
      'Viessmann', 'Buderus', 'Vaillant', 'Wolf', 'Weishaupt', 'Junkers', 'Brötje',
      'Stiebel Eltron', 'Daikin', 'NIBE', 'Alpha Innotec', 'Waterkotte', 'Novelan',
      'Lambda', 'iDM', 'Ochsner', 'Panasonic', 'LG', 'Samsung', 'Bosch Thermotechnik',
      'ROTEX', 'MHG Heiztechnik', 'Elco', 'Hoval', 'De Dietrich', 'Remeha', 'Glen Dimplex',
      'Zehnder', 'Kermi', 'Purmo', 'Arbonia', 'Bemm', 'Cosmo', 'Vogel & Noot', 'Schulte', 'Vasco',
      'Grundfos', 'Wilo', 'DAB Pumpen', 'KSB', 'Xylem',
      'Oventrop', 'Danfoss', 'IMI Heimeier', 'Honeywell Home', 'Caleffi',
      'Flamco', 'Reflex Winkelmann', 'Esbe', 'Taconova', 'Herz Armaturen', 'Afriso', 'Resol',
      'Uponor', 'Rehau', 'Roth', 'Schütz', 'Viega', 'Watts',
      'Paradigma', 'Ritter Energie', 'CitrinSolar', 'Wagner Solar', 'Sonnenkraft',
      'Meibes', 'PAW', 'Taco Comfort Solutions', 'Vallox', 'AEG Haustechnik',
    ],
  },
  notdienst: {
    icon: '🚨', label: 'Notdienst', color: '#f87171',
    categories: [
      ...CATS_BASIS,
      { id: 'produkt', label: 'Material', color: '#f87171' },
    ],
    hersteller: [],
  },
  allgemein: {
    icon: '📋', label: 'Allgemein', color: '#94a3b8',
    categories: [
      ...CATS_BASIS,
      { id: 'produkt', label: 'Produkt', color: '#94a3b8' },
    ],
    hersteller: [],
  },
};

export const TOPICS_ENTRIES = Object.entries(TOPICS) as [string, TopicConfig][];
