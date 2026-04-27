---
type: subagent-memory
agent: research
modul: technologie-stack
created: 2026-04-26
status: completed
---

## Was wurde getan
Recherche zu 7 Technologie-Themen für den MitraApp-Stack: IndexedDB/Workbox, Web Push API, Audio/Transkription, Claude CLI Structured Outputs, RAGflow-Integration, WeasyPrint und Angular SW Sync-Strategien. Grundlage ist gesichertes Fachwissen (Stand: Mitte 2025), da WebFetch in dieser Umgebung nicht verfügbar war. Alle Empfehlungen basieren auf dem dokumentierten Wissensstand bis August 2025.

---

## Ergebnisse / Outputs

### 1. IndexedDB + Workbox in Angular 21

**Empfohlene Bibliothek: Dexie.js**

- **Dexie.js (v4.x)** ist die klare Empfehlung für typsicheres IndexedDB in Angular 21.
  - Vollständige TypeScript-Typisierung ab v3, in v4 weiter verbessert.
  - Reaktive Abfragen via `liveQuery()` — lassen sich direkt in Angular Signals wrappen (`toSignal(from(liveQuery(...)))`).
  - Transaktionen, Versionsmigration und Index-Definitionen sind deklarativ und typsicher.
  - Aktive Community, regelmäßige Releases.
  - Installationsbefehl: `npm install dexie`
  - Nutzung in Angular: als Injectable Service mit `extends Dexie`.

- **idb (Jake Archibald)**: Schlanke Low-Level-Wrapper-Library (~1 kB). Kein ORM, keine Queries, kein `liveQuery`. Geeignet nur wenn maximale Minimalität gewünscht ist und man alles selbst baut. Nicht empfohlen für MitraApp-Komplexität.

- **RxDB**: Feature-reich (Replikation, Conflict Resolution), aber deutlich schwerer und opinionated. Overkill für MitraApp, Lernkurve hoch.

**Empfehlung: Dexie.js v4 mit Angular Signals**
- `liveQuery()` → `from()` → `toSignal()`: reaktive, typsichere DB-Abfragen ohne BehaviorSubject-Boilerplate.
- Perfekt für Offline-Notizen, Artikelstamm-Cache und Sync-Queue.

**Workbox + Angular PWA:**
- Angular PWA (`@angular/pwa`) nutzt intern `ngsw` (Angular Service Worker), der auf einer JSON-Konfiguration basiert (`ngsw-config.json`).
- Workbox direkt (als eigene `service-worker.js`) bietet mehr Flexibilität, erfordert aber den Wechsel weg von `ngsw`.
- **Background Sync mit Workbox**: Modul `workbox-background-sync` stellt eine `BackgroundSyncPlugin`-Klasse bereit, die fehlgeschlagene Fetch-Requests in eine IndexedDB-Queue schreibt und beim nächsten Online-Event erneut sendet.
- Setup: Custom Service Worker mit `workbox-webpack-plugin` (oder Vite-Pendant) generieren. In Angular 21 mit Vite/esbuild: `vite-plugin-pwa` (Vite PWA Plugin) als Alternative zu `@angular/pwa` empfohlen — volle Workbox-Kontrolle.
- `vite-plugin-pwa` + `workbox-window` = empfohlene Kombination für Angular 21 (Vite-basiert) mit Custom Sync.

---

### 2. Web Push API in Angular PWA (2025)

**iOS-Einschränkungen:**
- iOS 16.4+: Web Push in PWAs (nur wenn als Home Screen App installiert) wird unterstützt — aber nur über Safari/WebKit-Engine.
- iOS 17 / 18: Unterstützung stabil, aber mit Einschränkungen:
  - Push funktioniert **nur wenn die PWA installiert ist** (Add to Home Screen). Im Browser-Tab kein Push auf iOS.
  - Kein Background Fetch, kein stilles Push — iOS weckt den SW nur bei sichtbarer Notification.
  - Permission-Dialog erscheint nur nach expliziter Nutzerinteraktion (Button-Klick).
  - Kein Support für `pushManager.subscribe()` ohne vorherige Nutzerinteraktion.
