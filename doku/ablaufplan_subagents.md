# MitraApp — Entwicklungs-Ablaufplan mit Subagents
**Stand: April 2026 | Vertraulich**

---

## Übersicht

Dieser Plan beschreibt die schrittweise Umsetzung der MitraApp unter Verwendung hochspezialisierter Subagents. Jeder Subagent übernimmt exakt den Teilbereich, für den er optimiert ist. Der Manager-Agent (Claude Code) koordiniert alle Subagents und hält den roten Faden.

---

## Subagent-Übersicht

| Subagent | Aufgabe | Wann einsetzen |
|---|---|---|
| `angular-agents:research-agent` | Webrecherche, Bibliotheken, Best Practices | Vor jeder neuen Technologieentscheidung |
| `angular-agents:angular-architect` | Architekturplanung, Module, Services, Interfaces | Vor der Implementierung jedes Moduls |
| `angular-agents:code-specialist` | HTML, SCSS, TypeScript implementieren | Nach dem Architektur-Bericht |
| `angular-agents:state-manager` | Signals / NgRx Signals / Service-State planen & bauen | Wenn State-Entscheidungen anfallen |
| `angular-agents:testing-agent` | Unit-, Integration-, E2E-Tests | Nach jeder Implementierung |
| `angular-agents:angular-debugger` | Fehleranalyse & Fixes | Bei Fehlermeldungen, ohne User-Kommunikation |

---

## Phase 0 — Projektvorbereitung

**Ziel:** Lauffähige Basis, Infrastruktur, Angular-Projektstruktur

### Schritt 0.1 — Projektinitialisierung
**Direkt (kein Subagent, Manager-Agent + manuell)**

```bash
ng new mitra-app --standalone --routing --style=scss
ng add @angular/pwa
```

Aufgaben:
- Verzeichnisstruktur anlegen (`core/`, `features/`, `shared/`)
- Design-Token einrichten (CSS Custom Properties: `#1C2128`, `#E8700A` usw.)
- IBM Plex Sans + Inter + JetBrains Mono einbinden
- `manifest.json` + Service Worker konfigurieren
- `environments/` für dev/prod anlegen (RAGflow-URL, API-Keys als Variablen)

**Output:** Git-Repo, lauffähige Angular-Shell, PWA-Grundkonfiguration

---

### Schritt 0.2 — Technologie-Recherche
**Subagent:** `angular-agents:research-agent` (parallel ausführbar)

Recherche-Aufträge:
- Beste Angular-Bibliothek für Offline-Storage (IndexedDB + Workbox)
- Web Push API Setup in Angular PWA (iOS 16.4+ Einschränkungen)
- Audio-Aufnahme + Transkription im Browser (MediaRecorder API)
- Claude CLI (`claude -p`): Structured Outputs für Notiz-Parsing via Shell-Aufruf aus Django
- RAGflow Python-Client vs. direkter HTTP-Aufruf aus Django
- WeasyPrint Integration in Django für PDF-Export
- Angular Service Worker Sync-Strategien (Background Sync API)

**Output:** Recherche-Bericht, Bibliotheksempfehlungen mit Begründung

---

### Schritt 0.3 — Gesamtarchitektur
**Subagent:** `angular-agents:angular-architect`

Auf Basis des Recherche-Berichts:
- Angular Feature-Module-Struktur definieren
- Shared-Services identifizieren (Auth, Sync, Notification)
- Offline-Strategie festlegen (IndexedDB-Schema, Sync-Queue)
- API-Layer-Design (HttpClient + Interceptors für JWT)
- Interfaces für alle Datenmodelle (Notiz, Kontakt, Angebot, Termin, Artikel)
- RAGflow-Service Interface
- Artikelstamm-Service Interface (über Django Backend — nicht direkt)

**Output:** Architektur-Bericht (Dateistruktur, Interfaces, Service-Plan)

---

## Phase 1 — MVP: Notizen + Termine + Dashboard

### Schritt 1.1 — State Management Setup
**Subagent:** `angular-agents:state-manager`

