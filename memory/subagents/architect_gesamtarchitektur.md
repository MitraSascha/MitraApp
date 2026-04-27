---
type: subagent-memory
agent: architect
modul: gesamtarchitektur
created: 2026-04-26
status: completed
---

## Was wurde getan

Gesamtarchitektur der MitraApp geplant auf Basis von:
- Recherche-Bericht (`research_technologie_stack.md`)
- Planungsdokument (`MitraApp_Planung.md`)
- Ablaufplan (`ablaufplan_subagents.md`)
- Aktueller Angular-Projektstruktur (Angular 21, Vite/esbuild, ngsw bereits konfiguriert)
- Getroffene Technologieentscheidungen aus project_decisions.md

Architektur deckt alle 6 Module ab: Dashboard, Notizen, Termine, Angebote, Visitenkarten, Wissensdatenbank-Chat.

---

## Ergebnisse / Outputs

### 1. Feature-Struktur (Dateibaum)

```
mitra-app/src/
├── app/
│   ├── app.config.ts                    # ApplicationConfig, provideRouter, SW-Provider
│   ├── app.routes.ts                    # Root-Routes (alle lazy loaded)
│   ├── app.component.ts                 # Root-Komponente, Shell-Layout
│   ├── app.component.html
│   ├── app.component.scss
│   │
│   ├── core/                            # Einmalig instanziierte Services & Guards
│   │   ├── services/
│   │   │   ├── auth.service.ts          # JWT Login/Logout/Refresh + User-Signal
│   │   │   ├── api.service.ts           # HttpClient-Wrapper, Basis-URL
│   │   │   ├── sync.service.ts          # Offline-Queue verwalten, Dexie.js Queue
│   │   │   ├── notification.service.ts  # VAPID Push-Subscription, Permission-Flow
│   │   │   ├── ki.service.ts            # Anthropic SDK Proxy-Aufrufe (PII-gefiltert)
│   │   │   ├── ragflow.service.ts       # SSE Streaming Chat + Session-Management
│   │   │   └── artikel.service.ts       # Artikelstamm-Suche via Django-Endpoint
│   │   │
│   │   ├── guards/
│   │   │   ├── auth.guard.ts            # Prüft JWT-Token, leitet zu /login um
│   │   │   └── offline.guard.ts         # Zeigt Offline-Warnung wenn kein Netz
│   │   │
│   │   ├── interceptors/
│   │   │   ├── jwt.interceptor.ts       # Hängt Bearer-Token an alle API-Requests
│   │   │   ├── refresh.interceptor.ts   # Erneuert Token bei 401, wiederholt Request
│   │   │   └── offline.interceptor.ts   # Erkennt Netzwerk-Fehler, leitet in Queue
│   │   │
│   │   ├── db/
│   │   │   └── mitra-db.service.ts      # Dexie.js Database-Klasse, Injectable
│   │   │
│   │   └── models/                      # Alle TypeScript-Interfaces (siehe Abschnitt 2)
│   │       ├── notiz.model.ts
│   │       ├── termin.model.ts
│   │       ├── kontakt.model.ts
│   │       ├── angebot.model.ts
│   │       ├── artikel.model.ts
│   │       ├── chat.model.ts
│   │       ├── sync.model.ts
│   │       └── user.model.ts
│   │
│   ├── features/
│   │   │
│   │   ├── auth/                        # Login / Logout
│   │   │   ├── auth.routes.ts
│   │   │   ├── login/
│   │   │   │   ├── login.component.ts
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.scss
│   │   │   └── logout/
│   │   │       └── logout.component.ts
│   │   │
│   │   ├── dashboard/                   # Startseite, Tages-Übersicht
│   │   │   ├── dashboard.routes.ts
│   │   │   ├── dashboard.component.ts   # Container, lädt TerminStore + NotizStore
│   │   │   ├── dashboard.component.html
│   │   │   ├── dashboard.component.scss
│   │   │   └── stores/
│   │   │       └── dashboard.store.ts   # Signals: heutigeTermine, offeneAufgaben
│   │   │
│   │   ├── notizen/                     # Aufmaß & Notizen-Modul
│   │   │   ├── notizen.routes.ts
│   │   │   ├── notizen-liste/
│   │   │   │   ├── notizen-liste.component.ts
│   │   │   │   ├── notizen-liste.component.html
│   │   │   │   └── notizen-liste.component.scss
│   │   │   ├── notiz-detail/
│   │   │   │   ├── notiz-detail.component.ts
│   │   │   │   ├── notiz-detail.component.html
│   │   │   │   └── notiz-detail.component.scss
│   │   │   ├── notiz-editor/
│   │   │   │   ├── notiz-editor.component.ts   # Freitext-Tab + KI-Text-Tab
│   │   │   │   ├── notiz-editor.component.html
│   │   │   │   └── notiz-editor.component.scss
│   │   │   ├── diktier-button/
│   │   │   │   ├── diktier-button.component.ts  # MediaRecorder, Audio-Upload
│   │   │   │   ├── diktier-button.component.html
│   │   │   │   └── diktier-button.component.scss
│   │   │   ├── hersteller-pills/
│   │   │   │   ├── hersteller-pills.component.ts # Sanitär/Heizung Pills
│   │   │   │   ├── hersteller-pills.component.html
│   │   │   │   └── hersteller-pills.component.scss
│   │   │   ├── services/
│   │   │   │   └── notizen.service.ts   # CRUD HTTP + IndexedDB Fallback
│   │   │   └── stores/
│   │   │       └── notizen.store.ts     # Signals: notizen[], aktiveNotiz, syncStatus
│   │   │
│   │   ├── termine/                     # Kalender + HERO-CRM-Sync
│   │   │   ├── termine.routes.ts
│   │   │   ├── termine-liste/
│   │   │   │   ├── termine-liste.component.ts
│   │   │   │   ├── termine-liste.component.html
│   │   │   │   └── termine-liste.component.scss
│   │   │   ├── termin-detail/
│   │   │   │   ├── termin-detail.component.ts
│   │   │   │   ├── termin-detail.component.html
│   │   │   │   └── termin-detail.component.scss
│   │   │   ├── kalender-ansicht/
│   │   │   │   ├── kalender-ansicht.component.ts # Tag/Woche-Ansicht
│   │   │   │   ├── kalender-ansicht.component.html
│   │   │   │   └── kalender-ansicht.component.scss
│   │   │   ├── services/
│   │   │   │   └── termine.service.ts   # CRUD + HERO-Sync via Django-Proxy
│   │   │   └── stores/
│   │   │       └── termine.store.ts     # Signals: termine[], heute, morgen
│   │   │
│   │   ├── angebote/                    # Angebotserstellung (Phase 3)
│   │   │   ├── angebote.routes.ts
│   │   │   ├── angebote-liste/
│   │   │   │   ├── angebote-liste.component.ts
│   │   │   │   ├── angebote-liste.component.html
│   │   │   │   └── angebote-liste.component.scss
│   │   │   ├── angebot-editor/
│   │   │   │   ├── angebot-editor.component.ts  # Drag & Drop Positionen
│   │   │   │   ├── angebot-editor.component.html
│   │   │   │   └── angebot-editor.component.scss
│   │   │   ├── positions-liste/
│   │   │   │   ├── positions-liste.component.ts # CDK Drag & Drop
│   │   │   │   ├── positions-liste.component.html
│   │   │   │   └── positions-liste.component.scss
│   │   │   ├── artikel-suche/
│   │   │   │   ├── artikel-suche.component.ts   # Suche im Artikelstamm
│   │   │   │   ├── artikel-suche.component.html
│   │   │   │   └── artikel-suche.component.scss
│   │   │   ├── services/
│   │   │   │   └── angebote.service.ts  # Angebots-CRUD + Pipeline-Trigger
│   │   │   └── stores/
│   │   │       └── angebote.store.ts    # Signals: angebote[], aktivesAngebot, positionen[]
│   │   │
│   │   ├── visitenkarten/               # Kontakte + 3D-Viewer (Phase 2)
│   │   │   ├── visitenkarten.routes.ts
│   │   │   ├── visitenkarten-liste/
│   │   │   │   ├── visitenkarten-liste.component.ts
│   │   │   │   ├── visitenkarten-liste.component.html
│   │   │   │   └── visitenkarten-liste.component.scss
│   │   │   ├── visitenkarte-detail/
│   │   │   │   ├── visitenkarte-detail.component.ts
│   │   │   │   ├── visitenkarte-detail.component.html
│   │   │   │   └── visitenkarte-detail.component.scss
│   │   │   ├── visitenkarte-viewer/
│   │   │   │   ├── visitenkarte-viewer.component.ts  # @google/model-viewer
│   │   │   │   ├── visitenkarte-viewer.component.html
│   │   │   │   └── visitenkarte-viewer.component.scss
│   │   │   ├── foto-upload/
│   │   │   │   ├── foto-upload.component.ts  # Camera Capture + KI-Auslese
│   │   │   │   ├── foto-upload.component.html
│   │   │   │   └── foto-upload.component.scss
│   │   │   ├── services/
│   │   │   │   └── visitenkarten.service.ts # CRUD + KI-Auslese via Django
│   │   │   └── stores/
│   │   │       └── visitenkarten.store.ts   # Signals: kontakte[], aktiverKontakt
│   │   │
│   │   └── wissen/                      # RAGflow Chat (Phase 2)
│   │       ├── wissen.routes.ts
│   │       ├── chat/
│   │       │   ├── chat.component.ts    # Chat-Interface, SSE Consumer
│   │       │   ├── chat.component.html
│   │       │   └── chat.component.scss
│   │       ├── chat-bubble/
│   │       │   ├── chat-bubble.component.ts  # User/AI-Bubble, Quellen-Anzeige
│   │       │   ├── chat-bubble.component.html
│   │       │   └── chat-bubble.component.scss
│   │       ├── services/
│   │       │   └── wissen.service.ts    # SSE-Streaming-Consumer, Session-Mgmt
│   │       └── stores/
│   │           └── wissen.store.ts      # Signals: nachrichten[], sessionId, isStreaming
│   │
│   └── shared/                          # Wiederverwendbare Komponenten & Utilities
│       ├── components/
│       │   ├── bottom-nav/
│       │   │   ├── bottom-nav.component.ts      # Mobile Bottom Navigation
│       │   │   ├── bottom-nav.component.html
│       │   │   └── bottom-nav.component.scss
│       │   ├── sidebar-nav/
│       │   │   ├── sidebar-nav.component.ts     # Tablet/Desktop Sidebar
│       │   │   ├── sidebar-nav.component.html
│       │   │   └── sidebar-nav.component.scss
│       │   ├── offline-indicator/
│       │   │   ├── offline-indicator.component.ts  # Immer sichtbar
│       │   │   ├── offline-indicator.component.html
│       │   │   └── offline-indicator.component.scss
│       │   ├── status-badge/
│       │   │   ├── status-badge.component.ts   # offen/in-Bearbeitung/erledigt
│       │   │   ├── status-badge.component.html
│       │   │   └── status-badge.component.scss
│       │   ├── confirm-dialog/
│       │   │   ├── confirm-dialog.component.ts
│       │   │   ├── confirm-dialog.component.html
│       │   │   └── confirm-dialog.component.scss
│       │   ├── loading-spinner/
│       │   │   ├── loading-spinner.component.ts
│       │   │   ├── loading-spinner.component.html
│       │   │   └── loading-spinner.component.scss
│       │   └── sterne-bewertung/
│       │       ├── sterne-bewertung.component.ts  # 1-5 Sterne für Visitenkarten
│       │       ├── sterne-bewertung.component.html
│       │       └── sterne-bewertung.component.scss
│       │
│       ├── directives/
│       │   ├── long-press.directive.ts      # Long-Press für Touch (Handschuhe)
│       │   └── auto-resize.directive.ts     # Textarea auto-grow
│       │
│       ├── pipes/
│       │   ├── datum-relativ.pipe.ts        # "vor 2 Stunden", "morgen"
│       │   ├── waehrung.pipe.ts             # EUR-Formatierung
│       │   └── truncate.pipe.ts             # Text kürzen mit "..."
│       │
│       └── ui/
│           └── ui.store.ts                  # Signals: isOnline, isLoading, activeTab
│
├── environments/
│   ├── environment.ts                   # Dev: API-URL localhost, Debug true
│   └── environment.prod.ts             # Prod: API-URL Strato, Debug false
│
├── assets/
│   ├── models/
│   │   └── Visitenkarte.glb             # 3D-Modell für @google/model-viewer
│   ├── fonts/                           # IBM Plex Sans, Inter, JetBrains Mono WOFF2
│   │   ├── IBMPlexSans-Regular.woff2
│   │   ├── IBMPlexSans-Medium.woff2
│   │   ├── IBMPlexSans-Bold.woff2
│   │   ├── Inter-Regular.woff2
│   │   ├── Inter-Medium.woff2
│   │   └── JetBrainsMono-Regular.woff2
│   └── icons/                           # PWA-Icons (192x192, 512x512, maskable)
│
├── styles.scss                          # Global Styles, Design-Token, Font-Imports
├── main.ts
└── index.html

public/
├── manifest.webmanifest                 # PWA-Manifest
└── sw.js                                # Custom Service Worker (Workbox, ersetzt ngsw)
```