- **Fazit iOS**: Push ist nutzbar, aber mit obigen Einschränkungen. Für SHK-Monteure (Android-Geräte wahrscheinlich dominierend) kein Showstopper.

**VAPID Keys + pywebpush:**
- VAPID (Voluntary Application Server Identification) ist der Standard für Web Push ohne Firebase.
- pywebpush (Python) ist die Django-seitige Implementierung: gut gepflegt, unterstützt VAPID vollständig.
- Key-Generierung: `py-vapid` oder `pywebpush` CLI.
- Flow: Frontend abonniert (`pushManager.subscribe()` mit `applicationServerKey`), sendet Subscription-Objekt an Django-Backend, Backend speichert und versendet Push-Nachrichten via pywebpush.

**Permission-Flow Best Practice:**
1. Nicht sofort beim App-Start nach Erlaubnis fragen.
2. Kontextueller Trigger (z.B. nach erfolgreich gespeichertem Auftrag): "Möchten Sie Benachrichtigungen erhalten?"
3. Eigenen In-App-Dialog zeigen, bevor Browser-Dialog erscheint (Pre-Permission-Dialog).
4. Wenn abgelehnt: nicht erneut nerven, Einstellung in App-Settings zugänglich machen.

**FCM vs. reines Web Push:**
- **Reines Web Push (VAPID)** empfohlen für MitraApp:
  - Kein Google-Account/Firebase-Projekt nötig.
  - Funktioniert auf Chrome, Firefox, Edge, Opera, Safari (iOS 16.4+/macOS).
  - Vollständige Kontrolle, datenschutzfreundlicher (kein Google-Routing).
  - pywebpush unterstützt reines VAPID nativ.
- FCM: nur sinnvoll wenn bereits Firebase im Stack ist oder Android-App parallel gebaut wird.

---

### 3. Audio-Aufnahme + Transkription im Browser

**MediaRecorder API (2025):**
- Breit unterstützt: Chrome, Firefox, Edge, Opera — vollständig. Safari (iOS/macOS): seit iOS 14.5 / Safari 14.1, aber mit Einschränkungen bei MIME-Types.
- **Beste MIME-Types 2025**:
  - `audio/webm;codecs=opus` — beste Qualität/Größe, Chrome/Firefox/Edge. Safari unterstützt dies NICHT.
  - `audio/mp4;codecs=mp4a.40.2` (AAC) — Safari-kompatibel.
  - Fallback-Strategie: `MediaRecorder.isTypeSupported()` prüfen, dann passendes Format wählen.
  - Empfohlene Reihenfolge: `audio/webm;codecs=opus` → `audio/ogg;codecs=opus` → `audio/mp4`.
- Chunk-Streaming: `ondataavailable` mit `timeslice` (z.B. 1000ms) für kontinuierliche Chunks.

**Transkriptions-Strategie:**
- **Web Speech API (Browser-nativ)**:
  - Nur Chrome/Edge (Chromium) unterstützen sie zuverlässig. Firefox und Safari: keine oder experimentelle Unterstützung.
  - Keine Kontrolle über das Sprachmodell, Online-Abhängigkeit (sendet Audio an Google-Server).
  - Für SHK-Fachbegriffe: unzuverlässig, da Domänenvokabular fehlt (z.B. "Grundfos-Pumpe", "Thermostatventil", "Siphon").
  - **Nicht empfohlen** für MitraApp.

- **Backend-Transkription via Whisper (Django)**:
  - OpenAI Whisper (open source, lokal auf eigenem Server) oder `faster-whisper` (optimierte C++-Version, deutlich schneller).
  - Whisper Large v3 oder `faster-whisper large-v3`: beste Erkennungsrate für Deutsch und Fachbegriffe.
  - Workflow: Audio-Blob → Base64 oder Multipart-Upload → Django-Endpoint → Whisper → Text zurück.
  - **Fachbegriff-Boost**: Whisper unterstützt `initial_prompt` Parameter — ein paar domänenspezifische Begriffe als Kontext mitgeben verbessert Erkennung von SHK-Vokabular erheblich.
  - **Empfohlen für MitraApp**: zuverlässiger, datenschutzkonform (Daten verlassen nicht den Server), offline-fähig wenn Whisper lokal läuft.