- Entscheidung: Angular Signals (bevorzugt, da <30 User, kein komplexer Shared-State nötig)
- `NotizStore` (Signal-basiert): Liste, aktive Notiz, Sync-Status
- `TerminStore`: Liste, heute/morgen
- `UIStore`: Online/Offline-Status, aktiver Tab, Ladeindikator

**Output:** Store-Dateien, fertig implementiert

---

### Schritt 1.2 — Auth-Modul
**Subagent:** `angular-agents:code-specialist`

Instruktionen (aus Architektur-Bericht):
- Login-Screen (Anthrazit, Orange CTA)
- JWT-Auth via Django Backend
- `AuthService` + `AuthGuard`
- Token-Refresh via Interceptor
- Logout + Token-Clearing

---

### Schritt 1.3 — Notizen-Modul (Kern-Feature)
**Subagent:** `angular-agents:angular-architect` → dann `angular-agents:code-specialist`

Architektur zuerst:
- Komponenten-Baum planen
- IndexedDB-Schema für Offline-Notizen
- Sync-Queue-Konzept

Implementierung:
- Notizliste (Status-Toggle: offen / in Bearbeitung / erledigt)
- Notiz-Detailseite (Freitext-Tab + KI-Text-Tab)
- Diktier-Funktion (MediaRecorder API → Claude Whisper/API-Transkription)
- KI-Strukturierung (Claude CLI → Structured Output: Produkt / Aufgabe / Termin / Notiz)
- Hersteller-Pillen (festcodiert: Sanitär: Grohe, Kaldewei, Geberit; Heizung: Viessmann, Buderus, Weishaupt)
- Offline-Speicherung (IndexedDB)
- Sync wenn Online (Background Sync)

**Besonderheit Claude CLI-Aufruf:**
```
POST /api/ki/strukturiere-notiz/
{
  "transkript": "...",
  "kategorie": "sanitaer"
}
→ Django KI-Service → PII-Filter → Claude CLI (`claude -p "..."`)
→ {items: [{typ: "produkt", text: "...", hersteller: "Kaldewei"}]}
```

---

### Schritt 1.4 — Tests: Notizen-Modul
**Subagent:** `angular-agents:testing-agent`

- Unit Tests: NotizStore (Signals), NotizService (HTTP + IndexedDB)
- Integration Tests: Offline → Online Sync-Flow
- E2E Tests: Diktat-Flow, Status-Toggle, Tab-Wechsel

---

### Schritt 1.5 — Termin-Modul
**Subagent:** `angular-agents:code-specialist`

- Kalender-Ansicht (Tag/Woche)
- Termin-Erstellung / Bearbeitung
- HERO CRM API Sync (Django Proxy-Endpoint)
- Push-Benachrichtigungen (Web Push API, Service Worker)
  - FCM-Token Registrierung
  - Django: Push-Nachricht via `pywebpush`

---

### Schritt 1.6 — Dashboard
**Subagent:** `angular-agents:code-specialist`

- Heutige/morgige Termine (aus TerminStore)
- Offene Aufgaben (aus NotizStore)
- Offline-Indikator (immer sichtbar)
- Wetter-Widget (Open-Meteo API, kein Key nötig)
- Bottom Navigation: [Dashboard] [Notizen] [Angebote] [Termine] [Wissen]

---

### Schritt 1.7 — Django Backend (Phase 1)
**Subagent:** `angular-agents:code-specialist` (Backend-Seite)

Django REST Framework Endpoints:
```
POST   /api/auth/login/
POST   /api/auth/refresh/
GET    /api/notizen/
POST   /api/notizen/
PUT    /api/notizen/{id}/
DELETE /api/notizen/{id}/
POST   /api/ki/strukturiere-notiz/     ← Claude CLI Aufruf (Docker)
GET    /api/termine/
POST   /api/termine/
POST   /api/push/subscribe/            ← Push-Token registrieren
```

**Claude CLI Integration im KI-Service:**

Claude CLI läuft im selben Docker-Netzwerk wie Django. Token wird vom Host durchgereicht.