---

### 2. TypeScript Interfaces

**`core/models/user.model.ts`**
```typescript
export interface AppUser {
  id: number;
  username: string;
  email: string;
  vorname: string;
  nachname: string;
  rolle: 'monteur' | 'buero' | 'admin';
  avatar_url?: string;
  push_subscription?: PushSubscriptionJSON | null;
  created_at: string;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}
```

---

**`core/models/notiz.model.ts`**
```typescript
export type NotizStatus = 'offen' | 'in_bearbeitung' | 'erledigt';
export type NotizTyp = 'aufmass' | 'begehung' | 'wartung' | 'notdienst' | 'allgemein';
export type NotizItemTyp = 'produkt' | 'aufgabe' | 'termin' | 'notiz';
export type SyncStatus = 'synced' | 'pending' | 'conflict' | 'error';

export interface NotizHersteller {
  id: string;
  name: string;
  kategorie: 'sanitaer' | 'heizung' | 'klima' | 'sonstiges';
}

export interface NotizItem {
  id: string;
  typ: NotizItemTyp;
  text: string;
  hersteller?: string;           // Hersteller-Pill (z.B. "Kaldewei")
  menge?: number;
  einheit?: string;
  faellig_am?: string;           // ISO-Datum für Termin-Items
  erledigt: boolean;
}

export interface NotizFoto {
  id: string;
  url: string;                   // Relative URL zu Django Media
  thumbnail_url: string;
  aufgenommen_am: string;
  beschreibung?: string;
}

export interface Notiz {
  id: string;                    // UUID
  titel: string;
  freitext: string;
  ki_text?: string;              // KI-strukturierte Version
  ki_items?: NotizItem[];        // Extrahierte Produkte/Aufgaben/Termine
  status: NotizStatus;
  typ: NotizTyp;
  hersteller_pills: string[];    // Ausgewählte Hersteller-Tags
  kategorien: string[];          // Freie Kategorien
  fotos: NotizFoto[];
  audio_url?: string;            // URL zur Original-Audiodatei (falls gespeichert)
  erstellt_am: string;           // ISO-DateTime
  geaendert_am: string;
  erstellt_von: number;          // User-ID
  sync_status: SyncStatus;
  local_id?: string;             // UUID für Offline-erstellte Notizen (vor Sync)
  server_id?: string;            // ID vom Django-Backend nach Sync
  version: number;               // Für Conflict-Detection (Optimistic Locking)
}

export interface NotizCreateRequest {
  titel: string;
  freitext: string;
  typ: NotizTyp;
  hersteller_pills?: string[];
  kategorien?: string[];
}

export interface KiStrukturierRequest {
  transkript: string;
  kategorie: string;             // 'sanitaer' | 'heizung' | 'klima'
}

export interface KiStrukturierResponse {
  ki_text: string;
  items: NotizItem[];
}
```