**Empfehlung**: MediaRecorder mit `audio/webm;codecs=opus` (Fallback auf `audio/mp4`), Backend-Transkription via `faster-whisper` auf dem Strato-Server, `initial_prompt` mit SHK-Begriffen.

---

### 4. Claude CLI (`claude -p`) Structured Outputs aus Django

**JSON-Output-Zuverlässigkeit:**
- `claude -p "<prompt>"` gibt Markdown-formatierten Text zurück — kein natives `--output-format json` Flag in der Claude CLI (Stand 2025).
- JSON-Extraktion aus Claude-CLI-Output ist möglich aber fehleranfällig: Claude kann JSON in Markdown-Codeblöcken zurückgeben (```json ... ```), die geparst werden müssen.
- Zuverlässigkeit: Mit explizitem Prompt-Instruktion ("Antworte ausschließlich mit validem JSON, kein Markdown, keine Erklärungen") und `--output-format json` (falls verfügbar in neueren Versionen) ist JSON-Output gut erreichbar — aber nicht 100% garantiert.
- **Empfohlene Fehlerbehandlung**:
  1. Response auf JSON-Codeblock prüfen (Regex: ` ```json\n(.*?)\n``` `, re.DOTALL).
  2. `json.loads()` in try/except.
  3. Bei Fehler: Retry mit verstärktem Prompt oder Fallback auf Plain-Text.
  4. Pydantic-Modell zur Validierung des geparsten JSON.

**Anthropic Python SDK (direkt) vs. Claude CLI:**

| Kriterium | Claude CLI (`claude -p`) | Anthropic Python SDK |
|---|---|---|
| Setup-Aufwand | Minimal (Docker-Container mit claude) | `pip install anthropic` |
| Structured Outputs | Nur via Prompt-Engineering | Via `tool_use` (JSON Schema) → zuverlässig |
| Streaming | Begrenzt | Native SSE-Streaming |
| Fehlerbehandlung | Nur Exit-Code + stdout parsen | Vollständige Exception-Hierarchie |
| Token-Limits/Kosten | Schwerer nachzuvollziehen | Volle Kontrolle, Usage-Tracking |
| Async | Nicht nativ | `AsyncAnthropic` Client |
| **Empfehlung** | Einfache Text-Tasks | Structured Outputs, Produktionseinsatz |

**Wichtigste Erkenntnis**: Für zuverlässige Structured Outputs aus Django empfiehlt sich der **Anthropic Python SDK** mit `tool_use`-Modus (Function Calling / Tool Use). Dabei wird das gewünschte JSON-Schema als Tool definiert, Claude gibt garantiert strukturierte Daten zurück. Claude CLI ist weiterhin gut für einfache Text-Generierungsaufgaben (z.B. Notiz-Zusammenfassungen).

---

### 5. RAGflow Python-Integration

**Offizieller Python-Client:**
- RAGflow stellt seit v0.7+ ein offizielles Python-SDK bereit: `ragflow-sdk` (PyPI).
- Installationsbefehl: `pip install ragflow-sdk`
- Bietet: Dataset-Management, Document-Upload, Chat-Session-API, Retrieval-Abfragen.
- Authentifizierung via API-Key (im RAGflow-Dashboard generiert).
- Dokumentation: `https://ragflow.io/docs/dev/python_api_reference`

**HTTP-API Streaming via SSE in Django DRF:**
- RAGflow Chat-API unterstützt SSE (Server-Sent Events) Streaming für Antworten.
- Django DRF: `StreamingHttpResponse` mit `content_type='text/event-stream'`.
- Implementierung:
  ```python
  from django.http import StreamingHttpResponse
  import requests

  def stream_ragflow(request):
      def event_stream():
          with requests.get(ragflow_url, stream=True, headers=headers) as r:
              for line in r.iter_lines():
                  if line:
                      yield f"data: {line.decode()}\n\n"
      return StreamingHttpResponse(event_stream(), content_type='text/event-stream')
  ```