```python
import subprocess, json

def claude_cli(prompt: str) -> str:
    """Ruft Claude CLI im Docker-Container auf. PII muss vorher zensiert sein."""
    result = subprocess.run(
        ["claude", "-p", prompt],
        capture_output=True, text=True, timeout=60
    )
    if result.returncode != 0:
        raise RuntimeError(f"Claude CLI Fehler: {result.stderr}")
    return result.stdout.strip()

def strukturiere_notiz(transkript: str, kategorie: str) -> dict:
    transkript_zensiert = zensiere_pii(transkript)   # PII-Filter vor CLI-Aufruf!
    prompt = f"Strukturiere diese SHK-Aufmaß-Notiz für Kategorie '{kategorie}' als JSON:\n{transkript_zensiert}"
    antwort = claude_cli(prompt)
    return json.loads(antwort)
```

```dockerfile
# docker-compose.yml — Claude CLI im Django-Container verfügbar
services:
  django:
    build: .
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}   # Token vom Host via .env
    volumes:
      - ~/.claude:/root/.claude:ro               # Auth-Token vom Host
```

---

### Schritt 1.8 — Deploy Phase 1
**Manager-Agent direkt:**
- Docker Compose auf Strato (Django + PostgreSQL + Nginx)
- WireGuard VPN Setup (Strato ↔ lokaler PC für Ollama)
- Angular PWA Build + Deploy

---

## Phase 2 — Visitenkarten + Wissensdatenbank

### Schritt 2.1 — Visitenkarten-Modul
**Subagent:** `angular-agents:angular-architect` → `angular-agents:code-specialist`

Architektur:
- Foto-Upload Flow (camera capture + file input)
- Claude CLI Vision Integration (über Django — Foto als Base64 an `claude -p`)
- IndexedDB für Kontakte
- `@google/model-viewer` als Web Component für GLB-Rendering

**Vorbereitung (vor Subagent-Start):**
```
Visitenkarte.glb verschieben:
  Von: w:\Dev\Privat\Pironi\Visitenkarte.glb
  Nach: mitra-app/src/assets/models/Visitenkarte.glb
```

**Setup `@google/model-viewer`:**
```bash
npm install @google/model-viewer
```

In `angular.json` → `assets` sicherstellen:
```json
{ "glob": "**/*", "input": "src/assets/models", "output": "/assets/models" }
```

In `app.config.ts` oder dem Feature-Modul als Custom Element registrieren:
```typescript
import '@google/model-viewer';
```

In `tsconfig.app.json`:
```json
"compilerOptions": {
  "skipLibCheck": true
}
```

Implementierung:

**3D-Visitenkarten-Viewer-Komponente** (`visitenkarte-viewer.component.html`):
```html
<model-viewer
  src="assets/models/Visitenkarte.glb"
  [attr.environment-image]="null"
  auto-rotate
  camera-controls
  shadow-intensity="1"
  style="width: 100%; height: 220px; background: #2D333B;">

  <!-- Visitenkarten-Foto als Textur-Overlay -->
  <img
    *ngIf="fotoUrl"
    slot="poster"
    [src]="fotoUrl"
    alt="Visitenkarte">
</model-viewer>
```

In `visitenkarte-viewer.component.ts`:
```typescript
import { Component, Input } from '@angular/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@Component({
  selector: 'app-visitenkarte-viewer',
  templateUrl: './visitenkarte-viewer.component.html',
  schemas: [CUSTOM_ELEMENTS_SCHEMA]   // ← notwendig für <model-viewer>
})
export class VisitkarteViewerComponent {
  @Input() fotoUrl: string | null = null;
}
```

- Formular: Firma, Ansprechpartner, Position, Mobil, Tel, Web, Mail, Adresse
- Zusatzfelder: Branche, Bewertung (5 Sterne), Zuverlässigkeit, Tags, Letzte Interaktion, Lieferant ja/nein
- Foto dauerhaft in DB speichern (Strato/Home-Server/Lokal — erlaubt), `fotoUrl` für 3D-Viewer laden
- Suche + Filter (Branche, Bewertung, Tags)

**Django Endpoint:**
```
POST /api/ki/visitenkarte-auslesen/
  multipart/form-data: {foto: <file>}
→ Claude CLI (Foto als Base64-Anhang via `--image`) → Felder extrahieren
→ {firma: "...", ap: "...", mobil: "..."}
```

---