---

**`core/models/termin.model.ts`**
```typescript
export type TerminStatus = 'geplant' | 'bestaetigt' | 'abgesagt' | 'erledigt';
export type TerminTyp = 'aufmass' | 'wartung' | 'notdienst' | 'besprechung' | 'lieferung' | 'sonstiges';

export interface TerminAdresse {
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  zusatz?: string;
  google_maps_url?: string;       // Vorberechneter Maps-Link
}

export interface Termin {
  id: string;                     // UUID
  hero_crm_id?: string;           // HERO CRM externe ID (null wenn lokal erstellt)
  titel: string;
  beschreibung?: string;
  typ: TerminTyp;
  status: TerminStatus;
  beginn: string;                 // ISO-DateTime
  ende: string;                   // ISO-DateTime
  ganztaegig: boolean;
  adresse?: TerminAdresse;
  kontakt_id?: string;            // Verknüpfter Kontakt (Visitenkarte)
  monteure: number[];             // User-IDs der zugeteilten Monteure
  push_gesendet: boolean;
  erinnerung_minuten: number;     // Erinnerung X Minuten vorher (Standard: 30)
  notiz_id?: string;              // Verknüpfte Notiz
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
}
```

---

**`core/models/kontakt.model.ts`**
```typescript
export type Zuverlaessigkeit = 'gering' | 'mittel' | 'hoch';
export type Bewertung = 1 | 2 | 3 | 4 | 5;

export interface KontaktAdresse {
  strasse?: string;
  hausnummer?: string;
  plz?: string;
  ort?: string;
  land?: string;
}

export interface Kontakt {
  id: string;                     // UUID
  firma: string;
  ansprechpartner?: string;
  position?: string;
  mobil?: string;
  telefon?: string;
  email?: string;
  website?: string;
  adresse?: KontaktAdresse;
  branche?: string;
  bewertung?: Bewertung;          // 1-5 Sterne
  zuverlaessigkeit?: Zuverlaessigkeit;
  ist_lieferant: boolean;
  zahlungsziel_tage?: number;     // Nur bei Lieferanten
  tags: string[];                 // Frei vergebbare Tags
  notiz?: string;                 // Freitext-Notiz zum Kontakt
  kennen_uns_ueber?: string;      // "Kennen wir uns über..."
  foto_url?: string;              // URL zum Visitenkarten-Foto (für 3D-Viewer)
  erstellt_am: string;
  zuletzt_kontaktiert?: string;
  hero_crm_id?: string;           // HERO CRM ID für Export
  gespraechsnotizen: GespraechsNotiz[];
  sync_status: SyncStatus;
  local_id?: string;
  version: number;
}

export interface GespraechsNotiz {
  id: string;
  datum: string;
  text: string;
  erstellt_von: number;
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
  konfidenz: number;              // 0.0 - 1.0 Sicherheit der KI-Auslese
}
```

---

**`core/models/angebot.model.ts`**
```typescript
export type AngebotStatus = 'entwurf' | 'gesendet' | 'angenommen' | 'abgelehnt' | 'abgelaufen';

export interface AngebotKunde {
  firma: string;
  ansprechpartner?: string;
  adresse: KontaktAdresse;
  kontakt_id?: string;            // Verknüpft mit Kontakt-Modul
}

export interface Angebotsposition {
  id: string;
  pos_nr: number;                 // Positionsnummer (für Reihenfolge / Drag & Drop)
  artnr?: string;                 // Artikelnummer aus Datanorm
  bezeichnung: string;
  beschreibung?: string;
  menge: number;
  einheit: string;                // 'Stk', 'm', 'm²', 'Std', 'pauschal'
  einzelpreis: number;
  rabatt_prozent: number;
  gesamtpreis: number;            // Berechnet: menge * einzelpreis * (1 - rabatt/100)
  ist_manuell: boolean;           // false = aus Artikelstamm, true = manuell eingegeben
  artikel_id?: string;            // Referenz auf Artikelstamm
  foerdermittel_hinweis?: string; // BEG/KfW-Hinweis wenn erkannt
}

export interface Angebot {
  id: string;                     // UUID
  angebotsnummer: string;         // "AN-2026-001" (generiert vom Backend)
  titel: string;
  status: AngebotStatus;
  kunde: AngebotKunde;
  positionen: Angebotsposition[];
  notiz_id?: string;              // Ursprungs-Notiz
  nettobetrag: number;            // Summe aller Positionspreise
  mwst_prozent: number;           // Standard 19
  mwst_betrag: number;
  bruttobetrag: number;
  zahlungsziel_tage: number;      // Standard 14
  gueltigkeit_tage: number;       // Standard 30
  freitext_kopf?: string;         // Text vor den Positionen
  freitext_fuss?: string;         // Text nach den Positionen (Garantien etc.)
  ragflow_referenz_ids: string[]; // Verwendete RAGflow-Chunks als Referenz
  erstellt_am: string;
  geaendert_am: string;
  erstellt_von: number;
  pdf_url?: string;               // URL zum generierten PDF
  version: number;
}

export interface AngebotAusNotizRequest {
  notiz_id: string;
  kunde: Partial<AngebotKunde>;
}
```