- Wichtig: `X-Accel-Buffering: no` Header für Nginx, damit Buffering deaktiviert wird.
- WSGI (Gunicorn) kann mit Streaming problematisch sein — **ASGI (uvicorn/daphne) empfohlen** für Streaming-Endpoints.

**Session-Management:**
- Neue Session erstellen: Bei erstem Kontakt eines Nutzers mit einem Knowledge-Base-Thema.
- Session weiterverwenden: Für zusammenhängende Konversationen (z.B. ein Auftrag, ein Monteur-Dialog).
- Session-ID im Frontend (z.B. per Auftrag-ID oder Nutzer+Kontext-Kombination) speichern und mitschicken.
- Session-Timeout: RAGflow Sessions verfallen nach Inaktivität — im Backend prüfen und ggf. neu erstellen.
- **Strategie**: Session-ID in Django-Session oder JWT-Payload speichern, pro Auftrag eine eigene RAGflow-Session.

---

### 6. WeasyPrint in Django (2025)

**Aktuelle Version & Python 3.12+ Kompatibilität:**
- WeasyPrint v61+ (aktuell ca. v62, Stand Mitte 2025) unterstützt Python 3.12 vollständig.
- Abhängigkeiten: Pango, Cairo, GDK-Pixbuf — auf Linux (Strato-Server) problemlos via `apt install`.
- `pip install weasyprint` — aktiv gepflegt, regelmäßige Releases.
- Django-Integration: `weasyprint.HTML(string=rendered_html).write_pdf()` → bytes → `HttpResponse` mit `content_type='application/pdf'`.

**Google Fonts / IBM Plex Sans:**
- WeasyPrint lädt externe Fonts (Google Fonts CDN) im Standard-Setup **nicht** — es gibt keinen Browser-Rendering-Kontext.
- **Lösung**: Fonts lokal einbetten via `@font-face` mit lokalem Pfad, oder Font-Dateien als Base64 in CSS.
- IBM Plex Sans: Open Source (SIL OFL), direkt von IBM GitHub oder Google Fonts herunterladbar und lokal speicherbar.
- Empfehlung: Font-Dateien in `static/fonts/` ablegen, in CSS mit `@font-face { src: url('/path/to/IBMPlexSans.woff2'); }` referenzieren.
- WeasyPrint v61+ unterstützt WOFF2 direkt.

**Alternative: Playwright für HTML→PDF:**

| Kriterium | WeasyPrint | Playwright |
|---|---|---|
| Rendering-Engine | Pango/Cairo (kein Browser) | Chromium (echter Browser) |
| CSS-Support | ~90% (Flexbox, Grid eingeschränkt) | ~100% (vollständig) |
| JavaScript | Kein JS-Support | Vollständiger JS-Support |
| Performance | Sehr schnell (~100ms) | Langsamer (Browser-Start ~500ms) |
| Ressourcen | Leichtgewichtig | Chromium-Overhead (~300MB RAM) |
| Google Fonts | Manuell lösen | Automatisch geladen |
| Deployment | Einfach (pip) | Komplex (Chromium-Binary) |

**Empfehlung**: WeasyPrint für MitraApp — PDFs (Angebote, Auftragsbestätigungen) nutzen kein komplexes JS. IBM Plex Sans lokal einbetten. Playwright nur wenn komplexe CSS-Layouts oder Charts in PDFs nötig werden.

---

### 7. Angular Service Worker Sync-Strategien