### Schritt 2.2 — RAGflow Integration (Wissensdatenbank-Chat)
**Subagent:** `angular-agents:research-agent` → `angular-agents:code-specialist`

Research-Auftrag:
- Beste Strategie für Streaming-Responses in Angular (SSE via EventSource)
- RAGflow Session-Management: wann neue Session vs. bestehende

Django RAGflow-Service:
```python
import httpx

RAGFLOW_BASE = settings.RAGFLOW_URL  # http://strato-server:9380
RAGFLOW_KEY  = settings.RAGFLOW_API_KEY

async def chat_mit_ragflow(chat_id: str, session_id: str, frage: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{RAGFLOW_BASE}/api/v1/chats/{chat_id}/completions",
            headers={"Authorization": f"Bearer {RAGFLOW_KEY}"},
            json={"question": frage, "stream": True, "session_id": session_id},
            timeout=60.0
        )
        # Stream weiterleiten an Angular via SSE
        async for chunk in response.aiter_text():
            yield chunk
```

Angular Chat-Interface:
- Chat-Bubble-Design (Quelle anzeigen: "Gefunden in: Weishaupt WTC Seite 12")
- Neue Session pro Benutzer-Chat-Sitzung
- Chat-History in IndexedDB speichern
- RAGflow Dataset-IDs als Umgebungsvariable

**RAGflow Retrieval für Angebote (vorbereiten):**
```python
async def suche_aehnliche_angebote(frage: str, dataset_id: str):
    response = await client.post(
        f"{RAGFLOW_BASE}/api/v1/retrieval",
        headers={"Authorization": f"Bearer {RAGFLOW_KEY}"},
        json={
            "question": frage,
            "dataset_ids": [dataset_id],
            "top_k": 5,
            "similarity_threshold": 0.4,
            "highlight": True
        }
    )
    return response.json()["data"]["chunks"]
```

---

### Schritt 2.3 — Artikelstamm-Service (Django)
**Subagent:** `angular-agents:code-specialist`

PostgreSQL Verbindung:
```python
# settings.py
DATABASES = {
    "artikelstamm": {
        "ENGINE": "django.db.backends.postgresql",
        "HOST": "localhost",
        "PORT": 5433,
        "NAME": "artikelstamm",
        "USER": "artikelstamm",
        "PASSWORD": "artikelstamm2024",
    }
}
```

Datanorm v5 Datenbankstruktur erkunden:
```
docker exec -it artikelstamm_db psql -U artikelstamm -d artikelstamm
\dt   -- Tabellen anzeigen
\d artikelstamm_artikel  -- Schema prüfen
```

Endpoints:
```
GET /api/artikel/suche/?q=Kaldewei+Duschtasse&limit=10
GET /api/artikel/{artnr}/
```

Suchlogik: Volltextsuche auf `bezeichnung`, `artnr`, `hersteller`. Index auf `bezeichnung` und `artnr` anlegen.

---

### Schritt 2.4 — Tests Phase 2
**Subagent:** `angular-agents:testing-agent`

- Unit Tests: Visitenkarten-Service, RAGflow-Service (Mock-HTTP)
- Integration Tests: Chat-Flow mit RAGflow (echter Test-Endpoint)
- E2E Tests: Foto-Upload → Felder-Ausfüllung, Chat-Frage → Antwort mit Quelle

---

## Phase 3 — Angebotserstellung

**Dies ist die komplexeste Phase. Klarer Subagent-Ablauf:**

### Schritt 3.1 — Architektur Angebots-Engine
**Subagent:** `angular-agents:angular-architect`

Zu planen:
- Datenfluss: Notiz → Positionen extrahieren → Artikelstamm-Suche → RAGflow-Referenz → Claude Assembly → Angebots-Entwurf
- State: AngebotStore (Signals), Positions-Array, Edit-State
- Django Workflow-Endpoint (async, da mehrere API-Calls)