---

**`core/models/artikel.model.ts`**
```typescript
export type ArtikelEinheit = 'Stk' | 'm' | 'm²' | 'm³' | 'kg' | 'l' | 'Set' | 'Pck' | 'Std';
export type ArtikelKategorie = 'sanitaer' | 'heizung' | 'klima' | 'elektro' | 'sonstiges';

export interface Artikel {
  id: string;
  artnr: string;                  // Datanorm Artikelnummer
  hersteller_artnr?: string;      // Herstellereigene Artikelnummer
  ean?: string;                   // EAN/GTIN
  bezeichnung: string;
  beschreibung?: string;
  hersteller: string;
  lieferant: string;
  einheit: ArtikelEinheit;
  preis_ek: number;               // Einkaufspreis (netto)
  preis_vk?: number;              // Verkaufspreis (netto, optional)
  warengruppe?: string;
  kategorie: ArtikelKategorie;
  verfuegbar: boolean;
  bild_url?: string;
  datanorm_version: string;       // 'v5'
  importiert_am: string;
}

export interface ArtikelSucheRequest {
  q: string;                      // Suchbegriff
  kategorie?: ArtikelKategorie;
  hersteller?: string;
  limit?: number;                 // Default 10
}

export interface ArtikelSucheResponse {
  artikel: Artikel[];
  total: number;
  query: string;
}
```

---

**`core/models/chat.model.ts`**
```typescript
export type MessageRole = 'user' | 'assistant';
export type MessageStatus = 'sending' | 'streaming' | 'complete' | 'error';

export interface ChatQuelle {
  dokument: string;               // "Weishaupt WTC Bedienungsanleitung"
  seite?: number;
  snippet: string;                // Relevanter Textausschnitt
  score: number;                  // Relevanz-Score von RAGflow
}

export interface ChatMessage {
  id: string;                     // UUID (lokal generiert)
  session_id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  quellen: ChatQuelle[];          // RAGflow-Quellen (nur bei assistant-Messages)
  timestamp: string;
  token_count?: number;
}

export interface ChatSession {
  id: string;                     // RAGflow Session-ID
  titel: string;                  // Automatisch oder manuell benannt
  erstellt_am: string;
  letzte_nachricht_am: string;
  nachrichten_anzahl: number;
}

export interface ChatRequest {
  frage: string;
  session_id?: string;            // null = neue Session
}
```

---

**`core/models/sync.model.ts`**
```typescript
export type SyncOperation = 'create' | 'update' | 'delete';
export type SyncEntityType = 'notiz' | 'termin' | 'kontakt' | 'angebot';
export type SyncQueueStatus = 'pending' | 'processing' | 'failed' | 'completed';

export interface SyncQueueItem {
  id: number;                     // Dexie auto-increment
  entity_type: SyncEntityType;
  entity_id: string;              // local_id oder server_id
  operation: SyncOperation;
  payload: Record<string, unknown>; // Vollständiges Entity-Objekt
  created_at: number;             // Unix-Timestamp (für Sortierung)
  attempts: number;               // Anzahl der Sync-Versuche
  last_attempt_at?: number;
  error_message?: string;
  status: SyncQueueStatus;
  priority: number;               // 1 = hoch (Notdienst), 5 = niedrig
}

export interface SyncResult {
  success: boolean;
  synced_count: number;
  failed_count: number;
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  entity_type: SyncEntityType;
  entity_id: string;
  local_version: number;
  server_version: number;
  resolution: 'server_wins' | 'local_wins' | 'manual';
}
```

---

### 3. Core Services Plan

**`core/services/auth.service.ts`**
```typescript
import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppUser, AuthTokens, LoginRequest } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals (öffentlich lesbar, privat schreibbar)
  private _currentUser = signal<AppUser | null>(null);
  private _isLoading = signal<boolean>(false);

  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._currentUser() !== null);
  readonly isLoading = this._isLoading.asReadonly();

  // Methoden
  login(credentials: LoginRequest): Promise<void>;
  logout(): Promise<void>;
  refreshToken(): Promise<string>;       // Gibt neuen Access-Token zurück
  loadCurrentUser(): Promise<void>;      // Beim App-Start aufrufen
  getAccessToken(): string | null;       // Aus localStorage/sessionStorage
  getRefreshToken(): string | null;
  clearTokens(): void;
  isTokenExpired(token: string): boolean;
}
```

---

**`core/services/api.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl: string;  // Aus environment.apiUrl

  get<T>(path: string, params?: Record<string, string>): Observable<T>;
  post<T>(path: string, body: unknown): Observable<T>;
  put<T>(path: string, body: unknown): Observable<T>;
  patch<T>(path: string, body: Partial<unknown>): Observable<T>;
  delete<T>(path: string): Observable<T>;

  // Speziell für Multipart-Uploads (Fotos, Audio)
  uploadFile<T>(path: string, file: File, extraFields?: Record<string, string>): Observable<T>;

  // SSE-Streaming (für RAGflow-Chat)
  streamSSE(path: string, body: unknown): Observable<string>;
}
```

---

**`core/services/sync.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class SyncService {
  // Signals
  private _isSyncing = signal<boolean>(false);
  private _pendingCount = signal<number>(0);
  private _lastSyncAt = signal<Date | null>(null);

  readonly isSyncing = this._isSyncing.asReadonly();
  readonly pendingCount = this._pendingCount.asReadonly();
  readonly lastSyncAt = this._lastSyncAt.asReadonly();
  readonly hasPending = computed(() => this._pendingCount() > 0);

  // Methoden
  init(): void;                  // Online-Event-Listener registrieren, SW-Sync registrieren
  enqueue(item: Omit<SyncQueueItem, 'id' | 'created_at' | 'attempts' | 'status'>): Promise<void>;
  processQueue(): Promise<SyncResult>;   // Alle pending Items senden
  retryFailed(): Promise<SyncResult>;    // Fehlgeschlagene Items wiederholen
  clearCompleted(): Promise<void>;
  getQueueItems(): Promise<SyncQueueItem[]>;

  // Intern
  private onOnline(): void;
  private registerBackgroundSync(): Promise<void>;  // navigator.serviceWorker + sync.register()
  private syncEntity(item: SyncQueueItem): Promise<boolean>;
  private resolveConflict(conflict: SyncConflict): Promise<void>;
}
```