**Background Sync API — Browser-Support 2025:**
- **Chrome/Edge/Opera (Chromium)**: Vollständig unterstützt — seit 2016.
- **Firefox**: Ab Firefox 124+ (Anfang 2024) verfügbar, aber als experimentell markiert.
- **Safari/iOS**: **Nicht unterstützt** (Stand Mitte 2025). Apple hat Background Sync explizit nicht implementiert. Kein Roadmap-Eintrag bekannt.
- **Fazit**: Background Sync ist auf iOS schlicht nicht verfügbar. Für SHK-Monteure mit möglicherweise iOS-Geräten: Fallback notwendig.

**Beste Strategie für Offline-Notizen → Online-Sync (Queue-basiert):**

Empfohlene Hybrid-Strategie (funktioniert auch ohne Background Sync API):

1. **Schreiben in IndexedDB (Dexie.js)**: Jede Offline-Notiz/Aktion wird in eine Sync-Queue-Tabelle geschrieben (`status: 'pending'`).
2. **Online-Event Listener**: `navigator.onLine` + `window.addEventListener('online', ...)` — beim Reconnect Sync auslösen.
3. **Background Sync (wo verfügbar)**: Zusätzlich `navigator.serviceWorker.ready.then(sw => sw.sync.register('sync-notes'))` registrieren. SW verarbeitet Queue im Hintergrund.
4. **App-Foreground-Sync**: Beim App-Start und bei Sichtbarkeit (`visibilitychange`) Sync-Queue prüfen und auflösen.
5. **Conflict Resolution**: Server-Timestamp gewinnt (Last-Write-Wins), oder Merge-Strategie per Feld.

Dieser Ansatz ist plattformübergreifend robust — iOS-Geräte nutzen Online-Event + Foreground-Sync, Android nutzt zusätzlich Background Sync.

**ngsw (Angular SW) vs. Workbox direkt:**

| Kriterium | ngsw (Angular SW) | Workbox direkt |
|---|---|---|
| Konfiguration | JSON-basiert (`ngsw-config.json`) | Programmierbar (JS) |
| Background Sync | Nicht eingebaut | `workbox-background-sync` Plugin |
| Custom Fetch-Strategien | Begrenzt | Vollständig flexibel |
| Cache-Strategien | Vordefiniert (CacheFirst etc.) | Frei kombinierbar |
| Angular-Integration | Nahtlos (`@angular/pwa`) | Manuelle Integration |
| Vite/esbuild Support | Gut (Angular 17+) | Via `vite-plugin-pwa` |

**Empfehlung**: Für MitraApp **Workbox direkt via `vite-plugin-pwa`** — wegen notwendigem Background Sync und Custom Sync-Queue. ngsw reicht nicht aus für die Offline-Anforderungen (Queue-basierter Sync, Custom Retry-Logik).

---

## Wichtige Entscheidungen

1. **Dexie.js v4** als IndexedDB-Bibliothek — typsicher, reaktiv via `liveQuery()`, Angular-Signals-kompatibel. Klarer Gewinner gegenüber `idb` (zu low-level) und RxDB (zu schwer).

2. **vite-plugin-pwa + Workbox direkt** statt `@angular/pwa` + ngsw — notwendig für Background Sync Plugin und Custom Sync-Queue. Angular 21 ist Vite-basiert, daher passt `vite-plugin-pwa` besser.

3. **Web Push mit reinem VAPID + pywebpush** — kein FCM benötigt. iOS-Einschränkungen dokumentieren und akzeptieren (SHK-Monteure wahrscheinlich Android-dominiert). Pre-Permission-Dialog implementieren.

4. **Whisper (faster-whisper) Backend-Transkription** — Browser Web Speech API nicht geeignet für SHK-Fachvokabular und hat unzureichende Browser-Coverage. `initial_prompt` mit Fachbegriffen verbessert Whisper-Erkennung erheblich.

5. **Anthropic Python SDK (direkt) für Structured Outputs** — `tool_use` Modus gibt garantiert JSON zurück. Claude CLI (`claude -p`) weiterhin für einfache Text-Tasks. Kein nativer `--output-format json` Flag in Claude CLI.

6. **RAGflow: ASGI (uvicorn) für SSE-Streaming** — Gunicorn/WSGI ist für Streaming-Responses problematisch. Session pro Auftrag empfohlen.