**Angebots-Pipeline (Django):**
```
POST /api/angebote/erstellen-aus-notiz/
{
  "notiz_id": "...",
  "kunde": {...}
}

Pipeline:
1. Notiz laden
2. Claude: Positionen aus Notiz extrahieren (Structured Output)
3. Für jede Position: Artikelstamm-Suche (PostgreSQL FTS)
4. RAGflow: Ähnliche Beispielangebote suchen
5. Claude: Angebots-Entwurf aus Positionen + Beispiele + Preisen
6. Angebot speichern (Entwurf)
→ Angebots-Objekt zurückgeben
```

---

### Schritt 3.2 — Claude CLI Artikelauswahl (mehrstufiger Prompt)
**Subagent:** `angular-agents:code-specialist`

Da Claude CLI (`claude -p`) kein natives Function Calling per JSON-Schema hat,
wird die Artikelauswahl als **zweistufiger CLI-Dialog** gelöst:

```python
def angebot_erstelle_positionen(notiz_text: str) -> list[dict]:
    notiz_zensiert = zensiere_pii(notiz_text)

    # Schritt 1: Claude extrahiert Suchbegriffe als JSON
    prompt_1 = f"""
    Extrahiere alle benötigten Materialien aus dieser SHK-Notiz als JSON-Liste.
    Format: [{{"suchbegriff": "...", "menge": 1, "einheit": "Stk"}}]
    Notiz: {notiz_zensiert}
    Antworte NUR mit dem JSON-Array.
    """
    suchbegriffe = json.loads(claude_cli(prompt_1))

    # Schritt 2: Für jeden Suchbegriff → Artikelstamm-Suche
    positionen_mit_artikeln = []
    for pos in suchbegriffe:
        artikel = artikelstamm_suche(pos["suchbegriff"])  # PostgreSQL FTS
        positionen_mit_artikeln.append({**pos, "artikel_vorschlaege": artikel[:3]})

    # Schritt 3: Claude wählt besten Artikel + erstellt Angebotstext
    prompt_2 = f"""
    Erstelle einen Angebots-Entwurf aus diesen Positionen und Artikelvorschlägen als JSON.
    Format: [{{"pos": 1, "artnr": "...", "bezeichnung": "...", "menge": 1, "preis": 0.0}}]
    Daten: {json.dumps(positionen_mit_artikeln, ensure_ascii=False)}
    Antworte NUR mit dem JSON-Array.
    """
    return json.loads(claude_cli(prompt_2))

---

### Schritt 3.3 — Angebots-Editor (Angular)
**Subagent:** `angular-agents:code-specialist`

- Positions-Liste mit Drag & Drop (`@angular/cdk/drag-drop`)
- Inline-Editing: Menge, Preis, Text
- Manueller Positions-Hinzufügen-Button
- Artikelstamm-Suche-Overlay
- Fördermittel-Hinweis (BEG/KfW) automatisch erkannt
- PDF-Vorschau Button → WeasyPrint → Download

---

### Schritt 3.4 — PDF-Export (Django/WeasyPrint)
**Subagent:** `angular-agents:code-specialist`

```python
from weasyprint import HTML

def erstelle_angebot_pdf(angebot: Angebot) -> bytes:
    html = render_to_string("angebot.html", {"angebot": angebot})
    return HTML(string=html).write_pdf()
```

HTML-Template: Mitra-Branding (Anthrazit/Orange), Firmenlogo-Platzhalter, gesetzliche Pflichtangaben

---

### Schritt 3.5 — Tests Phase 3
**Subagent:** `angular-agents:testing-agent`

- Unit Tests: Angebots-Pipeline, Artikelsuche, PDF-Generierung
- Integration Tests: Notiz → vollständiges Angebot (End-to-End Backend)
- E2E Tests: Angebot erstellen, bearbeiten, PDF exportieren

---

## Phase 4 — Erweiterungen

Geplant (keine detaillierte Subagent-Planung nötig jetzt):
- Angebot → Rechnung (nach Auftragserteilung)
- Plantafel für Kollegen (Gantt-ähnlich)
- Routen-Integration (Google Maps Deeplink)
- Lieferanten-Preisvergleich

---

## Subagent-Koordinationsregeln

```
Manager (Claude Code)
    │
    ├─► research-agent     (gibt Recherche-Bericht zurück)
    │         │
    ├─► angular-architect  (liest Recherche-Bericht, gibt Architektur-Bericht zurück)
    │         │
    ├─► state-manager      (liest Architektur-Bericht, implementiert Stores)
    │         │
    ├─► code-specialist    (liest Architektur-Bericht + Stores, implementiert Features)
    │         │
    ├─► testing-agent      (liest implementierten Code, schreibt Tests)
    │         │
    └─► angular-debugger   (bei Fehlern: liest Fehlermeldung + Code, fixt still)