---

**`core/services/notification.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class NotificationService {
  // Signals
  private _permission = signal<NotificationPermission>('default');
  private _isSubscribed = signal<boolean>(false);

  readonly permission = this._permission.asReadonly();
  readonly isSubscribed = this._isSubscribed.asReadonly();
  readonly canRequestPermission = computed(() => this._permission() === 'default');

  // Methoden
  init(): Promise<void>;              // Vorhandene Subscription laden
  requestPermission(): Promise<boolean>;   // Zeigt In-App-Dialog, dann Browser-Dialog
  subscribe(): Promise<PushSubscription | null>;
  unsubscribe(): Promise<void>;
  sendSubscriptionToServer(sub: PushSubscription): Promise<void>;
  getVapidPublicKey(): string;        // Aus environment
  checkIosInstallStatus(): boolean;   // Prüft ob PWA installiert (für iOS-Hinweis)
}
```

---

**`core/services/ki.service.ts`**
```typescript
// Alle Methoden senden Daten NUR über Django-Backend.
// PII-Filter läuft Server-seitig (Django Middleware).
// Kein direkter Anthropic-API-Aufruf vom Frontend.
@Injectable({ providedIn: 'root' })
export class KiService {
  // Notiz-Strukturierung via faster-whisper + Anthropic SDK (Django-Proxy)
  transkribiereAudio(audioBlob: Blob): Observable<string>;       // Audio → Text
  strukturiereNotiz(request: KiStrukturierRequest): Observable<KiStrukturierResponse>;

  // Visitenkarte auslesen (Vision)
  liesVisitenkarte(foto: File): Observable<KiVisitenkarteResponse>;

  // Angebots-Pipeline (async, Django orchestriert)
  erstelleAngebotAusNotiz(request: AngebotAusNotizRequest): Observable<Angebot>;
}
```

---

**`core/services/ragflow.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class RagflowService {
  // Signals
  private _aktiveSession = signal<ChatSession | null>(null);
  private _isStreaming = signal<boolean>(false);

  readonly aktiveSession = this._aktiveSession.asReadonly();
  readonly isStreaming = this._isStreaming.asReadonly();

  // Methoden
  starteNeueSitzung(): Promise<ChatSession>;
  ladeSession(sessionId: string): Promise<ChatSession>;
  ladeSessionListe(): Promise<ChatSession[]>;

  // SSE-Streaming Chat (gibt Observable zurück das Token für Token emittiert)
  sendeNachricht(frage: string, sessionId?: string): Observable<ChatMessage>;

  // Chat-History-Verwaltung in IndexedDB
  ladeVerlauf(sessionId: string): Promise<ChatMessage[]>;
  speicherNachricht(message: ChatMessage): Promise<void>;
  loescheSession(sessionId: string): Promise<void>;
}
```

---

**`core/services/artikel.service.ts`**
```typescript
@Injectable({ providedIn: 'root' })
export class ArtikelService {
  // Signals für Suche
  private _suchergebnisse = signal<Artikel[]>([]);
  private _isSearching = signal<boolean>(false);

  readonly suchergebnisse = this._suchergebnisse.asReadonly();
  readonly isSearching = this._isSearching.asReadonly();

  // Methoden
  suche(request: ArtikelSucheRequest): Observable<ArtikelSucheResponse>;
  ladeArtikel(artnr: string): Observable<Artikel>;

  // Cache (Dexie.js für häufig verwendete Artikel)
  cacheArtikel(artikel: Artikel[]): Promise<void>;
  ladeCachedArtikel(artnr: string): Promise<Artikel | undefined>;
  clearCache(): Promise<void>;
}
```

---

### 4. Dexie.js IndexedDB Schema

**`core/db/mitra-db.service.ts`**

```typescript
import Dexie, { type EntityTable } from 'dexie';
import { Injectable } from '@angular/core';
import { Notiz } from '../models/notiz.model';
import { Termin } from '../models/termin.model';
import { Kontakt } from '../models/kontakt.model';
import { Angebot } from '../models/angebot.model';
import { Artikel } from '../models/artikel.model';
import { ChatMessage, ChatSession } from '../models/chat.model';
import { SyncQueueItem } from '../models/sync.model';

// Lokale DB-Repräsentation (für Dexie-interne Typen)
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
      // Notizen
      // Primary: id (UUID)
      // Indexes: sync_status (pending-Filter), erstellt_am (Sortierung), status (offen/erledigt)
      notizen: 'id, sync_status, erstellt_am, status, typ, erstellt_von',

      // Termine
      // Primary: id (UUID)
      // Indexes: beginn+ende (Kalender-Range-Queries), sync_status, hero_crm_id
      termine: 'id, beginn, ende, sync_status, hero_crm_id, status',

      // Kontakte / Visitenkarten
      // Primary: id (UUID)
      // Indexes: firma (Suche), branche (Filter), bewertung (Sortierung)
      kontakte: 'id, firma, branche, bewertung, sync_status, hero_crm_id',

      // Angebote
      // Primary: id (UUID)
      // Indexes: status (Entwurf/Gesendet), erstellt_am, notiz_id
      angebote: 'id, status, erstellt_am, notiz_id',

      // Artikelstamm-Cache (häufig verwendete Artikel)
      // Primary: artnr (Datanorm-Artikelnummer)
      // Indexes: hersteller, bezeichnung (Freitext-Suche)
      artikel_cache: 'artnr, hersteller, bezeichnung',

      // Chat-Nachrichten
      // Primary: id (UUID)
      // Compound-Index: session_id + timestamp (für geordneten Verlauf)
      chat_messages: 'id, session_id, timestamp, [session_id+timestamp]',

      // Chat-Sessions
      // Primary: id (RAGflow-Session-ID)
      chat_sessions: 'id, letzte_nachricht_am',

      // Sync-Queue
      // Primary: id (auto-increment)
      // Indexes: status (pending-Filter), entity_type, priority+created_at (Verarbeitungsreihenfolge)
      sync_queue: '++id, status, entity_type, [priority+created_at]',
    });
  }
}
```

**IndexedDB Performance-Regeln:**
- Alle Filteroperationen NUR auf indizierten Feldern — niemals `filter()` über alle Datensätze
- Range-Queries auf `beginn` für Kalender: `db.termine.where('beginn').between(start, end)`
- Compound-Index `[priority+created_at]` für FIFO-Queue mit Priorisierung
- `artikel_cache`: LRU-Strategie — älter als 7 Tage löschen, max. 500 Artikel