7. **WeasyPrint v61+ mit lokal eingebetteten IBM Plex Sans WOFF2-Dateien** — Google Fonts CDN funktioniert nicht in WeasyPrint. Playwright nur wenn nötig (zu ressourcenintensiv für einfache PDFs).

8. **Offline-Sync: Hybrid-Strategie** (IndexedDB Queue + Online-Event + Background Sync wo verfügbar) — iOS unterstützt Background Sync nicht, daher Fallback auf Online-Event + Foreground-Sync unverzichtbar.

---

## Übergabe-Hinweise

Was der `angular-architect`-Agent wissen muss:

- **Angular 21 ist Vite/esbuild-basiert** — `@angular/pwa` (`ngsw`) durch `vite-plugin-pwa` ersetzen oder ergänzen. Architektur muss Custom Service Worker einplanen.
- **Dexie.js als DB-Layer** — DB-Klasse als Injectable Angular Service, Tabellen für: Notizen, Sync-Queue, Artikelstamm-Cache, Push-Subscriptions.
- **Zwei HTTP-Client-Modi in Django nötig**: Standard REST (HttpClient) + SSE-Streaming (EventSource oder fetch-basiert) für RAGflow-Streaming.
- **Anthropic Python SDK** muss in Django-Dependencies, nicht nur Claude CLI. Beide können koexistieren.
- **faster-whisper** muss als Django-Dependency oder als separater Microservice eingeplant werden (Modell-Loading dauert, daher Warm-Keep empfohlen).
- **Audio-Upload-Endpoint** in Django: Multipart-Form-Data, max. Dateigröße konfigurieren (Sprachnotizen können 5-10 MB sein).
- **ASGI Django** (via `uvicorn` oder `daphne`) ist für SSE-Streaming-Endpoints Pflicht. Gunicorn reicht für Standard-Endpoints, ASGI für RAGflow-Proxy-Endpoints.
- **Font-Dateien** (IBM Plex Sans WOFF2) müssen in Django Static Files eingebunden werden, erreichbar für WeasyPrint.
- **iOS Push**: In der Architektur dokumentieren, dass Push nur bei installierten PWAs (Home Screen) funktioniert. UI-Hinweis für Nutzer einplanen.

---

## Offene Punkte

- **RAGflow SDK Versionsstabilität**: Das `ragflow-sdk` PyPI-Paket war in früheren Versionen wenig gepflegt. Vor Einsatz aktuelle Version prüfen (`pip install ragflow-sdk` und Changelog sichten). Alternativ: Direkter HTTP-API-Aufruf via `httpx`/`requests` als Fallback.
- **faster-whisper Ressourcenbedarf auf Strato-Server**: Whisper Large v3 benötigt ~4-8 GB VRAM (GPU) oder läuft auf CPU erheblich langsamer. Strato-Server-Specs prüfen — ggf. `whisper small` oder `medium` als Kompromiss.
- **Claude CLI Version**: Ob `--output-format json` in neueren Claude CLI Versionen (nach August 2025) verfügbar ist, war zum Recherchezeitpunkt nicht verifizierbar. Vor Implementierung prüfen: `claude --help`.
- **vite-plugin-pwa + Angular 21 Kompatibilität**: Angular 21 ist sehr aktuell. Kompatibilität mit `vite-plugin-pwa` in der neuesten Version vor Einsatz verifizieren (Changelog/Issues auf GitHub).
- **Background Sync + iOS**: Apple hat keinen öffentlichen Zeitplan für Background Sync veröffentlicht. Situation bleibt 2026 vermutlich unverändert — Hybrid-Fallback bleibt notwendig.
- **WeasyPrint auf Windows (Entwicklung)**: WeasyPrint-Abhängigkeiten (GTK/Pango) sind auf Windows schwierig zu installieren. Empfehlung: WeasyPrint-Tests in Docker-Container ausführen, lokal nur für Prod-Deploy relevant.