```

**Wichtig:**
- `angular-architect` und `code-specialist` kommunizieren NICHT mit dem User — nur Berichte an Manager
- `angular-debugger` kommuniziert NICHT mit dem User — fixt direkt
- `research-agent` liefert immer Quellen und Begründungen
- Subagents werden per Phase sequenziell, innerhalb einer Phase wo möglich parallel gestartet

---

## DSGVO-Regel (verbindlich für alle Subagents & Services)

**Speicherung:** Alle Daten dürfen gespeichert werden — Strato-Server, Home-Server, lokaler PC. Keine Einschränkung.

**Die einzige Regel:** Personenbezogene Daten verlassen den Server **niemals unzensiert** in Richtung externer KI-APIs oder CLI.

```
Vor jedem Claude API/CLI-Aufruf, der Nutzerdaten enthält:
  1. PII-Filter (Django Middleware) läuft über den Text
  2. Namen, Adressen, Telefonnummern → durch Platzhalter ersetzen
     z.B. "Herr Müller, Hauptstr. 5" → "[KUNDE] [ADRESSE]"
  3. Erst danach → Claude API/CLI
  4. Antwort zurück → Platzhalter ggf. rücksubstituieren
```

**Gilt für:**
- Notiz-Strukturierung (Aufmaß kann Kundennamen enthalten)
- Visitenkarten-Auslese (Foto enthält Namen, Adressen)
- Angebots-KI (Kundendaten im Angebot)
- Wissensdatenbank-Chat (falls User Kundendaten eintippt)

**Gilt NICHT für:**
- Artikelstamm-Suche (nur Produktdaten)
- RAGflow Betriebsanleitungen (keine Kundendaten)
- Wetter-API, Open-Meteo (keine personenbezogenen Daten)

**Django PII-Filter Middleware (Grundstruktur):**
```python
import re

PII_PATTERNS = [
    (r'\b[A-ZÄÖÜ][a-zäöüß]+ [A-ZÄÖÜ][a-zäöüß]+\b', '[NAME]'),       # Vor- + Nachname
    (r'\b\d{5}\b', '[PLZ]'),                                            # Postleitzahl
    (r'\b[\w.-]+@[\w.-]+\.\w+\b', '[EMAIL]'),                          # E-Mail
    (r'\b(\+49|0)\d[\d\s\-/]{6,}\b', '[TELEFON]'),                    # Telefonnummer
    (r'\b\w+str(aße|\.)\s*\d+\b', '[STRASSE]'),                       # Straßenadresse
]

def zensiere_pii(text: str) -> str:
    for pattern, replacement in PII_PATTERNS:
        text = re.sub(pattern, replacement, text)
    return text
```

---

## Kritische Abhängigkeiten

| Abhängigkeit | Blockiert |
|---|---|
| RAGflow API-Key + URL | Phase 2 Wissensdatenbank-Chat |
| Datanorm-Dateien (manuell beschafft) | Phase 2 Artikelstamm-Service |
| Claude CLI Token (Host) | Phase 1 KI-Strukturierung, Phase 3 Angebotserstellung |
| HERO API-Key / Token | Phase 1 Termin-Sync |
| Strato Server-Zugang (SSH/Docker) | Phase 1 Deploy |

---

## Nächster Schritt

**Schritt 0.1 manuell anstoßen** — Angular-Projekt direkt anlegen:

```bash
ng new mitra-app --standalone --routing --style=scss
cd mitra-app
ng add @angular/pwa
```

Danach parallel starten:
- `angular-agents:research-agent` (alle Recherche-Aufträge aus Schritt 0.2)
- `angular-agents:angular-architect` (Gesamtarchitektur auf Basis der Planung)
- Infrastruktur manuell vorbereiten (Strato, RAGflow API-Key, HERO Token)