**Conflict-Resolution-Strategie:**

```
Strategie: Server-Wins mit lokalem Versionstracking

1. Jede Entity hat ein 'version'-Feld (Ganzzahl, vom Server erhöht)
2. Beim Sync: Lokale version vs. Server-version vergleichen
3. server.version > local.version → Server-Daten übernehmen (Server-Wins)
4. server.version == local.version → Kein Konflikt, lokal gewinnt
5. server.version < local.version → Unmöglich (zeigt Sync-Fehler an)

Ausnahme: Kritische Felder (Notiz-Status) → Merge-Strategie:
  - status: neuerer Timestamp gewinnt
  - ki_items: Additive Merge (kein Überschreiben)
  - hersteller_pills: Union beider Listen

Konflikt-UI:
  - Konflikt in SyncConflict-Liste protokollieren
  - User-Benachrichtigung nur bei manuell aufzulösendem Konflikt
  - Automatische Auflösung für 95% der Fälle
```

**Offline-Sync-Strategie (Hybrid):**
```
1. App-Start        → processQueue() aufrufen
2. Online-Event     → processQueue() aufrufen (navigator.onLine + 'online'-Event)
3. SW Background    → 'sync'-Event aus Service Worker → processQueue() (Chrome/Edge/Firefox)
4. Foreground-Tick  → alle 60s wenn App im Vordergrund und online
5. visibilitychange → bei Tab-Fokus processQueue() aufrufen

iOS-Fallback: nur 1, 2 und 4 — Background Sync nicht verfügbar
```

---

### 5. API-Layer Design

**Interceptors (Reihenfolge in `app.config.ts`):**

```typescript
// Reihenfolge der Request-Interceptors (LIFO bei Responses):
// 1. offline.interceptor → 2. jwt.interceptor → 3. refresh.interceptor

// providers: [
//   withInterceptors([offlineInterceptor, jwtInterceptor, refreshInterceptor])
// ]
```

**`core/interceptors/jwt.interceptor.ts`**
```typescript
// Fügt Authorization: Bearer <token> hinzu
// Ausnahmen: /api/auth/login/, /api/auth/refresh/ (kein Token nötig)
// Token aus AuthService.getAccessToken()
```

**`core/interceptors/refresh.interceptor.ts`**
```typescript
// Bei HTTP 401: Token-Refresh versuchen, Original-Request wiederholen
// Bei erneutem 401 nach Refresh: Logout + Redirect zu /login
// Race-Condition-Schutz: Nur ein Refresh-Request gleichzeitig (BehaviorSubject-Lock)
```

**`core/interceptors/offline.interceptor.ts`**
```typescript
// Bei navigator.onLine === false:
//   - GET-Requests: Leerer Observable (Daten kommen aus IndexedDB)
//   - POST/PUT/DELETE-Requests: In SyncQueue schreiben, Success simulieren
//   - Offline-Indicator-Signal setzen
// Bei HTTP-Netzwerkfehler (HttpErrorResponse, status 0):
//   - Gleiche Behandlung wie offline
```

**Error-Handling-Strategie:**
```
HTTP 400 Bad Request   → Validierungsfehler → UI-Fehlermeldung am Feld
HTTP 401 Unauthorized  → Token-Refresh-Flow → bei Fehlschlag: Logout
HTTP 403 Forbidden     → Toast: "Keine Berechtigung"
HTTP 404 Not Found     → Toast: "Nicht gefunden" + ggf. Navigation zurück
HTTP 409 Conflict      → Sync-Konflikt → Conflict-Resolution-Flow
HTTP 422               → Validierungsfehler (Django DRF) → Feld-Mapping
HTTP 429               → Rate-Limit → Retry mit Exponential Backoff
HTTP 500+              → Toast: "Serverfehler" + Fehler in SyncQueue zwischenspeichern
Network Error (0)      → Offline-Modus aktivieren

Alle Fehler: ErrorInterceptor protokolliert in Browser-Konsole (Dev) bzw. ignoriert (Prod)
```

**Django-Endpoints (Frontend-Perspektive):**
```
AUTH
  POST   /api/auth/login/                → { access, refresh }
  POST   /api/auth/refresh/              → { access }
  POST   /api/auth/logout/              → 204

NOTIZEN
  GET    /api/notizen/                   → Notiz[]
  POST   /api/notizen/                   → Notiz
  GET    /api/notizen/{id}/              → Notiz
  PUT    /api/notizen/{id}/              → Notiz
  PATCH  /api/notizen/{id}/             → Partial<Notiz>
  DELETE /api/notizen/{id}/             → 204
  POST   /api/notizen/{id}/foto/         → NotizFoto (multipart)

KI
  POST   /api/ki/transkribiere/          → { text: string }  (multipart audio)
  POST   /api/ki/strukturiere-notiz/     → KiStrukturierResponse
  POST   /api/ki/lese-visitenkarte/      → KiVisitenkarteResponse (multipart image)

TERMINE
  GET    /api/termine/                   → Termin[]
  POST   /api/termine/                   → Termin
  PUT    /api/termine/{id}/              → Termin
  DELETE /api/termine/{id}/             → 204
  POST   /api/termine/hero-sync/         → { synced: number }

KONTAKTE / VISITENKARTEN
  GET    /api/kontakte/                  → Kontakt[]
  POST   /api/kontakte/                  → Kontakt
  PUT    /api/kontakte/{id}/             → Kontakt
  DELETE /api/kontakte/{id}/            → 204
  POST   /api/kontakte/{id}/hero-export/ → { hero_crm_id: string }

ANGEBOTE
  GET    /api/angebote/                  → Angebot[]
  POST   /api/angebote/                  → Angebot (manuell)
  POST   /api/angebote/aus-notiz/        → Angebot (KI-Pipeline)
  PUT    /api/angebote/{id}/             → Angebot
  GET    /api/angebote/{id}/pdf/         → PDF-Download (application/pdf)

ARTIKEL
  GET    /api/artikel/suche/?q=...       → ArtikelSucheResponse
  GET    /api/artikel/{artnr}/          → Artikel

PUSH
  POST   /api/push/subscribe/            → 201
  DELETE /api/push/unsubscribe/          → 204

WISSENSDATENBANK (SSE)
  POST   /api/wissen/chat/               → SSE Stream (text/event-stream)
  GET    /api/wissen/sessions/           → ChatSession[]
  DELETE /api/wissen/sessions/{id}/     → 204

NUTZER
  GET    /api/auth/me/                   → AppUser
  PATCH  /api/auth/me/                   → Partial<AppUser>
```

---

### 6. Routing-Plan

**`app.routes.ts`** (Root-Level):
```typescript
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    component: AppComponent,        // Shell mit Bottom-Nav / Sidebar
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      {
        path: 'dashboard',
        loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
        title: 'Dashboard'
      },
      {
        path: 'notizen',
        loadChildren: () => import('./features/notizen/notizen.routes').then(m => m.NOTIZEN_ROUTES),
        title: 'Notizen'
      },
      {
        path: 'termine',
        loadChildren: () => import('./features/termine/termine.routes').then(m => m.TERMINE_ROUTES),
        title: 'Termine'
      },
      {
        path: 'angebote',
        loadChildren: () => import('./features/angebote/angebote.routes').then(m => m.ANGEBOTE_ROUTES),
        title: 'Angebote'
      },
      {
        path: 'visitenkarten',
        loadChildren: () => import('./features/visitenkarten/visitenkarten.routes').then(m => m.VISITENKARTEN_ROUTES),
        title: 'Visitenkarten'
      },
      {
        path: 'wissen',
        loadChildren: () => import('./features/wissen/wissen.routes').then(m => m.WISSEN_ROUTES),
        title: 'Wissensdatenbank'
      },
    ]
  },
  {
    path: 'offline',
    loadComponent: () => import('./shared/components/offline-indicator/offline-indicator.component').then(m => m.OfflineIndicatorComponent)
  },
  { path: '**', redirectTo: 'dashboard' }
];
```

**Feature-Routes (Beispiel `notizen.routes.ts`):**
```typescript
export const NOTIZEN_ROUTES: Routes = [
  { path: '', component: NotizenListeComponent },
  { path: 'neu', component: NotizEditorComponent },
  { path: ':id', component: NotizDetailComponent },
  { path: ':id/bearbeiten', component: NotizEditorComponent },
];
```

**`authGuard` Logik:**
```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) return true;

  // Token noch im Storage? → Versuch User laden
  if (auth.getAccessToken()) {
    return auth.loadCurrentUser().then(() => true).catch(() => {
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    });
  }

  router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
```

**Offline-Fallback:**
- Alle GET-Navigations-Routes funktionieren offline (Daten aus IndexedDB)
- Kein separater `/offline`-Route nötig — Offline-Indikator ist immer sichtbar
- Beim Zugriff ohne lokale Daten: leere Listen mit "Offline — Daten nicht verfügbar"-Hinweis

---

### 7. vite-plugin-pwa vs. ngsw Entscheidung

**Empfehlung: Vollständige Migration zu vite-plugin-pwa + Workbox**

**Begründung:**

Der bestehende Angular 21 Build-Stack nutzt `@angular/build:application` (Vite/esbuild). Das aktuell konfigurierte `ngsw-worker.js` (in `app.config.ts` und `angular.json`) hat folgende kritische Einschränkungen für MitraApp:

1. **Background Sync**: ngsw enthält kein Workbox `BackgroundSyncPlugin`. Offline-Requests müssen manuell über die Sync-Queue und Online-Event gelöst werden — ngsw hilft dabei nicht.

2. **Custom Fetch-Strategien**: ngsw bietet nur vordefinierte Caching-Strategien (`cacheFirst`, `networkFirst`). Für den RAGflow-SSE-Streaming-Endpoint ist kein ngsw-Caching möglich (und auch nicht gewünscht). Die komplexe Offline-Queue benötigt programmatische Kontrolle.

3. **Kein ngsw-Vorteil für MitraApp**: Der einzige ngsw-Mehrwert gegenüber Workbox ist die nahtlose Angular-Integration — durch `vite-plugin-pwa` entfällt dieser Vorteil, da `vite-plugin-pwa` ebenfalls Angular-kompatibel ist.

**Migrationsstrategie (minimal-invasiv):**

```
1. In angular.json: serviceWorker: 'ngsw-config.json' entfernen aus production-Config
2. In app.config.ts: provideServiceWorker('ngsw-worker.js') entfernen
3. vite-plugin-pwa installieren: npm install -D vite-plugin-pwa
4. Custom Service Worker erstellen: public/sw.js (Workbox direkt)
5. In angular.json: custom-webpack oder Vite-Plugin-Config für SW-Injection
6. PWA-Manifest: public/manifest.webmanifest (bereits vorhanden oder neu anlegen)
```

**Achtung**: Angular 21 mit `@angular/build:application` hat noch keine offizielle `vite-plugin-pwa`-Integration über `angular.json`. Die empfohlene Methode ist:
- `workbox-build` direkt im `post-build`-Script: `workbox generateSW workbox-config.js`
- Oder: `@serwist/build` (Fork von vite-plugin-pwa, Angular-freundlicher)
- Service Worker manuell in `index.html` registrieren (kein `provideServiceWorker`)

**Kompromiss-Empfehlung für Phase 1 (MVP):**
Für Phase 1 (Notizen + Termine + Dashboard) kann ngsw temporär beibehalten werden für einfaches Asset-Caching. Der custom Sync-Queue-Mechanismus läuft parallel vollständig über Dexie.js + Online-Event — ngsw stört dabei nicht. Die vollständige SW-Migration erfolgt in Phase 2, wenn Background Sync und RAGflow-SSE-Streaming implementiert werden.

---

## Wichtige Entscheidungen

1. **Standalone Components durchgehend**: Keine NgModule. Jede Komponente ist `standalone: true`. Dependency-Injection über `providers`-Array in der Komponente oder globale Services (`providedIn: 'root'`).

2. **Signal-basierte Stores statt NgRx**: Jedes Feature hat einen eigenen Store (`*.store.ts`) mit Angular Signals. Kein `signal()` in Komponenten für Daten — nur in Services/Stores. Komponenten injecten Stores und lesen Signals.

3. **Kein direkter IndexedDB-Zugriff in Komponenten**: Alle DB-Operationen laufen über Feature-Services (`notizen.service.ts` etc.). Komponenten kennen keine Dexie.js-APIs.

4. **PII-Filter ist Backend-Pflicht**: Frontend schickt Rohdaten zum Django-Backend. Django-Middleware filtert PII vor jedem KI-Aufruf. Frontend hat keine PII-Filter-Logik.

5. **Offline-First-Priorität bei allen Writes**: Jede Schreiboperation schreibt zuerst in IndexedDB, dann in Sync-Queue, dann (wenn online) sofort sync. Kein Warten auf Netzwerk für UI-Feedback.

6. **SSE-Streaming für RAGflow im Frontend über `fetch` + ReadableStream**: Nicht `EventSource` (kein POST-Support). `ApiService.streamSSE()` nutzt `fetch()` mit `body` und liest `response.body` als Stream. Observable gibt Tokens einzeln aus.

7. **Feature-spezifische Services**: `notizen.service.ts` orchestriert HTTP + IndexedDB. Kein generischer "Repository"-Pattern. Services sind bewusst feature-gebunden.

8. **Reactive Signals für Online-Status**: `UIStore.isOnline` ist ein Signal, das von `SyncService.init()` gesetzt wird. Alle Komponenten die auf Online-Status reagieren müssen, consumen dieses Signal — kein direktes `navigator.onLine` in Komponenten.

9. **JWT in localStorage**: Access-Token in `localStorage` (kurze TTL: 15 min), Refresh-Token in `localStorage` (lange TTL: 7 Tage). Bewusstes Trade-off: Einfachheit > HttpOnly-Cookie-Komplexität für interne App mit ~30 Nutzern.

10. **`@google/model-viewer` über CUSTOM_ELEMENTS_SCHEMA**: Web Component benötigt `schemas: [CUSTOM_ELEMENTS_SCHEMA]` im Standalone-Component. Import einmalig in `visitenkarte-viewer.component.ts` via `import '@google/model-viewer'`.

---

## Übergabe-Hinweise

### Für `code-specialist` (Phase 1 Implementierung):

**Sofort umzusetzen:**
- `MitraDbService` als erstes implementieren — alle anderen Services hängen davon ab
- `SyncService.init()` muss in `AppComponent.ngOnInit()` aufgerufen werden
- `NotificationService.init()` ebenfalls in `AppComponent.ngOnInit()`
- `AuthService.loadCurrentUser()` beim App-Start (APP_INITIALIZER oder in `appConfig`)

**Hersteller-Pills (festcodiert):**
```typescript
export const HERSTELLER_SANITAER = ['Grohe', 'Kaldewei', 'Geberit', 'Hansgrohe', 'Villeroy & Boch', 'Duravit', 'Ideal Standard'];
export const HERSTELLER_HEIZUNG = ['Viessmann', 'Buderus', 'Weishaupt', 'Vaillant', 'Wolf', 'Junkers', 'Grundfos'];
export const HERSTELLER_KLIMA = ['Daikin', 'Mitsubishi', 'Panasonic', 'Toshiba', 'LG', 'Samsung'];
```

**Audio-Upload-Format:**
```typescript
// MIME-Type-Fallback-Reihenfolge für MediaRecorder:
const AUDIO_FORMATS = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
const format = AUDIO_FORMATS.find(f => MediaRecorder.isTypeSupported(f)) ?? 'audio/mp4';
// Max. Aufnahme-Chunk: 1000ms (timeslice)
// Max. Datei-Größe für Upload: Django-seitig auf 20MB konfigurieren
```

**Design-Token (global in `styles.scss`):**
```scss
:root {
  --color-primary: #1C2128;
  --color-accent: #E8700A;
  --color-success: #2EA043;
  --color-warning: #D29922;
  --color-danger: #CF222E;
  --color-surface: #2D333B;
  --color-text-primary: #CDD9E5;
  --color-text-secondary: #768390;

  --font-headline: 'IBM Plex Sans', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  --touch-target: 48px;            // Min Touch-Target für Handschuhe
  --border-radius: 8px;
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

**`app.config.ts` finale Konfiguration:**
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(
      withInterceptors([offlineInterceptor, jwtInterceptor, refreshInterceptor])
    ),
    // HINWEIS: provideServiceWorker('ngsw-worker.js') temporär für Phase 1 beibehalten
    // In Phase 2 durch custom Workbox SW ersetzen
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

### Für `state-manager` (Phase 1 Stores):

**Zu implementierende Stores (Phase 1):**
- `NotizStore`: `notizen = signal<Notiz[]>([])`, `aktiveNotiz = signal<Notiz | null>(null)`, `syncStatus = signal<SyncStatus>('synced')`, `isLoading = signal<boolean>(false)`
- `TerminStore`: `termine = signal<Termin[]>([])`, `heutigeTermine = computed(...)`, `morgigTermine = computed(...)`
- `UIStore`: `isOnline = signal<boolean>(navigator.onLine)`, `activeTab = signal<string>('dashboard')`, `isGlobalLoading = signal<boolean>(false)`

**Computed Signals Beispiele:**
```typescript
// DashboardStore
readonly offeneAufgaben = computed(() =>
  this.notizStore.notizen()
    .filter(n => n.status === 'offen')
    .flatMap(n => n.ki_items?.filter(i => i.typ === 'aufgabe' && !i.erledigt) ?? [])
);

readonly heutigeTermine = computed(() => {
  const heute = new Date().toISOString().slice(0, 10);
  return this.terminStore.termine().filter(t => t.beginn.startsWith(heute));
});
```

**Wichtig**: Stores nicht als globale Singletons missbrauchen. Jeder Store exponiert NUR was die Features brauchen. Cross-Feature-Kommunikation läuft über den `DashboardStore`, der beide anderen Stores injectet.

---

## Offene Punkte

1. **vite-plugin-pwa + Angular 21 Kompatibilität**: Muss vor Phase 2 getestet werden. Falls `@serwist/build` oder `workbox-build` via Post-Build-Script nicht funktioniert, Fallback: ngsw permanent + manuelle Sync-Queue ohne SW-Background-Sync.

2. **HERO CRM API-Dokumentation fehlt**: `TerminService.hero-sync()` und `KontaktService.hero-export()` können nicht vollständig designed werden. Interfaces sind als Platzhalter definiert — nach API-Key-Bereitstellung vervollständigen.

3. **Datanorm v5 Schema unbekannt**: `ArtikelService` und `Artikel`-Interface basieren auf typischem Datanorm-Aufbau. Tatsächliche Spalten der PostgreSQL-Tabelle müssen mit `\d`-Befehl im psql-Container geprüft werden. `code-specialist` muss bei der Implementierung das Schema zuerst abfragen.

4. **faster-whisper Ressourcenbedarf**: Strato-Server-Specs für GPU/CPU müssen vor Phase 1.3 (Diktat-Feature) geklärt werden. Ggf. `whisper small` als Kompromiss wenn keine GPU verfügbar.

5. **RAGflow Dataset-IDs**: `RAGFLOW_DATASET_ID` muss als Umgebungsvariable eingetragen werden — erst wenn RAGflow-Wissensdatenbank befüllt ist (Phase 2). ChatService ignoriert Wissen-Modul bis dahin.

6. **iOS-Push-Hinweis UI**: `NotificationService.checkIosInstallStatus()` muss erkennen ob PWA aus Safari heraus läuft (nicht installiert) und dann einen "Füge App zum Homescreen hinzu"-Banner zeigen. Implementation-Detail für `code-specialist`.

7. **Angebotsnummer-Generierung**: Server-seitig in Django (Format: `AN-YYYY-NNN`). Frontend nimmt vom Backend generierte Nummer entgegen — kein Frontend-seitiges Generieren.

8. **WeasyPrint Font-Pfade**: Django muss IBM Plex Sans WOFF2-Dateien unter `STATIC_ROOT/fonts/` ablegen. In Phase 3 vor PDF-Export-Implementierung sicherstellen dass `collectstatic` die Font-Dateien einschließt.
```
